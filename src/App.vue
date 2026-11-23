<template>
  <div class="app-layout">
    <!-- Top Header (Hidden in Print) -->
    <header v-if="!isPublicReceiptRoute" class="pos-header no-print">
      <div class="header-left">
        <div class="brand-badge">
          <i class="fa-solid fa-tree-city"></i>
        </div>
        <div>
          <h1 class="brand-title">Abja Parks POS</h1>
          <p class="brand-sub">{{ posStore.session.terminalId }} • {{ posStore.session.agentName }}</p>
        </div>
      </div>

      <nav class="header-nav">
        <router-link to="/" class="nav-tab" active-class="active">
          <i class="fa-solid fa-cash-register"></i>
          <span>Collect</span>
        </router-link>
        <router-link to="/history" class="nav-tab" active-class="active">
          <i class="fa-solid fa-receipt"></i>
          <span>History</span>
        </router-link>
        <router-link to="/reports" class="nav-tab" active-class="active">
          <i class="fa-solid fa-chart-line"></i>
          <span>Reports</span>
        </router-link>
        <router-link to="/login" class="nav-tab" active-class="active">
          <i class="fa-solid fa-gear"></i>
          <span>Terminal</span>
        </router-link>
      </nav>
    </header>

    <!-- Main Content Area -->
    <main class="pos-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePosStore } from '@/stores/usePosStore'

const route = useRoute()
const posStore = usePosStore()

const isPublicReceiptRoute = computed(() => route.name === 'pos.public-receipt')

onMounted(() => {
  posStore.loadCategories()
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-app);
}

.pos-header {
  background-color: var(--primary);
  color: #ffffff;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: var(--accent);
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
}

.brand-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.2px;
  line-height: 1.2;
}

.brand-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.header-nav {
  display: flex;
  gap: 8px;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s ease;
}

.nav-tab:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.nav-tab.active {
  background-color: #ffffff;
  color: var(--primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pos-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

@media (max-width: 640px) {
  .pos-header {
    padding: 10px 14px;
    flex-wrap: wrap;
    gap: 10px;
  }
  .header-nav {
    width: 100%;
    justify-content: space-between;
  }
  .nav-tab {
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style>
