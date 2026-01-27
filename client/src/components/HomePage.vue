<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

// 1. Herramientas: STORES Y ROUTER
const authStore = useAuthStore();
const router = useRouter();

// 2. SIMULACIÓN: Datos del Dashboard -> HAY QUE CARGARLOS DE LA BD
const projects = ref([
  { id: 1, name: 'Diagrama de Clases TFG', description: 'proyecto siuu', updatedAt: 'Hoy' },
  { id: 2, name: 'Diagramas TFG', description: 'proyecto siuu', updatedAt: 'Ayer' },
]);

const loading = ref(false);
const showCreateDialog = ref(false);
const newProjectName = ref('');
const newProjectDesc = ref('');

// 3. Funciones
const openProject = (id: number) => {
  // Aquí redirigiremos al editor
  router.push(`/editor/${id}`);
};

const createProject = () => {
  if (!newProjectName.value) return;
  
  // SIMULACIÓN: Aquí llamarías a axios.post('/api/projects')
  projects.value.push({
    id: Date.now(), 
    name: newProjectName.value,
    description: newProjectDesc.value || 'Sin descripción',
    updatedAt: 'Ahora mismo'
  });
  
  // Limpiar
  newProjectName.value = '';
  newProjectDesc.value = '';
  showCreateDialog.value = false;
};

const deleteProject = (id: number) => {
  if(!confirm('¿Estás seguro de borrar este proyecto?')) return;
  // SIMULACIÓN: Filtrar la lista localmente
  projects.value = projects.value.filter(p => p.id !== id);
};

// Cargar proyectos al entrar -> si está logueado
onMounted(() => {
  if (authStore.isAuthenticated) {
    // Aquí llamarías a la función que carga los proyectos del fichero en la carpeta store
    console.log("Usuario logueado: cargando dashboard...");
  }
});
</script>

<template>
  <v-container>
    
    <div v-if="!authStore.isAuthenticated" class="landing-section text-center mt-10">
      <v-icon size="100" color="primary" class="mb-4">mdi-sitemap</v-icon>
      <h1 class="text-h2 font-weight-bold mb-4 text-primary">UML Collaborator</h1>
      <p class="text-h5 text-grey-darken-1 mb-8">
        Diseña, colabora y exporta tus diagramas UML en tiempo real.
        <br>Perfecto para equipos y estudiantes.
      </p>

      <v-row justify="center" class="gap-4">
        <v-btn size="x-large" color="primary" to="/register" elevation="4" class="mr-4">
          Empezar Gratis
        </v-btn>
        <v-btn size="x-large" variant="outlined" color="secondary" to="/login">
          Iniciar Sesión
        </v-btn>
      </v-row>

      <v-row class="mt-16">
        <v-col cols="12" md="4">
          <v-card flat>
            <v-card-text>
              <v-icon color="secondary" size="40">mdi-flash</v-icon>
              <h3 class="text-h6 mt-2">Rápido y Fácil</h3>
              <p>Interfaz intuitiva para crear clases y relaciones.</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card flat>
            <v-card-text>
              <v-icon color="secondary" size="40">mdi-account-group</v-icon>
              <h3 class="text-h6 mt-2">Colaborativo</h3>
              <p>Trabaja con tus compañeros en el mismo lienzo.</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card flat>
            <v-card-text>
              <v-icon color="secondary" size="40">mdi-cloud-check</v-icon>
              <h3 class="text-h6 mt-2">En la Nube</h3>
              <p>Tus proyectos guardados y accesibles siempre.</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <div v-else class="dashboard-section">
      <v-row align="center" class="mb-6">
        <v-col>
          <h1 class="text-h4">Mis Proyectos</h1>
          <span class="text-subtitle-1 text-grey">Gestiona tus diagramas recientes</span>
        </v-col>
        <v-col cols="auto">
          <v-btn 
            prepend-icon="mdi-plus" 
            color="primary" 
            size="large"
            @click="showCreateDialog = true"
          >
            Nuevo Proyecto
          </v-btn>
        </v-col>
      </v-row>

      <v-divider class="mb-6"></v-divider>

      <v-row v-if="projects.length > 0">
        <v-col 
          v-for="project in projects" 
          :key="project.id" 
          cols="12" sm="6" md="4" lg="3"
        >
          <v-card elevation="2" hover class="d-flex flex-column" height="100%">
            <v-sheet color="blue-lighten-4" height="100" class="d-flex align-center justify-center">
              <v-icon size="64" color="white">mdi-file-tree</v-icon>
            </v-sheet>
            
            <v-card-item>
              <v-card-title>{{ project.name }}</v-card-title>
              <v-card-subtitle>{{ project.updatedAt }}</v-card-subtitle>
            </v-card-item>

            <v-card-text>
              {{ project.description }}
            </v-card-text>

            <v-spacer></v-spacer> <v-card-actions>
              <v-btn variant="text" color="primary" @click="openProject(project.id)">
                Abrir
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn icon size="small" color="error" variant="text" @click="deleteProject(project.id)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-else class="text-center mt-10">
        <v-col>
          <v-icon size="80" color="grey-lighten-2">mdi-folder-open-outline</v-icon>
          <h3 class="text-h5 text-grey mt-4">No tienes proyectos todavía</h3>
          <p class="mb-6">Crea el primero para empezar a diagramar</p>
          <v-btn color="primary" @click="showCreateDialog = true">Crear Proyecto</v-btn>
        </v-col>
      </v-row>

      <v-dialog v-model="showCreateDialog" max-width="500">
        <v-card>
          <v-card-title>Nuevo Proyecto</v-card-title>
          <v-card-text>
            <v-text-field 
              v-model="newProjectName" 
              label="Nombre del Proyecto" 
              variant="outlined"
              autofocus
            ></v-text-field>
            <v-textarea 
              v-model="newProjectDesc" 
              label="Descripción (Opcional)" 
              variant="outlined" 
              rows="3"
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="showCreateDialog = false">Cancelar</v-btn>
            <v-btn color="primary" @click="createProject" :disabled="!newProjectName">Crear</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </div>
  </v-container>
</template>