<template>
  <div class="pos-container">
    <div class="pos-layout-wrapper">
      <!-- Left Column / Top Section: Ticket Category Selection -->
      <section class="section-card category-section">
        <div class="section-header-compact">
          <div class="section-title">
            <i class="fa-solid fa-ticket"></i>
            <span>Admission Category</span>
          </div>
          <!-- Compact quantity stepper for mobile header row -->
          <div class="compact-qty-stepper sm:hidden">
            <button class="qty-btn-mini" @click="posStore.setQuantity(posStore.quantity - 1)" :disabled="posStore.quantity <= 1">
              <i class="fa-solid fa-minus"></i>
            </button>
            <span class="qty-value-mini">{{ posStore.quantity }}</span>
            <button class="qty-btn-mini" @click="posStore.setQuantity(posStore.quantity + 1)" :disabled="posStore.quantity >= 50">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>

        <!-- 4 Fast Admission Categories -->
        <div class="categories-grid">
          <button
            v-for="cat in posStore.categories"
            :key="cat.id"
            class="category-btn"
            :class="{ active: posStore.selectedCategory?.id === cat.id }"
            @click="posStore.selectCategory(cat)"
          >
            <div class="cat-icon-wrap">
              <i :class="['fa-solid', cat.icon ? (cat.icon.startsWith('fa-') ? cat.icon : 'fa-' + cat.icon) : 'fa-ticket']"></i>
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

        <!-- Quantity Stepper & Chips (Visible on desktop / tablets, and quick chips on mobile) -->
        <div class="quantity-row">
          <div class="qty-chips-bar">
            <button
              v-for="q in [1, 2, 3, 5, 10]"
              :key="q"
              class="chip-btn"
              :class="{ active: posStore.quantity === q }"
              @click="posStore.setQuantity(q)"
            >
              {{ q }}x
            </button>
            <!-- Desktop stepper controls -->
            <div class="hidden sm:flex items-center gap-2 ml-auto">
              <button class="qty-btn-mini" @click="posStore.setQuantity(posStore.quantity - 1)" :disabled="posStore.quantity <= 1">
                <i class="fa-solid fa-minus"></i>
              </button>
              <span class="qty-value-mini">{{ posStore.quantity }}</span>
              <button class="qty-btn-mini" @click="posStore.setQuantity(posStore.quantity + 1)" :disabled="posStore.quantity >= 50">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Right Column / Bottom Section: Customer Phone, Numpad & Collection Action -->
      <section class="section-card payment-section">
        <!-- Order Total Banner (High contrast) -->
        <div class="total-banner">
          <div class="total-left">
            <span class="total-label">Total Amount</span>
            <div class="total-sub">
              {{ posStore.selectedCategory?.name || 'Ticket' }} × {{ posStore.quantity }}
            </div>
          </div>
          <div class="total-figure">
            UGX {{ posStore.totalAmount.toLocaleString() }}
          </div>
        </div>

        <!-- Mobile Money Phone Number Input -->
        <div class="phone-input-group">
          <div class="input-header-row">
            <label class="field-label-compact">Customer Phone (MoMo)</label>
            <span v-if="carrierBadge" :class="['carrier-badge', carrierBadge.toLowerCase()]">
              {{ carrierBadge }}
            </span>
          </div>

          <div class="input-with-icon">
            <i class="fa-solid fa-phone phone-icon"></i>
            <input
              type="tel"
              v-model="posStore.phoneNumber"
              placeholder="0779 123 456"
              class="pos-input"
              maxlength="13"
              readonly
            />
            <button
              v-if="posStore.phoneNumber"
              class="clear-phone-btn"
              @click="posStore.phoneNumber = ''"
              title="Clear phone number"
            >
              <i class="fa-solid fa-circle-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Optional Collapsible Customer Details (Name / Email for E-Receipt) -->
        <div class="optional-accordion">
          <button
            type="button"
            class="accordion-toggle-btn"
            @click="showOptionalDetails = !showOptionalDetails"
          >
            <span>
              <i class="fa-solid fa-envelope-open-text text-slate-400"></i>
              {{ showOptionalDetails ? 'Hide Customer Details' : '+ Add Name / Email for E-Receipt' }}
            </span>
            <i class="fa-solid fa-chevron-down toggle-arrow" :class="{ 'rotate-180': showOptionalDetails }"></i>
          </button>

          <div v-show="showOptionalDetails" class="accordion-content animate-fade-in">
            <div class="grid grid-cols-2 gap-2 pt-2">
              <div>
                <label class="field-label-sm">Customer Name</label>
                <input
                  type="text"
                  v-model="posStore.customerName"
                  placeholder="e.g. Michael O."
                  class="pos-input-sm"
                />
              </div>
              <div>
                <label class="field-label-sm">Customer Email</label>
                <input
                  type="email"
                  v-model="posStore.customerEmail"
                  placeholder="name@mail.com"
                  class="pos-input-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Ergonomic Mobile Touch Numpad (Big thumb-friendly buttons) -->
        <div class="numpad-container">
          <div class="numpad-grid">
            <button
              v-for="digit in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '07', '0', '⌫']"
              :key="digit"
              type="button"
              class="numpad-key"
              :class="{ 'key-backspace': digit === '⌫', 'key-prefix': digit === '07' }"
              @click="handleNumpad(digit)"
            >
              {{ digit }}
            </button>
          </div>
        </div>

        <!-- Big Primary Action Button -->
        <div class="action-footer">
          <button
            class="collect-btn"
            :disabled="!posStore.isFormValid || posStore.isInitiating"
            @click="handleCollectPayment"
          >
            <span v-if="posStore.isInitiating" class="btn-inner">
              <i class="fa-solid fa-spinner fa-spin"></i>
              Pushing USSD Prompt...
            </span>
            <span v-else class="btn-inner">
              <i class="fa-solid fa-bolt"></i>
              <span>Collect UGX {{ posStore.totalAmount.toLocaleString() }}</span>
            </span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePosStore } from '@/stores/usePosStore'

