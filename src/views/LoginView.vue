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
  { id: 'POS-01', name: 'Main Gate Terminal 1' },
  { id: 'POS-02', name: 'Main Gate Terminal 2' },
  { id: 'POS-03', name: 'VIP Entrance' },
  { id: 'POS-04', name: 'Poolside / Garden' },
]

function handleLogin() {
  if (!agentName.value.trim()) {
    error.value = 'Please enter an attendant / cashier name'
    return
  }
  if (!terminalId.value.trim()) {
    error.value = 'Please select or enter a terminal ID'
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
  <div class="pos-container py-4 max-w-md mx-auto">
    <div class="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 text-center">
        <div class="w-14 h-14 bg-emerald-700/80 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
          <i class="fa-solid fa-tree text-2xl text-amber-300"></i>
        </div>
        <h1 class="text-xl font-black tracking-tight">Abja Parks POS</h1>
        <p class="text-xs text-emerald-200 mt-1 font-medium">Cashier Shift & Terminal Sign-In</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="p-6 space-y-4">
        <!-- Error Alert -->
        <div v-if="error" class="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-lg border border-red-200">
          {{ error }}
        </div>

        <!-- Attendant Name -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Attendant / Cashier Name
          </label>
          <div class="relative">
            <i class="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              v-model="agentName"
              type="text"
              required
              placeholder="e.g. Sarah / John"
              class="w-full pl-8 pr-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>
        </div>

        <!-- Terminal ID Selection -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Terminal / Gate Station
          </label>
          <select
            v-model="terminalId"
            class="w-full px-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
          >
            <option v-for="t in terminals" :key="t.id" :value="t.id">
              {{ t.name }} ({{ t.id }})
            </option>
          </select>
        </div>

        <!-- Security Passcode / PIN (Optional) -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Shift PIN (Optional)
          </label>
          <div class="relative">
            <i class="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              v-model="pin"
              type="password"
              maxlength="4"
              placeholder="••••"
              class="w-full pl-8 pr-3 py-2.5 text-xs font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          <i class="fa-solid fa-arrow-right-to-bracket"></i>
          Start Shift & Open Register
        </button>

        <!-- Current Shift Status -->
        <div class="pt-2 text-center text-[11px] text-slate-400">
          Last active terminal: <span class="font-bold text-slate-600">{{ store.session.terminalId }}</span>
        </div>
      </form>
    </div>
  </div>
</template>
