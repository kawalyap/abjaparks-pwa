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
  <div class="max-w-md mx-auto py-6 px-3">
    <!-- Loading -->
    <div v-if="isLoading" class="py-20 text-center text-slate-400">
      <i class="fa-solid fa-circle-notch fa-spin text-3xl text-[#9E8F70] mb-3"></i>
      <p class="text-xs font-bold text-slate-700">Verifying Official Entry Receipt...</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage" class="bg-white border border-rose-200 rounded-3xl p-8 text-center shadow-lg">
      <div class="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
      </div>
      <h2 class="text-base font-black text-[#1C2331]">Receipt Not Found</h2>
      <p class="text-xs text-slate-500 mt-1">{{ errorMessage }}</p>
    </div>

    <!-- Official Verified Receipt Card -->
    <div v-else-if="receipt" class="bg-white border border-[#E8E6E1] rounded-3xl shadow-xl overflow-hidden">
      <!-- Verified Top Header -->
      <div class="bg-gradient-to-b from-[#1C2331] via-[#1E2738] to-[#121722] text-white p-5 text-center relative border-b-2 border-[#9E8F70]">
        <div class="bg-white rounded-xl px-3.5 py-1.5 inline-block mx-auto mb-2 shadow-sm">
          <img src="/abja-logo.png" alt="Abja Parks" class="h-7 mx-auto object-contain" />
        </div>
        <p class="text-xs text-[#D4C7AC] font-bold">Official Admission E-Receipt</p>

        <!-- Verified badge -->
        <div class="inline-flex items-center gap-1.5 bg-[#9E8F70]/20 border border-[#9E8F70]/40 px-3 py-1 rounded-full text-[10px] font-black uppercase text-[#EFECE6] mt-2 tracking-wider">
          <i class="fa-solid fa-circle-check text-emerald-400"></i>
          Verified Official Payment
        </div>
      </div>

      <!-- Content -->
      <div class="p-5 space-y-4">
        <!-- Scannable Gate Verification QR -->
        <div class="text-center bg-[#F8F7F4] border border-[#E8E6E1] rounded-2xl p-4">
          <div class="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">Gate Scan & Verification</div>
          <div v-if="qrDataUrl" class="inline-block p-2 bg-white rounded-xl shadow-xs border border-[#E8E6E1]">
            <img :src="qrDataUrl" alt="Verification QR" class="w-36 h-36 mx-auto object-contain" />
          </div>
          <div class="mt-2 text-xs font-mono font-black text-[#1C2331]">
            Ticket: {{ receipt.ticket_code }}
          </div>
          <div class="text-[10px] text-slate-400 font-medium">Present this QR code or receipt number at the turnstile</div>
        </div>

        <!-- Receipt Metadata -->
        <div class="bg-[#F8F7F4] border border-[#E8E6E1] rounded-2xl p-3.5 space-y-2 text-xs">
          <div class="flex justify-between text-slate-500 font-medium">
            <span>Receipt No.</span>
            <span class="font-mono font-bold text-[#1C2331]">#{{ receipt.receipt_number }}</span>
          </div>
          <div class="flex justify-between text-slate-500 font-medium">
            <span>Category</span>
            <span class="font-bold text-[#1C2331]">{{ receipt.category_name }}</span>
          </div>
          <div class="flex justify-between text-slate-500 font-medium">
            <span>Admissions / Quantity</span>
            <span class="font-bold text-[#1C2331]">{{ receipt.quantity }} Person(s)</span>
          </div>
          <div class="flex justify-between text-slate-500 font-medium">
            <span>MoMo Payer</span>
            <span class="font-mono font-bold text-[#1C2331]">{{ receipt.momo_number }}</span>
          </div>
          <div v-if="receipt.customer_name" class="flex justify-between text-slate-500 font-medium">
            <span>Customer</span>
            <span class="font-bold text-[#1C2331]">{{ receipt.customer_name }}</span>
          </div>
          <div class="flex justify-between text-slate-500 font-medium">
            <span>Issued Date</span>
            <span class="font-bold text-[#1C2331]">{{ receipt.issued_at }}</span>
          </div>

          <div class="pt-2 border-t border-[#E8E6E1] flex justify-between items-center">
            <span class="font-black text-slate-700 uppercase text-[11px]">Total Paid</span>
            <span class="font-black text-[#1C2331] text-base">{{ formatCurrency(receipt.total_amount) }}</span>
          </div>
        </div>

        <!-- Email Copy Option -->
        <div class="border-t border-[#E8E6E1] pt-3 space-y-1.5">
          <label class="block text-[11px] font-black uppercase tracking-wider text-[#1C2331]">
            Send a copy to your email
          </label>
          <div class="flex gap-1.5">
            <input
              v-model="emailInput"
              type="email"
              placeholder="your-email@example.com"
              class="flex-1 px-3 py-2 text-xs border border-[#E8E6E1] rounded-xl focus:ring-2 focus:ring-[#9E8F70] outline-none"
            />
            <button
              @click="sendEmailReceipt"
              :disabled="isSendingEmail"
              class="px-3.5 py-2 text-xs font-black text-[#1C2331] bg-[#9E8F70] hover:bg-[#8B7C5E] rounded-xl shadow-xs disabled:opacity-50 transition flex items-center gap-1.5"
            >
              <i v-if="isSendingEmail" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-envelope"></i>
              <span>Send</span>
            </button>
          </div>
          <p v-if="emailFeedback" class="text-[10px] font-bold text-emerald-700">
            {{ emailFeedback }}
          </p>
        </div>

        <!-- Footer / Print -->
        <div class="pt-1">
          <button
            onclick="window.print()"
            class="w-full py-2.5 bg-[#F8F7F4] hover:bg-slate-100 text-[#1C2331] border border-[#E8E6E1] text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
          >
            <i class="fa-solid fa-print text-[#9E8F70]"></i>
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
