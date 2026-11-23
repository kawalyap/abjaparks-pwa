<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePosStore } from '@/stores/usePosStore'
import { api } from '@/services/api'
import { printer } from '@/services/printer'
import type { TransactionHistoryItem } from '@/types'

const store = usePosStore()

const items = ref<TransactionHistoryItem[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedStatus = ref<string>('all')
const selectedDate = ref<string>(new Date().toISOString().split('T')[0] ?? '')

const selectedItem = ref<TransactionHistoryItem | null>(null)
const emailInput = ref('')
const isSendingEmail = ref(false)
const emailFeedback = ref<string | null>(null)

async function loadData() {
  isLoading.value = true
  try {
    items.value = await api.getHistory({
      date: selectedDate.value || undefined,
      status: selectedStatus.value !== 'all' ? selectedStatus.value : undefined,
      limit: 100,
    })
  } catch (err: any) {
    console.error('Failed to load history:', err)
  } finally {
    isLoading.value = false
  }
}

const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return items.value.filter(item => {
    if (selectedStatus.value !== 'all' && item.status !== selectedStatus.value) {
      return false
    }
    if (!q) return true
    return (
      item.receipt_number?.toLowerCase().includes(q) ||
      item.code?.toLowerCase().includes(q) ||
      item.momo_number?.toLowerCase().includes(q) ||
      item.customer_name?.toLowerCase().includes(q) ||
      item.category_name?.toLowerCase().includes(q)
    )
  })
})

const summaryStats = computed(() => {
  const paidItems = filteredItems.value.filter(i => i.status === 'paid')
  const totalRev = paidItems.reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0)
  const totalTix = paidItems.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0)
  return {
    count: paidItems.length,
    revenue: totalRev,
    tickets: totalTix,
  }
})

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function openDetail(item: TransactionHistoryItem) {
  selectedItem.value = item
  emailInput.value = item.customer_email || ''
  emailFeedback.value = null
}

function closeDetail() {
  selectedItem.value = null
}

async function reprintItem(item: TransactionHistoryItem) {
  await printer.printThermalReceipt({
    receiptNumber: item.receipt_number,
    ticketCode: item.code,
    categoryName: item.category_name,
    quantity: item.quantity,
    totalAmount: item.total_amount,
    currency: item.currency || 'UGX',
    momoNumber: item.momo_number,
    customerName: item.customer_name,
    terminalId: item.terminal_id || store.session.terminalId,
    agentName: item.agent_name || store.session.agentName,
    dateStr: item.created_at,
    paymentRef: item.external_payment_reference,
  })
}

