// GET /api/country/:code
const COUNTRIES = {
  US: { name: 'United States', currency: 'USD', law: 'At-Will Employment', minNotice: 'State-dependent' },
  GB: { name: 'United Kingdom', currency: 'GBP', law: 'Employment Rights Act 1996', minNotice: '1 week/year (max 12)' },
  DE: { name: 'Germany', currency: 'EUR', law: 'Kündigungsschutzgesetz', minNotice: '7 weeks (min)' },
  FR: { name: 'France', currency: 'EUR', law: 'Code du Travail', minNotice: '1-3 months' },
  ES: { name: 'Spain', currency: 'EUR', law: 'Estatuto de los Trabajadores', minNotice: '15 days' },
  IT: { name: 'Italy', currency: 'EUR', law: 'Statuto dei Lavoratori', minNotice: 'Law 604/66' },
  CN: { name: 'China', currency: 'CNY', law: '劳动合同法', minNotice: '30 days' },
  SG: { name: 'Singapore', currency: 'SGD', law: 'Employment Act', minNotice: '1-4 weeks' },
  CA: { name: 'Canada', currency: 'CAD', law: 'Provincial Labor Codes', minNotice: '1-8 weeks' },
  AU: { name: 'Australia', currency: 'AUD', law: 'Fair Work Act 2009', minNotice: '1-4 weeks' },
}
export default async function handler(req, res) {
  const code = (req.url?.split('/').pop() || '').toUpperCase()
  res.json({ code: 0, data: COUNTRIES[code] || COUNTRIES })
}
