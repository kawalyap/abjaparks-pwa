<template>
  <div class="pos-container max-w-md mx-auto py-4 px-3">
    <div class="receipt-wrapper">
      <!-- Visible Screen Receipt Card -->
      <div class="bg-white border border-[#E8E6E1] rounded-3xl shadow-xl overflow-hidden">
        <!-- Brand Header -->
        <div class="bg-gradient-to-b from-[#1C2331] via-[#1E2738] to-[#121722] text-white p-5 text-center relative border-b-2 border-[#9E8F70]">
          <div class="inline-flex items-center justify-center bg-white px-3.5 py-1.5 rounded-xl shadow-md mb-2">
            <img src="/abja-logo.png" alt="Abja Parks" class="h-7 w-auto object-contain" />
          </div>
          <p class="text-xs text-[#D4C7AC] font-bold">Official Entrance Admission Receipt</p>
          <div class="inline-flex items-center gap-1.5 bg-[#9E8F70]/20 border border-[#9E8F70]/40 px-3 py-0.5 rounded-full text-[10px] font-black uppercase text-[#EFECE6] mt-2 tracking-wider">
            <i class="fa-solid fa-circle-check text-emerald-400"></i>
            <span>PAID & CONFIRMED</span>
          </div>
        </div>

        <!-- Receipt Body -->
        <div class="p-5 space-y-4">
          <!-- Total Amount Card -->
          <div class="bg-[#F8F7F4] border border-[#E8E6E1] rounded-2xl p-3.5 text-center">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">UGX</span>
            <span class="text-2xl font-black text-[#1C2331] tracking-tight">
              {{ (txData.totalAmount || 0).toLocaleString() }}
            </span>
          </div>

          <!-- Transaction Breakdown Table -->
          <div class="bg-[#F8F7F4] border border-[#E8E6E1] rounded-2xl p-3.5 space-y-2 text-xs">
            <div class="flex justify-between items-center text-slate-500 font-medium">
              <span>Receipt No</span>
              <strong class="font-mono text-[#1C2331]">{{ txData.receiptNumber }}</strong>
            </div>
            <div class="flex justify-between items-center text-slate-500 font-medium">
              <span>Ticket Category</span>
              <strong class="text-[#1C2331]">{{ txData.categoryName }} (x{{ txData.quantity }})</strong>
            </div>
            <div class="flex justify-between items-center text-slate-500 font-medium">
              <span>Payment Method</span>
              <strong class="text-[#1C2331]">Mobile Money Push</strong>
            </div>
            <div class="flex justify-between items-center text-slate-500 font-medium">
              <span>Customer MoMo</span>
              <strong class="font-mono text-[#1C2331]">{{ txData.momoNumber }}</strong>
            </div>
            <div v-if="txData.customerName" class="flex justify-between items-center text-slate-500 font-medium">
              <span>Customer Name</span>
              <strong class="text-[#1C2331]">{{ txData.customerName }}</strong>
            </div>
            <div v-if="txData.paymentRef" class="flex justify-between items-center text-slate-500 font-medium">
              <span>Payment Ref</span>
              <strong class="font-mono text-[11px] text-slate-700 truncate max-w-[180px]">{{ txData.paymentRef }}</strong>
            </div>
            <div class="flex justify-between items-center text-slate-500 font-medium">
              <span>Date & Time</span>
              <strong class="text-[#1C2331]">{{ txData.dateStr }}</strong>
            </div>
            <div class="flex justify-between items-center text-slate-500 font-medium">
              <span>Terminal / Agent</span>
              <strong class="text-[#1C2331]">{{ txData.terminalId }} &bull; {{ txData.agentName }}</strong>
            </div>
          </div>

          <!-- Customer Smartphone QR Scan Box -->
          <div class="bg-[#F8F7F4] border border-[#E8E6E1] rounded-2xl p-4 text-center space-y-2">
            <p class="text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-camera text-[#9E8F70]"></i>
              Scan with phone camera for digital receipt
            </p>
            <div v-if="qrImage" class="inline-block p-2 bg-white rounded-xl shadow-xs border border-[#E8E6E1]">
              <img :src="qrImage" alt="Receipt Verification QR" class="w-32 h-32 mx-auto object-contain" />
            </div>
            <span class="block text-[10px] font-mono font-black text-slate-500 uppercase">
              Ref: {{ txData.receiptNumber }}
            </span>
          </div>

          <!-- POS Action Buttons (Hidden when printing) -->
          <div class="space-y-2 no-print pt-1">
            <button
              class="w-full py-3.5 bg-[#9E8F70] hover:bg-[#8B7C5E] text-[#1C2331] text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2"
              @click="handlePrint"
            >
              <i class="fa-solid fa-print text-sm"></i>
              <span>Print 58mm Thermal Receipt</span>
            </button>

            <div class="grid grid-cols-2 gap-2">
              <button
                class="py-2.5 bg-white hover:bg-slate-50 text-[#1C2331] border border-[#E8E6E1] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition"
                @click="showEmailModal = true"
              >
                <i class="fa-solid fa-envelope text-[#9E8F70]"></i>
                <span>Email E-Receipt</span>
              </button>
              <button
                class="py-2.5 bg-[#1C2331] hover:bg-[#121722] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-xs"
                @click="handleNextTicket"
              >
                <i class="fa-solid fa-plus text-[#9E8F70]"></i>
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
    </div>

    <!-- Email Dispatch Modal -->
    <div
      v-if="showEmailModal"
      class="fixed inset-0 z-50 bg-[#1C2331]/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in"
      @click.self="showEmailModal = false"
    >
      <div class="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-[#E8E6E1] space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-[#E8E6E1]">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-[#1C2331] text-[#9E8F70] rounded-lg flex items-center justify-center text-xs font-black">
              <i class="fa-solid fa-paper-plane"></i>
            </div>
            <h3 class="text-xs font-black uppercase text-[#1C2331]">Send E-Receipt</h3>
          </div>
          <button @click="showEmailModal = false" class="text-slate-400 hover:text-slate-700">
            <i class="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <p class="text-xs text-slate-500 font-medium">
          The customer will instantly receive their verified PDF & digital entry receipt.
        </p>

        <div>
          <label class="block text-[11px] font-black uppercase tracking-wider text-[#1C2331] mb-1">
            Customer Email
          </label>
          <input
            type="email"
            v-model="emailInput"
            placeholder="customer@example.com"
            class="w-full px-3 py-2 text-xs border border-[#E8E6E1] rounded-xl focus:ring-2 focus:ring-[#9E8F70] outline-none"
            autofocus
          />
        </div>

        <div v-if="emailSuccess" class="bg-emerald-50 text-emerald-800 text-xs font-bold p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
          <i class="fa-solid fa-circle-check text-emerald-600"></i>
          <span>{{ emailSuccess }}</span>
        </div>

        <div v-if="emailError" class="bg-rose-50 text-rose-800 text-xs font-bold p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
          <i class="fa-solid fa-circle-exclamation text-rose-600"></i>
          <span>{{ emailError }}</span>
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <button
            class="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            @click="showEmailModal = false"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1C2331] bg-[#9E8F70] hover:bg-[#8B7C5E] rounded-xl shadow-xs disabled:opacity-50 transition"
            :disabled="!isEmailValid || isSendingEmail"
            @click="handleSendEmail"
          >
            <span v-if="isSendingEmail"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Sending...</span>
            <span v-else><i class="fa-solid fa-paper-plane mr-1"></i> Send Now</span>
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
.thermal-receipt-print-area {
  display: none;
}
</style>
