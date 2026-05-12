<script setup lang="ts">
import { ref, onMounted, markRaw, nextTick, provide, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { VueFlow, useVueFlow, type Node, type Edge } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { onKeyStroke } from '@vueuse/core'
import axios from 'axios'
import { io } from 'socket.io-client'
import dagre from 'dagre'

import { toPng, toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'

import { useProjectStore } from '../stores/projects'
import { useAuthStore } from '../stores/auth'
import ShareDialog from '../components/ShareDialog.vue'

import UMLClassNode from '../components/editor/UMLClassNode.vue'
import UMLEdge from '../components/editor/UMLEdge.vue'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

const route = useRoute()
const projectId = route.params.id as string

// --- STORES ---
const projectStore = useProjectStore()
const authStore = useAuthStore()
const showShareDialog = ref(false)

// Calculamos si soy el dueño
const isOwner = computed(() => {
  return projectStore.currentProject?.owner_id === authStore.user?.id
})

// Calculamos Rol
const currentUserRole = computed(() => {
  const myId = authStore.user?.id
  const me = projectStore.currentMembers.find((m) => m.id === myId)

  if (projectStore.currentProject?.owner_id === myId) return 'owner'
  return me?.role || 'viewer'
})

// Permiso Maestro de Edición
const canEdit = computed(() => {
  return currentUserRole.value === 'owner' || currentUserRole.value === 'editor'
})

// --- VUE FLOW CORE ---
const {
  addNodes,
  toObject,
  fromObject,
  onConnect,
  addEdges,
  onNodeClick,
  onPaneClick,
  onEdgeClick,
  getNodes,
  fitView,
  setViewport,
  getViewport,
  onNodeDragStop,
  onNodesChange,
  onEdgesChange,
  onPaneMouseMove,
  screenToFlowCoordinate,
  project,
  viewport,
} = useVueFlow()

// --- ESTADO UI ---
const drawer = ref(true)
const selectedNode = ref<Node | null>(null)
const selectedEdge = ref<Edge | null>(null)
const connectionMode = ref('association')

const markerMap: Record<string, string> = {
  association: 'url(#arrow-closed)',
  inheritance: 'url(#inheritance)',
  composition: 'url(#composition)',
  aggregation: 'url(#aggregation)',
  dependency: 'url(#dependency)',
}

// --- ESTADO COLABORATIVO (SOCKETS) ---
const socket = io('http://localhost:3000')
const collaborators = ref<any[]>([])
const cursors = ref<Record<string, any>>({})
const messages = ref<any[]>([])
const newMessage = ref('')
const isChatOpen = ref(false)
const myUserName = ref('Usuario')
const isRemoteUpdate = ref(false)

// --- HISTORIAL ---
const historyStack = ref<string[]>([])
const historyPointer = ref(-1)
const isRestoring = ref(false)

const saveState = () => {
  // CORRECCIÓN: Si no puede editar, no guardamos estado ni emitimos cambios
  if (!canEdit.value) return

  if (isRestoring.value || isRemoteUpdate.value) return
  if (historyPointer.value < historyStack.value.length - 1) {
    historyStack.value = historyStack.value.slice(0, historyPointer.value + 1)
  }
  const stateObj = toObject()
  const state = JSON.stringify(stateObj)
  if (historyStack.value.length > 0 && historyStack.value[historyPointer.value] === state) return

  historyStack.value.push(state)
  historyPointer.value++
  if (historyStack.value.length > 50) {
    historyStack.value.shift()
    historyPointer.value--
  }
  socket.emit('diagram-update', { projectId, content: stateObj })
}
provide('saveState', saveState)

const undo = async () => {
  if (!canEdit.value) return // CORRECCIÓN
  if (historyPointer.value > 0) {
    isRestoring.value = true
    historyPointer.value--
    const jsonString = historyStack.value[historyPointer.value]
    if (jsonString) {
      const state = JSON.parse(jsonString)
      await fromObject(state)
      socket.emit('diagram-update', { projectId, content: state })
    }
    setTimeout(() => {
      isRestoring.value = false
    }, 200)
  }
}

const redo = async () => {
  if (!canEdit.value) return // CORRECCIÓN
  if (historyPointer.value < historyStack.value.length - 1) {
    isRestoring.value = true
    historyPointer.value++
    const jsonString = historyStack.value[historyPointer.value]
    if (jsonString) {
      const state = JSON.parse(jsonString)
      await fromObject(state)
      socket.emit('diagram-update', { projectId, content: state })
    }
    setTimeout(() => {
      isRestoring.value = false
    }, 200)
  }
}

// --- ON MOUNTED ---
onMounted(async () => {
  const token = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    const u = JSON.parse(storedUser)
    authStore.user = u
    myUserName.value = u.name || u.username
  }

  await projectStore.fetchProjectById(projectId)

  try {
    const res = await axios.get(`http://localhost:3000/api/diagrams/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.data?.content) {
      let content = res.data.content
      if (typeof content === 'string') content = JSON.parse(content)
      await fromObject(content)
      initialState.value = JSON.stringify(content)
    }
    // Solo guardamos estado inicial si podemos editar
    if (canEdit.value)
      setTimeout(() => {
        saveState()
      }, 500)
  } catch (e) {
    console.error(e)
  }

  socket.emit('join-project', { projectId, userName: myUserName.value })

  socket.on('users-update', (users) => {
    collaborators.value = users
  })
  socket.on('remote-cursor', (data) => {
    cursors.value[data.id] = data
  })
  socket.on('diagram-sync', (content) => {
    isRemoteUpdate.value = true
    fromObject(content)
    setTimeout(() => {
      isRemoteUpdate.value = false
    }, 100)
  })
  socket.on('receive-message', (msg) => {
    messages.value.push(msg)
  })
})

onUnmounted(() => {
  socket.disconnect()
})

// --- SOCKETS EVENTS ---
onPaneMouseMove((event) => {
  const point = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
  socket.emit('cursor-move', { projectId, x: point.x, y: point.y, userName: myUserName.value })
})

const sendMessage = () => {
  if (!newMessage.value.trim()) return
  socket.emit('send-message', { projectId, message: newMessage.value, userName: myUserName.value })
  newMessage.value = ''
}

// --- LISTENERS ---
onConnect((params) => {
  if (!canEdit.value) return
  const isDep = connectionMode.value === 'dependency'
  addEdges([
    {
      ...params,
      type: 'uml-edge',
      data: {
        markerEnd: markerMap[connectionMode.value],
        isDependency: isDep,
      },
      updatable: true,
    },
  ])
  setTimeout(saveState, 50)
})

onNodeDragStop(() => {
  saveState()
})
onNodesChange((changes) => {
  if (!canEdit.value) return // CORRECCIÓN
  if (changes.some((c) => c.type === 'add' || c.type === 'remove'))
    nextTick(() => setTimeout(saveState, 100))
})
onEdgesChange((changes) => {
  if (!canEdit.value) return // CORRECCIÓN
  if (changes.some((c) => c.type === 'add' || c.type === 'remove'))
    nextTick(() => setTimeout(saveState, 100))
})

// CORRECCIÓN: Bloquear atajos de teclado si no es editor
onKeyStroke(['z', 'Z'], (e) => {
  if ((e.ctrlKey || e.metaKey) && canEdit.value) {
    e.preventDefault()
    undo()
  }
})
onKeyStroke(['y', 'Y'], (e) => {
  if ((e.ctrlKey || e.metaKey) && canEdit.value) {
    e.preventDefault()
    redo()
  }
})
const initialState = ref<string | null>(null)
const resetToInitialState = async () => {
  if (!canEdit.value) return
  if (!initialState.value) return

  isRestoring.value = true

  const state = JSON.parse(initialState.value)
  await fromObject(state)

  // reset del historial
  historyStack.value = [initialState.value]
  historyPointer.value = 0

  // sincronizar con backend/otros usuarios
  socket.emit('diagram-update', { projectId, content: state })

  setTimeout(() => {
    isRestoring.value = false
  }, 200)
}
onKeyStroke('Escape', async (e) => {
  e.preventDefault()

  if (canEdit.value) {
    await resetToInitialState()
  }

  selectedNode.value = null
  selectedEdge.value = null
})

// --- COMPONENTES Y UTILIDADES ---
const nodeTypes: any = { 'uml-class': markRaw(UMLClassNode) }
const edgeTypes: any = { 'uml-edge': markRaw(UMLEdge) }
const colorPalette = ['#f0f0f0', '#BBDEFB', '#C8E6C9', '#FFF9C4', '#FFCDD2', '#E1BEE7']

onNodeClick(({ node }) => {
  selectedNode.value = node
  selectedEdge.value = null
})
onEdgeClick(({ edge }) => {
  selectedEdge.value = edge
  selectedNode.value = null
})
onPaneClick(() => {
  selectedNode.value = null
  selectedEdge.value = null
})

function updateNodeColor(color: string) {
  if (selectedNode.value && canEdit.value) {
    // CORRECCIÓN
    selectedNode.value.data.color = color
    saveState()
  }
}
function updateEdgeType(typeId: string) {
  if (selectedEdge.value && canEdit.value) {
    selectedEdge.value.data.markerEnd = `url(#${typeId})`
    selectedEdge.value.data.isDependency = typeId === 'dependency'
    selectedEdge.value.data = { ...selectedEdge.value.data }
    saveState()
  }
}

function autoLayout() {
  if (!canEdit.value) return

  const g = new dagre.graphlib.Graph()

  g.setGraph({
    rankdir: 'TB',
    nodesep: 120,
    ranksep: 200,
    marginx: 50,
    marginy: 50,
    ranker: 'network-simplex',
  })

  g.setDefaultEdgeLabel(() => ({}))

  const stateObj = toObject()

  // 1. NODOS
  stateObj.nodes.forEach((node) => {
    const actual = getNodes.value.find((n) => n.id === node.id)
    g.setNode(node.id, {
      width: actual?.dimensions?.width || 220,
      height: actual?.dimensions?.height || 180,
    })
  })

  // 2. EDGES (SIN INVERSIÓN MANUAL)
  stateObj.edges.forEach((edge) => {
    const isInheritance = edge.data?.markerEnd?.includes('inheritance')

    g.setEdge(edge.source, edge.target, {
      weight: isInheritance ? 10 : 1, // 👈 CLAVE UML
    })
  })

  dagre.layout(g)

  // 3. POSICIÓN FINAL
  stateObj.nodes.forEach((node) => {
    const pos = g.node(node.id)
    const actual = getNodes.value.find((n) => n.id === node.id)

    node.position = {
      x: pos.x - (actual?.dimensions?.width || 220) / 2,
      y: pos.y - (actual?.dimensions?.height || 180) / 2,
    }
  })

  // 4. HANDLE LOGIC (ESTABLE)
  stateObj.edges.forEach((edge) => {
    const src = stateObj.nodes.find((n) => n.id === edge.source)
    const tgt = stateObj.nodes.find((n) => n.id === edge.target)
    if (!src || !tgt) return

    const dx = tgt.position.x - src.position.x
    const dy = tgt.position.y - src.position.y

    if (Math.abs(dx) > Math.abs(dy)) {
      edge.sourceHandle = dx > 0 ? 's-right' : 's-left'
      edge.targetHandle = dx > 0 ? 't-left' : 't-right'
    } else {
      edge.sourceHandle = dy > 0 ? 's-bottom' : 's-top'
      edge.targetHandle = dy > 0 ? 't-top' : 't-bottom'
    }
  })

  fromObject(stateObj).then(() => {
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 600 })
      saveState()
    }, 80)
  })
}

