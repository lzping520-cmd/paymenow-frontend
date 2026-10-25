// POST /api/document/generate
// 返回结构化法律文书 JSON，前端用 jsPDF 渲染
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 1, msg: 'Method not allowed' })
  
  const { analysis, type = 'arbitration' } = req.body || {}
  const basic = analysis?.basicInfo || {}
  const requests = analysis?.arbitrationRequests || []
  
  const documents = {
    arbitration: {
      title: '劳动仲裁申请书 / Arbitration Application',
      language: 'bilingual',
      sections: [
        { heading: '申请人 / Applicant', content: `${basic.userName || '[Your Name]'}` },
        { heading: '被申请人 / Respondent', content: `${basic.companyName || '[Company]'}` },
        { heading: '入职日期 / Hire Date', content: basic.hireDate || '' },
        { heading: '离职日期 / End Date', content: basic.endDate || '' },
        { heading: '月工资 / Monthly Salary', content: basic.monthlySalary || '' },
        { heading: '工龄 / Tenure', content: `${basic.totalMonths || 0} months` },
        { heading: '仲裁请求 / Claims', content: requests.map(r => `• ${r.item}: ¥${r.amount || r.value || 0}`).join('\n') },
        { heading: '事实与理由 / Facts & Reasons', content: '详见 AI 分析报告 / See AI Analysis Report' },
        { heading: '胜率预测 / Win Rate', content: `${basic.winRate || 75}%` },
      ]
    }
  }
  
  res.json({ code: 0, data: { document: documents[type] || documents.arbitration, generatedAt: new Date().toISOString() } })
}
