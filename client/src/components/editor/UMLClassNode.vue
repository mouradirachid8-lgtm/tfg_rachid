<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
defineProps(['data', 'selected']);
</script>

<template>
  <div class="uml-node" :class="{ 'is-selected': selected }">
    <Handle type="target" :position="Position.Top" class="handle" />
    
    <div 
      class="uml-header" 
      :style="{ backgroundColor: data.color || '#f0f0f0' }"
    >
      <input 
        v-model="data.label" 
        class="nodrag title-input" 
        placeholder="Nombre Clase"
      />
    </div>
    
    <div class="uml-body">
      <div v-for="(attr, i) in data.attributes" :key="'a'+i" class="editable-item">
        <input v-model="data.attributes[i]" class="nodrag item-input" />
        <button class="delete-btn" @click="data.attributes.splice(i, 1)">×</button>
      </div>
      <button class="add-btn nodrag" @click="data.attributes.push('+ nuevo: tipo')">+ Atributo</button>
    </div>
    
    <div class="uml-separator"></div>

    <div class="uml-body">
      <div v-for="(meth, i) in data.methods" :key="'m'+i" class="editable-item">
        <input v-model="data.methods[i]" class="nodrag item-input" />
        <button class="delete-btn" @click="data.methods.splice(i, 1)">×</button>
      </div>
       <button class="add-btn nodrag" @click="data.methods.push('+ metodo()')">+ Método</button>
    </div>

    <Handle type="source" :position="Position.Bottom" class="handle" />
  </div>
</template>

<style scoped>
/* Mantén tus estilos anteriores de .uml-node, .is-selected, etc. */
.uml-node {
  background: white;
  border: 2px solid #000;
  min-width: 180px;
  font-family: monospace;
  font-size: 14px;
  box-shadow: 4px 4px 0px rgba(0,0,0,0.2);
}

/* Estilos para los Inputs */
.title-input {
  width: 100%;
  text-align: center;
  font-weight: bold;
  border: none;
  background: transparent;
  outline: none;
}

.item-input {
  width: 85%;
  border: none;
  background: transparent;
  outline: none;
  font-family: monospace;
}

.editable-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delete-btn {
  color: red;
  cursor: pointer;
  font-weight: bold;
  border: none;
  background: none;
}

.add-btn {
  width: 100%;
  text-align: left;
  color: #666;
  font-size: 0.8rem;
  margin-top: 4px;
  cursor: pointer;
  border: 1px dashed #ccc;
  background: #fafafa;
}

.add-btn:hover {
  background: #eee;
  color: #000;
}

.uml-header {
  background: #f0f0f0;
  padding: 8px;
  border-bottom: 2px solid #000;
}

.uml-body {
  padding: 6px;
}

.uml-separator {
  border-top: 2px solid #000;
}

.handle {
  width: 12px;
  height: 12px;
  background: #000;
}
</style>