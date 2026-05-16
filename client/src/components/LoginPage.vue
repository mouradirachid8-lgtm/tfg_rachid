<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const email = ref('');
const password = ref('');
const visible = ref(false); // Para mostrar/ocultar contraseña

const handleLogin = () => {
  if (email.value && password.value) {
    authStore.login({ email: email.value, password: password.value });
  }
};
</script>

<template>
  <v-container class="d-flex align-center justify-center" style="min-height: calc(100vh - 120px);">
    <v-row justify="center" class="w-100 ma-0">
      <v-col cols="12" sm="8" md="5" lg="4" class="px-3">
        <div class="text-center mb-6">
          <v-icon size="48" color="primary">mdi-sitemap</v-icon>
          <h1 class="text-h5 font-weight-bold mt-2 text-primary">UML Collaborator</h1>
        </div>

        <v-card class="elevation-4" rounded="lg">
          <v-card-title class="text-h6 font-weight-bold pa-6 pb-2">
            Iniciar Sesión
          </v-card-title>

          <v-card-text class="pa-6 pt-3">
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                label="Email"
                prepend-inner-icon="mdi-email-outline"
                type="email"
                variant="outlined"
                density="comfortable"
                class="mb-3"
                required
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="Contraseña"
                prepend-inner-icon="mdi-lock-outline"
                :type="visible ? 'text' : 'password'"
                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="visible = !visible"
                variant="outlined"
                density="comfortable"
                required
              ></v-text-field>

              <v-alert v-if="authStore.error" type="error" variant="tonal" density="compact" class="mb-3">
                {{ authStore.error }}
              </v-alert>

              <v-btn
                color="primary"
                type="submit"
                block
                size="large"
                :loading="authStore.loading"
                class="mt-2"
              >
                Entrar
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="pa-4 d-flex flex-column gap-1">
            <v-btn to="/register" color="primary" variant="text" block>
              ¿No tienes cuenta? Regístrate
            </v-btn>
            <v-btn to="/forgot-password" color="secondary" variant="text" block size="small">
              ¿Olvidaste tu contraseña?
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>