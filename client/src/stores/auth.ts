// client/src/stores/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

// Configura la URL base de tu backend (si no lo has hecho en main.ts)
const API_URL = 'http://localhost:3000/api/auth';

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter();
  
  // Recuperar datos de localStorage si existen
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  const user = ref(storedUser ? JSON.parse(storedUser) : null);
  const token = ref(storedToken || null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  // --- LOGIN ---
  async function login(credentials: { email: string; password: string }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await axios.post(`${API_URL}/login`, credentials);
      
      const { user: userData, token: tokenData } = response.data;

      user.value = userData;
      token.value = tokenData;

      localStorage.setItem('token', tokenData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokenData}`;

      router.push('/'); 
    } catch (err: any) {
      console.error(err);
      error.value = err.response?.data?.message || 'Error de conexión';
    } finally {
      loading.value = false;
    }
  }

  // --- REGISTRO ---
  async function register(userData: { name: string; email: string; password: string }) {
    loading.value = true;
    error.value = null;
    try {
      await axios.post(`${API_URL}/register`, userData);
      router.push('/login');
      alert('¡Cuenta creada! Por favor inicia sesión.');
    } catch (err: any) {
      console.error(err);
      error.value = err.response?.data?.message || 'Error al registrarse';
    } finally {
      loading.value = false;
    }
  }

  // --- LOGOUT ---
  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    router.push('/login');
  }

  return { user, token, isAuthenticated, loading, error, login, register, logout };
});
