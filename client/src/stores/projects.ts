import { defineStore } from 'pinia';
import axios from 'axios';
import { ref } from 'vue';

export interface Project {
    id: number;
    name: string;
    description: string;
    is_public: boolean;
    updated_at: string;
}

export const useProjectStore = defineStore('projects', () => {
    const projects = ref<Project[]>([]);
    const loading = ref(false);

    // Obtener
    async function fetchProjects() {
        loading.value = true;
        try {
            const res = await axios.get('http://localhost:3000/api/projects');
            projects.value = res.data;
        } catch (error) {
            console.error(error);
        } finally {
            loading.value = false;
        }
    }

    // Crear
    async function createProject(data: { name: string; description: string; is_public: boolean }) {
        try {
            const res = await axios.post('http://localhost:3000/api/projects', data);
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
            await axios.delete(`http://localhost:3000/api/projects/${id}`);
            projects.value = projects.value.filter(p => p.id !== id);
        } catch (error) {
            console.error(error);
        }
    }

    // actualizar
    async function updateProject(id: number, data: { name: string; description: string; is_public: boolean }) {
        try {
            const res = await axios.put(`http://localhost:3000/api/projects/${id}`, data);
            
            // Actualizamos el proyecto en la lista local sin tener que recargar todo
            const index = projects.value.findIndex(p => p.id === id);
            if (index !== -1) {
                projects.value[index] = res.data;
            }
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    return { projects, loading, fetchProjects, createProject, updateProject, deleteProject };
});