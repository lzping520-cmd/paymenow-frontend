// ============================================================
//  API 客户端 —— 统一封装 axios
//  生产环境同域（Vercel Serverless），开发环境代理到 localhost:3000
// ============================================================
import axios from 'axios'
import { getLocale } from '../i18n'

// 生产环境用相对路径（同域 Vercel Serverless Functions）
// 开发环境用 localhost:3000（后端 Express）
const API_BASE = import.meta.env.VITE_API_BASE || ''

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
})

// 请求拦截：注入 locale
api.interceptors.request.use(config => {
  config.headers['X-Locale'] = getLocale()
  return config
})

// 响应拦截：统一错误
api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.msg || err.message || 'Network error. Please try again.'
    return Promise.reject(new Error(msg))
  }
)

// 案件分析
export function analyzeCase(payload) {
  return api.post('/api/analyze', payload).then(r => r.data)
}

// OCR 图片上传（开发环境用，Vercel Serverless 里用前端 OCR 兜底）
export function ocrFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/api/ocr/file', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}

// OCR 文本解析
export function ocrText(text) {
  return api.post('/api/ocr/text', { text }).then(r => r.data)
}

// 生成 PDF 文书 JSON（前端渲染）
export function generateDocument({ analysis, type = 'arbitration' }) {
  return api.post('/api/document/generate', { analysis, type }).then(r => r.data)
}

// PayPal 创建订单
export function createPaypalOrder({ productId = 'basic', currency = 'EUR' }) {
  return api.post('/api/paypal/create', { productId, currency }).then(r => r.data)
}

// PayPal 捕获支付
export function capturePaypalOrder(orderId) {
  return api.post(`/api/paypal/capture/${orderId}`).then(r => r.data)
}

// PayPal 演示模式一键过
export function mockPaypalSuccess(orderId) {
  return api.post('/api/paypal/mock-success', { orderId }).then(r => r.data)
}

// 健康检查
export function health() {
  return api.get('/api/health').then(r => r.data)
}

// 国家信息
export function getCountryInfo(countryCode) {
  return api.get(`/api/country/${countryCode}`).then(r => r.data)
}

export { API_BASE }
export default api
