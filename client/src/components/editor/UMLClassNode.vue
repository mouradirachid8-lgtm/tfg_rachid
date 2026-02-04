<script setup lang="ts">
import { inject } from 'vue';
import { Handle, Position } from '@vue-flow/core';

// 1. Props originales
const props = defineProps(['data', 'selected']);

// 2. Inyectamos la función de guardar del padre (EditorView)
// Si no existe (por seguridad), usamos una función vacía
const saveState = inject('saveState', () => {});

// 3. Funciones auxiliares para modificar datos Y GUARDAR en el historial
function addAttribute() {
  props.data.attributes.push('+ nuevo: tipo');
  saveState(); 
}

function addMethod() {
  props.data.methods.push('+ metodo()');
  saveState(); 
}

function removeItem(list: any[], index: number | string) {
  list.splice(Number(index), 1);
  saveState(); 
}
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
        @change="saveState"
      />
    </div>
    
    <div class="uml-body">
      <div v-for="(attr, i) in data.attributes" :key="'a'+i" class="editable-item">
        <input 
          v-model="data.attributes[i]" 
          class="nodrag item-input" 
          @change="saveState"
        />
        <button class="delete-btn" @click="removeItem(data.attributes, i)">×</button>
      </div>
      <button class="add-btn nodrag" @click="addAttribute">+ Atributo</button>
    </div>
    
    <div class="uml-separator"></div>

    <div class="uml-body">
      <div v-for="(meth, i) in data.methods" :key="'m'+i" class="editable-item">
        <input 
          v-model="data.methods[i]" 
          class="nodrag item-input" 
          @change="saveState"
        />
        <button class="delete-btn" @click="removeItem(data.methods, i)">×</button>
      </div>
      <button class="add-btn nodrag" @click="addMethod">+ Método</button>
    </div>

    <Handle type="source" :position="Position.Bottom" class="handle" />
  </div>
</template>

<style scoped>
.uml-node {
  background: white;
  border: 2px solid #000;
  min-width: 180px;
  font-family: monospace;
  font-size: 14px;
  box-shadow: 4px 4px 0px rgba(0,0,0,0.2);
}

.is-selected {
  border-color: #1976D2;
  box-shadow: 4px 4px 0px rgba(25, 118, 210, 0.2);
}

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