import { defineStore } from 'pinia';
import axios from 'axios';
import { ref } from 'vue';

// 1. CONFIGURACIÓN DE AXIOS
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
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

export interface ProjectMember {
    id: number;
    username: string;
    email: string;
    avatar_url?: string;
    role: 'owner' | 'editor' | 'viewer';
}

export const useProjectStore = defineStore('projects', () => {
    const projects = ref<Project[]>([]);
    const currentProject = ref<Project | null>(null);
    const currentMembers = ref<ProjectMember[]>([]);  
    const loading = ref(false);

    // Obtener todos (Dashboard)
    async function fetchProjects() {
        loading.value = true;
        try {
            const res = await api.get('/projects');
            projects.value = res.data;
        } catch (error) {
            console.error('Error cargando proyectos:', error);
        } finally {
            loading.value = false;
        }
    }

    // NUEVO: Obtener UN proyecto (Para el Editor)
    async function fetchProjectById(id: string | number) {
        try {
            await fetchProjects(); 
            currentProject.value = projects.value.find(p => p.id === Number(id)) || null;
        } catch (error) {
            console.error(error);
        }
    }

    // Crear
    async function createProject(data: { name: string; description: string; is_public: boolean }) {
        try {
            const res = await api.post('/projects', data);
            projects.value.unshift(res.data);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    // Borrar
    async function deleteProject(id: number) {
        try {
            await api.delete(`/projects/${id}`);
            projects.value = projects.value.filter(p => p.id !== id);
        } catch (error) {
            console.error(error);
        }
    }

    // Actualizar
    async function updateProject(id: number, data: { name: string; description: string; is_public: boolean }) {
        try {
            const res = await api.put(`/projects/${id}`, data);
            const index = projects.value.findIndex(p => p.id === id);
            if (index !== -1) projects.value[index] = res.data;
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    // --- NUEVAS ACCIONES DE MIEMBROS ---

    async function fetchMembers(projectId: string | number) {
        try {
            const res = await api.get(`/projects/${projectId}/members`);
            currentMembers.value = res.data;
        } catch (error) {
            console.error('Error cargando miembros:', error);
        }
    }

    async function inviteMember(projectId: string | number, email: string, role: string) {
        try {
            await api.post(`/projects/${projectId}/members`, { email, role });
            await fetchMembers(projectId); // Recargar lista
            return true;
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al invitar');
            return false;
        }
    }

    async function removeMember(projectId: string | number, userId: number) {
        try {
            await api.delete(`/projects/${projectId}/members`, { data: { userId } });
            await fetchMembers(projectId);
        } catch (error) {
            alert('Error al eliminar miembro');
        }
    }

    async function generateInviteLink(projectId: string | number, role: string) {
        try {
            const res = await api.post(`/projects/${projectId}/invite-link`, { role });
            return { token: res.data.token, code: res.data.code };
        } catch (error) {
            console.error('Error al generar enlace', error);
            return null;
        }
    }

    async function joinWithInviteCode(code: string) {
        try {
            await api.post(`/projects/join-code`, { code });
            return true;
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al unirse con código');
            return false;
        }
    }

    async function joinWithInviteLink(token: string) {
        try {
            await api.post(`/projects/join/${token}`);
            return true;
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al unirse con enlace');
            return false;
        }
    }

    return { 
        projects, 
        currentProject, 
        currentMembers, 
        loading, 
        fetchProjects, 
        fetchProjectById, 
        createProject, 
        updateProject, 
        deleteProject,
        fetchMembers,
        inviteMember,
        removeMember,
        generateInviteLink,
        joinWithInviteLink,
        joinWithInviteCode
    };
});