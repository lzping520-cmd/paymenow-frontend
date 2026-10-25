<template>
  <div>
    <!-- Hero -->
    <section class="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
      <div class="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
        <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">{{ t('home.title') }}</h1>
        <p class="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8">{{ t('app.heroSub') }}</p>
        <router-link to="/form" class="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-gray-100 font-bold py-4 px-8 rounded-2xl shadow-xl transition-all active:scale-95 text-lg">
          {{ t('common.start') }} →
        </router-link>
        <p class="text-sm opacity-75 mt-4">{{ t('footer.tagline') }}</p>
      </div>
    </section>

    <!-- Stats -->
    <section class="max-w-6xl mx-auto px-4 -mt-10">
      <div class="card grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-2xl md:text-3xl font-bold text-primary-600">{{ t('home.stat1Val') }}</div>
          <div class="text-sm text-gray-500">{{ t('home.stat1') }}</div>
        </div>
        <div class="border-x border-gray-100">
          <div class="text-2xl md:text-3xl font-bold text-primary-600">{{ t('home.stat2Val') }}</div>
          <div class="text-sm text-gray-500">{{ t('home.stat2') }}</div>
        </div>
        <div>
          <div class="text-2xl md:text-3xl font-bold text-primary-600">{{ t('home.stat3Val') }}</div>
          <div class="text-sm text-gray-500">{{ t('home.stat3') }}</div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="max-w-6xl mx-auto px-4 py-16">
      <h2 class="section-title text-center text-3xl mb-12">{{ t('home.howItWorks') }}</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div v-for="(step, i) in 3" :key="i" class="card text-center">
          <div class="w-14 h-14 mx-auto rounded-full bg-primary-100 text-primary-700 font-bold text-xl flex items-center justify-center mb-4">{{ i + 1 }}</div>
          <h3 class="font-bold text-lg mb-2">{{ t(`home.step${i+1}Title`) }}</h3>
          <p class="text-gray-500">{{ t(`home.step${i+1}Desc`) }}</p>
        </div>
      </div>
    </section>

    <!-- Countries -->
    <section class="bg-white border-y border-gray-100">
      <div class="max-w-6xl mx-auto px-4 py-14 text-center">
        <h2 class="section-title text-2xl mb-6">{{ t('home.countriesTitle') }}</h2>
        <div class="flex flex-wrap justify-center gap-3 text-2xl">
          <span v-for="l in LANGUAGES" :key="l.code" class="px-4 py-2 bg-gray-50 rounded-xl hover:bg-primary-50 hover:scale-110 transition cursor-default" :title="l.native">{{ l.flag }} {{ l.native }}</span>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="max-w-6xl mx-auto px-4 py-16">
      <h2 class="section-title text-center text-3xl mb-12">{{ t('home.testimonials') }}</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="card bg-primary-50/50">
          <p class="text-gray-700 mb-4">"{{ t('home.testimonial1') }}"</p>
          <p class="text-sm text-gray-500">— {{ t('home.testimonial1From') }}</p>
        </div>
        <div class="card">
          <p class="text-gray-700 mb-4">"{{ t('home.testimonial2') }}"</p>
          <p class="text-sm text-gray-500">— {{ t('home.testimonial2From') }}</p>
        </div>
        <div class="card">
          <p class="text-gray-700 mb-4">"{{ t('home.testimonial3') }}"</p>
          <p class="text-sm text-gray-500">— {{ t('home.testimonial3From') }}</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="max-w-6xl mx-auto px-4 pb-16">
      <div class="rounded-3xl bg-gradient-to-r from-primary-600 to-primary-700 text-white p-10 text-center shadow-2xl shadow-primary-600/30">
        <h2 class="text-3xl font-bold mb-4">{{ t('home.sub') }}</h2>
        <router-link to="/form" class="inline-block bg-white text-primary-700 hover:bg-gray-100 font-bold py-4 px-8 rounded-2xl transition-all active:scale-95">{{ t('common.start') }} →</router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { LANGUAGES } from '../i18n'
const { t } = useI18n()
</script>
