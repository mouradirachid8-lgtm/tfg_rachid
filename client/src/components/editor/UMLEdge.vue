<script setup lang="ts">
import { computed } from 'vue'
import {
  SmoothStepEdge,
  getSmoothStepPath,
  EdgeLabelRenderer,
  type EdgeProps,
  useVueFlow,
  Position
} from '@vue-flow/core'

// Recibimos las props (incluyendo 'data', que es donde vive el tipo de flecha)
const props = defineProps<EdgeProps>()

const { removeEdges } = useVueFlow()

const path = computed(() => getSmoothStepPath(props))

import { inject } from 'vue'

const saveState = inject('saveState', () => {})

function getLabelOffset(pos: Position) {
  // Push the label outwards away from the node, regardless of whether it's source or target.
  switch (pos) {
    case Position.Right:
      return { x: 35, y: -20 }
    case Position.Left:
      return { x: -35, y: -20 }
    case Position.Top:
      return { x: 25, y: -30 }
    case Position.Bottom:
      return { x: 25, y: 30 }
    default:
      return { x: 0, y: 0 }
  }
}

const sourceLabelStyle = computed(() => {
  const offset = getLabelOffset(props.sourcePosition)
  return {
    position: 'absolute' as const,
    transform: `translate(-50%, -50%) translate(${props.sourceX + offset.x}px,${props.sourceY + offset.y}px)`,
    pointerEvents: 'all' as const,
    zIndex: props.selected ? 10 : 1,
  }
})

const targetLabelStyle = computed(() => {
  const offset = getLabelOffset(props.targetPosition)
  return {
    position: 'absolute' as const,
    transform: `translate(-50%, -50%) translate(${props.targetX + offset.x}px,${props.targetY + offset.y}px)`,
    pointerEvents: 'all' as const,
    zIndex: props.selected ? 10 : 1,
  }
})

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
    >
      <input
        v-model="data.sourceMultiplicity"
        class="multi-input"
        placeholder="1"
        @change="saveState"
      />
    </div>
    <div
      v-show="selected || data?.targetMultiplicity"
      :style="targetLabelStyle"
      class="nodrag nopan multiplicity-wrapper"
    >
      <input
        v-model="data.targetMultiplicity"
        class="multi-input"
        placeholder="1..*"
        @change="saveState"
      />
    </div>
  </EdgeLabelRenderer>

  <path :d="path[0]" fill="none" stroke="transparent" stroke-width="20" class="interaction-path" />
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
