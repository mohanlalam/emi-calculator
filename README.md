# 📱 EMI & Finance Calculator

> A fast, privacy-focused, all-in-one financial calculator with a native iOS look & feel.  
> Works **100% offline** and installs directly to your iPhone/iPad Home Screen from Safari.

🌐 **Live App**: [https://mohanlalam.github.io/emi-calculator/](https://mohanlalam.github.io/emi-calculator/)

---

## ✨ Features

### 🏠 Loan EMI Calculator
- **Loan type presets** — Home, Car, and Personal loan quick-select chips
- **Quick-amount chips** — ₹10L · ₹25L · ₹50L · ₹1Cr
- **Quick-tenure chips** — 5Y · 10Y · 15Y · 20Y · 30Y
- **Interest rate presets** — 8.5% · 9% · 10.5% · 14%
- **Dual-input sliders** — every field has both a number input and a range slider, synced in real time
- **Mixed tenure** — enter years + extra months for precision
- **Interactive donut chart** — live Principal vs. Interest split with percentage labels
- **Full amortization schedule** — toggle between **Yearly** and **Monthly** breakdown tables

#### ⚡ Prepayment & Part-Payment Planner
- Extra monthly prepayment + one-time yearly lump-sum fields
- Instant badge showing **Total Interest Saved** and **Tenure Reduced By**

#### 🏛️ Home Loan Tax Benefit Estimator *(Year 1)*
- **Section 24(b)** — Interest deduction up to ₹2 Lakh/yr
- **Section 80C** — Principal repayment deduction up to ₹1.5 Lakh/yr
- Selectable tax slabs: **10% · 20% · 30%**
- Live **Estimated Annual Tax Saved** banner

---

### 📈 SIP Growth Calculator
- Monthly investment · Expected annual return · Investment horizon
- Optional **Annual Step-Up %** (increase SIP every year)
- Results: Total maturity value, total invested, estimated wealth gain, **wealth multiplier**
- Donut chart: Invested vs. Capital Gain ratio
- **Year-by-Year Wealth Progression** table (deposited per year, cumulative invested, portfolio value, accrued gains)
- Export CSV · Print / PDF

---

### 🏦 Loan Comparison
- Single shared **Loan Amount** + **Tenure** inputs
- Simultaneous side-by-side calculation for **Home · Car · Personal** loans at their typical market rates
- **Summary cards** per loan type highlighting the lowest EMI and least interest burden
- **Side-by-Side Cost Breakdown** table: Rate · Monthly EMI · Total Interest · Total Outflow · Interest Burden %
- **Year-Wise Interest Comparison** table with "Cheapest Choice" column per year
- Export CSV · Print / PDF

---

### 💼 Investment Suite

Four sub-calculators under one tab, switchable via pill navigation:

| Sub-tool | What it calculates |
|---|---|
| 📊 **Compare All** | SIP · Lumpsum · FD · RD · PPF · Debt Funds — side-by-side with historical rates, Asset Class Growth Matrix table |
| 💎 **Lumpsum** | One-time investment → Nominal Maturity Value + Inflation-Adjusted Purchasing Power + Wealth Multiplier |
| 🏦 **Fixed Deposit (FD)** | Deposit → Maturity Value, Interest Earned, Effective Annual Yield (APY); compounding frequency: Annual · Half-Yearly · Quarterly · Monthly |
| 💰 **Recurring Deposit (RD)** | Monthly deposit → Maturity Value, Interest Earned, Effective Yield |

All sub-tools include a live donut chart, detailed result rows, and Export CSV / Print / PDF support.

---

### ⚖️ Stock & Crypto Average Calculator
- Multi-tranche buy entry (add as many buy lots as needed)
- Portfolio-weighted **average cost price**
- Real-time break-even price display
- **Live P&L tracker** at Current Market Price (CMP) — gain/loss amount and percentage
- Export CSV · Print / PDF

---

### 📱 PWA & Platform Features
- **iOS native look** — bottom tab bar, safe-area support for notch & Dynamic Island
- **Dark Mode & Light Mode** — OLED true-blacks in dark mode, smooth theme toggle
- **100% offline** via Service Worker (`sw.js`) with update-available banner
- **Web Share API** — share any calculation via WhatsApp, Messages, email, or clipboard
- **Export CSV** and **Print / PDF** report generation per calculator
- **Desktop tab navigation** — full-width horizontal nav on larger screens
- Zero external dependencies · 100% client-side · Zero data collected · Zero tracking

---

## 📲 How to Install on iOS (iPhone & iPad)

1. Open **[https://mohanlalam.github.io/emi-calculator/](https://mohanlalam.github.io/emi-calculator/)** in **Safari**.
2. Tap the **Share** button `⎋` in Safari's bottom toolbar.
3. Scroll down and select **"Add to Home Screen"** ➕.
4. Tap **"Add"** in the top-right corner.
5. The **EMI Calc** icon appears on your home screen and runs full-screen — just like a native app!

> **Android / Chrome users**: tap the browser menu → *"Add to Home Screen"* or *"Install App"*.

---

## 🛠️ Tech Stack

| Layer | Details |
|---|---|
| **Structure** | HTML5 with semantic markup |
| **Style** | Vanilla CSS3 (iOS Human Interface Guidelines inspired) |
| **Logic** | Vanilla JavaScript — zero frameworks, zero build step |
| **Fonts** | Inter (Google Fonts) |
| **PWA** | Web App Manifest + Service Worker |
| **Privacy** | 100% client-side · no server · no analytics · no cookies |

---

## 📁 File Overview

```
index.html        # Full single-page app (all 5 calculator tabs)
styles.css        # Complete design system — dark/light, responsive, animations
app.js            # All calculation logic, UI state, charts, export, share, SW registration
sw.js             # Service Worker — caches all assets for offline use
manifest.json     # PWA manifest — icons, theme, display mode
apple-touch-icon.png  # iOS home screen icon (180×180)
icon-192.png      # Android / Chrome PWA icon
icon-512.png      # Splash / high-res PWA icon
```

---

## 🔒 Privacy

This app runs **entirely in your browser**. No data is ever sent to any server. All calculations happen locally on your device.
