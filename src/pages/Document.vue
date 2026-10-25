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
      <a href="mailto:5546638@qq.com" class="btn-secondary">📧 {{ t('document.sendEmail') || 'Email Support' }}</a>
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

// ============================================================
// 🌍 COUNTRY DATABASE — 20 国完整数据
// ============================================================
const C = {
  US: { name: 'United States', law: 'At-Will Employment', tribunal: 'State Labor Department / Federal District Court', limit: '2-3 years (state-dependent)', agencies: ['EEOC', 'State Labor Commissioner', 'Department of Labor (DOL)'], cite: [{law:'Fair Labor Standards Act',article:'29 U.S.C. § 201',summary:'Federal minimum wage & overtime'},{law:'Title VII of Civil Rights Act',article:'42 U.S.C. § 2000e',summary:'Discrimination protection'},{law:'FMLA',article:'29 U.S.C. § 2601',summary:'12 weeks unpaid leave'}] },
  GB: { name: 'United Kingdom', law: 'Employment Rights Act 1996', tribunal: 'Employment Tribunal', limit: '3 months from dismissal (ACAS first)', agencies: ['ACAS (Advisory Conciliation and Arbitration Service)', 'Employment Tribunal', 'HM Revenue & Customs (for tax)'], cite: [{law:'Employment Rights Act 1996',article:'s.94',summary:'Right not to be unfairly dismissed (2+ years service)'},{law:'Equality Act 2010',article:'s.39',summary:'Protection against discrimination at work'},{law:'Working Time Regulations 1998',article:'Reg. 4',summary:'48-hour maximum working week'}] },
  DE: { name: 'Germany', law: 'Kündigungsschutzgesetz (KSchG)', tribunal: 'Arbeitsgericht (Labor Court)', limit: '3 weeks from dismissal date', agencies: ['Arbeitsgericht (Local Labor Court)', 'IHK / HWK (Chamber of Commerce)', 'Deutsche Rentenversicherung'], cite: [{law:'Kündigungsschutzgesetz',article:'§1',summary:'Protection against dismissal (6+ months tenure, company >10 employees)'},{law:'Entgelttransparenzgesetz',article:'§1',summary:'Pay transparency between men and women'},{law:'Arbeitszeitgesetz',article:'§3',summary:'8-hour maximum working day'}] },
  FR: { name: 'France', law: 'Code du Travail', tribunal: 'Conseil de Prud\'hommes', limit: '5 years from dismissal (most claims)', agencies: ['Conseil de Prud\'hommes (Labor Court)', 'Inspection du Travail', 'URSSAF (for social security)'], cite: [{law:'Code du Travail',article:'Art. L1234-9',summary:'Severance pay (1/4 month per year)'},{law:'Code du Travail',article:'Art. L1132-1',summary:'Protection against discrimination'},{law:'Loi Macron',article:'2015-2016',summary:'Reform of employment law & unfair dismissal damages cap'}] },
  ES: { name: 'Spain', law: 'Estatuto de los Trabajadores', tribunal: 'Juzgado de lo Social', limit: '20 working days from dismissal', agencies: ['Juzgado de lo Social (Social Court)', 'Inspección de Trabajo', 'INSS (Social Security)'], cite: [{law:'Estatuto de los Trabajadores',article:'Art. 56',summary:'Dismissal compensation (33 days per year, max 24 months)'},{law:'Ley Orgánica 3/2007',article:'',summary:'Gender equality at work'},{law:'Real Decreto Legislativo 2/2015',article:'',summary:'Consolidated Labor Law text'}] },
  IT: { name: 'Italy', law: 'Statuto dei Lavoratori (Law 300/1970)', tribunal: 'Tribunale del Lavoro', limit: '2 years from dismissal', agencies: ['Tribunale del Lavoro (Labor Court)', 'INPS (Social Security)', 'Ispettorato Nazionale del Lavoro'], cite: [{law:'Statuto dei Lavoratori',article:'Art. 18',summary:'Reinstatement for unfair dismissal (companies >15 employees)'},{law:'Jobs Act (Law 183/2014)',article:'',summary:'Flexible labor contract reforms'},{law:'Legge Biagi',article:'2003',summary:'Part-time & fixed-term contract regulations'}] },
  CA: { name: 'Canada', law: 'Provincial Labor Codes + Federal COLA', tribunal: 'Provincial Labor Board / Federal Labour Program', limit: '6 months - 2 years (varies by province)', agencies: ['Employment Standards (provincial)', 'Canadian Human Rights Commission', 'Service Canada (EI/CPP)'], cite: [{law:'Canada Labour Code',article:'Part III',summary:'Federal minimum standards'},{law:'Workplace Safety & Insurance Act',article:'',summary:'Injury protection'},{law:'Human Rights Act',article:'',summary:'Discrimination protection'}] },
  AU: { name: 'Australia', law: 'Fair Work Act 2009', tribunal: 'Fair Work Commission', limit: '21 days from dismissal (unfair dismissal)', agencies: ['Fair Work Commission', 'Fair Work Ombudsman', 'Australian Human Rights Commission'], cite: [{law:'Fair Work Act 2009',article:'s.382',summary:'Unfair dismissal remedy (6+ months tenure)'},{law:'National Employment Standards',article:'',summary:'10 minimum employment entitlements'},{law:'Work Health & Safety Act',article:'',summary:'Duty of care'}] },
  NZ: { name: 'New Zealand', law: 'Employment Relations Act 2000', tribunal: 'Employment Relations Authority / Employment Court', limit: '90 days from dismissal', agencies: ['Employment Relations Authority', 'Ministry of Business Innovation & Employment', 'WorkSafe NZ'], cite: [{law:'Employment Relations Act 2000',article:'s.103A',summary:'Personal grievance claim'},{law:'Minimum Wage Act 1983',article:'',summary:'Minimum wage protection'},{law:'Health & Safety at Work Act 2015',article:'',summary:'Workplace safety'}] },
  CN: { name: 'China', law: '劳动合同法 (Labor Contract Law)', tribunal: '劳动人事争议仲裁委员会', limit: '1 year from dismissal date (劳动争议调解仲裁法)', agencies: ['劳动人事争议仲裁委员会', '人力资源和社会保障局 (Labor & Social Security Bureau)', '劳动监察大队 (Labor Inspection)'], cite: [{law:'劳动合同法',article:'第47条',summary:'经济补偿 N (每满一年支付一个月工资)'},{law:'劳动合同法',article:'第87条',summary:'违法解除赔偿 2N (二倍经济补偿)'},{law:'劳动争议调解仲裁法',article:'第27条',summary:'仲裁时效 1 年'}] },
  SG: { name: 'Singapore', law: 'Employment Act', tribunal: 'Employment Claims Tribunal', limit: '1 year from dismissal', agencies: ['Employment Claims Tribunal', 'Ministry of Manpower (MOM)', 'Central Provident Fund (CPF) Board'], cite: [{law:'Employment Act',article:'s.20',summary:'Notice period & termination'},{law:'Employment Act',article:'s.45',summary:'Unfair dismissal claim'},{law:'Tripartite Guidelines',article:'',summary:'Fair employment practices'}] },
  JP: { name: 'Japan', law: '労働契約法 (Labor Contract Act)', tribunal: '労働委員会 (Labor Relations Commission)', limit: '5 years from dismissal', agencies: ['労働委員会', '都道府県労働局 (Prefectural Labor Bureau)', '厚生労働省 (MHLW)'], cite: [{law:'労働契約法',article:'第16条',summary:'Abusive dismissal prohibited'},{law:'労働基準法',article:'第39条',summary:'Paid leave entitlement'},{law:'男女雇用機会均等法',article:'',summary:'Gender equality at work'}] },
  KR: { name: 'South Korea', law: '근로기준법 (Labor Standards Act)', tribunal: '노동위원회 (Labor Relations Commission)', limit: '3 years from dismissal', agencies: ['노동위원회', '고용노동부 (Ministry of Employment & Labor)', '국민건강보험공단'], cite: [{law:'근로기준법',article:'제27조',summary:'Dismissal restrictions'},{law:'남녀고용평등법',article:'',summary:'Gender equality'},{law:'산업안전보건법',article:'',summary:'Workplace safety'}] },
  IN: { name: 'India', law: 'Industrial Disputes Act 1947', tribunal: 'Labour Court / Industrial Tribunal', limit: '3 years from dismissal', agencies: ['Labour Commissioner', 'Industrial Tribunal', 'National Human Rights Commission'], cite: [{law:'Industrial Disputes Act',article:'s.25F',summary:'Prior permission for layoff (100+ employees)'},{law:'Payment of Wages Act',article:'',summary:'Timely wage payment'},{law:'Equal Remuneration Act 1976',article:'',summary:'Equal pay for equal work'}] },
  MX: { name: 'Mexico', law: 'Ley Federal del Trabajo', tribunal: 'Junta Local de Conciliación y Arbitraje', limit: '2 months from dismissal', agencies: ['Junta Local de Conciliación y Arbitraje', 'Secretaría del Trabajo y Previsión Social (STPS)', 'IMSS (Social Security)'], cite: [{law:'Ley Federal del Trabajo',article:'Art. 47',summary:'Dismissal compensation (3 months + 20 days/year)'},{law:'Ley General de Discriminación',article:'',summary:'Anti-discrimination protection'},{law:'Ley Federal para Prevenir y Eliminar la Discriminación',article:'',summary:'Workplace equality'}] },
  AR: { name: 'Argentina', law: 'Ley de Contrato de Trabajo (LCT)', tribunal: 'Juzgado de Trabajo', limit: '2 years from dismissal', agencies: ['Juzgado de Trabajo', 'Ministerio de Trabajo', 'ANSES (Social Security)'], cite: [{law:'Ley de Contrato de Trabajo',article:'Art. 245',summary:'Indemnización por despido (1 month/year)'},{law:'Ley 25.871',article:'',summary:'Anti-discrimination law'},{law:'Convenios Colectivos',article:'',summary:'Collective bargaining agreements'}] },
  BR: { name: 'Brazil', law: 'CLT (Consolidação das Leis do Trabalho)', tribunal: 'Vara do Trabalho', limit: '2 years from dismissal (5 years for rights)', agencies: ['Vara do Trabalho (Labor Court)', 'Ministério do Trabalho', 'FGTS (severance fund)'], cite: [{law:'CLT',article:'Art. 477',summary:'Dismissal indemnity'},{law:'Lei 13.429/2017',article:'',summary:'Labor reform'},{law:'Constituição Federal',article:'Art. 7',summary:'Worker fundamental rights'}] },
  NL: { name: 'Netherlands', law: 'Ontslagwet (Dismissal Act)', tribunal: 'Rechtbank (Subdistrict Court) / UWV', limit: '2 months from dismissal', agencies: ['UWV (Employee Insurance Agency)', 'Rechtbank', 'SZW Ministry'], cite: [{law:'Ontslagwet',article:'',summary:'Dismissal requires judicial approval or UWV consent'},{law:'Wet arbeid en zorg',article:'',summary:'Work & Care Act'},{law:'Algemene wet gelijke behandeling',article:'',summary:'Equal treatment act'}] },
  SE: { name: 'Sweden', law: 'Lagen om anställningsskydd (LAS)', tribunal: 'Arbetsdomstolen (Labour Court)', limit: '4 months from dismissal', agencies: ['Arbetsdomstolen', 'Arbetsförmedlingen (Public Employment Service)', 'Försäkringskassan'], cite: [{law:'Lagen om anställningsskydd (LAS)',article:'',summary:'Employment protection act (priority by tenure)'},{law:'Diskrimineringslagen',article:'',summary:'Anti-discrimination act'},{law:'Arbetsmiljölagen',article:'',summary:'Work environment act'}] },
  CH: { name: 'Switzerland', law: 'Obligationenrecht (OR)', tribunal: 'Arbeitsgericht', limit: '2 years from dismissal', agencies: ['Arbeitsgericht', 'Suva (accident insurance)', 'AHV/AVS (social security)'], cite: [{law:'Obligationenrecht (OR)',article:'Art. 336',summary:'Unfair dismissal protection'},{law:'Gleichstellungsgesetz',article:'',summary:'Gender equality act'},{law:'Arbeitsschutzgesetz',article:'',summary:'Work protection act'}] },
}

