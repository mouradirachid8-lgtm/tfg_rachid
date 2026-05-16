<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import '@mdi/font/css/materialdesignicons.css'; 

const authStore = useAuthStore();
const router = useRouter();
</script>

<template>
  <v-app-bar color="primary" density="compact" elevation="2" theme="dark">
    
    <v-app-bar-title
      style="cursor: pointer; min-width: 0"
      @click="router.push('/')"
    >
      <span class="text-truncate">UML Collaborator</span>
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <div class="d-flex align-center pr-2 pr-sm-4">
      
      <template v-if="!authStore.isAuthenticated">
        <!-- En móvil sólo icono, en sm+ texto -->
        <v-btn to="/login" variant="text" class="mr-1 px-2">
          <span class="d-none d-sm-inline">Iniciar Sesión</span>
          <v-icon class="d-inline d-sm-none">mdi-login</v-icon>
        </v-btn>
        <v-btn to="/register" variant="tonal" color="white" class="px-2">
          <span class="d-none d-sm-inline">Registrarse</span>
          <v-icon class="d-inline d-sm-none">mdi-account-plus</v-icon>
        </v-btn>
      </template>

      <template v-else>
        <!-- Nombre + email: ocultar en xs, mostrar en sm+ -->
        <div class="d-none d-sm-flex flex-column align-end mr-3" style="max-width: 150px">
          <span class="text-subtitle-2 font-weight-bold text-truncate" style="max-width: 150px">
            {{ authStore.user?.full_name || authStore.user?.username || 'Usuario' }}
          </span>
          <span class="text-caption text-truncate" style="opacity: 0.8; max-width: 150px">
            {{ authStore.user?.email }}
          </span>
        </div>

        <v-btn icon to="/profile" title="Ir a mi perfil" class="mr-1">
          <v-avatar size="30" color="surface-variant">
            <v-img 
              v-if="authStore.user?.avatar_url" 
              :src="authStore.user.avatar_url" 
              :key="authStore.user.avatar_url"
              alt="Avatar"
              cover
            ></v-img>
            <v-icon v-else size="20">mdi-account-circle</v-icon>
          </v-avatar>
        </v-btn>

        <v-btn icon @click="authStore.logout" title="Cerrar sesión">
          <v-icon>mdi-exit-to-app</v-icon>
        </v-btn>
      </template>

    </div>
  </v-app-bar>
</template>