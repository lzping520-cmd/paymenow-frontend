// GET /api/health
export default async function handler(req, res) {
  res.json({
    code: 0,
    data: {
      status: 'ok',
      version: '2.1.0',
      time: new Date().toISOString(),
      services: { ai: 'qwenself-hosted', paypal: 'sandbox' },
      langs: ['en','es','fr','de','it','zh'],
      countries: 20
    }
  })
}
