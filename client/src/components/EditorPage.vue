<script setup lang="ts">
import { ref, markRaw } from 'vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import UMLClassNode from '../components/editor/UMLClassNode.vue'; // Importamos nuestro nodo

// Importar estilos obligatorios de Vue Flow
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

// 1. Configuración de Nodos
// Registramos nuestro componente personalizado como tipo 'uml-class'
const nodeTypes: any = { 
  'uml-class': markRaw(UMLClassNode),
};

// 2. Estado del diagrama (Inicialmente vacío o con un ejemplo)
const elements = ref([
  {
    id: '1',
    type: 'uml-class', // Usamos nuestro diseño
    label: 'Usuario',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Usuario',
      attributes: ['+ id: int', '+ email: string'],
      methods: ['+ login()', '+ logout()'] 
    },
  },
]);

// 3. Funcionalidad: Añadir nueva clase
const { addNodes } = useVueFlow();

function addClassNode() {
  const id = Date.now().toString(); // ID único temporal
  const newNode = {
    id: id,
    type: 'uml-class',
    position: { x: Math.random() * 400, y: Math.random() * 400 }, // Posición aleatoria
    data: { 
      label: 'NuevaClase', 
      attributes: [], 
      methods: [] 
    },
  };
  addNodes([newNode]);
}

// 4. Funcionalidad: Guardar (Simulado por ahora)
function saveDiagram() {
  console.log('JSON a guardar en BD:', JSON.stringify(elements.value));
  alert('Diagrama exportado a consola (F12)');
}
</script>

<template>
  <v-layout class="fill-height">
    <v-navigation-drawer permanent location="left" width="250" color="grey-lighten-4">
      <div class="pa-4">
        <h3 class="text-h6 mb-4">Herramientas</h3>
        
        <v-btn block color="primary" class="mb-2" prepend-icon="mdi-plus-box" @click="addClassNode">
          Añadir Clase
        </v-btn>

        <v-divider class="my-4"></v-divider>

        <v-btn block color="success" variant="outlined" prepend-icon="mdi-content-save" @click="saveDiagram">
          Guardar Proyecto
        </v-btn>
        
        <div class="mt-4 text-caption text-grey">
          Selecciona una clase y pulsa "Backspace" para borrarla.
        </div>
      </div>
    </v-navigation-drawer>

    <v-main class="editor-container">
      <VueFlow v-model="elements" :node-types="nodeTypes" :fit-view-on-init="true">
        <Background pattern-color="#aaa" :gap="20" />
        
        <Controls />
      </VueFlow>
    </v-main>
  </v-layout>
</template>

<style scoped>
.editor-container {
  height: 100vh; /* Ocupa toda la altura */
  width: 100%;
  background: #fff;
}
</style>