const COUNTRY = computed(() => C[country.value] || C.US)

// ============================================================
// 三个文书标题（按国家）
// ============================================================
const docs = computed(() => {
  const cn = country.value === 'CN'
  return [
    {
      type: 'winReport', icon: '🏆',
      title: cn ? '胜诉分析报告' : (loc.value === 'es' ? 'Informe de Probabilidad' : loc.value === 'fr' ? 'Rapport de Probabilité' : loc.value === 'de' ? 'Erfolgswahrscheinlichkeit' : loc.value === 'it' ? 'Rapporto di Probabilità' : 'Win Probability Report'),
      desc: cn ? `${analysis.value.winRate || 0}% 胜率 + 法律分析` : `${analysis.value.winRate || 0}% win + legal breakdown`,
      btn: cn ? '下载 PDF' : 'Download PDF'
    },
    {
      type: 'demandLetter', icon: '📝',
      title: cn ? '律师催讨函' : (loc.value === 'es' ? 'Carta de Demanda' : loc.value === 'fr' ? 'Lettre de Mise en Demeure' : loc.value === 'de' ? 'Mahnschreiben' : loc.value === 'it' ? 'Lettera di Intimazione' : 'Demand Letter'),
      desc: cn ? '正式法律催讨函' : 'Professional demand letter to employer',
      btn: cn ? '下载 PDF' : 'Download PDF'
    },
    {
      type: 'tribunalFiling', icon: '📂',
      title: cn ? '仲裁指南' : (loc.value === 'es' ? 'Guía de Presentación' : loc.value === 'fr' ? 'Guide de Dépôt' : loc.value === 'de' ? 'Einreichungsleitung' : loc.value === 'it' ? 'Guida di Presentazione' : 'Filing Guide'),
      desc: cn ? `${COUNTRY.value.tribunal.split(' / ')[0].split('(')[0].trim()} 提交步骤` : `Step-by-step for ${COUNTRY.value.tribunal.split('/')[0].trim().split('(')[0].trim()}`,
      btn: cn ? '下载 PDF' : 'Download PDF'
    }
  ]
})

