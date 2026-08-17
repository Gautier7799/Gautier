/* ==========================================================================
   Dynamic Island Studio - Complete JavaScript Engine
   ========================================================================== */

class SoundFXController {
  constructor() {
    this.ctx = null;
    this.isEnabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playMagSafeChime() {
    if (!this.isEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(130, now);
      thudOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
      thudGain.gain.setValueAtTime(0.25, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      thudOsc.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thudOsc.start(now);
      thudOsc.stop(now + 0.12);

      const chordFrequencies = [392.00, 523.25, 659.25, 783.99];
      chordFrequencies.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + 0.04 + idx * 0.035;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.55);
      });
    } catch (e) {
      console.warn('Audio feedback failed or not supported:', e);
    }
  }

  playPop() {
    if (!this.isEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.07);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }
}

const soundFx = new SoundFXController();

const dynamicIsland = document.getElementById('dynamicIsland');
const compactBatteryFill = document.getElementById('compactBatteryFill');
const compactPercentText = document.getElementById('compactPercentText');
const expandedPercentText = document.getElementById('expandedPercentText');
const expandedBatteryBar = document.getElementById('expandedBatteryBar');
const chargerTitle = document.getElementById('chargerTitle');
const ambientGlow = document.getElementById('ambientGlow');
const liveClock = document.getElementById('liveClock');
const liveDate = document.getElementById('liveDate');

let currentBatteryLevel = 88;
let animationFrameId = null;

function toggleIslandExpansion() {
  soundFx.playPop();
  dynamicIsland.classList.toggle('expanded');
}

dynamicIsland.addEventListener('click', (e) => {
  if (e.target.closest('button')) return;
  toggleIslandExpansion();
});

function setBattery(targetPercent) {
  currentBatteryLevel = targetPercent;
  soundFx.playMagSafeChime();

  document.querySelectorAll('.btn-chip').forEach((btn) => {
    const isTarget = btn.innerText.trim() === `${targetPercent}%`;
    btn.classList.toggle('active', isTarget);
  });

  if (chargerTitle) {
    chargerTitle.innerText = targetPercent === 100 
      ? 'اكتمل الشحن بالكامل' 
      : targetPercent <= 20 
      ? 'تنبيه: شحن البطارية منخفض' 
      : 'شاحن MagSafe اللاسلكي';
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  const startPercent = 0;
  const duration = 900;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeOutProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(startPercent + (targetPercent - startPercent) * easeOutProgress);

    if (compactBatteryFill) compactBatteryFill.style.width = `${currentValue}%`;
    if (expandedBatteryBar) expandedBatteryBar.style.width = `${currentValue}%`;
    if (compactPercentText) compactPercentText.innerText = `${currentValue}%`;
    if (expandedPercentText) expandedPercentText.innerText = `${currentValue}%`;

    let colorHex = '#10b981';
    let gradientBg = 'linear-gradient(90deg, #10b981, #34d399)';

    if (currentValue <= 20) {
      colorHex = '#ef4444';
      gradientBg = 'linear-gradient(90deg, #ef4444, #f43f5e)';
    } else if (currentValue <= 45) {
      colorHex = '#f59e0b';
      gradientBg = 'linear-gradient(90deg, #f59e0b, #eab308)';
    }

    if (compactBatteryFill) compactBatteryFill.style.background = gradientBg;
    if (expandedBatteryBar) expandedBatteryBar.style.background = gradientBg;
    if (compactPercentText) compactPercentText.style.color = colorHex;
    if (expandedPercentText) expandedPercentText.style.color = colorHex;

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    }
  }

  animationFrameId = requestAnimationFrame(animate);
}

function replayChargingAnimation() {
  setBattery(currentBatteryLevel);
}

function switchActivity(activityName) {
  soundFx.playPop();

  document.querySelectorAll('.island-activity').forEach((el) => {
    el.classList.remove('active');
  });

  document.querySelectorAll('.switch-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  const targetActivity = document.getElementById(`${activityName}Activity`);
  if (targetActivity) {
    targetActivity.classList.add('active');
  }

  if (activityName === 'charging') {
    soundFx.playMagSafeChime();
    setBattery(currentBatteryLevel);
  }

  const activeBtn = Array.from(document.querySelectorAll('.switch-btn')).find((b) =>
    b.getAttribute('onclick')?.includes(activityName)
  );
  if (activeBtn) activeBtn.classList.add('active');
}

function updateClockAndDate() {
  const now = new Date();
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  if (liveClock) {
    liveClock.innerText = `${hours}:${minutes}`;
  }

  if (liveDate) {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const dayName = days[now.getDay()];
    const dayNum = now.getDate();
    const monthName = months[now.getMonth()];
    liveDate.innerText = `${dayName}، ${dayNum} ${monthName}`;
  }
}

setInterval(updateClockAndDate, 1000);
updateClockAndDate();

window.addEventListener('DOMContentLoaded', () => {
  setBattery(88);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.log('Service Worker registration skipped:', err);
    });
  });
}
