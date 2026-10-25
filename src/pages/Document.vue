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
      <button class="btn-secondary" @click="$router.push('/result')">← Back</button>
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

// 20国数据（精简）
const C = {
  US: { name:'United States', law:'At-Will Employment', tribunal:'State Labor Department', limit:'2-3 years', agencies:['EEOC','State Labor Commissioner','DOL'], cite:[['Fair Labor Standards Act','29 U.S.C. 201','Min wage & overtime'],['Title VII','42 U.S.C. 2000e','Discrimination']] },
  GB: { name:'United Kingdom', law:'Employment Rights Act 1996', tribunal:'Employment Tribunal', limit:'3 months (ACAS first)', agencies:['ACAS (mandatory)','Employment Tribunal'], cite:[['ERA 1996','s.94','Unfair dismissal (2+ yrs)'],['Equality Act 2010','s.39','Anti-discrimination']] },
  DE: { name:'Germany', law:'Kündigungsschutzgesetz', tribunal:'Arbeitsgericht', limit:'3 weeks', agencies:['Arbeitsgericht','Arbeitsamt'], cite:[['Kündigungsschutzgesetz','Para.1','Dismissal protection'],['Arbeitszeitgesetz','Para.3','8-hour day']] },
  FR: { name:'France', law:'Code du Travail', tribunal:"Conseil de Prud'hommes", limit:'5 years', agencies:["Conseil de Prud'hommes",'Inspection du Travail'], cite:[['Code du Travail','Art. L1234-9','Severance 1/4 month/yr']] },
  ES: { name:'Spain', law:'Estatuto de los Trabajadores', tribunal:'Juzgado de lo Social', limit:'20 days', agencies:['Juzgado de lo Social','Inspeccion de Trabajo'], cite:[['Estatuto de los Trabajadores','Art.56','Dismissal 33 days/yr']] },
  IT: { name:'Italy', law:'Statuto dei Lavoratori (L.300/1970)', tribunal:'Tribunale del Lavoro', limit:'2 years', agencies:['Tribunale del Lavoro','INPS'], cite:[['Statuto 300/70','Art.18','Reinstatement for >15 employees']] },
  CA: { name:'Canada', law:'Provincial Labor Codes', tribunal:'Provincial Labor Board', limit:'6 mo - 2 yrs', agencies:['Employment Standards','CHRC'], cite:[['Canada Labour Code','Part III','Min standards']] },
  AU: { name:'Australia', law:'Fair Work Act 2009', tribunal:'Fair Work Commission', limit:'21 days', agencies:['Fair Work Commission','FWO'], cite:[['Fair Work Act','s.382','Unfair dismissal 6+ mo']] },
  NZ: { name:'New Zealand', law:'Employment Relations Act 2000', tribunal:'ERA', limit:'90 days', agencies:['ERA','MBIE'], cite:[['ERA 2000','s.103A','Personal grievance']] },
  CN: { name:'China', law:'劳动合同法', tribunal:'劳动人事争议仲裁委员会', limit:'1 year', agencies:['劳动人事争议仲裁委员会','人力资源和社会保障局','劳动监察大队'], cite:[['劳动合同法','第47条','经济补偿 N (每满一年一个月工资)'],['劳动合同法','第87条','违法解除赔偿 2N'],['劳动争议调解仲裁法','第27条','仲裁时效 1 年']] },
  SG: { name:'Singapore', law:'Employment Act', tribunal:'Employment Claims Tribunal', limit:'1 year', agencies:['ECT','MOM'], cite:[['Employment Act','s.20','Termination & notice']] },
  JP: { name:'Japan', law:'労働契約法', tribunal:'労働委員会', limit:'5 years', agencies:['労働委員会','厚生労働省'], cite:[['労働契約法','第16条','Abusive dismissal prohibited']] },
  KR: { name:'South Korea', law:'근로기준법', tribunal:'노동위원회', limit:'3 years', agencies:['노동위원회','고용노동부'], cite:[['근로기준법','제27조','Dismissal restrictions']] },
  IN: { name:'India', law:'Industrial Disputes Act 1947', tribunal:'Labour Court', limit:'3 years', agencies:['Labour Commissioner','Industrial Tribunal'], cite:[['IDA 1947','s.25F','Prior permission 100+ employees']] },
  MX: { name:'Mexico', law:'Ley Federal del Trabajo', tribunal:'Junta Local de Conciliacion', limit:'2 months', agencies:['Junta Local','STPS'], cite:[['LFT','Art.47','Dismissal comp 3mo+20d/yr']] },
  AR: { name:'Argentina', law:'Ley de Contrato de Trabajo', tribunal:'Juzgado de Trabajo', limit:'2 years', agencies:['Juzgado de Trabajo','Ministerio de Trabajo'], cite:[['LCT','Art.245','Indemnizacion por despido']] },
  BR: { name:'Brazil', law:'CLT', tribunal:'Vara do Trabalho', limit:'2 years', agencies:['Vara do Trabalho','Ministério do Trabalho'], cite:[['CLT','Art.477','Dismissal indemnity']] },
  NL: { name:'Netherlands', law:'Ontslagwet', tribunal:'Rechtbank / UWV', limit:'2 months', agencies:['UWV','SZW'], cite:[['Ontslagwet','','Dismissal needs court/UWV approval']] },
  SE: { name:'Sweden', law:'LAS', tribunal:'Arbetsdomstolen', limit:'4 months', agencies:['Arbetsdomstolen','Arbetsförmedlingen'], cite:[['LAS','','Employment protection by tenure']] },
  CH: { name:'Switzerland', law:'Obligationenrecht', tribunal:'Arbeitsgericht', limit:'2 years', agencies:['Arbeitsgericht','Suva'], cite:[['OR','Art.336','Unfair dismissal protection']] },
}
const CNT = computed(() => C[country.value] || C.US)
const IS_CN = computed(() => country.value === 'CN')

