<script setup lang="ts">
import { ref, onMounted, markRaw, nextTick, provide } from 'vue';
import { useRoute } from 'vue-router';
import { VueFlow, useVueFlow, type Node, type Edge } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { onKeyStroke } from '@vueuse/core';
import axios from 'axios';

// LIBRERÍAS EXPORTACIÓN
import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

import UMLClassNode from '../components/editor/UMLClassNode.vue';
import UMLEdge from '../components/editor/UMLEdge.vue';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

const route = useRoute();
const projectId = route.params.id;

// --- VUE FLOW CORE ---
const { 
  addNodes, toObject, fromObject, onConnect, addEdges, 
  onNodeClick, onPaneClick, onEdgeClick,
  getNodes, fitView, setViewport, getViewport,
  onNodeDragStop, onNodesChange, onEdgesChange 
} = useVueFlow();

// --- ESTADO UI ---
const drawer = ref(true);
const selectedNode = ref<Node | null>(null);
const selectedEdge = ref<Edge | null>(null);

// --- SISTEMA DE HISTORIAL (Manual y Robusto) ---
const historyStack = ref<string[]>([]);
const historyPointer = ref(-1);
const isRestoring = ref(false); // Bandera de seguridad

// Función para guardar una "foto" del estado actual
const saveState = () => {
  if (isRestoring.value) return; // Si estamos restaurando, NO guardar

  // Cortamos el futuro si estamos en medio del historial
  if (historyPointer.value < historyStack.value.length - 1) {
    historyStack.value = historyStack.value.slice(0, historyPointer.value + 1);
  }

  // Guardamos el estado
  const state = JSON.stringify(toObject());
  
  // Evitar duplicados consecutivos (si no ha cambiado nada real)
  if (historyStack.value.length > 0 && historyStack.value[historyPointer.value] === state) {
    return;
  }

  historyStack.value.push(state);
  historyPointer.value++;
  
  // Limite de memoria (opcional, últimos 50 pasos)
  if (historyStack.value.length > 50) {
    historyStack.value.shift();
    historyPointer.value--;
  }
};

provide('saveState', saveState);

// Función Undo (Deshacer)
const undo = async () => {
  if (historyPointer.value > 0) {
    isRestoring.value = true; // BLOQUEAR GUARDADO
    historyPointer.value--;
    const jsonString = historyStack.value[historyPointer.value];
    
    if (jsonString) {
      const state = JSON.parse(jsonString);
      await fromObject(state);
    }
    
    // Esperamos un poco antes de desbloquear para que se asienten los eventos
    setTimeout(() => { isRestoring.value = false; }, 200);
  }
};

// Función Redo (Rehacer)
const redo = async () => {
  if (historyPointer.value < historyStack.value.length - 1) {
    isRestoring.value = true; // BLOQUEAR GUARDADO
    historyPointer.value++;
    const jsonString = historyStack.value[historyPointer.value];
    
    if (jsonString) {
      const state = JSON.parse(jsonString);
      await fromObject(state);
    }
    
    setTimeout(() => { isRestoring.value = false; }, 200);
  }
};

// --- TRIGGERS DEL HISTORIAL (¿Cuándo guardar?) ---

// 1. Al conectar dos nodos
onConnect((params) => {
  addEdges([{ 
    ...params, 
    type: 'uml-edge', 
    data: { markerEnd: 'url(#arrow-closed)' },
    updatable: true
  }]);
  setTimeout(saveState, 50); // Guardar tras añadir
});

// 2. Al terminar de mover un nodo
onNodeDragStop(() => {
  saveState();
});

// 3. Al borrar o añadir (detectado por cambios en nodos/bordes)
onNodesChange((changes) => {
  // Filtramos solo eventos de añadir/borrar para no saturar con selección
  const isStructuralChange = changes.some(c => c.type === 'add' || c.type === 'remove');
  if (isStructuralChange) {
    // Usamos nextTick para esperar a que Vue Flow procese el cambio
    nextTick(() => setTimeout(saveState, 100));
  }
});
onEdgesChange((changes) => {
  const isStructuralChange = changes.some(c => c.type === 'add' || c.type === 'remove');
  if (isStructuralChange) {
    nextTick(() => setTimeout(saveState, 100));
  }
});

// 4. Teclas Rápidas
onKeyStroke(['z', 'Z'], (e) => {
  if (e.ctrlKey || e.metaKey) { e.preventDefault(); undo(); }
});
onKeyStroke(['y', 'Y'], (e) => {
  if (e.ctrlKey || e.metaKey) { e.preventDefault(); redo(); }
});


