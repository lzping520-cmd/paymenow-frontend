// POST /api/analyze
// 调自建领迈 Qwen 大模型
import https from 'https'

const AI_CONFIG = {
  PROVIDER: process.env.AI_PROVIDER || 'qwen',
  API_KEY: process.env.AI_API_KEY || 'sk-H7qUOJphCT8NYUxy894uCW2yXQ49C6XMmJ8pQ1rGBfM',
  ENDPOINT: process.env.AI_ENDPOINT || 'http://43.136.83.81:10088/v1/chat/completions',
  MODEL: process.env.AI_TEXT_MODEL || 'qwen-max',
  TIMEOUT: parseInt(process.env.AI_TIMEOUT) || 60000
}

// 简单的 HTTP 请求封装（不用 axios，Serverless 里省依赖）
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const { method = 'GET', headers = {}, body, timeout = 60000 } = options
    const parsed = new URL(url)
    
    const req = https.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.API_KEY}`,
        ...headers
      },
      timeout
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, data }) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('AI timeout')) })
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body))
    req.end()
  })
}

// 赔偿计算（本地规则引擎）
function calcCompensation({ hireDate, endDate, monthlySalary, reason }) {
  const start = new Date(hireDate)
  const end = new Date(endDate || Date.now())
  const months = (end - start) / (1000 * 60 * 60 * 24 * 30)
  const fullMonths = Math.floor(months)
  const partialMonths = Math.round((months - fullMonths) * 12) / 12
  const tenureYears = Math.floor(months / 12)
  const tenureMonths = Math.floor(months % 12)

  // N = 工龄月数（满一年+1，不满半年+0.5）
  let n = 0
  if (fullMonths >= 60) {
    // 满 5 年按旧版，N = 工龄月数
    n = fullMonths
  } else {
    n = fullMonths
  }
  const severance = Math.round(n * monthlySalary)
  
  // 违法解除 = 2N
  const illegalTermination = Math.round(2 * severance)
  
  // 代通知金 N+1
  const notice = Math.round(monthlySalary)
  
  return {
    tenure: { years: tenureYears, months: tenureMonths, totalMonths: fullMonths },
    n,
    severance,
    illegalTermination,
    notice,
    estimatedTotal: illegalTermination + notice
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 1, msg: 'Method not allowed' })
  
  const locale = req.headers['x-locale'] || 'en'
  const country = (req.body?.country || 'US').toUpperCase()
  
  try {
    const { companyName, hireDate, endDate, monthlySalary, description = '', userAge, jobTitle } = req.body
    
    // 先用本地规则计算赔偿（快速返回）
    const compensation = calcCompensation({ hireDate, endDate, monthlySalary, reason: description })
    
    // 调 AI 做深度分析
    const countryGuide = {
      US: 'At-will employment. Check state labor laws (CA WARN Act, NY Labor Law).',
      GB: 'Employment Rights Act 1996. Fair dismissal only with 2+ years service.',
      DE: 'Kündigungsschutzgesetz (Dismissal Protection Act). Minimum notice periods.',
      FR: 'Code du Travail. Licenciement abusif compensation.',
      ES: 'Estatuto de los Trabajadores. Despido improcedente = 33 days/year.',
      IT: 'Statuto dei Lavoratori. Tutela reale for companies >15 employees.',
      CN: '劳动合同法. 违法解除 = 2N, 经济补偿 = N+1.',
    }
    
    const aiPrompt = `You are an expert employment lawyer analyzing this case for ${country}.
Respond STRICTLY as JSON (no markdown, no explanation text outside JSON):

{
  "winRate": number (0-100, realistic assessment),
  "violations": [{ "code": string, "desc": string, "severity": "high|medium|low" }],
  "strengths": [string],
  "weaknesses": [string],
  "advice": string,
  "citations": [{ "law": string, "article": string, "summary": string }],
  "nextSteps": [string]
}

Case details:
- Country: ${country}
- Company: ${companyName}
- Position: ${jobTitle || 'N/A'}
- Hire date: ${hireDate}, End date: ${endDate || 'ongoing'}
- Monthly salary: ${monthlySalary}
- Age: ${userAge || 'N/A'}
- User's description: "${description.slice(0, 500)}"

Context for ${country}: ${countryGuide[country] || 'General employment law applies.'}`

    let aiResult = null
    try {
      const { data } = await httpRequest(AI_CONFIG.ENDPOINT, {
        method: 'POST',
        body: {
          model: AI_CONFIG.MODEL,
          messages: [
            { role: 'system', content: `You are an expert employment lawyer. Country: ${country}. Language: ${locale}. Respond ONLY with valid JSON.` },
            { role: 'user', content: aiPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        }
      })
      const raw = data?.choices?.[0]?.message?.content || ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch (aiErr) {
      console.error('AI call failed:', aiErr.message)
    }

    // AI 失败用规则引擎兜底
    const winRate = aiResult?.winRate ?? (
      /不赔偿|不给钱|无理由|开除|illegal|unfair/i.test(description) ? 75 : 55
    )
    const violations = aiResult?.violations || [
      { code: 'ILLEGAL_TERMINATION', desc: 'Dismissal without lawful grounds', severity: 'high' },
      { code: 'NO_SEVERANCE', desc: 'No severance compensation paid', severity: 'high' }
    ]

    res.json({
      code: 0,
      data: {
        winRate,
        confidence: aiResult ? 'AI-powered' : 'rule-based',
        compensation,
        tenure: compensation.tenure,
        violations,
        strengths: aiResult?.strengths || ['Has employment relationship evidence'],
        weaknesses: aiResult?.weaknesses || [],
        advice: aiResult?.advice || 'Consult a local employment lawyer for personalized advice.',
        citations: aiResult?.citations || [],
        nextSteps: aiResult?.nextSteps || [
          'Gather evidence (contract, payslips, communications)',
          'File complaint within statute of limitations',
          'Consider mediation before litigation'
        ],
        locale,
        country
      }
    })
  } catch (err) {
    console.error('/api/analyze error:', err)
    res.status(500).json({ code: 1, msg: err.message || 'Internal error' })
  }
}
