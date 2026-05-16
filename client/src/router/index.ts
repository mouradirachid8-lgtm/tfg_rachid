import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../components/HomePage.vue'),
      meta: { requiresGuest: true }   // Si ya estás logueado, te lleva al dashboard
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../components/LoginPage.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../components/RegisterPage.vue'),
      meta: { requiresGuest: true }
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
      name: 'dashboard',
      component: () => import('../components/DashboardPage.vue'),
      meta: { requiresAuth: true }
    },
    { 
      path: '/project/:id/editor',
      name: 'editor',
      component: () => import('../components/EditorPage.vue'),
      meta: { requiresAuth: true }
    },
    { 
      path: '/join/:token',
      name: 'join',
      component: () => import('../components/JoinPage.vue'),
      meta: { requiresAuth: true }
    }
  ],
})

// --- Guard de navegación global ---
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  if (to.meta.requiresAuth && !isLoggedIn) {
    // Ruta protegida pero sin sesión → al login
    next({ name: 'login' });
  } else if (to.meta.requiresGuest && isLoggedIn) {
    // Ya logueado intentando ir a home/login/register → al dashboard
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router
