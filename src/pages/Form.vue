<template>
  <div class="max-w-3xl mx-auto px-4 py-10">
    <h1 class="section-title text-3xl">{{ t('form.title') }}</h1>
    <p class="text-gray-500 mb-8">{{ t('form.sub') }}</p>

    <form @submit.prevent="onSubmit" class="space-y-6">
      <!-- Company -->
      <div class="card space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('form.companyName') }} *</label>
          <input v-model="form.companyName" required class="input-field" :placeholder="t('form.companyNamePh')" />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('form.country') }} *</label>
          <select v-model="form.country" class="input-field appearance-none bg-white">
            <option v-for="l in LANGUAGES" :key="l.code" v-for2="c in l.countries" :value="c">{{ c }} — {{ l.native }}</option>
          </select>
          <p class="text-xs text-gray-400 mt-1">{{ t('form.countryPh') }}</p>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('form.hireDate') }} *</label>
            <input type="date" v-model="form.hireDate" required class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('form.endDate') }}</label>
            <input type="date" v-model="form.endDate" class="input-field" />
            <p class="text-xs text-gray-400 mt-1">{{ t('form.endDatePh') }}</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('form.salary') }} *</label>
          <div class="flex gap-2">
            <input type="number" v-model.number="form.monthlySalary" required min="0" step="any" class="input-field flex-1" :placeholder="t('form.salaryPh')" />
            <select v-model="form.currency" class="input-field w-28">
              <option value="EUR">€ EUR</option>
              <option value="USD">$ USD</option>
              <option value="GBP">£ GBP</option>
              <option value="JPY">¥ JPY</option>
              <option value="CAD">$ CAD</option>
              <option value="AUD">$ AUD</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Upload -->
      <div class="card">
        <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t('form.uploadDocs') }}</label>
        <p class="text-xs text-gray-500 mb-4">{{ t('form.uploadDocsTip') }}</p>
        <label class="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition">
          <input type="file" accept="image/*,application/pdf" class="hidden" @change="onFileChange" />
          <div class="text-3xl mb-2">📎</div>
          <div class="text-primary-600 font-semibold">{{ t('form.uploadHere') }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ t('form.supported') }}</div>
        </label>
        <div v-if="ocrPreview.length" class="mt-4 bg-primary-50 rounded-xl p-4">
          <div class="font-semibold text-sm mb-2">{{ t('form.ocrTitle') }}</div>
          <div class="text-xs text-gray-600 space-y-1">
            <div v-for="item in ocrPreview" :key="item.label"><span class="font-semibold">{{ item.label }}:</span> {{ item.value }}</div>
          </div>
          <button type="button" class="mt-2 text-xs text-primary-600 hover:underline" @click="applyOcr">{{ t('form.applyToForm') }}</button>
        </div>
      </div>

      <!-- Description -->
      <div class="card">
        <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t('form.description') }} *</label>
        <textarea v-model="form.description" required rows="4" class="input-field resize-none" :placeholder="t('form.descriptionPh')"></textarea>
        <div class="mt-3 flex flex-wrap gap-2">
          <button type="button" v-for="(tag, i) in quickTags" :key="i"
            :class="['px-3 py-1.5 rounded-full text-sm font-medium transition', selectedTags.includes(tag) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']"
            @click="toggleTag(tag)">{{ tag }}</button>
        </div>
      </div>

      <!-- Evidence -->
      <div class="card">
        <label class="block text-sm font-semibold text-gray-700 mb-3">{{ t('form.evidence') }}</label>
        <div class="space-y-2">
          <label v-for="(ev, i) in evidenceList" :key="i" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" :value="ev.key" v-model="form.evidence" class="w-5 h-5 accent-primary-600" />
            <span class="text-gray-700">{{ t('form.' + ev.i18nKey) }}</span>
            <span class="ml-auto text-xs text-primary-600 font-medium">+{{ ev.weight }}</span>
          </label>
        </div>
      </div>

      <button type="submit" :disabled="submitting" class="btn-primary w-full text-lg flex items-center justify-center gap-2" :class="{ 'opacity-60': submitting }">
        <span v-if="submitting" class="animate-spin">⏳</span>
        {{ submitting ? t('common.loading') : t('form.submit') }}
      </button>
      <p class="text-xs text-center text-gray-400">{{ t('form.submitAgree') }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { LANGUAGES } from '../i18n'
import { analyzeCase, ocrFile } from '../api'
import { useCaseStore } from '../stores/case'

const { t } = useI18n()
const router = useRouter()
const store = useCaseStore()

const submitting = ref(false)
const ocrPreview = ref([])

const form = reactive({
  userName: '',
  companyName: '',
  hireDate: '',
  endDate: '',
  monthlySalary: 0,
  country: 'GB',
  description: '',
  currency: 'EUR',
  evidence: [],
  ocrExtracts: [],
})

// Quick tags (use translation keys)
const quickTags = computed(() => [
  t('form.unpaidWages'),
  t('form.unfairDismissal'),
  t('form.noContract'),
  t('form.noPension'),
  t('form.demotion'),
  t('form.forcedOvertime'),
  t('form.redundancy'),
])
const selectedTags = computed(() => quickTags.value.filter(tag => form.description.includes(tag)))

const evidenceList = [
  { key: 'labor_contract', i18nKey: 'contract', weight: 15 },
  { key: 'payslip',        i18nKey: 'payslip', weight: 10 },
  { key: 'termination',    i18nKey: 'dismissalLetter', weight: 15 },
  { key: 'work_records',   i18nKey: 'workRecords', weight: 8 },
  { key: 'chat_records',   i18nKey: 'chatRecords', weight: 6 },
  { key: 'witness',        i18nKey: 'witnesses', weight: 4 },
]

function toggleTag(tag) {
  form.description = selectedTags.value.includes(tag)
    ? form.description.replace(tag, '').replace(/^[,，、\s]+|[,，、\s]+$/g, '')
    : (form.description ? form.description + '、' + tag : tag)
}

async function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const r = await ocrFile(file)
    if (r.code === 0) {
      ocrPreview.value = r.data.extractedInfo || []
      form.ocrExtracts.push({ docType: r.data.docType, rawText: r.data.rawText })
    }
  } catch (err) {
    // silent — OCR failed but continue
  }
}

function applyOcr() {
  ocrPreview.value.forEach(item => {
    if (item.label.includes('公司') || item.label.toLowerCase().includes('company')) form.companyName = item.value
    if (item.label.includes('工资') || item.label.toLowerCase().includes('salary')) {
      const num = String(item.value).replace(/[^\d.]/g, '')
      if (num) form.monthlySalary = Number(num)
    }
    if (item.label.includes('入职') || item.label.toLowerCase().includes('hire')) form.hireDate = item.value
    if (item.label.includes('离职') || item.label.toLowerCase().includes('end')) form.endDate = item.value
  })
}

async function onSubmit() {
  submitting.value = true
  store.updateForm({ ...form })
  store.pendingForm = { ...form }
  try {
    // First save pending form, navigate to analyzing
    router.push({ name: 'analyzing', query: { lang: form.country } })
    const r = await analyzeCase({ ...form, unpaidWages: Number(form.unpaidWages || 0) })
    if (r.code === 0) {
      store.setAnalysis(r.data)
      router.replace({ name: 'result' })
    } else {
      alert(r.msg || 'Error')
      router.back()
    }
  } catch (err) {
    alert(err.message || 'Network error')
    router.back()
  } finally {
    submitting.value = false
  }
}
</script>
