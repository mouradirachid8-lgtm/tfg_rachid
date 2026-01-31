<script setup lang="ts">
import { ref, onMounted, markRaw } from 'vue';
import { useRoute } from 'vue-router';
import { VueFlow, useVueFlow, type Node, getRectOfNodes } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import axios from 'axios';

// LIBRERÍAS PARA PDF
import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

import UMLClassNode from '../components/editor/UMLClassNode.vue';
import UMLEdge from '../components/editor/UMLEdge.vue';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

const route = useRoute();
const projectId = route.params.id;
const { addNodes, toObject, fromObject, onConnect, addEdges, onNodeClick, onPaneClick, getNodes, fitView, setViewport, getViewport } = useVueFlow();

const drawer = ref(true);
const isLocked = ref(false);
const elements = ref([]);
const selectedNode = ref<Node | null>(null); // Guardamos qué nodo ha tocado el usuario

const nodeTypes: any = { 'uml-class': markRaw(UMLClassNode) };
const edgeTypes: any = { 'uml-edge': markRaw(UMLEdge) };

// COLORES DISPONIBLES (Estilo pastel para que se lea el texto)
const colorPalette = [
  '#f0f0f0', // Gris (Default)
  '#BBDEFB', // Azul suave
  '#C8E6C9', // Verde suave
  '#FFF9C4', // Amarillo suave
  '#FFCDD2', // Rojo suave
  '#E1BEE7', // Violeta suave
];

// --- LOGICA DE SELECCIÓN ---
onNodeClick(({ node }) => {
  selectedNode.value = node; // Activamos panel de color
});

onPaneClick(() => {
  selectedNode.value = null; // Si clicas fuera, deseleccionamos
});

// --- CAMBIAR COLOR ---
function updateNodeColor(color: string) {
  if (selectedNode.value) {
    selectedNode.value.data.color = color; // Esto actualiza el nodo automáticamente
  }
}

// --- LOGICA PDF ---
async function downloadExport(format: 'pdf' | 'png' | 'jpeg') {
  const nodes = getNodes.value;
  if (nodes.length === 0) {
    alert("No hay diagrama para exportar.");
    return;
  }

  const currentViewport = getViewport();

  await fitView({ padding: 0.2, duration: 0 });
  
  await new Promise((resolve) => setTimeout(resolve, 100));

  const element = document.querySelector('.vue-flow__viewport') as HTMLElement;
  if (!element) return;

  try {
    const bounds = element.getBoundingClientRect();
    
    const options = {
      backgroundColor: '#ffffff',
      width: bounds.width,
      height: bounds.height,
      style: {
        transform: element.style.transform,
        transformOrigin: 'top left'
      },
      pixelRatio: 2 
    };

    let dataUrl = '';
    if (format === 'jpeg') {
      dataUrl = await toJpeg(element, options);
    } else {
      dataUrl = await toPng(element, options); 
    }

    if (format === 'pdf') {
      const pdf = new jsPDF(bounds.width > bounds.height ? 'l' : 'p', 'px', [bounds.width, bounds.height]);
      pdf.addImage(dataUrl, 'PNG', 0, 0, bounds.width, bounds.height);
      pdf.save(`Diagrama_${projectId}.pdf`);
    } else {
      const link = document.createElement('a');
      link.download = `Diagrama_${projectId}.${format}`;
      link.href = dataUrl;
      link.click();
    }

  } catch (err) {
    console.error('Error al exportar:', err);
    alert('Error generando el archivo.');
  } finally {
    setViewport(currentViewport);
  }
}

// ... (Resto de funciones: onConnect, saveDiagram, addClassNode, onMounted MANTENER IGUAL) ...
onConnect((params) => {
  addEdges([{ ...params, type: 'uml-edge', data: { sourceLabel: '', targetLabel: '', middleLabel: '' } }]);
});

onMounted(async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`http://localhost:3000/api/diagrams/${projectId}`, {
       headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data?.content) {
      const content = typeof res.data.content === 'string' ? JSON.parse(res.data.content) : res.data.content;
      if (content) fromObject(content);
    }
  } catch (error) { console.error("Error loading", error); }
});

