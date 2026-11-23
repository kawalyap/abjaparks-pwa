<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePosStore } from '@/stores/usePosStore'
import { api } from '@/services/api'
import type { ShiftReportData } from '@/types'

const store = usePosStore()

const reportData = ref<ShiftReportData | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

// Date filter
const activePreset = ref<'today' | 'yesterday' | 'week' | 'month'>('today')
const customFrom = ref<string>(new Date().toISOString().split('T')[0] ?? '')
const customTo = ref<string>(new Date().toISOString().split('T')[0] ?? '')

function setPreset(preset: 'today' | 'yesterday' | 'week' | 'month') {
  activePreset.value = preset
  const today = new Date()

  if (preset === 'today') {
    const d = today.toISOString().split('T')[0] ?? ''
    customFrom.value = d
    customTo.value = d
  } else if (preset === 'yesterday') {
    const y = new Date(today)
    y.setDate(y.getDate() - 1)
    const d = y.toISOString().split('T')[0] ?? ''
    customFrom.value = d
    customTo.value = d
  } else if (preset === 'week') {
    const w = new Date(today)
    w.setDate(w.getDate() - 7)
    customFrom.value = w.toISOString().split('T')[0] ?? ''
    customTo.value = today.toISOString().split('T')[0] ?? ''
  } else if (preset === 'month') {
    const m = new Date(today.getFullYear(), today.getMonth(), 1)
    customFrom.value = m.toISOString().split('T')[0] ?? ''
    customTo.value = today.toISOString().split('T')[0] ?? ''
  }

  fetchReport()
}

async function fetchReport() {
  isLoading.value = true
  errorMessage.value = null
  try {
    reportData.value = await api.getReports({
      from: customFrom.value,
      to: customTo.value,
    })
  } catch (err: any) {
    console.error('Report fetch error:', err)
    errorMessage.value = err.message || 'Could not fetch shift reports'
  } finally {
    isLoading.value = false
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount)
}

function printShiftSummary() {
  window.print()
}

onMounted(() => {
  fetchReport()
})
</script>

