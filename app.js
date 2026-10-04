// Formatters
const fmt = n => '₹' + (n > 0 && n < 1 ? n.toFixed(2) : Math.round(n).toLocaleString('en-IN'));
const fmtC = n => n >= 1e7 ? '₹' + (n/1e7).toFixed(2) + ' Cr' : n >= 1e5 ? '₹' + (n/1e5).toFixed(2) + ' L' : fmt(n);

// ── Slider fill & tooltip engine ──────────────────────────────
function updateSliderFill(sl) {
  if (!sl) return;
  const min = parseFloat(sl.min) || 0;
  const max = parseFloat(sl.max) || 100;
  const val = parseFloat(sl.value) || 0;
  const pct = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
  sl.style.backgroundImage = `linear-gradient(90deg, #00e5a0 ${pct}%, var(--slider-track) ${pct}%)`;

  // Update tooltip
  const wrap = sl.closest('.sl-wrap');
  if (!wrap) return;
  let tip = wrap.querySelector('.sl-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'sl-tooltip';
    wrap.insertBefore(tip, sl);
  }
  // Format the tooltip label
  tip.textContent = formatSliderVal(sl, val);

  // Measure track width
  const trackW = sl.offsetWidth || sl.getBoundingClientRect().width;
  if (trackW <= 0) return; // Slider is currently in a hidden tab/subtab

  const thumbRadius = 11;
  const thumbCenter = (pct / 100) * (trackW - thumbRadius * 2) + thumbRadius;

  // Clamp tooltip within container edges so it never clips or pokes outside card edges
  const tipWidth = tip.offsetWidth || 56;
  const halfTip = tipWidth / 2;
  const minLeft = halfTip;
  const maxLeft = trackW - halfTip;
  const clampedLeft = Math.max(minLeft, Math.min(maxLeft, thumbCenter));

  tip.style.left = clampedLeft + 'px';

  // Offset the pointer arrow if the bubble is clamped near edges
  const arrowOffset = Math.round(thumbCenter - clampedLeft);
  tip.style.setProperty('--arrow-offset', `${arrowOffset}px`);
}

function formatSliderVal(sl, val) {
  const wrap = sl.closest('.field, div');
  const pfx = wrap && wrap.querySelector('.inp-pfx');
  if (pfx && pfx.textContent.includes('₹')) {
    if (val >= 1e7) {
      const cr = val / 1e7;
      return '₹' + (cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)) + ' Cr';
    }
    if (val >= 1e5) {
      const lk = val / 1e5;
      return '₹' + (lk % 1 === 0 ? lk.toFixed(0) : lk.toFixed(1)) + ' L';
    }
    if (val >= 1000) return '₹' + (val / 1000).toFixed(0) + 'K';
    return '₹' + Math.round(val).toLocaleString('en-IN');
  }
  // % sliders
  const sfx = wrap && wrap.querySelector('.inp-sfx');
  if (sfx) {
    const unit = sfx.textContent.trim();
    return val + (unit === '%' ? '%' : ' ' + unit);
  }
  return val;
}

function initAllSliders() {
  document.querySelectorAll('input[type=range]').forEach(sl => {
    updateSliderFill(sl);

    const setDragState = (dragging) => {
      const wrap = sl.closest('.sl-wrap');
      if (wrap) {
        wrap.classList.toggle('dragging', dragging);
        if (dragging) updateSliderFill(sl);
      }
    };

    sl.addEventListener('pointerdown', () => setDragState(true));
    sl.addEventListener('mousedown', () => setDragState(true));
    sl.addEventListener('touchstart', () => setDragState(true), { passive: true });

    sl.addEventListener('input', () => {
      setDragState(true);
      updateSliderFill(sl);
      triggerHaptic('light');
    });
    sl.addEventListener('change', () => {
      setDragState(false);
      updateSliderFill(sl);
      triggerHaptic('medium');
    });
  });

  // Global release handlers ensure tooltips NEVER get stuck visible
  const clearAllDragging = () => {
    document.querySelectorAll('.sl-wrap.dragging').forEach(w => w.classList.remove('dragging'));
  };
  window.addEventListener('pointerup', clearAllDragging);
  window.addEventListener('pointercancel', clearAllDragging);
  window.addEventListener('mouseup', clearAllDragging);
  window.addEventListener('touchend', clearAllDragging);
  window.addEventListener('touchcancel', clearAllDragging);
}

// Sync input & sliders
function i2s(sId, iId) {
  const s = document.getElementById(sId), i = document.getElementById(iId);
  if (s && i) {
    i.value = s.value;
    updateSliderFill(s);
  }
  if (typeof updateTaxBenefits === 'function') updateTaxBenefits();
  savePreferences();
}
function s2i(iId, sId, mn, mx) {
  const i = document.getElementById(iId), s = document.getElementById(sId);
  if (!i || !s) return;
  let v = parseFloat(i.value);
  if (isNaN(v)) return;
  s.value = Math.min(Math.max(v, mn), mx);
  updateSliderFill(s);
  savePreferences();
}

// Donut Chart renderer
function updateDonut(id1, id2, v1, v2) {
  const t = v1 + v2;
  if (t <= 0) return;
  const C = 414; // 2 * PI * 66
  const s1 = (v1 / t) * C;
  const s2 = (v2 / t) * C;
  const e1 = document.getElementById(id1);
  const e2 = document.getElementById(id2);
  if (e1) {
    e1.setAttribute('stroke-dasharray', s1 + ' ' + (C - s1));
    e1.setAttribute('stroke-dashoffset', '0');
  }
  if (e2) {
    e2.setAttribute('stroke-dasharray', s2 + ' ' + (C - s2));
    e2.setAttribute('stroke-dashoffset', -s1);
  }
}

// Toast helper
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ─── 1. HAPTIC FEEDBACK ENGINE ───
let _lastHapticTime = 0;
function triggerHaptic(type = 'light') {
  if (!('vibrate' in navigator)) return;
  const now = performance.now();
  if (type === 'light' && now - _lastHapticTime < 50) return; // throttle slider ticks
  _lastHapticTime = now;
  try {
    if (type === 'light') navigator.vibrate(6);
    else if (type === 'medium') navigator.vibrate(12);
    else if (type === 'success') navigator.vibrate([8, 35, 12]);
  } catch (e) {}
}

// ─── 2. NUMBER COUNTER ANIMATION ENGINE ───
const _animatedValues = {};
function animateNumber(id, endVal, formatFn = fmt, duration = 280) {
  const el = document.getElementById(id);
  if (!el) return;
  if (isNaN(endVal)) { el.textContent = formatFn(0); return; }

  const startVal = _animatedValues[id] !== undefined ? _animatedValues[id] : endVal;
  _animatedValues[id] = endVal;

  if (Math.abs(endVal - startVal) < 1 || duration <= 0 || _isRestoring) {
    el.textContent = formatFn(endVal);
    return;
  }

  if (el._animFrame) cancelAnimationFrame(el._animFrame);

  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = startVal + (endVal - startVal) * ease;
    el.textContent = formatFn(current);
    if (progress < 1) {
      el._animFrame = requestAnimationFrame(update);
    } else {
      el.textContent = formatFn(endVal);
      el._animFrame = null;
    }
  }
  el._animFrame = requestAnimationFrame(update);
}

// ─── 3. SKELETON SHIMMER EFFECT ───
function triggerSkeletonShimmer() {
  const targets = document.querySelectorAll('.res-val, .pie-center-val, .tax-val, .afford-box-val');
  targets.forEach(el => el.classList.add('skeleton'));
  setTimeout(() => {
    targets.forEach(el => el.classList.remove('skeleton'));
  }, 320);
}

// ─── 4. FLOATING EMI PILL CONTROLLER ───
function updateFloatingPill(emiVal) {
  const pillVal = document.getElementById('pill-emi-val');
  if (pillVal) pillVal.textContent = fmt(emiVal);
}

