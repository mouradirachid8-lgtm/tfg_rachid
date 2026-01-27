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

  // --- ACTUALIZAR ---
  async function updateUser(data: { full_name: string; email: string; avatar?: File }) {
    loading.value = true;
    error.value = null;
    try {
      const formData = new FormData();
      formData.append('full_name', data.full_name);
      formData.append('email', data.email);
      
      if (data.avatar) {
          formData.append('avatar', data.avatar);
      }

      const currentToken = token.value || localStorage.getItem('token');

      if (!currentToken) {
          throw new Error('No hay token de sesión');
      }

      const response = await axios.put('http://localhost:3000/api/users/profile', formData, {
          headers: { 
              'Authorization': `Bearer ${currentToken}`
          }
      });

      const newUser = response.data.user;
      user.value = newUser;
      localStorage.setItem('user', JSON.stringify(newUser));
      
      return true;
    } catch (err: any) {
        console.error('Error al actualizar:', err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            logout(); 
            error.value = 'Tu sesión ha caducado. Vuelve a entrar.';
        } else {
            error.value = err.response?.data?.message || 'Error al actualizar perfil';
        }
        return false;
    } finally {
        loading.value = false;
    }
  }

  async function requestPasswordReset(email: string) {
    try {
        await axios.post('http://localhost:3000/api/auth/forgot-password', { email });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
  }

  async function confirmPasswordReset(token: string, password: string) {
    try {
        await axios.post(`http://localhost:3000/api/auth/reset-password/${token}`, { password });
        return true;
    } catch (error) {
        throw error; // Lanzamos error para manejarlo en la vista
    }
  }

  return { user, token, isAuthenticated, loading, error, login, register, logout, updateUser, requestPasswordReset, confirmPasswordReset };
});
