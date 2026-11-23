export interface TicketCategory {
  id: string
  name: string
  amount: number
  description: string
  icon: string
}

export interface PaymentCollectionPayload {
  category_name: string
  amount: number
  quantity: number
  momo_number: string
  customer_name?: string
  customer_email?: string
  agent_name?: string
  terminal_id?: string
}

export interface CollectionResponse {
  success: boolean
  transaction_id: string
  receipt_number: string
  ticket_code: string
  status: string
  is_paid: boolean
  total_amount: number
  currency: string
  category_name: string
  quantity: number
  momo_number: string
  provider_reference?: string
  message: string
  qr_url: string
}

export interface TransactionStatusResponse {
  success: boolean
  transaction_id: string
  status: string
  is_paid: boolean
  is_insufficient_balance: boolean
  payment_status_message?: string
  payment_status_reason?: string
  message: string
  attempt_status?: string
  provider_reference?: string
  momo_ref?: string
  result?: string
  reason?: string
}

export interface TransactionHistoryItem {
  id: number
  transaction_id: string
  receipt_number: string
  code: string
  status: 'paid' | 'pending_payment' | 'failed' | 'evaluated'
  category_name: string
  quantity: number
  total_amount: number
  currency: string
  momo_number: string
  customer_name?: string
  customer_email?: string
  agent_name?: string
  terminal_id?: string
  external_payment_reference?: string
  created_at: string
}

export interface ShiftReportData {
  summary: {
    total_revenue: number
    currency: string
    successful_transactions: number
    total_tickets_sold: number
    pending_transactions: number
    failed_transactions: number
  }
  category_breakdown: Array<{
    category_name: string
    tickets_sold: number
    revenue: number
  }>
  terminal_summary: Array<{
    terminal_id: string
    tx_count: number
    revenue: number
  }>
  report_period: {
    from: string
    to: string
  }
}

export interface AgentSession {
  agentName: string
  terminalId: string
  isLoggedIn: boolean
  loginTime: string
}