const docs = computed(() => {
  const cn = IS_CN.value
  return cn ? [
    { type:'winReport', icon:'🏆', title:'胜诉分析报告', desc:`${analysis.value.winRate||0}% 胜率 + 赔偿估算`, btn:'下载 PDF' },
    { type:'demandLetter', icon:'📝', title:'法律催讨函', desc:'可直接发出的正式函件', btn:'下载 PDF' },
    { type:'tribunalFiling', icon:'📂', title:'仲裁提交指南', desc:`向 ${CNT.value.tribunal} 提交`, btn:'下载 PDF' },
  ] : [
    { type:'winReport', icon:'🏆', title:'Win Report', desc:`${analysis.value.winRate||0}% win + damages`, btn:'Download PDF' },
    { type:'demandLetter', icon:'📝', title:'Demand Letter', desc:'Formal letter to employer', btn:'Download PDF' },
    { type:'tribunalFiling', icon:'📂', title:'Filing Guide', desc:`Step-by-step for ${CNT.value.tribunal.split('/')[0].trim()}`, btn:'Download PDF' },
  ]
})
const pageTitle = computed(() => IS_CN.value ? '你的法律文书' : 'Your Legal Documents')
const pageSub = computed(() => IS_CN.value ? `基于 ${CNT.value.name} ${CNT.value.law}` : `Generated for ${CNT.value.name} (${CNT.value.law})`)

// ============ jsPDF v4 — 极简 API ============
// 只用 doc.text(str, x, y) — 不传 options 对象
// 手动硬换行
function safe(s) {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '') // emoji
    .replace(/\x1b\[[0-9;]*m/g, '')
    .trim()
}

// 硬换行（按固定字符数切）
function hardWrap(text, maxChars) {
  const s = safe(text)
  if (!s) return ['']
  const lines = []
  for (let i = 0; i < s.length; i += maxChars) {
    lines.push(s.slice(i, i + maxChars))
  }
  return lines.length ? lines : ['']
}

// 安全写入 PDF（只用 doc.text(str, x, y)）
function putText(doc, str, x, y, maxChars, color, size, bold) {
  if (y > 780) { doc.addPage(); y = 50 }
  doc.setFontSize(size || 11)
  if (bold) doc.setFont(undefined, 'bold')
  else doc.setFont(undefined, 'normal')
  if (color) doc.setTextColor(color[0], color[1], color[2])
  const lines = hardWrap(str, maxChars)
  for (const line of lines) {
    try {
      doc.text(line, x, y)
      y += 16
    } catch {
      y += 16
    }
  }
  return y
}

