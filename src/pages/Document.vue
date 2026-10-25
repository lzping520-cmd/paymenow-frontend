<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <h1 class="section-title text-3xl text-center mb-4">{{ pageTitle }}</h1>
    <p class="text-center text-gray-500 mb-8">{{ pageSub }}</p>

    <div class="grid md:grid-cols-3 gap-5">
      <div v-for="doc in docs" :key="doc.type" class="card flex flex-col items-center text-center gap-3 hover:shadow-lg transition cursor-pointer" @click="download(doc.type)">
        <div class="text-4xl">{{ doc.icon }}</div>
        <div class="font-bold text-gray-800">{{ doc.title }}</div>
        <div class="text-xs text-gray-500 min-h-[32px]">{{ doc.desc }}</div>
        <button class="btn-primary text-sm py-2 px-5 mt-auto w-full" :disabled="loading === doc.type">
          {{ loading === doc.type ? 'Generating...' : doc.btn }}
        </button>
      </div>
    </div>

    <div class="mt-8 flex justify-center gap-4">
      <button class="btn-secondary" @click="$router.push('/result')">← {{ t('document.backToResult') }}</button>
      <a href="mailto:5546638@qq.com" class="btn-secondary">Email Support</a>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCaseStore } from '../stores/case'
import { jsPDF } from 'jspdf'

const { t } = useI18n()
const router = useRouter()
const store = useCaseStore()
const analysis = computed(() => store.analysis || {})
const loading = ref(null)
const country = computed(() => (analysis.value.country || 'US').toUpperCase())
const loc = computed(() => analysis.value.locale || 'en')

