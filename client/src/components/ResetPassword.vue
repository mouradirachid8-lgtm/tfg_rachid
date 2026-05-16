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
  <v-container class="d-flex align-center justify-center" style="min-height: calc(100vh - 120px);">
    <v-row justify="center" class="w-100 ma-0">
      <v-col cols="12" sm="8" md="5" lg="4" class="px-3">
        <v-card class="elevation-4" rounded="lg">
          <v-card-title class="text-h6 font-weight-bold pa-6 pb-2">
            Nueva Contraseña
          </v-card-title>

          <v-card-text class="pa-6 pt-3">
            <v-form @submit.prevent="handleSubmit">
              <v-text-field
                v-model="password"
                label="Nueva contraseña"
                prepend-inner-icon="mdi-lock-outline"
                type="password"
                variant="outlined"
                density="comfortable"
                class="mb-3"
              ></v-text-field>
              <v-text-field
                v-model="confirmPassword"
                label="Confirmar contraseña"
                prepend-inner-icon="mdi-lock-check-outline"
                type="password"
                variant="outlined"
                density="comfortable"
              ></v-text-field>

              <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
                {{ error }}
              </v-alert>

              <v-btn type="submit" block color="primary" size="large" class="mt-3">
                Cambiar contraseña
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>