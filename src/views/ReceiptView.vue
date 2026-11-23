<template>
  <div class="receipt-page">
    <div class="receipt-wrapper">
      <!-- Visible Screen Receipt Card -->
      <div class="receipt-card">
        <div class="receipt-header">
          <div class="receipt-logo-wrap">
            <img src="/abja-logo.png" alt="Abja Parks" class="receipt-brand-logo" />
          </div>
          <p class="receipt-sub">Official Entrance Admission Receipt</p>
          <div class="status-pill">
            <i class="fa-solid fa-check"></i>
            <span>PAID & CONFIRMED</span>
          </div>
        </div>

        <div class="receipt-body">
          <div class="receipt-amount-box">
            <span class="currency">UGX</span>
            <span class="amount">{{ (txData.totalAmount || 0).toLocaleString() }}</span>
          </div>

          <div class="meta-list">
            <div class="meta-row">
              <span class="label">Receipt No</span>
              <strong class="value">{{ txData.receiptNumber }}</strong>
            </div>
            <div class="meta-row">
              <span class="label">Ticket Category</span>
              <strong class="value">{{ txData.categoryName }} (x{{ txData.quantity }})</strong>
            </div>
            <div class="meta-row">
              <span class="label">Payment Method</span>
              <strong class="value">MTN / Airtel Mobile Money</strong>
            </div>
            <div class="meta-row">
              <span class="label">Customer Phone</span>
              <strong class="value">{{ txData.momoNumber }}</strong>
            </div>
            <div v-if="txData.customerName" class="meta-row">
              <span class="label">Customer Name</span>
              <strong class="value">{{ txData.customerName }}</strong>
            </div>
            <div v-if="txData.paymentRef" class="meta-row">
              <span class="label">Payment Ref</span>
              <strong class="value text-xs">{{ txData.paymentRef }}</strong>
            </div>
            <div class="meta-row">
              <span class="label">Date & Time</span>
              <strong class="value">{{ txData.dateStr }}</strong>
            </div>
            <div class="meta-row">
              <span class="label">Terminal / Agent</span>
              <strong class="value">{{ txData.terminalId }} • {{ txData.agentName }}</strong>
            </div>
          </div>

          <!-- QR Code Section for Customer Scan -->
          <div class="qr-box">
            <p class="qr-instruction">
              <i class="fa-solid fa-camera"></i>
              Scan QR code with smartphone to view / download digital e-receipt
            </p>
            <div class="qr-canvas-wrapper" v-if="qrImage">
              <img :src="qrImage" alt="Receipt Verification QR" class="qr-img" />
            </div>
            <span class="qr-ref">{{ txData.receiptNumber }}</span>
          </div>
        </div>

        <!-- POS Action Buttons (Hidden when printing) -->
        <div class="receipt-actions no-print">
          <button class="btn-print" @click="handlePrint">
            <i class="fa-solid fa-print"></i>
            Print Thermal Receipt
          </button>

          <div class="action-grid-2">
            <button class="btn-email" @click="showEmailModal = true">
              <i class="fa-solid fa-envelope"></i>
              Email E-Receipt
            </button>
            <button class="btn-next" @click="handleNextTicket">
              <i class="fa-solid fa-plus"></i>
              Next Ticket
            </button>
          </div>
        </div>
      </div>

      <!-- Hidden Thermal Receipt Layout (Targets 58mm / 80mm printers directly) -->
      <div class="thermal-receipt-print-area">
        <div style="text-align: center; margin-bottom: 6px;">
          <h2 style="font-size: 14px; font-weight: bold; margin: 0;">ABJA PARKS</h2>
          <p style="font-size: 10px; margin: 2px 0;">SPORTS ARENA & VENUE</p>
          <p style="font-size: 11px; font-weight: bold; margin: 4px 0;">** SUCCESSFUL ENTRY **</p>
        </div>
        <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
        <div>
          <div>Receipt: {{ txData.receiptNumber }}</div>
          <div>Ticket:  {{ txData.categoryName }} (x{{ txData.quantity }})</div>
          <div>Amount:  UGX {{ (txData.totalAmount || 0).toLocaleString() }}</div>
          <div>MoMo:    {{ txData.momoNumber }}</div>
          <div v-if="txData.customerName">Name:    {{ txData.customerName }}</div>
          <div v-if="txData.paymentRef">Ref:     {{ txData.paymentRef }}</div>
          <div>Date:    {{ txData.dateStr }}</div>
          <div>POS:     {{ txData.terminalId }} / {{ txData.agentName }}</div>
        </div>
        <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
        <div style="text-align: center;">
          <img v-if="qrImage" :src="qrImage" style="width: 120px; height: 120px; margin: 0 auto; display: block;" />
          <p style="font-size: 9px; margin-top: 4px;">Scan for official digital copy</p>
          <p style="font-size: 9px;">Powered by YoTicket Gateway</p>
        </div>
      </div>
    </div>

    <!-- Email Dispatch Modal -->
    <div v-if="showEmailModal" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>
            <i class="fa-solid fa-paper-plane text-primary"></i>
            Send E-Receipt to Email
          </h3>
          <button class="close-btn" @click="showEmailModal = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-body">
          <p class="modal-desc">
            The customer will instantly receive their official verified digital receipt in their inbox.
          </p>
          <div class="form-group">
            <label class="modal-label">Customer Email Address</label>
            <input
              type="email"
              v-model="emailInput"
              placeholder="customer@example.com"
              class="modal-input"
              autofocus
            />
          </div>

          <div v-if="emailSuccess" class="alert-success">
            <i class="fa-solid fa-circle-check"></i>
            {{ emailSuccess }}
          </div>
          <div v-if="emailError" class="alert-error">
            <i class="fa-solid fa-circle-exclamation"></i>
            {{ emailError }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showEmailModal = false">Close</button>
          <button class="btn-send" :disabled="!isEmailValid || isSendingEmail" @click="handleSendEmail">
            <span v-if="isSendingEmail"><i class="fa-solid fa-spinner fa-spin"></i> Sending...</span>
            <span v-else><i class="fa-solid fa-envelope"></i> Send Receipt</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePosStore } from '@/stores/usePosStore'
