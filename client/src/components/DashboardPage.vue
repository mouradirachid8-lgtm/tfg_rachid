<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProjectStore } from '../stores/projects';
import { useRouter } from 'vue-router';

const projectStore = useProjectStore();
const router = useRouter();

const showDialog = ref(false);
const showJoinDialog = ref(false);
const joinCode = ref('');
const isJoining = ref(false);

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

const handleJoin = async () => {
    if (!joinCode.value.trim()) return;
    isJoining.value = true;
    const success = await projectStore.joinWithInviteCode(joinCode.value.trim());
    if (success) {
        showJoinDialog.value = false;
        joinCode.value = '';
        projectStore.fetchProjects();
    }
    isJoining.value = false;
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
      <div>
          <v-btn color="secondary" variant="tonal" prepend-icon="mdi-login" @click="showJoinDialog = true" class="mr-2">
            Unirse a Aula
          </v-btn>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="showDialog = true">
            Nuevo Proyecto
          </v-btn>
      </div>
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
      <v-card>
        <v-card-title>Nuevo Proyecto</v-card-title>
        <v-card-text>
          <v-text-field v-model="newProject.name" label="Nombre" variant="outlined"></v-text-field>
          <v-textarea v-model="newProject.description" label="Descripción (Opcional)" variant="outlined" rows="3"></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDialog = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="isCreating" @click="handleCreate">Crear</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showJoinDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6 text-primary"><v-icon>mdi-school</v-icon> Unirse a un Aula</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="joinCode"
            label="Código de Aula (Ej: A5B2C9)"
            variant="outlined"
            @keyup.enter="handleJoin"
            class="mt-3 text-uppercase font-weight-bold"
            autofocus
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showJoinDialog = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="isJoining" @click="handleJoin">Unirse</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>