async function sendEmail() {
  if (!selectedItem.value || !emailInput.value || !emailInput.value.includes('@')) {
    emailFeedback.value = 'Please enter a valid email address'
    return
  }
  isSendingEmail.value = true
  emailFeedback.value = null
  try {
    const res = await api.emailReceipt(selectedItem.value.receipt_number, emailInput.value.trim())
    emailFeedback.value = res.message || 'Receipt sent successfully!'
    selectedItem.value.customer_email = emailInput.value.trim()
  } catch (err: any) {
    emailFeedback.value = err.message || 'Failed to dispatch email'
  } finally {
    isSendingEmail.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="pos-container space-y-3">
    <!-- Top Header & Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h1 class="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-clock-rotate-left text-emerald-600"></i>
          Shift History
        </h1>
        <p class="text-[11px] text-slate-500">Reprint 58mm receipts & resend e-receipts</p>
      </div>

      <div class="flex items-center gap-2">
        <input
          v-model="selectedDate"
          type="date"
          @change="loadData"
          class="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <button
          @click="loadData"
          class="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm flex items-center gap-1.5 transition"
        >
          <i class="fa-solid fa-rotate-right" :class="{ 'fa-spin': isLoading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Quick Shift Summary Banner -->
    <div class="grid grid-cols-3 gap-2 sm:gap-3 bg-gradient-to-r from-[#1C2331] to-[#252E40] text-white p-3.5 rounded-xl shadow-sm border-l-4 border-[#9E8F70]">
      <div class="border-r border-slate-700/60 pr-2">
        <div class="text-[10px] uppercase font-bold text-[#D4C7AC] tracking-wider">Shift Revenue</div>
        <div class="text-base sm:text-lg font-black tracking-tight text-[#E2D7C0]">
          {{ formatCurrency(summaryStats.revenue) }}
        </div>
      </div>
      <div class="border-r border-slate-700/60 pr-2">
        <div class="text-[10px] uppercase font-bold text-[#D4C7AC] tracking-wider">Paid Tickets</div>
        <div class="text-base sm:text-lg font-black tracking-tight">
          {{ summaryStats.tickets }}
        </div>
      </div>
      <div>
        <div class="text-[10px] uppercase font-bold text-[#D4C7AC] tracking-wider">Transactions</div>
        <div class="text-base sm:text-lg font-black tracking-tight">
          {{ summaryStats.count }}
        </div>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="flex flex-col sm:flex-row gap-2">
      <div class="relative flex-1">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search receipt, phone, code or name..."
          class="w-full pl-8 pr-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      <div class="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <button
          v-for="st in ['all', 'paid', 'pending_payment', 'failed']"
          :key="st"
          @click="selectedStatus = st; loadData()"
          class="px-2.5 py-1.5 text-xs font-bold rounded-lg border transition capitalize whitespace-nowrap"
          :class="[
            selectedStatus === st
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          ]"
        >
          {{ st.replace('_', ' ') }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-12 text-center text-slate-400">
      <i class="fa-solid fa-circle-notch fa-spin text-2xl text-emerald-600 mb-2"></i>
      <p class="text-xs font-semibold">Loading transactions...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredItems.length === 0"
      class="py-12 text-center bg-white border border-slate-200 rounded-xl p-6"
    >
      <i class="fa-solid fa-receipt text-3xl text-slate-300 mb-2"></i>
      <h3 class="text-sm font-bold text-slate-700">No transactions found</h3>
      <p class="text-xs text-slate-400 mt-1">Try selecting a different date or clearing the filter.</p>
    </div>

    <!-- Transaction List -->
    <div v-else class="space-y-2">
      <div
        v-for="item in filteredItems"
        :key="item.id || item.transaction_id"
        @click="openDetail(item)"
        class="bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <!-- Status icon circle -->
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm"
            :class="[
              item.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
              item.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            ]"
          >
            <i
              class="fa-solid"
              :class="[
                item.status === 'paid' ? 'fa-check' :
                item.status === 'pending_payment' ? 'fa-clock' :
                'fa-xmark'
              ]"
            ></i>
          </div>

          <!-- Transaction Info -->
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-slate-800 tracking-tight">
                {{ item.receipt_number || item.code }}
              </span>
              <span
                class="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                :class="[
                  item.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  item.status === 'pending_payment' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-red-50 text-red-700 border border-red-200'
                ]"
              >
                {{ item.status === 'paid' ? 'Paid' : item.status === 'pending_payment' ? 'Pending' : 'Failed' }}
              </span>
            </div>

            <div class="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              <span>{{ item.category_name }} &bull; {{ item.quantity }} ticket(s)</span>
              <span v-if="item.momo_number" class="text-slate-400"> &bull; {{ item.momo_number }}</span>
            </div>

            <div class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
              <span><i class="fa-regular fa-clock"></i> {{ formatTime(item.created_at) }}</span>
              <span v-if="item.agent_name">&bull; {{ item.agent_name }}</span>
            </div>
          </div>
        </div>

        <!-- Amount & Action -->
        <div class="text-right shrink-0">
          <div class="text-sm font-black text-slate-900 tracking-tight">
            {{ formatCurrency(item.total_amount) }}
          </div>
          <button
            @click.stop="reprintItem(item)"
            class="mt-1 px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition flex items-center gap-1 ml-auto"
            title="Reprint 58mm Thermal Receipt"
          >
            <i class="fa-solid fa-print"></i>
            Reprint
          </button>
        </div>
      </div>
    </div>

    <!-- Item Detail & Email Modal -->
    <div
      v-if="selectedItem"
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      @click.self="closeDetail"
    >
      <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
        <!-- Header -->
        <div class="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-receipt text-amber-300"></i>
            <h3 class="font-bold text-sm">Receipt #{{ selectedItem.receipt_number || selectedItem.code }}</h3>
          </div>
          <button @click="closeDetail" class="text-slate-300 hover:text-white p-1">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div class="p-5 space-y-4">
          <!-- Breakdown -->
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs">
            <div class="flex justify-between text-slate-500">
              <span>Category</span>
              <span class="font-bold text-slate-800">{{ selectedItem.category_name }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Quantity</span>
              <span class="font-bold text-slate-800">{{ selectedItem.quantity }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>MoMo Number</span>
              <span class="font-mono font-bold text-slate-800">{{ selectedItem.momo_number }}</span>
            </div>
            <div v-if="selectedItem.customer_name" class="flex justify-between text-slate-500">
              <span>Customer Name</span>
              <span class="font-bold text-slate-800">{{ selectedItem.customer_name }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Cashier</span>
              <span class="font-bold text-slate-800">{{ selectedItem.agent_name || store.session.agentName }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Terminal</span>
              <span class="font-bold text-slate-800">{{ selectedItem.terminal_id || store.session.terminalId }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Time</span>
              <span class="font-bold text-slate-800">{{ selectedItem.created_at }}</span>
            </div>
            <div class="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span class="font-bold text-slate-700">Total Paid</span>
              <span class="font-black text-emerald-700 text-sm">{{ formatCurrency(selectedItem.total_amount) }}</span>
            </div>
          </div>

          <!-- Email Dispatch Box -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-700">
              Push Digital E-Receipt to Email
            </label>
            <div class="flex gap-2">
              <input
                v-model="emailInput"
                type="email"
                placeholder="customer@example.com"
                class="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                @click="sendEmail"
                :disabled="isSendingEmail"
                class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5 transition"
              >
                <i v-if="isSendingEmail" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-paper-plane"></i>
                Send
              </button>
            </div>
            <p v-if="emailFeedback" class="text-[11px] font-semibold text-emerald-600">
              {{ emailFeedback }}
            </p>
          </div>

          <!-- Modal Actions -->
          <div class="flex gap-2 pt-2">
            <button
              @click="reprintItem(selectedItem)"
              class="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
            >
              <i class="fa-solid fa-print"></i>
              Reprint 58mm Thermal
            </button>
            <a
              :href="`/receipt/${selectedItem.receipt_number}`"
              target="_blank"
              class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              Public Page
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