// --- COMPONENTES ---
const nodeTypes: any = { 'uml-class': markRaw(UMLClassNode) };
const edgeTypes: any = { 'uml-edge': markRaw(UMLEdge) };
const colorPalette = ['#f0f0f0', '#BBDEFB', '#C8E6C9', '#FFF9C4', '#FFCDD2', '#E1BEE7'];

// --- SELECCIÓN ---
onNodeClick(({ node }) => { selectedNode.value = node; selectedEdge.value = null; });
onEdgeClick(({ edge }) => { selectedEdge.value = edge; selectedNode.value = null; });
onPaneClick(() => { selectedNode.value = null; selectedEdge.value = null; });

// --- ACTUALIZADORES (Con guardado manual) ---
function updateNodeColor(color: string) {
  if (selectedNode.value) {
    selectedNode.value.data.color = color;
    saveState(); // <--- GUARDAMOS AL CAMBIAR COLOR
  }
}

function updateEdgeType(typeId: string) {
  if (selectedEdge.value) {
    selectedEdge.value.data.markerEnd = `url(#${typeId})`;
    selectedEdge.value.data = { ...selectedEdge.value.data }; 
    saveState(); // <--- GUARDAMOS AL CAMBIAR TIPO
  }
}

// --- EXPORTAR ---
async function downloadExport(format: 'pdf' | 'png' | 'jpeg') {
  const nodesVal = getNodes.value;
  if (nodesVal.length === 0) return alert("Nada que exportar.");
  
  const currentViewport = getViewport();
  await fitView({ padding: 0.2, duration: 0 });
  await new Promise((r) => setTimeout(r, 100));

  const el = document.querySelector('.vue-flow__viewport') as HTMLElement;
  if (!el) return;

  try {
    const bounds = el.getBoundingClientRect();
    const options = {
      backgroundColor: '#ffffff', width: bounds.width, height: bounds.height,
      style: { transform: el.style.transform, transformOrigin: 'top left' }, pixelRatio: 2
    };

    let dataUrl = format === 'jpeg' ? await toJpeg(el, options) : await toPng(el, options);

    if (format === 'pdf') {
      const pdf = new jsPDF(bounds.width > bounds.height ? 'l' : 'p', 'px', [bounds.width, bounds.height]);
      pdf.addImage(dataUrl, 'PNG', 0, 0, bounds.width, bounds.height);
      pdf.save(`Diagrama_${projectId}.pdf`);
    } else {
      const link = document.createElement('a');
      link.download = `Diagrama.${format}`; link.href = dataUrl; link.click();
    }
  } catch (e) { console.error(e); alert('Error exportando'); } 
  finally { setViewport(currentViewport); }
}

// --- API ---
onMounted(async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`http://localhost:3000/api/diagrams/${projectId}`, { headers: { Authorization: `Bearer ${token}` } });
    
    if (res.data?.content) {
      let content = res.data.content;
      
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
        } catch (err) {
          console.error("Error al parsear el diagrama:", err);
          return;
        }
      }

      // Cargamos el diagrama
      await fromObject(content);
    }
    
    // Guardar estado inicial tras cargar
    setTimeout(() => {
        saveState();
    }, 500);
    
  } catch (e) { console.error(e); }
});

async function saveDiagram() {
  try {
    const token = localStorage.getItem('token');
    await axios.post(`http://localhost:3000/api/diagrams/${projectId}`, { content: toObject() }, { headers: { Authorization: `Bearer ${token}` } });
    alert('Guardado en la nube');
  } catch (e) { alert('Error guardando'); }
}

function addClassNode() {
  addNodes([{
    id: Date.now().toString(), type: 'uml-class',
    position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
    data: { label: 'Clase', attributes: ['+ attr'], methods: ['+ method()'], color: '#f0f0f0' },
  }]);
  // No hace falta saveState aqui, onNodesChange lo detectará
}
</script>

