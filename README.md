# Abja Parks & Recreation - Point of Sale (POS) Progressive Web Application (PWA)

A fast, lightweight, and offline-capable Point of Sale (POS) Progressive Web Application built specifically for **Abja Parks & Recreation** entrance collections, ticket printing, and real-time backend reporting.

Designed to operate seamlessly on dedicated handheld smart POS terminals (e.g., **Sunmi V2 / V2 Pro**), mobile smartphones, and tablets, with integrated 58mm/80mm thermal receipt printing, scannable QR verification codes, and customer email e-receipt dispatch.

---

## ⚡ Key Features

1. **Ultra-Fast Cashier UX**:
   - 1-tap category selection:
     - **Adult Entry**: 2,000 UGX
     - **Child Entry**: 1,000 UGX
     - **Student Entry**: 1,500 UGX
     - **VIP Entry**: 5,000 UGX
   - Touch-friendly on-screen numpad for instant phone number entry.
   - Smart carrier detection (MTN Mobile Money & Airtel Money).
   - Single-tap collection initiation pushing instant USSD PIN prompts to customers.

2. **Sunmi 58mm Thermal Receipt Printing**:
   - Native integration with Sunmi Android hardware bridge (`window.sunmi`).
   - Standard `@media print` fallback supporting Bluetooth/USB 58mm receipt printers and web desktop/mobile printing.
   - Clean receipt formatting with business headers, cashier & terminal IDs, itemized totals, payment references, and scannable verification QR.

3. **QR Code Verification & Customer E-Receipts**:
   - Every receipt prints an authentic, high-contrast QR code.
   - Customers can scan the QR code with any smartphone camera to open their official digital receipt copy at `/receipt/:receiptNumber`.
   - Cashiers or customers can enter an email address to immediately push a digital copy of the receipt to their inbox via the backend email engine.

4. **Shift History & Analytics Reporting**:
   - **Shift History**: Browse, search, filter (by date/status), and reprint past receipts in seconds.
   - **Reports (X & Z Reports)**: Live backend sales summaries, total revenue in UGX, total tickets sold, breakdown by admission category, and terminal-level breakdown.
   - Printable shift closeout report formatted directly for thermal paper.

5. **Security & Non-Disruptive Architecture**:
   - Connects to the unified `cross-parking-service` backend under site code `abjaparks`.
   - Isolated KiliPay wallet routing (`f03e26af-4a0b-4e8d-b06e-f757fde876cd`).
   - Zero disruption to the customer-facing parking barrier frontend (`momo.yoticket.click`), as `abjaparks` is filtered from barrier-only listings.

---

## 🛠️ Tech Stack

- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **Build Tool**: Vite 5
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Pinia with `@vueuse/core` persistent storage
- **Router**: Vue Router 4 (HTML5 history mode)
- **PWA**: `vite-plugin-pwa` with Workbox offline service worker and Web App Manifest
- **QR Code Engine**: `qrcode`

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/kawalyap/abjaparks-pwa.git
cd abjaparks-pwa

# Install dependencies
npm install
```

### Environment Configuration

Create or modify `.env`:

```ini
VITE_API_URL=https://myparking.yoticket.click/api/v1
VITE_SITE_CODE=abjaparks
```

### Development Server

```bash
npm run dev
```

Runs the application locally at `http://localhost:5174/`.

### Production Build

```bash
npm run build
```

Compiles TypeScript and outputs production-ready PWA assets to the `dist/` directory.

---

## 📱 Hardware & Sunmi POS Notes

When running inside a Sunmi handheld POS browser or WebView containing the `sunmi` JavaScript interface:
- Receipts trigger direct hardware line-printing at 384 dots per line (58mm width).
- Print commands issue automatic paper feeds and cuts without displaying OS print dialogs.
- On standard Chrome / Safari mobile or desktop browsers, clicking **Print Receipt** opens the system print dialogue styled to standard 58mm receipt dimensions.

---

## 📄 License

Proprietary — Developed for Abja Parks & Recreation.