function scrollToEmiResults() {
  triggerHaptic('medium');
  const resCard = document.querySelector('#tab-emi .card:nth-of-type(2)');
  if (resCard) {
    resCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function initFloatingPill() {
  const pill = document.getElementById('floating-emi-pill');
  const emiPanel = document.getElementById('tab-emi');
  if (!pill || !emiPanel) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const isEmiActive = emiPanel.classList.contains('active');
        if (!isEmiActive) {
          pill.classList.remove('visible');
          ticking = false;
          return;
        }
        const resCard = emiPanel.querySelector('.card:nth-of-type(2)');
        if (!resCard) {
          pill.classList.remove('visible');
          ticking = false;
          return;
        }
        const rect = resCard.getBoundingClientRect();
        if (rect.bottom < 80) {
          pill.classList.add('visible');
        } else {
          pill.classList.remove('visible');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ─── 5. SMART LOAN AFFORDABILITY INDICATOR ───
window._lastCalculatedEmi = 43391;
function updateAffordability(currentEmi) {
  const emi = currentEmi !== undefined ? currentEmi : (window._lastCalculatedEmi || 0);
  window._lastCalculatedEmi = emi;

  const minSal = emi > 0 ? emi / 0.40 : 0;
  const recSal = emi > 0 ? emi / 0.30 : 0;

  const minSalEl = document.getElementById('afford-min-salary');
  const recSalEl = document.getElementById('afford-rec-salary');
  if (minSalEl) minSalEl.textContent = fmt(minSal);
  if (recSalEl) recSalEl.textContent = fmt(recSal);

  const userSalaryInp = document.getElementById('user-salary-inp');
  const userSal = userSalaryInp ? parseFloat(userSalaryInp.value) || 0 : 0;

  const dtiReadout = document.getElementById('user-dti-pct');
  const dtiGauge = document.getElementById('dti-gauge-bar');
  const statusBadge = document.getElementById('afford-status-badge');

  if (userSal <= 0 || emi <= 0) {
    if (dtiReadout) dtiReadout.textContent = 'Enter salary above to calculate DTI';
    if (dtiGauge) dtiGauge.style.width = '0%';
    if (statusBadge) {
      statusBadge.textContent = 'Awaiting Salary';
      statusBadge.className = 'afford-badge badge-safe';
    }
    return;
  }

  const dtiPct = Math.round((emi / userSal) * 100);
  const clampedWidth = Math.min(100, Math.max(4, dtiPct));

  if (dtiGauge) {
    dtiGauge.style.width = clampedWidth + '%';
    if (dtiPct <= 35) {
      dtiGauge.style.background = 'linear-gradient(90deg, #00e5a0, #38bdf8)';
    } else if (dtiPct <= 45) {
      dtiGauge.style.background = 'linear-gradient(90deg, #38bdf8, #ffb930)';
    } else {
      dtiGauge.style.background = 'linear-gradient(90deg, #ffb930, #ff5f6d)';
    }
  }

  if (dtiReadout) {
    dtiReadout.textContent = `EMI is ${dtiPct}% of your monthly take-home`;
  }

  if (statusBadge) {
    if (dtiPct <= 35) {
      statusBadge.textContent = 'Safe & Approved (<35%)';
      statusBadge.className = 'afford-badge badge-safe';
    } else if (dtiPct <= 45) {
      statusBadge.textContent = 'Moderate Burden (35-45%)';
      statusBadge.className = 'afford-badge badge-mod';
    } else {
      statusBadge.textContent = 'High Debt Burden (>45%)';
      statusBadge.className = 'afford-badge badge-high';
    }
  }
}

// ─── 6. WHAT-IF SCENARIOS MATRIX ───
function updateWhatIfScenarios(P, rate, nMonths, baselineEmi, baselineTotalInt) {
  const container = document.getElementById('whatif-grid');
  if (!container || !P || !rate || !nMonths) return;

  function calcSim(pVal, annualRate, mos) {
    const r = annualRate / 100 / 12;
    if (r === 0) return { emi: pVal / mos, totInt: 0 };
    const pow = Math.pow(1 + r, mos);
    const emiVal = pVal * r * pow / (pow - 1);
    return { emi: emiVal, totInt: emiVal * mos - pVal };
  }

  // 1. Scenario Rate Drop (-0.50% p.a.)
  const rateDrop = Math.max(1, rate - 0.5);
  const simRate = calcSim(P, rateDrop, nMonths);
  const savedRateInt = Math.max(0, baselineTotalInt - simRate.totInt);

  // 2. Scenario Shorter Tenure (-5 years or -2 years if small)
  const tenureCutMonths = nMonths > 120 ? 60 : (nMonths > 48 ? 24 : 12);
  const shorterMonths = Math.max(12, nMonths - tenureCutMonths);
  const simTenure = calcSim(P, rate, shorterMonths);
  const savedTenureInt = Math.max(0, baselineTotalInt - simTenure.totInt);

  // 3. Scenario Extra Prepayment (+₹5,000 / month)
  const extraPmt = 5000;
  let simBal = P;
  let prepayMonths = 0;
  let prepayTotalInt = 0;
  const r = rate / 100 / 12;
  while (simBal > 0.01 && prepayMonths < nMonths * 2) {
    prepayMonths++;
    const ip = simBal * r;
    prepayTotalInt += ip;
    const pp = Math.min((baselineEmi + extraPmt) - ip, simBal);
    if (pp <= 0) break;
    simBal -= pp;
  }
  const savedPrepayInt = Math.max(0, baselineTotalInt - prepayTotalInt);
  const savedPrepayYears = Math.max(0.1, (nMonths - prepayMonths) / 12).toFixed(1);

  container.innerHTML = `
    <div class="whatif-col">
      <div class="whatif-tag">Current Baseline</div>
      <div class="whatif-emi">${fmt(baselineEmi)}</div>
      <div class="whatif-emi-lbl">Monthly EMI</div>
      <div class="whatif-meta">
        <div class="whatif-meta-row"><span>Rate:</span><b>${rate.toFixed(1)}%</b></div>
        <div class="whatif-meta-row"><span>Tenure:</span><b>${Math.floor(nMonths/12)}Y ${nMonths%12}M</b></div>
        <div class="whatif-meta-row"><span>Total Interest:</span><b>${fmtC(baselineTotalInt)}</b></div>
      </div>
    </div>

    <div class="whatif-col highlight">
      <div class="whatif-tag">Rate Cut (-0.5%)</div>
      <div class="whatif-emi">${fmt(simRate.emi)}</div>
      <div class="whatif-emi-lbl">Save ${fmt(baselineEmi - simRate.emi)}/mo</div>
      <div class="whatif-meta">
        <div class="whatif-meta-row"><span>New Rate:</span><b>${rateDrop.toFixed(1)}%</b></div>
        <div class="whatif-meta-row"><span>Total Interest:</span><b>${fmtC(simRate.totInt)}</b></div>
      </div>
      <div class="whatif-savings-chip">⚡ Saves ${fmtC(savedRateInt)} Interest</div>
    </div>

    <div class="whatif-col">
      <div class="whatif-tag">Cut Tenure (-${Math.round(tenureCutMonths/12)} Yrs)</div>
      <div class="whatif-emi">${fmt(simTenure.emi)}</div>
      <div class="whatif-emi-lbl">+${fmt(simTenure.emi - baselineEmi)}/mo higher</div>
      <div class="whatif-meta">
        <div class="whatif-meta-row"><span>New Tenure:</span><b>${Math.floor(shorterMonths/12)}Y</b></div>
        <div class="whatif-meta-row"><span>Total Interest:</span><b>${fmtC(simTenure.totInt)}</b></div>
      </div>
      <div class="whatif-savings-chip">🔥 Saves ${fmtC(savedTenureInt)} Interest</div>
    </div>

    <div class="whatif-col highlight">
      <div class="whatif-tag">+₹5,000 / Month</div>
      <div class="whatif-emi">${fmt(baselineEmi + extraPmt)}</div>
      <div class="whatif-emi-lbl">Total Monthly Outflow</div>
      <div class="whatif-meta">
        <div class="whatif-meta-row"><span>Finishes:</span><b>${savedPrepayYears} yrs early</b></div>
        <div class="whatif-meta-row"><span>Total Interest:</span><b>${fmtC(prepayTotalInt)}</b></div>
      </div>
      <div class="whatif-savings-chip">🚀 Saves ${fmtC(savedPrepayInt)} Interest</div>
    </div>
  `;
}

// ─── 7. AMORTIZATION CANVAS CHART VISUALIZER ───
window._lastYearlyAmortData = null;
function drawAmortizationChart(yearlyData) {
  const canvas = document.getElementById('amort-chart');
  if (!canvas || !yearlyData || yearlyData.length === 0) return;
  const ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 760;
  const height = 230;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const padding = { top: 22, right: 24, bottom: 28, left: 54 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  let maxBarSum = 0;
  let maxBal = 0;
  yearlyData.forEach(d => {
    const sum = (d.principal || 0) + (d.interest || 0);
    if (sum > maxBarSum) maxBarSum = sum;
    if (d.balance > maxBal) maxBal = d.balance;
  });
  if (maxBarSum <= 0) maxBarSum = 1;
  if (maxBal <= 0) maxBal = maxBarSum;

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#8b9cc4' : '#4a5878';

  // Horizontal Grid Lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.font = '10px Inter, sans-serif';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'right';

  for (let i = 0; i <= 3; i++) {
    const y = padding.top + (chartH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const val = maxBarSum * (1 - i / 3);
    const label = val >= 1e7 ? (val/1e7).toFixed(1) + 'Cr' : val >= 1e5 ? (val/1e5).toFixed(0) + 'L' : (val/1000).toFixed(0) + 'k';
    ctx.fillText('₹' + label, padding.left - 8, y + 3);
  }

  // Stacked Bars (Principal + Interest)
  const count = yearlyData.length;
  const barWidth = Math.max(4, Math.min(26, (chartW / count) * 0.65));
  const step = chartW / count;

  yearlyData.forEach((d, i) => {
    const x = padding.left + i * step + (step - barWidth) / 2;
    const pHeight = ((d.principal || 0) / maxBarSum) * chartH;
    const iHeight = ((d.interest || 0) / maxBarSum) * chartH;
    const yBase = padding.top + chartH;

    // Principal (Green)
    const pGrad = ctx.createLinearGradient(0, yBase - pHeight, 0, yBase);
    pGrad.addColorStop(0, '#00e5a0');
    pGrad.addColorStop(1, '#009966');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.rect(x, yBase - pHeight, barWidth, pHeight);
    ctx.fill();

    // Interest (Red)
    const iGrad = ctx.createLinearGradient(0, yBase - pHeight - iHeight, 0, yBase - pHeight);
    iGrad.addColorStop(0, '#ff5f6d');
    iGrad.addColorStop(1, '#d93848');
    ctx.fillStyle = iGrad;
    ctx.beginPath();
    ctx.rect(x, yBase - pHeight - iHeight, barWidth, iHeight);
    ctx.fill();

    // Year Label
    if (count <= 12 || (i % Math.ceil(count / 10) === 0) || i === count - 1) {
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.fillText('Y' + d.year, x + barWidth / 2, yBase + 16);
    }
  });

  // Balance Curve (Cyan line)
  ctx.beginPath();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;

  yearlyData.forEach((d, i) => {
    const x = padding.left + i * step + step / 2;
    const y = padding.top + chartH - (d.balance / maxBal) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// ─── 8. SIP WEALTH CANVAS CHART VISUALIZER ───
window._lastSipChartData = null;
function drawSipChart(sipData) {
  const canvas = document.getElementById('sip-chart');
  if (!canvas || !sipData || sipData.length === 0) return;
  const ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 760;
  const height = 230;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const padding = { top: 22, right: 24, bottom: 28, left: 54 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  let maxVal = 0;
  sipData.forEach(d => {
    if (d.val > maxVal) maxVal = d.val;
  });
  if (maxVal <= 0) maxVal = 1;

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#8b9cc4' : '#4a5878';

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.font = '10px Inter, sans-serif';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'right';

  for (let i = 0; i <= 3; i++) {
    const y = padding.top + (chartH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const val = maxVal * (1 - i / 3);
    const label = val >= 1e7 ? (val/1e7).toFixed(1) + 'Cr' : val >= 1e5 ? (val/1e5).toFixed(0) + 'L' : (val/1000).toFixed(0) + 'k';
    ctx.fillText('₹' + label, padding.left - 8, y + 3);
  }

  const count = sipData.length;
  const barWidth = Math.max(4, Math.min(26, (chartW / count) * 0.65));
  const step = chartW / count;

  sipData.forEach((d, i) => {
    const x = padding.left + i * step + (step - barWidth) / 2;
    const invHeight = ((d.invested || 0) / maxVal) * chartH;
    const gainHeight = ((d.gains || 0) / maxVal) * chartH;
    const yBase = padding.top + chartH;

    // Invested (Green)
    const pGrad = ctx.createLinearGradient(0, yBase - invHeight, 0, yBase);
    pGrad.addColorStop(0, '#00e5a0');
    pGrad.addColorStop(1, '#009966');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.rect(x, yBase - invHeight, barWidth, invHeight);
    ctx.fill();

    // Gains (Red/Pink)
    const iGrad = ctx.createLinearGradient(0, yBase - invHeight - gainHeight, 0, yBase - invHeight);
    iGrad.addColorStop(0, '#ff5f6d');
    iGrad.addColorStop(1, '#d93848');
    ctx.fillStyle = iGrad;
    ctx.beginPath();
    ctx.rect(x, yBase - invHeight - gainHeight, barWidth, gainHeight);
    ctx.fill();

    if (count <= 12 || (i % Math.ceil(count / 10) === 0) || i === count - 1) {
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.fillText('Y' + d.year, x + barWidth / 2, yBase + 16);
    }
  });
}

// ─── 9. SHARE CALCULATION AS IMAGE (CANVAS HD) ───
function shareAsImage(type = 'emi') {
  triggerHaptic('medium');
  if (type === 'current') {
    const activeTab = document.querySelector('.tabbar-item.active')?.dataset.tab || 'emi';
    type = activeTab === 'sip' ? 'sip' : 'emi';
  }
  const isEmi = type !== 'sip';

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  // Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
  bgGrad.addColorStop(0, '#060e1e');
  bgGrad.addColorStop(0.5, '#0a162b');
  bgGrad.addColorStop(1, '#050c18');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 630);

  // Radial Glows
  const radial1 = ctx.createRadialGradient(250, 150, 20, 250, 150, 350);
  radial1.addColorStop(0, 'rgba(0, 229, 160, 0.12)');
  radial1.addColorStop(1, 'transparent');
  ctx.fillStyle = radial1;
  ctx.fillRect(0, 0, 1200, 630);

  const radial2 = ctx.createRadialGradient(950, 480, 20, 950, 480, 400);
  radial2.addColorStop(0, 'rgba(59, 158, 255, 0.08)');
  radial2.addColorStop(1, 'transparent');
  ctx.fillStyle = radial2;
  ctx.fillRect(0, 0, 1200, 630);

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, 1160, 590);

  // Brand Header
  ctx.fillStyle = '#00e5a0';
  ctx.font = '800 20px Inter, sans-serif';
  ctx.fillText('⚡ EMI & FINANCE CALCULATOR', 60, 75);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 38px Inter, sans-serif';
  ctx.fillText(isEmi ? 'Home Loan EMI Breakdown' : 'SIP Wealth Growth Report', 60, 125);

  if (isEmi) {
    const emi = document.getElementById('e-emi')?.textContent || '₹0';
    const p = document.getElementById('e-p')?.textContent || '₹0';
    const totalInt = document.getElementById('e-int')?.textContent || '₹0';
    const tot = document.getElementById('e-tot')?.textContent || '₹0';
    const rate = (document.getElementById('er-i')?.value || '8.5') + '%';
    const yrs = (document.getElementById('eyr-i')?.value || '20') + ' Years';

    // Hero Monthly EMI Card
    ctx.fillStyle = 'rgba(0, 229, 160, 0.08)';
    ctx.strokeStyle = 'rgba(0, 229, 160, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(60, 160, 500, 160);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8b9cc4';
    ctx.font = '700 16px Inter, sans-serif';
    ctx.fillText('MONTHLY EMI (OUTFLOW)', 90, 205);

    ctx.fillStyle = '#00e5a0';
    ctx.font = '900 56px Inter, sans-serif';
    ctx.fillText(emi, 90, 275);

    const stats = [
      { label: 'Principal Loan Amount', val: p, color: '#38bdf8' },
      { label: 'Total Interest Payable', val: totalInt, color: '#ff5f6d' },
      { label: 'Total Repayment Amount', val: tot, color: '#ffffff' },
      { label: 'Loan Terms', val: `${rate} @ ${yrs}`, color: '#ffb930' }
    ];

    stats.forEach((s, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 590 + col * 270;
      const y = 160 + row * 82;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.rect(x, y, 250, 72);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#8b9cc4';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.fillText(s.label, x + 18, y + 28);

      ctx.fillStyle = s.color;
      ctx.font = '800 22px Inter, sans-serif';
      ctx.fillText(s.val, x + 18, y + 56);
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(60, 360, 1080, 180);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.strokeRect(60, 360, 1080, 180);

    ctx.fillStyle = '#f0f4ff';
    ctx.font = '700 20px Inter, sans-serif';
    ctx.fillText('Financial Assessment Summary', 90, 405);

    ctx.fillStyle = '#8b9cc4';
    ctx.font = '500 15px Inter, sans-serif';
    ctx.fillText('• Recommended Net Monthly Income: ' + (document.getElementById('afford-rec-salary')?.textContent || '—'), 90, 445);
    ctx.fillText('• First Year Est. Tax Deductions: ' + (document.getElementById('tax-total-savings')?.textContent || '—'), 90, 475);
    ctx.fillText('• Calculated on: ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), 90, 505);

  } else {
    const sTot = document.getElementById('s-tot')?.textContent || '₹0';
    const sInv = document.getElementById('s-inv')?.textContent || '₹0';
    const sRet = document.getElementById('s-ret')?.textContent || '₹0';
    const sMul = document.getElementById('s-mul')?.textContent || '0.00x';
    const sMon = fmt(document.getElementById('sa-i')?.value || 10000);
    const sRate = (document.getElementById('sr-i')?.value || '12') + '% p.a.';
    const sTenure = (document.getElementById('st-i')?.value || '15') + ' Yrs';

    ctx.fillStyle = 'rgba(0, 229, 160, 0.08)';
    ctx.strokeStyle = 'rgba(0, 229, 160, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(60, 160, 500, 160);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8b9cc4';
    ctx.font = '700 16px Inter, sans-serif';
    ctx.fillText('ESTIMATED MATURITY WEALTH', 90, 205);

    ctx.fillStyle = '#00e5a0';
    ctx.font = '900 56px Inter, sans-serif';
    ctx.fillText(sTot, 90, 275);

    const stats = [
      { label: 'Total Invested Amount', val: sInv, color: '#38bdf8' },
      { label: 'Accrued Capital Gains', val: sRet, color: '#00e5a0' },
      { label: 'Wealth Multiplier', val: sMul, color: '#ffb930' },
      { label: 'SIP Plan', val: `${sMon}/mo • ${sRate}`, color: '#ffffff' }
    ];

    stats.forEach((s, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 590 + col * 270;
      const y = 160 + row * 82;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.rect(x, y, 250, 72);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#8b9cc4';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.fillText(s.label, x + 18, y + 28);

      ctx.fillStyle = s.color;
      ctx.font = '800 22px Inter, sans-serif';
      ctx.fillText(s.val, x + 18, y + 56);
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(60, 360, 1080, 180);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.strokeRect(60, 360, 1080, 180);

    ctx.fillStyle = '#f0f4ff';
    ctx.font = '700 20px Inter, sans-serif';
    ctx.fillText('Wealth Compounding Insights', 90, 405);

    ctx.fillStyle = '#8b9cc4';
    ctx.font = '500 15px Inter, sans-serif';
    ctx.fillText('• Duration: ' + sTenure + ' of disciplined monthly investing', 90, 445);
    ctx.fillText('• Power of Compounding: Gains represent ' + (document.getElementById('s-gain-pct')?.textContent || '—') + ' of final portfolio', 90, 475);
    ctx.fillText('• Generated on: ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), 90, 505);
  }

  ctx.fillStyle = '#4a5780';
  ctx.font = '500 14px Inter, sans-serif';
  ctx.fillText('Created with Smart EMI & Finance Calculator PWA', 60, 580);

  canvas.toBlob(blob => {
    if (!blob) return;
    const fileName = isEmi ? 'emi-breakdown-report.png' : 'sip-wealth-report.png';
    const file = new File([blob], fileName, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: isEmi ? 'Loan EMI Breakdown' : 'SIP Wealth Report',
        text: 'Check out my calculation from EMI & Finance Calculator'
      }).catch(err => {
        if (err.name !== 'AbortError') downloadBlob(blob, fileName);
      });
    } else {
      downloadBlob(blob, fileName);
    }
  }, 'image/png');
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Image downloaded!');
}

// ─── 10. SWIPE GESTURES FOR MOBILE TABS ───
function initSwipeGestures() {
  const tabs = ['emi', 'sip', 'compare-loan', 'investments', 'avg'];
  let startX = 0, startY = 0, startTime = 0;

  document.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    const target = e.target;
    if (target.closest('input[type=range], input, textarea, .tbl-scroll, .chart-canvas-wrap')) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!startX || !startTime) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const elapsed = Date.now() - startTime;

    startX = 0;
    startY = 0;
    startTime = 0;

    if (Math.abs(deltaX) > 65 && Math.abs(deltaY) < 45 && elapsed < 450) {
      const currentActive = document.querySelector('.tabbar-item.active')?.dataset.tab || 'emi';
      const currentIndex = tabs.indexOf(currentActive);
      if (currentIndex === -1) return;

      if (deltaX < 0 && currentIndex < tabs.length - 1) {
        switchTab(tabs[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        switchTab(tabs[currentIndex - 1]);
      }
    }
  }, { passive: true });
}

// Tab Switching (Synchronizes desktop tabs and mobile bottom bar)
function switchTab(tabId) {
  if (!tabId) return;
  // Mobile tabs
  document.querySelectorAll('.tabbar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabId);
  });
  // Desktop tabs
  document.querySelectorAll('.nav-tab-btn').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabId);
  });
  // Panels
  document.querySelectorAll('.calc-panel').forEach(el => {
    el.classList.toggle('active', el.id === 'tab-' + tabId);
  });

  if (tabId === 'compare-loan') cmpLoan();
  if (tabId === 'investments') cmp();
  if (tabId === 'avg') calcAvg();

  // Re-sync and position all sliders inside the newly visible panel
  const activePanel = document.getElementById('tab-' + tabId);
  if (activePanel) {
    (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout)(() => {
      activePanel.querySelectorAll('input[type=range]').forEach(sl => updateSliderFill(sl));
    });
  }

  // Redraw canvas charts after panel becomes visible
  if (tabId === 'emi') {
    setTimeout(() => { if (window._lastYearlyAmortData) drawAmortizationChart(window._lastYearlyAmortData); }, 60);
  } else if (tabId === 'sip') {
    setTimeout(() => { if (window._lastSipChartData) drawSipChart(window._lastSipChartData); }, 60);
  }

  // Gentle haptic feedback
  if (!_isRestoring) {
    triggerHaptic('medium');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    savePreferences();
  }
}

document.querySelectorAll('.tabbar-item, .nav-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Investment Subnav
let currentInvestSub = 'compare';
function switchInvestSub(type, el) {
  currentInvestSub = type;
  if (el && el.parentElement) {
    el.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
  } else {
    document.querySelectorAll('.subnav-pills .chip').forEach(c => {
      const isMatch = (type === 'compare' && c.textContent.includes('Compare')) ||
                      (type === 'lumpsum' && c.textContent.includes('Lumpsum')) ||
                      (type === 'fd' && c.textContent.includes('Fixed Deposit')) ||
                      (type === 'rd' && c.textContent.includes('Recurring Deposit'));
      c.classList.toggle('active', isMatch);
    });
  }
  const cmpEl = document.getElementById('invest-sub-compare');
  const lmpEl = document.getElementById('invest-sub-lumpsum');
  const fdEl = document.getElementById('invest-sub-fd');
  const rdEl = document.getElementById('invest-sub-rd');
  if (cmpEl) cmpEl.style.display = type === 'compare' ? 'block' : 'none';
  if (lmpEl) lmpEl.style.display = type === 'lumpsum' ? 'block' : 'none';
  if (fdEl) fdEl.style.display = type === 'fd' ? 'block' : 'none';
  if (rdEl) rdEl.style.display = type === 'rd' ? 'block' : 'none';
  if (type === 'compare') cmp();
  if (type === 'lumpsum') cl();
  if (type === 'fd') cf();
  if (type === 'rd') cr();

  // Re-sync sliders in the newly visible investment sub-panel
  (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout)(() => {
    const activeSub = document.getElementById('invest-sub-' + type);
    if (activeSub) {
      activeSub.querySelectorAll('input[type=range]').forEach(sl => updateSliderFill(sl));
    }
  });

  savePreferences();
}

// Accordion Toggle
function toggleAccordion(id) {
  const acc = document.getElementById(id);
  if (acc) {
    acc.classList.toggle('active');
    savePreferences();
  }
}

// Quick preset helpers
function setLoanAmount(val) {
  document.getElementById('ep-i').value = val;
  const sl = document.getElementById('ep-s');
  if (sl) { sl.value = val; updateSliderFill(sl); }
  ce();
  savePreferences();
}
function setLoanRate(val) {
  document.getElementById('er-i').value = val;
  const sl = document.getElementById('er-s');
  if (sl) { sl.value = val; updateSliderFill(sl); }
  ce();
  savePreferences();
}
function setLoanTenure(yrs) {
  document.getElementById('eyr-i').value = yrs;
  document.getElementById('emo-i').value = 0;
  const sly = document.getElementById('eyr-s');
  const slm = document.getElementById('emo-s');
  if (sly) { sly.value = yrs; updateSliderFill(sly); }
  if (slm) { slm.value = 0; updateSliderFill(slm); }
  ce();
  savePreferences();
}

function setSipMonthly(val) {
  document.getElementById('sa-i').value = val;
  const sl = document.getElementById('sa-s');
  if (sl) { sl.value = val; updateSliderFill(sl); }
  cs();
  savePreferences();
}
function setSipRate(val) {
  document.getElementById('sr-i').value = val;
  const sl = document.getElementById('sr-s');
  if (sl) { sl.value = val; updateSliderFill(sl); }
  cs();
  savePreferences();
}
function setSipTenure(val) {
  document.getElementById('st-i').value = val;
  const sl = document.getElementById('st-s');
  if (sl) { sl.value = val; updateSliderFill(sl); }
  cs();
  savePreferences();
}

// ─── EMI CALCULATOR WITH PREPAYMENT SIMULATION ───
let emiMode = 'yr';
function setEmiMode(m, el) {
  el.closest('.toggle-pill').querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  emiMode = m;
  ce();
  savePreferences();
}

const loanPresets = {
  home: { r: 8.5, yr: 20, mo: 0 },
  car: { r: 9.0, yr: 7, mo: 0 },
  personal: { r: 14.0, yr: 5, mo: 0 }
};

let currentLoanType = 'home';
let currentTaxSlab = 30; // 10%, 20%, 30%
function setLoan(type, el) {
  currentLoanType = type;
  document.querySelectorAll('#tab-emi .chip-row .chip').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  const p = loanPresets[type];
  if (p) {
    document.getElementById('er-i').value = p.r;
    document.getElementById('eyr-i').value = p.yr;
    document.getElementById('emo-i').value = p.mo;
    const erS = document.getElementById('er-s');
    const yrS = document.getElementById('eyr-s');
    const moS = document.getElementById('emo-s');
    if (erS) { erS.value = p.r; updateSliderFill(erS); }
    if (yrS) { yrS.value = p.yr; updateSliderFill(yrS); }
    if (moS) { moS.value = p.mo; updateSliderFill(moS); }
  }
  ce();
  if (typeof updateTaxBenefits === 'function') updateTaxBenefits();
  savePreferences();
}

function ce() {
  const P = document.getElementById('ep-i') ? +document.getElementById('ep-i').value : +document.getElementById('ep-s').value;
  const annualRate = document.getElementById('er-i') ? +document.getElementById('er-i').value : +document.getElementById('er-s').value;
  const r = annualRate / 100 / 12;
  const yr = document.getElementById('eyr-i') ? +document.getElementById('eyr-i').value : +document.getElementById('eyr-s').value;
  const mo = document.getElementById('emo-i') ? +document.getElementById('emo-i').value : +document.getElementById('emo-s').value;
  const n = yr * 12 + mo;

  const extraMonthly = parseFloat(document.getElementById('prepay-monthly')?.value) || 0;
  const extraYearly = parseFloat(document.getElementById('prepay-yearly')?.value) || 0;

  if (isNaN(P) || P < 100 || isNaN(n) || n <= 0 || isNaN(r) || r < 0) {
    document.getElementById('e-emi').textContent = '₹0';
    document.getElementById('e-p').textContent = '₹0';
    document.getElementById('e-int').textContent = '₹0';
    document.getElementById('e-tot').textContent = '₹0';
    document.getElementById('e-int-pct').textContent = '0%';
    document.getElementById('ei-pct-lbl').textContent = '0%';
    document.getElementById('ep-pct-lbl').textContent = '100%';
    updateDonut('ep-arc', 'ei-arc', 0, 0);
    document.getElementById('e-tbody').innerHTML = '';
    const prepayBox = document.getElementById('prepay-summary');
    if (prepayBox) prepayBox.style.display = 'none';
    return;
  }

  let emi, tot, totalInt;
  if (r === 0) {
    emi = P / n;
    tot = P;
    totalInt = 0;
  } else {
    const pow = Math.pow(1 + r, n);
    emi = P * r * pow / (pow - 1);
    tot = emi * n;
    totalInt = tot - P;
  }

  animateNumber('e-emi', emi);
  animateNumber('e-p', P);
  animateNumber('e-int', totalInt);
  animateNumber('e-tot', tot);

  updateFloatingPill(emi);
  updateAffordability(emi);
  updateWhatIfScenarios(P, annualRate, n, emi, totalInt);

  const intPct = tot > 0 ? ((totalInt / tot) * 100).toFixed(0) : 0;
  const prnPct = 100 - intPct;
  document.getElementById('e-int-pct').textContent = intPct + '%';
  document.getElementById('ei-pct-lbl').textContent = intPct + '%';
  document.getElementById('ep-pct-lbl').textContent = prnPct + '%';

  updateDonut('ep-arc', 'ei-arc', P, Math.max(totalInt, 0));

  // Prepayment simulation vs Standard
  let actualMonths = 0;
  let actualTotalInt = 0;
  let hasPrepay = extraMonthly > 0 || extraYearly > 0;

  let simBal = P;
  for (let m = 1; m <= n * 2; m++) {
    if (simBal <= 0.01) break;
    actualMonths++;
    const ip = simBal * r;
    actualTotalInt += ip;
    let payment = emi + extraMonthly;
    if (m % 12 === 0) payment += extraYearly;
    const pp = Math.min(payment - ip, simBal);
    if (pp <= 0) break; // Guard against negative amortization infinite loops
    simBal -= pp;
  }

  const prepayBox = document.getElementById('prepay-summary');
  if (hasPrepay && actualMonths < n) {
    prepayBox.style.display = 'grid';
    const savedInt = Math.max(0, totalInt - actualTotalInt);
    const savedMonths = Math.max(0, n - actualMonths);
    const savedY = Math.floor(savedMonths / 12);
    const savedM = savedMonths % 12;
    let timeStr = '';
    if (savedY > 0) timeStr += `${savedY} yr${savedY > 1 ? 's' : ''} `;
    if (savedM > 0) timeStr += `${savedM} mo${savedM > 1 ? 's' : ''}`;

    document.getElementById('prepay-saved-int').textContent = fmt(savedInt);
    document.getElementById('prepay-saved-time').textContent = timeStr || 'Same';
  } else {
    prepayBox.style.display = 'none';
  }

  // Pre-calculate yearly data for the Amortization Chart
  const yearlyChartData = [];
  let chartBal = P;
  let chartMonth = 0;
  let cy = 1;
  while (chartMonth < n && chartBal > 0.01) {
    let cyp = 0, cyi = 0;
    for (let cm = 0; cm < 12; cm++) {
      if (chartBal <= 0.01) break;
      chartMonth++;
      const ip = chartBal * r;
      let pmt = emi + extraMonthly;
      if (chartMonth % 12 === 0) pmt += extraYearly;
      const pp = Math.min(pmt - ip, chartBal);
      cyi += ip;
      cyp += pp;
      chartBal -= pp;
    }
    yearlyChartData.push({ year: cy, principal: cyp, interest: cyi, balance: Math.max(0, chartBal) });
    cy++;
  }
  window._lastYearlyAmortData = yearlyChartData;
  drawAmortizationChart(yearlyChartData);

  // Render Amortization Table
  const tb = document.getElementById('e-tbody');
  tb.innerHTML = '';

  let bal = P;
  if (emiMode === 'yr') {
    let currMonth = 0;
    let y = 1;
    const baseDate = new Date();
    baseDate.setDate(1);

    while (currMonth < n && bal > 0.01) {
      let yp = 0, yi = 0, yPay = 0;
      let mInYear = 0;
      let monthRowsHtml = '';

      for (let m = 0; m < 12; m++) {
        if (bal <= 0.01) break;
        currMonth++;
        mInYear++;
        const ip = bal * r;
        let pmt = emi + extraMonthly;
        if (currMonth % 12 === 0) pmt += extraYearly;
        const pp = Math.min(pmt - ip, bal);
        yi += ip;
        yp += pp;
        yPay += (pp + ip);
        bal -= pp;

        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + currMonth - 1, 1);
        const dStr = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthRowsHtml += `<tr class="month-subrow">
          <td>${dStr}</td>
          <td class="tg">${fmt(pp)}</td>
          <td class="tr">${fmt(ip)}</td>
          <td>${fmt(pp + ip)}</td>
          <td class="tb">${fmt(Math.max(0, bal))}</td>
        </tr>`;
      }

      tb.innerHTML += `
        <tr class="year-row" id="yrow-${y}" onclick="toggleYearAmortization(${y})" title="Click to view 12 months details">
          <td><span class="expand-chevron">▶</span> Year ${y} <span style="font-size:0.7rem;color:var(--text3)">(${mInYear} mos)</span></td>
          <td class="tg">${fmt(yp)}</td>
          <td class="tr">${fmt(yi)}</td>
          <td>${fmt(yPay)}</td>
          <td class="tb">${fmt(Math.max(0, bal))}</td>
        </tr>
        <tbody id="ymonths-${y}" style="display:none">
          ${monthRowsHtml}
        </tbody>
      `;
      y++;
    }
  } else {
    const baseDate = new Date();
    baseDate.setDate(1);
    for (let m = 1; m <= n; m++) {
      if (bal <= 0.01) break;
      const ip = bal * r;
      let pmt = emi + extraMonthly;
      if (m % 12 === 0) pmt += extraYearly;
      const pp = Math.min(pmt - ip, bal);
      bal -= pp;
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + m - 1, 1);
      const dStr = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      tb.innerHTML += `<tr>
        <td>${dStr}</td>
        <td class="tg">${fmt(pp)}</td>
        <td class="tr">${fmt(ip)}</td>
        <td>${fmt(pp + ip)}</td>
        <td class="tb">${fmt(Math.max(0, bal))}</td>
      </tr>`;
    }
  }
  savePreferences();
}

// ─── SIP CALCULATOR ───
function cs() {
  const M = document.getElementById('sa-i') ? +document.getElementById('sa-i').value : +document.getElementById('sa-s').value;
  const r = (document.getElementById('sr-i') ? +document.getElementById('sr-i').value : +document.getElementById('sr-s').value) / 100 / 12;
  const yr = document.getElementById('st-i') ? +document.getElementById('st-i').value : +document.getElementById('st-s').value;
  const su = (document.getElementById('ss-i') ? +document.getElementById('ss-i').value : +document.getElementById('ss-s').value) / 100;

  if (isNaN(M) || M <= 0 || isNaN(yr) || yr <= 0 || isNaN(r) || r < 0) {
    document.getElementById('s-tot').textContent = '₹0';
    document.getElementById('s-inv').textContent = '₹0';
    document.getElementById('s-ret').textContent = '₹0';
    document.getElementById('s-mul').textContent = '0.00x';
    document.getElementById('s-gain-pct').textContent = '0%';
    updateDonut('si-arc', 'sr-arc', 0, 0);
    const tb = document.getElementById('s-tbody');
    if (tb) tb.innerHTML = '';
    return;
  }

  let inv = 0, corpus = 0, monthly = M;
  for (let y = 0; y < yr; y++) {
    for (let m = 0; m < 12; m++) {
      inv += monthly;
      corpus = (corpus + monthly) * (1 + r);
    }
    monthly *= (1 + su);
  }
  const ret = corpus - inv;
  animateNumber('s-tot', corpus, fmtC);
  animateNumber('s-inv', inv);
  animateNumber('s-ret', ret);
  document.getElementById('s-mul').textContent = inv > 0 ? (corpus / inv).toFixed(2) + 'x' : '0.00x';

  const retPct = corpus > 0 ? ((ret / corpus) * 100).toFixed(0) : 0;
  document.getElementById('s-gain-pct').textContent = retPct + '%';
  updateDonut('si-arc', 'sr-arc', inv, Math.max(ret, 0));

  let ci = 0, val = 0, mon = M;
  const tb = document.getElementById('s-tbody');
  tb.innerHTML = '';
  const sipChartData = [];
  for (let y = 1; y <= yr; y++) {
    let yi = 0;
    for (let m = 0; m < 12; m++) {
      yi += mon;
      ci += mon;
      val = (val + mon) * (1 + r);
    }
    mon *= (1 + su);
    sipChartData.push({ year: y, invested: ci, val: val, gains: Math.max(0, val - ci) });
    tb.innerHTML += `<tr>
      <td>Year ${y}</td>
      <td>${fmt(yi)}</td>
      <td>${fmt(ci)}</td>
      <td class="tb">${fmtC(val)}</td>
      <td class="tg">${fmt(val - ci)}</td>
    </tr>`;
  }
  window._lastSipChartData = sipChartData;
  drawSipChart(sipChartData);
  savePreferences();
}

// ─── FIXED DEPOSIT (FD) ───
let fdc = 4;
function setFDC(n, el) {
  el.closest('.chip-row').querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  fdc = n;
  cf();
  savePreferences();
}
function cf() {
  const P = document.getElementById('fp-i') ? +document.getElementById('fp-i').value : +document.getElementById('fp-s').value;
  const r = (document.getElementById('fr-i') ? +document.getElementById('fr-i').value : +document.getElementById('fr-s').value) / 100;
  const t = document.getElementById('ft-i') ? +document.getElementById('ft-i').value : +document.getElementById('ft-s').value;

  if (isNaN(P) || P <= 0 || isNaN(t) || t <= 0 || isNaN(r) || r < 0) {
    document.getElementById('f-mat').textContent = '₹0';
    document.getElementById('f-p').textContent = '₹0';
    document.getElementById('f-int').textContent = '₹0';
    document.getElementById('f-yld').textContent = '0.00% p.a.';
    updateDonut('fp-arc', 'fi-arc', 0, 0);
    const intPctEl = document.getElementById('f-int-pct');
    if (intPctEl) intPctEl.textContent = '—';
    return;
  }

  const A = P * Math.pow(1 + r / fdc, fdc * t);
  const int = A - P;
  const eff = (Math.pow(1 + r / fdc, fdc) - 1) * 100;

  document.getElementById('f-mat').textContent = fmt(A);
  document.getElementById('f-p').textContent = fmt(P);
  document.getElementById('f-int').textContent = fmt(int);
  document.getElementById('f-yld').textContent = eff.toFixed(2) + '% p.a.';
  updateDonut('fp-arc', 'fi-arc', P, int);
  const intPctEl = document.getElementById('f-int-pct');
  if (intPctEl) intPctEl.textContent = A > 0 ? ((int / A) * 100).toFixed(0) + '%' : '—';
  savePreferences();
}

// ─── RECURRING DEPOSIT (RD) ───
function cr() {
  const M = document.getElementById('ra-i') ? +document.getElementById('ra-i').value : +document.getElementById('ra-s').value;
  const mr = (document.getElementById('rr-i') ? +document.getElementById('rr-i').value : +document.getElementById('rr-s').value) / 100 / 12;
  const yr = document.getElementById('rt-i') ? +document.getElementById('rt-i').value : +document.getElementById('rt-s').value;

  if (isNaN(M) || M <= 0 || isNaN(yr) || yr <= 0 || isNaN(mr) || mr < 0) {
    document.getElementById('r-mat').textContent = '₹0';
    document.getElementById('r-inv').textContent = '₹0';
    document.getElementById('r-int').textContent = '₹0';
    document.getElementById('r-eff').textContent = '—';
    updateDonut('ri-arc', 'rr-arc', 0, 0);
    const intPctEl = document.getElementById('r-int-pct');
    if (intPctEl) intPctEl.textContent = '—';
    return;
  }

  let bal = 0;
  for (let i = 0; i < yr * 12; i++) {
    bal = (bal + M) * (1 + mr);
  }
  const dep = M * yr * 12;
  const ret = bal - dep;
  // Effective Annual Yield (compounded annual growth rate / APY)
  const eff = (Math.pow(1 + mr, 12) - 1) * 100;

  document.getElementById('r-mat').textContent = fmt(bal);
  document.getElementById('r-inv').textContent = fmt(dep);
  document.getElementById('r-int').textContent = fmt(ret);
  document.getElementById('r-eff').textContent = eff > 0 ? eff.toFixed(2) + '% p.a.' : '—';
  updateDonut('ri-arc', 'rr-arc', dep, ret);
  const intPctEl = document.getElementById('r-int-pct');
  if (intPctEl) intPctEl.textContent = bal > 0 ? ((ret / bal) * 100).toFixed(0) + '%' : '—';
  savePreferences();
}

// ─── LUMPSUM ───
function cl() {
  const P = document.getElementById('la-i') ? +document.getElementById('la-i').value : +document.getElementById('la-s').value;
  const r = (document.getElementById('lr-i') ? +document.getElementById('lr-i').value : +document.getElementById('lr-s').value) / 100;
  const t = document.getElementById('lt-i') ? +document.getElementById('lt-i').value : +document.getElementById('lt-s').value;
  const inf = (document.getElementById('li-i') ? +document.getElementById('li-i').value : +document.getElementById('li-s').value) / 100;

  if (isNaN(P) || P <= 0 || isNaN(t) || t <= 0 || isNaN(r) || r < 0) {
    document.getElementById('l-fv').textContent = '₹0';
    document.getElementById('l-p').textContent = '₹0';
    document.getElementById('l-g').textContent = '₹0';
    document.getElementById('l-rl').textContent = '₹0';
    document.getElementById('l-ml').textContent = '0.00x';
    updateDonut('lp-arc', 'lg-arc', 0, 0);
    const gainPctEl = document.getElementById('l-gain-pct');
    if (gainPctEl) gainPctEl.textContent = '—';
    return;
  }

  const fv = P * Math.pow(1 + r, t);
  const g = fv - P;
  const rl = fv / Math.pow(1 + (isNaN(inf) ? 0 : inf), t);

  document.getElementById('l-fv').textContent = fmtC(fv);
  document.getElementById('l-p').textContent = fmt(P);
  document.getElementById('l-g').textContent = fmt(g);
  document.getElementById('l-rl').textContent = fmtC(rl);
  document.getElementById('l-ml').textContent = P > 0 ? (fv / P).toFixed(2) + 'x' : '0.00x';
  updateDonut('lp-arc', 'lg-arc', P, g);
  const gainPctEl = document.getElementById('l-gain-pct');
  if (gainPctEl) gainPctEl.textContent = fv > 0 ? ((g / fv) * 100).toFixed(0) + '%' : '—';
  savePreferences();
}

// ─── COMPARE INVESTMENTS ───
function cmp() {
  const P = document.getElementById('ca-i') ? +document.getElementById('ca-i').value : +document.getElementById('ca-s').value;
  const T = document.getElementById('ct-i') ? +document.getElementById('ct-i').value : +document.getElementById('ct-s').value;
  if (isNaN(P) || P <= 0 || isNaN(T) || T <= 0) {
    const grid = document.getElementById('cmp-grid');
    if (grid) grid.innerHTML = '<div style="color:var(--text3);padding:24px;text-align:center;grid-column:1/-1">Please enter a valid investment amount and tenure.</div>';
    const tb = document.getElementById('cmp-tbody');
    if (tb) tb.innerHTML = '';
    return;
  }
  const sm = P / (T * 12), sr = 12 / 100 / 12;
  let sc = 0;
  for (let m = 0; m < T * 12; m++) sc = (sc + sm) * (1 + sr);
  const fdA = P * Math.pow(1 + 7 / 100 / 4, 4 * T);
  const rm = P / (T * 12), rr = 6.5 / 100 / 12;
  let rb = 0;
  for (let i = 0; i < T * 12; i++) rb = (rb + rm) * (1 + rr);

  const opts = [
    { icon: '📈', name: 'SIP Equity MF', rate: '~12%', inv: sm * T * 12, val: sc, note: 'Monthly ₹' + Math.round(sm).toLocaleString('en-IN') },
    { icon: '💎', name: 'Lumpsum Equity', rate: '~12%', inv: P, val: P * Math.pow(1.12, T), note: 'One-time invest' },
    { icon: '🏦', name: 'Fixed Deposit', rate: '7%', inv: P, val: fdA, note: 'Quarterly comp.' },
    { icon: '💰', name: 'Recurring Deposit', rate: '6.5%', inv: rm * T * 12, val: rb, note: 'Monthly ₹' + Math.round(rm).toLocaleString('en-IN') },
    { icon: '📊', name: 'Debt Fund', rate: '~7%', inv: P, val: P * Math.pow(1.07, T), note: 'Debt mutual fund' },
    { icon: '🏛️', name: 'PPF Scheme', rate: '7.1%', inv: P, val: P * Math.pow(1.071, T), note: 'Govt. backed' },
  ];

  const mx = Math.max(...opts.map(o => o.val));
  opts.sort((a, b) => b.val - a.val);

  document.getElementById('cmp-grid').innerHTML = opts.map(o => `
    <div class="cmp-card${o.val === mx ? ' winner' : ''}">
      <div class="cmp-icon">${o.icon}</div>
      <div class="cmp-name">${o.name}</div>
      <div class="cmp-amt">${fmtC(o.val)}</div>
      <div class="cmp-note">${o.note}</div>
      ${o.val === mx ? '<div class="win-tag">🏆 Top Wealth Builder</div>' : ''}
    </div>`).join('');

  document.getElementById('cmp-tbody').innerHTML = opts.map(o => `
    <tr>
      <td>${o.icon} ${o.name}</td>
      <td>${fmt(o.inv)}</td>
      <td class="tg">${fmt(o.val - o.inv)}</td>
      <td class="tb">${fmtC(o.val)}</td>
      <td>${o.rate} p.a.</td>
    </tr>`).join('');
  savePreferences();
}

// ─── LOAN COMPARISON ───
const compareLoans = [
  { icon: '🏠', name: 'Home Loan', rate: 8.5, color: '#0066f5', bg: 'var(--blue-lt)' },
  { icon: '🚗', name: 'Car Loan', rate: 9.0, color: '#00b386', bg: 'var(--green-lt)' },
  { icon: '👤', name: 'Personal Loan', rate: 14.0, color: '#e8645a', bg: 'var(--red-lt)' },
];

function calcEMIval(P, r, n) {
  if (P <= 0 || n <= 0) return 0;
  const mr = r / 100 / 12;
  if (mr === 0) return P / n;
  const pow = Math.pow(1 + mr, n);
  return P * mr * pow / (pow - 1);
}

function cmpLoan() {
  const P = document.getElementById('cl-p-i') ? +document.getElementById('cl-p-i').value : +document.getElementById('cl-p-s').value;
  const T = document.getElementById('cl-t-i') ? +document.getElementById('cl-t-i').value : +document.getElementById('cl-t-s').value;
  const n = T * 12;

  if (isNaN(P) || isNaN(T) || n <= 0 || P < 100) {
    document.getElementById('loan-cmp-cards').innerHTML = '<div style="color:var(--text3);padding:24px;text-align:center;grid-column:1/-1">Please enter a loan amount of at least ₹100 and valid tenure.</div>';
    document.getElementById('loan-cmp-tbody').innerHTML = '';
    const ytbody = document.getElementById('loan-cmp-year-tbody');
    if (ytbody) ytbody.innerHTML = '';
    return;
  }

  const results = compareLoans.map(l => {
    const emi = calcEMIval(P, l.rate, n);
    const total = emi * n;
    const interest = total - P;
    return { ...l, emi, total, interest, intPct: (interest / total * 100) };
  });

  const minEMI = Math.min(...results.map(r => r.emi));

  // Cards
  document.getElementById('loan-cmp-cards').innerHTML = results.map(r => `
    <div class="cmp-card${r.emi === minEMI ? ' winner' : ''}">
      <div class="cmp-icon">${r.icon}</div>
      <div class="cmp-name">${r.name}</div>
      <div class="cmp-amt" style="color:${r.color}">₹${Math.round(r.emi).toLocaleString('en-IN')}<span style="font-size:0.7rem;font-weight:500;color:var(--text2)">/mo</span></div>
      <div class="cmp-note">@ ${r.rate}% p.a.</div>
      <div class="cmp-note" style="margin-top:4px">Interest: ${fmt(r.interest)}</div>
      ${r.emi === minEMI ? '<div class="win-tag" style="background:' + r.color + '">💰 Lowest EMI</div>' : ''}
    </div>`).join('');

  // Table
  document.getElementById('loan-cmp-tbody').innerHTML = results.map(r => `
    <tr>
      <td><span style="display:inline-flex;align-items:center;gap:6px">${r.icon} ${r.name}</span></td>
      <td><span style="color:${r.color};font-weight:700">${r.rate}%</span></td>
      <td class="tb">₹${Math.round(r.emi).toLocaleString('en-IN')}</td>
      <td class="tr">${fmt(r.interest)}</td>
      <td style="font-weight:700">${fmt(r.total)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="flex:1;background:var(--border);border-radius:3px;height:6px;overflow:hidden">
            <div style="width:${r.intPct.toFixed(1)}%;height:100%;background:${r.color};border-radius:3px"></div>
          </div>
          <span style="font-size:0.75rem;white-space:nowrap;color:var(--text2)">${r.intPct.toFixed(1)}%</span>
        </div>
      </td>
    </tr>`).join('');

  // Year-wise interest outflow
  const ytbody = document.getElementById('loan-cmp-year-tbody');
  ytbody.innerHTML = '';
  const bals = compareLoans.map(l => ({ bal: P, mr: l.rate / 100 / 12, emi: calcEMIval(P, l.rate, n) }));
  for (let y = 1; y <= T; y++) {
    const ints = bals.map(b => {
      let yi = 0;
      for (let m = 0; m < 12; m++) {
        const ip = b.bal * b.mr, pp = Math.min(b.emi - ip, b.bal);
        yi += ip;
        b.bal = Math.max(0, b.bal - pp);
      }
      return yi;
    });
    const minInt = Math.min(...ints);
    const cheapIdx = ints.indexOf(minInt);
    ytbody.innerHTML += `<tr>
      <td>Year ${y}</td>
      <td style="color:#0057d9;font-weight:600">${fmt(ints[0])}</td>
      <td style="color:#00b386;font-weight:600">${fmt(ints[1])}</td>
      <td style="color:#e8645a;font-weight:600">${fmt(ints[2])}</td>
      <td><span class="price-tag tag-profit">${compareLoans[cheapIdx].icon} ${compareLoans[cheapIdx].name.split(' ')[0]}</span></td>
    </tr>`;
  }
  savePreferences();
}

// ─── STOCK AVERAGE CALCULATOR ───
let avgType = 'stock';
let avgRowCount = 0;

const avgLabels = {
  stock: { qty: 'Shares', price: 'Buy Price (₹)', unit: 'shares' },
  mf: { qty: 'Units', price: 'NAV (₹)', unit: 'units' },
  crypto: { qty: 'Coins', price: 'Buy Price (₹)', unit: 'coins' }
};

function setAvgType(t, el) {
  document.querySelectorAll('#tab-avg .chip').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  avgType = t;
  const colLbl = document.getElementById('avg-lbl-col1');
  if (colLbl && avgLabels[t]) colLbl.textContent = avgLabels[t].qty;
  calcAvg();
  savePreferences();
}

function addAvgRow(qty = '', price = '') {
  avgRowCount++;
  const n = avgRowCount;
  const div = document.createElement('div');
  div.className = 'buy-row';
  div.id = 'avg-row-' + n;
  div.innerHTML = `
    <div class="buy-num">${n}</div>
    <div class="inp-wrap">
      <input class="inp" type="number" id="avg-qty-${n}" value="${qty}" min="0" placeholder="0" oninput="calcAvg()" style="text-align:center">
    </div>
    <div class="inp-wrap">
      <input class="inp" type="number" id="avg-price-${n}" value="${price}" min="0" placeholder="0.00" step="0.01" oninput="calcAvg()" style="text-align:center">
    </div>
    <button class="del-btn" onclick="removeAvgRow(${n})" title="Remove">×</button>`;
  document.getElementById('avg-rows').appendChild(div);
  calcAvg();
  savePreferences();
}

function removeAvgRow(n) {
  const el = document.getElementById('avg-row-' + n);
  if (el) el.remove();
  const rows = document.querySelectorAll('#avg-rows .buy-row');
  rows.forEach((r, i) => {
    const num = r.querySelector('.buy-num');
    if (num) num.textContent = i + 1;
  });
  calcAvg();
  savePreferences();
}

function getAvgRows() {
  return [...document.querySelectorAll('#avg-rows .buy-row')].map(row => {
    const id = row.id.replace('avg-row-', '');
    const q = parseFloat(document.getElementById('avg-qty-' + id)?.value) || 0;
    const p = parseFloat(document.getElementById('avg-price-' + id)?.value) || 0;
    return { id, qty: q, price: p, inv: q * p };
  }).filter(r => r.qty > 0 && r.price > 0);
}

function getAllAvgRowInputs() {
  return [...document.querySelectorAll('#avg-rows .buy-row')].map(row => {
    const id = row.id.replace('avg-row-', '');
    const q = document.getElementById('avg-qty-' + id)?.value ?? '';
    const p = document.getElementById('avg-price-' + id)?.value ?? '';
    return { qty: q, price: p };
  });
}

function calcAvg() {
  const rows = getAvgRows();
  const cmp = parseFloat(document.getElementById('avg-cmp')?.value) || 0;
  const resDiv = document.getElementById('avg-results');
  const tbody = document.getElementById('avg-tbody');
  const tfoot = document.getElementById('avg-tfoot');
  const totalTag = document.getElementById('avg-total-tag');
  const lbl = avgLabels[avgType];

  if (rows.length === 0) {
    resDiv.innerHTML = `
      <div style="text-align:center;padding:36px 16px;color:var(--text3)">
        <div style="font-size:2.5rem;margin-bottom:8px">⚖️</div>
        <div style="font-size:0.9rem;font-weight:600">Add buy entries to compute average price</div>
      </div>`;
    tbody.innerHTML = '';
    tfoot.innerHTML = '';
    totalTag.textContent = '';
    savePreferences();
    return;
  }

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalInv = rows.reduce((s, r) => s + r.inv, 0);
  const avgPrice = totalInv / totalQty;

  const curVal = cmp > 0 ? totalQty * cmp : 0;
  const pnl = curVal - totalInv;
  const pnlPct = totalInv > 0 ? (pnl / totalInv) * 100 : 0;
  const isProfit = pnl >= 0;

  resDiv.innerHTML = `
    <div class="avg-stat" style="background:var(--green-lt);margin-bottom:14px">
      <div class="avg-stat-lbl">Average Buy Price</div>
      <div class="avg-stat-val big">₹${avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <div class="avg-stat">
        <div class="avg-stat-lbl">Total ${lbl.unit}</div>
        <div class="avg-stat-val">${totalQty.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</div>
      </div>
      <div class="avg-stat">
        <div class="avg-stat-lbl">Total Invested</div>
        <div class="avg-stat-val">${fmt(totalInv)}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <div class="avg-stat">
        <div class="avg-stat-lbl">No. of Buys</div>
        <div class="avg-stat-val">${rows.length}</div>
      </div>
      <div class="avg-stat">
        <div class="avg-stat-lbl">Break-Even Price</div>
        <div class="avg-stat-val">₹${avgPrice.toFixed(2)}</div>
      </div>
    </div>
    ${cmp > 0 ? `
    <div style="border-top:1px solid var(--border);padding-top:14px;margin-top:6px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:.83rem;color:var(--text2);font-weight:600">Current Value</span>
        <span style="font-size:1.05rem;font-weight:800">${fmt(curVal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:.83rem;color:var(--text2);font-weight:600">Unrealized P&amp;L</span>
        <span style="font-size:1.05rem;font-weight:800;color:${isProfit ? 'var(--green)' : 'var(--red)'}">${isProfit ? '+' : ''}${fmt(pnl)} (${isProfit ? '+' : ''}${pnlPct.toFixed(2)}%)</span>
      </div>
      <div class="avg-bar-wrap">
        <div class="avg-bar" style="width:${Math.min(Math.abs(pnlPct), 100)}%;background:${isProfit ? 'var(--green)' : 'var(--red)'}"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:0.72rem;color:var(--text3)">
        <span>Cost: ₹${avgPrice.toFixed(2)}</span>
        <span>CMP: ₹${cmp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>` : `<div style="padding:12px;background:var(--bg);border-radius:8px;font-size:0.8rem;color:var(--text3);text-align:center">Enter CMP above to calculate live P&L</div>`}`;

  // Table
  tbody.innerHTML = rows.map((r, i) => {
    const rowPnl = cmp > 0 ? (cmp - r.price) * r.qty : null;
    const rowPct = cmp > 0 ? ((cmp - r.price) / r.price) * 100 : null;
    const invPct = (r.inv / totalInv) * 100;
    return `<tr>
      <td><span class="buy-num" style="display:inline-flex">${i + 1}</span></td>
      <td>${r.qty.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</td>
      <td>₹${r.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>${fmt(r.inv)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="flex:1;background:var(--border);border-radius:3px;height:5px;overflow:hidden">
            <div style="width:${invPct.toFixed(1)}%;height:100%;background:var(--green);border-radius:3px"></div>
          </div>
          <span style="font-size:0.75rem;color:var(--text2);white-space:nowrap">${invPct.toFixed(1)}%</span>
        </div>
      </td>
      <td>${rowPnl !== null
        ? `<span class="price-tag ${rowPnl >= 0 ? 'tag-profit' : 'tag-loss'}">${rowPnl >= 0 ? '+' : ''}${fmt(rowPnl)} (${rowPct >= 0 ? '+' : ''}${rowPct.toFixed(1)}%)</span>`
        : '<span style="color:var(--text3);font-size:.78rem">—</span>'
      }</td>
    </tr>`;
  }).join('');

  const totalPnl = cmp > 0 ? (cmp * totalQty) - totalInv : null;
  tfoot.innerHTML = `<tr style="background:var(--bg);font-weight:700;border-top:2px solid var(--border)">
    <td style="font-weight:800;color:var(--text)">Total</td>
    <td style="font-weight:800;color:var(--text)">${totalQty.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</td>
    <td style="font-weight:800;color:var(--green)">Avg ₹${avgPrice.toFixed(2)}</td>
    <td style="font-weight:800;color:var(--text)">${fmt(totalInv)}</td>
    <td>100%</td>
    <td>${totalPnl !== null
      ? `<span class="price-tag ${totalPnl >= 0 ? 'tag-profit' : 'tag-loss'}">${totalPnl >= 0 ? '+' : ''}${fmt(totalPnl)}</span>`
      : '—'}</td>
  </tr>`;

  totalTag.textContent = `${rows.length} buy${rows.length > 1 ? 's' : ''} · ${totalQty.toLocaleString('en-IN', { maximumFractionDigits: 4 })} ${lbl.unit}`;
  savePreferences();
}

// ─── EXPORT & PRINT SYSTEM ───

function getActiveTabKey() {
  return document.querySelector('.tabbar-item.active')?.dataset.tab || 'emi';
}

function openExportModal(tabKey) {
  if (tabKey) switchTab(tabKey);
  const activeTab = tabKey || getActiveTabKey();
  const modal = document.getElementById('exportModal');
  const subTitle = document.getElementById('export-modal-subtitle');
  const summaryBox = document.getElementById('export-summary-box');
  const emiScope = document.getElementById('export-emi-options');

  if (emiScope) {
    emiScope.style.display = (activeTab === 'emi') ? 'block' : 'none';
    const isYr = emiMode === 'yr';
    document.getElementById('export-pill-yr')?.classList.toggle('active', isYr);
    document.getElementById('export-pill-mo')?.classList.toggle('active', !isYr);
  }

  if (activeTab === 'emi') {
    if (subTitle) subTitle.textContent = 'Loan EMI Repayment Schedule & Prepayment Breakdown';
    const p = document.getElementById('ep-i')?.value || '5000000';
    const emi = document.getElementById('e-emi')?.textContent || '₹0';
    const int = document.getElementById('e-int')?.textContent || '₹0';
    const tot = document.getElementById('e-tot')?.textContent || '₹0';
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div class="export-summary-item"><span class="export-summary-lbl">Loan Amount</span><span class="export-summary-val">₹${(+p).toLocaleString('en-IN')}</span></div>
        <div class="export-summary-item"><span class="export-summary-lbl">Monthly EMI</span><span class="export-summary-val" style="color:var(--green)">${emi}</span></div>
        <div class="export-summary-item"><span class="export-summary-lbl">Total Interest</span><span class="export-summary-val" style="color:var(--red)">${int}</span></div>
        <div class="export-summary-item"><span class="export-summary-lbl">Total Outflow</span><span class="export-summary-val">${tot}</span></div>
      `;
    }
  } else if (activeTab === 'sip') {
    if (subTitle) subTitle.textContent = 'SIP Wealth Accumulation & Compound Returns';
    const sa = document.getElementById('sa-i')?.value || '10000';
    const inv = document.getElementById('s-inv')?.textContent || '₹0';
    const gain = document.getElementById('s-ret')?.textContent || '₹0';
    const tot = document.getElementById('s-tot')?.textContent || '₹0';
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div class="export-summary-item"><span class="export-summary-lbl">Monthly SIP</span><span class="export-summary-val">₹${(+sa).toLocaleString('en-IN')}</span></div>
        <div class="export-summary-item"><span class="export-summary-lbl">Total Invested</span><span class="export-summary-val">${inv}</span></div>
        <div class="export-summary-item"><span class="export-summary-lbl">Accrued Gains</span><span class="export-summary-val" style="color:var(--green)">${gain}</span></div>
        <div class="export-summary-item"><span class="export-summary-lbl">Maturity Corpus</span><span class="export-summary-val" style="color:var(--green)">${tot}</span></div>
      `;
    }
  } else if (activeTab === 'compare-loan') {
    if (subTitle) subTitle.textContent = 'Home vs Car vs Personal Loan Cost Comparison';
    const p = document.getElementById('cl-p-i')?.value || '3000000';
    const t = document.getElementById('cl-t-i')?.value || '20';
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div class="export-summary-item"><span class="export-summary-lbl">Loan Amount</span><span class="export-summary-val">₹${(+p).toLocaleString('en-IN')}</span></div>
        <div class="export-summary-item"><span class="export-summary-lbl">Tenure</span><span class="export-summary-val">${t} Years</span></div>
        <div class="export-summary-item"><span class="export-summary-lbl">Categories</span><span class="export-summary-val">Home · Car · Personal</span></div>
      `;
    }
  } else if (activeTab === 'investments') {
    if (subTitle) subTitle.textContent = 'Investment Growth Matrix (FD, RD, Lumpsum & Multi-Asset)';
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div class="export-summary-item"><span class="export-summary-lbl">Instrument</span><span class="export-summary-val">Investment Suite</span></div>
        <div class="export-summary-item"><span class="export-summary-lbl">Coverage</span><span class="export-summary-val">FD · RD · Lumpsum</span></div>
      `;
    }
  } else if (activeTab === 'avg') {
    if (subTitle) subTitle.textContent = 'Portfolio Tranche Position & Average Cost Matrix';
    const totTag = document.getElementById('avg-total-tag')?.textContent || 'Portfolio Tranches';
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div class="export-summary-item"><span class="export-summary-lbl">Asset Class</span><span class="export-summary-val">${avgType.toUpperCase()}</span></div>
        <div class="export-summary-item"><span class="export-summary-lbl">Tranches</span><span class="export-summary-val">${totTag}</span></div>
      `;
    }
  }

  if (modal) modal.classList.add('active');
}

function closeExportModal(e) {
  if (e && e.target !== document.getElementById('exportModal') && !e.target.closest('button')) return;
  const modal = document.getElementById('exportModal');
  if (modal) modal.classList.remove('active');
}

function setExportEmiMode(mode) {
  emiMode = mode;
  document.getElementById('export-pill-yr')?.classList.toggle('active', mode === 'yr');
  document.getElementById('export-pill-mo')?.classList.toggle('active', mode === 'mo');
  document.querySelectorAll('#tab-emi .toggle-pill .pill-btn').forEach((b, idx) => {
    b.classList.toggle('active', (mode === 'yr' && idx === 0) || (mode === 'mo' && idx === 1));
  });
  ce();
  showToast(mode === 'yr' ? 'Yearly Breakdown selected' : 'Monthly Details selected');
}

function doExportCSV() {
  const activeTab = getActiveTabKey();
  if (activeTab === 'emi') exportEmiCSV();
  else if (activeTab === 'sip') exportSipCSV();
  else if (activeTab === 'compare-loan') exportLoanCompareCSV();
  else if (activeTab === 'investments') exportInvestCSV();
  else if (activeTab === 'avg') exportAvgCSV();
  closeExportModal();
}

function downloadCSV(csvContent, filename) {
  // \uFEFF UTF-8 BOM ensures Excel and Numbers render ₹ and Unicode symbols accurately
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Downloaded ' + filename);
}

function exportEmiCSV() {
  const rows = document.querySelectorAll('#e-tbody tr');
  if (rows.length === 0) {
    showToast('No repayment schedule to export');
    return;
  }
  const p = document.getElementById('ep-i')?.value || '0';
  const r = document.getElementById('er-i')?.value || '0';
  const yr = document.getElementById('eyr-i')?.value || '0';
  const emi = document.getElementById('e-emi')?.textContent || '';
  const int = document.getElementById('e-int')?.textContent || '';
  const tot = document.getElementById('e-tot')?.textContent || '';

  let csv = 'EMI & Finance Calculator - Repayment Schedule\n';
  csv += `Generated On,"${new Date().toLocaleString('en-IN')}"\n`;
  csv += `Loan Amount,"₹${(+p).toLocaleString('en-IN')}"\n`;
  csv += `Interest Rate,"${r}% p.a."\n`;
  csv += `Tenure,"${yr} Years"\n`;
  csv += `Monthly EMI,"${emi}"\n`;
  csv += `Total Interest,"${int}"\n`;
  csv += `Total Outflow,"${tot}"\n\n`;

  csv += 'Period,Principal Paid,Interest Paid,Total Payment,Remaining Balance\n';
  rows.forEach(row => {
    const cols = [...row.querySelectorAll('td')].map(td => `"${td.textContent.trim().replace(/"/g, '""')}"`);
    csv += cols.join(',') + '\n';
  });
  downloadCSV(csv, `loan-emi-schedule-${emiMode === 'yr' ? 'yearly' : 'monthly'}.csv`);
}

function exportSipCSV() {
  const rows = document.querySelectorAll('#s-tbody tr');
  if (rows.length === 0) {
    showToast('No SIP schedule to export');
    return;
  }
  const sa = document.getElementById('sa-i')?.value || '0';
  const sr = document.getElementById('sr-i')?.value || '0';
  const st = document.getElementById('st-i')?.value || '0';
  const inv = document.getElementById('s-inv')?.textContent || '';
  const gain = document.getElementById('s-ret')?.textContent || '';
  const tot = document.getElementById('s-tot')?.textContent || '';

  let csv = 'SIP Wealth Accumulation Schedule\n';
  csv += `Generated On,"${new Date().toLocaleString('en-IN')}"\n`;
  csv += `Monthly Investment,"₹${(+sa).toLocaleString('en-IN')}"\n`;
  csv += `Expected Return Rate,"${sr}% p.a."\n`;
  csv += `Investment Horizon,"${st} Years"\n`;
  csv += `Total Invested,"${inv}"\n`;
  csv += `Estimated Gains,"${gain}"\n`;
  csv += `Final Corpus,"${tot}"\n\n`;

  csv += 'Year,Deposited (Year),Cumulative Invested,Total Portfolio Value,Accrued Gains\n';
  rows.forEach(row => {
    const cols = [...row.querySelectorAll('td')].map(td => `"${td.textContent.trim().replace(/"/g, '""')}"`);
    csv += cols.join(',') + '\n';
  });
  downloadCSV(csv, 'sip-wealth-growth.csv');
}

function exportLoanCompareCSV() {
  const rows1 = document.querySelectorAll('#loan-cmp-tbody tr');
  const rows2 = document.querySelectorAll('#loan-cmp-year-tbody tr');
  const p = document.getElementById('cl-p-i')?.value || '0';
  const t = document.getElementById('cl-t-i')?.value || '0';

  let csv = 'Side-by-Side Loan Cost Comparison\n';
  csv += `Generated On,"${new Date().toLocaleString('en-IN')}"\n`;
  csv += `Loan Principal,"₹${(+p).toLocaleString('en-IN')}"\n`;
  csv += `Tenure,"${t} Years"\n\n`;

  csv += 'Loan Category,Interest Rate,Monthly EMI,Total Interest,Total Outflow,Interest Burden %\n';
  rows1.forEach(row => {
    const cols = [...row.querySelectorAll('td')].map(td => `"${td.textContent.trim().replace(/"/g, '""')}"`);
    csv += cols.join(',') + '\n';
  });

  if (rows2.length > 0) {
    csv += '\nYear-Wise Interest Comparison\n';
    csv += 'Year,Home Loan,Car Loan,Personal Loan,Cheapest Choice\n';
    rows2.forEach(row => {
      const cols = [...row.querySelectorAll('td')].map(td => `"${td.textContent.trim().replace(/"/g, '""')}"`);
      csv += cols.join(',') + '\n';
    });
  }
  downloadCSV(csv, 'loan-comparison-matrix.csv');
}

function exportInvestCSV() {
  const rows = document.querySelectorAll('#cmp-tbody tr');
  const p = document.getElementById('ca-i')?.value || '0';
  const t = document.getElementById('ct-i')?.value || '0';

  let csv = 'Investment Suite - Instruments Comparison\n';
  csv += `Generated On,"${new Date().toLocaleString('en-IN')}"\n`;
  csv += `Investment Corpus,"₹${(+p).toLocaleString('en-IN')}"\n`;
  csv += `Time Period,"${t} Years"\n\n`;

  csv += 'Instrument,Total Invested,Estimated Returns,Final Corpus,Historical Rate\n';
  rows.forEach(row => {
    const cols = [...row.querySelectorAll('td')].map(td => `"${td.textContent.trim().replace(/"/g, '""')}"`);
    csv += cols.join(',') + '\n';
  });
  downloadCSV(csv, 'investment-instruments-comparison.csv');
}

function exportAvgCSV() {
  const rows = document.querySelectorAll('#avg-tbody tr');
  if (rows.length === 0) {
    showToast('No trade tranches to export');
    return;
  }
  const cmpVal = document.getElementById('avg-cmp')?.value || '0';
  let csv = 'Portfolio Average Calculator Report\n';
  csv += `Generated On,"${new Date().toLocaleString('en-IN')}"\n`;
  csv += `Asset Category,"${avgType.toUpperCase()}"\n`;
  if (+cmpVal > 0) csv += `Current Market Price (CMP),"₹${(+cmpVal).toLocaleString('en-IN')}"\n`;
  csv += '\n#,Quantity / Units,Buy Price (₹),Total Invested,Portfolio Weight,P&L at CMP\n';

  rows.forEach(row => {
    const cols = [...row.querySelectorAll('td')].map(td => `"${td.textContent.trim().replace(/"/g, '""')}"`);
    csv += cols.join(',') + '\n';
  });
  const tfootRow = document.querySelector('#avg-tfoot tr');
  if (tfootRow) {
    const cols = [...tfootRow.querySelectorAll('td')].map(td => `"${td.textContent.trim().replace(/"/g, '""')}"`);
    csv += cols.join(',') + '\n';
  }
  downloadCSV(csv, `${avgType}-portfolio-average.csv`);
}

function copyTableToClipboard() {
  const activeTab = getActiveTabKey();
  let tableSelector = '#e-tbody';
  if (activeTab === 'sip') tableSelector = '#s-tbody';
  else if (activeTab === 'compare-loan') tableSelector = '#loan-cmp-tbody';
  else if (activeTab === 'investments') tableSelector = '#cmp-tbody';
  else if (activeTab === 'avg') tableSelector = '#avg-tbody';

  const table = document.querySelector(tableSelector)?.closest('table');
  if (!table) {
    showToast('No active table to copy');
    return;
  }

  let tsv = '';
  // Extract headers
  const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
  if (headers.length > 0) tsv += headers.join('\t') + '\n';

  // Extract body rows
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const cells = [...row.querySelectorAll('td')].map(td => td.textContent.trim().replace(/[\r\n\t]+/g, ' '));
    tsv += cells.join('\t') + '\n';
  });

  // Extract foot if present
  const foot = table.querySelector('tfoot tr');
  if (foot) {
    const cells = [...foot.querySelectorAll('td')].map(td => td.textContent.trim().replace(/[\r\n\t]+/g, ' '));
    tsv += cells.join('\t') + '\n';
  }

  copyTextSafe(tsv, 'Table copied! Paste directly into Excel (Ctrl+V)');
  closeExportModal();
}

function copyTextSafe(text, successMsg) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => {
      execFallbackCopy(text, successMsg);
    });
  } else {
    execFallbackCopy(text, successMsg);
  }
}

