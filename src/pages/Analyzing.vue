<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4">
    <div class="card w-full max-w-lg text-center">
      <div class="text-6xl mb-6 animate-pulse">🤖</div>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">{{ t('analyzing.title') }}</h1>
      <p class="text-gray-500 mb-8">{{ t('analyzing.sub') }}</p>

      <div class="space-y-3 text-left max-w-sm mx-auto">
        <div v-for="(step, i) in steps" :key="i" class="flex items-center gap-3 text-sm">
          <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all', i === currentStep ? 'bg-primary-600 text-white scale-110' : i < currentStep ? 'bg-success text-white' : 'bg-gray-200 text-gray-400']">
            {{ i < currentStep ? '✓' : i + 1 }}
          </div>
          <span :class="{ 'font-semibold': i === currentStep, 'text-gray-400': i > currentStep }">{{ t(`analyzing.step${i+1}`) }}</span>
        </div>
      </div>

      <div class="mt-8 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div class="h-full bg-primary-600 rounded-full transition-all duration-500" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useCaseStore } from '../stores/case'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const store = useCaseStore()

const currentStep = ref(0)
const progress = ref(0)
const steps = [1, 2, 3, 4]

let timer = null
onMounted(() => {
  const interval = setInterval(() => {
    if (currentStep.value < 4) {
      currentStep.value++
      progress.value = currentStep.value * 25
    }
  }, 1200)
  // 如果已有分析结果（可能从其他地方跳来的），直接跳 result
  if (store.analysis) {
    setTimeout(() => router.replace({ name: 'result' }), 500)
  } else {
    timer = setTimeout(() => router.replace({ name: 'result' }), 5000)
  }
})
onUnmounted(() => { clearTimeout(timer) })
</script>
