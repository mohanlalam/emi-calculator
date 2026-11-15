# 📱 EMI & Finance Calculator (v16)

> A blazing fast, privacy-focused, all-in-one financial calculator with an authentic iOS look & feel.  
> Works **100% offline** and installs directly to your iPhone/iPad Home Screen from Safari or Chrome on Android.

🌐 **Live App**: [https://mohanlalam.github.io/emi-calculator/](https://mohanlalam.github.io/emi-calculator/)

---

## ✨ Features & Capabilities

### 🏠 1. Loan EMI Calculator & Prepayment Planner
- **Presets & Dual Sliders** — Quick presets for Home, Car, and Personal loans; dual range sliders + number inputs synced in real time.
- **Micro-Loan Support** — Calculate loans from as low as **₹1,000** up to **₹10 Crore**.
- **Flexible Tenure** — Enter full years + fractional months for exact contract matching.
- **Interactive Donut & Stacked Area Visualizer** — Live Principal vs. Interest split with percentage badges and Retina DPR canvas graph.
- **Interactive Chart Scrubbing** — Touch or mouse scrub over the yearly amortization graph to inspect year-by-year balance, principal, and interest via live floating tooltips.
- **Smart Financial Insight Badge** — Dynamically computes interest savings from prepayments or provides personalized 5% extra payment pro-tips.
- **Prepayment & Part-Payment Engine** — Extra monthly prepayment + one-time yearly lump-sums with instant calculation of interest saved and tenure reduced.
- **Home Loan Tax Deduction Estimator (Year 1)** — Section 24(b) (Interest up to ₹2L) and Section 80C (Principal up to ₹1.5L) across 10%, 20%, and 30% tax brackets.

---

### 📈 2. SIP Wealth & Investment Compounder
- **Monthly SIP & Annual Step-Up** — Model regular monthly deposits with optional annual step-up percentage.
- **Compounding Progression Chart** — Interactive stacked canvas chart with touch/mouse scrubbing tooltips displaying cumulative invested capital vs. compounding interest.
- **Smart Wealth Multiplier Insight** — Highlights your net returns and portfolio capital multiplier over the selected investment horizon.
- **Year-by-Year Growth Table** — Detailed schedule of yearly deposits, cumulative investment, annual growth, and total corpus value.
- **Export & Print** — One-click CSV export and print-ready PDF reports.

---

### 🏦 3. Comprehensive Loan Suite: Compare · Refinance · Top-Up

Switch seamlessly between three dedicated loan engines:

#### A. Loan Comparison Matrix
- Simultaneous side-by-side calculation for **Home · Car · Personal** loans.
- Highlights lowest monthly EMI, least interest burden, and side-by-side cost breakdown.

#### B. Refinance & Balance Transfer Calculator
- Evaluate switching existing loans to a lower interest rate lender.
- Factor in processing fees (% or flat amount).
- Computes **Net Lifetime Savings** after all fees, monthly EMI reduction, and exact **Break-Even Payback Period** (in months).

#### C. Loan Top-Up & Restructure Simulator
- Model an existing loan after elapsed months or years, inject additional capital (Top-Up), and choose new tenure.
- **3-Way Strategy Comparison**:
  1. **Consolidated Merge (Scenario 1)**: Merge outstanding debt + top-up into a single loan with new tenure and rate.
  2. **Separate Tranche (Scenario 2)**: Keep existing loan unchanged; service the top-up as a separate parallel loan.
  3. **Keep Original EMI (Scenario 3)**: Merge debt but maintain current monthly repayment, automatically compressing repayment tenure.
- Full lifetime interest comparison highlighting the optimal financial path.
- **2-Phase Amortization Table**: Displays Phase 1 (pre-topup repayment history) and Phase 2 (post-topup trajectory).

---

### 💼 4. Investment Suite
Four specialized sub-calculators accessible via iOS capsule navigation:

| Sub-Tool | Key Capabilities |
|---|---|
| 📊 **Compare All** | Side-by-side comparison of SIP, Lumpsum, FD, RD, PPF, and Debt Funds with an Asset Class Growth Matrix. |
| 💎 **Lumpsum** | One-time investment with both Nominal Maturity Value and **Inflation-Adjusted Purchasing Power**. |
| 🏦 **Fixed Deposit (FD)** | Compounding options: Monthly, Quarterly, Half-Yearly, and Annual with Effective Annual Yield (APY). |
| 💰 **Recurring Deposit (RD)** | Fixed monthly deposits with compound interest yield and maturity values. |

---

### ⚖️ 5. Revamped Stock, MF & Crypto Average Down Calculator
- **Asset Classes** — Switch between **Stocks** (Shares), **Mutual Funds** (Units), and **Crypto** (Coins).
- **Dynamic Multi-Tranche Entry** — Add unlimited buy lots with custom share counts and purchase prices.
- **Average Buy Price Hero Display** — Instant calculation of volume-weighted average buy price and break-even cost.
- **Live CMP & P&L Tracker** — Optional Current Market Price input with live unrealized Profit/Loss (amount and %) and visual status bar.
- **Purchases Breakdown Table** — Detailed audit of every buy tranche with visual **Portfolio Weight progress bars** (e.g. 47% vs. 53%) and per-tranche returns.

---

### 🌐 6. Global Multi-Currency Support
- Switch between **₹ INR** (Lakhs & Crores formatting), **$ USD**, **€ EUR**, **£ GBP**, and **AED** in real time.
- Dynamic currency prefixes across all sliders, input fields, tables, charts, and downloadable image cards.
- Live **Amount in Words** generator supporting both Indian numbering (Lakhs/Crores) and International Western notation (Millions/Billions).

---

### 🎨 7. Native iOS Design System & PWA Architecture
- **iOS Sliding Segmented Controls** — Spring physics (`cubic-bezier(0.34, 1.56, 0.64, 1)`), capsule pill geometry, and tactile active scaling.
- **Mobile Swipe Gestures** — Natural horizontal swiping between tabs on touch devices with light haptic feedback.
- **Smart Pull-to-Refresh** — Custom iOS-style pull-down indicator to check for updates and refresh caches on mobile.
- **Floating EMI Quick-Pill** — Compact summary badge on mobile screens allowing quick jumping to calculation results.
- **Dual Themes** — OLED true-black dark mode and clean Apple-inspired light mode with persistent preference storage.
- **100% Offline via Service Worker (`sw.js`)** — Network-first navigation ensures immediate updates upon deployment while caching all assets offline.
- **Strict Content Security Policy (CSP)** — Zero inline scripts/event handlers; fully compliant with enterprise security standards.
- **Privacy First** — 100% client-side calculation; zero server dependencies, zero trackers, and zero personal data collection.

---

## 📲 How to Install on iOS (iPhone & iPad)

1. Open **[https://mohanlalam.github.io/emi-calculator/](https://mohanlalam.github.io/emi-calculator/)** in **Safari**.
2. Tap the **Share** button `⎋` in Safari's bottom toolbar.
3. Scroll down and tap **"Add to Home Screen"** ➕.
4. Tap **"Add"** in the top-right corner.
5. The **EMI Calc** icon will appear on your home screen and run standalone in full-screen without browser chrome!

> **Android / Chrome users**: Tap the 3-dots menu → *"Install App"* or *"Add to Home Screen"*.

---

## 🛠️ Tech Stack

| Layer | Implementation |
|---|---|
| **Markup** | Semantic HTML5 with ARIA accessibility roles |
| **Styling** | Vanilla CSS3 (Custom design tokens, glassmorphism, responsive grid & flexbox) |
| **Logic** | Vanilla ES6+ JavaScript — zero dependencies, zero build step |
| **Visuals** | Custom High-DPR 2D Canvas Engines (Area charts, bar charts, dynamic donuts) |
| **PWA** | Web App Manifest + Service Worker with automated cache management (`sw.js`) |
| **Typography** | Inter & Outfit (Variable sans-serif typography) |

---

## 📁 Project Structure

```
├── index.html            # Complete SPA markup (all 5 core tabs and modals)
├── styles.css            # Complete design system, themes, and animations
├── app.js                # Core business logic, calculations, charts, gestures, & storage
├── sw.js                 # Service worker cache strategy & offline PWA management
├── manifest.json         # PWA configuration, theme colors, and icons
├── apple-touch-icon.png  # High-resolution iOS home screen icon (180×180)
├── icon-192.png          # Android home screen icon
├── icon-512.png          # High-res splash & install prompt icon
└── README.md             # Project documentation & feature manual
```

---

## 🔒 Privacy & Security

This application runs **entirely in your local browser sandbox**. No user input, loan amount, investment detail, or calculation data is ever transmitted across the network. All preferences and tranche entries are saved securely in your browser's private `localStorage`.