function execFallbackCopy(text, successMsg) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '-9999px';
    ta.setAttribute('readonly', '');
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) {
      showToast(successMsg);
    } else {
      showToast('Clipboard access restricted');
    }
  } catch (err) {
    showToast('Clipboard not supported');
  }
}

function copySummaryText() {
  const activeTab = getActiveTabKey();
  let text = '';
  if (activeTab === 'emi') {
    const p = document.getElementById('ep-i')?.value || '0';
    const r = document.getElementById('er-i')?.value || '0';
    const yr = document.getElementById('eyr-i')?.value || '0';
    const emi = document.getElementById('e-emi')?.textContent || '';
    const int = document.getElementById('e-int')?.textContent || '';
    const tot = document.getElementById('e-tot')?.textContent || '';
    text = `🏠 Loan EMI Calculation Summary:\n• Loan Amount: ₹${(+p).toLocaleString('en-IN')}\n• Rate: ${r}% p.a.\n• Tenure: ${yr} Years\n• Monthly EMI: ${emi}\n• Total Interest: ${int}\n• Total Outflow: ${tot}\n\nCalculated with EMI & Finance Calculator`;
  } else if (activeTab === 'sip') {
    const sa = document.getElementById('sa-i')?.value || '0';
    const sr = document.getElementById('sr-i')?.value || '0';
    const st = document.getElementById('st-i')?.value || '0';
    const inv = document.getElementById('s-inv')?.textContent || '';
    const gain = document.getElementById('s-ret')?.textContent || '';
    const tot = document.getElementById('s-tot')?.textContent || '';
    text = `📈 SIP Investment Estimate:\n• Monthly: ₹${(+sa).toLocaleString('en-IN')}\n• Return: ${sr}% p.a.\n• Horizon: ${st} Years\n• Total Invested: ${inv}\n• Accrued Gains: ${gain}\n• Final Corpus: ${tot}\n\nCalculated with EMI & Finance Calculator`;
  } else if (activeTab === 'compare-loan') {
    const p = document.getElementById('cl-p-i')?.value || '0';
    const t = document.getElementById('cl-t-i')?.value || '0';
    text = `🏦 Loan Comparison Summary:\n• Principal: ₹${(+p).toLocaleString('en-IN')}\n• Tenure: ${t} Years\n• Comparing Home, Car & Personal Loans\n\nCalculated with EMI & Finance Calculator`;
  } else {
    text = `📊 Financial Calculation Report from EMI & Finance Calculator: ${window.location.href}`;
  }

  copyTextSafe(text, 'Summary copied to clipboard!');
  closeExportModal();
}

