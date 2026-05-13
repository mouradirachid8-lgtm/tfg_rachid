import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../components/HomePage.vue')
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
    },
    { 
      path: '/forgot-password', 
      component: () => import('../components/ForgotPassword.vue')
    },
    { 
      path: '/reset-password/:token', 
      component: () => import('../components/ResetPassword.vue')
    },
    { 
      path: '/dashboard', 
      component: () => import('../components/DashboardPage.vue')
    },
    { 
      path: '/project/:id/editor', 
      component: () => import('../components/EditorPage.vue')
    },
    { 
      path: '/join/:token', 
      component: () => import('../components/JoinPage.vue')
    }
  ],
})

export default router
