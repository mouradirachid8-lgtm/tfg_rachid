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
  <v-container class="d-flex align-center justify-center" style="min-height: calc(100vh - 120px);">
    <v-row justify="center" class="w-100 ma-0">
      <v-col cols="12" sm="8" md="5" lg="4" class="px-3">
        <v-card class="elevation-4" rounded="lg">
          <v-card-title class="text-h6 font-weight-bold pa-6 pb-2">
            Recuperar Contraseña
          </v-card-title>

          <v-card-text class="pa-6 pt-3">
            <div v-if="!sent">
              <p class="text-body-2 text-grey-darken-1 mb-4">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <v-form @submit.prevent="handleSubmit">
                <v-text-field
                  v-model="email"
                  label="Email"
                  prepend-inner-icon="mdi-email-outline"
                  type="email"
                  variant="outlined"
                  density="comfortable"
                  required
                ></v-text-field>
                <v-btn type="submit" block color="primary" size="large" class="mt-3">
                  Enviar enlace
                </v-btn>
              </v-form>
            </div>

            <div v-else class="text-center py-4">
              <v-icon size="64" color="success">mdi-email-check</v-icon>
              <p class="mt-3 text-body-1">Si el correo existe, recibirás instrucciones en breve.</p>
              <v-btn to="/login" color="primary" variant="text" class="mt-4" block>
                Volver al inicio de sesión
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>