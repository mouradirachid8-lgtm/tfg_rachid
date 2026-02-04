<script setup lang="ts">
import { computed } from 'vue';
import { 
  SmoothStepEdge, 
  getSmoothStepPath, 
  type EdgeProps, 
  useVueFlow 
} from '@vue-flow/core';

// Recibimos las props (incluyendo 'data', que es donde vive el tipo de flecha)
const props = defineProps<EdgeProps>();

const { removeEdges } = useVueFlow();

const path = computed(() => getSmoothStepPath(props));

function deleteEdge() {
  removeEdges([props.id]);
}
</script>

<template>
  <SmoothStepEdge 
    v-bind="props" 
    :marker-end="data?.markerEnd"
    :style="{ strokeWidth: 2, stroke: selected ? '#1976D2' : '#000' }"
    :border-radius="10" 
  />

  <path
    :d="path[0]"
    fill="none"
    stroke-opacity="0"
    stroke-width="20"
    class="interaction-path"
  />
</template>

<style scoped>
.interaction-path:hover {
  cursor: pointer;
}
</style>