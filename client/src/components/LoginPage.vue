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
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Iniciar Sesión</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                label="Email"
                prepend-icon="mdi-email"
                type="email"
                required
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="Contraseña"
                prepend-icon="mdi-lock"
                :type="visible ? 'text' : 'password'"
                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="visible = !visible"
                required
              ></v-text-field>

              <div class="text-red" v-if="authStore.error">
                {{ authStore.error }}
              </div>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn to="/register" color="secondary" variant="text">Crear cuenta</v-btn>
            <v-btn 
              color="primary" 
              @click="handleLogin" 
              :loading="authStore.loading"
            >Entrar</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>