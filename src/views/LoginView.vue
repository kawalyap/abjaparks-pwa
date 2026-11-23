<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePosStore } from '@/stores/usePosStore'

const router = useRouter()
const store = usePosStore()

const agentName = ref(store.session.agentName || 'Gate Attendant 1')
const terminalId = ref(store.session.terminalId || 'POS-01')
const pin = ref('')
const error = ref<string | null>(null)

const terminals = [
  { id: 'POS-01', name: 'Main Gate 1', icon: 'fa-door-open' },
  { id: 'POS-02', name: 'Main Gate 2', icon: 'fa-truck-ramp-box' },
  { id: 'POS-03', name: 'VIP Entrance', icon: 'fa-crown' },
  { id: 'POS-04', name: 'Poolside & Garden', icon: 'fa-water-ladder' },
]

const quickAttendants = ['Sarah K.', 'John M.', 'Grace N.', 'David O.']

function selectTerminal(id: string) {
  terminalId.value = id
}

function selectAttendant(name: string) {
  agentName.value = name
}

function handleLogin() {
  if (!agentName.value.trim()) {
    error.value = 'Please enter an attendant or cashier name'
    return
  }
  if (!terminalId.value.trim()) {
    error.value = 'Please select a terminal station'
    return
  }

  store.session.agentName = agentName.value.trim()
  store.session.terminalId = terminalId.value.trim()
  store.session.isLoggedIn = true
  store.session.loginTime = new Date().toISOString()

  router.push('/')
}
</script>

<template>
  <div class="pos-container login-page">
    <div class="login-card">
      <!-- Premium Abja Brand Header -->
      <div class="login-header">
        <div class="brand-badge">
          <img src="/abja-logo.png" alt="Abja Parks" class="brand-logo" />
        </div>
        <h1 class="header-title">POS Terminal Station</h1>
        <p class="header-sub">Cashier Shift & Gate Register Setup</p>

        <!-- Status indicator -->
        <div class="gateway-badge">
          <span class="live-dot"></span>
          <span>YoTicket Gateway Connected</span>
        </div>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleLogin" class="login-body">
        <!-- Error Alert -->
        <div v-if="error" class="error-alert">
          <i class="fa-solid fa-circle-exclamation shrink-0"></i>
          <span>{{ error }}</span>
        </div>

        <!-- Terminal / Station Selector Grid -->
        <div class="form-group">
          <div class="group-header">
            <span class="field-label">Terminal Station</span>
            <span class="selected-id">{{ terminalId }}</span>
          </div>
          <div class="terminal-grid">
            <button
              v-for="t in terminals"
              :key="t.id"
              type="button"
              @click="selectTerminal(t.id)"
              class="terminal-tile"
              :class="{ active: terminalId === t.id }"
            >
              <div class="tile-top">
                <i :class="['fa-solid', t.icon, 'tile-icon']"></i>
                <span class="tile-id">{{ t.id }}</span>
              </div>
              <div class="tile-name">{{ t.name }}</div>
            </button>
          </div>
        </div>

        <!-- Attendant / Cashier Name -->
        <div class="form-group">
          <label class="field-label">Attendant / Cashier Name</label>
          <div class="input-wrap">
            <i class="fa-solid fa-user input-icon"></i>
            <input
              v-model="agentName"
              type="text"
              required
              placeholder="e.g. Sarah / John"
              class="text-input"
            />
          </div>

          <!-- Quick Name Chips -->
          <div class="chips-row">
            <button
              v-for="name in quickAttendants"
              :key="name"
              type="button"
              @click="selectAttendant(name)"
              class="chip-tag"
              :class="{ active: agentName === name }"
            >
              {{ name }}
            </button>
          </div>
        </div>

        <!-- Security PIN (Numeric Keyboard) -->
        <div class="form-group">
          <div class="group-header">
            <span class="field-label">Shift PIN (Optional)</span>
            <span class="hint-text">4 Digits</span>
          </div>
          <div class="input-wrap">
            <i class="fa-solid fa-shield-halved input-icon"></i>
            <input
              v-model="pin"
              type="password"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="4"
              placeholder="••••"
              class="text-input pin-input"
            />
          </div>
        </div>

        <!-- Primary Action Button -->
        <button type="submit" class="primary-btn">
          <i class="fa-solid fa-arrow-right-to-bracket"></i>
          <span>Start Shift & Open Register</span>
        </button>

        <!-- Peripheral & System Status -->
        <div class="footer-status">
          <span class="status-item">
            <i class="fa-solid fa-print"></i>
            <span>58mm ESC/POS Ready</span>
          </span>
          <span class="status-item">
            <i class="fa-solid fa-wifi text-online"></i>
            <span>Cloud Sync Active</span>
          </span>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  padding-top: 16px;
  padding-bottom: 24px;
  max-width: 440px;
  margin: 0 auto;
}

