<template>
  <div class="max-w-3xl mx-auto px-4 py-10">
    <h1 class="section-title text-3xl text-center mb-8">{{ t('document.title') }}</h1>

    <div class="grid md:grid-cols-2 gap-4">
      <div v-for="(doc, i) in docs" :key="i" class="card flex items-center gap-4">
        <div class="text-3xl">{{ doc.icon }}</div>
        <div class="flex-1">
          <div class="font-bold text-gray-800">{{ t(`document.${doc.key}`) }}</div>
          <div class="text-xs text-gray-500">{{ doc.desc }}</div>
        </div>
        <button class="btn-secondary text-sm py-2 px-4" @click="download(doc.key)">
          {{ t('document.download') }}
        </button>
      </div>
    </div>

    <p class="text-center text-xs text-gray-400 mt-6">{{ t('document.readyToFile') }}</p>

    <div class="mt-8 flex justify-center gap-4">
      <button class="btn-secondary" @click="$router.push('/result')">← {{ t('document.backToResult') }}</button>
      <a v-if="emailSupport" href="mailto:{{ emailSupport }}" class="btn-secondary">{{ t('document.sendEmail') }}</a>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCaseStore } from '../stores/case'
import { generateDocument } from '../api'

const { t } = useI18n()
const router = useRouter()
const store = useCaseStore()

const analysis = computed(() => store.analysis)
const emailSupport = 'support@legal-ai.example'

const docs = computed(() => [
  { key: 'winReport', icon: '🏆', desc: `${analysis.value?.winRate || 0}% win probability + breakdown` },
  { key: 'demandLetter', icon: '📝', desc: 'Professional demand letter to your employer' },
  { key: 'tribunalFiling', icon: '📂', desc: 'Step-by-step filing guide for local tribunal' },
])

async function download(type) {
  try {
    const r = await generateDocument({ analysis: analysis.value, type })
    // Backend returns { url: '/download/xxx.pdf' } or direct base64
    if (r.data?.url) {
      window.open(r.data.url, '_blank')
    } else if (r.data?.content) {
      const blob = new Blob([atob(r.data.content)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `legal-ai-${type}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      alert('Document not ready')
    }
  } catch (err) {
    alert(err.message)
  }
}
</script>
