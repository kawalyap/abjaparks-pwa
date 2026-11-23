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
  <div class="pos-container max-w-2xl mx-auto py-3 px-3 space-y-3">
    <!-- Top Header -->
    <div class="flex items-center justify-between gap-2">
      <div>
        <h1 class="text-base font-black text-[#1C2331] uppercase tracking-tight flex items-center gap-2">
          <i class="fa-solid fa-clock-rotate-left text-[#9E8F70]"></i>
          Shift History
        </h1>
        <p class="text-[11px] text-slate-500 font-medium">Reprint 58mm receipts & resend e-receipts</p>
      </div>

      <div class="flex items-center gap-1.5">
        <input
          v-model="selectedDate"
          type="date"
          @change="loadData"
          class="px-2.5 py-1.5 text-xs font-bold bg-white text-[#1C2331] border border-[#E8E6E1] rounded-xl shadow-xs focus:ring-2 focus:ring-[#9E8F70] outline-none"
        />
        <button
          @click="loadData"
          class="p-2 text-xs font-bold text-[#1C2331] bg-white hover:bg-slate-50 border border-[#E8E6E1] rounded-xl shadow-xs transition"
          title="Refresh transactions"
        >
          <i class="fa-solid fa-rotate-right" :class="{ 'fa-spin': isLoading }"></i>
        </button>
      </div>
    </div>

    <!-- Quick Shift Summary Banner (Abja Brand Gradient) -->
    <div class="bg-gradient-to-r from-[#1C2331] via-[#242D3E] to-[#1C2331] text-white p-3.5 rounded-2xl shadow-md border-l-4 border-[#9E8F70]">
      <div class="grid grid-cols-3 gap-2">
        <div class="border-r border-slate-700/60 pr-2">
          <div class="text-[9px] uppercase font-black text-[#D4C7AC] tracking-wider">Shift Revenue</div>
          <div class="text-sm sm:text-base font-black tracking-tight text-[#FAF9F6] mt-0.5">
            {{ formatCurrency(summaryStats.revenue) }}
          </div>
        </div>
        <div class="border-r border-slate-700/60 pr-2">
          <div class="text-[9px] uppercase font-black text-[#D4C7AC] tracking-wider">Paid Tickets</div>
          <div class="text-sm sm:text-base font-black tracking-tight text-white mt-0.5">
            {{ summaryStats.tickets }}
          </div>
        </div>
        <div>
          <div class="text-[9px] uppercase font-black text-[#D4C7AC] tracking-wider">Txns</div>
          <div class="text-sm sm:text-base font-black tracking-tight text-white mt-0.5">
            {{ summaryStats.count }}
          </div>
        </div>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="space-y-2">
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search receipt, phone, code or name..."
          class="w-full pl-8 pr-3 py-2 text-xs font-medium bg-white text-[#1C2331] border border-[#E8E6E1] rounded-xl shadow-xs focus:ring-2 focus:ring-[#9E8F70] outline-none"
        />
      </div>

      <!-- Status Chips -->
      <div class="flex gap-1.5 overflow-x-auto pb-0.5">
        <button
          v-for="st in ['all', 'paid', 'pending_payment', 'failed']"
          :key="st"
          @click="selectedStatus = st; loadData()"
          class="px-3 py-1.5 text-[11px] font-black rounded-xl border transition capitalize whitespace-nowrap"
          :class="[
            selectedStatus === st
              ? 'bg-[#1C2331] text-white border-[#1C2331] shadow-xs'
              : 'bg-white text-slate-600 border-[#E8E6E1] hover:bg-[#F8F7F4]'
          ]"
        >
          <span v-if="st === 'paid'" class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
          <span v-else-if="st === 'pending_payment'" class="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
          <span v-else-if="st === 'failed'" class="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span>
          {{ st === 'pending_payment' ? 'Pending' : st }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-12 text-center text-slate-400">
      <i class="fa-solid fa-circle-notch fa-spin text-2xl text-[#9E8F70] mb-2"></i>
      <p class="text-xs font-bold text-slate-600">Loading transactions...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredItems.length === 0"
      class="py-12 text-center bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs"
    >
      <div class="w-12 h-12 bg-[#F8F7F4] text-[#9E8F70] rounded-2xl flex items-center justify-center mx-auto mb-2">
        <i class="fa-solid fa-receipt text-xl"></i>
      </div>
      <h3 class="text-xs font-black text-[#1C2331] uppercase">No transactions found</h3>
      <p class="text-[11px] text-slate-400 mt-1">Try selecting a different date or clearing your filter.</p>
    </div>

    <!-- Transaction List (Mobile-Optimized Cards) -->
    <div v-else class="space-y-2">
      <div
        v-for="item in filteredItems"
        :key="item.id || item.transaction_id"
        @click="openDetail(item)"
        class="bg-white border border-[#E8E6E1] rounded-xl p-3 shadow-xs hover:border-[#9E8F70] hover:shadow-md transition cursor-pointer flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <!-- Status icon circle -->
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
            :class="[
              item.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              item.status === 'pending_payment' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-rose-50 text-rose-700 border border-rose-200'
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
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-black text-[#1C2331] tracking-tight">
                {{ item.receipt_number || item.code }}
              </span>
              <span
                class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider"
                :class="[
                  item.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                  item.status === 'pending_payment' ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                ]"
              >
                {{ item.status === 'paid' ? 'Paid' : item.status === 'pending_payment' ? 'Pending' : 'Failed' }}
              </span>
            </div>

            <div class="text-[11px] text-slate-600 font-semibold truncate mt-0.5">
              <span>{{ item.category_name }} &bull; {{ item.quantity }} tkt(s)</span>
              <span v-if="item.momo_number" class="text-slate-400 font-mono"> &bull; {{ item.momo_number }}</span>
            </div>

            <div class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
              <span><i class="fa-regular fa-clock text-[9px]"></i> {{ formatTime(item.created_at) }}</span>
              <span v-if="item.agent_name">&bull; {{ item.agent_name }}</span>
            </div>
          </div>
        </div>

        <!-- Amount & Quick Reprint -->
        <div class="text-right shrink-0">
          <div class="text-xs sm:text-sm font-black text-[#1C2331] tracking-tight">
            {{ formatCurrency(item.total_amount) }}
          </div>
          <button
            @click.stop="reprintItem(item)"
            class="mt-1 px-2.5 py-1 text-[10px] font-black text-[#1C2331] bg-[#F7F5F1] hover:bg-[#9E8F70] hover:text-white rounded-lg border border-[#D5D1C7] transition flex items-center gap-1 ml-auto shadow-2xs"
            title="Reprint 58mm Thermal Receipt"
          >
            <i class="fa-solid fa-print"></i>
            Reprint
          </button>
        </div>
      </div>
    </div>

    <!-- Receipt Detail & Email Modal -->
    <div
      v-if="selectedItem"
      class="fixed inset-0 z-50 bg-[#1C2331]/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in"
      @click.self="closeDetail"
    >
      <div class="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-[#E8E6E1]">
        <!-- Brand Modal Header -->
        <div class="bg-gradient-to-r from-[#1C2331] via-[#242D3E] to-[#1C2331] text-white p-4 flex items-center justify-between border-b-2 border-[#9E8F70]">
          <div class="flex items-center gap-2">
            <div class="bg-white px-2 py-1 rounded-md">
              <img src="/abja-logo.png" alt="Abja" class="h-4 object-contain" />
            </div>
            <h3 class="font-black text-xs uppercase tracking-tight text-[#EFECE6]">
              #{{ selectedItem.receipt_number || selectedItem.code }}
            </h3>
          </div>
          <button @click="closeDetail" class="text-slate-400 hover:text-white p-1">
            <i class="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <div class="p-4 space-y-3">
          <!-- Breakdown Ticket -->
          <div class="bg-[#F8F7F4] border border-[#E8E6E1] rounded-xl p-3 space-y-1.5 text-xs">
            <div class="flex justify-between text-slate-500 font-medium">
              <span>Category</span>
              <span class="font-bold text-[#1C2331]">{{ selectedItem.category_name }}</span>
            </div>
            <div class="flex justify-between text-slate-500 font-medium">
              <span>Quantity</span>
              <span class="font-bold text-[#1C2331]">{{ selectedItem.quantity }} Person(s)</span>
            </div>
            <div class="flex justify-between text-slate-500 font-medium">
              <span>MoMo Number</span>
              <span class="font-mono font-bold text-[#1C2331]">{{ selectedItem.momo_number }}</span>
            </div>
            <div v-if="selectedItem.customer_name" class="flex justify-between text-slate-500 font-medium">
              <span>Customer</span>
              <span class="font-bold text-[#1C2331]">{{ selectedItem.customer_name }}</span>
            </div>
            <div class="flex justify-between text-slate-500 font-medium">
              <span>Terminal / Cashier</span>
              <span class="font-bold text-[#1C2331]">{{ selectedItem.terminal_id }} &bull; {{ selectedItem.agent_name }}</span>
            </div>
            <div class="flex justify-between text-slate-500 font-medium">
              <span>Timestamp</span>
              <span class="font-bold text-[#1C2331]">{{ selectedItem.created_at }}</span>
            </div>
            <div class="pt-2 border-t border-[#E8E6E1] flex justify-between items-center">
              <span class="font-black text-slate-700 uppercase text-[11px]">Total Paid</span>
              <span class="font-black text-[#1C2331] text-base">{{ formatCurrency(selectedItem.total_amount) }}</span>
            </div>
          </div>

          <!-- Email Dispatch Box -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-black uppercase tracking-wider text-[#1C2331]">
              Push E-Receipt to Email
            </label>
            <div class="flex gap-1.5">
              <input
                v-model="emailInput"
                type="email"
                placeholder="customer@example.com"
                class="flex-1 px-3 py-2 text-xs border border-[#E8E6E1] rounded-xl focus:ring-2 focus:ring-[#9E8F70] outline-none"
              />
              <button
                @click="sendEmail"
                :disabled="isSendingEmail"
                class="px-3.5 py-2 text-xs font-black text-[#1C2331] bg-[#9E8F70] hover:bg-[#8B7C5E] rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition"
              >
                <i v-if="isSendingEmail" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-paper-plane"></i>
                Send
              </button>
            </div>
            <p v-if="emailFeedback" class="text-[10px] font-bold text-emerald-700">
              {{ emailFeedback }}
            </p>
          </div>

          <!-- Modal Actions -->
          <div class="flex gap-2 pt-1">
            <button
              @click="reprintItem(selectedItem)"
              class="flex-1 py-2.5 bg-[#1C2331] hover:bg-[#121722] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition"
            >
              <i class="fa-solid fa-print text-[#9E8F70]"></i>
              58mm Print
            </button>
            <a
              :href="`/receipt/${selectedItem.receipt_number}`"
              target="_blank"
              class="px-3 py-2.5 bg-[#F8F7F4] hover:bg-slate-100 text-[#1C2331] border border-[#E8E6E1] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition"
            >
              <i class="fa-solid fa-arrow-up-right-from-square text-[#9E8F70]"></i>
              Public
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