async function saveDiagram() {
  const flowData = toObject();
  try {
    const token = localStorage.getItem('token');
    await axios.post(`http://localhost:3000/api/diagrams/${projectId}`, { content: flowData }, {
       headers: { Authorization: `Bearer ${token}` }
    });
    alert('Guardado correctamente');
  } catch (error) { alert('Error guardando'); }
}

function addClassNode() {
  const newNode = {
    id: Date.now().toString(),
    type: 'uml-class',
    position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
    data: { label: 'Nueva Clase', attributes: ['+ atributo'], methods: ['+ metodo()'], color: '#f0f0f0' },
  };
  addNodes([newNode]);
}
</script>

<template>
  <v-layout class="fill-height">
    <v-navigation-drawer v-model="drawer" permanent location="left" width="280" color="grey-lighten-5">
      <div class="pa-4">
        <h2 class="text-h6 font-weight-bold mb-4 d-flex align-center">
          <v-icon icon="mdi-school" color="primary" class="mr-2"></v-icon>
          Panel Aula
        </h2>

        <v-expand-transition>
          <v-card v-if="selectedNode" class="mb-4 pa-3 bg-white border-primary" variant="outlined" style="border-color: #1976D2;">
            <div class="text-subtitle-2 font-weight-bold mb-2 text-primary">
              🎨 Personalizar Clase
            </div>
            <div class="d-flex justify-space-between flex-wrap">
              <v-btn
                v-for="color in colorPalette"
                :key="color"
                icon
                size="x-small"
                class="ma-1"
                :style="{ backgroundColor: color }"
                @click="updateNodeColor(color)"
                elevation="2"
              >
                <v-icon v-if="selectedNode.data.color === color" size="small">mdi-check</v-icon>
              </v-btn>
            </div>
          </v-card>
        </v-expand-transition>

        <v-card variant="outlined" class="mb-4 pa-2 bg-white">
          <v-switch v-model="isLocked" color="error" label="Bloquear Alumnos" hide-details density="compact"></v-switch>
        </v-card>
        
        <v-divider class="mb-4"></v-divider>

        <v-btn block color="primary" class="mb-3" prepend-icon="mdi-shape-square-plus" @click="addClassNode">
          Añadir Clase
        </v-btn>

        <v-btn block color="success" variant="tonal" class="mb-3" prepend-icon="mdi-content-save" @click="saveDiagram">
          Guardar Cambios
        </v-btn>

        <v-menu location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn 
              block 
              color="secondary" 
              variant="outlined" 
              prepend-icon="mdi-download" 
              v-bind="props"
            >
              Exportar Diagrama...
            </v-btn>
          </template>

          <v-list density="compact">
            <v-list-item @click="downloadExport('pdf')" value="pdf">
              <template v-slot:prepend>
                <v-icon icon="mdi-file-pdf-box" color="red"></v-icon>
              </template>
              <v-list-item-title>Documento PDF</v-list-item-title>
            </v-list-item>

            <v-list-item @click="downloadExport('png')" value="png">
              <template v-slot:prepend>
                <v-icon icon="mdi-image" color="blue"></v-icon>
              </template>
              <v-list-item-title>Imagen PNG (Transparente)</v-list-item-title>
            </v-list-item>

            <v-list-item @click="downloadExport('jpeg')" value="jpeg">
              <template v-slot:prepend>
                <v-icon icon="mdi-file-jpg-box" color="orange"></v-icon>
              </template>
              <v-list-item-title>Imagen JPG (Compacta)</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

      </div>
    </v-navigation-drawer>

    <v-main class="editor-area">
       <v-btn icon size="small" position="absolute" style="top: 15px; left: 15px; z-index: 10;" @click="drawer = !drawer">
        <v-icon>{{ drawer ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon>
      </v-btn>

      <VueFlow v-model="elements" :node-types="nodeTypes" :edge-types="edgeTypes" :fit-view-on-init="true">
        <Background pattern-color="#aaa" :gap="20" />
        <Controls />
      </VueFlow>
    </v-main>
  </v-layout>
</template>

<style scoped>
.editor-area { height: 100vh; width: 100%; background: #fdfdfd; }
.border-primary { border: 2px solid #1976D2 !important; }
</style>