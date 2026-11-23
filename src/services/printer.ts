import QRCode from 'qrcode'

export interface ReceiptData {
  receiptNumber: string
  ticketCode: string
  categoryName: string
  quantity: number
  totalAmount: number
  currency: string
  momoNumber: string
  customerName?: string
  agentName?: string
  terminalId?: string
  dateStr: string
  paymentRef?: string
  qrDataUrl?: string
}

export const printer = {
  /**
   * Generate QR Code as Data URL for public receipt verification
   */
  async generateReceiptQr(receiptNumber: string): Promise<string> {
    const verificationUrl = `https://myparking.yoticket.click/api/v1/receipts/${receiptNumber}`
    try {
      return await QRCode.toDataURL(verificationUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
    } catch (e) {
      console.warn('Failed to generate QR code:', e)
      return ''
    }
  },

  /**
   * Format receipt text for thermal printing
   */
  async printThermalReceipt(data: ReceiptData): Promise<boolean> {
    // 1. Check for Sunmi POS hardware bridge
    const sunmi = (window as any).sunmi
    if (sunmi && typeof sunmi.printText === 'function') {
      try {
        sunmi.printerInit()
        sunmi.setAlignment(1) // Centered
        sunmi.setFontSize(28)
        sunmi.printText("ABJA PARKS\n")
        sunmi.setFontSize(22)
        sunmi.printText("ENTRANCE TICKET RECEIPT\n")
        sunmi.printText("** SUCCESS **\n")
        sunmi.printText("--------------------------------\n")
        sunmi.setAlignment(0) // Left
        sunmi.printText(`Receipt:  ${data.receiptNumber}\n`)
        sunmi.printText(`Ticket:   ${data.categoryName} (x${data.quantity})\n`)
        sunmi.printText(`Amount:   ${data.currency} ${data.totalAmount.toLocaleString()}\n`)
        sunmi.printText(`MoMo:     ${data.momoNumber}\n`)
        if (data.customerName) sunmi.printText(`Customer: ${data.customerName}\n`)
        if (data.agentName) sunmi.printText(`Agent:    ${data.agentName}\n`)
        if (data.terminalId) sunmi.printText(`Terminal: ${data.terminalId}\n`)
        sunmi.printText(`Date:     ${data.dateStr}\n`)
        if (data.paymentRef) sunmi.printText(`Ref:      ${data.paymentRef}\n`)
        sunmi.printText("--------------------------------\n")
        sunmi.setAlignment(1) // Centered
        sunmi.printText("Scan QR on receipt for e-copy\n")
        sunmi.printText("Powered by YoTicket\n\n\n\n")
        sunmi.cutPaper()
        return true
      } catch (e) {
        console.warn('Sunmi native print error, falling back to window.print():', e)
      }
    }

    // 2. Standard Web Print (tailored for 58mm/80mm roll printing)
    window.print()
    return true
  },
}
