<template>
  <div class="max-w-3xl mx-auto px-4 py-12">
    <!-- Hero -->
    <div class="text-center mb-10">
      <div class="text-6xl mb-4">☕</div>
      <h1 class="text-3xl font-extrabold text-gray-800 mb-2">{{ t('donate.title') }}</h1>
      <p class="text-gray-600 max-w-md mx-auto">{{ t('donate.subtitle') }}</p>
    </div>

    <!-- Amount picker -->
    <div class="card mb-6">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-center">
        {{ t('donate.pickAmount') }}
      </h3>
      <div class="flex flex-wrap justify-center gap-3">
        <button
          v-for="amt in amounts"
          :key="amt"
          :class="[
            'px-6 py-3 rounded-xl font-bold transition-all border-2',
            selected === amt
              ? 'bg-primary-600 text-white border-primary-600 shadow-lg scale-105'
              : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400 hover:shadow'
          ]"
          @click="selected = amt"
        >
          {{ amt === 0.5 ? '☕ ' : amt === 2 ? '🍺 ' : amt === 5 ? '🍜 ' : amt === 10 ? '🍔 ' : '' }}
          €{{ amt }}
        </button>
      </div>
      <div class="text-center mt-4">
        <label class="text-xs text-gray-400 block mb-1">{{ t('donate.custom') }}</label>
        <div class="inline-flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-primary-500">
          <span class="px-3 text-gray-500 font-semibold bg-gray-50">€</span>
          <input
            type="number"
            min="1"
            max="999"
            class="px-3 py-2 outline-none w-28 text-center font-bold"
            :value="customAmount"
            @input="customAmount = Number($event.target.value)"
            @focus="selected = -1"
          />
        </div>
      </div>
    </div>

    <!-- Ko-fi / Stripe / Crypto 三种方式 -->
    <div class="space-y-4">

      <!-- 🥇 Ko-fi 主按钮（免费 + 欧美最火）-->
      <a
        :href="kofiLink"
        target="_blank"
        rel="noopener"
        class="block text-center bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
      >
        <span class="text-xl mr-2">☕</span>
        {{ t('donate.payButton', { amount: `€${displayAmount}` }) }}
      </a>

      <p class="text-center text-xs text-gray-400">
        {{ t('donate.secure') }} · Ko-fi · 500万+ 创作者在用
      </p>

      <!-- 🥈 其他方式 -->
      <div class="flex items-center gap-3 py-2">
        <div class="flex-1 border-t border-gray-200"></div>
        <span class="text-xs text-gray-400">{{ t('donate.or') || '或者' }}</span>
        <div class="flex-1 border-t border-gray-200"></div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <!-- Stripe Payment Link -->
        <a
          :href="stripeLink"
          target="_blank"
          rel="noopener"
          class="flex flex-col items-center gap-1 py-3 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
        >
          <span class="text-xl">💳</span>
          <span class="text-xs font-semibold text-gray-700">Stripe</span>
          <span class="text-[10px] text-gray-400">信用卡/Apple Pay</span>
        </a>

        <!-- 加密货币 -->
        <button
          @click="showCrypto = !showCrypto"
          class="flex flex-col items-center gap-1 py-3 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all"
        >
          <span class="text-xl">🪙</span>
          <span class="text-xs font-semibold text-gray-700">Crypto</span>
          <span class="text-[10px] text-gray-400">BTC / ETH / USDT</span>
        </button>
      </div>
    </div>

    <!-- 加密货币展开 -->
    <div v-if="showCrypto" class="card mt-4 bg-gray-50 border border-dashed border-gray-300">
      <h4 class="text-sm font-bold text-gray-700 mb-3 text-center">🪙 加密货币地址（匿名）</h4>
      <div class="space-y-2 text-xs">
        <div v-for="c in cryptoAddresses" :key="c.coin" class="bg-white rounded-lg p-2 border border-gray-100">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-gray-700">{{ c.coin }}</span>
            <span class="text-gray-400">{{ c.network }}</span>
          </div>
          <div class="font-mono text-[10px] text-gray-500 break-all mt-1">{{ c.address }}</div>
          <button
            @click="copyAddress(c.address)"
            class="mt-1 text-[10px] text-primary-600 hover:text-primary-700 font-semibold"
          >{{ copied === c.coin ? '✓ 已复制' : '复制地址' }}</button>
        </div>
      </div>
    </div>

    <!-- 微信/支付宝（国内用户）-->
    <div class="mt-6 text-center">
      <div class="inline-flex items-center gap-4 px-5 py-3 bg-gray-50 rounded-2xl text-gray-500 text-sm border border-gray-100">
        <span>💡</span>
        <span>{{ t('donate.cryptoHint') }}</span>
      </div>
    </div>

    <!-- Thanks -->
    <div class="mt-8 text-center text-xs text-gray-400">
      {{ t('donate.thanks') }} ❤️
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

/* ════════════════════════════════════════════════════════════
 *  ⚠️ TODO：改成你自己的打赏地址
 *  Ko-fi 注册：https://ko-fi.com/signup （免费 2 分钟）
 *  Stripe Payment Link：https://dashboard.stripe.com/payment-links
 *  ════════════════════════════════════════════════════════════ */
const KOFI_USER = 'lcicye'              // ← 改成你的 Ko-fi 用户名
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/demo' // ← 改成你的 Stripe Payment Link

const cryptoAddresses = [
  { coin: 'Bitcoin',     network: 'BTC',      address: 'bc1qYOUR_BTC_ADDRESS_HERE' },
  { coin: 'Ethereum',    network: 'ERC-20',   address: '0xYOUR_ETH_ADDRESS_HERE' },
  { coin: 'USDT',        network: 'TRC-20',   address: 'TYOUR_TRON_ADDRESS_HERE' },
]

/* ──────────────────────────────────────── */

const amounts = [0.5, 2, 5, 10, 20]
const selected = ref(5)
const customAmount = ref(5)
const showCrypto = ref(false)
const copied = ref('')

const displayAmount = computed(() => {
  if (selected.value >= 0) return selected.value
  return customAmount.value || 5
})

// Ko-fi 支持通过 URL 参数预设金额
// https://ko-fi.com/legalai?donate_amount=5
const kofiLink = computed(() => {
  const amt = displayAmount.value
  return `https://ko-fi.com/${KOFI_USER}?donate_amount=${amt}&currency=EUR`
})

const stripeLink = computed(() => STRIPE_PAYMENT_LINK)

function copyAddress(addr) {
  navigator.clipboard.writeText(addr)
  copied.value = addr.slice(0, 8)
  setTimeout(() => copied.value = '', 2000)
}
</script>
