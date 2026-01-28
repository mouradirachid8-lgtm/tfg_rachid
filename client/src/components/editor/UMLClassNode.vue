<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

// Props que Vue Flow nos pasa automáticamente
defineProps(['id', 'data', 'selected']);
</script>

<template>
  <div class="uml-class-node" :class="{ 'is-selected': selected }">
    <Handle type="target" :position="Position.Top" class="handle" />
    
    <div class="class-header">
      <strong>{{ data.label }}</strong>
    </div>

    <div class="separator"></div>

    <div class="class-body">
      <div v-for="(attr, i) in data.attributes" :key="i" class="item">
        {{ attr }}
      </div>
      <div v-if="!data.attributes?.length" class="empty-placeholder">
        + atributo
      </div>
    </div>

    <div class="separator"></div>

    <div class="class-body">
      <div v-for="(method, i) in data.methods" :key="i" class="item">
        {{ method }}
      </div>
      <div v-if="!data.methods?.length" class="empty-placeholder">
        + metodo()
      </div>
    </div>

    <Handle type="source" :position="Position.Bottom" class="handle" />
  </div>
</template>

<style scoped>
.uml-class-node {
  background: white;
  border: 2px solid #333;
  border-radius: 4px;
  min-width: 150px;
  font-family: monospace;
  font-size: 14px;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.is-selected {
  border-color: #1976D2; /* Azul Vuetify */
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.5);
}

.class-header {
  background: #f5f5f5;
  padding: 8px;
  text-align: center;
  border-bottom: 1px solid #333;
}

.separator {
  height: 1px;
  background: #333;
}

.class-body {
  padding: 8px;
  text-align: left;
}

.item {
  line-height: 1.5;
}

.empty-placeholder {
  color: #aaa;
  font-style: italic;
  font-size: 0.9em;
}

/* Estilo de los puntos de conexión */
.handle {
  width: 10px;
  height: 10px;
  background: #555;
}
</style>