function triggerPrint(tabKey) {
  closeExportModal();
  const activeTab = tabKey || getActiveTabKey();
  if (tabKey) switchTab(tabKey);

  // Set date
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateEl = document.getElementById('print-header-date');
  if (dateEl) dateEl.textContent = dateStr;

  const subTitleEl = document.getElementById('print-header-subtitle');
  const summaryBox = document.getElementById('print-header-summary');
  if (summaryBox) {
    if (activeTab === 'emi') {
      if (subTitleEl) subTitleEl.textContent = 'Loan EMI Repayment Schedule & Prepayment Breakdown';
      const p = document.getElementById('ep-i')?.value || '0';
      const r = document.getElementById('er-i')?.value || '0';
      const yr = document.getElementById('eyr-i')?.value || '0';
      const emi = document.getElementById('e-emi')?.textContent || '₹0';
      const int = document.getElementById('e-int')?.textContent || '₹0';
      const tot = document.getElementById('e-tot')?.textContent || '₹0';
      summaryBox.innerHTML = `
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Loan Amount</div><div style="font-size:10pt;font-weight:800">₹${(+p).toLocaleString('en-IN')}</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Interest Rate</div><div style="font-size:10pt;font-weight:800">${r}% p.a.</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Tenure</div><div style="font-size:10pt;font-weight:800">${yr} Years</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Monthly EMI</div><div style="font-size:10pt;font-weight:800;color:#00b386">${emi}</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Total Interest</div><div style="font-size:10pt;font-weight:800;color:#e8645a">${int}</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Total Outflow</div><div style="font-size:10pt;font-weight:800">${tot}</div></div>
      `;
    } else if (activeTab === 'sip') {
      if (subTitleEl) subTitleEl.textContent = 'SIP Wealth Accumulation & Compound Growth Schedule';
      const sa = document.getElementById('sa-i')?.value || '0';
      const sr = document.getElementById('sr-i')?.value || '0';
      const st = document.getElementById('st-i')?.value || '0';
      const inv = document.getElementById('s-inv')?.textContent || '₹0';
      const gain = document.getElementById('s-ret')?.textContent || '₹0';
      const tot = document.getElementById('s-tot')?.textContent || '₹0';
      summaryBox.innerHTML = `
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Monthly Deposit</div><div style="font-size:10pt;font-weight:800">₹${(+sa).toLocaleString('en-IN')}</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Expected Return</div><div style="font-size:10pt;font-weight:800">${sr}% p.a.</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Time Horizon</div><div style="font-size:10pt;font-weight:800">${st} Years</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Total Invested</div><div style="font-size:10pt;font-weight:800">${inv}</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Accrued Gains</div><div style="font-size:10pt;font-weight:800;color:#00b386">${gain}</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Final Corpus</div><div style="font-size:10pt;font-weight:800;color:#00b386">${tot}</div></div>
      `;
    } else if (activeTab === 'compare-loan') {
      if (subTitleEl) subTitleEl.textContent = 'Side-by-Side Loan Cost Comparison (Home vs Car vs Personal)';
      const p = document.getElementById('cl-p-i')?.value || '0';
      const t = document.getElementById('cl-t-i')?.value || '0';
      summaryBox.innerHTML = `
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Loan Amount</div><div style="font-size:10pt;font-weight:800">₹${(+p).toLocaleString('en-IN')}</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Tenure</div><div style="font-size:10pt;font-weight:800">${t} Years</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Report Scope</div><div style="font-size:10pt;font-weight:800">3 Categories Analyzed</div></div>
      `;
    } else if (activeTab === 'investments') {
      if (subTitleEl) subTitleEl.textContent = 'Investment Performance & Multi-Asset Growth Matrix';
      summaryBox.innerHTML = `
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Report Type</div><div style="font-size:10pt;font-weight:800">Investment Suite Comparison</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Coverage</div><div style="font-size:10pt;font-weight:800">FD · RD · Lumpsum</div></div>
      `;
    } else if (activeTab === 'avg') {
      if (subTitleEl) subTitleEl.textContent = 'Portfolio Tranche Position & Cost Averaging Statement';
      const totTag = document.getElementById('avg-total-tag')?.textContent || 'Buy history';
      summaryBox.innerHTML = `
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Asset Category</div><div style="font-size:10pt;font-weight:800">${avgType.toUpperCase()}</div></div>
        <div><div style="font-size:7pt;color:#6b7280;text-transform:uppercase">Tranches</div><div style="font-size:10pt;font-weight:800">${totTag}</div></div>
      `;
    }
  }

  // Small timeout to allow DOM changes and modal closing to render before print dialog
  setTimeout(() => {
    window.print();
  }, 120);
}

