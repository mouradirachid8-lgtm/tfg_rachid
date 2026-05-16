<script setup lang="ts">
</script>

<template>
  <v-footer border>
    <div class="d-flex w-100 justify-center align-center text-center pa-1">
      <!-- Versión corta en móvil -->
      <span class="d-inline d-md-none text-caption">
        &copy; {{ new Date().getFullYear() }} — <strong>UML Collaborator · TFG Rachid Mouradi</strong>
      </span>
      <!-- Versión completa en desktop -->
      <span class="d-none d-md-inline text-caption">
        &copy; {{ new Date().getFullYear() }} — <strong>Herramienta para creación de diagramas UML - Rachid Mouradi - TFG</strong>
      </span>
    </div>
  </v-footer>
</template>