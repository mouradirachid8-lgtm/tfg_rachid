<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps(['data', 'selected'])

const saveState = inject('saveState', () => {})

const originalValue = ref('')

const stereotypeValue = computed({
  get: () => props.data.stereotype || '',
  set: (val) => {
    props.data.stereotype = val
  },
})

function onFocus(val: string) {
  originalValue.value = val
}

function cancelEdit(
  event: Event,
  type: 'label' | 'stereotype' | 'attribute' | 'method',
  index?: string | number,
) {
  if (type === 'label') props.data.label = originalValue.value
  else if (type === 'stereotype') props.data.stereotype = originalValue.value
  else if (type === 'attribute' && index !== undefined)
    props.data.attributes[Number(index)] = originalValue.value
  else if (type === 'method' && index !== undefined)
    props.data.methods[Number(index)] = originalValue.value
  ;(event.target as HTMLElement).blur()
}

function addAttribute() {
  props.data.attributes.push('+ nuevo: tipo')
  saveState()
}

function addMethod() {
  props.data.methods.push('+ metodo()')
  saveState()
}

function removeItem(list: any[], index: number | string) {
  list.splice(Number(index), 1)
  saveState()
}

function toggleModifier(list: any[], index: number | string, modifier: string) {
  const i = Number(index)
  let text = list[i]
  if (text.includes(modifier)) {
    list[i] = text.replace(modifier + ' ', '')
  } else {
    list[i] = modifier + ' ' + text
  }
  saveState()
}

function toggleAbstract() {
  props.data.isAbstract = !props.data.isAbstract
  saveState()
}