// Global Escape key listener to dismiss open sheets/modals
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeExportModal();
    const inst = document.getElementById('installModal');
    if (inst) inst.classList.remove('active');
  }
});

function shareCurrentCalc() {
  const activeTab = getActiveTabKey();
  let shareText = '';
  if (activeTab === 'emi') {
    const p = document.getElementById('ep-i')?.value || '0';
    const r = document.getElementById('er-i')?.value || '0';
    const yr = document.getElementById('eyr-i')?.value || '0';
    const emi = document.getElementById('e-emi')?.textContent || '';
    const int = document.getElementById('e-int')?.textContent || '';
    shareText = `🏠 Loan EMI Calculation:\nLoan Amount: ₹${(+p).toLocaleString('en-IN')}\nRate: ${r}% p.a.\nTenure: ${yr} Years\n\nMonthly EMI: ${emi}\nTotal Interest: ${int}\n\nCalculated with EMI & Finance Calculator`;
  } else if (activeTab === 'sip') {
    const sa = document.getElementById('sa-i')?.value || '0';
    const sr = document.getElementById('sr-i')?.value || '0';
    const st = document.getElementById('st-i')?.value || '0';
    const tot = document.getElementById('s-tot')?.textContent || '';
    shareText = `📈 SIP Investment Estimate:\nMonthly: ₹${(+sa).toLocaleString('en-IN')}\nExpected Return: ${sr}% p.a.\nTenure: ${st} Years\n\nTotal Corpus: ${tot}\n\nCalculated with EMI & Finance Calculator`;
  } else {
    shareText = `Check out this financial calculator app: ${window.location.href}`;
  }

  if (navigator.share) {
    navigator.share({
      title: 'EMI & Financial Calculation',
      text: shareText,
      url: window.location.href
    }).catch(() => {});
  } else {
    copyTextSafe(shareText, 'Summary copied to clipboard!');
  }
}