<template>
  <div class="pos-container space-y-3">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 no-print">
      <div>
        <h1 class="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-chart-pie text-emerald-600"></i>
          Shift Revenue & Analytics
        </h1>
        <p class="text-[11px] text-slate-500">Live admission revenue and terminal totals</p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="printShiftSummary"
          class="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm flex items-center gap-1.5 transition"
        >
          <i class="fa-solid fa-print"></i>
          Print Shift Report (Z)
        </button>
      </div>
    </div>

    <!-- Date Range Filters -->
    <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2 no-print">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <!-- Preset tabs -->
        <div class="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            v-for="p in ['today', 'yesterday', 'week', 'month'] as const"
            :key="p"
            @click="setPreset(p)"
            class="px-2.5 py-1 text-xs font-bold rounded-md transition capitalize"
            :class="[
              activePreset === p
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            {{ p }}
          </button>
        </div>

        <!-- Custom date inputs -->
        <div class="flex items-center gap-1.5 text-xs">
          <input
            v-model="customFrom"
            type="date"
            class="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
          />
          <span class="text-slate-400">to</span>
          <input
            v-model="customTo"
            type="date"
            class="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
          />
          <button
            @click="fetchReport"
            class="px-3 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 transition"
          >
            Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="py-16 text-center text-slate-400">
      <i class="fa-solid fa-circle-notch fa-spin text-2xl text-emerald-600 mb-2"></i>
      <p class="text-xs font-semibold">Aggregating shift statistics...</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
      <i class="fa-solid fa-triangle-exclamation text-red-500 text-xl mb-1"></i>
      <p class="text-xs font-bold text-red-700">{{ errorMessage }}</p>
      <button @click="fetchReport" class="mt-2 text-xs font-bold text-red-600 underline">Try Again</button>
    </div>

    <!-- Report Body -->
    <div v-else-if="reportData" class="space-y-4">
      <!-- Printable Shift Header (Visible in print) -->
      <div class="hidden print:block text-center border-b pb-3 mb-3">
        <h2 class="text-base font-black">ABJA PARKS & RECREATION</h2>
        <p class="text-[10px]">OFFICIAL POS SHIFT REPORT</p>
        <p class="text-[9px]">Period: {{ reportData.report_period.from }} to {{ reportData.report_period.to }}</p>
        <p class="text-[9px]">Terminal: {{ store.session.terminalId }} | Agent: {{ store.session.agentName }}</p>
      </div>

      <!-- Top KPI Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs border-t-2 border-[#9E8F70]">
          <div class="text-[10px] uppercase font-bold text-slate-400">Total Revenue</div>
          <div class="text-lg sm:text-xl font-black text-[#8D7E5F] mt-1">
            {{ formatCurrency(reportData.summary.total_revenue) }}
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">Paid via MoMo / Cash</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div class="text-[10px] uppercase font-bold text-slate-400">Total Tickets Sold</div>
          <div class="text-lg sm:text-xl font-black text-slate-800 mt-1">
            {{ reportData.summary.total_tickets_sold }}
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">Admissions granted</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div class="text-[10px] uppercase font-bold text-slate-400">Successful Txns</div>
          <div class="text-lg sm:text-xl font-black text-slate-800 mt-1">
            {{ reportData.summary.successful_transactions }}
          </div>
          <div class="text-[10px] text-emerald-600 mt-0.5 font-semibold">Confirmed</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div class="text-[10px] uppercase font-bold text-slate-400">Failed / Expired</div>
          <div class="text-lg sm:text-xl font-black text-rose-600 mt-1">
            {{ reportData.summary.failed_transactions }}
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">Declined or timed out</div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <h3 class="text-xs font-black uppercase text-slate-700 tracking-wider mb-3 flex items-center gap-1.5">
          <i class="fa-solid fa-ticket text-emerald-600"></i>
          Ticket Category Breakdown
        </h3>

        <div class="space-y-3">
          <div
            v-for="cat in reportData.category_breakdown"
            :key="cat.category_name"
            class="space-y-1"
          >
            <div class="flex justify-between text-xs font-semibold">
              <span class="text-slate-800">{{ cat.category_name }}</span>
              <span class="text-slate-500">
                {{ cat.tickets_sold }} ticket(s) &bull;
                <strong class="text-slate-800">{{ formatCurrency(cat.revenue) }}</strong>
              </span>
            </div>
            <!-- Progress bar -->
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                class="bg-[#9E8F70] h-2 rounded-full transition-all duration-500"
                :style="{
                  width: `${reportData.summary.total_revenue > 0 ? (cat.revenue / reportData.summary.total_revenue) * 100 : 0}%`
                }"
              ></div>
            </div>
          </div>

          <div v-if="reportData.category_breakdown.length === 0" class="text-xs text-slate-400 text-center py-4">
            No tickets sold in this period.
          </div>
        </div>
      </div>

      <!-- Terminal Breakdown -->
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <h3 class="text-xs font-black uppercase text-slate-700 tracking-wider mb-3 flex items-center gap-1.5">
          <i class="fa-solid fa-desktop text-emerald-600"></i>
          Terminal / POS Distribution
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 uppercase font-black text-[10px]">
                <th class="py-2">Terminal ID</th>
                <th class="py-2 text-center">Transactions</th>
                <th class="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="t in reportData.terminal_summary"
                :key="t.terminal_id"
                class="hover:bg-slate-50 font-medium"
              >
                <td class="py-2.5 font-bold text-slate-800">{{ t.terminal_id || 'Default' }}</td>
                <td class="py-2.5 text-center text-slate-600">{{ t.tx_count }}</td>
                <td class="py-2.5 text-right font-black text-slate-900">{{ formatCurrency(t.revenue) }}</td>
              </tr>
              <tr v-if="reportData.terminal_summary.length === 0">
                <td colspan="3" class="text-center py-4 text-slate-400">No terminal activity recorded</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
