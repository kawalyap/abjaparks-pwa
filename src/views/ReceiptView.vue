<template>
  <div class="pos-container receipt-page">
    <div class="receipt-card">
      <!-- Brand Header -->
      <div class="receipt-header">
        <div class="receipt-logo-wrap">
          <img src="/abja-logo.png" alt="Abja Parks" class="receipt-brand-logo" />
        </div>
        <p class="receipt-sub">Official Entrance Admission Receipt</p>
        <div class="status-pill">
          <i class="fa-solid fa-circle-check"></i>
          <span>PAID & CONFIRMED</span>
        </div>
      </div>

      <!-- Receipt Body -->
      <div class="receipt-body">
        <!-- Total Amount Card -->
        <div class="amount-box">
          <span class="currency-label">UGX</span>
          <span class="amount-figure">
            {{ (txData.totalAmount || 0).toLocaleString() }}
          </span>
        </div>

        <!-- Transaction Breakdown Table -->
        <div class="meta-card">
          <div class="meta-row">
            <span>Receipt No</span>
            <strong class="font-mono">{{ txData.receiptNumber }}</strong>
          </div>
          <div class="meta-row">
            <span>Ticket Category</span>
            <strong>{{ txData.categoryName }} (x{{ txData.quantity }})</strong>
          </div>
          <div class="meta-row">
            <span>Payment Method</span>
            <strong>Mobile Money Push</strong>
          </div>
          <div class="meta-row">
            <span>Customer MoMo</span>
            <strong class="font-mono">{{ txData.momoNumber }}</strong>
          </div>
          <div v-if="txData.customerName" class="meta-row">
            <span>Customer Name</span>
            <strong>{{ txData.customerName }}</strong>
          </div>
          <div v-if="txData.paymentRef" class="meta-row">
            <span>Payment Ref</span>
            <strong class="font-mono truncate-text">{{ txData.paymentRef }}</strong>
          </div>
          <div class="meta-row">
            <span>Date & Time</span>
            <strong>{{ txData.dateStr }}</strong>
          </div>
          <div class="meta-row">
            <span>Terminal / Agent</span>
            <strong>{{ txData.terminalId }} &bull; {{ txData.agentName }}</strong>
          </div>
        </div>

        <!-- Customer Smartphone QR Scan Box -->
        <div class="qr-container">
          <p class="qr-hint">
            <i class="fa-solid fa-camera"></i>
            Scan with phone camera for digital receipt
          </p>
          <div v-if="qrImage" class="qr-canvas">
            <img :src="qrImage" alt="Receipt Verification QR" class="qr-img" />
          </div>
          <span class="qr-ref-code">
            Ref: {{ txData.receiptNumber }}
          </span>
        </div>

        <!-- POS Action Buttons (Hidden when printing) -->
        <div class="action-buttons-wrap no-print">
          <button class="print-primary-btn" @click="handlePrint">
            <i class="fa-solid fa-print"></i>
            <span>Print 58mm Thermal Receipt</span>
          </button>

          <div class="sub-actions-grid">
            <button class="email-btn" @click="showEmailModal = true">
              <i class="fa-solid fa-envelope"></i>
              <span>Email E-Receipt</span>
            </button>
            <button class="next-btn" @click="handleNextTicket">
              <i class="fa-solid fa-plus"></i>
              <span>Next Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden Thermal Receipt Layout (Directly targets 58mm / 80mm printers) -->
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

    <!-- Email Dispatch Modal -->
    <div v-if="showEmailModal" class="modal-backdrop" @click.self="showEmailModal = false">
      <div class="email-modal-card">
        <div class="modal-top">
          <div class="modal-header-left">
            <div class="modal-icon-pill">
              <i class="fa-solid fa-paper-plane"></i>
            </div>
            <h3 class="modal-heading">Send E-Receipt</h3>
          </div>
          <button @click="showEmailModal = false" class="modal-close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <p class="modal-instructions">
          The customer will instantly receive their verified PDF & digital entry receipt.
        </p>

        <div class="modal-field">
          <label class="modal-field-label">Customer Email</label>
          <input
            type="email"
            v-model="emailInput"
            placeholder="customer@example.com"
            class="modal-text-input"
            autofocus
          />
        </div>

        <div v-if="emailSuccess" class="alert-box alert-success">
          <i class="fa-solid fa-circle-check"></i>
          <span>{{ emailSuccess }}</span>
        </div>

        <div v-if="emailError" class="alert-box alert-error">
          <i class="fa-solid fa-circle-exclamation"></i>
          <span>{{ emailError }}</span>
        </div>

        <div class="modal-footer-btns">
          <button class="btn-cancel" @click="showEmailModal = false">
            Cancel
          </button>
          <button
            class="btn-send-receipt"
            :disabled="!isEmailValid || isSendingEmail"
            @click="handleSendEmail"
          >
            <span v-if="isSendingEmail"><i class="fa-solid fa-spinner fa-spin"></i> Sending...</span>
            <span v-else><i class="fa-solid fa-paper-plane"></i> Send Now</span>
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
  padding-top: 14px;
  padding-bottom: 24px;
  max-width: 440px;
  margin: 0 auto;
}

