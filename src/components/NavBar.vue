<template>
  <nav class="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur bg-white/90">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <router-link to="/" class="flex items-center gap-2 font-bold text-lg text-gray-800">
        <span class="text-2xl">⚖️</span>
        <span>{{ t('app.name') }}</span>
      </router-link>

      <div class="hidden md:flex items-center gap-6 text-gray-600 font-medium">
        <router-link to="/" :class="{ 'text-primary-600': $route.path === '/' }">{{ t('nav.home') }}</router-link>
        <router-link to="/form" :class="{ 'text-primary-600': $route.path.startsWith('/form') }">{{ t('common.start') }}</router-link>
        <router-link to="/language" class="flex items-center gap-1" title="Language">
          <span class="text-base">🌐</span>
          <span>{{ currentLangFlag }}</span>
        </router-link>
      </div>

      <div class="flex md:hidden items-center gap-2">
        <router-link to="/language" class="px-3 py-1 text-lg">🌐 {{ currentLangFlag }}</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { LANGUAGES, getLocale } from '../i18n'

const { t } = useI18n()
const currentLangFlag = computed(() => {
  const l = LANGUAGES.find(x => x.code === getLocale())
  return l ? l.flag : '🇬🇧'
})
</script>
