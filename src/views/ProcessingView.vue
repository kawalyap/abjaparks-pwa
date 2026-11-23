<template>
  <div class="processing-page">
    <div class="status-card">
      <!-- Animated Status Icon -->
      <div class="pulse-container" :class="{ success: isSuccess, failed: isFailed }">
        <div v-if="!isSuccess && !isFailed" class="pulse-ring"></div>
        <div class="pulse-core">
          <i v-if="isSuccess" class="fa-solid fa-circle-check text-success"></i>
          <i v-else-if="isFailed" class="fa-solid fa-circle-xmark text-danger"></i>
          <i v-else class="fa-solid fa-mobile-screen-button text-primary fa-bounce"></i>
        </div>
      </div>

      <!-- Header & Instructions -->
      <h2 class="status-heading">{{ statusTitle }}</h2>
      <p class="status-subtext">{{ statusMessage }}</p>

      <!-- Amount Details -->
      <div class="ticket-summary-box">
        <div class="summary-line">
          <span>Ticket:</span>
          <strong>{{ posStore.activeTransaction?.category_name || 'Entrance Ticket' }} (x{{ posStore.activeTransaction?.quantity || 1 }})</strong>
        </div>
        <div class="summary-line">
          <span>Total Amount:</span>
          <strong class="highlight-amount">UGX {{ (posStore.activeTransaction?.total_amount || 0).toLocaleString() }}</strong>
        </div>
        <div class="summary-line">
          <span>Customer Phone:</span>
          <strong>{{ maskedPhone }}</strong>
        </div>
        <div v-if="posStore.activeTransaction?.receipt_number" class="summary-line">
          <span>Receipt No:</span>
          <code>{{ posStore.activeTransaction?.receipt_number }}</code>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="button-row">
        <button v-if="isSuccess" class="btn-primary" @click="goToReceipt">
          <i class="fa-solid fa-receipt"></i>
          View & Print Receipt
        </button>

        <button v-else-if="isFailed" class="btn-retry" @click="handleRetry">
          <i class="fa-solid fa-rotate-right"></i>
          Try Again
        </button>

        <button class="btn-secondary" @click="handleCancel">
          {{ isSuccess ? 'New Ticket' : 'Cancel' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePosStore } from '@/stores/usePosStore'

const router = useRouter()
const posStore = usePosStore()

const isSuccess = computed(() => posStore.activeStatus?.is_paid || posStore.activeStatus?.status === 'paid')
const isFailed = computed(() => !isSuccess.value && (posStore.activeStatus?.status === 'failed' || !!posStore.pollError))

const maskedPhone = computed(() => {
  const p = posStore.activeTransaction?.momo_number || ''
  if (p.length < 7) return p
  return p.slice(0, 4) + '****' + p.slice(-3)
})

const statusTitle = computed(() => {
  if (isSuccess.value) return 'Payment Successful!'
  if (isFailed.value) return 'Payment Failed'
  return 'Waiting for Customer PIN...'
})

const statusMessage = computed(() => {
  if (isSuccess.value) return 'Payment was approved and settled successfully.'
  if (isFailed.value) return posStore.pollError || posStore.activeStatus?.message || 'Payment prompt was canceled or timed out.'
  return `USSD prompt sent to ${maskedPhone.value}. Please instruct the customer to approve on their handset.`
})

// Auto navigate to receipt upon successful settlement
watch(isSuccess, (val) => {
  if (val) {
    setTimeout(() => {
      router.push({ name: 'pos.receipt' })
    }, 1200)
  }
})

onMounted(() => {
  if (!posStore.activeTransaction) {
    router.replace({ name: 'pos.collect' })
  }
})

function goToReceipt() {
  router.push({ name: 'pos.receipt' })
}

function handleRetry() {
  router.push({ name: 'pos.collect' })
}

function handleCancel() {
  posStore.resetForm()
  router.push({ name: 'pos.collect' })
}
</script>

<style scoped>
.processing-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.status-card {
  background: var(--card-bg);
  border-radius: 20px;
  max-width: 480px;
  width: 100%;
  padding: 32px 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border);
  text-align: center;
}

/* Pulsing Wave Animation */
.pulse-container {
  width: 90px;
  height: 90px;
  margin: 0 auto 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-core {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  z-index: 2;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid var(--primary);
  animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.85);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

.text-primary { color: var(--primary); }
.text-success { color: var(--success); }
.text-danger { color: var(--danger); }

.status-heading {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 8px;
  color: var(--text-main);
}

.status-subtext {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-bottom: 24px;
}

.ticket-summary-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
}

.summary-line:last-child {
  border-bottom: none;
}

.summary-line span {
  color: var(--text-muted);
}

.highlight-amount {
  color: var(--primary);
  font-size: 16px;
  font-weight: 800;
}

.button-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-primary {
  background: var(--accent);
  color: #000000;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-retry {
  background: var(--primary);
  color: #ffffff;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-secondary {
  background: #f1f5f9;
  color: var(--text-muted);
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
}
</style>
