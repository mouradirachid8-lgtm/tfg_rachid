<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProjectStore } from '../stores/projects';
import { useAuthStore } from '../stores/auth'; // Necesitamos saber quién soy

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

const remove = (userId: number) => {
  if(confirm('¿Seguro que quieres eliminar acceso a este usuario?')) {
    projectStore.removeMember(props.projectId, userId);
  }
};

const close = () => {
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

        <div class="text-subtitle-2 mb-2 text-grey-darken-1">Personas con acceso</div>
        <v-list lines="two" density="compact">
            <v-list-item v-for="member in projectStore.currentMembers" :key="member.id">
                <template v-slot:prepend>
                    <v-avatar color="indigo" size="32" class="text-white text-caption">
                        {{ member.username.charAt(0).toUpperCase() }}
                    </v-avatar>
                </template>

                <v-list-item-title>{{ member.username }} <span v-if="member.id === authStore.user?.id">(Tú)</span></v-list-item-title>
                <v-list-item-subtitle>{{ member.email }}</v-list-item-subtitle>

                <template v-slot:append>
                    <v-chip size="x-small" :color="member.role === 'owner' ? 'amber' : 'blue'" class="mr-2" label>
                        {{ member.role }}
                    </v-chip>
                    <v-btn 
                        v-if="isOwner && member.role !== 'owner'" 
                        icon="mdi-delete-outline" 
                        size="small" 
                        color="grey" 
                        variant="text"
                        @click="remove(member.id)"
                    ></v-btn>
                </template>
            </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>