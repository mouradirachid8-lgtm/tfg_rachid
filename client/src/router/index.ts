import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../components/HomePage.vue') // O tu dashboard
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../components/LoginPage.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../components/RegisterPage.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../components/ProfilePage.vue'),
      meta: { requiresAuth: true }
    }
  ],
})

export default router
