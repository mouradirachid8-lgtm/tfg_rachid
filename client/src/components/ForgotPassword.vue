<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const email = ref('');
const sent = ref(false);
const authStore = useAuthStore();

const handleSubmit = async () => {
  await authStore.requestPasswordReset(email.value);
  sent.value = true; // Mostramos mensaje de éxito siempre por seguridad
};
</script>

<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card width="400" class="pa-5">
      <v-card-title class="text-center">Recuperar Contraseña</v-card-title>
      
      <div v-if="!sent">
        <v-card-text>
          Ingresa tu correo y te enviaremos un enlace.
        </v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-text-field v-model="email" label="Email" type="email" required></v-text-field>
          <v-btn type="submit" block color="primary" class="mt-2">Enviar enlace</v-btn>
        </v-form>
      </div>

      <div v-else class="text-center pa-4">
        <v-icon size="64" color="success">mdi-email-check</v-icon>
        <p class="mt-2">Si el correo existe, recibirás instrucciones en breve.</p>
        <v-btn to="/login" variant="text" class="mt-4">Volver al login</v-btn>
      </div>
    </v-card>
  </v-container>
</template>