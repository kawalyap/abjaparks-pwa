<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'
import { api } from '@/services/api'

const route = useRoute()
const receiptNumber = (route.params.receiptNumber as string) || ''

const receipt = ref<any | null>(null)
const qrDataUrl = ref<string>('')
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

// Email receipt
const emailInput = ref('')
const isSendingEmail = ref(false)
const emailFeedback = ref<string | null>(null)

async function fetchReceipt() {
  if (!receiptNumber) {
    errorMessage.value = 'Invalid receipt number'
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = null
  try {
    const res = await api.getPublicReceipt(receiptNumber)
    if (res.success && res.receipt) {
      receipt.value = res.receipt
      emailInput.value = res.receipt.customer_email || ''

      // Generate verification QR code with Abja Dark Slate
      const currentUrl = window.location.href
      qrDataUrl.value = await QRCode.toDataURL(currentUrl, {
        margin: 1,
        width: 180,
        color: { dark: '#1C2331', light: '#ffffff' },
      })
    } else {
      errorMessage.value = 'Receipt not found or expired'
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Unable to load receipt details'
  } finally {
    isLoading.value = false
  }
}

async function sendEmailReceipt() {
  if (!emailInput.value || !emailInput.value.includes('@')) {
    emailFeedback.value = 'Please enter a valid email address'
    return
  }
  isSendingEmail.value = true
  emailFeedback.value = null
  try {
    const res = await api.emailReceipt(receiptNumber, emailInput.value.trim())
    emailFeedback.value = res.message || 'Receipt sent to your inbox!'
  } catch (err: any) {
    emailFeedback.value = err.message || 'Failed to send email'
  } finally {
    isSendingEmail.value = false
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount)
}

onMounted(() => {
  fetchReceipt()
})
</script>

<template>
  <div class="public-receipt-wrapper">
    <!-- Loading -->
    <div v-if="isLoading" class="state-box">
      <i class="fa-solid fa-circle-notch fa-spin state-icon"></i>
      <p class="state-text">Verifying Official Entry Receipt...</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage" class="error-box">
      <div class="error-icon-circle">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h2 class="error-title">Receipt Not Found</h2>
      <p class="error-desc">{{ errorMessage }}</p>
    </div>

    <!-- Official Verified Receipt Card -->
    <div v-else-if="receipt" class="verified-card">
      <!-- Verified Top Header -->
      <div class="verified-header">
        <div class="verified-logo-wrap">
          <img src="/abja-logo.png" alt="Abja Parks" class="verified-logo" />
        </div>
        <p class="verified-sub">Official Admission E-Receipt</p>

        <!-- Verified badge -->
        <div class="verified-pill">
          <i class="fa-solid fa-circle-check"></i>
          <span>Verified Official Payment</span>
        </div>
      </div>

      <!-- Content -->
      <div class="verified-body">
        <!-- Scannable Gate Verification QR -->
        <div class="gate-qr-box">
          <div class="gate-qr-title">Gate Scan & Verification</div>
          <div v-if="qrDataUrl" class="gate-qr-frame">
            <img :src="qrDataUrl" alt="Verification QR" class="gate-qr-img" />
          </div>
          <div class="gate-ticket-code">
            Ticket: {{ receipt.ticket_code }}
          </div>
          <div class="gate-instruction">Present this QR code or receipt number at the turnstile</div>
        </div>

        <!-- Receipt Metadata -->
        <div class="receipt-meta-box">
          <div class="meta-item">
            <span>Receipt No.</span>
            <span class="meta-val font-mono">#{{ receipt.receipt_number }}</span>
          </div>
          <div class="meta-item">
            <span>Category</span>
            <span class="meta-val">{{ receipt.category_name }}</span>
          </div>
          <div class="meta-item">
            <span>Admissions / Quantity</span>
            <span class="meta-val">{{ receipt.quantity }} Person(s)</span>
          </div>
          <div class="meta-item">
            <span>MoMo Payer</span>
            <span class="meta-val font-mono">{{ receipt.momo_number }}</span>
          </div>
          <div v-if="receipt.customer_name" class="meta-item">
            <span>Customer</span>
            <span class="meta-val">{{ receipt.customer_name }}</span>
          </div>
          <div class="meta-item">
            <span>Issued Date</span>
            <span class="meta-val">{{ receipt.issued_at }}</span>
          </div>

          <div class="meta-total-row">
            <span>Total Paid</span>
            <span class="meta-total-val">{{ formatCurrency(receipt.total_amount) }}</span>
          </div>
        </div>

        <!-- Email Copy Option -->
        <div class="email-section">
          <label class="email-section-label">
            Send a copy to your email
          </label>
          <div class="email-row">
            <input
              v-model="emailInput"
              type="email"
              placeholder="your-email@example.com"
              class="email-text-box"
            />
            <button
              @click="sendEmailReceipt"
              :disabled="isSendingEmail"
              class="email-submit-btn"
            >
              <i v-if="isSendingEmail" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-envelope"></i>
              <span>Send</span>
            </button>
          </div>
          <p v-if="emailFeedback" class="email-feedback-msg">
            {{ emailFeedback }}
          </p>
        </div>

        <!-- Footer / Print -->
        <div class="print-footer">
          <button
            onclick="window.print()"
            class="print-pdf-btn"
          >
            <i class="fa-solid fa-print"></i>
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.public-receipt-wrapper {
  max-width: 440px;
  margin: 0 auto;
  padding: 16px;
}

.state-box {
  padding: 80px 20px;
  text-align: center;
  color: #94a3b8;
}

.state-icon {
  font-size: 28px;
  color: var(--accent, #9E8F70);
  margin-bottom: 12px;
}

.state-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main, #1C2331);
}

.error-box {
  background: #ffffff;
  border: 1px solid #fecdd3;
  border-radius: 20px;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}

.error-icon-circle {
  width: 48px;
  height: 48px;
  background: #fff1f2;
  color: #e11d48;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin: 0 auto 12px;
}

.error-title {
  font-size: 15px;
  font-weight: 900;
  color: var(--text-main, #1C2331);
  margin: 0;
}

.error-desc {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.verified-card {
  background: #ffffff;
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 24px;
  box-shadow: 0 12px 30px rgba(28, 35, 49, 0.1);
  overflow: hidden;
}

.verified-header {
  background: linear-gradient(180deg, #1C2331 0%, #171E2B 100%);
  color: #ffffff;
  padding: 20px;
  text-align: center;
  border-bottom: 2px solid var(--accent, #9E8F70);
}

.verified-logo-wrap {
  display: inline-block;
  background: #ffffff;
  padding: 5px 12px;
  border-radius: 10px;
  margin-bottom: 8px;
}

.verified-logo {
  height: 26px;
  width: auto;
  object-fit: contain;
  display: block;
}

.verified-sub {
  font-size: 11px;
  color: #D4C7AC;
  font-weight: 700;
  margin: 0;
}

.verified-pill {
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

.verified-pill i {
  color: #34d399;
}

.verified-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.gate-qr-box {
  background: var(--bg-app, #F8F7F4);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 16px;
  padding: 16px;
  text-align: center;
}

.gate-qr-title {
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.gate-qr-frame {
  display: inline-block;
  padding: 8px;
  background: #ffffff;
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.gate-qr-img {
  width: 140px;
  height: 140px;
  object-fit: contain;
  display: block;
}

.gate-ticket-code {
  font-size: 12px;
  font-family: monospace;
  font-weight: 900;
  color: var(--text-main, #1C2331);
  margin-top: 8px;
}

.gate-instruction {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 600;
  margin-top: 2px;
}

.receipt-meta-box {
  background: var(--bg-app, #F8F7F4);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  color: #64748b;
}

.meta-val {
  font-weight: 800;
  color: var(--text-main, #1C2331);
}

.meta-total-row {
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

.meta-total-val {
  font-size: 16px;
  font-weight: 900;
  color: var(--text-main, #1C2331);
}

.email-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.email-section-label {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-main, #1C2331);
}

.email-row {
  display: flex;
  gap: 6px;
}

.email-text-box {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 10px;
  outline: none;
}

.email-text-box:focus {
  border-color: var(--accent, #9E8F70);
}

.email-submit-btn {
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

.email-submit-btn:hover {
  background: #8B7C5E;
  color: #ffffff;
}

.email-feedback-msg {
  font-size: 10px;
  font-weight: 700;
  color: #059669;
}

.print-footer {
  padding-top: 4px;
}

.print-pdf-btn {
  width: 100%;
  padding: 10px;
  background: var(--bg-app, #F8F7F4);
  color: var(--text-main, #1C2331);
  border: 1px solid var(--border, #E8E6E1);
  border-radius: 12px;
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

.print-pdf-btn i {
  color: var(--accent, #9E8F70);
}

.print-pdf-btn:hover {
  background: #e2e8f0;
}
</style>