import { printer, type ReceiptData } from '@/services/printer'

const router = useRouter()
const posStore = usePosStore()

const qrImage = ref<string>('')
const showEmailModal = ref(false)
const emailInput = ref('')
const isSendingEmail = ref(false)
const emailSuccess = ref<string | null>(null)
const emailError = ref<string | null>(null)

const txData = computed<ReceiptData>(() => {
  const tx = posStore.activeTransaction
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return {
    receiptNumber: tx?.receipt_number || 'ABJA-POS-001',
    ticketCode: tx?.ticket_code || 'TKT-001',
    categoryName: tx?.category_name || 'Entrance Ticket',
    quantity: tx?.quantity || 1,
    totalAmount: tx?.total_amount || 2000,
    currency: tx?.currency || 'UGX',
    momoNumber: tx?.momo_number || '2567XXXXXXXX',
    customerName: posStore.customerName || undefined,
    agentName: posStore.session.agentName,
    terminalId: posStore.session.terminalId,
    dateStr,
    paymentRef: posStore.activeStatus?.momo_ref || tx?.provider_reference || undefined,
  }
})

const isEmailValid = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())
})

onMounted(async () => {
  if (!posStore.activeTransaction && posStore.history.length === 0) {
    router.replace({ name: 'pos.collect' })
    return
  }

  // Pre-fill email if customer provided during collection
  if (posStore.customerEmail) {
    emailInput.value = posStore.customerEmail
  }

  // Generate QR code for receipt
  qrImage.value = await printer.generateReceiptQr(txData.value.receiptNumber)
})

async function handlePrint() {
  await printer.printThermalReceipt({
    ...txData.value,
    qrDataUrl: qrImage.value,
  })
}

async function handleSendEmail() {
  if (!isEmailValid.value) return
  isSendingEmail.value = true
  emailSuccess.value = null
  emailError.value = null

  try {
    const res = await posStore.sendEmailReceipt(emailInput.value.trim())
    emailSuccess.value = res.message || 'Receipt dispatched successfully!'
    setTimeout(() => {
      showEmailModal.value = false
      emailSuccess.value = null
    }, 2000)
  } catch (err: any) {
    emailError.value = err.message || 'Failed to dispatch email.'
  } finally {
    isSendingEmail.value = false
  }
}

