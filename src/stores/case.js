// ============================================================
//  Pinia Store —— 全局案件状态
// ============================================================
import { defineStore } from 'pinia'

export const useCaseStore = defineStore('case', {
  state: () => ({
    form: {
      userName: '',
      companyName: '',
      hireDate: '',
      endDate: '',
      monthlySalary: '',
      country: 'GB',        // 默认英国（可用 en/es/fr/de/it 等）
      description: '',
      unpaidWages: 0,
      currency: 'EUR',
      evidence: [],
      ocrExtracts: [],
    },
    analysis: null,         // 后端返回的分析结果
    paid: false,            // 是否已付费解锁
    paypalOrderId: null,
    pendingForm: null,      // 提交时的完整 payload
  }),
  getters: {
    totalAmount: (s) => s.analysis?.compensation?.estimatedTotal || 0,
    winRate: (s) => s.analysis?.winRate || 0,
    isAnalyzed: (s) => !!s.analysis,
  },
  actions: {
    setForm(key, value) { this.form[key] = value },
    updateForm(patch) { Object.assign(this.form, patch) },
    setAnalysis(a) { this.analysis = a },
    markPaid() { this.paid = true },
    clearAnalysis() { this.analysis = null },
  }
})
