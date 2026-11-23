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

      // Generate verification QR code
      const currentUrl = window.location.href
      qrDataUrl.value = await QRCode.toDataURL(currentUrl, {
        margin: 1,
        width: 180,
        color: { dark: '#047857', light: '#ffffff' },
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
  <div class="max-w-md mx-auto py-6 px-4">
    <!-- Loading -->
    <div v-if="isLoading" class="py-20 text-center text-slate-400">
      <i class="fa-solid fa-circle-notch fa-spin text-3xl text-emerald-600 mb-3"></i>
      <p class="text-sm font-bold text-slate-700">Verifying Ticket Receipt...</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage" class="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-lg">
      <div class="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
        <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
      </div>
      <h2 class="text-base font-black text-slate-800">Receipt Not Found</h2>
      <p class="text-xs text-slate-500 mt-1">{{ errorMessage }}</p>
    </div>

    <!-- Official Verified Receipt Card -->
    <div v-else-if="receipt" class="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
      <!-- Verified Top Header -->
      <div class="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 text-center relative">
        <div class="w-12 h-12 bg-white/10 backdrop-blur-xs rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white/20">
          <i class="fa-solid fa-tree text-2xl text-amber-300"></i>
        </div>
        <h1 class="text-lg font-black tracking-tight">ABJA PARKS & RECREATION</h1>
        <p class="text-xs text-emerald-200 font-semibold">Official Admission E-Receipt</p>

        <!-- Verified badge -->
        <div class="inline-flex items-center gap-1.5 bg-emerald-500/30 border border-emerald-400/50 px-3 py-1 rounded-full text-[11px] font-bold text-emerald-100 mt-3">
          <i class="fa-solid fa-circle-check text-emerald-300"></i>
          Verified Official Payment
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-5">
        <!-- Scannable Gate Verification QR -->
        <div class="text-center bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Gate Scan & Verification</div>
          <div v-if="qrDataUrl" class="inline-block p-2 bg-white rounded-xl shadow-xs border border-slate-200">
            <img :src="qrDataUrl" alt="Verification QR" class="w-36 h-36 mx-auto" />
          </div>
          <div class="mt-2 text-xs font-mono font-black text-slate-700">
            Ticket: {{ receipt.ticket_code }}
          </div>
          <div class="text-[10px] text-slate-400">Present this QR code or receipt number at the gate</div>
        </div>

        <!-- Receipt Metadata -->
        <div class="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs">
          <div class="flex justify-between text-slate-500">
            <span>Receipt No.</span>
            <span class="font-mono font-bold text-slate-800">#{{ receipt.receipt_number }}</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>Category</span>
            <span class="font-bold text-slate-800">{{ receipt.category_name }}</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>Admissions / Quantity</span>
            <span class="font-bold text-slate-800">{{ receipt.quantity }} Person(s)</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>MoMo Payer</span>
            <span class="font-mono font-bold text-slate-800">{{ receipt.momo_number }}</span>
          </div>
          <div v-if="receipt.customer_name" class="flex justify-between text-slate-500">
            <span>Customer</span>
            <span class="font-bold text-slate-800">{{ receipt.customer_name }}</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>Issued Date</span>
            <span class="font-bold text-slate-800">{{ receipt.issued_at }}</span>
          </div>

          <div class="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span class="font-bold text-slate-700">Total Paid</span>
            <span class="font-black text-emerald-700 text-base">{{ formatCurrency(receipt.total_amount) }}</span>
          </div>
        </div>

        <!-- Email Copy Option -->
        <div class="border-t border-slate-100 pt-4 space-y-2">
          <label class="block text-xs font-bold text-slate-700">
            Send a copy to your email
          </label>
          <div class="flex gap-2">
            <input
              v-model="emailInput"
              type="email"
              placeholder="your-email@example.com"
              class="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              @click="sendEmailReceipt"
              :disabled="isSendingEmail"
              class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs disabled:opacity-50 transition flex items-center gap-1.5"
            >
              <i v-if="isSendingEmail" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-envelope"></i>
              Send
            </button>
          </div>
          <p v-if="emailFeedback" class="text-[11px] font-semibold text-emerald-600">
            {{ emailFeedback }}
          </p>
        </div>

        <!-- Footer / Print -->
        <div class="pt-2 flex gap-2">
          <button
            onclick="window.print()"
            class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <i class="fa-solid fa-print"></i>
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