function handleNextTicket() {
  posStore.resetForm()
  router.push({ name: 'pos.collect' })
}
</script>

<style scoped>
.receipt-page {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 24px;
}

.receipt-wrapper {
  max-width: 440px;
  width: 100%;
}

.receipt-card {
  background: var(--card-bg);
  border-radius: var(--ax-radius-lg);
  box-shadow: var(--ax-shadow-high);
  border: 1px solid var(--border);
  overflow: hidden;
}

.receipt-header {
  background: linear-gradient(135deg, #1C2331 0%, #121722 100%);
  border-bottom: 2px solid var(--accent);
  color: #ffffff;
  padding: 20px 24px;
  text-align: center;
}

.receipt-logo-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 6px 14px;
  border-radius: var(--ax-radius-xs);
  margin-bottom: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.receipt-brand-logo {
  height: 30px;
  width: auto;
  object-fit: contain;
}

.receipt-sub {
  font-size: 12px;
  opacity: 0.85;
  margin: 2px 0 12px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #10b981;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.receipt-body {
  padding: 24px;
}

.receipt-amount-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 14px;
  text-align: center;
  margin-bottom: 20px;
}

.receipt-amount-box .currency {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
  margin-right: 4px;
}

.receipt-amount-box .amount {
  font-size: 28px;
  font-weight: 800;
  color: var(--primary);
}

.meta-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f1f5f9;
}

.meta-row .label {
  color: var(--text-muted);
}

.meta-row .value {
  color: var(--text-main);
  text-align: right;
}

/* QR Box */
.qr-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  margin-top: 16px;
}

.qr-instruction {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 10px;
  line-height: 1.3;
}

.qr-instruction i {
  color: var(--primary);
  margin-right: 4px;
}

.qr-canvas-wrapper {
  display: inline-block;
  padding: 8px;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--ax-radius-sm);
  box-shadow: var(--ax-shadow-low);
}

.qr-img {
  width: 140px;
  height: 140px;
  display: block;
}

.qr-ref {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  margin-top: 6px;
  font-family: monospace;
}

/* Actions */
.receipt-actions {
  padding: 16px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-print {
  width: 100%;
  background: var(--accent);
  color: #1C2331;
  padding: 14px;
  border-radius: var(--ax-radius-md);
  box-shadow: var(--ax-shadow-med);
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all var(--duration-fast, 125ms) ease;
}

.btn-print:hover {
  background: var(--accent-hover);
  color: #ffffff;
  transform: translateY(-1px);
}

.action-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn-email {
  background: var(--bg-app);
  color: var(--primary);
  border: 1px solid var(--border);
  padding: 12px;
  border-radius: var(--ax-radius-sm);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all var(--duration-fast, 125ms) ease;
}

.btn-email:hover {
  background: #e2e8f0;
}

.btn-next {
  background: var(--accent);
  color: #000000;
  padding: 12px;
  border-radius: var(--ax-radius-sm);
  box-shadow: var(--ax-shadow-low);
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all var(--duration-fast, 125ms) ease;
}

.btn-next:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 200;
}

.modal-card {
  background: #ffffff;
  border-radius: 16px;
  max-width: 440px;
  width: 100%;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 700;
}

.close-btn {
  background: transparent;
  font-size: 18px;
  color: #94a3b8;
}

.modal-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 14px;
}

.modal-label {
  font-size: 12px;
  font-weight: 600;
  display: block;
  margin-bottom: 6px;
}

.modal-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

.modal-input:focus {
  border-color: var(--primary);
}

.alert-success {
  background: #ecfdf5;
  color: #065f46;
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.btn-cancel {
  padding: 10px 16px;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.btn-send {
  padding: 10px 18px;
  background: var(--primary);
  color: #ffffff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Hidden Thermal Print Area by default on screen */
.thermal-receipt-print-area {
  display: none;
}
</style>