async function downloadExport(format: 'pdf' | 'png' | 'jpeg') {
  const nodesVal = getNodes.value
  if (nodesVal.length === 0) return alert('Nada que exportar.')
  const currentViewport = getViewport()
  await fitView({ padding: 0.2, duration: 0 })
  await new Promise((r) => setTimeout(r, 100))
  const el = document.querySelector('.vue-flow__viewport') as HTMLElement
  if (!el) return
  try {
    const bounds = el.getBoundingClientRect()
    const options = {
      backgroundColor: '#ffffff',
      width: bounds.width,
      height: bounds.height,
      style: { transform: el.style.transform, transformOrigin: 'top left' },
      pixelRatio: 2,
    }
    let dataUrl = format === 'jpeg' ? await toJpeg(el, options) : await toPng(el, options)
    if (format === 'pdf') {
      const pdf = new jsPDF(bounds.width > bounds.height ? 'l' : 'p', 'px', [
        bounds.width,
        bounds.height,
      ])
      pdf.addImage(dataUrl, 'PNG', 0, 0, bounds.width, bounds.height)
      pdf.save(`Diagrama_${projectId}.pdf`)
    } else {
      const link = document.createElement('a')
      link.download = `Diagrama.${format}`
      link.href = dataUrl
      link.click()
    }
  } catch (e) {
    console.error(e)
    alert('Error exportando')
  } finally {
    setViewport(currentViewport)
  }
}

