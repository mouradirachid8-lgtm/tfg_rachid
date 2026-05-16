<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

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
  <v-container class="px-3 px-sm-4">
    <!-- Botón de navegación -->
    <v-btn
      variant="text"
      prepend-icon="mdi-arrow-left"
      class="mb-4"
      @click="router.push('/dashboard')"
    >
      Mis Proyectos
    </v-btn>

    <v-row justify="center">
      <v-col cols="12" sm="10" md="7" lg="5">
        <v-card rounded="lg" elevation="3">
          <v-card-title class="text-h6 font-weight-bold pa-6 pb-2">
            Editar Perfil
          </v-card-title>

          <v-card-text class="pa-6 pt-4">
            <div class="text-center mb-5">
              <v-avatar size="90">
                <v-img :src="authStore.user?.avatar_url || 'https://via.placeholder.com/150'"></v-img>
              </v-avatar>
            </div>

            <v-form @submit.prevent="handleUpdate">
              <v-text-field
                v-model="fullName"
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
                variant="outlined"
                density="comfortable"
                class="mb-3"
              ></v-text-field>
              
              <v-file-input 
                v-model="avatarFile"
                label="Subir nueva foto" 
                accept="image/*"
                prepend-icon="mdi-camera"
                show-size
                variant="outlined"
                density="comfortable"
              ></v-file-input>

              <v-btn color="primary" type="submit" block size="large" class="mt-4" :loading="authStore.loading">
                Guardar Cambios
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>