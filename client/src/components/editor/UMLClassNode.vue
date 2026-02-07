<script setup lang="ts">
import { inject } from 'vue';
import { Handle, Position } from '@vue-flow/core';

const props = defineProps(['data', 'selected']);

const saveState = inject('saveState', () => {});

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
    
    <Handle id="t-top" type="target" :position="Position.Top" class="handle-target-horizontal" />
    <Handle id="s-top" type="source" :position="Position.Top" class="handle-source" />

    <Handle id="t-right" type="target" :position="Position.Right" class="handle-target-vertical" />
    <Handle id="s-right" type="source" :position="Position.Right" class="handle-source" />

    <Handle id="t-left" type="target" :position="Position.Left" class="handle-target-vertical" />
    <Handle id="s-left" type="source" :position="Position.Left" class="handle-source" />

    <Handle id="t-bottom" type="target" :position="Position.Bottom" class="handle-target-horizontal" />
    <Handle id="s-bottom" type="source" :position="Position.Bottom" class="handle-source" />


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
        <input v-model="data.attributes[i]" class="nodrag item-input" @change="saveState" />
        <button class="delete-btn" @click="removeItem(data.attributes, i)">×</button>
      </div>
      <button class="add-btn nodrag" @click="addAttribute">+ Atributo</button>
    </div>
    
    <div class="uml-separator"></div>

    <div class="uml-body">
      <div v-for="(meth, i) in data.methods" :key="'m'+i" class="editable-item">
        <input v-model="data.methods[i]" class="nodrag item-input" @change="saveState" />
        <button class="delete-btn" @click="removeItem(data.methods, i)">×</button>
      </div>
      <button class="add-btn nodrag" @click="addMethod">+ Método</button>
    </div>

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
  /* Importante para que los handles se posicionen relativos a esto */
  position: relative; 
}

.is-selected {
  border-color: #1976D2;
  box-shadow: 4px 4px 0px rgba(25, 118, 210, 0.2);
}

/* === ESTILOS DE LOS HANDLES (PUNTOS DE UNION) === */

/* 1. El punto visible (negro) para sacar flechas */
.handle-source {
  width: 10px !important;
  height: 10px !important;
  background: #000 !important;
  border: 1px solid white;
  z-index: 10; /* Encima de todo para poder agarrarlo */
}

/* 2. El área invisible para recibir flechas (Target) */
/* Hacemos que ocupe gran parte del borde para que sea fácil conectar */
.handle-target-horizontal {
  width: 60% !important; /* Ocupa el 60% del ancho de la carta */
  height: 10px !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0;
  z-index: 1; /* Debajo del source */
}

.handle-target-vertical {
  width: 10px !important;
  height: 60% !important; /* Ocupa el 60% del alto */
  background: transparent !important;
  border: none !important;
  border-radius: 0;
  z-index: 1;
}

/* Ajustes visuales de los inputs y estructura (Tus estilos originales) */
.title-input {
  width: 100%; text-align: center; font-weight: bold; border: none; background: transparent; outline: none;
}
.item-input {
  width: 85%; border: none; background: transparent; outline: none; font-family: monospace;
}
.editable-item {
  display: flex; justify-content: space-between; align-items: center;
}
.delete-btn {
  color: red; cursor: pointer; font-weight: bold; border: none; background: none;
}
.add-btn {
  width: 100%; text-align: left; color: #666; font-size: 0.8rem; margin-top: 4px; cursor: pointer; border: 1px dashed #ccc; background: #fafafa;
}
.add-btn:hover { background: #eee; color: #000; }
.uml-header { background: #f0f0f0; padding: 8px; border-bottom: 2px solid #000; }
.uml-body { padding: 6px; }
.uml-separator { border-top: 2px solid #000; }
</style>