<template>
  <v-layout class="fill-height">
    <v-navigation-drawer v-model="drawer" permanent location="left" width="280" color="grey-lighten-5">
      <div class="pa-4">
        <h2 class="text-h6 font-weight-bold mb-4 d-flex align-center">
          <v-icon icon="mdi-school" color="primary" class="mr-2"></v-icon> Panel Aula
        </h2>

        <div class="d-flex mb-4 gap-2">
          <v-btn 
            size="small" 
            variant="tonal" 
            class="flex-grow-1" 
            :disabled="historyPointer <= 0" 
            @click="undo" 
            prepend-icon="mdi-undo"
          >
            Deshacer
          </v-btn>
          <v-btn 
            size="small" 
            variant="tonal" 
            class="flex-grow-1" 
            :disabled="historyPointer >= historyStack.length - 1" 
            @click="redo" 
            icon="mdi-redo"
          >
          </v-btn>
        </div>
        
        <v-divider class="mb-4"></v-divider>

        <v-expand-transition>
          <v-card v-if="selectedNode" class="mb-4 pa-3 bg-white border-primary" variant="outlined">
            <div class="text-subtitle-2 font-weight-bold mb-2 text-primary">🎨 Color Clase</div>
            <div class="d-flex justify-space-between flex-wrap">
              <v-btn v-for="color in colorPalette" :key="color" icon size="x-small" class="ma-1"
                :style="{ backgroundColor: color }" @click="updateNodeColor(color)" elevation="1">
                <v-icon v-if="selectedNode.data.color === color" size="small">mdi-check</v-icon>
              </v-btn>
            </div>
          </v-card>
        </v-expand-transition>

        <v-expand-transition>
          <v-card v-if="selectedEdge" class="mb-4 pa-3 bg-white border-secondary" variant="outlined" style="border-color: #757575;">
            <div class="text-subtitle-2 font-weight-bold mb-2 text-secondary">🔗 Tipo Relación</div>
            <v-list density="compact" nav>
              <v-list-item @click="updateEdgeType('arrow-closed')" title="Asociación (Simple)" prepend-icon="mdi-arrow-right-thin"></v-list-item>
              <v-list-item @click="updateEdgeType('inheritance')" title="Herencia (Extends)" prepend-icon="mdi-triangle-outline"></v-list-item>
              <v-list-item @click="updateEdgeType('composition')" title="Composición (Full)" prepend-icon="mdi-cards-diamond"></v-list-item>
              <v-list-item @click="updateEdgeType('aggregation')" title="Agregación (Empty)" prepend-icon="mdi-cards-diamond-outline"></v-list-item>
            </v-list>
          </v-card>
        </v-expand-transition>

        <v-btn block color="primary" class="mb-3" prepend-icon="mdi-shape-square-plus" @click="addClassNode">Añadir Clase</v-btn>
        <v-btn block color="success" variant="tonal" class="mb-3" prepend-icon="mdi-content-save" @click="saveDiagram">Guardar</v-btn>

        <v-menu location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn block color="secondary" variant="outlined" prepend-icon="mdi-download" v-bind="props">Exportar...</v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="downloadExport('pdf')" title="PDF" prepend-icon="mdi-file-pdf-box"></v-list-item>
            <v-list-item @click="downloadExport('png')" title="PNG" prepend-icon="mdi-image"></v-list-item>
            <v-list-item @click="downloadExport('jpeg')" title="JPG" prepend-icon="mdi-file-jpg-box"></v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-navigation-drawer>

    <v-main class="editor-area">
      <v-btn icon size="small" position="absolute" style="top:15px; left:15px; z-index:10" @click="drawer = !drawer">
        <v-icon>{{ drawer ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon>
      </v-btn>

      <VueFlow :node-types="nodeTypes" :edge-types="edgeTypes" :fit-view-on-init="true">
        <Background pattern-color="#aaa" :gap="20" />
        <Controls />
        <svg style="position: absolute; width: 0; height: 0;">
          <defs>
            <marker id="arrow-closed" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10" fill="none" stroke="black" stroke-width="1.5" />
            </marker>
            <marker id="inheritance" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="10" markerHeight="10" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="white" stroke="black" stroke-width="1.5" />
            </marker>
            <marker id="composition" viewBox="0 0 20 10" refX="20" refY="5" markerWidth="14" markerHeight="10" orient="auto">
              <path d="M0,5 L10,0 L20,5 L10,10 z" fill="black" stroke="black" />
            </marker>
            <marker id="aggregation" viewBox="0 0 20 10" refX="20" refY="5" markerWidth="14" markerHeight="10" orient="auto">
              <path d="M0,5 L10,0 L20,5 L10,10 z" fill="white" stroke="black" stroke-width="1.5" />
            </marker>
          </defs>
        </svg>
      </VueFlow>
    </v-main>
  </v-layout>
</template>

<style scoped>
.editor-area { height: 100vh; width: 100%; background: #fdfdfd; }
.border-primary { border: 2px solid #1976D2 !important; }
.border-secondary { border: 2px solid #757575 !important; }
.gap-2 { gap: 8px; }
</style>