// ─── DARK / LIGHT THEME ───
// Dark is the DEFAULT (no attribute or data-theme="dark").
// Light mode is applied via data-theme="light" override.
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const target = current === 'light' ? 'dark' : 'light';
  setTheme(target);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const sun = document.querySelector('.sun-icon');
  const moon = document.querySelector('.moon-icon');
  const meta = document.getElementById('theme-color-meta');
  if (theme === 'light') {
    // Light mode: show sun icon (to switch back to dark)
    if (sun) sun.style.display = 'block';
    if (moon) moon.style.display = 'none';
    if (meta) meta.setAttribute('content', '#f0f4f8');
  } else {
    // Dark mode (default): show moon icon (to switch to light)
    if (sun) sun.style.display = 'none';
    if (moon) moon.style.display = 'block';
    if (meta) meta.setAttribute('content', '#060e1e');
  }
  localStorage.setItem('emi_theme', theme);
  // Refresh slider fills after theme change
  setTimeout(() => document.querySelectorAll('input[type=range]').forEach(sl => updateSliderFill(sl)), 50);
}

// ─── IOS INSTALL GUIDE MODAL ───
function showInstallGuide() {
  document.getElementById('installModal').classList.add('active');
}
function closeInstallGuide(e) {
  // Only close if clicking the backdrop overlay itself (not the sheet content)
  if (e && e.target !== document.getElementById('installModal')) return;
  document.getElementById('installModal').classList.remove('active');
}

