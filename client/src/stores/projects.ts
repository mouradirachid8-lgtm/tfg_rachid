import { defineStore } from 'pinia';
import axios from 'axios';
import { ref } from 'vue';

// 1. CONFIGURACIÓN DE AXIOS (Para arreglar el error 401)
// Creamos una instancia que busca el token antes de cada petición
const api = axios.create({
    baseURL: 'http://localhost:3000/api'
});

// Interceptor: "Antes de enviar, pega el token en la cabecera"
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // Asegúrate de que al hacer login guardaste el token con esta clave
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 2. TIPOS
export interface Project {
    id: number;
    name: string;
    description: string;
    is_public: boolean;
    updated_at: string;
    owner_id: number;
    current_user_role?: 'owner' | 'editor' | 'viewer';
}

export const useProjectStore = defineStore('projects', () => {
    const projects = ref<Project[]>([]);
    const loading = ref(false);

    // Obtener
    async function fetchProjects() {
        loading.value = true;
        try {
            // Usamos 'api' en vez de 'axios' directo
            const res = await api.get('/projects'); 
            projects.value = res.data;
        } catch (error) {
            console.error('Error cargando proyectos:', error);
        } finally {
            loading.value = false;
        }
    }

    // Crear
    async function createProject(data: { name: string; description: string; is_public: boolean }) {
        try {
            const res = await api.post('/projects', data);
            projects.value.unshift(res.data); 
            return true;
        } catch (error) {
            console.error('Error creando proyecto:', error);
            return false;
        }
    }

    // Borrar
    async function deleteProject(id: number) {
        try {
            await api.delete(`/projects/${id}`);
            projects.value = projects.value.filter(p => p.id !== id);
        } catch (error) {
            console.error('Error borrando proyecto:', error);
        }
    }

    // actualizar
    async function updateProject(id: number, data: { name: string; description: string; is_public: boolean }) {
        try {
            const res = await api.put(`/projects/${id}`, data);
            
            // Actualizamos la lista localmente
            const index = projects.value.findIndex(p => p.id === id);
            if (index !== -1) {
                projects.value[index] = res.data;
            }
            return true;
        } catch (error) {
            console.error('Error actualizando proyecto:', error);
            return false;
        }
    }

    return { projects, loading, fetchProjects, createProject, updateProject, deleteProject };
});