const pageTitle = computed(() => {
  if (country.value === 'CN') return '你的法律文书'
  if (loc.value === 'es') return 'Tus Documentos Legales'
  if (loc.value === 'fr') return 'Vos Documents Juridiques'
  if (loc.value === 'de') return 'Ihre Rechtsdokumente'
  if (loc.value === 'it') return 'I Tuoi Documenti Legali'
  return 'Your Legal Documents'
})
const pageSub = computed(() => {
  const cn = country.value === 'CN'
  return cn ? `根据 ${COUNTRY.value.name} ${COUNTRY.value.law} 生成 · 可直接提交仲裁` : `Generated under ${COUNTRY.value.name} ${COUNTRY.value.law} · Ready to file`
})

// ============================================================
// 三个文书内容（按国家 hardcode）
// ============================================================
function getDocumentContent(type, a) {
  const comp = a.compensation || {}
  const cn = country.value === 'CN'
  const isAsia = ['CN','JP','KR','SG','IN'].includes(country.value)
  
  if (type === 'winReport') {
    return buildWinReport(a, comp, cn)
  }
  if (type === 'demandLetter') {
    return buildDemandLetter(a, comp, cn)
  }
  if (type === 'tribunalFiling') {
    return buildFilingGuide(a, comp, cn, isAsia)
  }
}

