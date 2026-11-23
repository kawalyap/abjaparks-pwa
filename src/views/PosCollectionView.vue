<template>
  <div class="pos-container">
    <div class="pos-grid">
      <!-- Left Column: Ticket Category Selection -->
      <section class="section-card">
        <div class="section-title">
          <i class="fa-solid fa-ticket"></i>
          <span>Select Ticket Category</span>
        </div>

        <div class="categories-grid">
          <button
            v-for="cat in posStore.categories"
            :key="cat.id"
            class="category-btn"
            :class="{ active: posStore.selectedCategory?.id === cat.id }"
            @click="posStore.selectCategory(cat)"
          >
            <div class="cat-icon">
              <i :class="['fa-solid', cat.icon || 'fa-ticket']"></i>
            </div>
            <div class="cat-info">
              <div class="cat-name">{{ cat.name }}</div>
              <div class="cat-amount">UGX {{ cat.amount.toLocaleString() }}</div>
            </div>
            <div class="cat-check" v-if="posStore.selectedCategory?.id === cat.id">
              <i class="fa-solid fa-circle-check"></i>
            </div>
          </button>
        </div>

        <!-- Quantity Stepper -->
        <div class="quantity-row">
          <label class="field-label">Quantity (Tickets):</label>
          <div class="quantity-controls">
            <button class="qty-btn" @click="posStore.setQuantity(posStore.quantity - 1)" :disabled="posStore.quantity <= 1">
              <i class="fa-solid fa-minus"></i>
            </button>
            <span class="qty-value">{{ posStore.quantity }}</span>
            <button class="qty-btn" @click="posStore.setQuantity(posStore.quantity + 1)" :disabled="posStore.quantity >= 50">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
          <div class="qty-quick-chips">
            <button v-for="q in [1, 2, 3, 5, 10]" :key="q" class="chip-btn" :class="{ active: posStore.quantity === q }" @click="posStore.setQuantity(q)">
              {{ q }}x
            </button>
          </div>
        </div>
      </section>

      <!-- Right Column: Customer Phone & Payment Prompt -->
      <section class="section-card payment-column">
        <div class="section-title">
          <i class="fa-solid fa-mobile-screen-button"></i>
          <span>Customer & Payment Details</span>
        </div>

        <!-- Order Summary Banner -->
        <div class="total-banner">
          <div class="total-label">Total to Collect:</div>
          <div class="total-figure">
            UGX {{ posStore.totalAmount.toLocaleString() }}
          </div>
          <div class="total-sub">
            {{ posStore.selectedCategory?.name || 'Ticket' }} × {{ posStore.quantity }}
          </div>
        </div>

        <!-- Phone Number Input with Network Indicator -->
        <div class="form-group">
          <label class="field-label">
            <span>Customer Mobile Money Number</span>
            <span v-if="carrierBadge" :class="['carrier-badge', carrierBadge.toLowerCase()]">
              {{ carrierBadge }}
            </span>
          </label>
          <div class="input-with-icon">
            <i class="fa-solid fa-phone phone-icon"></i>
            <input
              type="tel"
              v-model="posStore.phoneNumber"
              placeholder="e.g. 0779 123 456"
              class="pos-input text-lg font-bold"
              maxlength="13"
              @input="onPhoneInput"
            />
          </div>
          <p class="input-hint">Enter MTN or Airtel phone number to push PIN prompt</p>
        </div>

        <!-- Optional Customer Details -->
        <div class="optional-details">
          <div class="form-group">
            <label class="field-label-sm">Customer Name (Optional)</label>
            <input
              type="text"
              v-model="posStore.customerName"
              placeholder="e.g. Michael O."
              class="pos-input-sm"
            />
          </div>

          <div class="form-group">
            <label class="field-label-sm">Customer Email (Optional for E-Receipt)</label>
            <input
              type="email"
              v-model="posStore.customerEmail"
              placeholder="customer@example.com"
              class="pos-input-sm"
            />
          </div>
        </div>

        <!-- Fast Numpad for Touch POS Devices (Sunmi / Handheld) -->
        <div class="numpad-grid">
          <button v-for="digit in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '07', '0', '⌫']" :key="digit" class="numpad-key" @click="handleNumpad(digit)">
            {{ digit }}
          </button>
        </div>

        <!-- Action Button -->
        <div class="action-footer">
          <button
            class="collect-btn"
            :disabled="!posStore.isFormValid || posStore.isInitiating"
            @click="handleCollectPayment"
          >
            <span v-if="posStore.isInitiating">
              <i class="fa-solid fa-spinner fa-spin"></i>
              Sending Prompt...
            </span>
            <span v-else>
              <i class="fa-solid fa-bolt"></i>
              Collect UGX {{ posStore.totalAmount.toLocaleString() }}
            </span>
          </button>

          <button v-if="posStore.phoneNumber" class="clear-btn" @click="posStore.resetForm">
            Clear Form
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePosStore } from '@/stores/usePosStore'

const router = useRouter()
const posStore = usePosStore()

