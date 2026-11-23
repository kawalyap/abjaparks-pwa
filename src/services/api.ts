import type {
  TicketCategory,
  PaymentCollectionPayload,
  CollectionResponse,
  TransactionStatusResponse,
  TransactionHistoryItem,
  ShiftReportData,
  SiteGate,
  AttendantUser,
  AuthLoginResponse,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:8000/api/v1' : 'https://myparking.yoticket.click/api/v1')
const SITE_CODE = import.meta.env.VITE_SITE_CODE || 'abjaparks'

function getHeaders(token?: string) {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  let authToken = token
  if (!authToken && typeof localStorage !== 'undefined') {
    authToken = localStorage.getItem('abja_pos_token') || ''
    if (!authToken) {
      try {
        const raw = localStorage.getItem('abja_pos_session')
        if (raw) {
          const parsed = JSON.parse(raw)
          authToken = parsed.token || ''
        }
      } catch {
        authToken = ''
      }
    }
  }
  if (authToken) {
    h['Authorization'] = `Bearer ${authToken}`
  }
  return h
}

export const api = {
  /**
   * Fetch registered gates/terminals for this site from backend
   */
  async getGates(): Promise<SiteGate[]> {
    try {
      const res = await fetch(`${API_BASE}/sites/${SITE_CODE}/gates`, { headers: getHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return json.gates || []
    } catch (e) {
      console.warn('Failed to fetch gates from server, using defaults:', e)
      return [
        { id: 1, code: 'POS-01', name: 'Main Gate Station 1', type: 'handheld_pos' },
        { id: 2, code: 'POS-02', name: 'Main Gate Station 2', type: 'handheld_pos' },
        { id: 3, code: 'POS-03', name: 'VIP Pavilion Gate', type: 'turnstile' },
        { id: 4, code: 'POS-04', name: 'Sports Arena / Poolside', type: 'outdoor_pos' },
      ]
    }
  },

  /**
   * Fetch registered attendants/cashiers for this site from backend
   */
  async getAttendants(): Promise<AttendantUser[]> {
    try {
      const res = await fetch(`${API_BASE}/sites/${SITE_CODE}/attendants`, { headers: getHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return json.attendants || []
    } catch (e) {
      console.warn('Failed to fetch attendants from server, using defaults:', e)
      return [
        { id: 3, name: 'Sarah K.', email: 'sarah@abjaparks.com', role: 'attendant', default_gate: 'POS-01' },
        { id: 4, name: 'John M.', email: 'john@abjaparks.com', role: 'attendant', default_gate: 'POS-02' },
        { id: 5, name: 'Grace N.', email: 'grace@abjaparks.com', role: 'attendant', default_gate: 'POS-03' },
        { id: 6, name: 'David O.', email: 'david@abjaparks.com', role: 'attendant', default_gate: 'POS-04' },
      ]
    }
  },

  /**
   * Authenticate attendant onto a specific registered gate
   */
  async login(payload: { terminal_id: string; identifier: string; pin: string }): Promise<AuthLoginResponse> {
    const res = await fetch(`${API_BASE}/sites/${SITE_CODE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed')
    }
    if (data.token && typeof localStorage !== 'undefined') {
      localStorage.setItem('abja_pos_token', data.token)
    }
    return data
  },

  /**
   * Sign out / end shift
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/sites/${SITE_CODE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      })
    } catch (e) {
      console.warn('Logout network error (clearing local session anyway):', e)
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('abja_pos_token')
      }
    }
  },

  /**
   * Fetch ticket categories for Abja Parks
   */
  async getCategories(): Promise<TicketCategory[]> {
    try {
      const res = await fetch(`${API_BASE}/sites/${SITE_CODE}/categories`, { headers: getHeaders() })
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
      headers: getHeaders(),
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
    const res = await fetch(`${API_BASE}/sites/${SITE_CODE}/tickets/${transactionId}/status`, { headers: getHeaders() })
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

    const res = await fetch(url.toString(), { headers: getHeaders() })
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

    const res = await fetch(url.toString(), { headers: getHeaders() })
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
      headers: getHeaders(),
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
    const res = await fetch(`${API_BASE}/receipts/${receiptNumber}`, { headers: getHeaders() })
    if (!res.ok) throw new Error(`Receipt not found`)
    return await res.json()
  },
}