function buildWinReport(a, comp, cn) {
  const cnt = COUNTRY.value
  return {
    title: cn ? '胜诉概率分析报告' : `${cnt.name} — Win Probability Analysis Report`,
    sections: [
      { heading: cn ? '一、案件基本信息' : '1. Case Overview', body: [
        cn ? `企业名称：${a.companyName || '[公司名称]'}` : `Company: ${a.companyName || '[Company Name]'}`,
        cn ? `岗位职位：${a.jobTitle || '[职位]'}` : `Position: ${a.jobTitle || '[Position]'}`,
        cn ? `入职日期：${a.hireDate || '不详'}` : `Hire Date: ${a.hireDate || 'N/A'}`,
        cn ? `离职日期：${a.endDate || '在职'}` : `End Date: ${a.endDate || 'Ongoing'}`,
        cn ? `月税前工资：${a.monthlySalary || 0}` : `Monthly Salary: ${a.monthlySalary || 0}`,
        cn ? `工龄：${comp.tenure?.years || 0} 年 ${comp.tenure?.months || 0} 个月` : `Tenure: ${comp.tenure?.years || 0} yr ${comp.tenure?.months || 0} mo`,
        cn ? `适用法律体系：${cnt.name} · ${cnt.law}` : `Applicable Law: ${cnt.name} · ${cnt.law}`,
      ]},
      { heading: cn ? '二、胜率预测' : '2. Win Probability Assessment', body: [
        cn ? `预估胜诉概率：${a.winRate || 55}%` : `Estimated Win Rate: ${a.winRate || 55}%`,
        cn ? `评估方式：${a.confidence === 'AI-powered' ? 'AI 法律大模型 + 规则引擎双验证' : '基于劳动法规则引擎'}` : `Assessment Method: ${a.confidence === 'AI-powered' ? 'AI Legal Model + Rule Engine' : 'Rule-based engine'}`,
        cn ? '结论：以下基于当地劳动法具体条款，建议结合 AI 法律条文比对。' : `Note: Assessment based on ${cnt.law}. Consult a local lawyer for personalized advice.`,
      ]},
      { heading: cn ? '三、赔偿金额估算' : '3. Compensation Estimate', body: [
        cn ? `经济补偿金 (N)：${comp.severance || 0}` : `Severance Pay (N): ${comp.severance || 0}`,
        cn ? `违法解除赔偿金 (2N)：${comp.illegalTermination || 0}` : `Unfair Dismissal (2N): ${comp.illegalTermination || 0}`,
        cn ? `代通知金 (N+1)：${a.monthlySalary || comp.notice || 0}` : `Notice Pay (+1): ${a.monthlySalary || comp.notice || 0}`,
        cn ? `预计总额：${comp.estimatedTotal || 0}` : `Estimated Total: ${comp.estimatedTotal || 0}`,
        cn ? `计算依据：${cnt.name} 法定赔偿公式` : `Formula: Based on ${cnt.name} statutory calculation`,
      ]},
      { heading: cn ? '四、可能的法律违规项' : '4. Potential Legal Violations', body: (a.violations || []).map(v => 
        cn ? `• severity=${v.severity?.toUpperCase() || 'MEDIUM'} — ${v.desc || v}` 
           : `• [${v.severity?.toUpperCase() || 'MEDIUM'}] ${v.desc || v}`
      )},
      { heading: cn ? '五、优势与劣势分析' : '5. Strengths & Weaknesses', body: [
        cn ? '【优势】' : 'STRENGTHS:',
        ...((a.strengths || []).map(s => `  ✅ ${s}`)),
        cn ? '【劣势/风险】' : 'WEAKNESSES:',
        ...((a.weaknesses || []).map(s => `  ⚠️ ${s}`)),
      ]},
      { heading: cn ? '六、适用核心法条（兜底）' : `6. Key Legal Provisions (${cnt.name})`, body: cnt.cite.map(c => 
        cn ? `• ${c.law} ${c.article || ''} — ${c.summary}`
           : `• ${c.law} ${c.article || ''} — ${c.summary}`
      )},
      { heading: cn ? '七、AI 法律建议' : '7. AI Legal Advice', body: [a.advice || 'Consult a local employment lawyer.'] },
      { heading: cn ? '八、下一步行动' : '8. Recommended Next Steps', body: (a.nextSteps || []).map((s, i) => `${i+1}. ${s}`) },
    ]
  }
}