// Carrier Detection
const carrierBadge = computed(() => {
  const clean = posStore.phoneNumber.replace(/\s+/g, '')
  if (/^(0|256)?(77|78|76)/.test(clean)) return 'MTN MoMo'
  if (/^(0|256)?(70|75|74)/.test(clean)) return 'Airtel Money'
  return null
})

function onPhoneInput(e: Event) {
  const input = e.target as HTMLInputElement
  posStore.phoneNumber = input.value
}

function handleNumpad(val: string) {
  if (val === '⌫') {
    posStore.phoneNumber = posStore.phoneNumber.slice(0, -1)
  } else if (val === '07') {
    if (!posStore.phoneNumber) posStore.phoneNumber = '07'
    else posStore.phoneNumber += '07'
  } else {
    if (posStore.phoneNumber.length < 13) {
      posStore.phoneNumber += val
    }
  }
}

async function handleCollectPayment() {
  try {
    await posStore.initiateCollection()
    router.push({ name: 'pos.processing' })
  } catch (err: any) {
    alert(err.message || 'Payment initiation failed')
  }
}
</script>

<style scoped>
.pos-container {
  padding: 18px 24px;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

.pos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.section-card {
  background: var(--card-bg);
  border-radius: var(--ax-radius-lg);
  padding: 20px;
  box-shadow: var(--ax-shadow-med);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

.section-title i {
  color: var(--primary);
}

/* Category Grid */
.categories-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.category-btn {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--ax-radius-md);
  box-shadow: var(--ax-shadow-low);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  text-align: left;
  transition: all var(--duration-fast, 125ms) ease;
}

.category-btn:hover {
  border-color: var(--border-strong);
  box-shadow: var(--ax-shadow-med);
  transform: translateY(-1px);
}

.category-btn.active {
  border-color: var(--primary);
  background: var(--primary-light);
  box-shadow: var(--ax-shadow-focus);
}

.cat-icon {
  font-size: 24px;
  color: var(--primary);
  margin-bottom: 10px;
}

.cat-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.2;
}

.cat-amount {
  font-size: 14px;
  font-weight: 800;
  color: var(--primary);
  margin-top: 4px;
}

.cat-check {
  position: absolute;
  top: 10px;
  right: 10px;
  color: var(--primary);
  font-size: 18px;
}

/* Quantity Row */
.quantity-row {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.field-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 8px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.qty-btn {
  width: 44px;
  height: 44px;
  border-radius: var(--ax-radius-sm);
  background: var(--bg-app);
  border: 1px solid var(--border);
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--ax-shadow-low);
  transition: all var(--duration-fast, 125ms) ease;
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-value {
  font-size: 22px;
  font-weight: 800;
  min-width: 40px;
  text-align: center;
}

.qty-quick-chips {
  display: flex;
  gap: 8px;
}

.chip-btn {
  flex: 1;
  padding: 6px 0;
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: var(--ax-radius-full);
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  transition: all var(--duration-fast, 125ms) ease;
}

.chip-btn.active {
  background: var(--primary);
  color: #ffffff;
  border-color: var(--primary);
  box-shadow: var(--ax-shadow-low);
}

/* Payment Column */
.total-banner {
  background: linear-gradient(135deg, #004F71 0%, #002e42 100%);
  color: #ffffff;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 18px;
  text-align: center;
}

.total-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
  font-weight: 600;
}

.total-figure {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 2px 0;
}

.total-sub {
  font-size: 13px;
  opacity: 0.85;
}

.form-group {
  margin-bottom: 14px;
}

.carrier-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
}

.carrier-badge.mtn {
  background: #ffcc00;
  color: #000000;
}

.carrier-badge.airtel {
  background: #ef4444;
  color: #ffffff;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.phone-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  font-size: 16px;
}

.pos-input {
  width: 100%;
  padding: 14px 14px 14px 42px;
  border: 2px solid #cbd5e1;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 700;
  outline: none;
  transition: border-color 0.15s ease;
}

.pos-input:focus {
  border-color: var(--primary);
}

.input-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

.optional-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.field-label-sm {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  display: block;
  margin-bottom: 4px;
}

.pos-input-sm {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 12px;
  outline: none;
}

.pos-input-sm:focus {
  border-color: var(--primary);
}

/* Numpad */
.numpad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 10px;
  margin-bottom: 16px;
}

.numpad-key {
  padding: 12px 0;
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: var(--ax-radius-sm);
  box-shadow: var(--ax-shadow-low);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  transition: all var(--duration-fast, 125ms) ease;
}

.numpad-key:active {
  background: #cbd5e1;
  transform: scale(0.97);
}

/* Action Footer */
.action-footer {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.collect-btn {
  flex: 1;
  background: var(--accent);
  color: #000000;
  padding: 16px 20px;
  border-radius: var(--ax-radius-md);
  box-shadow: var(--ax-shadow-med);
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all var(--duration-fast, 125ms) ease;
}

.collect-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.collect-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.clear-btn {
  padding: 14px 16px;
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: var(--ax-radius-md);
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  transition: all var(--duration-fast, 125ms) ease;
}

@media (max-width: 860px) {
  .pos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
