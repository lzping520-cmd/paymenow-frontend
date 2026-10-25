import { createRouter, createWebHistory } from 'vue-router'

export const routes = [
  { path: '/', name: 'home', component: () => import('../pages/Home.vue'), meta: { title: 'home.title' } },
  { path: '/form', name: 'form', component: () => import('../pages/Form.vue'), meta: { title: 'form.title' } },
  { path: '/analyzing', name: 'analyzing', component: () => import('../pages/Analyzing.vue'), meta: { title: 'analyzing.title' } },
  { path: '/result', name: 'result', component: () => import('../pages/Result.vue'), meta: { title: 'result.title' } },
  { path: '/pay', name: 'pay', component: () => import('../pages/Pay.vue'), meta: { title: 'pay.choosePlan' } },
  { path: '/document', name: 'document', component: () => import('../pages/Document.vue'), meta: { title: 'document.title' } },
  { path: '/lawyer', name: 'lawyer', component: () => import('../pages/Lawyer.vue'), meta: { title: 'lawyer.title' } },
  { path: '/language', name: 'language', component: () => import('../pages/Language.vue'), meta: { title: 'language.title' } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.afterEach((to) => {
  // 可以在这里改 document.title
})