// 20国数据
const C = {
  US: { name: 'United States', law: 'At-Will Employment', tribunal: 'State Labor Department', limit: '2-3 years', agencies: ['EEOC', 'State Labor Commissioner', 'DOL'], cite: [{law:'Fair Labor Standards Act',article:'29 U.S.C. 201',summary:'Minimum wage & overtime'},{law:'Title VII of Civil Rights Act',article:'42 U.S.C. 2000e',summary:'Discrimination protection'}] },
  GB: { name: 'United Kingdom', law: 'Employment Rights Act 1996', tribunal: 'Employment Tribunal', limit: '3 months (ACAS first)', agencies: ['ACAS', 'Employment Tribunal'], cite: [{law:'Employment Rights Act 1996',article:'s.94',summary:'Right not to be unfairly dismissed (2+ yrs)'},{law:'Equality Act 2010',article:'s.39',summary:'Anti-discrimination'}] },
  DE: { name: 'Germany', law: 'Kündigungsschutzgesetz', tribunal: 'Arbeitsgericht', limit: '3 weeks', agencies: ['Arbeitsgericht', 'Arbeitsamt'], cite: [{law:'Kündigungsschutzgesetz',article:'Para. 1',summary:'Dismissal protection (6+ mo, >10 employees)'},{law:'Arbeitszeitgesetz',article:'Para. 3',summary:'8-hour day limit'}] },
  FR: { name: 'France', law: 'Code du Travail', tribunal: "Conseil de Prud'hommes", limit: '5 years', agencies: ["Conseil de Prud'hommes", 'Inspection du Travail'], cite: [{law:'Code du Travail',article:'Art. L1234-9',summary:'Severance (1/4 month per year)'}] },
  ES: { name: 'Spain', law: 'Estatuto de los Trabajadores', tribunal: 'Juzgado de lo Social', limit: '20 working days', agencies: ['Juzgado de lo Social', 'Inspeccion de Trabajo'], cite: [{law:'Estatuto de los Trabajadores',article:'Art. 56',summary:'Dismissal comp 33 days/year'}] },
  IT: { name: 'Italy', law: 'Statuto dei Lavoratori (L.300/1970)', tribunal: 'Tribunale del Lavoro', limit: '2 years', agencies: ['Tribunale del Lavoro', 'INPS'], cite: [{law:'Statuto dei Lavoratori',article:'Art. 18',summary:'Reinstatement right (companies >15)'}] },
  CA: { name: 'Canada', law: 'Provincial Labor Codes', tribunal: 'Provincial Labor Board', limit: '6 mo - 2 yrs', agencies: ['Employment Standards', 'CHRC'], cite: [{law:'Canada Labour Code',article:'Part III',summary:'Federal min standards'}] },
  AU: { name: 'Australia', law: 'Fair Work Act 2009', tribunal: 'Fair Work Commission', limit: '21 days', agencies: ['Fair Work Commission', 'FWO'], cite: [{law:'Fair Work Act 2009',article:'s.382',summary:'Unfair dismissal (6+ mo)'}] },
  NZ: { name: 'New Zealand', law: 'Employment Relations Act 2000', tribunal: 'Employment Relations Authority', limit: '90 days', agencies: ['ERA', 'MBIE'], cite: [{law:'ERA 2000',article:'s.103A',summary:'Personal grievance'}] },
  CN: { name: 'China', law: '劳动合同法 Labor Contract Law', tribunal: '劳动人事争议仲裁委员会', limit: '1 year', agencies: ['劳动人事争议仲裁委员会', '人力资源和社会保障局', '劳动监察大队'], cite: [{law:'劳动合同法',article:'第47条',summary:'经济补偿 N (每满一年一个月工资)'},{law:'劳动合同法',article:'第87条',summary:'违法解除赔偿 2N'},{law:'劳动争议调解仲裁法',article:'第27条',summary:'仲裁时效 1 年'}] },
  SG: { name: 'Singapore', law: 'Employment Act', tribunal: 'Employment Claims Tribunal', limit: '1 year', agencies: ['ECT', 'MOM'], cite: [{law:'Employment Act',article:'s.20',summary:'Termination & notice'}] },
  JP: { name: 'Japan', law: 'Labor Contract Act 労働契約法', tribunal: '労働委員会', limit: '5 years', agencies: ['労働委員会', 'MHLW'], cite: [{law:'労働契約法',article:'第16条',summary:'Abusive dismissal prohibited'}] },
  KR: { name: 'South Korea', law: 'Labor Standards Act 근로기준법', tribunal: '노동위원회', limit: '3 years', agencies: ['노동위원회', 'MOEL'], cite: [{law:'근로기준법',article:'제27조',summary:'Dismissal restrictions'}] },
  IN: { name: 'India', law: 'Industrial Disputes Act 1947', tribunal: 'Labour Court', limit: '3 years', agencies: ['Labour Commissioner', 'Industrial Tribunal'], cite: [{law:'IDA 1947',article:'s.25F',summary:'Prior permission (100+ employees)'}] },
  MX: { name: 'Mexico', law: 'Ley Federal del Trabajo', tribunal: 'Junta Local de Conciliacion', limit: '2 months', agencies: ['Junta Local', 'STPS'], cite: [{law:'LFT',article:'Art. 47',summary:'Dismissal comp (3mo + 20d/yr)'}] },
  AR: { name: 'Argentina', law: 'Ley de Contrato de Trabajo', tribunal: 'Juzgado de Trabajo', limit: '2 years', agencies: ['Juzgado de Trabajo', 'M Trabajo'], cite: [{law:'LCT',article:'Art. 245',summary:'Indemnizacion por despido'}] },
  BR: { name: 'Brazil', law: 'CLT', tribunal: 'Vara do Trabalho', limit: '2 years', agencies: ['Vara do Trabalho', 'M Trabajo'], cite: [{law:'CLT',article:'Art. 477',summary:'Dismissal indemnity'}] },
  NL: { name: 'Netherlands', law: 'Ontslagwet', tribunal: 'Rechtbank / UWV', limit: '2 months', agencies: ['UWV', 'SZW'], cite: [{law:'Ontslagwet',article:'',summary:'Dismissal needs court/UWV approval'}] },
  SE: { name: 'Sweden', law: 'LAS', tribunal: 'Arbetsdomstolen', limit: '4 months', agencies: ['Arbetsdomstolen', 'AF'], cite: [{law:'LAS',article:'',summary:'Employment protection by tenure'}] },
  CH: { name: 'Switzerland', law: 'Obligationenrecht', tribunal: 'Arbeitsgericht', limit: '2 years', agencies: ['Arbeitsgericht', 'Suva'], cite: [{law:'OR',article:'Art. 336',summary:'Unfair dismissal protection'}] },
}
const COUNTRY = computed(() => C[country.value] || C.US)
const cn = computed(() => country.value === 'CN')

