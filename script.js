/* ==========================================================================
   Dynamic Island Studio - Complete JavaScript Engine
   ========================================================================== */

// 1. نظام محاكاة الصوتيات التفاعلي (Web Audio API)
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
      this.ctx.resume().catch(() => {});
    }
  }

  // رنة اتصال شاحن MagSafe المميزة من Apple
  playMagSafeChime() {
    if (!this.isEnabled) return;
    try {
      this.init();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const now = this.ctx.currentTime;

      // صوت النقر المغناطيسي المنخفض (Magnetic Thud)
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

      // توافقيات النغمة الموسيقية للرنة (Harmonic Chords: G4 -> C5 -> E5 -> G5)
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

  // صوت النقر والتفاعل مع الأزرار
  playPop() {
    if (!this.isEnabled) return;
    try {
      this.init();
      if (!this.ctx || this.ctx.state === 'suspended') return;
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

// 2. مراجع عناصر واجهة المستخدم (DOM Elements)
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

// 3. توسيع وتصغير الجزيرة الديناميكية
function toggleIslandExpansion() {
  soundFx.playPop();
  if (dynamicIsland) {
    dynamicIsland.classList.toggle('expanded');
  }
}

if (dynamicIsland) {
  dynamicIsland.addEventListener('click', (e) => {
    // منع التصغير إذا تم النقر على أزرار التحكم الداخلية
    if (e.target.closest('button')) return;
    toggleIslandExpansion();
  });
}

// 4. دالة تعيين مستوى البطارية والأنيميشن التصاعدي
function setBattery(targetPercent, playSound = true) {
  currentBatteryLevel = targetPercent;
  
  if (playSound) {
    soundFx.playMagSafeChime();
  }

  // تحديث أزرار النسب السريعة
  document.querySelectorAll('.btn-chip').forEach((btn) => {
    const isTarget = btn.innerText.trim() === `${targetPercent}%`;
    btn.classList.toggle('active', isTarget);
  });

  // تحديث نصوص نوع الشاحن
  if (chargerTitle) {
    chargerTitle.innerText = targetPercent === 100 
      ? 'اكتمل الشحن بالكامل' 
      : targetPercent <= 20 
      ? 'تنبيه: شحن البطارية منخفض' 
      : 'شاحن MagSafe اللاسلكي';
  }

  // إلغاء أي أنيميشن سابقة إن وجدت
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  const startPercent = 0;
  const duration = 850; // مدة الأنيميشن بالمللي ثانية
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // معادلة التباطؤ الانسيابي Ease-Out Cubic
    const easeOutProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(startPercent + (targetPercent - startPercent) * easeOutProgress);

    // تحديث العرض المدمج والموسع
    if (compactBatteryFill) compactBatteryFill.style.width = `${currentValue}%`;
    if (expandedBatteryBar) expandedBatteryBar.style.width = `${currentValue}%`;
    if (compactPercentText) compactPercentText.innerText = `${currentValue}%`;
    if (expandedPercentText) expandedPercentText.innerText = `${currentValue}%`;

    // نظام التلوين الذكي المتجاوب مع مستوى الشحن
    let colorHex = '#10b981'; // أخضر (طبيعي / ممتلئ)
    let gradientBg = 'linear-gradient(90deg, #10b981, #34d399)';

    if (currentValue <= 20) {
      colorHex = '#ef4444'; // أحمر (منخفض جداً)
      gradientBg = 'linear-gradient(90deg, #ef4444, #f43f5e)';
    } else if (currentValue <= 45) {
      colorHex = '#f59e0b'; // برتقالي / أصفر (متوسط)
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

// إعادة تشغيل تأثير الشحن
function replayChargingAnimation() {
  setBattery(currentBatteryLevel, true);
}

// 5. نظام التبديل بين الأنشطة (شحن / موسيقى / مؤقت)
function switchActivity(activityName, event) {
  soundFx.playPop();

  // إخفاء كافة الأنشطة
  document.querySelectorAll('.island-activity').forEach((el) => {
    el.classList.remove('active');
  });

  // تحديث حالة الأزرار في الشريط السفلي
  document.querySelectorAll('.switch-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  // إظهار النشاط المختار
  const targetActivity = document.getElementById(`${activityName}Activity`);
  if (targetActivity) {
    targetActivity.classList.add('active');
  }

  // تفعيل تأثيرات مخصصة لكل نشاط
  if (activityName === 'charging') {
    setBattery(currentBatteryLevel, true);
  }

  // تحديد الزر النشط في الشريط السفلي
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  } else {
    const activeBtn = Array.from(document.querySelectorAll('.switch-btn')).find((b) =>
      b.getAttribute('onclick')?.includes(activityName)
    );
    if (activeBtn) activeBtn.classList.add('active');
  }
}

// 6. الساعة الحية والتاريخ العربي
function updateClockAndDate() {
  const now = new Date();
  
  // صيغة الوقت (ساعات:دقائق)
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  if (liveClock) {
    liveClock.innerText = `${hours}:${minutes}`;
  }

  // صيغة التاريخ باللغة العربية
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

// 7. تشغيل أولي آمن عند تحميل الصفحة بدون تشغيل الصوت تلقائياً
window.addEventListener('DOMContentLoaded', () => {
  setBattery(88, false);
});