.login-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(28, 35, 49, 0.08);
  overflow: hidden;
}

.login-header {
  background: linear-gradient(180deg, #1C2331 0%, #171E2B 100%);
  color: #ffffff;
  padding: 24px 20px;
  text-align: center;
  border-bottom: 2px solid var(--accent, #9E8F70);
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 6px 14px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  margin-bottom: 10px;
}

.brand-logo {
  height: 30px;
  width: auto;
  object-fit: contain;
  display: block;
}

.header-title {
  font-size: 15px;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: #ffffff;
  margin: 0;
}

.header-sub {
  font-size: 11px;
  color: #D4C7AC;
  font-weight: 600;
  margin-top: 2px;
}

.gateway-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(158, 143, 112, 0.2);
  border: 1px solid rgba(158, 143, 112, 0.4);
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  color: #EFECE6;
  margin-top: 12px;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #34d399;
}

.login-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-alert {
  background: #fff1f2;
  color: #be123c;
  font-size: 12px;
  font-weight: 700;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #fecdd3;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-label {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-main, #1C2331);
}

.selected-id {
  font-size: 10px;
  font-weight: 800;
  color: var(--accent, #9E8F70);
}

.hint-text {
  font-size: 10px;
  color: #94a3b8;
}

.terminal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.terminal-tile {
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--border, #E8E6E1);
  background: var(--bg-app, #F8F7F4);
  color: var(--text-main, #1C2331);
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  transition: all 0.15s ease;
}

.terminal-tile:hover {
  border-color: rgba(158, 143, 112, 0.6);
}

.terminal-tile.active {
  background: #1C2331;
  color: #ffffff;
  border-color: #1C2331;
  box-shadow: 0 4px 12px rgba(28, 35, 49, 0.2);
  outline: 2px solid var(--accent, #9E8F70);
}

.tile-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tile-icon {
  font-size: 12px;
  color: var(--accent, #9E8F70);
}

.terminal-tile.active .tile-icon {
  color: #D4C7AC;
}

.tile-id {
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.08);
  color: #64748b;
}

.terminal-tile.active .tile-id {
  background: rgba(158, 143, 112, 0.35);
  color: #EFECE6;
}

.tile-name {
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.text-input {
  width: 100%;
  padding: 10px 12px 10px 34px;
  font-size: 12px;
  font-weight: 700;
  background: var(--bg-app, #F8F7F4);
  color: var(--text-main, #1C2331);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 12px;
  outline: none;
  transition: all 0.15s ease;
}

.text-input:focus {
  background: #ffffff;
  border-color: var(--accent, #9E8F70);
  box-shadow: 0 0 0 3px rgba(158, 143, 112, 0.2);
}

.pin-input {
  letter-spacing: 0.3em;
  font-family: monospace;
}

.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.chip-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid var(--border, #E8E6E1);
  background: var(--bg-app, #F8F7F4);
  color: #64748b;
  transition: all 0.15s ease;
}

.chip-tag:hover {
  background: #f1f5f9;
}

.chip-tag.active {
  background: var(--accent, #9E8F70);
  color: #ffffff;
  border-color: var(--accent, #9E8F70);
}

.primary-btn {
  width: 100%;
  padding: 14px;
  background: var(--accent, #9E8F70);
  color: #1C2331;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(158, 143, 112, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.15s ease;
}

.primary-btn:hover {
  background: #8B7C5E;
  color: #ffffff;
}

.footer-status {
  padding-top: 10px;
  border-top: 1px solid var(--border, #E8E6E1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  color: #64748b;
  font-weight: 700;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-item i {
  color: var(--accent, #9E8F70);
}

.text-online {
  color: #16a34a !important;
}
</style>
