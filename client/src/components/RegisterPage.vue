<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const name = ref('');
const email = ref('');
const password = ref('');

const handleRegister = () => {
  authStore.register({ name: name.value, email: email.value, password: password.value });
};
</script>

<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="secondary" dark flat>
            <v-toolbar-title>Registro</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="handleRegister">
              <v-text-field v-model="name" label="Nombre Completo" prepend-icon="mdi-account"></v-text-field>
              <v-text-field v-model="email" label="Email" prepend-icon="mdi-email"></v-text-field>
              <v-text-field v-model="password" label="Contraseña" prepend-icon="mdi-lock" type="password"></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn to="/login" variant="text">¿Ya tienes cuenta?</v-btn>
            <v-btn color="secondary" @click="handleRegister" :loading="authStore.loading">Registrarse</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>