async function saveDiagram() {
  if (!canEdit.value) return // CORRECCIÓN
  try {
    const token = localStorage.getItem('token')
    await axios.post(
      `http://localhost:3000/api/diagrams/${projectId}`,
      { content: toObject() },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    alert('Guardado en la nube')
  } catch (e) {
    alert('Error guardando')
  }
}

function addClassNode() {
  if (!canEdit.value) return // CORRECCIÓN
  addNodes([
    {
      id: Date.now().toString(),
      type: 'uml-class',
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: { label: 'Clase', attributes: ['+ attr'], methods: ['+ method()'], color: '#f0f0f0' },
    },
  ])
}
</script>

<template>
  <v-layout class="fill-height">
    <div class="presence-bar">
      <div
        v-for="user in collaborators"
        :key="user.id"
        class="user-avatar"
        :style="{ backgroundColor: user.color }"
        :title="user.name"
      >
        {{ user.name.charAt(0).toUpperCase() }}
      </div>
    </div>

    <v-navigation-drawer
      v-model="drawer"
      permanent
      location="left"
      width="280"
      color="grey-lighten-5"
    >
      <div class="pa-4">
        <h2 class="text-h6 font-weight-bold mb-4 d-flex align-center">
          <v-icon icon="mdi-school" color="primary" class="mr-2"></v-icon> Panel Aula
        </h2>

        <div class="d-flex mb-4 gap-2">
          <v-btn
            size="small"
            variant="tonal"
            class="flex-grow-1"
            :disabled="!canEdit || historyPointer <= 0"
            @click="undo"
            prepend-icon="mdi-undo"
            >Deshacer</v-btn
          >
          <v-btn
            size="small"
            variant="tonal"
            class="flex-grow-1"
            :disabled="!canEdit || historyPointer >= historyStack.length - 1"
            @click="redo"
            icon="mdi-redo"
          ></v-btn>
        </div>

        <v-divider class="mb-4"></v-divider>

        <v-expand-transition>
          <v-card
            v-if="selectedNode && canEdit"
            class="mb-4 pa-3 bg-white border-primary"
            variant="outlined"
          >
            <div class="text-subtitle-2 font-weight-bold mb-2 text-primary">🎨 Color Clase</div>
            <div class="d-flex justify-space-between flex-wrap">
              <v-btn
                v-for="color in colorPalette"
                :key="color"
                icon
                size="x-small"
                class="ma-1"
                :style="{ backgroundColor: color }"
                @click="updateNodeColor(color)"
                elevation="1"
              >
                <v-icon v-if="selectedNode.data.color === color" size="small">mdi-check</v-icon>
              </v-btn>
            </div>
          </v-card>
        </v-expand-transition>

        <v-expand-transition>
          <v-card
            v-if="selectedEdge && canEdit"
            class="mb-4 pa-3 bg-white border-secondary"
            variant="outlined"
            style="border-color: #757575"
          >
            <div class="text-subtitle-2 font-weight-bold mb-2 text-secondary">🔗 Tipo Relación</div>
            <v-list density="compact" nav>
              <v-list-item
                @click="updateEdgeType('arrow-closed')"
                title="Asociación"
                prepend-icon="mdi-arrow-right-thin"
              ></v-list-item>
              <v-list-item
                @click="updateEdgeType('dependency')"
                title="Dependencia"
                prepend-icon="mdi-arrow-right-dashed"
              ></v-list-item>
              <v-list-item
                @click="updateEdgeType('inheritance')"
                title="Herencia"
                prepend-icon="mdi-triangle-outline"
              ></v-list-item>
              <v-list-item
                @click="updateEdgeType('composition')"
                title="Composición"
                prepend-icon="mdi-cards-diamond"
              ></v-list-item>
              <v-list-item
                @click="updateEdgeType('aggregation')"
                title="Agregación"
                prepend-icon="mdi-cards-diamond-outline"
              ></v-list-item>
            </v-list>
          </v-card>
        </v-expand-transition>

        <v-card
          v-if="!selectedEdge && !selectedNode && canEdit"
          class="mb-4 pa-3 bg-white border-secondary"
          variant="outlined"
          style="border-color: #757575 !important"
        >
          <div class="text-subtitle-2 font-weight-bold mb-2 text-secondary">⚙️ Modo Conexión</div>
          <v-select
            v-model="connectionMode"
            :items="[
              { title: 'Selector (Sin Conectar)', value: 'selector' },
              { title: 'Asociación', value: 'association' },
              { title: 'Dependencia', value: 'dependency' },
              { title: 'Herencia', value: 'inheritance' },
              { title: 'Composición', value: 'composition' },
              { title: 'Agregación', value: 'aggregation' },
            ]"
            density="compact"
            hide-details
            variant="solo"
            class="mb-2"
          ></v-select>
        </v-card>

        <v-btn
          v-if="canEdit"
          block
          color="secondary"
          variant="tonal"
          class="mb-3"
          prepend-icon="mdi-auto-fix"
          @click="autoLayout"
          >Auto-Ordenar</v-btn
        >
        <v-btn
          v-if="canEdit"
          block
          color="primary"
          class="mb-3"
          prepend-icon="mdi-shape-square-plus"
          @click="addClassNode"
          >Añadir Clase</v-btn
        >
        <v-btn
          v-if="canEdit"
          block
          color="success"
          variant="tonal"
          class="mb-3"
          prepend-icon="mdi-content-save"
          @click="saveDiagram"
          >Guardar</v-btn
        >

        <v-menu location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              block
              color="secondary"
              variant="outlined"
              prepend-icon="mdi-download"
              v-bind="props"
              >Exportar...</v-btn
            >
          </template>
          <v-list density="compact">
            <v-list-item
              @click="downloadExport('pdf')"
              title="PDF"
              prepend-icon="mdi-file-pdf-box"
            ></v-list-item>
            <v-list-item
              @click="downloadExport('png')"
              title="PNG"
              prepend-icon="mdi-image"
            ></v-list-item>
            <v-list-item
              @click="downloadExport('jpeg')"
              title="JPG"
              prepend-icon="mdi-file-jpg-box"
            ></v-list-item>
          </v-list>
        </v-menu>
      </div>

      <v-divider class="mb-4"></v-divider>

      <div class="mb-4 px-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-subtitle-2 font-weight-bold text-primary d-flex align-center">
            <v-icon icon="mdi-account-group" size="small" class="mr-2"></v-icon>
            Equipo ({{ collaborators.length }})
          </div>

          <v-btn
            v-if="isOwner"
            size="small"
            variant="tonal"
            prepend-icon="mdi-account-plus"
            color="primary"
            @click="showShareDialog = true"
            >Permisos</v-btn
          >
        </div>

        <v-card
          variant="outlined"
          class="pa-0 border-thin"
          style="max-height: 150px; overflow-y: auto"
        >
          <v-list density="compact" class="pa-0">
            <v-list-item v-for="user in collaborators" :key="user.id" class="pa-2">
              <template v-slot:prepend>
                <v-avatar
                  size="24"
                  :style="{ backgroundColor: user.color }"
                  class="mr-2 text-white text-caption font-weight-bold border-white"
                >
                  {{ user.name.charAt(0).toUpperCase() }}
                </v-avatar>
              </template>
              <v-list-item-title class="text-caption font-weight-medium">
                {{ user.name }} <span v-if="user.id === socket.id" class="text-grey">(Tú)</span>
              </v-list-item-title>
              <template v-slot:append
                ><v-icon color="success" size="x-small">mdi-circle-small</v-icon></template
              >
            </v-list-item>
          </v-list>
        </v-card>
      </div>

      <v-divider class="mb-4"></v-divider>
    </v-navigation-drawer>

    <v-main class="editor-area">
      <v-btn
        icon
        size="small"
        position="absolute"
        style="top: 15px; left: 15px; z-index: 10"
        @click="drawer = !drawer"
      >
        <v-icon>{{ drawer ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon>
      </v-btn>

      <VueFlow
        :node-types="nodeTypes"
        :edge-types="edgeTypes"
        :fit-view-on-init="true"
        :nodes-draggable="canEdit"
        :nodes-connectable="canEdit && connectionMode !== 'selector'"
        :elements-selectable="true"
        :pan-on-drag="true"
        :zoom-on-scroll="true"
      >
        <Background pattern-color="#aaa" :gap="20" />
        <Controls />
        <div class="cursors-layer">
          <div
            v-for="(cursor, id) in cursors"
            :key="id"
            class="remote-cursor"
            :style="{
              left: cursor.x * viewport.zoom + viewport.x + 'px',
              top: cursor.y * viewport.zoom + viewport.y + 'px',
              backgroundColor: cursor.color,
            }"
          >
            <span class="cursor-label">{{ cursor.userName }}</span>
          </div>
        </div>
        <svg style="position: absolute; width: 0; height: 0">
          <defs>
            <marker
              id="arrow-closed"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10" fill="none" stroke="black" stroke-width="1.5" />
            </marker>
            <marker
              id="dependency"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10" fill="none" stroke="black" stroke-width="1.5" />
            </marker>
            <marker
              id="inheritance"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="10"
              markerHeight="10"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="white" stroke="black" stroke-width="1.5" />
            </marker>
            <marker
              id="composition"
              viewBox="0 0 20 10"
              refX="20"
              refY="5"
              markerWidth="14"
              markerHeight="10"
              orient="auto"
            >
              <path d="M0,5 L10,0 L20,5 L10,10 z" fill="black" stroke="black" />
            </marker>
            <marker
              id="aggregation"
              viewBox="0 0 20 10"
              refX="20"
              refY="5"
              markerWidth="14"
              markerHeight="10"
              orient="auto"
            >
              <path d="M0,5 L10,0 L20,5 L10,10 z" fill="white" stroke="black" stroke-width="1.5" />
            </marker>
          </defs>
        </svg>
      </VueFlow>

      <button class="chat-toggle" @click="isChatOpen = !isChatOpen">
        💬 Chat <span v-if="messages.length > 0" class="badge">{{ messages.length }}</span>
      </button>
      <div v-if="isChatOpen" class="chat-panel">
        <div class="chat-header">
          <h3>Chat de Equipo</h3>
          <button @click="isChatOpen = false">×</button>
        </div>
        <div class="chat-messages">
          <div v-for="(msg, i) in messages" :key="i" class="chat-msg">
            <small
              ><strong>{{ msg.userName }}:</strong></small
            >
            <div>{{ msg.message }}</div>
          </div>
        </div>
        <div class="chat-input">
          <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Escribe..." /><button
            @click="sendMessage"
          >
            Enviar
          </button>
        </div>
      </div>
    </v-main>

    <ShareDialog
      v-if="projectStore.currentProject"
      v-model="showShareDialog"
      :project-id="Number(projectId)"
      :is-owner="isOwner"
    />
  </v-layout>
</template>

<style scoped>
/* Tus estilos originales */
.editor-area {
  height: 100vh;
  width: 100%;
  background: #fdfdfd;
  position: relative;
  overflow: hidden;
}
.border-primary {
  border: 2px solid #1976d2 !important;
}
.border-secondary {
  border: 2px solid #757575 !important;
}
.gap-2 {
  gap: 8px;
}
.presence-bar {
  position: fixed;
  top: 15px;
  right: 20px;
  display: flex;
  gap: -8px;
  z-index: 100;
}
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}
.cursors-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9000;
}
.remote-cursor {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  pointer-events: none;
  transition: all 0.1s linear;
  z-index: 9001;
  border: 1px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.cursor-label {
  position: absolute;
  top: 14px;
  left: 0;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 5px;
  font-size: 10px;
  border-radius: 3px;
  white-space: nowrap;
}
.chat-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 200;
  padding: 12px 24px;
  border-radius: 30px;
  background: #1976d2;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
}
.chat-panel {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 320px;
  height: 400px;
  background: white;
  border-radius: 12px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
}
.chat-header {
  padding: 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.chat-messages {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  background: #fafafa;
}
.chat-msg {
  margin-bottom: 8px;
  padding: 8px;
  background: white;
  border-radius: 8px;
  border: 1px solid #eee;
}
.chat-input {
  padding: 10px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 5px;
  background: white;
}
.chat-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
}
.chat-input button {
  padding: 8px 15px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.badge {
  margin-left: 5px;
  background: #ff4081;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8em;
}
.border-white {
  border: 1px solid white;
}
.border-thin {
  border-color: #e0e0e0 !important;
}
</style>
