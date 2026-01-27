<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

// 1. Herramientas: STORES Y ROUTER
const authStore = useAuthStore();
const router = useRouter();

const loading = ref(false);

// 3. Funciones
const openProject = (id: number) => {
  // Aquí redirigiremos al editor
  router.push(`/editor/${id}`);
};


onMounted(() => {
  if (authStore.isAuthenticated) {
    console.log("Usuario logueado: cargando dashboard...");
  }
});
</script>

<template>
  <v-container>
    
    <div class="landing-section text-center mt-10">
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

  </v-container>
</template>