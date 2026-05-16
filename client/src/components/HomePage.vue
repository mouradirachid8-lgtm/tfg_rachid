<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

// 1. Herramientas: STORES Y ROUTER
const authStore = useAuthStore();
const router = useRouter();

const loading = ref(false);

// --- Estado del diálogo de invitado ---
const guestDialog = ref(false);
const guestCode = ref('');
const guestAlias = ref('');
const guestLoading = ref(false);
const guestError = ref<string | null>(null);

// 3. Funciones
const openProject = (id: number) => {
  router.push(`/editor/${id}`);
};

const openGuestDialog = () => {
  guestCode.value = '';
  guestAlias.value = '';
  guestError.value = null;
  guestDialog.value = true;
};

const joinAsGuest = async () => {
  if (!guestCode.value.trim() || !guestAlias.value.trim()) {
    guestError.value = 'Por favor rellena el código y tu alias.';
    return;
  }
  guestLoading.value = true;
  guestError.value = null;
  try {
    await authStore.loginAsGuest(guestCode.value.trim(), guestAlias.value.trim());
    guestDialog.value = false;
  } catch (err: any) {
    guestError.value = authStore.error || 'Error al unirse. Comprueba el código.';
  } finally {
    guestLoading.value = false;
  }
};

onMounted(() => {
  if (authStore.isAuthenticated) {
    console.log("Usuario logueado: cargando dashboard...");
  }
});
</script>

<template>
  <v-container>
    
    <div class="landing-section text-center mt-10">
      <v-icon size="100" color="primary" class="mb-4">mdi-sitemap</v-icon>
      <h1 class="text-h2 font-weight-bold mb-4 text-primary">UML Collaborator</h1>
      <p class="text-h5 text-grey-darken-1 mb-8">
        Diseña, colabora y exporta tus diagramas UML en tiempo real.
        <br>Perfecto para equipos y estudiantes.
      </p>

      <v-row justify="center" class="gap-4 mb-4">
        <v-btn size="x-large" color="primary" to="/register" elevation="4" class="mr-4">
          Empezar Gratis
        </v-btn>
        <v-btn size="x-large" variant="outlined" color="secondary" to="/login">
          Iniciar Sesión
        </v-btn>
      </v-row>

      <v-row justify="center">
        <v-btn
          id="btn-guest-join"
          size="large"
          variant="text"
          color="grey-darken-1"
          prepend-icon="mdi-account-key-outline"
          @click="openGuestDialog"
        >
          Entrar como Invitado
        </v-btn>
      </v-row>

      <v-row class="mt-16">
        <v-col cols="12" md="4">
          <v-card flat>
            <v-card-text>
              <v-icon color="secondary" size="40">mdi-flash</v-icon>
              <h3 class="text-h6 mt-2">Rápido y Fácil</h3>
              <p>Interfaz intuitiva para crear clases y relaciones.</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card flat>
            <v-card-text>
              <v-icon color="secondary" size="40">mdi-account-group</v-icon>
              <h3 class="text-h6 mt-2">Colaborativo</h3>
              <p>Trabaja con tus compañeros en el mismo lienzo.</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card flat>
            <v-card-text>
              <v-icon color="secondary" size="40">mdi-cloud-check</v-icon>
              <h3 class="text-h6 mt-2">En la Nube</h3>
              <p>Tus proyectos guardados y accesibles siempre.</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Diálogo: Entrar como Invitado -->
    <v-dialog v-model="guestDialog" max-width="460" persistent>
      <v-card rounded="lg" elevation="12">
        <v-card-title class="d-flex align-center ga-2 pa-6 pb-2">
          <v-icon color="primary" size="28">mdi-account-key-outline</v-icon>
          <span class="text-h6 font-weight-bold">Entrar como Invitado</span>
        </v-card-title>

        <v-card-text class="pa-6 pt-3">
          <p class="text-body-2 text-grey-darken-1 mb-5">
            Introduce el código de aula que te ha proporcionado tu profesor y elige un nombre que te identifique.
          </p>

          <v-text-field
            id="guest-code-input"
            v-model="guestCode"
            label="Código de Aula"
            placeholder="Ej: ABC123"
            prepend-inner-icon="mdi-key-outline"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            :disabled="guestLoading"
            @keyup.enter="joinAsGuest"
          />

          <v-text-field
            id="guest-alias-input"
            v-model="guestAlias"
            label="Tu Alias"
            placeholder="Ej: Juan Pérez"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            :disabled="guestLoading"
            @keyup.enter="joinAsGuest"
          />

          <v-alert
            v-if="guestError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
            :text="guestError"
          />
        </v-card-text>

        <v-card-actions class="pa-6 pt-0 ga-2">
          <v-spacer />
          <v-btn
            id="btn-guest-cancel"
            variant="text"
            color="grey"
            :disabled="guestLoading"
            @click="guestDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            id="btn-guest-confirm"
            color="primary"
            variant="flat"
            :loading="guestLoading"
            @click="joinAsGuest"
          >
            Unirme al Aula
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>