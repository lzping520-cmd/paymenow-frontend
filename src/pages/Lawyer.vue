<template>
  <div class="max-w-xl mx-auto px-4 py-16">
    <div class="card text-center">
      <div class="text-5xl mb-4">💼</div>
      <h1 class="text-2xl font-bold text-gray-800">{{ t('lawyer.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ t('lawyer.sub') }}</p>

      <div class="mt-8 p-6 bg-primary-50 rounded-2xl border border-primary-100">
        <div class="text-sm text-gray-500 mb-2">{{ t('lawyer.email') }}</div>
        <div class="text-2xl font-bold text-primary-700 mb-4 break-all" @click="copyEmail">{{ t('lawyer.emailValue') }}</div>
        <button class="btn-primary" @click="copyEmail">📋 {{ t('common.copy') }}</button>
      </div>

      <p class="text-xs text-gray-400 mt-6">{{ t('lawyer.note') }}</p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

function copyEmail() {
  const email = 'support@legal-ai.example'
  navigator.clipboard?.writeText(email).then(() => alert('Copied!'))
}
</script>
