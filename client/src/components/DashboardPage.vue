<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProjectStore } from '../stores/projects';
import { useRouter } from 'vue-router';

const projectStore = useProjectStore();
const router = useRouter();

// Estado del formulario de crear
const showDialog = ref(false);
const newProject = ref({ name: '', description: '', is_public: false });

onMounted(() => {
  projectStore.fetchProjects();
});

const handleCreate = async () => {
  const success = await projectStore.createProject(newProject.value);
  if (success) {
    showDialog.value = false;
    newProject.value = { name: '', description: '', is_public: false }; // Reset
  }
};

const goToProject = (id: number) => {
  // Aquí iremos al editor en el futuro
  console.log('Abriendo proyecto', id);
  // router.push(`/editor/${id}`);
};

const handleDelete = async (id: number) => {
  if (confirm('¿Seguro que quieres borrar este proyecto?')) {
    await projectStore.deleteProject(id);
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

    <div v-if="projectStore.loading" class="text-center mt-10">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else-if="projectStore.projects.length === 0" class="text-center mt-10 text-grey">
      <v-icon size="64" class="mb-2">mdi-folder-outline</v-icon>
      <h3>No tienes proyectos aún</h3>
      <p>Crea uno nuevo para empezar a diagramar</p>
    </div>

    <v-row v-else>
      <v-col 
        v-for="project in projectStore.projects" 
        :key="project.id" 
        cols="12" sm="6" md="4"
      >
        <v-card hover @click="goToProject(project.id)">
          <v-card-item>
            <v-card-title>{{ project.name }}</v-card-title>
            <v-card-subtitle>
              {{ new Date(project.updated_at).toLocaleDateString() }}
              <v-chip size="x-small" class="ml-2" :color="project.is_public ? 'success' : 'grey'">
                {{ project.is_public ? 'Público' : 'Privado' }}
              </v-chip>
            </v-card-subtitle>
          </v-card-item>

          <v-card-text class="text-truncate">
            {{ project.description || 'Sin descripción' }}
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn icon color="error" variant="text" @click.stop="handleDelete(project.id)">
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
          <v-form @submit.prevent="handleCreate">
            <v-text-field v-model="newProject.name" label="Nombre" required autofocus></v-text-field>
            <v-textarea v-model="newProject.description" label="Descripción" rows="2"></v-textarea>
            <v-checkbox v-model="newProject.is_public" label="Hacer público"></v-checkbox>
            
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="grey" variant="text" @click="showDialog = false">Cancelar</v-btn>
              <v-btn color="primary" type="submit">Crear</v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

  </v-container>
</template>