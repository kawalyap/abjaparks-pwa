<template>
  <div class="pos-container">
    <div class="pos-layout-wrapper">
      <!-- Left Column: Admission Category Selection -->
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

        <!-- Quantity Stepper & Quick Multipliers -->
        <div class="quantity-row">
          <div class="qty-chips-bar">
            <span class="qty-label hidden sm:inline text-xs font-bold text-slate-500 mr-1">Qty:</span>
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

      <!-- Right Column: Customer Phone, Details & Payment Action -->
      <section class="section-card payment-section">
        <!-- Order Total Banner (Abja Brand Dark Slate & Sandstone Gold) -->
        <div class="total-banner">
          <div class="total-left">
            <span class="total-label">Total to Collect</span>
            <div class="total-sub">
              {{ posStore.selectedCategory?.name || 'Ticket' }} × {{ posStore.quantity }}
            </div>
          </div>
          <div class="total-figure">
            UGX {{ posStore.totalAmount.toLocaleString() }}
          </div>
        </div>

        <!-- Mobile Money Phone Number Input (Triggers Native Phone Dialpad Keyboard) -->
        <div class="phone-input-group">
          <div class="input-header-row">
            <label class="field-label-compact" for="momo-phone-input">
              Customer Mobile Money Number
            </label>
            <span v-if="carrierBadge" :class="['carrier-badge', carrierBadge.toLowerCase().includes('mtn') ? 'mtn' : 'airtel']">
              {{ carrierBadge }}
            </span>
          </div>

          <div class="input-with-icon">
            <i class="fa-solid fa-phone phone-icon"></i>
            <input
              id="momo-phone-input"
              ref="phoneInputRef"
              type="tel"
              inputmode="numeric"
              pattern="[0-9]*"
              autocomplete="tel"
              v-model="posStore.phoneNumber"
              placeholder="07XX XXX XXX"
              class="pos-input"
              maxlength="13"
              @input="onPhoneInput"
              autofocus
            />
            <button
              v-if="posStore.phoneNumber"
              type="button"
              class="clear-phone-btn"
              @click="clearPhone"
              title="Clear phone number"
            >
              <i class="fa-solid fa-circle-xmark"></i>
            </button>
          </div>
          <p class="input-hint">
            <i class="fa-solid fa-keyboard text-slate-400 mr-1"></i>
            Tap input to trigger phone dialpad
          </p>
        </div>

        <!-- Quick Carrier Prefix Chips -->
        <div class="prefix-chips-row">
          <span class="text-[11px] font-bold text-slate-400 mr-1">Prefix:</span>
          <button
            v-for="pref in ['077', '078', '076', '070', '075', '074', '+256']"
            :key="pref"
            type="button"
            class="prefix-chip"
            @click="setPrefix(pref)"
          >
            {{ pref }}
          </button>
        </div>

        <!-- Optional Collapsible Customer Details (Name / Email for E-Receipt) -->
        <div class="optional-accordion">
          <button
            type="button"
            class="accordion-toggle-btn"
            @click="showOptionalDetails = !showOptionalDetails"
          >
            <span>
              <i class="fa-solid fa-envelope-open-text mr-1 text-slate-400"></i>
              {{ showOptionalDetails ? 'Hide Customer Details' : '+ Add Name / Email for E-Receipt' }}
            </span>
            <i class="fa-solid fa-chevron-down toggle-arrow" :class="{ 'rotate-180': showOptionalDetails }"></i>
          </button>

          <div v-show="showOptionalDetails" class="accordion-content">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <div>
                <label class="field-label-sm">Customer Name (Optional)</label>
                <input
                  type="text"
                  v-model="posStore.customerName"
                  placeholder="e.g. Michael O."
                  class="pos-input-sm"
                />
              </div>
              <div>
                <label class="field-label-sm">Customer Email (for E-Receipt)</label>
                <input
                  type="email"
                  v-model="posStore.customerEmail"
                  placeholder="customer@example.com"
                  class="pos-input-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Big Primary Action Button (Abja Sandstone Gold) -->
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
const phoneInputRef = ref<HTMLInputElement | null>(null)

const showOptionalDetails = ref(false)

// Carrier Detection (MTN: 077, 078, 076 | Airtel: 070, 075, 074)
const carrierBadge = computed(() => {
  const clean = posStore.phoneNumber.replace(/[\s\-\(\)]+/g, '')
  if (/^(?:\+?256|0)?(77|78|76)/.test(clean)) return 'MTN MoMo'
  if (/^(?:\+?256|0)?(70|75|74)/.test(clean)) return 'Airtel Money'
  return null
})

function onPhoneInput(e: Event) {
  const input = e.target as HTMLInputElement
  // Auto strip non-digit characters except leading + and spaces
  let val = input.value.replace(/[^\d+\s]/g, '')
  posStore.phoneNumber = val
}

function setPrefix(prefix: string) {
  let current = posStore.phoneNumber.replace(/[\s\-\(\)]+/g, '')
  if (prefix === '+256') {
    if (current.startsWith('+256')) {
      // already has international code
    } else if (current.startsWith('0')) {
      posStore.phoneNumber = '+256' + current.slice(1)
    } else if (current.startsWith('256')) {
      posStore.phoneNumber = '+' + current
    } else {
      posStore.phoneNumber = '+256' + current
    }
  } else {
    if (!current) {
      posStore.phoneNumber = prefix
    } else if (current.startsWith('+256')) {
      posStore.phoneNumber = '+256' + prefix.slice(1) + current.slice(6)
    } else if (current.startsWith('256')) {
      posStore.phoneNumber = '256' + prefix.slice(1) + current.slice(5)
    } else if (current.startsWith('0')) {
      posStore.phoneNumber = prefix + current.slice(3)
    } else {
      posStore.phoneNumber = prefix
    }
  }
  // Focus the phone input so the native keyboard triggers immediately
  phoneInputRef.value?.focus()
}