// Show prompt on mobile iOS if not standalone
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
if (isIos && !isStandalone && !sessionStorage.getItem('ios_guide_dismissed')) {
  setTimeout(() => {
    showInstallGuide();
    sessionStorage.setItem('ios_guide_dismissed', 'true');
  }, 3500);
}

// ─── LOCAL STORAGE PERSISTENCE (DEBOUNCED & INSTANT ON UNLOAD) ───
let _savePrefTimer = null;
let _isRestoring = false;

function setValAndSlider(inpId, slId, val) {
  if (val === undefined || val === null || val === '') return;
  const inp = document.getElementById(inpId);
  const sl = document.getElementById(slId);
  if (inp) inp.value = val;
  if (sl) sl.value = val;
}

function getPreferencesPayload() {
  return {
    // Navigation
    activeTab: typeof getActiveTabKey === 'function' ? getActiveTabKey() : 'emi',
    investSub: typeof currentInvestSub !== 'undefined' ? currentInvestSub : 'compare',

    // Tab 1: EMI
    loanType: typeof currentLoanType !== 'undefined' ? currentLoanType : 'home',
    ep: document.getElementById('ep-i')?.value,
    er: document.getElementById('er-i')?.value,
    eyr: document.getElementById('eyr-i')?.value,
    emo: document.getElementById('emo-i')?.value,
    prepayMonthly: document.getElementById('prepay-monthly')?.value,
    prepayYearly: document.getElementById('prepay-yearly')?.value,
    prepayOpen: document.getElementById('prepay-accordion')?.classList.contains('active') || false,
    taxSlab: typeof currentTaxSlab !== 'undefined' ? currentTaxSlab : 30,
    emiMode: typeof emiMode !== 'undefined' ? emiMode : 'yr',

    // Tab 2: SIP
    sa: document.getElementById('sa-i')?.value,
    sr: document.getElementById('sr-i')?.value,
    st: document.getElementById('st-i')?.value,
    ss: document.getElementById('ss-i')?.value,

    // Tab 3: Compare Loans
    clP: document.getElementById('cl-p-i')?.value,
    clT: document.getElementById('cl-t-i')?.value,

    // Tab 4: Investment Suite
    ca: document.getElementById('ca-i')?.value,
    ct: document.getElementById('ct-i')?.value,
    la: document.getElementById('la-i')?.value,
    lr: document.getElementById('lr-i')?.value,
    lt: document.getElementById('lt-i')?.value,
    li: document.getElementById('li-i')?.value,
    fp: document.getElementById('fp-i')?.value,
    fr: document.getElementById('fr-i')?.value,
    ft: document.getElementById('ft-i')?.value,
    fdc: typeof fdc !== 'undefined' ? fdc : 4,
    ra: document.getElementById('ra-i')?.value,
    rr: document.getElementById('rr-i')?.value,
    rt: document.getElementById('rt-i')?.value,

    // Tab 5: Stock & Crypto Average
    avgType: typeof avgType !== 'undefined' ? avgType : 'stock',
    avgCmp: document.getElementById('avg-cmp')?.value,
    avgRows: typeof getAllAvgRowInputs === 'function' ? getAllAvgRowInputs() : []
  };
}

function savePreferencesNow() {
  if (_isRestoring) return;
  clearTimeout(_savePrefTimer);
  _savePrefTimer = null;
  try {
    const data = getPreferencesPayload();
    localStorage.setItem('emi_calc_data', JSON.stringify(data));
  } catch(e) {}
}

function savePreferences() {
  if (_isRestoring) return;
  clearTimeout(_savePrefTimer);
  _savePrefTimer = setTimeout(savePreferencesNow, 150);
}

function resetAllPreferences() {
  if (confirm('Reset all calculator values to default?')) {
    localStorage.removeItem('emi_calc_data');
    location.reload();
  }
}

