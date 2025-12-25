<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const token = route.params.token as string; // Cogemos el token de la URL

const handleSubmit = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden';
    return;
  }
  
  try {
    await authStore.confirmPasswordReset(token, password.value);
    router.push('/login'); // Redirigir al login
  } catch (err) {
    error.value = 'El enlace ha caducado o no es válido.';
  }
};
</script>

<template>
  <v-container class="fill-height justify-center">
    <v-card width="400" class="pa-5">
      <v-card-title>Nueva Contraseña</v-card-title>
      <v-form @submit.prevent="handleSubmit">
        <v-text-field v-model="password" label="Nueva contraseña" type="password"></v-text-field>
        <v-text-field v-model="confirmPassword" label="Confirmar contraseña" type="password"></v-text-field>
        
        <v-alert v-if="error" type="error" class="mb-3">{{ error }}</v-alert>
        
        <v-btn type="submit" block color="primary">Cambiar contraseña</v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>