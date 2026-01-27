<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

const fullName = ref('');
const email = ref('');
const avatarFile = ref<File | null>(null); // <--- Variable para el archivo real

onMounted(() => {
  if (authStore.user) {
    fullName.value = authStore.user.full_name || authStore.user.username || '';
    email.value = authStore.user.email || '';
  }
});

const handleUpdate = async () => {
  // Pasamos el archivo raw (avatarFile.value[0] si es array o avatarFile.value)
  // Vuetify v-file-input a veces devuelve array.
  
  const fileToSend = Array.isArray(avatarFile.value) ? avatarFile.value[0] : avatarFile.value;

  await authStore.updateUser({
    full_name: fullName.value,
    email: email.value,
    avatar: fileToSend
  });
};
</script>

<template>
  <v-container>
    <v-card class="pa-5 mx-auto" max-width="600">
      <h2 class="mb-4">Editar Perfil</h2>

      <div class="text-center mb-4">
        <v-avatar size="100">
          <v-img :src="authStore.user?.avatar_url || 'https://via.placeholder.com/150'"></v-img>
        </v-avatar>
      </div>

      <v-form @submit.prevent="handleUpdate">
        <v-text-field v-model="fullName" label="Nombre Completo"></v-text-field>
        <v-text-field v-model="email" label="Email"></v-text-field>
        
        <v-file-input 
          v-model="avatarFile"
          label="Subir nueva foto" 
          accept="image/*"
          prepend-icon="mdi-camera"
          show-size
          variant="outlined"
        ></v-file-input>

        <v-btn color="primary" type="submit" block class="mt-4" :loading="authStore.loading">
          Guardar Cambios
        </v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>