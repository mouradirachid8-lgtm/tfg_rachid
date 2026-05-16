<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const name = ref('');
const email = ref('');
const password = ref('');
const visible = ref(false);

const handleRegister = () => {
  authStore.register({ name: name.value, email: email.value, password: password.value });
};
</script>

<template>
  <v-container class="d-flex align-center justify-center" style="min-height: calc(100vh - 120px);">
    <v-row justify="center" class="w-100 ma-0">
      <v-col cols="12" sm="8" md="5" lg="4" class="px-3">
        <div class="text-center mb-6">
          <v-icon size="48" color="secondary">mdi-account-plus</v-icon>
          <h1 class="text-h5 font-weight-bold mt-2 text-primary">Crear Cuenta</h1>
        </div>

        <v-card class="elevation-4" rounded="lg">
          <v-card-title class="text-h6 font-weight-bold pa-6 pb-2">
            Registro
          </v-card-title>

          <v-card-text class="pa-6 pt-3">
            <v-form @submit.prevent="handleRegister">
              <v-text-field
                v-model="name"
                label="Nombre Completo"
                prepend-inner-icon="mdi-account-outline"
                variant="outlined"
                density="comfortable"
                class="mb-3"
              ></v-text-field>
              <v-text-field
                v-model="email"
                label="Email"
                prepend-inner-icon="mdi-email-outline"
                type="email"
                variant="outlined"
                density="comfortable"
                class="mb-3"
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
              ></v-text-field>

              <v-alert v-if="authStore.error" type="error" variant="tonal" density="compact" class="mb-3">
                {{ authStore.error }}
              </v-alert>

              <v-btn
                color="secondary"
                type="submit"
                block
                size="large"
                :loading="authStore.loading"
                class="mt-2"
              >
                Registrarse
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="pa-4">
            <v-btn to="/login" color="primary" variant="text" block>
              ¿Ya tienes cuenta? Inicia sesión
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>