const router = useRouter()
const posStore = usePosStore()

const showOptionalDetails = ref(false)

// Carrier Detection
const carrierBadge = computed(() => {
  const clean = posStore.phoneNumber.replace(/\s+/g, '')
  if (/^(0|256)?(77|78|76)/.test(clean)) return 'MTN MoMo'
  if (/^(0|256)?(70|75|74)/.test(clean)) return 'Airtel Money'
  return null
})

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
    alert(err.message || 'Payment collection failed')
  }
}

onMounted(() => {
  if (posStore.categories.length === 0) {
    posStore.loadCategories()
  }
})
</script>

<style scoped>
.pos-container {
  padding: 10px 14px;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

.pos-layout-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.section-card {
  background: var(--card-bg);
  border-radius: var(--ax-radius-lg);
  padding: 16px;
  box-shadow: var(--ax-shadow-low);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.section-header-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-main);
}

.section-title i {
  color: var(--primary);
  font-size: 14px;
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.category-btn {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--ax-radius-md);
  box-shadow: var(--ax-shadow-low);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  text-align: left;
  transition: all var(--duration-fast, 125ms) ease;
  min-height: 58px;
}

.category-btn:hover {
  border-color: var(--border-strong);
  box-shadow: var(--ax-shadow-med);
}

.category-btn.active {
  border-color: var(--primary);
  background: var(--primary-light);
  box-shadow: var(--ax-shadow-focus);
}

.cat-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: var(--ax-radius-xs);
  background: var(--bg-app);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--primary);
  flex-shrink: 0;
}

.category-btn.active .cat-icon-wrap {
  background: var(--primary);
  color: #ffffff;
}

.cat-info {
  min-width: 0;
  flex: 1;
}

.cat-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-amount {
  font-size: 12px;
  font-weight: 800;
  color: var(--primary);
  margin-top: 2px;
}

.cat-check {
  color: var(--primary);
  font-size: 16px;
  flex-shrink: 0;
}

/* Quantity Row */
.quantity-row {
  margin-top: auto;
  padding-top: 8px;
}

