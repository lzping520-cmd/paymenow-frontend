<template>
  <div class="max-w-3xl mx-auto px-4 py-10">
    <h1 class="section-title text-3xl text-center">{{ t('pay.choosePlan') }}</h1>

    <div class="grid md:grid-cols-3 gap-6 mt-10">
      <div v-for="plan in plans" :key="plan.id"
        :class="['card relative transition-all cursor-pointer', selected === plan.id ? 'ring-2 ring-primary-600 shadow-xl -translate-y-1' : 'hover:shadow-lg']"
        @click="selected = plan.id">
        <div v-if="plan.recommended" class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">{{ t('home.stat3Val') }}</div>
        <div class="text-lg font-bold text-gray-800">{{ t(`pay.plan${plan.label}`) }}</div>
        <p class="text-xs text-gray-500 mt-1 h-8">{{ t(`pay.plan${plan.label}Desc`) }}</p>
        <div class="my-4">
          <span class="text-3xl font-extrabold text-primary-700">{{ formatPrice(plan.price) }}</span>
          <span class="text-xs text-gray-400 ml-1">{{ t('pay.oneTime') }}</span>
        </div>
        <div class="h-1 rounded bg-gray-100 mb-4"></div>
        <ul class="text-sm text-gray-600 space-y-1.5">
          <li v-for="(f, i) in plan.features" :key="i">✓ {{ f }}</li>
        </ul>
      </div>
    </div>

    <!-- PayPal Button -->
    <div class="mt-10 max-w-md mx-auto">
      <div class="card bg-gray-50 border-gray-200">
        <div id="paypal-button-container" v-if="!processing"></div>
        <div v-else class="text-center py-8 text-gray-600">
          <div class="text-2xl animate-spin mb-2">⏳</div>
          {{ t('pay.processing') }}
        </div>

        <!-- Demo mode fallback (no PayPal account setup) -->
        <button v-if="isDemo" class="w-full mt-3 btn-secondary" @click="mockPay">
          {{ t('pay.demoMode') }}
        </button>
      </div>
      <p class="text-xs text-center text-gray-400 mt-4">
        {{ t('footer.tagline') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { createPaypalOrder, capturePaypalOrder, health } from '../api'
import { useCaseStore } from '../stores/case'

const { t } = useI18n()
const router = useRouter()
const store = useCaseStore()

const plans = [
  { id: 'basic',    label: 'Basic',    price: 0,    features: ['Win probability breakdown', 'Compensation calculation'] },
  { id: 'standard', label: 'Standard', price: 19.9, recommended: true, features: ['+ PDF demand letter', '+ Arbitration guide', '+ Legal citations'] },
  { id: 'premium',  label: 'Premium',  price: 39.9, features: ['+ AI-optimized arguments', '+ 1 lawyer Q&A email', '+ Priority email support'] },
]

const selected = ref('standard')
const processing = ref(false)
const isDemo = ref(true)

function formatPrice(p) {
  if (p === 0) return t('common.free')
  return `€${p}`
}

// Check if PayPal is configured
onMounted(async () => {
  try {
    const h = await health()
    isDemo.value = h.data?.services?.pay !== 'configured'
  } catch {}

  // Load PayPal SDK if real mode
  if (!isDemo.value && !document.getElementById('paypal-js')) {
    const s = document.createElement('script')
    s.id = 'paypal-js'
    s.src = 'https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=EUR'
    s.async = true
    s.onload = () => renderPaypalButton()
    document.head.appendChild(s)
  } else {
    renderPaypalButton()
  }
})

watch(selected, renderPaypalButton)

function renderPaypalButton() {
  const container = document.getElementById('paypal-button-container')
  if (!container) return
  container.innerHTML = ''

  if (isDemo.value || typeof window.paypal === 'undefined') return

  window.paypal.Buttons({
    createOrder: async () => {
      const r = await createPaypalOrder({ productId: selected.value, currency: 'EUR' })
      if (r.code !== 0) throw new Error(r.msg)
      store.paypalOrderId = r.data.paypalOrderId
      return r.data.paypalOrderId
    },
    onApprove: async (data) => {
      processing.value = true
      const r = await capturePaypalOrder(store.paypalOrderId)
      if (r.code === 0) {
        store.markPaid()
        router.replace({ name: 'document' })
      } else {
        alert(r.msg || 'Payment failed')
      }
      processing.value = false
    },
    onError: (err) => alert(err?.message || t('errors.paypal'))
  }).render('#paypal-button-container')
}

async function mockPay() {
  store.markPaid()
  router.replace({ name: 'document' })
}
</script>
