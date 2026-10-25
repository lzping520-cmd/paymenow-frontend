<template>
  <footer class="border-t border-gray-100 bg-white mt-16">
    <div class="max-w-6xl mx-auto px-4 py-10 text-sm text-gray-500">
      <div class="grid md:grid-cols-3 gap-6">
        <div>
          <div class="font-bold text-gray-800 text-base mb-2">⚖️ {{ t('app.name') }}</div>
          <p>{{ t('footer.tagline') }}</p>
        </div>
        <div>
          <div class="font-semibold text-gray-700 mb-2">{{ t('nav.contact') }}</div>
          <a href="mailto:support@legal-ai.example" class="hover:text-primary-600">support@legal-ai.example</a>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1">
          <router-link to="/language" class="hover:text-primary-600">{{ t('nav.language') }}</router-link>
          <a href="#" class="hover:text-primary-600">{{ t('footer.privacy') }}</a>
          <a href="#" class="hover:text-primary-600">{{ t('footer.terms') }}</a>
          <a href="#" class="hover:text-primary-600">{{ t('footer.refund') }}</a>
        </div>
      </div>
      <div class="mt-8 pt-6 border-t border-gray-100 text-center text-gray-400">
        © {{ new Date().getFullYear() }} {{ t('app.name') }}
      </div>
    </div>
  </footer>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
