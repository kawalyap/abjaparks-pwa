<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePosStore } from '@/stores/usePosStore'

const router = useRouter()
const store = usePosStore()

const agentIdentifier = ref(store.session.agentName || 'Sarah K.')
const terminalId = ref(store.session.terminalId || 'POS-01')
const pin = ref('')
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Fallback gates if network is offline
const fallbackGates = [
  { id: 1, code: 'POS-01', name: 'Main Gate Station 1', type: 'handheld_pos' },
  { id: 2, code: 'POS-02', name: 'Main Gate Station 2', type: 'handheld_pos' },
  { id: 3, code: 'POS-03', name: 'VIP Pavilion Gate', type: 'turnstile' },
  { id: 4, code: 'POS-04', name: 'Sports Arena / Poolside', type: 'outdoor_pos' },
]

const activeGates = computed(() => {
  return store.registeredGates.length > 0 ? store.registeredGates : fallbackGates
})

const selectedGate = computed(() => {
  return activeGates.value.find(g => g.code === terminalId.value)
})

function selectTerminal(code: string) {
  terminalId.value = code
  error.value = null
}

function selectAttendant(attendant: { name: string; default_gate?: string | null }) {
  agentIdentifier.value = attendant.name
  if (attendant.default_gate && activeGates.value.some(g => g.code === attendant.default_gate)) {
    terminalId.value = attendant.default_gate
  }
  error.value = null
}

