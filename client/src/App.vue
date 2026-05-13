<script setup lang="ts">
  import HeaderComponent from './components/HeaderComponent.vue';
  import FooterComponent from './components/FooterComponent.vue';
</script>

<template>
  <v-app class="app-container">
    <HeaderComponent class="header-static" />
    
    <v-main class="main-content">
      <RouterView />
    </v-main>
    
    <FooterComponent class="footer-static" />
  </v-app>
</template>

<style scoped>
/* Convertimos la app en una columna flex */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* El header se queda arriba con su tamaño natural */
.header-static {
  flex-shrink: 0;
}

/* El contenido principal ocupa todo el espacio sobrante */
.main-content {
  flex-grow: 1;
  overflow-y: auto; /* Si es muy largo, hace scroll por dentro */
}

/* El footer se empuja al final */
.footer-static {
  flex-shrink: 0;
}
</style>