// 核心 — 写入一整个文书
function renderPdf(doc, title, a, comp, sections) {
  const c = CNT.value
  const cn = IS_CN.value
  const pageW = 595.28
  const mx = 50
  const mw = 495
  let y = 45

  // Header (small gray)
  doc.setFontSize(9)
  doc.setTextColor(140, 140, 140)
  doc.text(`${c.name}  |  ${c.law}`, mx, y)
  y += 6
  doc.setDrawColor(200, 200, 200)
  doc.line(mx, y, pageW - mx, y)
  y += 12

  // Title (big blue bold)
  y = putText(doc, title, mx, y, 60, [30, 60, 150], 18, true)
  y += 8

  // Sections
  for (const sec of sections) {
    if (sec.heading) {
      y = putText(doc, sec.heading, mx, y, 60, [30, 60, 150], 13, true)
      y += 3
    }
    doc.setTextColor(30, 30, 30)
    for (const line of sec.body) {
      y = putText(doc, line, mx, y, 65, [30, 30, 30], 11, false)
    }
    y += 6
  }

  // Footer
  const pc = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pc; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    const ftext = 'Legal AI  |  ' + c.name + '  |  Page ' + i + '/' + pc; const fw = doc.getTextWidth(ftext); doc.text(ftext, 297.64 - fw/2, 810)
  }
}

