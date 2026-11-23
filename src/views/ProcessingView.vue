<template>
  <div class="pos-container max-w-md mx-auto py-6 px-3 flex items-center justify-center min-h-[80vh]">
    <div class="bg-white border border-[#E8E6E1] rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-5">
      <!-- Brand Logo Mini Header -->
      <div class="flex items-center justify-center">
        <div class="bg-[#F8F7F4] border border-[#E8E6E1] px-3 py-1.5 rounded-xl shadow-2xs">
          <img src="/abja-logo.png" alt="Abja Parks" class="h-6 object-contain" />
        </div>
      </div>

      <!-- Animated Status Icon -->
      <div class="relative w-24 h-24 mx-auto flex items-center justify-center">
        <!-- Ripple rings -->
        <div
          v-if="!isSuccess && !isFailed"
          class="absolute inset-0 rounded-full border-4 border-[#9E8F70]/30 animate-ping"
        ></div>
        <div
          v-if="!isSuccess && !isFailed"
          class="absolute inset-2 rounded-full border-2 border-[#9E8F70]/60 animate-pulse"
        ></div>

        <!-- Central core -->
        <div
          class="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg relative z-10 transition-all duration-300"
          :class="[
            isSuccess ? 'bg-emerald-600 text-white' :
            isFailed ? 'bg-rose-600 text-white' :
            'bg-[#1C2331] text-[#9E8F70]'
          ]"
        >
          <i v-if="isSuccess" class="fa-solid fa-circle-check"></i>
          <i v-else-if="isFailed" class="fa-solid fa-circle-xmark"></i>
          <i v-else class="fa-solid fa-mobile-screen-button fa-shake"></i>
        </div>
      </div>

      <!-- Header & Instructions -->
      <div class="space-y-1">
        <h2 class="text-base font-black text-[#1C2331] uppercase tracking-tight">
          {{ statusTitle }}
        </h2>
        <p class="text-xs text-slate-500 font-medium leading-relaxed">
          {{ statusMessage }}
        </p>
      </div>

      <!-- Amount Details Ticket -->
      <div class="bg-[#F8F7F4] border border-[#E8E6E1] rounded-2xl p-4 text-left space-y-2 text-xs">
        <div class="flex justify-between items-center text-slate-500 font-semibold">
          <span>Admissions</span>
          <strong class="text-[#1C2331]">
            {{ posStore.activeTransaction?.category_name || 'Entrance Ticket' }} (x{{ posStore.activeTransaction?.quantity || 1 }})
          </strong>
        </div>

        <div class="flex justify-between items-center pt-1 border-t border-[#E8E6E1]">
          <span class="text-slate-500 font-semibold">Total Amount</span>
          <strong class="text-base font-black text-[#1C2331]">
            UGX {{ (posStore.activeTransaction?.total_amount || 0).toLocaleString() }}
          </strong>
        </div>

        <div class="flex justify-between items-center pt-1 border-t border-[#E8E6E1]">
          <span class="text-slate-500 font-semibold">MoMo Handset</span>
          <span class="font-mono font-bold text-[#1C2331] bg-white px-2 py-0.5 rounded border border-[#E8E6E1]">
            {{ maskedPhone }}
          </span>
        </div>

        <div v-if="posStore.activeTransaction?.receipt_number" class="flex justify-between items-center pt-1 border-t border-[#E8E6E1]">
          <span class="text-slate-500 font-semibold">Receipt No</span>
          <code class="text-[10px] font-mono font-bold text-slate-700">{{ posStore.activeTransaction?.receipt_number }}</code>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-2 pt-1">
        <button
          v-if="isSuccess"
          class="w-full py-3.5 bg-[#9E8F70] hover:bg-[#8B7C5E] text-[#1C2331] text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2"
          @click="goToReceipt"
        >
          <i class="fa-solid fa-receipt"></i>
          <span>View & Print Receipt</span>
        </button>

        <button
          v-else-if="isFailed"
          class="w-full py-3 bg-[#1C2331] hover:bg-[#121722] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2"
          @click="handleRetry"
        >
          <i class="fa-solid fa-rotate-right text-[#9E8F70]"></i>
          <span>Try Again</span>
        </button>

        <button
          class="w-full py-2.5 bg-[#F8F7F4] hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-[#E8E6E1] transition"
          @click="handleCancel"
        >
          {{ isSuccess ? 'New Ticket' : 'Cancel Transaction' }}
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
  if (isSuccess.value) return 'Mobile Money payment confirmed. Admission granted.'
  if (isFailed.value) return posStore.pollError || posStore.activeStatus?.message || 'Payment prompt was canceled or timed out.'
  return `Prompt dispatched to ${maskedPhone.value}. Instruct the customer to authorize with their mobile money PIN.`
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