function clearPhone() {
  posStore.phoneNumber = ''
  phoneInputRef.value?.focus()
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
  // Auto-focus the phone input for instant keyboard popup on mobile
  setTimeout(() => {
    phoneInputRef.value?.focus()
  }, 300)
})
</script>

<style scoped>
.pos-container {
  padding: 12px 16px;
  max-width: 1040px;
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
  padding: 18px;
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
  color: var(--primary);
}

.section-title i {
  color: var(--accent);
  font-size: 15px;
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.category-btn {
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: var(--ax-radius-md);
  box-shadow: var(--ax-shadow-low);
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  text-align: left;
  transition: all var(--duration-fast, 125ms) ease;
  min-height: 64px;
}

.category-btn:hover {
  border-color: var(--accent);
  box-shadow: var(--ax-shadow-med);
}

.category-btn.active {
  border-color: var(--accent);
  background: var(--accent-light);
  box-shadow: 0 0 0 2px var(--accent);
}

.cat-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--ax-radius-xs);
  background: var(--primary-light);
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
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
}

.cat-amount {
  font-size: 12px;
  font-weight: 800;
  color: #8D7E5F;
  margin-top: 3px;
}

.cat-check {
  color: var(--accent);
  font-size: 17px;
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
  padding: 8px 0;
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: var(--ax-radius-full);
  font-size: 12px;
  font-weight: 800;
  color: var(--text-muted);
  transition: all var(--duration-fast, 125ms) ease;
}

.chip-btn.active {
  background: var(--primary);
  color: #ffffff;
  border-color: var(--primary);
  box-shadow: 0 2px 4px rgba(28, 35, 49, 0.2);
}

.compact-qty-stepper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qty-btn-mini {
  width: 30px;
  height: 30px;
  border-radius: var(--ax-radius-xs);
  background: var(--bg-app);
  border: 1px solid var(--border);
  font-size: 12px;
  font-weight: 800;
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
  background: linear-gradient(135deg, #1C2331 0%, #121722 100%);
  color: #ffffff;
  border-radius: var(--ax-radius-md);
  border: 1px solid rgba(158, 143, 112, 0.3);
  box-shadow: var(--ax-shadow-low);
  padding: 14px 18px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.total-left {
  display: flex;
  flex-direction: column;
}

.total-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #D4C7AC;
  font-weight: 800;
}

.total-sub {
  font-size: 12px;
  opacity: 0.85;
  font-weight: 600;
  color: #ffffff;
  margin-top: 2px;
}

.total-figure {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.5px;
  color: #E2D7C0;
}

/* Phone Input */
.phone-input-group {
  margin-bottom: 10px;
}

.input-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.field-label-compact {
  font-size: 11px;
  font-weight: 800;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.carrier-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: var(--ax-radius-full);
}

.carrier-badge.mtn {
  background: #FFCC00;
  color: #000000;
}

.carrier-badge.airtel {
  background: #E53935;
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
  color: var(--accent);
  font-size: 16px;
}

.pos-input {
  width: 100%;
  padding: 14px 40px 14px 42px;
  border: 2px solid var(--border-strong);
  border-radius: var(--ax-radius-md);
  background: #ffffff;
  color: var(--primary);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 1px;
  outline: none;
  transition: all var(--duration-fast, 125ms) ease;
}

.pos-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(158, 143, 112, 0.25);
}

.clear-phone-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #9CA3AF;
  font-size: 18px;
  padding: 4px;
}

.input-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 5px;
}

/* Quick Prefix Chips */
.prefix-chips-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.prefix-chip {
  padding: 4px 10px;
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: var(--ax-radius-full);
  font-size: 11px;
  font-weight: 800;
  color: var(--primary);
  transition: all var(--duration-fast, 125ms) ease;
}

.prefix-chip:hover, .prefix-chip:active {
  background: var(--accent-light);
  border-color: var(--accent);
  color: var(--accent);
}

/* Optional Accordion */
.optional-accordion {
  margin-bottom: 14px;
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: var(--ax-radius-sm);
  padding: 8px 12px;
}

.accordion-toggle-btn {
  width: 100%;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 11px;
  font-weight: 800;
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
  font-weight: 800;
  color: var(--text-muted);
  display: block;
  margin-bottom: 3px;
  text-transform: uppercase;
}

.pos-input-sm {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-strong);
  border-radius: var(--ax-radius-xs);
  background: #ffffff;
  color: var(--text-main);
  font-size: 12px;
  outline: none;
}

.pos-input-sm:focus {
  border-color: var(--accent);
}

/* Action Button */
.action-footer {
  margin-top: auto;
}

.collect-btn {
  width: 100%;
  height: 52px;
  background: var(--accent);
  color: #1C2331;
  border-radius: var(--ax-radius-md);
  box-shadow: 0 4px 12px rgba(158, 143, 112, 0.35);
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.3px;
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
  color: #ffffff;
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
    padding: 8px 10px;
  }
  .pos-layout-wrapper {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .section-card {
    padding: 12px;
    border-radius: var(--ax-radius-md);
  }
  .categories-grid {
    gap: 8px;
    margin-bottom: 10px;
  }
  .category-btn {
    padding: 10px;
    min-height: 56px;
    gap: 8px;
  }
  .cat-icon-wrap {
    width: 32px;
    height: 32px;
    font-size: 15px;
  }
  .cat-name {
    font-size: 12px;
  }
  .cat-amount {
    font-size: 11px;
  }
  .pos-input {
    padding: 12px 36px 12px 38px;
    font-size: 18px;
  }
  .collect-btn {
    height: 50px;
    font-size: 15px;
  }
}
</style>
