<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProjectStore } from '../stores/projects';
import { useAuthStore } from '../stores/auth';

const props = defineProps<{
  modelValue: boolean;
  projectId: number;
  isOwner: boolean; 
}>();

const emit = defineEmits(['update:modelValue']);

const projectStore = useProjectStore();
const authStore = useAuthStore();

const newEmail = ref('');
const newRole = ref('editor');
const loadingInvite = ref(false);
const linkRole = ref('editor');
const generatedLink = ref('');
const generatedCode = ref('');
const loadingLink = ref(false);

onMounted(() => {
  if (props.projectId) {
    projectStore.fetchMembers(props.projectId);
  }
});

const invite = async () => {
  if (!newEmail.value) return;
  loadingInvite.value = true;
  const success = await projectStore.inviteMember(props.projectId, newEmail.value, newRole.value);
  if (success) newEmail.value = '';
  loadingInvite.value = false;
};

// Actualizar rol de usuario existente
const updateMemberRole = async (email: string, role: string) => {
  // Reutilizamos la lógica del store.
  await projectStore.inviteMember(props.projectId, email, role);
};

const remove = (userId: number) => {
  if(confirm('¿Seguro que quieres eliminar acceso a este usuario?')) {
    projectStore.removeMember(props.projectId, userId);
  }
};

const generateLink = async () => {
    loadingLink.value = true;
    const res = await projectStore.generateInviteLink(props.projectId, linkRole.value);
    if (res && res.token) {
        generatedLink.value = `${window.location.origin}/join/${res.token}`;
        generatedCode.value = res.code;
    }
    loadingLink.value = false;
};

const copyLink = () => {
    navigator.clipboard.writeText(generatedLink.value);
    alert('Enlace copiado al portapapeles');
};

const close = () => {
    generatedLink.value = '';
    generatedCode.value = '';
    emit('update:modelValue', false);
};
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="close" max-width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center text-h6 text-primary">
        <span>Gestionar Acceso</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close"></v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <v-card-text>
        <div v-if="isOwner" class="bg-blue-lighten-5 pa-4 rounded mb-4">
            <div class="text-subtitle-2 mb-2">Invitar por email</div>
            <v-row dense>
                <v-col cols="12">
                    <v-text-field 
                        v-model="newEmail" 
                        placeholder="ejemplo@correo.com" 
                        variant="solo" density="compact" hide-details
                        prepend-inner-icon="mdi-email-outline"
                    ></v-text-field>
                </v-col>
                <v-col cols="6">
                    <v-select 
                        v-model="newRole" 
                        :items="['editor', 'viewer']" 
                        variant="solo" density="compact" hide-details
                    ></v-select>
                </v-col>
                <v-col cols="6">
                    <v-btn block color="primary" @click="invite" :loading="loadingInvite">Invitar</v-btn>
                </v-col>
            </v-row>
        </div>

        <div v-if="isOwner" class="bg-grey-lighten-4 pa-4 rounded mb-4">
            <div class="text-subtitle-2 mb-2">Generar Enlace de Clase</div>
            <v-row dense align="center">
                <v-col cols="6">
                    <v-select 
                        v-model="linkRole" 
                        :items="['editor', 'viewer']" 
                        label="Rol del enlace"
                        variant="solo" density="compact" hide-details
                    ></v-select>
                </v-col>
                <v-col cols="6">
                    <v-btn block color="secondary" @click="generateLink" :loading="loadingLink">Crear Enlace</v-btn>
                </v-col>
                <v-col cols="12" v-if="generatedLink" class="mt-2">
                    <div v-if="generatedCode" class="text-center mb-3">
                        <div class="text-h4 font-weight-black text-primary" style="letter-spacing: 0.2em;">{{ generatedCode }}</div>
                        <div class="text-caption text-grey">Código de Aula para Unirse</div>
                    </div>
                    <v-text-field
                        :model-value="generatedLink"
                        readonly
                        variant="outlined"
                        density="compact"
                        hide-details
                        append-inner-icon="mdi-content-copy"
                        @click:append-inner="copyLink"
                        @click="copyLink"
                    ></v-text-field>
                </v-col>
            </v-row>
        </div>

        <div class="text-subtitle-2 mb-2 text-grey-darken-1">Personas con acceso</div>
        <v-list lines="two" density="compact">
            <v-list-item v-for="member in projectStore.currentMembers" :key="member.id">
                
                <template v-slot:prepend>
                    <v-avatar color="indigo" size="32" class="text-white text-caption font-weight-bold">
                        {{ member.username.charAt(0).toUpperCase() }}
                    </v-avatar>
                </template>

                <v-list-item-title>
                    {{ member.username }} 
                    <span v-if="member.id === authStore.user?.id" class="text-grey text-caption">(Tú)</span>
                </v-list-item-title>
                <v-list-item-subtitle>{{ member.email }}</v-list-item-subtitle>

                <template v-slot:append>
                    
                    <v-chip v-if="member.role === 'owner'" size="small" color="amber-darken-2" label class="mr-2">
                        Owner
                    </v-chip>

                    <v-select
                        v-else-if="isOwner"
                        :model-value="member.role"
                        @update:model-value="(val) => updateMemberRole(member.email, val)"
                        :items="[{title:'Viewer', value:'viewer'}, {title:'Editor', value:'editor'}]"
                        density="compact"
                        hide-details
                        variant="underlined"
                        class="d-inline-flex mr-2"
                        style="width: 100px"
                    ></v-select>

                    <v-chip v-else size="small" :color="member.role === 'editor' ? 'blue' : 'grey'" class="mr-2" label>
                        {{ member.role }}
                    </v-chip>

                    <v-btn 
                        v-if="isOwner && member.role !== 'owner'" 
                        icon="mdi-delete-outline" 
                        size="small" 
                        color="error" 
                        variant="text"
                        @click="remove(member.id)"
                        title="Eliminar acceso"
                    ></v-btn>

                </template>
            </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>