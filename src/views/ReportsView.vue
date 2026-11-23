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
  <div class="pos-container max-w-2xl mx-auto py-3 px-3 space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 no-print">
      <div>
        <h1 class="text-base font-black text-[#1C2331] uppercase tracking-tight flex items-center gap-2">
          <i class="fa-solid fa-chart-pie text-[#9E8F70]"></i>
          Shift Revenue & Reports
        </h1>
        <p class="text-[11px] text-slate-500 font-medium">Admission analytics and terminal shift totals</p>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          @click="printShiftSummary"
          class="px-3 py-1.5 text-xs font-black text-white bg-[#1C2331] hover:bg-[#121722] rounded-xl shadow-xs flex items-center gap-1.5 transition"
        >
          <i class="fa-solid fa-print text-[#9E8F70]"></i>
          <span>Print Z-Report</span>
        </button>
      </div>
    </div>

    <!-- Date Range Filters -->
    <div class="bg-white border border-[#E8E6E1] rounded-2xl p-3 shadow-xs space-y-2.5 no-print">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <!-- Preset tabs -->
        <div class="flex gap-1 bg-[#F8F7F4] p-1 rounded-xl border border-[#E8E6E1]">
          <button
            v-for="p in ['today', 'yesterday', 'week', 'month'] as const"
            :key="p"
            @click="setPreset(p)"
            class="px-2.5 py-1 text-xs font-black rounded-lg transition capitalize"
            :class="[
              activePreset === p
                ? 'bg-[#1C2331] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            {{ p === 'week' ? '7 Days' : p === 'month' ? 'This Month' : p }}
          </button>
        </div>

        <!-- Custom date inputs -->
        <div class="flex items-center gap-1.5 text-xs">
          <input
            v-model="customFrom"
            type="date"
            class="px-2 py-1 bg-[#F8F7F4] border border-[#E8E6E1] rounded-lg text-xs font-bold text-[#1C2331] outline-none focus:ring-2 focus:ring-[#9E8F70]"
          />
          <span class="text-slate-400 font-bold">to</span>
          <input
            v-model="customTo"
            type="date"
            class="px-2 py-1 bg-[#F8F7F4] border border-[#E8E6E1] rounded-lg text-xs font-bold text-[#1C2331] outline-none focus:ring-2 focus:ring-[#9E8F70]"
          />
          <button
            @click="fetchReport"
            class="px-2.5 py-1 bg-[#9E8F70] text-[#1C2331] rounded-lg text-xs font-black hover:bg-[#8B7C5E] transition"
          >
            Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="py-16 text-center text-slate-400">
      <i class="fa-solid fa-circle-notch fa-spin text-2xl text-[#9E8F70] mb-2"></i>
      <p class="text-xs font-bold text-slate-600">Aggregating shift statistics...</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage" class="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
      <i class="fa-solid fa-triangle-exclamation text-rose-500 text-xl mb-1"></i>
      <p class="text-xs font-bold text-rose-700">{{ errorMessage }}</p>
      <button @click="fetchReport" class="mt-2 text-xs font-black text-[#1C2331] underline">Try Again</button>
    </div>

    <!-- Report Body -->
    <div v-else-if="reportData" class="space-y-3">
      <!-- Printable Shift Header (Visible in print) -->
      <div class="hidden print:block text-center border-b pb-3 mb-3">
        <h2 class="text-base font-black">ABJA PARKS & RECREATION</h2>
        <p class="text-[10px]">OFFICIAL POS SHIFT REPORT</p>
        <p class="text-[9px]">Period: {{ reportData.report_period.from }} to {{ reportData.report_period.to }}</p>
        <p class="text-[9px]">Terminal: {{ store.session.terminalId }} | Agent: {{ store.session.agentName }}</p>
      </div>

      <!-- Top KPI Cards (Astryx Cards with Abja Gold) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div class="bg-gradient-to-br from-[#1C2331] to-[#252E40] text-white rounded-2xl p-3.5 shadow-md border-b-2 border-[#9E8F70] col-span-2 sm:col-span-1">
          <div class="text-[9px] uppercase font-black text-[#D4C7AC] tracking-wider">Total Revenue</div>
          <div class="text-lg font-black text-white mt-0.5 tracking-tight">
            {{ formatCurrency(reportData.summary.total_revenue) }}
          </div>
          <div class="text-[9px] text-[#D4C7AC]/80 mt-1 font-semibold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Settled via MoMo
          </div>
        </div>

        <div class="bg-white border border-[#E8E6E1] rounded-2xl p-3.5 shadow-xs">
          <div class="text-[9px] uppercase font-black text-slate-400 tracking-wider">Tickets Sold</div>
          <div class="text-lg font-black text-[#1C2331] mt-0.5 tracking-tight">
            {{ reportData.summary.total_tickets_sold }}
          </div>
          <div class="text-[9px] text-slate-400 mt-1 font-medium">Admissions granted</div>
        </div>

        <div class="bg-white border border-[#E8E6E1] rounded-2xl p-3.5 shadow-xs">
          <div class="text-[9px] uppercase font-black text-slate-400 tracking-wider">Successful Txns</div>
          <div class="text-lg font-black text-emerald-700 mt-0.5 tracking-tight">
            {{ reportData.summary.successful_transactions }}
          </div>
          <div class="text-[9px] text-emerald-600 mt-1 font-bold">Paid & Confirmed</div>
        </div>

        <div class="bg-white border border-[#E8E6E1] rounded-2xl p-3.5 shadow-xs">
          <div class="text-[9px] uppercase font-black text-slate-400 tracking-wider">Declined / Failed</div>
          <div class="text-lg font-black text-rose-600 mt-0.5 tracking-tight">
            {{ reportData.summary.failed_transactions }}
          </div>
          <div class="text-[9px] text-slate-400 mt-1 font-medium">Timed out / canceled</div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="bg-white border border-[#E8E6E1] rounded-2xl p-4 shadow-xs">
        <h3 class="text-xs font-black uppercase text-[#1C2331] tracking-wider mb-3 flex items-center justify-between">
          <span class="flex items-center gap-1.5">
            <i class="fa-solid fa-ticket text-[#9E8F70]"></i>
            Ticket Category Breakdown
          </span>
          <span class="text-[10px] text-slate-400 font-semibold lowercase">
            {{ reportData.category_breakdown.length }} categories
          </span>
        </h3>

        <div class="space-y-3">
          <div
            v-for="cat in reportData.category_breakdown"
            :key="cat.category_name"
            class="bg-[#F8F7F4] border border-[#E8E6E1] rounded-xl p-2.5 space-y-1.5"
          >
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-[#1C2331]">{{ cat.category_name }}</span>
              <div class="text-right">
                <span class="font-black text-[#1C2331]">{{ formatCurrency(cat.revenue) }}</span>
                <span class="text-[10px] text-slate-500 font-medium ml-1">({{ cat.tickets_sold }} sold)</span>
              </div>
            </div>
            <!-- Progress bar -->
            <div class="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
              <div
                class="bg-[#9E8F70] h-1.5 rounded-full transition-all duration-500"
                :style="{
                  width: `${reportData.summary.total_revenue > 0 ? (cat.revenue / reportData.summary.total_revenue) * 100 : 0}%`
                }"
              ></div>
            </div>
          </div>

          <div v-if="reportData.category_breakdown.length === 0" class="text-xs text-slate-400 text-center py-4 font-semibold">
            No tickets sold in this period.
          </div>
        </div>
      </div>

      <!-- Terminal Breakdown -->
      <div class="bg-white border border-[#E8E6E1] rounded-2xl p-4 shadow-xs">
        <h3 class="text-xs font-black uppercase text-[#1C2331] tracking-wider mb-3 flex items-center justify-between">
          <span class="flex items-center gap-1.5">
            <i class="fa-solid fa-desktop text-[#9E8F70]"></i>
            Terminal / Gate Distribution
          </span>
          <span class="text-[10px] text-slate-400 font-semibold lowercase">
            {{ reportData.terminal_summary.length }} registers
          </span>
        </h3>

        <div class="space-y-2">
          <div
            v-for="t in reportData.terminal_summary"
            :key="t.terminal_id"
            class="flex items-center justify-between p-2.5 bg-[#F8F7F4] border border-[#E8E6E1] rounded-xl"
          >
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-[#1C2331] text-[#D4C7AC] rounded-lg flex items-center justify-center text-xs font-black">
                <i class="fa-solid fa-cash-register"></i>
              </div>
              <div>
                <div class="text-xs font-black text-[#1C2331]">{{ t.terminal_id || 'Default Terminal' }}</div>
                <div class="text-[10px] text-slate-500 font-medium">{{ t.tx_count }} completed transactions</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs font-black text-[#1C2331]">{{ formatCurrency(t.revenue) }}</div>
            </div>
          </div>

          <div v-if="reportData.terminal_summary.length === 0" class="text-center py-4 text-xs text-slate-400 font-semibold">
            No terminal activity recorded
          </div>
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
