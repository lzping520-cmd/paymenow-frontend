// POST /api/ocr/text — 简单规则提取关键信息
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 1, msg: 'Method not allowed' })
  
  const { text = '' } = req.body || {}
  const extract = {
    companyName: text.match(/(?:甲方|公司|employer|company)[：:\s]*([\u4e00-\u9fa5A-Za-z0-9\-\.]+(?:公司|Ltd|Inc|Co))/i)?.[1] || null,
    hireDate: text.match(/(\d{4})[年\-\/\s](\d{1,2})[月\-\/\s](\d{1,2})[日号]?/)?.[0] || null,
    monthlySalary: text.match(/(?:月工资|月薪|salary)[：:\s]*([\d,]+(?:\.\d+)?)/i)?.[1]?.replace(/,/g, '') || null,
    position: text.match(/(?:岗位|职位|position)[：:\s]*([\u4e00-\u9fa5A-Za-z]+)/i)?.[1] || null,
    hasContract: /劳动合同|contract/i.test(text),
    hasPayslip: /工资条|pay|payslip/i.test(text),
  }
  
  res.json({ code: 0, data: { extracted: extract, rawLength: text.length } })
}