async function download(type) {
  try {
    loading.value = type
    const a = analysis.value || {}
    const comp = a.compensation || {}
    const c = CNT.value
    const cn = IS_CN.value
    const t = new Date().toISOString().split('T')[0]
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })

    if (type === 'winReport') {
      renderPdf(doc,
        cn ? '胜诉概率分析报告' : `${c.name} Win Probability Report`, a, comp, [
        { heading: cn ? '案件基本信息' : 'Case Overview', body: [
          `${cn?'企业名称':'Company'}: ${a.companyName||'N/A'}`,
          `${cn?'岗位职位':'Position'}: ${a.jobTitle||'N/A'}`,
          `${cn?'入职日期':'Hire'}: ${a.hireDate||'N/A'}`,
          `${cn?'离职日期':'End'}: ${a.endDate||'Ongoing'}`,
          `${cn?'月工资':'Salary'}: ${a.monthlySalary||0}`,
          `${cn?'工龄':'Tenure'}: ${comp.tenure?.years||0} yr ${comp.tenure?.months||0} mo`,
          `${cn?'适用法律':'Law'}: ${c.name} - ${c.law}`,
        ]},
        { heading: cn ? '胜率预测' : 'Win Probability', body: [
          `${cn?'预估':'Estimated'}: ${a.winRate||55}%`,
          `${cn?'方式':'Method'}: ${a.confidence==='AI-powered'?'AI + Rule Engine':'Rule-based'}`,
        ]},
        { heading: cn ? '赔偿估算' : 'Compensation Estimate', body: [
          `N (Severance): ${comp.severance||0}`,
          `2N (Unfair Dismissal): ${comp.illegalTermination||0}`,
          `+1 (Notice): ${a.monthlySalary||comp.notice||0}`,
          `TOTAL DEMANDED: ${comp.estimatedTotal||0}`,
        ]},
        { heading: cn ? '法律违规项' : 'Legal Violations', body: (a.violations||[]).map(v =>
          `[${(v.severity||'MEDIUM').toUpperCase()}] ${v.desc||v}`) },
        { heading: cn ? '优势与劣势' : 'Strengths & Weaknesses', body: [
          'STRENGTHS:', ...((a.strengths||[]).map(s => '  + '+s)),
          'WEAKNESSES:', ...((a.weaknesses||[]).map(s => '  - '+s)),
        ]},
        { heading: cn ? '核心法条' : 'Key Legal Provisions', body: c.cite.map(([law, art, sum]) =>
          `${law} ${art||''} - ${sum}`) },
        { heading: cn ? 'AI 建议' : 'AI Advice', body: [a.advice||'Consult a local attorney.'] },
        { heading: cn ? '下一步' : 'Next Steps', body: (a.nextSteps||[]).map((s,i) => `${i+1}. ${s}`) },
      ])

    } else if (type === 'demandLetter') {
      const to = a.companyName||'[Company]'
      const from = a.userName||'[Your Name]'
      const spec = {
        GB: 'IMPORTANT: Under UK law, ACAS early conciliation is MANDATORY before filing an Employment Tribunal claim.',
        US: 'Pursuant to state labor law and federal FLSA, I formally demand settlement. WARN Act may apply.',
        DE: 'Gemass dem Kundigungsschutzgesetz (KSchG) verlange ich hiermit...',
        CN: '如贵司未在14日内支付，本人将依法向劳动人事争议仲裁委员会申请仲裁，并保留向劳动监察大队投诉举报的权利。',
      }[country.value] || (cn ? '依据当地劳动法，特此正式要求。' : 'Pursuant to local employment law, I hereby formally demand...')

      renderPdf(doc, cn ? '正式法律催讨函' : 'Formal Legal Demand Letter', a, comp, [
        { heading: '', body: [
          `Date: ${t}`, '', 'TO:', to, '[Company Address]', '',
          'FROM:', from, '[Your Address]', '[Email / Phone]', '',
          cn ? `主题：${c.name} ${c.law} 项下解雇赔偿正式要求` : `RE: Demand for Compensation (${c.name})`, '',
          '----------------------------------------', '',
          cn ? '尊敬的先生/女士：' : 'Dear Sir/Madam,', '',
          cn ? `本人就${to}单方面终止劳动关系一事正式致函。事实如下：`
             : `I am writing regarding termination of employment with ${to}. Facts:`, '',
          `1. Hire: ${a.hireDate||'N/A'}`, `2. End: ${a.endDate||'Ongoing'}`,
          `3. Monthly Salary: ${a.monthlySalary||0}`, '',
          spec, '',
          cn ? '金额计算：' : 'Calculation:',
          `  N: ${comp.severance||0}`, `  2N: ${comp.illegalTermination||0}`,
          `  +1: ${a.monthlySalary||0}`, `  TOTAL DEMANDED: ${comp.estimatedTotal||0}`, '',
          cn ? '请于14日内支付。逾期将向' + c.tribunal + ' 提交，并向 ' + c.agencies.join('、') + ' 投诉。'
             : `Payment requested within 14 days. Otherwise I will file with ${c.tribunal} and ${c.agencies.join(', ')}.`, '',
          cn ? '此致' : 'Sincerely,', '', '_________________________', from,
        ]}
      ])

    } else { // tribunalFiling
      renderPdf(doc, cn ? `${c.tribunal} 提交指南` : `${c.tribunal} Filing Guide`, a, comp, [
        { heading: cn ? '概述' : 'Overview', body: [
          `${c.name} - ${c.law}`,
          `${cn?'受理机构':'Tribunal'}: ${c.tribunal}`,
          `${cn?'时效':'Deadline'}: ${c.limit}`,
        ]},
        { heading: cn ? '第一步：收集证据' : 'Step 1: Gather Evidence', body: [
          '• Employment contract', '• Payslips (6-12 months)',
          '• Dismissal notice', '• Emails & communications',
          '• Performance reviews', '• Offer letters',
        ]},
        { heading: cn ? '第二步：确认时效（切勿错过！）' : 'Step 2: Know Your Deadline (CRITICAL!)', body: [
          `${c.name}: ${c.limit}`,
          cn ? '超过时效将失去所有索赔权利！' : 'Missing this forfeits ALL claims - act NOW!',
        ]},
        { heading: cn ? '第三步：先调解' : 'Step 3: Try Mediation First', body: [
          `${c.name} 调解/建议机构:`,
          ...c.agencies.map(x => '• '+x),
        ]},
        { heading: cn ? '第四步：准备申请' : 'Step 4: Prepare Application', body: [
          '• Official claim form', '• Copy of ID/passport',
          '• Full evidence package', '• Damage calculation',
          '• Filing fee (often waived)',
        ]},
        { heading: cn ? '第五步：正式提交' : 'Step 5: File the Claim', body: [
          `File with: ${c.tribunal}`,
          `Related authorities: ${c.agencies.join(', ')}`,
          'Submission: Mail / Online / In-person. Use registered mail for proof.',
        ]},
        { heading: cn ? '第六步：准备庭审' : 'Step 6: Prepare for Hearing', body: [
          '• Evidence in order', '• 5-minute oral summary',
          '• Practice with a friend', '• Bring 2-3 copies of ALL documents',
        ]},
        { heading: cn ? '预估时间' : 'Estimated Timeline', body: [
          '• Filing to first hearing: 2-6 months',
          '• Full process: 6-18 months', '• Settlement anytime',
        ]},
        { heading: cn ? '核心法条' : 'Key Legal Provisions', body: c.cite.map(([l,a,s]) => `${l} ${a||''} - ${s}`) },
        { heading: cn ? '有用资源' : 'Helpful Resources', body: [
          `• ${c.tribunal} official website`,
          ...c.agencies.map(x => '• '+x),
          '• Local legal aid (free for low-income)',
        ]},
        { heading: cn ? '重要提醒' : 'Important Notice', body: [
          cn ? '本指南为 AI 自动生成，不构成法律意见。请咨询当地执业律师。'
             : 'AI-generated for reference only. Consult a local licensed attorney.',
        ]},
      ])
    }

    doc.save(`legal-ai-${country.value}-${type}-${Date.now()}.pdf`)
  } catch (err) {
    console.error('PDF ERROR:', err)
    alert('PDF failed: ' + (err.message || err))
  } finally {
    loading.value = null
  }
}
</script>
