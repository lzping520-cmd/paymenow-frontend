<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <h1 class="section-title text-3xl text-center mb-4">{{ pageTitle }}</h1>
    <p class="text-center text-gray-500 mb-8">{{ pageSub }}</p>

    <!-- 隐藏的 PDF 内容（绝对定位到屏幕外，用于 html2canvas 截图）-->
    <div ref="pdfTarget" style="position:absolute;left:-9999px;top:-9999px;width:600px;">
      <div v-html="pdfHtml" style="padding:40px;font-family:Inter,Arial,sans-serif;color:#1f2937;line-height:1.7;"></div>
    </div>

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
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCaseStore } from '../stores/case'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const { t } = useI18n()
const router = useRouter()
const store = useCaseStore()
const analysis = computed(() => store.analysis || {})
const loading = ref(null)
const pdfTarget = ref(null)
const country = computed(() => (analysis.value.country || 'US').toUpperCase())

// 20国数据
const C = {
  US:{name:'United States',law:'At-Will Employment',tribunal:'State Labor Department',limit:'2-3 years',agencies:['EEOC','State Labor Commissioner','DOL'],cite:[['Fair Labor Standards Act','29 U.S.C. 201','Minimum wage & overtime'],['Title VII','42 U.S.C. 2000e','Discrimination']]},
  GB:{name:'United Kingdom',law:'Employment Rights Act 1996',tribunal:'Employment Tribunal',limit:'3 months (ACAS first)',agencies:['ACAS (mandatory)','Employment Tribunal'],cite:[['ERA 1996','s.94','Unfair dismissal (2+ yrs)'],['Equality Act 2010','s.39','Anti-discrimination']]},
  DE:{name:'Germany',law:'Kündigungsschutzgesetz',tribunal:'Arbeitsgericht',limit:'3 weeks',agencies:['Arbeitsgericht','Arbeitsamt'],cite:[['Kündigungsschutzgesetz','Para.1','Dismissal protection'],['Arbeitszeitgesetz','Para.3','8-hour day']]},
  FR:{name:'France',law:'Code du Travail',tribunal:"Conseil de Prud'hommes",limit:'5 years',agencies:["Conseil de Prud'hommes",'Inspection du Travail'],cite:[['Code du Travail','Art. L1234-9','Severance 1/4 month/yr']]},
  ES:{name:'Spain',law:'Estatuto de los Trabajadores',tribunal:'Juzgado de lo Social',limit:'20 days',agencies:['Juzgado de lo Social','Inspeccion de Trabajo'],cite:[['Estatuto','Art.56','Dismissal 33 days/yr']]},
  IT:{name:'Italy',law:'Statuto dei Lavoratori (L.300/1970)',tribunal:'Tribunale del Lavoro',limit:'2 years',agencies:['Tribunale del Lavoro','INPS'],cite:[['Statuto','Art.18','Reinstatement >15 employees']]},
  CA:{name:'Canada',law:'Provincial Labor Codes',tribunal:'Provincial Labor Board',limit:'6 mo - 2 yrs',agencies:['Employment Standards','CHRC'],cite:[['Canada Labour Code','Part III','Min standards']]},
  AU:{name:'Australia',law:'Fair Work Act 2009',tribunal:'Fair Work Commission',limit:'21 days',agencies:['FWC','FWO'],cite:[['Fair Work Act','s.382','Unfair dismissal 6+ mo']]},
  NZ:{name:'New Zealand',law:'Employment Relations Act 2000',tribunal:'ERA',limit:'90 days',agencies:['ERA','MBIE'],cite:[['ERA 2000','s.103A','Personal grievance']]},
  CN:{name:'China',law:'劳动合同法',tribunal:'劳动人事争议仲裁委员会',limit:'1 year',agencies:['劳动人事争议仲裁委员会','人力资源和社会保障局','劳动监察大队'],cite:[['劳动合同法','第47条','经济补偿 N'],['劳动合同法','第87条','违法解除赔偿 2N'],['劳动争议调解仲裁法','第27条','仲裁时效 1 年']]},
  SG:{name:'Singapore',law:'Employment Act',tribunal:'Employment Claims Tribunal',limit:'1 year',agencies:['ECT','MOM'],cite:[['Employment Act','s.20','Termination & notice']]},
  JP:{name:'Japan',law:'労働契約法',tribunal:'労働委員会',limit:'5 years',agencies:['労働委員会','厚生労働省'],cite:[['労働契約法','第16条','Abusive dismissal prohibited']]},
  KR:{name:'South Korea',law:'근로기준법',tribunal:'노동위원회',limit:'3 years',agencies:['노동위원회','고용노동부'],cite:[['근로기준법','제27조','Dismissal restrictions']]},
  IN:{name:'India',law:'Industrial Disputes Act 1947',tribunal:'Labour Court',limit:'3 years',agencies:['Labour Commissioner','Industrial Tribunal'],cite:[['IDA 1947','s.25F','Prior permission 100+ employees']]},
  MX:{name:'Mexico',law:'Ley Federal del Trabajo',tribunal:'Junta Local',limit:'2 months',agencies:['Junta Local','STPS'],cite:[['LFT','Art.47','Dismissal 3mo+20d/yr']]},
  AR:{name:'Argentina',law:'Ley de Contrato de Trabajo',tribunal:'Juzgado de Trabajo',limit:'2 years',agencies:['Juzgado de Trabajo','M Trabajo'],cite:[['LCT','Art.245','Indemnizacion por despido']]},
  BR:{name:'Brazil',law:'CLT',tribunal:'Vara do Trabalho',limit:'2 years',agencies:['Vara do Trabalho','M Trabajo'],cite:[['CLT','Art.477','Dismissal indemnity']]},
  NL:{name:'Netherlands',law:'Ontslagwet',tribunal:'Rechtbank / UWV',limit:'2 months',agencies:['UWV','SZW'],cite:[['Ontslagwet','','Dismissal needs court/UWV approval']]},
  SE:{name:'Sweden',law:'LAS',tribunal:'Arbetsdomstolen',limit:'4 months',agencies:['Arbetsdomstolen','AF'],cite:[['LAS','','Employment protection by tenure']]},
  CH:{name:'Switzerland',law:'Obligationenrecht',tribunal:'Arbeitsgericht',limit:'2 years',agencies:['Arbeitsgericht','Suva'],cite:[['OR','Art.336','Unfair dismissal protection']]},
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

// 构建 PDF 的 HTML 字符串（所有转义都做了，完全不用 null/undefined）
const pdfHtml = ref('')

function buildHtml(type) {
  const a = analysis.value || {}
  const comp = a.compensation || {}
  const c = CNT.value
  const cn = IS_CN.value
  const t = new Date().toISOString().split('T')[0]
  const fmt = x => (x ?? 'N/A')
  const esc = x => String(x ?? '').replace(/[<>&]/g, '')
  
  const css = `
    <style>
      * { box-sizing: border-box; }
      body { font-family: Inter, Arial, sans-serif; color: #1f2937; line-height: 1.7; padding: 0; margin: 0; }
      .hdr { color: #888; font-size: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 12px; }
      .ttl { font-size: 22px; font-weight: 700; color: #1e3c96; margin-bottom: 4px; }
      .sec-h { font-size: 13px; font-weight: 700; color: #1e3c96; margin-top: 18px; margin-bottom: 6px; }
      .line { font-size: 11px; margin: 2px 0; }
      .ftr { margin-top: 30px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #aaa; text-align: center; }
      hr { border: none; border-top: 1px solid #e5e7eb; margin: 8px 0; }
    </style>`

  let content = ''

  if (type === 'winReport') {
    content = `
      <div class="hdr">${esc(c.name)}  |  ${esc(c.law)}</div>
      <div class="ttl">${cn ? '胜诉概率分析报告' : `${c.name} Win Probability Report`}</div>
      <div class="sec-h">${cn ? '案件基本信息' : 'Case Overview'}</div>
      <div class="line">${cn?'企业名称':'Company'}: ${esc(a.companyName)}</div>
      <div class="line">${cn?'岗位职位':'Position'}: ${esc(a.jobTitle)}</div>
      <div class="line">${cn?'入职日期':'Hire Date'}: ${esc(a.hireDate)}</div>
      <div class="line">${cn?'离职日期':'End Date'}: ${esc(a.endDate || (cn?'在职':'Ongoing'))}</div>
      <div class="line">${cn?'月工资':'Monthly Salary'}: ${fmt(a.monthlySalary)}</div>
      <div class="line">${cn?'工龄':'Tenure'}: ${fmt(comp.tenure?.years)} yr ${fmt(comp.tenure?.months)} mo</div>
      <div class="line">${cn?'适用法律':'Applicable Law'}: ${esc(c.name)} - ${esc(c.law)}</div>
      
      <div class="sec-h">${cn ? '胜率预测' : 'Win Probability'}</div>
      <div class="line">${cn?'预估':'Estimated'}: <b>${fmt(a.winRate)}%</b></div>
      <div class="line">${cn?'评估方式':'Method'}: ${esc(a.confidence === 'AI-powered' ? 'AI + Rule Engine' : 'Rule-based')}</div>
      
      <div class="sec-h">${cn ? '赔偿估算' : 'Compensation Estimate'}</div>
      <div class="line">N (Severance): <b>${fmt(comp.severance)}</b></div>
      <div class="line">2N (Unfair Dismissal): <b>${fmt(comp.illegalTermination)}</b></div>
      <div class="line">+1 (Notice): <b>${fmt(a.monthlySalary || comp.notice)}</b></div>
      <div class="line">TOTAL DEMANDED: <b style="color:#1e3c96">${fmt(comp.estimatedTotal)}</b></div>
      
      <div class="sec-h">${cn ? '法律违规项' : 'Legal Violations'}</div>
      ${(a.violations || []).map(v => `<div class="line">[${esc((v.severity || 'MEDIUM').toUpperCase())}] ${esc(v.desc || v)}</div>`).join('')}
      
      <div class="sec-h">${cn ? '优势与劣势' : 'Strengths & Weaknesses'}</div>
      <div class="line">STRENGTHS:</div>
      ${(a.strengths || []).map(s => `<div class="line">  + ${esc(s)}</div>`).join('')}
      <div class="line">WEAKNESSES:</div>
      ${(a.weaknesses || []).map(s => `<div class="line">  - ${esc(s)}</div>`).join('')}
      
      <div class="sec-h">${cn ? '核心法条' : 'Key Legal Provisions'}</div>
      ${c.cite.map(([law, art, sum]) => `<div class="line">${esc(law)} ${esc(art)} - ${esc(sum)}</div>`).join('')}
      
      <div class="sec-h">${cn ? 'AI 建议' : 'AI Advice'}</div>
      <div class="line">${esc(a.advice || 'Consult a local attorney for personalized advice.')}</div>
      
      <div class="sec-h">${cn ? '下一步' : 'Next Steps'}</div>
      ${(a.nextSteps || []).map((s, i) => `<div class="line">${i+1}. ${esc(s)}</div>`).join('')}
    `
  } else if (type === 'demandLetter') {
    const spec = {
      GB: 'IMPORTANT: Under UK law, ACAS early conciliation is MANDATORY before filing an Employment Tribunal claim.',
      US: 'Pursuant to state labor law and federal FLSA, I formally demand settlement. WARN Act may apply for mass layoffs.',
      DE: 'Gemass dem Kundigungsschutzgesetz (KSchG) verlange ich hiermit ausdrücklich...',
      CN: '如贵司未在14日内支付，本人将依法向劳动人事争议仲裁委员会申请仲裁，并保留向劳动监察大队投诉举报的权利。',
    }[country.value] || (cn ? '依据当地劳动法，特此正式要求。' : 'Pursuant to local employment law, I hereby formally demand...')

    content = `
      <div class="hdr">${esc(c.name)}  |  ${esc(c.law)}</div>
      <div class="ttl">${cn ? '正式法律催讨函' : 'Formal Legal Demand Letter'}</div>
      <div class="line">Date: ${esc(t)}</div>
      <hr>
      <div class="line"><b>TO:</b> ${esc(a.companyName)}</div>
      <div class="line">[Company Address]</div>
      <div class="line" style="margin-top:10px"><b>FROM:</b> ${esc(a.userName)}</div>
      <div class="line">[Your Address]</div>
      <div class="line">[Email / Phone]</div>
      <hr>
      <div class="line"><b>${cn?'主题':'RE'}:</b> ${cn ? `${esc(c.name)} ${esc(c.law)} 项下解雇赔偿正式要求` : `Demand for Employment Compensation (${esc(c.name)})`}</div>
      <hr>
      <div class="line" style="margin-top:10px">${cn ? '尊敬的先生/女士：' : 'Dear Sir/Madam,'}</div>
      <div class="line" style="margin-top:6px">${cn ? `本人就${esc(a.companyName)}单方面终止劳动关系一事正式致函。事实如下：` : `I am writing regarding termination of employment with ${esc(a.companyName)}. Facts:`}</div>
      <div class="line">1. Hire: ${esc(a.hireDate)}</div>
      <div class="line">2. End: ${esc(a.endDate || 'Ongoing')}</div>
      <div class="line">3. Monthly Salary: ${fmt(a.monthlySalary)}</div>
      <hr>
      <div class="line" style="color:#1e3c96;font-weight:600">${esc(spec)}</div>
      <hr>
      <div class="line" style="margin-top:6px"><b>${cn?'金额计算':'Calculation'}:</b></div>
      <div class="line">  N (Severance): ${fmt(comp.severance)}</div>
      <div class="line">  2N (Unfair Dismissal): ${fmt(comp.illegalTermination)}</div>
      <div class="line">  +1 (Notice): ${fmt(a.monthlySalary)}</div>
      <div class="line">  <b>TOTAL DEMANDED: ${fmt(comp.estimatedTotal)}</b></div>
      <hr>
      <div class="line" style="margin-top:6px">${cn ? `请于14日内支付。逾期将向${esc(c.tribunal)}提交，并向 ${esc(c.agencies.join('、'))} 投诉。` : `Payment requested within 14 days. Otherwise I will file with ${esc(c.tribunal)} and complain to ${esc(c.agencies.join(', '))}.`}</div>
      <div class="line" style="margin-top:16px">${cn ? '此致' : 'Sincerely,'}</div>
      <div class="line" style="margin-top:20px;border-top:1px solid #999;width:250px"></div>
      <div class="line">${esc(a.userName || '[Your Signature]')}</div>
    `
  } else { // tribunalFiling
    content = `
      <div class="hdr">${esc(c.name)}  |  ${esc(c.law)}</div>
      <div class="ttl">${cn ? `${esc(c.tribunal)} 提交指南` : `${esc(c.tribunal)} Filing Guide`}</div>
      
      <div class="sec-h">${cn ? '概述' : 'Overview'}</div>
      <div class="line">${esc(c.name)} - ${esc(c.law)}</div>
      <div class="line">${cn?'受理机构':'Tribunal'}: ${esc(c.tribunal)}</div>
      <div class="line">${cn?'时效':'Deadline'}: <b style="color:#dc2626">${esc(c.limit)}</b></div>
      
      <div class="sec-h">${cn ? '第一步：收集证据' : 'Step 1: Gather Evidence'}</div>
      <div class="line">• Employment contract / 劳动合同</div>
      <div class="line">• Payslips (last 6-12 months) / 工资条</div>
      <div class="line">• Dismissal notice / 解雇通知</div>
      <div class="line">• Emails & communications / 沟通记录</div>
      <div class="line">• Performance reviews / 绩效考核</div>
      <div class="line">• Offer letters / Offer letter</div>
      
      <div class="sec-h">${cn ? '第二步：确认时效（切勿错过！）' : 'Step 2: Know Your Deadline (CRITICAL!)'}</div>
      <div class="line" style="color:#dc2626;font-weight:600">${esc(c.name)}: ${esc(c.limit)}</div>
      <div class="line">${cn ? '超过时效将失去所有索赔权利！' : 'Missing this forfeits ALL claims - act NOW!'}</div>
      
      <div class="sec-h">${cn ? '第三步：先调解' : 'Step 3: Try Mediation First'}</div>
      <div class="line">${esc(c.name)} ${cn?'调解/建议机构':'mediation agencies'}:</div>
      ${c.agencies.map(x => `<div class="line">• ${esc(x)}</div>`).join('')}
      
      <div class="sec-h">${cn ? '第四步：准备申请' : 'Step 4: Prepare Application'}</div>
      <div class="line">• Official claim form (from ${esc(c.tribunal)})</div>
      <div class="line">• Copy of ID / passport / 身份证</div>
      <div class="line">• Full evidence package (Step 1)</div>
      <div class="line">• Damage calculation with supporting docs</div>
      <div class="line">• Filing fee (often waived for low-income)</div>
      
      <div class="sec-h">${cn ? '第五步：正式提交' : 'Step 5: File the Claim'}</div>
      <div class="line">File with: <b>${esc(c.tribunal)}</b></div>
      <div class="line">Related: ${esc(c.agencies.join(', '))}</div>
      <div class="line">Methods: Mail / Online portal / In-person. Use registered mail for proof.</div>
      
      <div class="sec-h">${cn ? '第六步：准备庭审' : 'Step 6: Prepare for Hearing'}</div>
      <div class="line">• Evidence organized chronologically</div>
      <div class="line">• Clear 5-minute oral summary</div>
      <div class="line">• Practice explaining your case</div>
      <div class="line">• Bring 2-3 copies of ALL documents</div>
      
      <div class="sec-h">${cn ? '预估时间' : 'Estimated Timeline'}</div>
      <div class="line">• Filing to first hearing: 2-6 months</div>
      <div class="line">• Full process: 6-18 months</div>
      <div class="line">• Settlement possible at any stage</div>
      
      <div class="sec-h">${cn ? '核心法条' : 'Key Legal Provisions'}</div>
      ${c.cite.map(([l,a,s]) => `<div class="line">${esc(l)} ${esc(a)} - ${esc(s)}</div>`).join('')}
      
      <div class="sec-h">${cn ? '有用资源' : 'Helpful Resources'}</div>
      <div class="line">• ${esc(c.tribunal)} official website</div>
      ${c.agencies.map(x => `<div class="line">• ${esc(x)}</div>`).join('')}
      <div class="line">• Local legal aid clinic (free for low-income)</div>
      
      <div class="sec-h">${cn ? '重要提醒' : 'Important Notice'}</div>
      <div class="line" style="color:#dc2626;font-size:10px">${cn ? '本指南为 AI 自动生成，不构成法律意见。金额较大或案情复杂时，请咨询当地执业律师。' : 'AI-generated for reference only and does not constitute legal advice. Consult a local licensed attorney for significant or complex matters.'}</div>
    `
  }

  return css + content + `<div class="ftr">Legal AI  |  ${esc(c.name)}  |  Page 1</div>`
}

async function download(type) {
  try {
    loading.value = type
    
    // 1. 构建 HTML
    pdfHtml.value = buildHtml(type)
    
    // 2. 等 DOM 渲染
    await nextTick()
    
    // 3. html2canvas 截图
    const canvas = await html2canvas(pdfTarget.value, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false
    })
    
    // 4. jsPDF 塞入 canvas 图片（A4 竖版）
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const imgW = pageW
    const imgH = (canvas.height * imgW) / canvas.width
    
    // 如果内容超过一页，分页塞
    let heightLeft = imgH
    let position = 0
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgW, imgH)
    heightLeft -= pageH
    
    while (heightLeft > 0) {
      position = heightLeft - imgH
      doc.addPage()
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgW, imgH)
      heightLeft -= pageH
    }
    
    // 5. 下载
    const fn = `legal-ai-${country.value}-${type}-${Date.now()}.pdf`
    doc.save(fn)
    
  } catch (err) {
    console.error('PDF ERROR:', err)
    alert('PDF failed: ' + (err.message || String(err)))
  } finally {
    loading.value = null
  }
}
</script>