// 文书卡片
const docs = computed(() => {
  if (cn.value) return [
    { type:'winReport', icon:'🏆', title:'胜诉分析报告', desc:`${analysis.value.winRate||0}% 胜率 + 法律分析`, btn:'下载 PDF' },
    { type:'demandLetter', icon:'📝', title:'律师催讨函', desc:'正式法律催讨函', btn:'下载 PDF' },
    { type:'tribunalFiling', icon:'📂', title:'仲裁指南', desc:`${COUNTRY.value.tribunal} 提交步骤`, btn:'下载 PDF' },
  ]
  return [
    { type:'winReport', icon:'🏆', title:'Win Probability Report', desc:`${analysis.value.winRate||0}% win + legal breakdown`, btn:'Download PDF' },
    { type:'demandLetter', icon:'📝', title:'Demand Letter', desc:'Formal demand letter', btn:'Download PDF' },
    { type:'tribunalFiling', icon:'📂', title:'Filing Guide', desc:`Step-by-step for ${COUNTRY.value.tribunal.split('/')[0].trim()}`, btn:'Download PDF' },
  ]
})

const pageTitle = computed(() => cn.value ? '你的法律文书' : 'Your Legal Documents')
const pageSub = computed(() => cn.value ? `根据 ${COUNTRY.value.name} ${COUNTRY.value.law} 生成` : `Generated under ${COUNTRY.value.name} law (${COUNTRY.value.law})`)

// 安全文本：过滤 emoji / 非 ASCII 特殊字符 → 纯 ASCII + 中文（jsPDF default font 支持）
function safeText(s) {
  if (s == null) return ''
  let str = String(s)
  // 去掉 emoji 和装饰符号
  str = str.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
  // 去掉 ANSI 颜色码
  str = str.replace(/\x1b\[[0-9;]*m/g, '')
  // 去掉多余行
  str = str.replace(/^[=\-_.]+$/gm, '')
  return str.trim()
}

// 核心：安全写入 PDF
function writeLine(doc, text, x, y, maxWidth) {
  if (y > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage()
    y = 60
  }
  const safe = safeText(text)
  if (!safe) return y + 10
  try {
    const lines = doc.splitTextToSize(safe, maxWidth)
    doc.text(lines, x, y)
    return y + lines.length * 14
  } catch (e) {
    // 兜底：直接写 string
    try {
      doc.text(String(safe).slice(0, 200), x, y)
      return y + 14
    } catch {
      return y + 14
    }
  }
}

// ============ PDF 生成 ============
function buildPdf(doc, title, sections, a, comp) {
  const cnt = COUNTRY.value
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const mx = 50
  const mw = pageW - mx * 2
  let y = 50

  // Header
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`${cnt.name}  |  ${cnt.law}`, mx, 30)
  doc.setDrawColor(200, 200, 200)
  doc.line(mx, 36, pageW - mx, 36)

  // Title
  doc.setFontSize(18)
  doc.setTextColor(30, 60, 150)
  y = writeLine(doc, title, mx, y, mw)
  y += 8

  // Sections
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  for (const sec of sections) {
    if (y > pageH - 80) { doc.addPage(); y = 50 }
    if (sec.heading) {
      doc.setFontSize(12)
      doc.setTextColor(30, 60, 150)
      y = writeLine(doc, sec.heading, mx, y, mw)
      doc.setFontSize(11)
      doc.setTextColor(30, 30, 30)
      y += 4
    }
    for (const line of sec.body) {
      y = writeLine(doc, line, mx, y, mw)
    }
    y += 8
  }

  // Footer
  const pc = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pc; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text(`Legal AI  |  ${cnt.name}  |  Page ${i}/${pc}`, pageW/2, pageH - 20, { align: 'center' })
  }
}

