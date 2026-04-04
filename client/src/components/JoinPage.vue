<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '../stores/projects';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

onMounted(async () => {
    const token = route.params.token as string;
    if (token) {
        const success = await projectStore.joinWithInviteLink(token);
        if (success) {
            router.push('/dashboard');
        } else {
            router.push('/');
        }
    }
});
</script>

<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card class="pa-5 text-center" elevation="2">
        <v-progress-circular indeterminate color="primary" class="mb-4"></v-progress-circular>
        <div class="text-h6">Uniéndote a la clase...</div>
    </v-card>
  </v-container>
</template>