async function handleLogin() {
  if (!agentIdentifier.value.trim()) {
    error.value = 'Please select or enter an attendant name / email'
    return
  }
  if (!terminalId.value.trim()) {
    error.value = 'Please select a registered gate terminal'
    return
  }
  if (!pin.value.trim()) {
    error.value = 'Please enter your 4-digit Shift PIN'
    return
  }

  isSubmitting.value = true
  error.value = null
  successMessage.value = null

  try {
    const res = await store.loginWithBackend(
      terminalId.value.trim(),
      agentIdentifier.value.trim(),
      pin.value.trim()
    )

    successMessage.value = res.message || 'Shift opened successfully!'
    setTimeout(() => {
      router.push('/')
    }, 600)
  } catch (err: any) {
    error.value = err.message || 'Authentication failed. Please verify credentials.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleLogout() {
  await store.logout()
  pin.value = ''
  successMessage.value = null
}

function getGateIcon(type: string): string {
  switch (type) {
    case 'turnstile':
      return 'fa-person-booth'
    case 'barrier':
      return 'fa-road-barrier'
    case 'outdoor_pos':
      return 'fa-water-ladder'
    default:
      return 'fa-cash-register'
  }
}

onMounted(async () => {
  await Promise.all([
    store.loadGates(),
    store.loadAttendants(),
  ])

  // If store has registered gates, ensure terminalId matches one
  if (activeGates.value.length > 0 && !activeGates.value.some(g => g.code === terminalId.value)) {
    terminalId.value = activeGates.value[0]?.code ?? 'POS-01'
  }
})
</script>

<template>
  <div class="pos-container login-page">
    <div class="login-card">
      <!-- Premium Abja Brand Header -->
      <div class="login-header">
        <div class="brand-badge">
          <img src="/abja-logo.png" alt="Abja Parks" class="brand-logo" />
        </div>
        <h1 class="header-title">Gate Terminal Register</h1>
        <p class="header-sub">Official Attendant Authentication & Shift Login</p>

        <!-- Status indicator -->
        <div class="gateway-badge">
          <span class="live-dot"></span>
          <span>Backend Connected &bull; {{ activeGates.length }} Registered Gates</span>
        </div>
      </div>

      <!-- Active Session Notice (If Already Logged In) -->
      <div v-if="store.session.isLoggedIn && !error" class="active-session-banner">
        <div class="session-info">
          <i class="fa-solid fa-circle-check session-check-icon"></i>
          <div>
            <div class="session-heading">Active Shift Registered</div>
            <div class="session-details">
              <strong>{{ store.session.agentName }}</strong> @ {{ store.session.terminalName || store.session.terminalId }}
            </div>
          </div>
        </div>
        <button type="button" @click="handleLogout" class="switch-attendant-btn">
          Sign Out
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleLogin" class="login-body">
        <!-- Error Alert -->
        <div v-if="error" class="error-alert">
          <i class="fa-solid fa-circle-exclamation shrink-0"></i>
          <span>{{ error }}</span>
        </div>

        <!-- Success Alert -->
        <div v-if="successMessage" class="success-alert">
          <i class="fa-solid fa-circle-check shrink-0"></i>
          <span>{{ successMessage }}</span>
        </div>

        <!-- 1. Registered Gate / Terminal Selection -->
        <div class="form-group">
          <div class="group-header">
            <span class="field-label">1. Select Registered Gate</span>
            <span class="selected-id">{{ selectedGate?.name || terminalId }}</span>
          </div>

          <div class="terminal-grid">
            <button
              v-for="gate in activeGates"
              :key="gate.code"
              type="button"
              @click="selectTerminal(gate.code)"
              class="terminal-tile"
              :class="{ active: terminalId === gate.code }"
            >
              <div class="tile-top">
                <i :class="['fa-solid', getGateIcon(gate.type), 'tile-icon']"></i>
                <span class="tile-id">{{ gate.code }}</span>
              </div>
              <div class="tile-name">{{ gate.name }}</div>
            </button>
          </div>
        </div>

        <!-- 2. Attendant / Cashier Selection -->
        <div class="form-group">
          <div class="group-header">
            <label class="field-label">2. Attendant / Cashier</label>
            <span class="hint-text">Select name or type email</span>
          </div>

          <!-- Quick Name Chips from Backend -->
          <div v-if="store.attendants.length > 0" class="chips-row">
            <button
              v-for="att in store.attendants"
              :key="att.id"
              type="button"
              @click="selectAttendant(att)"
              class="chip-tag"
              :class="{ active: agentIdentifier === att.name || agentIdentifier === att.email }"
            >
              {{ att.name }}
              <span v-if="att.default_gate" class="chip-gate-tag">{{ att.default_gate }}</span>
            </button>
          </div>

          <div class="input-wrap">
            <i class="fa-solid fa-user input-icon"></i>
            <input
              v-model="agentIdentifier"
              type="text"
              required
              placeholder="e.g. Sarah K. or sarah@abjaparks.com"
              class="text-input"
            />
          </div>
        </div>

        <!-- 3. Security PIN (Triggers Phone Numeric Keypad Directly) -->
        <div class="form-group">
          <div class="group-header">
            <span class="field-label">3. Shift PIN</span>
            <span class="hint-text">Default: 1234</span>
          </div>
          <div class="input-wrap">
            <i class="fa-solid fa-shield-halved input-icon"></i>
            <input
              v-model="pin"
              type="password"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="4"
              required
              placeholder="••••"
              class="text-input pin-input"
            />
          </div>
        </div>

        <!-- Primary Action Button -->
        <button type="submit" :disabled="isSubmitting" class="primary-btn">
          <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-arrow-right-to-bracket"></i>
          <span>{{ isSubmitting ? 'Verifying with Backend...' : 'Authenticate & Start Shift' }}</span>
        </button>

        <!-- Peripheral & System Status -->
        <div class="footer-status">
          <span class="status-item">
            <i class="fa-solid fa-print"></i>
            <span>58mm ESC/POS Ready</span>
          </span>
          <span class="status-item">
            <i class="fa-solid fa-cloud-arrow-up text-online"></i>
            <span>YoTicket Backend Auth</span>
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
  padding: 22px 20px;
  text-align: center;
  border-bottom: 2px solid var(--accent, #9E8F70);
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 5px 12px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  margin-bottom: 8px;
}

.brand-logo {
  height: 28px;
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
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  color: #EFECE6;
  margin-top: 10px;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #34d399;
}

/* Active Session Notice */
.active-session-banner {
  background: #ecfdf5;
  border-bottom: 1px solid #a7f3d0;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.session-check-icon {
  color: #059669;
  font-size: 16px;
}

.session-heading {
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  color: #065f46;
}

.session-details {
  font-size: 11px;
  color: #047857;
}

.switch-attendant-btn {
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 800;
  color: #065f46;
  background: #ffffff;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.switch-attendant-btn:hover {
  background: #f0fdf4;
}

.login-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.error-alert {
  background: #fff1f2;
  color: #be123c;
  font-size: 11px;
  font-weight: 700;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #fecdd3;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-alert {
  background: #ecfdf5;
  color: #065f46;
  font-size: 11px;
  font-weight: 700;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #a7f3d0;
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

.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.chip-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 4px 9px;
  border-radius: 8px;
  border: 1px solid var(--border, #E8E6E1);
  background: var(--bg-app, #F8F7F4);
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
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

.chip-gate-tag {
  font-size: 8px;
  padding: 1px 3px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.12);
  color: inherit;
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

.primary-btn:disabled {
  opacity: 0.6;
}

.primary-btn:hover:not(:disabled) {
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
