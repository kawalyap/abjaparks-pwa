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
  <div class="pos-container history-page">
    <!-- Top Header -->
    <div class="page-top-header">
      <div>
        <h1 class="page-title">
          <i class="fa-solid fa-clock-rotate-left title-icon"></i>
          Shift History
        </h1>
        <p class="page-sub">Reprint 58mm receipts & resend e-receipts</p>
      </div>

      <div class="controls-group">
        <input
          v-model="selectedDate"
          type="date"
          @change="loadData"
          class="date-input"
        />
        <button
          @click="loadData"
          class="refresh-btn"
          title="Refresh transactions"
        >
          <i class="fa-solid fa-rotate-right" :class="{ 'fa-spin': isLoading }"></i>
        </button>
      </div>
    </div>

    <!-- Quick Shift Summary Banner -->
    <div class="shift-banner">
      <div class="banner-col border-right">
        <div class="banner-label">Shift Revenue</div>
        <div class="banner-value gold-text">
          {{ formatCurrency(summaryStats.revenue) }}
        </div>
      </div>
      <div class="banner-col border-right">
        <div class="banner-label">Paid Tickets</div>
        <div class="banner-value">
          {{ summaryStats.tickets }}
        </div>
      </div>
      <div class="banner-col">
        <div class="banner-label">Txns</div>
        <div class="banner-value">
          {{ summaryStats.count }}
        </div>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="search-filter-section">
      <div class="search-wrap">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search receipt, phone, code or name..."
          class="search-input"
        />
      </div>

      <!-- Status Chips -->
      <div class="status-chips-row">
        <button
          v-for="st in ['all', 'paid', 'pending_payment', 'failed']"
          :key="st"
          @click="selectedStatus = st; loadData()"
          class="status-chip"
          :class="{ active: selectedStatus === st }"
        >
          <span v-if="st === 'paid'" class="dot dot-paid"></span>
          <span v-else-if="st === 'pending_payment'" class="dot dot-pending"></span>
          <span v-else-if="st === 'failed'" class="dot dot-failed"></span>
          {{ st === 'pending_payment' ? 'Pending' : st }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-circle-notch fa-spin loading-icon"></i>
      <p class="loading-text">Loading transactions...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredItems.length === 0" class="empty-state">
      <div class="empty-icon-box">
        <i class="fa-solid fa-receipt"></i>
      </div>
      <h3 class="empty-title">No transactions found</h3>
      <p class="empty-sub">Try selecting a different date or clearing your filter.</p>
    </div>

    <!-- Transaction List -->
    <div v-else class="tx-list">
      <div
        v-for="item in filteredItems"
        :key="item.id || item.transaction_id"
        @click="openDetail(item)"
        class="tx-card"
      >
        <div class="tx-left">
          <!-- Status icon circle -->
          <div
            class="status-circle"
            :class="[
              item.status === 'paid' ? 'status-paid' :
              item.status === 'pending_payment' ? 'status-pending' :
              'status-failed'
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
          <div class="tx-info">
            <div class="tx-title-row">
              <span class="tx-code">{{ item.receipt_number || item.code }}</span>
              <span
                class="badge-pill"
                :class="[
                  item.status === 'paid' ? 'badge-paid' :
                  item.status === 'pending_payment' ? 'badge-pending' :
                  'badge-failed'
                ]"
              >
                {{ item.status === 'paid' ? 'Paid' : item.status === 'pending_payment' ? 'Pending' : 'Failed' }}
              </span>
            </div>

            <div class="tx-desc-row">
              <span>{{ item.category_name }} &bull; {{ item.quantity }} tkt(s)</span>
              <span v-if="item.momo_number" class="tx-momo"> &bull; {{ item.momo_number }}</span>
            </div>

            <div class="tx-meta-row">
              <span><i class="fa-regular fa-clock"></i> {{ formatTime(item.created_at) }}</span>
              <span v-if="item.agent_name">&bull; {{ item.agent_name }}</span>
            </div>
          </div>
        </div>

        <!-- Amount & Quick Reprint -->
        <div class="tx-right">
          <div class="tx-amount">
            {{ formatCurrency(item.total_amount) }}
          </div>
          <button
            @click.stop="reprintItem(item)"
            class="reprint-btn"
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
      class="modal-backdrop"
      @click.self="closeDetail"
    >
      <div class="modal-box">
        <!-- Brand Modal Header -->
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-logo-wrap">
              <img src="/abja-logo.png" alt="Abja" class="modal-logo" />
            </div>
            <h3 class="modal-receipt-num">
              #{{ selectedItem.receipt_number || selectedItem.code }}
            </h3>
          </div>
          <button @click="closeDetail" class="modal-close-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-content">
          <!-- Breakdown Ticket -->
          <div class="receipt-slip">
            <div class="slip-row">
              <span>Category</span>
              <strong>{{ selectedItem.category_name }}</strong>
            </div>
            <div class="slip-row">
              <span>Quantity</span>
              <strong>{{ selectedItem.quantity }} Person(s)</strong>
            </div>
            <div class="slip-row">
              <span>MoMo Number</span>
              <strong class="font-mono">{{ selectedItem.momo_number }}</strong>
            </div>
            <div v-if="selectedItem.customer_name" class="slip-row">
              <span>Customer</span>
              <strong>{{ selectedItem.customer_name }}</strong>
            </div>
            <div class="slip-row">
              <span>Terminal / Cashier</span>
              <strong>{{ selectedItem.terminal_id }} &bull; {{ selectedItem.agent_name }}</strong>
            </div>
            <div class="slip-row">
              <span>Timestamp</span>
              <strong>{{ selectedItem.created_at }}</strong>
            </div>
            <div class="slip-total-row">
              <span>Total Paid</span>
              <strong class="total-ugx">{{ formatCurrency(selectedItem.total_amount) }}</strong>
            </div>
          </div>

          <!-- Email Dispatch Box -->
          <div class="email-dispatch-box">
            <label class="email-label">Push E-Receipt to Email</label>
            <div class="email-input-row">
              <input
                v-model="emailInput"
                type="email"
                placeholder="customer@example.com"
                class="email-input"
              />
              <button
                @click="sendEmail"
                :disabled="isSendingEmail"
                class="email-send-btn"
              >
                <i v-if="isSendingEmail" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-paper-plane"></i>
                Send
              </button>
            </div>
            <p v-if="emailFeedback" class="email-feedback">
              {{ emailFeedback }}
            </p>
          </div>

          <!-- Modal Actions -->
          <div class="modal-action-row">
            <button
              @click="reprintItem(selectedItem)"
              class="print-thermal-btn"
            >
              <i class="fa-solid fa-print"></i>
              58mm Print
            </button>
            <a
              :href="`/receipt/${selectedItem.receipt_number}`"
              target="_blank"
              class="public-link-btn"
            >
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              Public
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-page {
  padding-top: 12px;
  padding-bottom: 24px;
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.page-title {
  font-size: 15px;
  font-weight: 900;
  color: var(--text-main, #1C2331);
  text-transform: uppercase;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.title-icon {
  color: var(--accent, #9E8F70);
}

.page-sub {
  font-size: 11px;
  color: var(--text-muted, #6B7280);
  font-weight: 600;
  margin-top: 2px;
}

.controls-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-input {
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 700;
  background: #ffffff;
  color: var(--text-main, #1C2331);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 10px;
  outline: none;
}

.refresh-btn {
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-main, #1C2331);
  background: #ffffff;
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 10px;
}

.refresh-btn:hover {
  background: #f8fafc;
}

/* Shift Summary Banner */
.shift-banner {
  background: linear-gradient(135deg, #1C2331 0%, #242D3E 100%);
  color: #ffffff;
  padding: 14px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(28, 35, 49, 0.12);
  border-left: 4px solid var(--accent, #9E8F70);
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.banner-col {
  display: flex;
  flex-direction: column;
}

.border-right {
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  padding-right: 8px;
}

.banner-label {
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  color: #D4C7AC;
  letter-spacing: 0.05em;
}

.banner-value {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.01em;
  margin-top: 2px;
}

.gold-text {
  color: #FAF9F6;
}

/* Search & Filter */
.search-filter-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 9px 12px 9px 34px;
  font-size: 12px;
  font-weight: 600;
  background: #ffffff;
  color: var(--text-main, #1C2331);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 12px;
  outline: none;
}

.search-input:focus {
  border-color: var(--accent, #9E8F70);
  box-shadow: 0 0 0 3px rgba(158, 143, 112, 0.2);
}

.status-chips-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.status-chip {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 800;
  border-radius: 10px;
  border: 1px solid var(--border, #E8E6E1);
  background: #ffffff;
  color: #64748b;
  text-transform: capitalize;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.status-chip:hover {
  background: var(--bg-app, #F8F7F4);
}

.status-chip.active {
  background: #1C2331;
  color: #ffffff;
  border-color: #1C2331;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.dot-paid { background: #34d399; }
.dot-pending { background: #fbbf24; }
.dot-failed { background: #f87171; }

/* States */
.loading-state {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
}

.loading-icon {
  font-size: 24px;
  color: var(--accent, #9E8F70);
  margin-bottom: 8px;
}

.loading-text {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-main, #1C2331);
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  background: #ffffff;
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 16px;
}

.empty-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--bg-app, #F8F7F4);
  color: var(--accent, #9E8F70);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin: 0 auto 8px;
}

.empty-title {
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-main, #1C2331);
}

.empty-sub {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

/* Transaction List Cards */
.tx-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tx-card {
  background: #ffffff;
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tx-card:hover {
  border-color: var(--accent, #9E8F70);
  box-shadow: 0 4px 12px rgba(28, 35, 49, 0.06);
}

.tx-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.status-circle {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}

.status-paid {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}
.status-pending {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}
.status-failed {
  background: #fff1f2;
  color: #e11d48;
  border: 1px solid #fecdd3;
}

.tx-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tx-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tx-code {
  font-size: 12px;
  font-weight: 900;
  color: var(--text-main, #1C2331);
}

.badge-pill {
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.03em;
}

.badge-paid { background: #d1fae5; color: #065f46; }
.badge-pending { background: #fef3c7; color: #92400e; }
.badge-failed { background: #fee2e2; color: #991b1b; }

.tx-desc-row {
  font-size: 11px;
  color: #475569;
  font-weight: 600;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-momo {
  font-family: monospace;
  color: #94a3b8;
}

.tx-meta-row {
  font-size: 10px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.tx-right {
  text-align: right;
  flex-shrink: 0;
}

.tx-amount {
  font-size: 13px;
  font-weight: 900;
  color: var(--text-main, #1C2331);
  letter-spacing: -0.01em;
}

.reprint-btn {
  margin-top: 4px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 900;
  color: var(--text-main, #1C2331);
  background: var(--bg-app, #F8F7F4);
  border: 1px solid #d1d5db;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  transition: all 0.15s ease;
}

.reprint-btn:hover {
  background: var(--accent, #9E8F70);
  color: #ffffff;
  border-color: var(--accent, #9E8F70);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(28, 35, 49, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.modal-box {
  background: #ffffff;
  border-radius: 20px;
  max-width: 380px;
  width: 100%;
  border: 1px solid var(--border, #E8E6E1);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, #1C2331 0%, #242D3E 100%);
  color: #ffffff;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid var(--accent, #9E8F70);
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-logo-wrap {
  background: #ffffff;
  padding: 3px 6px;
  border-radius: 6px;
}

.modal-logo {
  height: 16px;
  width: auto;
  object-fit: contain;
}

.modal-receipt-num {
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  color: #EFECE6;
  margin: 0;
}

.modal-close-btn {
  color: #94a3b8;
  font-size: 16px;
  background: transparent;
}

.modal-close-btn:hover {
  color: #ffffff;
}

.modal-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.receipt-slip {
  background: var(--bg-app, #F8F7F4);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.slip-row {
  display: flex;
  justify-content: space-between;
  color: #64748b;
}

.slip-row strong {
  color: var(--text-main, #1C2331);
}

.slip-total-row {
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px dashed #cbd5e1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.total-ugx {
  font-size: 15px;
  color: var(--text-main, #1C2331);
}

.email-dispatch-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.email-label {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-main, #1C2331);
}

.email-input-row {
  display: flex;
  gap: 6px;
}

.email-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 10px;
  outline: none;
}

.email-input:focus {
  border-color: var(--accent, #9E8F70);
}

.email-send-btn {
  padding: 8px 14px;
  font-size: 11px;
  font-weight: 900;
  background: var(--accent, #9E8F70);
  color: #1C2331;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.email-send-btn:hover {
  background: #8B7C5E;
  color: #ffffff;
}

.email-feedback {
  font-size: 10px;
  font-weight: 700;
  color: #059669;
}

.modal-action-row {
  display: flex;
  gap: 8px;
}

.print-thermal-btn {
  flex: 1;
  padding: 10px;
  background: #1C2331;
  color: #ffffff;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.print-thermal-btn i {
  color: var(--accent, #9E8F70);
}

.print-thermal-btn:hover {
  background: #121722;
}

.public-link-btn {
  padding: 10px 14px;
  background: var(--bg-app, #F8F7F4);
  color: var(--text-main, #1C2331);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 900;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.public-link-btn:hover {
  background: #e2e8f0;
}
</style>
