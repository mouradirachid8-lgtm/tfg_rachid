<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
// Asegúrate de haber hecho npm install @mdi/font
import '@mdi/font/css/materialdesignicons.css'; 

const authStore = useAuthStore();
const router = useRouter();
</script>

<template>
  <v-app-bar color="primary" density="compact" elevation="2" theme="dark">
    
    <v-app-bar-title style="cursor: pointer" @click="router.push('/')">
      UML Collaborator
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <div class="d-flex align-center pr-4">
      
      <template v-if="!authStore.isAuthenticated">
        <v-btn to="/login" variant="text" class="mr-2">Iniciar Sesión</v-btn>
        <v-btn to="/register" variant="tonal" color="white">Registrarse</v-btn>
      </template>

      <template v-else>
        <div class="d-none d-sm-flex flex-column align-end mr-4">
          <span class="text-subtitle-2 font-weight-bold">
            {{ authStore.user?.full_name || authStore.user?.username || 'Usuario' }}
          </span>
          <span class="text-caption" style="opacity: 0.8">
            {{ authStore.user?.email }}
          </span>
        </div>

        <v-btn icon to="/profile" title="Ir a mi perfil" class="mr-1">
          <v-avatar size="32" color="surface-variant">
            <v-img 
              v-if="authStore.user?.avatar_url" 
              :src="authStore.user.avatar_url" 
              :key="authStore.user.avatar_url"
              alt="Avatar"
              cover
            ></v-img>
            <v-icon v-else>mdi-account-circle</v-icon>
          </v-avatar>
        </v-btn>

        <v-btn icon @click="authStore.logout" title="Cerrar sesión">
          <v-icon>mdi-exit-to-app</v-icon>
        </v-btn>
      </template>

    </div>
  </v-app-bar>
</template>