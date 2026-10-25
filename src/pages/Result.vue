<template>
  <div class="max-w-3xl mx-auto px-4 py-10">
    <!-- Win Card -->
    <div :class="['rounded-3xl p-8 text-center shadow-lg mb-6', winClass]">
      <div class="text-white/80 text-sm font-semibold mb-2">🏆 {{ t('result.winTitle') }}</div>
      <div class="text-6xl font-extrabold text-white">{{ analysis.winRate }}%</div>
      <div class="text-white/90 mt-2">{{ winTip }}</div>
    </div>

    <!-- Violations -->
    <div class="card mb-6" v-if="analysis.caseTypes?.length">
      <h2 class="section-title text-xl">🔍 {{ t('result.violations') }}</h2>
      <div class="space-y-3">
        <div v-for="(v, i) in analysis.caseTypes" :key="i" class="bg-red-50 border-l-4 border-danger rounded-r-xl p-4">
          <div class="font-semibold text-gray-800">{{ v.name }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ v.legalBasis }}</div>
        </div>
      </div>
    </div>

    <!-- Compensation -->
    <div class="card mb-6">
      <h2 class="section-title text-xl">💰 {{ t('result.compensation') }}</h2>
      <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
        <span>{{ t('result.tenure') }}</span>
        <span class="text-gray-700 font-medium">{{ analysis.tenure.years }}年{{ analysis.tenure.months }}{{ t('result.months') }}</span>
      </div>
      <div class="divide-y border-t border-b border-gray-100">
        <div v-for="s in analysis.compensation.scenarios" :key="s.type" class="py-3 flex items-center justify-between">
          <div>
            <div class="font-medium text-gray-800">{{ s.name }}</div>
            <div class="text-xs text-gray-400">{{ s.formula }}</div>
          </div>
          <div class="font-bold text-primary-700">{{ formatCurrency(s.amount ?? s.amountN1 ?? s.amountN2 ?? 0) }}</div>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span class="font-semibold text-gray-700">{{ t('result.totalLabel') }}</span>
        <span class="text-2xl font-extrabold text-primary-700">{{ formatCurrency(store.totalAmount) }}</span>
      </div>
    </div>

    <!-- Legal Basis -->
    <div class="card mb-6" v-if="analysis.legalBasis?.length">
      <h2 class="section-title text-xl">📚 {{ t('result.legalBasis') }}</h2>
      <div class="flex flex-wrap gap-2">
        <span v-for="(lb, i) in analysis.legalBasis" :key="i" class="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm">{{ lb }}</span>
      </div>
    </div>

    <!-- AI Advice -->
    <div class="card mb-6" v-if="aiAdvice">
      <h2 class="section-title text-xl">🤖 {{ t('result.aiAdvice') }}</h2>
      <p class="text-gray-700 whitespace-pre-line">{{ aiAdvice }}</p>
      <div v-if="evidenceSuggestions.length" class="mt-4 p-4 bg-amber-50 rounded-xl">
        <div class="text-sm font-semibold text-amber-800 mb-2">{{ t('result.evidenceTip') }}</div>
        <ul class="space-y-1 text-sm text-amber-700 list-disc list-inside">
          <li v-for="(e, i) in evidenceSuggestions" :key="i">{{ e }}</li>
        </ul>
      </div>
    </div>

    <!-- Arbitration Claims -->
    <div class="card mb-6">
      <h2 class="section-title text-xl">📄 {{ t('result.arbitration') }}</h2>
      <p class="text-sm text-gray-500 mb-4">{{ t('result.arbitrationSub') }}</p>
      <div class="space-y-2">
        <div v-for="r in analysis.arbitrationRequests" :key="r.id" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <div class="text-sm"><span class="text-gray-400 mr-2">{{ r.id }}.</span>{{ r.item }}</div>
          <div class="font-bold text-gray-700">{{ formatCurrency(r.amount) }}</div>
        </div>
      </div>
      <router-link to="/document" class="btn-primary w-full mt-6 flex justify-center">📥 {{ t('result.downloadPdf') }}</router-link>
      <p class="text-xs text-center text-gray-400 mt-2">{{ t('result.downloadPdfTip') }}</p>
    </div>

    <!-- Lawyer Entry -->
    <div class="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 text-center" v-if="store.totalAmount >= 30000">
      <p class="font-semibold text-amber-800">💼 {{ t('result.highAmount') }}</p>
      <router-link to="/lawyer" class="text-primary-700 font-medium hover:underline">{{ t('result.contactLawyer') }}</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCaseStore } from '../stores/case'

const { t } = useI18n()
const router = useRouter()
const store = useCaseStore()

const analysis = computed(() => store.analysis)
onMounted(() => {
  if (!analysis.value) router.replace({ name: 'form' })
})

const winRate = computed(() => analysis.value?.winRate || 0)
const winClass = computed(() => {
  if (winRate.value >= 70) return 'bg-gradient-to-br from-success to-emerald-600'
  if (winRate.value >= 50) return 'bg-gradient-to-br from-warning to-amber-600'
  return 'bg-gradient-to-br from-danger to-red-700'
})
const winTip = computed(() => {
  if (winRate.value >= 70) return t('result.win80plus')
  if (winRate.value >= 50) return t('result.win50to80')
  return t('result.winBelow50')
})

const ai = computed(() => analysis.value?.aiEnhanced || {})
const aiAdvice = computed(() => ai.value.legalAdvice || '')
const evidenceSuggestions = computed(() => Array.isArray(ai.value.evidenceSuggestions) ? ai.value.evidenceSuggestions : [])

function formatCurrency(n) {
  if (n == null || isNaN(n)) return '€0'
  return new Intl.NumberFormat(store.form?.currency === 'JPY' ? 'ja-JP' : 'en-US', {
    style: 'currency',
    currency: store.form?.currency || 'EUR',
    maximumFractionDigits: 0
  }).format(Number(n))
}
</script>