function buildDemandLetter(a, comp, cn) {
  const cnt = COUNTRY.value
  const today = new Date().toISOString().split('T')[0]
  
  // 各国 demand letter 专用措辞
  const countrySpecific = {
    US: cn ? '根据您州的 labor law 及联邦 Fair Labor Standards Act，现正式要求...' 
           : `Pursuant to ${cnt.name} state labor law and the federal Fair Labor Standards Act, I hereby formally demand...`,
    GB: cn ? '依据 Employment Rights Act 1996，特此正式要求。请注意，根据 UK 法律，在向 Employment Tribunal 起诉前必须先通过 ACAS 进行早期调解。'
           : `Pursuant to the Employment Rights Act 1996, I hereby formally demand... Note: Under UK law, early conciliation through ACAS is mandatory before filing an Employment Tribunal claim.`,
    DE: cn ? '依据 Kündigungsschutzgesetz (Dismissal Protection Act)，特此正式要求。'
           : `Pursuant to the Kündigungsschutzgesetz (Dismissal Protection Act), I hereby formally demand...`,
    FR: cn ? '依据 Code du Travail，特此正式要求。Conseil de Prud\'hommes 为法国劳动争议专门法庭。'
           : `Pursuant to the Code du Travail, I hereby formally demand... The Conseil de Prud'hommes is the specialized labor court in France.`,
    ES: cn ? '依据 Estatuto de los Trabajadores，特此正式要求。Despido improcedente 法定赔偿为 33 天/年。'
           : `Pursuant to the Estatuto de los Trabajadores, I hereby formally demand... Statutory compensation for unfair dismissal is 33 days per year worked.`,
    IT: cn ? '依据 Statuto dei Lavoratori (Law 300/1970)，特此正式要求。'
           : `Pursuant to the Statuto dei Lavoratori (Law 300/1970), I hereby formally demand...`,
    CN: '依据《中华人民共和国劳动合同法》及《劳动争议调解仲裁法》，特此正式函告。如贵司未在 14 日内支付，本人将依法向劳动人事争议仲裁委员会申请仲裁，并保留向劳动监察大队投诉举报的权利。',
    SG: cn ? '依据 Employment Act (Chapter 91)，特此正式要求。'
           : `Pursuant to the Employment Act (Chapter 91), I hereby formally demand...`,
  }
  
  const demandBody = countrySpecific[country.value] || 
    (cn ? `依据 ${cnt.name} 劳动法，特此正式要求。` : `Pursuant to ${cnt.name} employment law, I hereby formally demand...`)

  return {
    title: cn ? '正式法律催讨函' : 'Formal Legal Demand Letter',
    sections: [
      { heading: '', body: [
        `Date: ${today}`, '',
        cn ? '致（TO）：' : 'TO:',
        a.companyName || '[Company Name]',
        cn ? '[公司地址]' : '[Company Address]', '',
        cn ? '自（FROM）：' : 'FROM:',
        a.userName || '[Your Full Name]',
        cn ? '[您的地址]' : '[Your Address]',
        cn ? '[邮箱 / 电话]' : '[Email / Phone]', '',
        cn ? `主题：关于 ${cnt.name} ${cnt.law} 项下的解雇赔偿正式要求` 
           : `RE: Formal Demand for Employment Compensation under ${cnt.name} Law (${cnt.law})`, '',
        '—'.repeat(40), '',
        cn ? '尊敬的先生/女士：' : 'Dear Sir/Madam,', '',
        cn ? `本人就 ${a.companyName || '贵公司'} 单方面终止本人劳动关系一事，正式致函。根据案件事实：` 
           : `I am writing to formally demand payment arising from the termination of my employment with ${a.companyName || 'your company'}. Based on the facts:`, '',
        cn ? `1. 本人入职日期：${a.hireDate || '[入职日期]'}` : `1. My employment commenced on: ${a.hireDate || '[Hire Date]'}`,
        cn ? `2. 本人离职日期：${a.endDate || '[离职日期]'}` : `2. My employment ended on: ${a.endDate || '[End Date]'}`,
        cn ? `3. 月税前工资：${a.monthlySalary || 0}` : `3. Monthly salary: ${a.monthlySalary || 0}`,
        cn ? `4. 本人于 ${cnt.name} ${cnt.law} 项下应得以下赔偿：` 
           : `4. Under ${cnt.name} law (${cnt.law}), I am entitled to:`, '',
        demandBody, '',
        cn ? '具体赔偿金额计算如下：' : 'The specific calculation is as follows:',
        cn ? `  • 经济补偿金 (N)：${comp.severance || 0}` : `  • Severance Pay (N): ${comp.severance || 0}`,
        cn ? `  • 违法解除赔偿金 (2N)：${comp.illegalTermination || 0}` : `  • Unfair Dismissal (2N): ${comp.illegalTermination || 0}`,
        cn ? `  • 代通知金：${a.monthlySalary || comp.notice || 0}` : `  • Notice Pay: ${a.monthlySalary || comp.notice || 0}`,
        cn ? `  • 总计要求：${comp.estimatedTotal || 0}` : `  • TOTAL DEMANDED: ${comp.estimatedTotal || 0}`, '',
        cn ? '本人要求贵司在收到本函后 **14 个自然日** 内完成支付。如未在上述期限内解决，本人将：' 
           : `I respectfully request payment within **14 calendar days** of receipt. If this matter is not resolved, I will:`,
        cn ? '  1. 向当地劳动仲裁机构申请仲裁；' : `  1. File a claim with ${cnt.tribunal};`,
        cn ? '  2. 向劳动监察部门投诉举报；' : `  2. File a complaint with ${cnt.agencies[0]};`,
        cn ? '  3. 保留追究其他法律责任的权利。' : `  3. Pursue all available legal remedies.`, '',
        cn ? '所有证据（劳动合同、工资条、解雇通知等）均已备份，随时可提交给相关机构。' 
           : `All evidence (contract, payslips, dismissal notice, communications) is preserved and ready for submission.`, '',
        cn ? '请重视此函，避免不必要的法律纠纷。' : `Please treat this matter seriously to avoid unnecessary legal proceedings.`, '',
        cn ? '此致' : 'Sincerely,', '',
        '_________________________',
        a.userName || '[Your Signature]',
      ]}
    ]
  }
}

