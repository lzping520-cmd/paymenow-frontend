// POST /api/paypal/create
// POST /api/paypal/capture/:id
// POST /api/paypal/mock-success
// GET /api/paypal/status/:id

const ORDERS = new Map() // 临时存储（Serverless 下次会清，演示用）

export default async function handler(req, res) {
  const { method, url, body } = req
  
  if (method === 'POST' && url?.includes('/create')) {
    const { productId = 'basic', currency = 'EUR' } = body || {}
    const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    ORDERS.set(orderId, { id: orderId, productId, currency, status: 'CREATED', createdAt: Date.now() })
    
    // Demo 模式：直接返回 approval_url，点击即可支付
    const paypalClientId = process.env.PAYPAL_CLIENT_ID
    if (!paypalClientId || process.env.PAYPAL_ENV === 'demo') {
      // 演示模式 —— 前端会显示 "Click to pay (demo mode)"
      return res.json({
        code: 0,
        data: {
          paypalOrderId: orderId,
          approvalUrl: `/api/paypal/mock-success?orderId=${orderId}`,
          status: 'DEMO_MODE',
          message: 'Demo mode — click button to unlock instantly'
        }
      })
    }
    
    // 真实 PayPal REST API 调用（生产环境）
    try {
      const r = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
          ).toString('base64')
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: productId,
            amount: { currency_code: currency, value: productId === 'premium' ? '19.90' : '9.90' }
          }]
        })
      })
      const data = await r.json()
      const approvalUrl = data.links?.find(l => l.rel === 'approve')?.href
      ORDERS.set(orderId, { ...ORDERS.get(orderId), paypalOrderId: data.id })
      res.json({ code: 0, data: { paypalOrderId: data.id, approvalUrl } })
    } catch (err) {
      res.status(500).json({ code: 1, msg: 'PayPal error: ' + err.message })
    }
    return
  }
  
  if (method === 'POST' && url?.includes('/capture')) {
    const orderId = url.split('/').pop()
    res.json({ code: 0, data: { orderId, status: 'CAPTURED', message: 'Payment captured (mock)' } })
    return
  }
  
  if (method === 'POST' && url?.includes('/mock-success')) {
    const orderId = new URL(req.url, 'http://x').searchParams.get('orderId') || body?.orderId
    ORDERS.set(orderId, { ...ORDERS.get(orderId), status: 'PAID', paidAt: Date.now() })
    res.json({ code: 0, data: { orderId, status: 'PAID', unlocked: true } })
    return
  }
  
  res.status(404).json({ code: 1, msg: 'Not found' })
}