async function download(type) {
  try {
    loading.value = type
    const a = analysis.value || {}
    const comp = a.compensation || {}
    const c = COUNTRY.value
    const isCn = cn.value
    const t = new Date().toISOString().split('T')[0]

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })

    if (type === 'winReport') {
      buildPdf(doc,
        isCn ? '胜诉概率分析报告' : `${c.name} Win Probability Report`, [
          { heading: isCn ? '案件基本信息' : 'Case Overview', body: [
            `${isCn?'企业名称':'Company'}: ${a.companyName||'[N/A]'}`,
            `${isCn?'岗位职位':'Position'}: ${a.jobTitle||'[N/A]'}`,
            `${isCn?'入职日期':'Hire Date'}: ${a.hireDate||'N/A'}`,
            `${isCn?'离职日期':'End Date'}: ${a.endDate||'Ongoing'}`,
            `${isCn?'月工资':'Monthly Salary'}: ${a.monthlySalary||0}`,
            `${isCn?'工龄':'Tenure'}: ${comp.tenure?.years||0} yr ${comp.tenure?.months||0} mo`,
            `${isCn?'适用法律':'Applicable Law'}: ${c.name} - ${c.law}`,
          ]},
          { heading: isCn ? '胜率预测' : 'Win Probability', body: [
            `${isCn?'预估胜诉概率':'Estimated Win Rate'}: ${a.winRate||55}%`,
            `${isCn?'评估方式':'Assessment'}: ${a.confidence==='AI-powered'?'AI + Rule Engine':'Rule-based'}`,
          ]},
          { heading: isCn ? '赔偿估算' : 'Compensation Estimate', body: [
            `N (Severance): ${comp.severance||0}`,
            `2N (Unfair Dismissal): ${comp.illegalTermination||0}`,
            `+1 (Notice): ${a.monthlySalary||comp.notice||0}`,
            `TOTAL: ${comp.estimatedTotal||0}`,
          ]},
          { heading: isCn ? '法律违规项' : 'Legal Violations', body: (a.violations||[]).map(v =>
            `[${(v.severity||'MEDIUM').toUpperCase()}] ${v.desc||v}`
          )},
          { heading: isCn ? '优势与劣势' : 'Strengths & Weaknesses', body: [
            'STRENGTHS:', ...((a.strengths||[]).map(s => '  + '+s)),
            'WEAKNESSES:', ...((a.weaknesses||[]).map(s => '  - '+s)),
          ]},
          { heading: isCn ? '核心法条' : 'Key Legal Provisions', body: c.cite.map(cite =>
            `${cite.law} ${cite.article||''} - ${cite.summary}`
          )},
          { heading: isCn ? 'AI 建议' : 'AI Advice', body: [a.advice||'Consult a local attorney.'] },
          { heading: isCn ? '下一步' : 'Next Steps', body: (a.nextSteps||[]).map((s,i) => `${i+1}. ${s}`) },
        ], a, comp)

    } else if (type === 'demandLetter') {
      const to = a.companyName||'[Company Name]'
      const from = a.userName||'[Your Name]'
      const spec = {
        GB: 'IMPORTANT: Under UK law, ACAS early conciliation is MANDATORY before filing an Employment Tribunal claim.',
        US: 'Pursuant to state labor law and federal FLSA, I demand... WARN Act may apply for mass layoffs.',
        DE: 'Gemass dem Kundigungsschutzgesetz (KSchG) verlange ich hiermit...',
        CN: '如贵司未在14日内支付，本人将依法向劳动人事争议仲裁委员会申请仲裁，并保留向劳动监察大队投诉举报的权利。',
      }[country.value] || isCn ? '依据当地劳动法，特此正式要求。' : 'Pursuant to local employment law, I hereby formally demand...'

      buildPdf(doc, isCn ? '正式法律催讨函' : 'Formal Legal Demand Letter', [
        { heading: '', body: [
          `Date: ${t}`, '', `TO:`, to, `[Company Address]`, '',
          `FROM:`, from, `[Your Address]`, `[Email / Phone]`, '',
          isCn ? `主题：${c.name} ${c.law} 项下解雇赔偿正式要求` : `RE: Demand for Employment Compensation (${c.name})`, '',
          '----------------------------------------', '',
          isCn ? '尊敬的先生/女士：' : 'Dear Sir/Madam,', '',
          isCn
            ? `本人就${to}单方面终止劳动关系一事正式致函。事实如下：`
            : `I am writing regarding the termination of my employment with ${to}. Facts:`, '',
          `1. Hire: ${a.hireDate||'N/A'}`, `2. End: ${a.endDate||'Ongoing'}`,
          `3. Monthly Salary: ${a.monthlySalary||0}`, '',
          spec, '',
          isCn ? '金额计算：' : 'Calculation:',
          `  N: ${comp.severance||0}`,
          `  2N: ${comp.illegalTermination||0}`,
          `  +1: ${a.monthlySalary||0}`,
          `  TOTAL DEMANDED: ${comp.estimatedTotal||0}`, '',
          isCn
            ? '请于14日内完成支付。逾期将向' + c.tribunal + ' 提交申请，并向 ' + c.agencies.join('、') + ' 投诉。'
            : `Payment requested within 14 days. Otherwise I will file with ${c.tribunal} and complain to ${c.agencies.join(', ')}.`, '',
          isCn ? '此致' : 'Sincerely,', '', '_________________________', from,
        ]}
      ], a, comp)

    } else if (type === 'tribunalFiling') {
      buildPdf(doc,
        isCn ? `${c.tribunal} 提交指南` : `${c.tribunal} Filing Guide`, [
          { heading: isCn ? '概述' : 'Overview', body: [
            `${c.name} - ${c.law}`,
            `${isCn?'受理机构':'Tribunal'}: ${c.tribunal}`,
            `${isCn?'时效':'Deadline'}: ${c.limit}`,
          ]},
          { heading: isCn ? '第一步：收集证据' : 'Step 1: Gather Evidence', body: [
            '• Employment contract', '• Payslips (6-12 months)',
            '• Dismissal letter / notice', '• Emails & communications',
            '• Performance reviews', '• Offer letters',
          ]},
          { heading: isCn ? '第二步：确认时效（切勿错过！）' : 'Step 2: Know Your Deadline (CRITICAL!)', body: [
            `${c.name}: ${c.limit}`,
            isCn ? '超过时效将失去所有索赔权利！' : 'Missing this forfeits ALL claims - act NOW!',
          ]},
          { heading: isCn ? '第三步：先调解' : 'Step 3: Try Mediation First', body: [
            `${c.name} 调解/建议机构:`,
            ...c.agencies.map(x => '• '+x),
          ]},
          { heading: isCn ? '第四步：准备申请' : 'Step 4: Prepare Application', body: [
            '• Claim form (official template)', '• Copy of ID/passport',
            '• Evidence package (Step 1)', '• Damage calculation',
            '• Filing fee (often waived for low-income)',
          ]},
          { heading: isCn ? '第五步：正式提交' : 'Step 5: File the Claim', body: [
            `File with: ${c.tribunal}`,
            `Related authorities: ${c.agencies.join(', ')}`,
            'Submission: Mail / Online / In-person. Use registered mail for proof.',
          ]},
          { heading: isCn ? '第六步：准备庭审' : 'Step 6: Prepare for Hearing', body: [
            '• Evidence in chronological order',
            '• 5-minute oral summary', '• Practice with a friend',
            '• Bring 2-3 copies of ALL documents',
          ]},
          { heading: isCn ? '预估时间' : 'Estimated Timeline', body: [
            '• Filing to first hearing: 2-6 months',
            '• Full process: 6-18 months', '• Settlement anytime',
          ]},
          { heading: isCn ? '核心法条' : 'Key Legal Provisions', body: c.cite.map(x => `${x.law} ${x.article||''} - ${x.summary}`) },
          { heading: isCn ? '有用资源' : 'Helpful Resources', body: [
            `• ${c.tribunal} official website`,
            ...c.agencies.map(x => '• '+x),
            '• Local legal aid clinic (free for low-income)',
          ]},
          { heading: isCn ? '重要提醒' : 'Important Notice', body: [
            isCn ? '本指南为 AI 自动生成的通用参考，不构成法律意见。请咨询当地执业律师。' 
                 : 'AI-generated for reference only. Consult a local licensed attorney.',
          ]},
        ], a, comp)
    }

    const fn = `legal-ai-${country.value}-${type}-${Date.now()}.pdf`
    doc.save(fn)
  } catch (err) {
    console.error('PDF ERROR:', err)
    alert('PDF failed: ' + (err.message || err))
  } finally {
    loading.value = null
  }
}
</script>
