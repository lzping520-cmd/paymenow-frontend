<template>
  <div class="max-w-2xl mx-auto px-4 py-16">
    <h1 class="section-title text-3xl text-center">{{ t('language.title') }}</h1>
    <p class="text-center text-gray-500 mb-10">{{ t('language.subtitle') }}</p>

    <div class="grid sm:grid-cols-2 gap-4">
      <button v-for="l in LANGUAGES" :key="l.code"
        :class="['card flex items-center gap-4 transition-all text-left hover:shadow-lg active:scale-[0.98]', current === l.code ? 'ring-2 ring-primary-600 bg-primary-50' : '']"
        @click="select(l.code)">
        <span class="text-3xl">{{ l.flag }}</span>
        <div>
          <div class="font-bold text-gray-800">{{ l.native }}</div>
          <div class="text-xs text-gray-500">{{ l.name }} — {{ l.countries.join(', ') }}</div>
        </div>
        <span v-if="current === l.code" class="ml-auto text-primary-600 font-bold">✓</span>
      </button>
    </div>

    <p class="text-center text-xs text-gray-400 mt-8">{{ t('language.current') }}: <span class="font-medium">{{ currentFlag }} {{ currentName }}</span></p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { LANGUAGES, setLocale, getLocale } from '../i18n'

const { t } = useI18n()
const current = ref(getLocale())

const currentLang = computed(() => LANGUAGES.find(x => x.code === current.value))
const currentFlag = computed(() => currentLang.value?.flag || '🇬🇧')
const currentName = computed(() => currentLang.value?.native || 'English')

function select(code) {
  current.value = code
  setLocale(code)
}
</script>
