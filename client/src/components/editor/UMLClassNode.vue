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

function toggleModifier(list: any[], index: number | string, modifier: string) {
  const i = Number(index);
  let text = list[i];
  if (text.includes(modifier)) {
    list[i] = text.replace(modifier + ' ', '');
  } else {
    list[i] = modifier + ' ' + text;
  }
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
      <div style="display: flex; justify-content: center; margin-bottom: 2px;">
         <input 
            v-model="data.stereotype"
            class="nodrag stereotype-input"
            placeholder="<< stereotype >>"
            @change="saveState"
         />
      </div>
      <div style="display: flex; align-items: center;">
          <input 
            v-model="data.label" 
            class="nodrag title-input" 
            :class="{ 'is-abstract-title': data.isAbstract }"
            placeholder="Nombre Clase"
            @change="saveState"
          />
          <button 
             class="nodrag modifier-btn" 
             style="margin-left:4px"
             :class="{ 'active': data.isAbstract }" 
             @click="data.isAbstract = !data.isAbstract; saveState()"
             title="Toggle Abstract"
          >A</button>
      </div>
    </div>
    
    <div class="uml-body">
      <div v-for="(attr, i) in data.attributes" :key="'a'+i" class="editable-item">
        <button class="nodrag modifier-btn" :class="{'active': data.attributes[i].includes('{static}')}" @click="toggleModifier(data.attributes, i, '{static}')" title="Static">S</button>
        <input 
            v-model="data.attributes[i]" 
            class="nodrag item-input" 
            :class="{'is-static': data.attributes[i].includes('{static}'), 'is-abstract': data.attributes[i].includes('{abstract}')}"
            @change="saveState" 
        />
        <button class="delete-btn" @click="removeItem(data.attributes, i)">×</button>
      </div>
      <button class="add-btn nodrag" @click="addAttribute">+ Atributo</button>
    </div>
    
    <div class="uml-separator"></div>

    <div class="uml-body">
      <div v-for="(meth, i) in data.methods" :key="'m'+i" class="editable-item">
        <button class="nodrag modifier-btn" :class="{'active': data.methods[i].includes('{static}')}" @click="toggleModifier(data.methods, i, '{static}')" title="Static">S</button>
        <button class="nodrag modifier-btn" :class="{'active': data.methods[i].includes('{abstract}')}" @click="toggleModifier(data.methods, i, '{abstract}')" title="Abstract">A</button>

        <input 
            v-model="data.methods[i]" 
            class="nodrag item-input" 
            :class="{'is-static': data.methods[i].includes('{static}'), 'is-abstract': data.methods[i].includes('{abstract}')}"
            @change="saveState" 
        />
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

.is-abstract { font-style: italic; }
.is-abstract-title { font-style: italic; }
.is-static { text-decoration: underline; }

.stereotype-input {
    width: 90%; text-align: center; font-size: 11px; font-style: italic; border: none; background: transparent; outline: none; margin-bottom: 2px;
}

.modifier-btn {
    font-size: 10px; padding: 0 4px; border: 1px solid #ccc; background: white; border-radius: 3px; cursor: pointer; margin-right: 2px; color: #aaa;
}
.modifier-btn.active {
    background: #e3f2fd; color: #1976D2; border-color: #1976D2; font-weight: bold;
}
</style>