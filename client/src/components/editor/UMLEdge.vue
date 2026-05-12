<script setup lang="ts">
import { computed } from 'vue'
import {
  SmoothStepEdge,
  getSmoothStepPath,
  EdgeLabelRenderer,
  type EdgeProps,
  useVueFlow,
} from '@vue-flow/core'

// Recibimos las props (incluyendo 'data', que es donde vive el tipo de flecha)
const props = defineProps<EdgeProps>()

const { removeEdges } = useVueFlow()

const path = computed(() => getSmoothStepPath(props))

import { inject } from 'vue'

const saveState = inject('saveState', () => {})

const sourceLabelStyle = computed(() => ({
  position: 'absolute',
  transform: `translate(-50%, -50%) translate(${props.sourceX}px,${props.sourceY}px)`,
  pointerEvents: 'all' as const,
  zIndex: props.selected ? 10 : 1,
}))

const targetLabelStyle = computed(() => ({
  position: 'absolute',
  transform: `translate(-50%, -50%) translate(${props.targetX}px,${props.targetY}px)`,
  pointerEvents: 'all' as const,
  zIndex: props.selected ? 10 : 1,
}))

function deleteEdge() {
  removeEdges([props.id])
}

const edgeStyle = computed(() => ({
  strokeWidth: 2,
  stroke: props.selected ? '#1976D2' : '#333',
  strokeDasharray: props.data?.isDependency ? '8,8' : 'none',
}))

function updateMultiplicity(type: 'source' | 'target', value: string) {
  if (!props.data) return

  props.data[type === 'source' ? 'sourceMultiplicity' : 'targetMultiplicity'] = value
  saveState()
}
</script>

<template>
  <SmoothStepEdge
    v-bind="props"
    :marker-end="props.data?.markerEnd"
    :style="edgeStyle"
    :border-radius="10"
  />

  <EdgeLabelRenderer>
    <div
      v-show="selected || data?.sourceMultiplicity"
      :style="sourceLabelStyle"
      class="nodrag nopan multiplicity-wrapper"
      style="margin-top: -20px; margin-left: 20px"
    >
      <input
        :value="data.sourceMultiplicity"
        @input="updateMultiplicity('source', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <div
      v-show="selected || data?.targetMultiplicity"
      :style="targetLabelStyle"
      class="nodrag nopan multiplicity-wrapper"
      style="margin-top: -20px; margin-left: -20px"
    >
      <input
        v-model="data.targetMultiplicity"
        class="multi-input"
        placeholder="1..*"
        @change="saveState"
      />
    </div>
  </EdgeLabelRenderer>

  <path :d="path[0]" fill="none" stroke-opacity="0" stroke-width="20" class="interaction-path" />
</template>

<style scoped>
.interaction-path:hover {
  cursor: pointer;
}
.multiplicity-wrapper {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
}
.multi-input {
  width: 35px;
  font-size: 11px;
  background: transparent;
  border: 1px dashed transparent;
  text-align: center;
  outline: none;
}
.multi-input:focus,
.multi-input:hover {
  border-color: #ccc;
  background: white;
}
</style>
