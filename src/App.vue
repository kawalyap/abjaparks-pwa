<template>
  <div class="app-layout">
    <!-- Top Header (Hidden on public receipt route, clean & compact on mobile) -->
    <header v-if="!isPublicReceiptRoute" class="pos-header no-print">
      <div class="header-left">
        <div class="brand-badge">
          <i class="fa-solid fa-tree-city"></i>
        </div>
        <div class="brand-text-block">
          <div class="brand-header-row">
            <h1 class="brand-title">Abja Parks POS</h1>
            <span class="meta-pill hidden sm:inline-flex">Astryx</span>
          </div>
          <p class="brand-sub">
            <span class="terminal-badge">{{ posStore.session.terminalId }}</span>
            <span class="agent-name">• {{ posStore.session.agentName }}</span>
          </p>
        </div>
      </div>

      <div class="header-right">
        <!-- Astryx Theme Switcher -->
        <button
          class="theme-toggle-btn"
          @click="toggleTheme"
          :title="`Current Theme: ${currentTheme.toUpperCase()}`"
        >
          <i class="fa-solid fa-palette text-amber-300"></i>
          <span class="theme-name hidden xs:inline">{{ currentTheme }}</span>
        </button>

        <!-- Desktop Navigation Tabs (Hidden on mobile) -->
        <nav class="header-nav desktop-nav">
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
    <main class="pos-main" :class="{ 'with-bottom-nav': !isPublicReceiptRoute }">
      <router-view />
    </main>

    <!-- Mobile Bottom Navigation Bar (Fixed for handheld / phone use) -->
    <nav v-if="!isPublicReceiptRoute" class="mobile-bottom-nav no-print">
      <router-link to="/" class="bottom-tab" active-class="active">
        <i class="fa-solid fa-cash-register"></i>
        <span>Collect</span>
      </router-link>
      <router-link to="/history" class="bottom-tab" active-class="active">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <span>History</span>
      </router-link>
      <router-link to="/reports" class="bottom-tab" active-class="active">
        <i class="fa-solid fa-chart-pie"></i>
        <span>Reports</span>
      </router-link>
      <router-link to="/login" class="bottom-tab" active-class="active">
        <i class="fa-solid fa-user-gear"></i>
        <span>Station</span>
      </router-link>
    </nav>
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
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--ax-shadow-low);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  height: 52px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-badge {
  width: 34px;
  height: 34px;
  border-radius: var(--ax-radius-xs);
  background-color: var(--accent);
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 800;
  box-shadow: var(--ax-shadow-low);
  flex-shrink: 0;
}

.brand-header-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.brand-title {
  font-size: 15px;
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
  padding: 1px 5px;
  border-radius: var(--ax-radius-full);
}

.brand-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.terminal-badge {
  font-weight: 700;
  color: var(--accent);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
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
  padding: 6px 12px;
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

/* Mobile Bottom Navigation Bar */
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #ffffff;
  border-top: 1px solid var(--border);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.06);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 700;
  padding: 6px 0;
  transition: all var(--duration-fast, 125ms) ease;
  -webkit-tap-highlight-color: transparent;
}

.bottom-tab i {
  font-size: 18px;
}

.bottom-tab.active {
  color: var(--primary);
}

.bottom-tab.active i {
  color: var(--primary);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .desktop-nav {
    display: none !important;
  }
  .mobile-bottom-nav {
    display: flex;
  }
  .with-bottom-nav {
    padding-bottom: calc(56px + env(safe-area-inset-bottom));
  }
}
</style>