.qty-chips-bar {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chip-btn {
  flex: 1;
  padding: 6px 0;
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: var(--ax-radius-full);
  font-size: 11px;
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

.compact-qty-stepper,
.qty-stepper-desktop {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qty-btn-mini {
  width: 28px;
  height: 28px;
  border-radius: var(--ax-radius-xs);
  background: var(--bg-app);
  border: 1px solid var(--border);
  font-size: 12px;
  font-weight: 700;
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn-mini:disabled {
  opacity: 0.3;
}

.qty-value-mini {
  font-size: 14px;
  font-weight: 800;
  min-width: 20px;
  text-align: center;
}

/* Order Total Banner */
.total-banner {
  background: linear-gradient(135deg, #004F71 0%, #002e42 100%);
  color: #ffffff;
  border-radius: var(--ax-radius-md);
  box-shadow: var(--ax-shadow-low);
  padding: 10px 14px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.total-left {
  display: flex;
  flex-direction: column;
}

.total-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
  font-weight: 700;
}

.total-sub {
  font-size: 11px;
  opacity: 0.9;
  font-weight: 600;
}

.total-figure {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--accent);
}

/* Phone Input */
.phone-input-group {
  margin-bottom: 8px;
}

.input-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.field-label-compact {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.carrier-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: var(--ax-radius-full);
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
  left: 12px;
  color: var(--primary);
  font-size: 14px;
}

.pos-input {
  width: 100%;
  padding: 10px 36px 10px 34px;
  border: 1px solid var(--border-strong);
  border-radius: var(--ax-radius-sm);
  background: var(--card-bg);
  color: var(--text-main);
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 1px;
  outline: none;
}

.clear-phone-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 16px;
  padding: 4px;
}

/* Optional Accordion */
.optional-accordion {
  margin-bottom: 8px;
}

.accordion-toggle-btn {
  width: 100%;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px;
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
}

.toggle-arrow {
  font-size: 10px;
  transition: transform var(--duration-fast, 125ms) ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

.field-label-sm {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  display: block;
  margin-bottom: 2px;
}

.pos-input-sm {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: var(--ax-radius-xs);
  background: var(--card-bg);
  color: var(--text-main);
  font-size: 11px;
  outline: none;
}

/* Numpad */
.numpad-container {
  margin-bottom: 10px;
}

.numpad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.numpad-key {
  height: 48px;
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: var(--ax-radius-sm);
  box-shadow: var(--ax-shadow-low);
  font-size: 18px;
  font-weight: 800;
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast, 125ms) ease;
  user-select: none;
  -webkit-user-select: none;
}

.numpad-key:active {
  background: #cbd5e1;
  transform: scale(0.96);
}

.key-prefix {
  font-size: 15px;
  color: var(--primary);
}

.key-backspace {
  color: #ef4444;
  font-size: 16px;
}

/* Action Button */
.action-footer {
  margin-top: auto;
}

.collect-btn {
  width: 100%;
  height: 50px;
  background: var(--accent);
  color: #000000;
  border-radius: var(--ax-radius-md);
  box-shadow: var(--ax-shadow-med);
  font-size: 15px;
  font-weight: 800;
  transition: all var(--duration-fast, 125ms) ease;
}

.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.collect-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.collect-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.collect-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

/* Mobile Handheld Responsive Optimization */
@media (max-width: 768px) {
  .pos-container {
    padding: 6px 8px;
  }
  .pos-layout-wrapper {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .section-card {
    padding: 10px;
    border-radius: var(--ax-radius-md);
  }
  .categories-grid {
    gap: 6px;
    margin-bottom: 8px;
  }
  .category-btn {
    padding: 8px 10px;
    min-height: 50px;
    gap: 8px;
  }
  .cat-icon-wrap {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
  .cat-name {
    font-size: 12px;
  }
  .cat-amount {
    font-size: 11px;
  }
  .numpad-key {
    height: 46px;
    font-size: 17px;
  }
  .collect-btn {
    height: 48px;
    font-size: 14px;
  }
}
</style>