function buildFilingGuide(a, comp, cn, isAsia) {
  const cnt = COUNTRY.value
  return {
    title: cn ? `${cnt.tribunal.split(' / ')[0].split('(')[0].trim()} 提交指南` : `${cnt.tribunal.split(' / ')[0].split('(')[0].trim()} Filing Guide`,
    sections: [
      { heading: cn ? '概述' : 'Overview', body: [
        cn ? `本指南针对 ${cnt.name} 劳动争议提交程序。适用法律：${cnt.law}。` 
           : `This guide covers employment claim filing in ${cnt.name}. Applicable law: ${cnt.law}.`,
        cn ? `您将向：${cnt.tribunal} 提交` : `You will file with: ${cnt.tribunal}`,
        cn ? `仲裁时效：${cnt.limit}` : `Limitation period: ${cnt.limit}`,
      ]},
      { heading: cn ? '第一步：收集证据' : 'Step 1: Gather Evidence', body: [
        cn ? '必备证据清单：' : 'Required evidence checklist:',
        '• Employment contract / 劳动合同',
        '• Payslips (last 6-12 months) / 工资条',
        '• Dismissal letter or termination notice / 解雇通知',
        '• Email, chat communications with employer / 沟通记录',
        '• Performance reviews, warnings / 绩效考核、警告信',
        '• Any offer letter, promotion letter / Offer letter、晋升通知',
      ]},
      { heading: cn ? '第二步：确认时效期限（切勿错过！）' : 'Step 2: Know Your Deadline (CRITICAL!)', body: [
        cn ? `⚠️ ${cnt.name} 时效规定：${cnt.limit}` : `⚠️ ${cnt.name} limitation: ${cnt.limit}`,
        cn ? '超过时效将失去所有索赔权利，请尽快行动！' 
           : `Missing this deadline forfeits ALL claims — act NOW!`,
      ]},
      { heading: cn ? '第三步：尝试调解 / 协商' : 'Step 3: Try Mediation First', body: [
        cn ? `${cnt.name} 官方调解/建议机构：` : `${cnt.name} official mediation bodies:`,
        ...cnt.agencies.map(a => `• ${a}`),
        cn ? `→ ${cnt.name} 法律允许或要求先进行调解再起诉。免费调解通常比诉讼快很多。` 
           : `→ ${cnt.name} law may require mediation before litigation. Free mediation is faster than court.`,
      ]},
      { heading: cn ? '第四步：准备申请材料' : 'Step 4: Prepare Your Application', body: [
        cn ? '向仲裁庭提交所需文件：' : `Documents to submit to ${cnt.tribunal.split(' / ')[0]}:`,
        '• Claim application form (official template) / 仲裁申请书',
        '• Copy of ID / passport / 身份证/护照',
        '• Full evidence package (Step 1)',
        '• Calculation of damages with legal basis / 赔偿计算明细及法律依据',
        '• Filing fee (often waived for low-income) / 仲裁费（低收入可减免）',
      ]},
      { heading: cn ? '第五步：正式提交' : 'Step 5: File the Claim', body: [
        cn ? `向以下机构提交：${cnt.tribunal}` : `File with: ${cnt.tribunal}`,
        cn ? `相关政府机构：${cnt.agencies.join('、')}` : `Related authorities: ${cnt.agencies.join(', ')}`,
        cn ? '提交方式：通常可邮寄、线上或现场提交。建议用挂号信/快递保留凭证。' 
           : 'Submission methods: Mail, online portal, or in-person. Use registered mail for proof of submission.',
      ]},
      { heading: cn ? '第六步：准备庭审' : 'Step 6: Prepare for Hearing', body: [
        cn ? '庭审前的准备工作：' : 'Pre-hearing preparation:',
        '• Organize evidence in chronological order / 证据按时间排序',
        '• Prepare a clear 5-minute verbal summary / 准备 5 分钟口头陈述',
        '• Practice explaining your case to a friend / 对朋友练一遍',
        '• Bring 2-3 copies of ALL documents / 所有文件带 2-3 份复印件',
        '• Consider legal representation if claim is high-value / 金额大建议请律师',
      ]},
      { heading: cn ? '第七步：预估流程时间' : 'Estimated Timeline', body: [
        cn ? `• 提交 → 首次开庭：2-6 个月` : '• Filing → First hearing: 2-6 months',
        cn ? `• 完整流程：6-18 个月` : '• Full process: 6-18 months',
        cn ? `• 和解/调解可在任何阶段发生` : '• Settlement possible at any stage',
        cn ? `• ${cnt.name} 平均结案周期：参考 ${cnt.tribunal.split(' / ')[0]} 公开数据` 
           : `• Average ${cnt.name} resolution time: Check ${cnt.tribunal.split(' / ')[0]} statistics`,
      ]},
      { heading: cn ? '核心法条参考' : 'Key Legal Provisions', body: cnt.cite.map(c => 
        cn ? `• ${c.law} ${c.article || ''} — ${c.summary}` : `• ${c.law} ${c.article || ''} — ${c.summary}`
      )},
      { heading: cn ? '有用资源' : 'Helpful Resources', body: [
        cn ? `• ${cnt.tribunal.split(' / ')[0]} 官方网站（Google 搜索 "官网"）` 
           : `• Official ${cnt.tribunal.split(' / ')[0]} website`,
        cn ? `• ${cnt.agencies[0]} — ${cnt.agencies[1] || '劳动监察'} — 劳动法咨询` : `• ${cnt.agencies.join(', ')}`,
        cn ? '• 当地法律援助中心（低收入免费）' : '• Local legal aid clinic (free for low-income)',
        cn ? '• 大学法学院免费法律咨询诊所' : '• University law school clinics',
        cn ? '• 工会（如适用）' : '• Trade unions (if applicable)',
      ]},
      { heading: cn ? '⚠️ 重要提醒' : '⚠️ Important Notice', body: [
        cn ? '本指南为 AI 自动生成的通用参考，不构成法律意见。金额较大或案情复杂时，请务必咨询当地执业律师。' 
           : 'This guide is AI-generated for general reference only and does not constitute legal advice. Consult a local licensed attorney for matters involving significant amounts or complex issues.',
      ]}
    ]
  }
}

