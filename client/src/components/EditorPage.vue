<script setup lang="ts">
import { ref, onMounted, markRaw } from 'vue';
import { useRoute } from 'vue-router';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import axios from 'axios';

import UMLClassNode from '../components/editor/UMLClassNode.vue';
import UMLEdge from '../components/editor/UMLEdge.vue'; 

// Estilos obligatorios de Vue Flow
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

const route = useRoute();
const projectId = route.params.id;

// Importamos utilidades de Vue Flow
const { addNodes, toObject, fromObject, onConnect, addEdges } = useVueFlow();

// --- ESTADO DE LA INTERFAZ ---
const drawer = ref(true); // Barra lateral visible por defecto
const isLocked = ref(false); // Switch de Modo Profesor
const elements = ref([]); // Elementos del diagrama (nodos + conexiones)

// --- REGISTRO DE COMPONENTES ---
const nodeTypes: any = {
  'uml-class': markRaw(UMLClassNode),
};

const edgeTypes: any = {
  'uml-edge': markRaw(UMLEdge), 
};

// --- 1. LÓGICA DE FLECHAS ---
// Cuando el usuario une dos puntos, creamos una flecha tipo 'uml-edge'
// con datos vacíos para que aparezcan los inputs.
onConnect((params) => {
  addEdges([{ 
    ...params, 
    type: 'uml-edge', 
    data: { sourceLabel: '', targetLabel: '', middleLabel: '' } 
  }]);
});

// --- 2. CARGAR DIAGRAMA ---
onMounted(async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`http://localhost:3000/api/diagrams/${projectId}`, {
       headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.data && res.data.content) {
      const content = typeof res.data.content === 'string' 
        ? JSON.parse(res.data.content) 
        : res.data.content;
      
      if (content) {
        fromObject(content);
      }
    }
  } catch (error) {
    console.error("Error cargando el diagrama:", error);
  }
});

// --- 3. GUARDAR DIAGRAMA ---
async function saveDiagram() {
  const flowData = toObject(); 
  
  try {
    const token = localStorage.getItem('token');
    await axios.post(`http://localhost:3000/api/diagrams/${projectId}`, {
      content: flowData 
    }, {
       headers: { Authorization: `Bearer ${token}` }
    });
    alert('¡Diagrama guardado correctamente!');
  } catch (error) {
    console.error(error);
    alert('Error al guardar en el servidor');
  }
}

// --- 4. AÑADIR CLASE ---
function addClassNode() {
  const newNode = {
    id: Date.now().toString(),
    type: 'uml-class',
    position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
    data: { 
      label: 'Nueva Clase', 
      attributes: ['+ atributo'], 
      methods: ['+ metodo()'] 
    },
  };
  addNodes([newNode]);
}
</script>

<template>
  <v-layout class="fill-height">
    
    <v-navigation-drawer 
      v-model="drawer"
      permanent
      location="left"
      width="280"
      color="grey-lighten-5"
      elevation="2"
    >
      <div class="pa-4">
        <h2 class="text-h6 font-weight-bold mb-4 d-flex align-center">
          <v-icon icon="mdi-school" color="primary" class="mr-2"></v-icon>
          Panel Aula
        </h2>

        <v-card variant="outlined" class="mb-4 pa-2 bg-white">
          <v-switch
            v-model="isLocked"
            color="error"
            label="Bloquear Alumnos"
            hide-details
            density="compact"
          ></v-switch>
          <div class="text-caption text-grey mt-1 ml-1">
            <v-icon size="x-small" :icon="isLocked ? 'mdi-lock' : 'mdi-lock-open-variant'"></v-icon>
            {{ isLocked ? 'Solo el profesor edita' : 'Clase participativa' }}
          </div>
        </v-card>
        
        <v-divider class="mb-4"></v-divider>

        <v-btn block color="primary" class="mb-3" prepend-icon="mdi-shape-square-plus" @click="addClassNode">
          Añadir Clase
        </v-btn>

        <v-btn block color="success" variant="tonal" prepend-icon="mdi-content-save" @click="saveDiagram">
          Guardar Cambios
        </v-btn>

        <v-spacer class="my-6"></v-spacer>
        
        <v-alert density="compact" type="info" variant="tonal" class="text-caption">
          Pulsa "Backspace" para borrar elementos seleccionados.
        </v-alert>
      </div>
    </v-navigation-drawer>

    <v-main class="editor-area">
      
      <v-btn
        icon
        size="small"
        elevation="2"
        position="absolute"
        style="top: 15px; left: 15px; z-index: 10; background-color: white;"
        @click="drawer = !drawer"
      >
        <v-icon color="primary">{{ drawer ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon>
        <v-tooltip activator="parent" location="right">
          {{ drawer ? 'Ocultar menú (Proyector)' : 'Mostrar herramientas' }}
        </v-tooltip>
      </v-btn>

      <VueFlow 
        v-model="elements" 
        :node-types="nodeTypes" 
        :edge-types="edgeTypes"
        :fit-view-on-init="true"
        :min-zoom="0.2"
        :max-zoom="4"
      >
        <Background pattern-color="#aaa" :gap="20" />
        <Controls />
      </VueFlow>

    </v-main>
  </v-layout>
</template>

<style scoped>
.editor-area {
  height: 100vh;
  width: 100%;
  background: #fdfdfd;
}

/* Ajuste para que el editor ocupe todo incluso si el drawer se cierra */
:deep(.v-main__wrap) {
  height: 100%;
  display: flex;
}
</style>