.receipt-card {
  background: #ffffff;
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(28, 35, 49, 0.08);
  overflow: hidden;
}

.receipt-header {
  background: linear-gradient(180deg, #1C2331 0%, #171E2B 100%);
  color: #ffffff;
  padding: 20px;
  text-align: center;
  border-bottom: 2px solid var(--accent, #9E8F70);
}

.receipt-logo-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 5px 12px;
  border-radius: 10px;
  margin-bottom: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.receipt-brand-logo {
  height: 26px;
  width: auto;
  object-fit: contain;
  display: block;
}

.receipt-sub {
  font-size: 11px;
  color: #D4C7AC;
  font-weight: 700;
  margin: 0;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(158, 143, 112, 0.2);
  border: 1px solid rgba(158, 143, 112, 0.4);
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  color: #EFECE6;
  margin-top: 8px;
  letter-spacing: 0.03em;
}

.status-pill i {
  color: #34d399;
}

.receipt-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.amount-box {
  background: var(--bg-app, #F8F7F4);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 14px;
  padding: 12px;
  text-align: center;
}

.currency-label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  margin-right: 4px;
}

.amount-figure {
  font-size: 24px;
  font-weight: 900;
  color: var(--text-main, #1C2331);
  letter-spacing: -0.01em;
}

.meta-card {
  background: var(--bg-app, #F8F7F4);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  color: #64748b;
}

.meta-row strong {
  color: var(--text-main, #1C2331);
}

.truncate-text {
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qr-container {
  background: var(--bg-app, #F8F7F4);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 14px;
  padding: 14px;
  text-align: center;
}

.qr-hint {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.qr-hint i {
  color: var(--accent, #9E8F70);
}

.qr-canvas {
  display: inline-block;
  padding: 8px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid var(--border, #E8E6E1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.qr-img {
  width: 128px;
  height: 128px;
  object-fit: contain;
  display: block;
}

.qr-ref-code {
  display: block;
  font-size: 10px;
  font-family: monospace;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  margin-top: 6px;
}

.action-buttons-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.print-primary-btn {
  width: 100%;
  padding: 13px;
  background: var(--accent, #9E8F70);
  color: #1C2331;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(158, 143, 112, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.15s ease;
}

.print-primary-btn:hover {
  background: #8B7C5E;
  color: #ffffff;
}

.sub-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.email-btn {
  padding: 10px;
  background: #ffffff;
  color: var(--text-main, #1C2331);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.email-btn i {
  color: var(--accent, #9E8F70);
}

.email-btn:hover {
  background: var(--bg-app, #F8F7F4);
}

.next-btn {
  padding: 10px;
  background: #1C2331;
  color: #ffffff;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.next-btn i {
  color: var(--accent, #9E8F70);
}

.next-btn:hover {
  background: #121722;
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

.email-modal-card {
  background: #ffffff;
  border-radius: 18px;
  max-width: 380px;
  width: 100%;
  padding: 16px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border, #E8E6E1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border, #E8E6E1);
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-icon-pill {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #1C2331;
  color: var(--accent, #9E8F70);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.modal-heading {
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-main, #1C2331);
  margin: 0;
}

.modal-close {
  color: #94a3b8;
  font-size: 16px;
  background: transparent;
}

.modal-instructions {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  margin: 0;
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-field-label {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-main, #1C2331);
}

.modal-text-input {
  width: 100%;
  padding: 9px 12px;
  font-size: 12px;
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 10px;
  outline: none;
}

.modal-text-input:focus {
  border-color: var(--accent, #9E8F70);
}

.alert-box {
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.alert-success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.alert-error {
  background: #fff1f2;
  color: #991b1b;
  border: 1px solid #fecdd3;
}

.modal-footer-btns {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.btn-cancel {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  background: transparent;
}

.btn-send-receipt {
  padding: 8px 14px;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  background: var(--accent, #9E8F70);
  color: #1C2331;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-send-receipt:disabled {
  opacity: 0.5;
}

.thermal-receipt-print-area {
  display: none;
}
</style>
