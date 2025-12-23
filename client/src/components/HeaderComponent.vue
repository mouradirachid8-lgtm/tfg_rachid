<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
</script>

<template>
  <v-app-bar color="primary" density="compact">
    <v-app-bar-title style="cursor: pointer" @click="router.push('/')">
      UML Collaborator
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <template v-if="!authStore.isAuthenticated">
      <v-btn to="/login" variant="text">Iniciar Sesión</v-btn>
      <v-btn to="/register" variant="outlined" class="ml-2">Registrarse</v-btn>
    </template>

    <template v-else>
      <span class="mr-4 text-body-2">Hola, {{ authStore.user?.name || 'Usuario' }}</span>
      <v-btn icon>
        <v-icon>mdi-account</v-icon>
      </v-btn>
      <v-btn icon @click="authStore.logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </template>
  </v-app-bar>
</template>