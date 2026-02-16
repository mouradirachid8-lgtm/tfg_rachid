<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProjectStore } from '../stores/projects';
import { useRouter } from 'vue-router';

const projectStore = useProjectStore();
const router = useRouter();

const showDialog = ref(false);
const isCreating = ref(false);
const newProject = ref({ name: '', description: '', is_public: false });

onMounted(() => {
  projectStore.fetchProjects();
});

const handleCreate = async () => {
  if (!newProject.value.name.trim()) return;
  isCreating.value = true;
  const success = await projectStore.createProject(newProject.value);
  if (success) {
    showDialog.value = false;
    newProject.value = { name: '', description: '', is_public: false };
  }
  isCreating.value = false;
};

const goToProject = (id: number) => {
  router.push(`/project/${id}/editor`);
};

const handleDelete = async (id: number) => {
  if (confirm('¿Seguro que quieres borrar este proyecto?')) {
    await projectStore.deleteProject(id);
  }
};

// Función auxiliar para el color del rol
const getRoleColor = (role: string) => {
    switch(role) {
        case 'owner': return 'primary';
        case 'editor': return 'orange-darken-1';
        case 'viewer': return 'blue-grey';
        default: return 'grey';
    }
};
</script>

<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1>Mis Proyectos</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showDialog = true">
        Nuevo Proyecto
      </v-btn>
    </div>

    <v-row v-if="projectStore.projects.length > 0">
      <v-col 
        v-for="project in projectStore.projects" 
        :key="project.id" 
        cols="12" sm="6" md="4"
      >
        <v-card hover @click="goToProject(project.id)" class="d-flex flex-column h-100">
          
          <div :class="`bg-${getRoleColor(project.current_user_role || '')}`" style="height: 4px; width: 100%"></div>

          <v-card-item>
            <div class="d-flex justify-space-between align-center">
                <v-card-title>{{ project.name }}</v-card-title>
                
                <v-chip 
                    size="x-small" 
                    variant="flat" 
                    :color="getRoleColor(project.current_user_role || '')"
                    class="ml-2 text-uppercase font-weight-bold"
                >
                    {{ project.current_user_role === 'owner' ? 'Dueño' : project.current_user_role }}
                </v-chip>
            </div>
            
            <v-card-subtitle>
               {{ project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'Hoy' }}
               <v-icon v-if="project.is_public" icon="mdi-earth" size="small" class="ml-2" title="Público"></v-icon>
               <v-icon v-else icon="mdi-lock" size="small" class="ml-2" title="Privado"></v-icon>
            </v-card-subtitle>
          </v-card-item>

          <v-card-text class="text-truncate flex-grow-1">
            {{ project.description || 'Sin descripción' }}
          </v-card-text>

          <v-card-actions>
            <span v-if="project.current_user_role !== 'owner'" class="text-caption text-grey ml-2">
                <v-icon size="small">mdi-account-group</v-icon> Compartido
            </span>

            <v-spacer></v-spacer>
            
            <v-btn 
                v-if="project.current_user_role === 'owner'"
                icon 
                color="error" 
                variant="text" 
                @click.stop="handleDelete(project.id)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showDialog" max-width="500">
        </v-dialog>

  </v-container>
</template>