function getParts(str: string) {
  if (!str) return { vis: '+', name: '', type: '' }
  let clean = str.replace(/\{.*?\}/g, '').trim()

  let vis = '+'
  const visMatch = clean.match(/^([+\-#~])\s*/)
  if (visMatch && visMatch[1]) {
    vis = visMatch[1]
    clean = clean.slice(visMatch[0].length)
  }

  let parens = 0
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === '(') parens++
    else if (clean[i] === ')') parens--
    else if (clean[i] === ':' && parens === 0) {
      return {
        vis,
        name: clean.slice(0, i).trim(),
        type: clean.slice(i + 1).trim(),
      }
    }
  }

  return { vis, name: clean.trim(), type: '' }
}

function rebuildString(
  list: any[],
  index: number | string,
  vis: string,
  name: string,
  type: string,
) {
  const i = Number(index)
  const str = list[i] || ''
  const isStatic = str.includes('{static}')
  const isAbstract = str.includes('{abstract}')

  let newStr = ''
  if (isStatic) newStr += '{static} '
  if (isAbstract) newStr += '{abstract} '

  newStr += `${vis} ${name}`
  if (type) newStr += `: ${type}`

  list[i] = newStr
  saveState()
}

function setVisibility(list: any[], index: number | string, vis: string) {
  const i = Number(index)
  const parts = getParts(list[i])
  rebuildString(list, i, vis, parts.name, parts.type)
}

function setName(list: any[], index: number | string, name: string) {
  const i = Number(index)
  const parts = getParts(list[i])
  rebuildString(list, i, parts.vis, name, parts.type)
}

function setType(list: any[], index: number | string, type: string) {
  const i = Number(index)
  const parts = getParts(list[i])
  rebuildString(list, i, parts.vis, parts.name, type)
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

    <Handle
      id="t-bottom"
      type="target"
      :position="Position.Bottom"
      class="handle-target-horizontal"
    />
    <Handle id="s-bottom" type="source" :position="Position.Bottom" class="handle-source" />

    <div class="uml-header" :style="{ backgroundColor: data.color || '#f0f0f0' }">
      <div style="display: flex; justify-content: center; margin-bottom: 2px">
        <select v-model="stereotypeValue" class="nodrag stereotype-select" @change="saveState">
          <option value="">&lt;&lt;&gt;&gt;</option>
          <option value="<<interface>>">&lt;&lt;interface&gt;&gt;</option>
          <option value="<<entity>>">&lt;&lt;entity&gt;&gt;</option>
          <option value="<<control>>">&lt;&lt;control&gt;&gt;</option>
          <option value="<<boundary>>">&lt;&lt;boundary&gt;&gt;</option>
          <option value="<<utility>>">&lt;&lt;utility&gt;&gt;</option>
          <option value="<<exception>>">&lt;&lt;exception&gt;&gt;</option>
          <option value="<<abstract>>">&lt;&lt;abstract&gt;&gt;</option>
          <option value="<<enum>>">&lt;&lt;enum&gt;&gt;</option>
        </select>
      </div>
      <div style="display: flex; align-items: center">
        <input
          v-model="data.label"
          class="nodrag title-input"
          :class="{ 'is-abstract-title': data.isAbstract }"
          placeholder="Nombre Clase"
          @focus="onFocus(data.label || '')"
          @keyup.esc="cancelEdit($event, 'label')"
          @change="saveState"
        />
        <button
          class="nodrag modifier-btn"
          style="margin-left: 4px"
          :class="{ active: data.isAbstract }"
          @click="toggleAbstract"
          title="Toggle Abstract"
        >
          A
        </button>
      </div>
    </div>

    <div class="uml-body">
      <div v-for="(attr, i) in data.attributes" :key="'a' + i" class="editable-item">
        <button
          class="nodrag modifier-btn"
          :class="{ active: data.attributes[i].includes('{static}') }"
          @click="toggleModifier(data.attributes, i, '{static}')"
          title="Static"
        >
          S
        </button>
        <div class="structured-input">
          <select
            class="nodrag vis-select"
            :value="getParts(data.attributes[i]).vis"
            @change="setVisibility(data.attributes, i, ($event.target as HTMLSelectElement).value)"
          >
            <option value="+">+</option>
            <option value="-">-</option>
            <option value="#">#</option>
            <option value="~">~</option>
          </select>
          <input
            :value="getParts(data.attributes[i]).name"
            @change="setName(data.attributes, i, ($event.target as HTMLInputElement).value)"
            @focus="onFocus(data.attributes[i])"
            @keyup.esc="cancelEdit($event, 'attribute', i)"
            class="nodrag item-input name-input"
            :class="{
              'is-static': data.attributes[i].includes('{static}'),
              'is-abstract': data.attributes[i].includes('{abstract}'),
            }"
            placeholder="nombre"
          />
          <span class="colon">:</span>
          <input
            :value="getParts(data.attributes[i]).type"
            @change="setType(data.attributes, i, ($event.target as HTMLInputElement).value)"
            @focus="onFocus(data.attributes[i])"
            @keyup.esc="cancelEdit($event, 'attribute', i)"
            class="nodrag item-input type-input"
            :class="{
              'is-static': data.attributes[i].includes('{static}'),
              'is-abstract': data.attributes[i].includes('{abstract}'),
            }"
            placeholder="tipo"
          />
        </div>
        <button class="delete-btn" @click="removeItem(data.attributes, i)">×</button>
      </div>
      <button class="add-btn nodrag" @click="addAttribute">+ Atributo</button>
    </div>

    <div class="uml-separator"></div>

    <div class="uml-body">
      <div v-for="(meth, i) in data.methods" :key="'m' + i" class="editable-item">
        <button
          class="nodrag modifier-btn"
          :class="{ active: data.methods[i].includes('{static}') }"
          @click="toggleModifier(data.methods, i, '{static}')"
          title="Static"
        >
          S
        </button>
        <button
          class="nodrag modifier-btn"
          :class="{ active: data.methods[i].includes('{abstract}') }"
          @click="toggleModifier(data.methods, i, '{abstract}')"
          title="Abstract"
        >
          A
        </button>

        <div class="structured-input">
          <select
            class="nodrag vis-select"
            :value="getParts(data.methods[i]).vis"
            @change="setVisibility(data.methods, i, ($event.target as HTMLSelectElement).value)"
          >
            <option value="+">+</option>
            <option value="-">-</option>
            <option value="#">#</option>
            <option value="~">~</option>
          </select>
          <input
            :value="getParts(data.methods[i]).name"
            @change="setName(data.methods, i, ($event.target as HTMLInputElement).value)"
            @focus="onFocus(data.methods[i])"
            @keyup.esc="cancelEdit($event, 'method', i)"
            class="nodrag item-input name-input"
            :class="{
              'is-static': data.methods[i].includes('{static}'),
              'is-abstract': data.methods[i].includes('{abstract}'),
            }"
            placeholder="metodo()"
          />
          <span class="colon">:</span>
          <input
            :value="getParts(data.methods[i]).type"
            @change="setType(data.methods, i, ($event.target as HTMLInputElement).value)"
            @focus="onFocus(data.methods[i])"
            @keyup.esc="cancelEdit($event, 'method', i)"
            class="nodrag item-input type-input"
            :class="{
              'is-static': data.methods[i].includes('{static}'),
              'is-abstract': data.methods[i].includes('{abstract}'),
            }"
            placeholder="tipo"
          />
        </div>
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
  box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.2);
  /* Importante para que los handles se posicionen relativos a esto */
  position: relative;
}

.is-selected {
  border-color: #1976d2;
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

.is-abstract {
  font-style: italic;
}
.is-abstract-title {
  font-style: italic;
}
.is-static {
  text-decoration: underline;
}

.stereotype-select {
  width: 90%;
  text-align: center;
  text-align-last: center;
  font-size: 11px;
  font-style: italic;
  border: none;
  background: transparent;
  outline: none;
  margin-bottom: 2px;
  cursor: pointer;
  color: #555;
}
.modifier-btn {
  font-size: 10px;
  padding: 0 4px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 3px;
  cursor: pointer;
  margin-right: 2px;
  color: #aaa;
}
.modifier-btn.active {
  background: #e3f2fd;
  color: #1976d2;
  border-color: #1976d2;
  font-weight: bold;
}

.structured-input {
  display: flex;
  align-items: center;
  flex: 1;
  margin: 0 4px;
}
.vis-select {
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  font-family: monospace;
  font-weight: bold;
  appearance: none;
  -webkit-appearance: none;
  padding: 0 4px;
  color: #333;
}
.name-input {
  flex: 1;
  min-width: 20px;
  width: auto;
  padding: 0 2px;
}
.type-input {
  flex: 1;
  min-width: 20px;
  width: auto;
  color: #005cc5;
  padding: 0 2px;
}
.colon {
  margin: 0 2px;
  font-weight: bold;
}
</style>
