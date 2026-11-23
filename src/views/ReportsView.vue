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
  <div class="pos-container reports-page">
    <!-- Header -->
    <div class="reports-header no-print">
      <div>
        <h1 class="page-title">
          <i class="fa-solid fa-chart-pie title-icon"></i>
          Shift Revenue & Reports
        </h1>
        <p class="page-sub">Admission analytics and terminal shift totals</p>
      </div>

      <div class="header-action">
        <button
          @click="printShiftSummary"
          class="z-report-btn"
        >
          <i class="fa-solid fa-print"></i>
          <span>Print Z-Report</span>
        </button>
      </div>
    </div>

    <!-- Date Range Filters -->
    <div class="filter-card no-print">
      <div class="filter-row">
        <!-- Preset tabs -->
        <div class="preset-pill-group">
          <button
            v-for="p in ['today', 'yesterday', 'week', 'month'] as const"
            :key="p"
            @click="setPreset(p)"
            class="preset-pill"
            :class="{ active: activePreset === p }"
          >
            {{ p === 'week' ? '7 Days' : p === 'month' ? 'This Month' : p }}
          </button>
        </div>

        <!-- Custom date inputs -->
        <div class="custom-date-row">
          <input
            v-model="customFrom"
            type="date"
            class="filter-date-input"
          />
          <span class="to-separator">to</span>
          <input
            v-model="customTo"
            type="date"
            class="filter-date-input"
          />
          <button
            @click="fetchReport"
            class="apply-date-btn"
          >
            Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-circle-notch fa-spin loading-icon"></i>
      <p class="loading-text">Aggregating shift statistics...</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage" class="error-card">
      <i class="fa-solid fa-triangle-exclamation error-icon"></i>
      <p class="error-text">{{ errorMessage }}</p>
      <button @click="fetchReport" class="retry-btn">Try Again</button>
    </div>

    <!-- Report Body -->
    <div v-else-if="reportData" class="report-content">
      <!-- Printable Shift Header (Visible in print) -->
      <div class="print-shift-header print-only">
        <h2 class="print-brand">ABJA PARKS & RECREATION</h2>
        <p class="print-sub">OFFICIAL POS SHIFT REPORT</p>
        <p class="print-meta">Period: {{ reportData.report_period.from }} to {{ reportData.report_period.to }}</p>
        <p class="print-meta">Terminal: {{ store.session.terminalId }} | Agent: {{ store.session.agentName }}</p>
      </div>

      <!-- Top KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-primary">
          <div class="kpi-label gold-label">Total Revenue</div>
          <div class="kpi-value white-text">
            {{ formatCurrency(reportData.summary.total_revenue) }}
          </div>
          <div class="kpi-hint gold-hint">
            <span class="live-indicator"></span>
            Settled via MoMo
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Tickets Sold</div>
          <div class="kpi-value">
            {{ reportData.summary.total_tickets_sold }}
          </div>
          <div class="kpi-hint">Admissions granted</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Successful Txns</div>
          <div class="kpi-value text-success">
            {{ reportData.summary.successful_transactions }}
          </div>
          <div class="kpi-hint hint-success">Paid & Confirmed</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Declined / Failed</div>
          <div class="kpi-value text-danger">
            {{ reportData.summary.failed_transactions }}
          </div>
          <div class="kpi-hint">Timed out / canceled</div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="section-card">
        <div class="card-header-row">
          <span class="card-title">
            <i class="fa-solid fa-ticket"></i>
            Ticket Category Breakdown
          </span>
          <span class="badge-count">
            {{ reportData.category_breakdown.length }} categories
          </span>
        </div>

        <div class="category-list">
          <div
            v-for="cat in reportData.category_breakdown"
            :key="cat.category_name"
            class="cat-row"
          >
            <div class="cat-top">
              <span class="cat-title">{{ cat.category_name }}</span>
              <div class="cat-figures">
                <span class="cat-rev">{{ formatCurrency(cat.revenue) }}</span>
                <span class="cat-sold">({{ cat.tickets_sold }} sold)</span>
              </div>
            </div>
            <!-- Progress bar -->
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{
                  width: `${reportData.summary.total_revenue > 0 ? (cat.revenue / reportData.summary.total_revenue) * 100 : 0}%`
                }"
              ></div>
            </div>
          </div>

          <div v-if="reportData.category_breakdown.length === 0" class="no-data-text">
            No tickets sold in this period.
          </div>
        </div>
      </div>

      <!-- Terminal Breakdown -->
      <div class="section-card">
        <div class="card-header-row">
          <span class="card-title">
            <i class="fa-solid fa-desktop"></i>
            Terminal / Gate Distribution
          </span>
          <span class="badge-count">
            {{ reportData.terminal_summary.length }} registers
          </span>
        </div>

        <div class="terminal-list">
          <div
            v-for="t in reportData.terminal_summary"
            :key="t.terminal_id"
            class="terminal-row"
          >
            <div class="term-left">
              <div class="term-icon">
                <i class="fa-solid fa-cash-register"></i>
              </div>
              <div class="term-info">
                <div class="term-id">{{ t.terminal_id || 'Default Terminal' }}</div>
                <div class="term-count">{{ t.tx_count }} completed transactions</div>
              </div>
            </div>
            <div class="term-rev">
              {{ formatCurrency(t.revenue) }}
            </div>
          </div>

          <div v-if="reportData.terminal_summary.length === 0" class="no-data-text">
            No terminal activity recorded
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reports-page {
  padding-top: 12px;
  padding-bottom: 24px;
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reports-header {
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

.z-report-btn {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 900;
  color: #ffffff;
  background: #1C2331;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.z-report-btn i {
  color: var(--accent, #9E8F70);
}

.z-report-btn:hover {
  background: #121722;
}

/* Filter Card */
.filter-card {
  background: #ffffff;
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 14px;
  padding: 12px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.preset-pill-group {
  display: flex;
  gap: 4px;
  background: var(--bg-app, #F8F7F4);
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--border, #E8E6E1);
}

.preset-pill {
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 800;
  border-radius: 8px;
  color: #64748b;
  text-transform: capitalize;
  transition: all 0.15s ease;
}

.preset-pill.active {
  background: #1C2331;
  color: #ffffff;
}

.custom-date-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-date-input {
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 700;
  background: var(--bg-app, #F8F7F4);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 8px;
  color: var(--text-main, #1C2331);
  outline: none;
}

.filter-date-input:focus {
  border-color: var(--accent, #9E8F70);
}

.to-separator {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}

.apply-date-btn {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 900;
  background: var(--accent, #9E8F70);
  color: #1C2331;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.apply-date-btn:hover {
  background: #8B7C5E;
  color: #ffffff;
}

/* States */
.loading-state {
  padding: 50px 20px;
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

.error-card {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 14px;
  padding: 16px;
  text-align: center;
}

.error-icon {
  font-size: 20px;
  color: #e11d48;
  margin-bottom: 6px;
}

.error-text {
  font-size: 12px;
  font-weight: 700;
  color: #be123c;
}

.retry-btn {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 900;
  color: var(--text-main, #1C2331);
  text-decoration: underline;
}

/* Report Content */
.report-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

@media (min-width: 600px) {
  .kpi-grid {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}

.kpi-card {
  background: #ffffff;
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.kpi-primary {
  background: linear-gradient(135deg, #1C2331 0%, #252E40 100%);
  color: #ffffff;
  border-bottom: 3px solid var(--accent, #9E8F70);
  grid-column: span 2;
}

@media (min-width: 600px) {
  .kpi-primary {
    grid-column: span 1;
  }
}

.kpi-label {
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.04em;
}

.gold-label {
  color: #D4C7AC;
}

.kpi-value {
  font-size: 16px;
  font-weight: 900;
  color: var(--text-main, #1C2331);
  margin-top: 2px;
  letter-spacing: -0.01em;
}

.white-text {
  color: #ffffff;
}

.text-success { color: #059669; }
.text-danger { color: #e11d48; }

.kpi-hint {
  font-size: 9px;
  color: #94a3b8;
  margin-top: 4px;
  font-weight: 600;
}

.gold-hint {
  color: #D4C7AC;
  display: flex;
  align-items: center;
  gap: 4px;
}

.live-indicator {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #34d399;
}

.hint-success {
  color: #059669;
  font-weight: 700;
}

/* Section Cards */
.section-card {
  background: #ffffff;
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-main, #1C2331);
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-title i {
  color: var(--accent, #9E8F70);
}

.badge-count {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
}

.category-list, .terminal-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cat-row {
  background: var(--bg-app, #F8F7F4);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}

.cat-title {
  font-weight: 800;
  color: var(--text-main, #1C2331);
}

.cat-figures {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cat-rev {
  font-weight: 900;
  color: var(--text-main, #1C2331);
}

.cat-sold {
  font-size: 10px;
  color: #64748b;
}

.progress-track {
  width: 100%;
  height: 5px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent, #9E8F70);
  border-radius: 9999px;
  transition: width 0.4s ease;
}

.terminal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--bg-app, #F8F7F4);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 10px;
}

.term-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.term-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #1C2331;
  color: #D4C7AC;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.term-info {
  display: flex;
  flex-direction: column;
}

.term-id {
  font-size: 11px;
  font-weight: 900;
  color: var(--text-main, #1C2331);
}

.term-count {
  font-size: 9px;
  color: #64748b;
  font-weight: 600;
}

.term-rev {
  font-size: 12px;
  font-weight: 900;
  color: var(--text-main, #1C2331);
}

.no-data-text {
  text-align: center;
  font-size: 11px;
  color: #94a3b8;
  padding: 16px;
  font-weight: 600;
}

.print-only {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block !important;
  }
}
</style>
