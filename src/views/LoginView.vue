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
  { id: 'POS-01', name: 'Main Gate 1', icon: 'fa-door-open', badge: 'Active' },
  { id: 'POS-02', name: 'Main Gate 2', icon: 'fa-truck-ramp-box', badge: 'Standby' },
  { id: 'POS-03', name: 'VIP Entrance', icon: 'fa-crown', badge: 'VIP Only' },
  { id: 'POS-04', name: 'Poolside & Garden', icon: 'fa-water-ladder', badge: 'Outdoor' },
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
  <div class="pos-container py-4 px-3 max-w-md mx-auto">
    <div class="bg-white border border-[#E8E6E1] rounded-2xl shadow-xl overflow-hidden">
      <!-- Premium Abja Brand Header -->
      <div class="bg-gradient-to-b from-[#1C2331] via-[#1E2738] to-[#121722] text-white p-6 text-center relative border-b-2 border-[#9E8F70]">
        <div class="inline-flex items-center justify-center bg-white px-4 py-2 rounded-xl shadow-md mb-3">
          <img src="/abja-logo.png" alt="Abja Parks" class="h-8 w-auto object-contain" />
        </div>
        <h1 class="text-base font-black tracking-tight text-white uppercase">POS Terminal Station</h1>
        <p class="text-xs text-[#D4C7AC] mt-0.5 font-semibold">Cashier Shift & Gate Register Setup</p>

        <!-- Status indicator -->
        <div class="inline-flex items-center gap-1.5 bg-[#9E8F70]/20 border border-[#9E8F70]/40 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#EFECE6] mt-3">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          YoTicket Gateway Connected
        </div>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleLogin" class="p-5 space-y-4">
        <!-- Error Alert -->
        <div v-if="error" class="bg-rose-50 text-rose-700 text-xs font-bold p-3 rounded-xl border border-rose-200 flex items-center gap-2">
          <i class="fa-solid fa-circle-exclamation shrink-0"></i>
          <span>{{ error }}</span>
        </div>

        <!-- Terminal / Station Selector Grid -->
        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-[#1C2331] mb-2 flex items-center justify-between">
            <span>Terminal Station</span>
            <span class="text-[10px] font-bold text-[#9E8F70] lowercase">{{ terminalId }}</span>
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="t in terminals"
              :key="t.id"
              type="button"
              @click="selectTerminal(t.id)"
              class="p-2.5 rounded-xl border text-left transition flex flex-col justify-between"
              :class="[
                terminalId === t.id
                  ? 'bg-[#1C2331] text-white border-[#1C2331] shadow-md ring-2 ring-[#9E8F70]'
                  : 'bg-[#F8F7F4] text-[#1C2331] border-[#E8E6E1] hover:border-[#9E8F70]/60'
              ]"
            >
              <div class="flex items-center justify-between w-full mb-1">
                <i :class="['fa-solid', t.icon, terminalId === t.id ? 'text-[#D4C7AC]' : 'text-[#9E8F70]']"></i>
                <span
                  class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                  :class="[
                    terminalId === t.id ? 'bg-[#9E8F70]/30 text-[#EFECE6]' : 'bg-slate-200/70 text-slate-600'
                  ]"
                >
                  {{ t.id }}
                </span>
              </div>
              <div class="text-xs font-bold tracking-tight leading-tight">{{ t.name }}</div>
            </button>
          </div>
        </div>

        <!-- Attendant / Cashier Name -->
        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-[#1C2331] mb-1.5">
            Attendant / Cashier Name
          </label>
          <div class="relative mb-2">
            <i class="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              v-model="agentName"
              type="text"
              required
              placeholder="e.g. Sarah / John"
              class="w-full pl-8 pr-3 py-2.5 text-xs font-bold bg-[#F8F7F4] text-[#1C2331] border border-[#E8E6E1] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#9E8F70] focus:border-transparent outline-none transition"
            />
          </div>

          <!-- Quick Name Chips -->
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="name in quickAttendants"
              :key="name"
              type="button"
              @click="selectAttendant(name)"
              class="text-[10px] font-bold px-2 py-1 rounded-lg border transition"
              :class="[
                agentName === name
                  ? 'bg-[#9E8F70] text-white border-[#9E8F70]'
                  : 'bg-[#F8F7F4] text-slate-600 border-[#E8E6E1] hover:bg-slate-100'
              ]"
            >
              {{ name }}
            </button>
          </div>
        </div>

        <!-- Security PIN (Numeric Keyboard) -->
        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-[#1C2331] mb-1.5 flex items-center justify-between">
            <span>Shift PIN (Optional)</span>
            <span class="text-[10px] font-normal text-slate-400">4 Digits</span>
          </label>
          <div class="relative">
            <i class="fa-solid fa-shield-halved absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              v-model="pin"
              type="password"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="4"
              placeholder="••••"
              class="w-full pl-8 pr-3 py-2.5 text-xs font-mono tracking-widest bg-[#F8F7F4] text-[#1C2331] border border-[#E8E6E1] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#9E8F70] focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        <!-- Primary Action Button -->
        <button
          type="submit"
          class="w-full py-3.5 bg-[#9E8F70] hover:bg-[#8B7C5E] active:scale-98 text-[#1C2331] text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          <i class="fa-solid fa-arrow-right-to-bracket text-sm"></i>
          <span>Start Shift & Open Register</span>
        </button>

        <!-- Peripheral & System Status -->
        <div class="pt-2 border-t border-[#E8E6E1] flex items-center justify-between text-[10px] text-slate-500 font-semibold">
          <span class="flex items-center gap-1.5">
            <i class="fa-solid fa-print text-[#9E8F70]"></i>
            58mm ESC/POS Ready
          </span>
          <span class="flex items-center gap-1.5">
            <i class="fa-solid fa-wifi text-emerald-600"></i>
            Cloud Sync Active
          </span>
        </div>
      </form>
    </div>
  </div>
</template>
