<script setup lang="ts">
import { computed } from 'vue';
import { BaseEdge, getBezierPath, EdgeLabelRenderer, type EdgeProps } from '@vue-flow/core';

// Recibimos las props de la conexión (coordenadas, datos, etc.)
const props = defineProps<EdgeProps>();

// Calculamos la ruta de la línea (curva Bezier) y el punto central
const path = computed(() => getBezierPath(props));

// Helper para guardar datos automáticamente al escribir
// Esto actualiza el objeto 'data' dentro de la conexión
const updateData = (field: string, value: string) => {
  props.data[field] = value;
};
</script>

<template>
  <BaseEdge 
    :path="path[0]" 
    :style="{ strokeWidth: 2, stroke: 'black' }"
    :marker-end="data?.markerEnd || 'url(#arrow-closed)'" 
  />

  <EdgeLabelRenderer>
    <div
      class="edge-labels-container"
      :style="{
        transform: `translate(0%, 0%)`, 
        zIndex: 10
      }"
    >
      <div 
        class="label-wrapper"
        :style="{ 
          position: 'absolute', 
          left: `${sourceX}px`, 
          top: `${sourceY}px`,
          transform: 'translate(10px, 10px)' 
        }"
      >
        <input 
          class="nodrag cardinality-input" 
          :value="data?.sourceLabel || ''"
          @input="(e) => updateData('sourceLabel', (e.target as HTMLInputElement).value)"
          placeholder="1" 
        />
      </div>

      <div 
        class="label-wrapper center-wrapper"
        :style="{ 
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${path[1]}px, ${path[2]}px)`
        }"
      >
        <textarea 
          class="nodrag relation-input" 
          :value="data?.middleLabel || ''"
          @input="(e) => updateData('middleLabel', (e.target as HTMLTextAreaElement).value)"
          placeholder="Relación..." 
          rows="1"
        ></textarea>
      </div>

      <div 
        class="label-wrapper"
        :style="{ 
          position: 'absolute', 
          left: `${targetX}px`, 
          top: `${targetY}px`,
          transform: 'translate(-30px, 10px)' 
        }"
      >
        <input 
          class="nodrag cardinality-input" 
          :value="data?.targetLabel || ''"
          @input="(e) => updateData('targetLabel', (e.target as HTMLInputElement).value)"
          placeholder="*" 
        />
      </div>
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
/* Contenedor que ignora eventos del ratón excepto en los inputs */
.edge-labels-container {
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.label-wrapper {
  pointer-events: all; /* Reactivar ratón para escribir */
}

.cardinality-input {
  width: 30px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  text-align: center;
  border-radius: 4px;
}

.relation-input {
  font-size: 12px;
  background: white;
  border: 1px solid #000;
  text-align: center;
  border-radius: 4px;
  resize: none; /* Autoajustable sería ideal, pero fijo para empezar */
  width: 80px;
  height: 24px;
  overflow: hidden;
}

.relation-input:focus {
  height: 60px; /* Se agranda al escribir para atributos extra */
  width: 120px;
  z-index: 20;
}
</style>