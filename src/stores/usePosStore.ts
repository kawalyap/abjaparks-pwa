import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { api } from '@/services/api'
import type {
  TicketCategory,
  CollectionResponse,
  TransactionStatusResponse,
  TransactionHistoryItem,
  AgentSession,
} from '@/types'

export const usePosStore = defineStore('pos', () => {
  // Agent & Terminal Session
  const session = useStorage<AgentSession>('abja_pos_session', {
    agentName: 'Gate Attendant',
    terminalId: 'POS-01',
    isLoggedIn: true,
    loginTime: new Date().toISOString(),
  })

  const DEFAULT_CATEGORIES: TicketCategory[] = [
    { id: 'adult', name: 'Adult Entry', amount: 2000, description: 'General entrance for adults', icon: 'fa-user' },
    { id: 'child', name: 'Child Entry', amount: 1000, description: 'Children under 12 years', icon: 'fa-child' },
    { id: 'student', name: 'Student Entry', amount: 1500, description: 'Valid student ID required at gate', icon: 'fa-graduation-cap' },
    { id: 'vip', name: 'VIP Entry', amount: 5000, description: 'Priority VIP gate access & seating', icon: 'fa-crown' },
  ]

  // State
  const categories = ref<TicketCategory[]>(DEFAULT_CATEGORIES)
  const isLoadingCategories = ref(false)
  const selectedCategory = ref<TicketCategory | null>(DEFAULT_CATEGORIES[0] ?? null)
  const quantity = ref<number>(1)
  const customAmount = ref<number | null>(null)
  const phoneNumber = ref<string>('')
  const customerName = ref<string>('')
  const customerEmail = ref<string>('')

  // In-flight payment
  const activeTransaction = ref<CollectionResponse | null>(null)
  const activeStatus = ref<TransactionStatusResponse | null>(null)
  const isInitiating = ref(false)
  const isPolling = ref(false)
  const pollError = ref<string | null>(null)
  let pollInterval: any = null

  // Shift History
  const history = ref<TransactionHistoryItem[]>([])
  const isLoadingHistory = ref(false)

  // Computed
  const currentUnitAmount = computed(() => {
    if (customAmount.value && customAmount.value > 0) return customAmount.value
    return selectedCategory.value?.amount || 2000
  })

  const totalAmount = computed(() => currentUnitAmount.value * quantity.value)

  const isFormValid = computed(() => {
    const cleaned = phoneNumber.value.replace(/\s+/g, '')
    const isPhoneValid = /^(0|256)?7\d{8}$/.test(cleaned)
    return isPhoneValid && totalAmount.value >= 500 && !!selectedCategory.value
  })

  // Load ticket categories
  async function loadCategories() {
    isLoadingCategories.value = true
    try {
      categories.value = await api.getCategories()
      if (categories.value.length > 0 && !selectedCategory.value) {
        selectedCategory.value = categories.value[0] || null
      }
    } finally {
      isLoadingCategories.value = false
    }
  }

  // Fast select category
  function selectCategory(cat: TicketCategory) {
    selectedCategory.value = cat
    customAmount.value = null
  }

  // Fast adjust quantity
  function setQuantity(q: number) {
    if (q >= 1 && q <= 50) quantity.value = q
  }

  // Reset collection input form
  function resetForm() {
    phoneNumber.value = ''
    customerName.value = ''
    customerEmail.value = ''
    quantity.value = 1
    customAmount.value = null
    activeTransaction.value = null
    activeStatus.value = null
    pollError.value = null
    stopPolling()
  }

  // Initiate collection
  async function initiateCollection(): Promise<CollectionResponse> {
    if (!isFormValid.value || !selectedCategory.value) {
      throw new Error('Please enter a valid phone number and select a category')
    }

    isInitiating.value = true
    pollError.value = null

    try {
      const response = await api.initiateCollection({
        category_name: selectedCategory.value.name,
        amount: currentUnitAmount.value,
        quantity: quantity.value,
        momo_number: phoneNumber.value.trim(),
        customer_name: customerName.value.trim() || undefined,
        customer_email: customerEmail.value.trim() || undefined,
        agent_name: session.value.agentName,
        terminal_id: session.value.terminalId,
      })

      activeTransaction.value = response
      startPolling(response.transaction_id)
      return response
    } finally {
      isInitiating.value = false
    }
  }

  // Start polling
  function startPolling(transactionId: string) {
    stopPolling()
    isPolling.value = true
    let attempts = 0
    const maxAttempts = 35 // ~105 seconds

    pollInterval = setInterval(async () => {
      attempts++
      try {
        const statusRes = await api.checkPaymentStatus(transactionId)
        activeStatus.value = statusRes

        if (statusRes.is_paid || statusRes.status === 'paid') {
          stopPolling()
        } else if (statusRes.status === 'failed') {
          stopPolling()
          pollError.value = statusRes.message || 'Payment failed'
        } else if (attempts >= maxAttempts) {
          stopPolling()
          pollError.value = 'Payment timed out awaiting PIN confirmation'
        }
      } catch (err: any) {
        console.warn('Poll error:', err)
      }
    }, 3000)
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
    isPolling.value = false
  }

  // Email receipt
  async function sendEmailReceipt(email: string) {
    const ref = activeTransaction.value?.receipt_number
    if (!ref) throw new Error('No active transaction receipt found')
    return await api.emailReceipt(ref, email)
  }

  // Load shift history
  async function loadHistory() {
    isLoadingHistory.value = true
    try {
      history.value = await api.getHistory()
    } finally {
      isLoadingHistory.value = false
    }
  }

  return {
    session,
    categories,
    isLoadingCategories,
    selectedCategory,
    quantity,
    customAmount,
    phoneNumber,
    customerName,
    customerEmail,
    activeTransaction,
    activeStatus,
    isInitiating,
    isPolling,
    pollError,
    history,
    isLoadingHistory,
    currentUnitAmount,
    totalAmount,
    isFormValid,
    loadCategories,
    selectCategory,
    setQuantity,
    resetForm,
    initiateCollection,
    startPolling,
    stopPolling,
    sendEmailReceipt,
    loadHistory,
  }
})