// ============================================================
// PDF 生成
// ============================================================
function wrapText(doc, text, x, y, maxWidth) {
  const lines = doc.splitTextToSize(text || ' ', maxWidth)
  doc.text(lines, x, y)
  return lines.length
}

async function download(type) {
  try {
    loading.value = type
    const a = analysis.value || {}
    const content = getDocumentContent(type, a)
    const cnt = COUNTRY.value
    
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const marginX = 50
    const maxWidth = pageW - marginX * 2
    let y = 60

    // Header: country banner
    doc.setFontSize(10)
    doc.setTextColor(156, 163, 175)
    doc.text(`${cnt.name} · ${cnt.law}`, marginX, 40)
    doc.line(marginX, 46, pageW - marginX, 46)

    // Title
    doc.setFontSize(22)
    doc.setTextColor(37, 99, 235)
    const tLines = wrapText(doc, content.title, marginX, y, maxWidth)
    y += tLines.length * 28 + 14

    // Sections
    doc.setFontSize(11)
    doc.setTextColor(31, 41, 55)
    
    for (const section of content.sections) {
      if (y > pageH - 80) { doc.addPage(); y = 60 }
      
      if (section.heading) {
        doc.setFontSize(13)
        doc.setTextColor(37, 99, 235)
        const hLines = wrapText(doc, section.heading, marginX, y, maxWidth)
        y += hLines.length * 18 + 6
        doc.setFontSize(11)
        doc.setTextColor(31, 41, 55)
      }
      
      for (const line of section.body) {
        if (y > pageH - 60) { doc.addPage(); y = 60 }
        const lines = wrapText(doc, String(line || ' '), marginX, y, maxWidth)
        y += lines.length * 16
      }
      y += 10
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      const footer = `Generated by Legal AI · ${cnt.name} Law · Page ${i} of ${pageCount}`
      doc.text(footer, pageW / 2, pageH - 25, { align: 'center' })
    }

    const fileName = `legal-ai-${country.value}-${type}-${Date.now()}.pdf`
    doc.save(fileName)
    
  } catch (err) {
    console.error('PDF generation failed:', err)
    alert('PDF generation failed: ' + err.message)
  } finally {
    loading.value = null
  }
}
</script>
