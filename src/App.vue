<template>
  <div class="app-layout">
    <!-- Top Header (Hidden in Print) -->
    <header v-if="!isPublicReceiptRoute" class="pos-header no-print">
      <div class="header-left">
        <div class="brand-badge">
          <i class="fa-solid fa-tree-city"></i>
        </div>
        <div>
          <div class="brand-header-row">
            <h1 class="brand-title">Abja Parks POS</h1>
            <span class="meta-pill">Meta Astryx</span>
          </div>
          <p class="brand-sub">{{ posStore.session.terminalId }} • {{ posStore.session.agentName }}</p>
        </div>
      </div>

      <div class="header-right">
        <!-- Astryx Theme Switcher -->
        <button
          class="theme-toggle-btn"
          @click="toggleTheme"
          :title="`Current Theme: ${currentTheme.toUpperCase()} (Click to toggle)`"
        >
          <i class="fa-solid fa-palette text-amber-300"></i>
          <span class="theme-name">{{ currentTheme }}</span>
        </button>

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
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="pos-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePosStore } from '@/stores/usePosStore'

const route = useRoute()
const posStore = usePosStore()

const currentTheme = ref<'neutral' | 'stone'>('neutral')

const isPublicReceiptRoute = computed(() => route.name === 'pos.public-receipt')

function toggleTheme() {
  currentTheme.value = currentTheme.value === 'neutral' ? 'stone' : 'neutral'
  document.documentElement.setAttribute('data-astryx-theme', currentTheme.value)
  localStorage.setItem('abja_astryx_theme', currentTheme.value)
}

onMounted(() => {
  posStore.loadCategories()
  const saved = localStorage.getItem('abja_astryx_theme') as 'neutral' | 'stone' | null
  if (saved && (saved === 'neutral' || saved === 'stone')) {
    currentTheme.value = saved
    document.documentElement.setAttribute('data-astryx-theme', saved)
  }
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
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--ax-shadow-med);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-badge {
  width: 40px;
  height: 40px;
  border-radius: var(--ax-radius-sm);
  background-color: var(--accent);
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
  box-shadow: var(--ax-shadow-low);
}

.brand-title {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.2px;
  line-height: 1.2;
}

.meta-pill {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  padding: 2px 6px;
  border-radius: var(--ax-radius-full);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.brand-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--ax-radius-full);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
  transition: all var(--duration-fast, 125ms) ease;
}

.theme-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.header-nav {
  display: flex;
  gap: 6px;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: var(--ax-radius-sm);
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  transition: all var(--duration-fast, 125ms) ease;
}

.nav-tab:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.nav-tab.active {
  background-color: #ffffff;
  color: var(--primary);
  box-shadow: var(--ax-shadow-low);
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
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  .header-nav {
    flex: 1;
    justify-content: flex-end;
  }
  .nav-tab {
    padding: 5px 8px;
    font-size: 11px;
  }
}
</style>
