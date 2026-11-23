import type {
  TicketCategory,
  PaymentCollectionPayload,
  CollectionResponse,
  TransactionStatusResponse,
  TransactionHistoryItem,
  ShiftReportData,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || 'https://myparking.yoticket.click/api/v1'
const SITE_CODE = import.meta.env.VITE_SITE_CODE || 'abjaparks'

const headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

export const api = {
  /**
   * Fetch ticket categories for Abja Parks
   */
  async getCategories(): Promise<TicketCategory[]> {
    try {
      const res = await fetch(`${API_BASE}/sites/${SITE_CODE}/categories`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return json.categories || []
    } catch (e) {
      console.warn('Failed to fetch categories from server, using defaults:', e)
      return [
        { id: 'adult', name: 'Adult Entry', amount: 2000, description: 'General entrance for adults', icon: 'fa-user' },
        { id: 'child', name: 'Child Entry', amount: 1000, description: 'Children under 12 years', icon: 'fa-child' },
        { id: 'student', name: 'Student Entry', amount: 1500, description: 'Valid student ID required at gate', icon: 'fa-graduation-cap' },
        { id: 'vip', name: 'VIP Entry', amount: 5000, description: 'Priority VIP gate access & seating', icon: 'fa-crown' },
      ]
    }
  },

  /**
   * Fast initiate collection via MoMo push
   */
  async initiateCollection(payload: PaymentCollectionPayload): Promise<CollectionResponse> {
    const res = await fetch(`${API_BASE}/sites/${SITE_CODE}/collections/initiate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Payment initiation failed')
    }
    return data
  },

  /**
   * Poll live payment & settlement status
   */
  async checkPaymentStatus(transactionId: string): Promise<TransactionStatusResponse> {
    const res = await fetch(`${API_BASE}/sites/${SITE_CODE}/tickets/${transactionId}/status`, { headers })
    const data = await res.json()
    return data
  },

  /**
   * Fetch shift collection history
   */
  async getHistory(params?: { date?: string; status?: string; limit?: number }): Promise<TransactionHistoryItem[]> {
    const url = new URL(`${API_BASE}/sites/${SITE_CODE}/collections/history`)
    if (params?.date) url.searchParams.set('date', params.date)
    if (params?.status) url.searchParams.set('status', params.status)
    if (params?.limit) url.searchParams.set('limit', String(params.limit))

    const res = await fetch(url.toString(), { headers })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    return json.data || []
  },

  /**
   * Fetch shift & financial analytics report
   */
  async getReports(params?: { from?: string; to?: string; terminal_id?: string }): Promise<ShiftReportData> {
    const url = new URL(`${API_BASE}/sites/${SITE_CODE}/collections/reports`)
    if (params?.from) url.searchParams.set('from', params.from)
    if (params?.to) url.searchParams.set('to', params.to)
    if (params?.terminal_id) url.searchParams.set('terminal_id', params.terminal_id)

    const res = await fetch(url.toString(), { headers })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    return json
  },

  /**
   * Dispatch e-receipt to customer's email
   */
  async emailReceipt(receiptNumber: string, email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/sites/${SITE_CODE}/collections/email-receipt`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ receipt_number: receiptNumber, email }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to dispatch email')
    }
    return data
  },

  /**
   * Public receipt lookup for scanned QR code
   */
  async getPublicReceipt(receiptNumber: string) {
    const res = await fetch(`${API_BASE}/receipts/${receiptNumber}`, { headers })
    if (!res.ok) throw new Error(`Receipt not found`)
    return await res.json()
  },
}