function restorePreferences() {
  _isRestoring = true;
  try {
    const savedTheme = localStorage.getItem('emi_theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    } else {
      setTheme('dark'); // Dark is default
    }

    const raw = localStorage.getItem('emi_calc_data');
    if (raw) {
      const d = JSON.parse(raw);

      // 1. EMI Tab
      if (d.loanType) {
        currentLoanType = d.loanType;
        document.querySelectorAll('#tab-emi .chip-row .chip').forEach(b => {
          const isMatch = (d.loanType === 'home' && b.textContent.includes('Home')) ||
                          (d.loanType === 'car' && b.textContent.includes('Car')) ||
                          (d.loanType === 'personal' && b.textContent.includes('Personal'));
          b.classList.toggle('active', isMatch);
        });
      }

      setValAndSlider('ep-i', 'ep-s', d.ep);
      setValAndSlider('er-i', 'er-s', d.er);
      setValAndSlider('eyr-i', 'eyr-s', d.eyr);
      setValAndSlider('emo-i', 'emo-s', d.emo);

      const pm = document.getElementById('prepay-monthly');
      if (pm && d.prepayMonthly !== undefined) pm.value = d.prepayMonthly;
      const py = document.getElementById('prepay-yearly');
      if (py && d.prepayYearly !== undefined) py.value = d.prepayYearly;

      if (d.prepayOpen) {
        const acc = document.getElementById('prepay-accordion');
        if (acc) acc.classList.add('active');
      }

      if (d.taxSlab) {
        currentTaxSlab = parseInt(d.taxSlab, 10) || 30;
        document.querySelectorAll('.tax-slab-chip').forEach(c => {
          c.classList.toggle('active', c.textContent.includes(String(currentTaxSlab)));
        });
      }

      if (d.emiMode) {
        emiMode = d.emiMode;
        document.querySelectorAll('#tab-emi .toggle-pill .pill-btn').forEach(b => {
          const isYr = d.emiMode === 'yr' && b.textContent.includes('Year');
          const isMo = d.emiMode === 'mo' && b.textContent.includes('Month');
          b.classList.toggle('active', isYr || isMo);
        });
      }

      // 2. SIP Tab
      setValAndSlider('sa-i', 'sa-s', d.sa);
      setValAndSlider('sr-i', 'sr-s', d.sr);
      setValAndSlider('st-i', 'st-s', d.st);
      setValAndSlider('ss-i', 'ss-s', d.ss);

      // 3. Compare Loans Tab
      setValAndSlider('cl-p-i', 'cl-p-s', d.clP);
      setValAndSlider('cl-t-i', 'cl-t-s', d.clT);

      // 4. Investment Suite Tab
      setValAndSlider('ca-i', 'ca-s', d.ca);
      setValAndSlider('ct-i', 'ct-s', d.ct);
      setValAndSlider('la-i', 'la-s', d.la);
      setValAndSlider('lr-i', 'lr-s', d.lr);
      setValAndSlider('lt-i', 'lt-s', d.lt);
      setValAndSlider('li-i', 'li-s', d.li);
      setValAndSlider('fp-i', 'fp-s', d.fp);
      setValAndSlider('fr-i', 'fr-s', d.fr);
      setValAndSlider('ft-i', 'ft-s', d.ft);
      setValAndSlider('ra-i', 'ra-s', d.ra);
      setValAndSlider('rr-i', 'rr-s', d.rr);
      setValAndSlider('rt-i', 'rt-s', d.rt);

      if (d.fdc) {
        fdc = parseInt(d.fdc, 10) || 4;
        document.querySelectorAll('#invest-sub-fd .chip-row .chip').forEach(b => {
          const match = (fdc === 1 && b.textContent.includes('Annual')) ||
                        (fdc === 2 && b.textContent.includes('Half-Yearly')) ||
                        (fdc === 4 && b.textContent.includes('Quarterly')) ||
                        (fdc === 12 && b.textContent.includes('Monthly'));
          b.classList.toggle('active', match);
        });
      }

      if (d.investSub) {
        currentInvestSub = d.investSub;
        const chip = document.querySelector(`.subnav-pills .chip[onclick*="${d.investSub}"]`);
        if (chip) {
          switchInvestSub(d.investSub, chip);
        } else {
          switchInvestSub(d.investSub);
        }
      }

      // 5. Stock Average Tab
      if (d.avgType) {
        avgType = d.avgType;
        document.querySelectorAll('#tab-avg .chip').forEach(b => {
          const isMatch = (avgType === 'stock' && b.textContent.includes('Stock')) ||
                          (avgType === 'mf' && b.textContent.includes('Mutual')) ||
                          (avgType === 'crypto' && b.textContent.includes('Crypto'));
          b.classList.toggle('active', isMatch);
        });
        if (avgLabels[avgType]) {
          const colLbl = document.getElementById('avg-lbl-col1');
          if (colLbl) colLbl.textContent = avgLabels[avgType].qty;
        }
      }

      const avgCmpEl = document.getElementById('avg-cmp');
      if (avgCmpEl && d.avgCmp !== undefined) {
        avgCmpEl.value = d.avgCmp;
      }

      if (Array.isArray(d.avgRows) && d.avgRows.length > 0) {
        const rowsContainer = document.getElementById('avg-rows');
        if (rowsContainer) rowsContainer.innerHTML = '';
        avgRowCount = 0;
        d.avgRows.forEach(r => {
          addAvgRow(r.qty ?? '', r.price ?? '');
        });
      } else {
        // Fallback default rows if array was empty
        addAvgRow(10, 150);
        addAvgRow(15, 130);
        addAvgRow(20, 110);
      }

      // 6. Active Tab
      if (d.activeTab && document.getElementById('tab-' + d.activeTab)) {
        switchTab(d.activeTab);
      }
    } else {
      // First visit: add default Stock Average rows
      addAvgRow(10, 150);
      addAvgRow(15, 130);
      addAvgRow(20, 110);
    }
  } catch(e) {
    console.error('Error restoring preferences:', e);
  } finally {
    _isRestoring = false;
  }
}

// Restore saved inputs and run calculations
restorePreferences();
ce();
cs();
cf();
cr();
cl();
cmp();
cmpLoan();
calcAvg();
if (typeof updateTaxBenefits === 'function') updateTaxBenefits();
try {
  const _urlParams = new URLSearchParams(window.location.search);
  const _initialTab = _urlParams.get('tab');
  if (_initialTab) switchTab(_initialTab);
} catch(e) {}

// Initialize slider fills & tooltips (run after DOM + calcs are ready)
initAllSliders();
initFloatingPill();
initSwipeGestures();
triggerSkeletonShimmer();

// Re-run fills and charts whenever window resizes
window.addEventListener('resize', () => {
  document.querySelectorAll('input[type=range]').forEach(sl => updateSliderFill(sl));
  if (window._lastYearlyAmortData) drawAmortizationChart(window._lastYearlyAmortData);
  if (window._lastSipChartData) drawSipChart(window._lastSipChartData);
});

// Auto-save listeners: whenever ANY input or select changes, save state immediately (debounced)
document.addEventListener('input', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
    savePreferences();
  }
});
document.addEventListener('change', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
    savePreferences();
  }
});
window.addEventListener('beforeunload', () => {
  savePreferencesNow();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    savePreferencesNow();
  }
});

// ─── SERVICE WORKER REGISTRATION & AUTO-UPDATE ───
let newWorkerWaiting = null;

function showUpdateBanner(worker) {
  newWorkerWaiting = worker;
  const banner = document.getElementById('update-banner');
  if (banner) banner.style.display = 'block';
}

function applyUpdate() {
  if (newWorkerWaiting) {
    newWorkerWaiting.postMessage({ action: 'skipWaiting' });
  } else {
    window.location.reload(true);
  }
}

function forceCheckUpdate() {
  showToast('Checking for updates...');
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    const svg = refreshBtn.querySelector('svg');
    if (svg) {
      svg.style.transition = 'transform 0.6s ease';
      svg.style.transform = 'rotate(360deg)';
      setTimeout(() => { svg.style.transform = 'none'; svg.style.transition = ''; }, 700);
    }
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.update().then(() => {
          setTimeout(() => {
            if (!newWorkerWaiting) showToast('You are on the latest version!');
            if (refreshBtn) refreshBtn.style.transform = 'none';
          }, 800);
        }).catch(() => {
          window.location.reload(true);
        });
      } else {
        window.location.reload(true);
      }
    });
  } else {
    window.location.reload(true);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Cache bust query string ensures Safari always fetches updated sw script
    navigator.serviceWorker.register('./sw.js?v=4', { scope: './' })
      .then(reg => {
        // Check for updates on startup
        reg.update();

        // Check for updates every time user re-opens the app from background on iOS
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update();
          }
        });

        // If a worker is already waiting, prompt immediately
        if (reg.waiting) {
          showUpdateBanner(reg.waiting);
        }

        // Detect new worker being installed
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateBanner(installingWorker);
              }
            });
          }
        });
      })
      .catch(err => {
        console.log('SW registration error:', err);
      });

    // Auto-reload when new service worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// ─── EXPANDABLE AMORTIZATION YEAR ROWS ───
function toggleYearAmortization(y) {
  const row = document.getElementById('yrow-' + y);
  const tbody = document.getElementById('ymonths-' + y);
  if (!row || !tbody) return;
  const isExpanded = row.classList.toggle('expanded');
  tbody.style.display = isExpanded ? '' : 'none';
}

// ─── HOME LOAN TAX BENEFIT ENGINE (SEC 24B & 80C) ───
function setTaxSlab(slab, el) {
  currentTaxSlab = slab;
  document.querySelectorAll('.tax-slab-chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  updateTaxBenefits();
  savePreferences();
}

function updateTaxBenefits() {
  const P = document.getElementById('ep-i') ? +document.getElementById('ep-i').value : +document.getElementById('ep-s').value;
  const annualRate = document.getElementById('er-i') ? +document.getElementById('er-i').value : +document.getElementById('er-s').value;
  const yr = document.getElementById('eyr-i') ? +document.getElementById('eyr-i').value : +document.getElementById('eyr-s').value;
  const mo = document.getElementById('emo-i') ? +document.getElementById('emo-i').value : +document.getElementById('emo-s').value;
  const n = yr * 12 + mo;
  const r = annualRate / 100 / 12;

  const taxCard = document.getElementById('home-tax-card');
  if (!taxCard) return;

  if (typeof currentLoanType !== 'undefined' && currentLoanType !== 'home') {
    taxCard.style.display = 'none';
    return;
  }
  if (isNaN(P) || P < 100 || isNaN(n) || n <= 0 || isNaN(r) || r <= 0) {
    taxCard.style.display = 'none';
    return;
  }
  taxCard.style.display = 'block';

  // Calculate Year 1 Interest and Principal
  const pow = Math.pow(1 + r, n);
  const emi = P * r * pow / (pow - 1);
  let bal = P;
  let yr1Int = 0;
  let yr1Prin = 0;

  for (let m = 0; m < Math.min(12, n); m++) {
    const ip = bal * r;
    const pp = emi - ip;
    yr1Int += ip;
    yr1Prin += pp;
    bal -= pp;
  }

  // Section 24b: Capped at 2 Lakhs
  const sec24Deduction = Math.min(yr1Int, 200000);

  // Section 80C: Capped at 1.5 Lakhs
  const sec80cDeduction = Math.min(yr1Prin, 150000);

  // Total tax deduction and savings with 4% cess
  const totalDeduction = sec24Deduction + sec80cDeduction;
  const taxSaved = totalDeduction * (currentTaxSlab / 100) * 1.04;

  const el24 = document.getElementById('tax-sec24-val');
  const el80c = document.getElementById('tax-sec80c-val');
  const elTotal = document.getElementById('tax-total-savings');

  if (el24) el24.textContent = fmt(sec24Deduction);
  if (el80c) el80c.textContent = fmt(sec80cDeduction);
  if (elTotal) elTotal.textContent = fmt(taxSaved) + '/yr';
}

// ─── DONUT CHART INTERACTIVE TOOLTIP ENGINE ───
function initDonutTooltips() {
  let tip = document.getElementById('donut-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'donut-tooltip';
    tip.className = 'donut-tooltip';
    document.body.appendChild(tip);
  }

  const arcConfigs = [
    { id: 'ep-arc', name: 'Principal Amount', color: 'var(--green)', valFn: () => document.getElementById('e-p')?.textContent },
    { id: 'ei-arc', name: 'Total Interest', color: 'var(--red)', valFn: () => document.getElementById('e-int')?.textContent },
    { id: 'si-arc', name: 'Invested Amount', color: 'var(--green)', valFn: () => document.getElementById('s-inv')?.textContent },
    { id: 'sr-arc', name: 'Est. Returns', color: 'var(--blue)', valFn: () => document.getElementById('s-ret')?.textContent },
    { id: 'fp-arc', name: 'Principal Amount', color: 'var(--green)', valFn: () => document.getElementById('f-p')?.textContent },
    { id: 'fi-arc', name: 'Interest Earned', color: 'var(--blue)', valFn: () => document.getElementById('f-int')?.textContent },
    { id: 'ri-arc', name: 'Total Deposited', color: 'var(--green)', valFn: () => document.getElementById('r-inv')?.textContent },
    { id: 'rr-arc', name: 'Interest Earned', color: 'var(--amber)', valFn: () => document.getElementById('r-int')?.textContent },
    { id: 'lp-arc', name: 'Initial Investment', color: 'var(--green)', valFn: () => document.getElementById('l-p')?.textContent },
    { id: 'lg-arc', name: 'Total Wealth Gain', color: 'var(--blue)', valFn: () => document.getElementById('l-g')?.textContent }
  ];

  arcConfigs.forEach(cfg => {
    const el = document.getElementById(cfg.id);
    if (!el) return;
    el.style.cursor = 'pointer';

    const showTip = (e) => {
      const val = cfg.valFn ? cfg.valFn() : '';
      tip.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cfg.color};margin-right:6px"></span>${cfg.name}: <b>${val}</b>`;
      tip.classList.add('visible');
      moveTip(e);
    };

    const moveTip = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      tip.style.left = clientX + 'px';
      tip.style.top = clientY + 'px';
    };

    const hideTip = () => {
      tip.classList.remove('visible');
    };

    el.addEventListener('mouseenter', showTip);
    el.addEventListener('mousemove', moveTip);
    el.addEventListener('mouseleave', hideTip);
    el.addEventListener('touchstart', (e) => { showTip(e); }, {passive:true});
    el.addEventListener('touchend', hideTip);
  });
}

// ─── SELF-DOCUMENTING FUNCTION ALIASES ───
window.calculateEMI = ce;
window.calculateSIP = cs;
window.calculateFD = cf;
window.calculateRD = cr;
window.calculateLumpsum = cl;
window.compareInvestments = cmp;
window.compareLoans = cmpLoan;
window.syncSliderToInput = s2i;
window.syncInputToSlider = i2s;
window.toggleYearAmortization = toggleYearAmortization;
window.setTaxSlab = setTaxSlab;
window.updateTaxBenefits = updateTaxBenefits;
window.shareAsImage = shareAsImage;
window.scrollToEmiResults = scrollToEmiResults;
window.updateAffordability = updateAffordability;

// Attach tooltip and initial chart redraw on window load
window.addEventListener('load', () => {
  setTimeout(() => {
    initDonutTooltips();
    updateTaxBenefits();
    if (window._lastYearlyAmortData) drawAmortizationChart(window._lastYearlyAmortData);
    if (window._lastSipChartData) drawSipChart(window._lastSipChartData);
  }, 200);
});
