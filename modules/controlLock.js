/**
 * controlLock.js - نظام تشميع وقفل سجل الكنترول والدرجات
 * مسؤولية الوحدة: حماية السجلات المدرسية والدرجات من أي تلاعب أو خطأ بشري
 * بعد الانتهاء والاعتماد الرسمي، عبر وضع القفل (Lockdown / Seal Mode) برمز سري.
 */

const LOCK_STORAGE_KEY = 'school_control_lock_state_v1';
const DEFAULT_PIN = '1234';

/**
 * التحقق مما إذا كان الكنترول مشمعاً ومقفلاً حالياً
 */
function isControlLocked() {
  try {
    const raw = localStorage.getItem(LOCK_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed.locked;
  } catch (e) {
    return false;
  }
}

/**
 * الحصول على الرمز السري المخزن
 */
function getControlPin() {
  try {
    const raw = localStorage.getItem(LOCK_STORAGE_KEY);
    if (!raw) return DEFAULT_PIN;
    const parsed = JSON.parse(raw);
    return parsed.pin || DEFAULT_PIN;
  } catch (e) {
    return DEFAULT_PIN;
  }
}

/**
 * تشميع وقفل الكنترول
 */
function lockControl(pin) {
  const finalPin = (pin && String(pin).trim()) || getControlPin();
  const state = {
    locked: true,
    lockedAt: new Date().toLocaleString('ar-IQ'),
    pin: finalPin
  };
  localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(state));
  if (typeof window.logAudit === 'function') {
    window.logAudit('تشميع الكنترول', 'تم إغلاق وتشميع سجل الكنترول والدرجات رسمياً');
  }
  applyLockUiState();
  showToast('🔒 تم تشميع وقفل سجل الكنترول بنجاح! السجلات الآن للقراءة والطباعة فقط.', 'success');
}

/**
 * فك تشميع الكنترول بعد التحقق من الرمز السري
 */
function unlockControl(enteredPin) {
  const realPin = getControlPin();
  if (String(enteredPin).trim() !== String(realPin).trim()) {
    showToast('❌ الرمز السري غير صحيح! تعذر فك تشميع الكنترول.', 'error');
    return false;
  }

  const state = {
    locked: false,
    unlockedAt: new Date().toLocaleString('ar-IQ'),
    pin: realPin
  };
  localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(state));
  if (typeof window.logAudit === 'function') {
    window.logAudit('فك تشميع الكنترول', 'تم فك تشميع السجل وإعادة تفعيل التعديل');
  }
  applyLockUiState();
  showToast('🔓 تم فك تشميع الكنترول بنجاح. أصبحت السجلات قابلة للتعديل الآن.', 'info');
  return true;
}

/**
 * تطبيق حالة القفل على عناصر واجهة المستخدم
 */
function applyLockUiState() {
  const locked = isControlLocked();
  const banner = document.getElementById('controlLockBanner');
  const btnToggle = document.getElementById('btnToggleControlLock');

  if (banner) {
    banner.classList.toggle('hidden', !locked);
  }

  if (btnToggle) {
    if (locked) {
      btnToggle.innerHTML = '<i class="fa-solid fa-lock text-amber-400"></i> فك تشميع الكنترول';
      btnToggle.classList.remove('bg-amber-600', 'hover:bg-amber-700');
      btnToggle.classList.add('bg-rose-700', 'hover:bg-rose-800');
      btnToggle.title = 'السجل مشمع ومقفل - اضغط لفك القفل برمز سري';
    } else {
      btnToggle.innerHTML = '<i class="fa-solid fa-lock-open"></i> تشميع الكنترول';
      btnToggle.classList.remove('bg-rose-700', 'hover:bg-rose-800');
      btnToggle.classList.add('bg-amber-600', 'hover:bg-amber-700');
      btnToggle.title = 'قفل وتشميع السجل لمنع أي تعديل لاحق';
    }
  }

  // تجميد أو تفعيل حقول الإدخال في الجداول
  document.querySelectorAll('.grade-input, .student-edit-input').forEach(inp => {
    inp.readOnly = locked;
    if (locked) {
      inp.classList.add('bg-slate-100', 'cursor-not-allowed', 'opacity-90');
    } else {
      inp.classList.remove('bg-slate-100', 'cursor-not-allowed', 'opacity-90');
    }
  });
}

/**
 * فتح نافذة إدارة التشميع والقفل
 */
function openControlLockModal() {
  const locked = isControlLocked();
  const modal = document.getElementById('controlLockModal');
  if (!modal) return;

  const title = document.getElementById('controlLockModalTitle');
  const desc = document.getElementById('controlLockModalDesc');
  const pinInput = document.getElementById('controlLockPinInput');
  const btnAction = document.getElementById('btnSubmitControlLock');

  if (pinInput) pinInput.value = '';

  if (locked) {
    if (title) title.innerText = 'فك تشميع سجل الكنترول';
    if (desc) desc.innerText = 'السجل مقفل حالياً لحماية الدرجات. أدخل الرمز السري للكنترول لإعادة السماح بالتعديل (الافتراضي: 1234):';
    if (btnAction) {
      btnAction.innerText = 'فك القفل والتشميع';
      btnAction.className = 'w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow';
    }
  } else {
    if (title) title.innerText = 'تشميع وقفل سجل الكنترول والدرجات';
    if (desc) desc.innerText = 'سيتم تجميد كافة الدرجات ومنع أي تعديل أو استيراد حتى إشعار آخر. عيّن أو أدخل الرمز السري (الافتراضي: 1234):';
    if (btnAction) {
      btnAction.innerText = 'تشميع وقفل السجل الآن';
      btnAction.className = 'w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition shadow';
    }
  }

  modal.classList.remove('hidden');
}

/**
 * إغلاق نافذة التشميع
 */
function closeControlLockModal() {
  const modal = document.getElementById('controlLockModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * تنفيذ إجراء التشميع / فك التشميع من النافذة
 */
function handleControlLockSubmit() {
  const pinInput = document.getElementById('controlLockPinInput');
  const entered = pinInput ? pinInput.value.trim() : '';

  if (isControlLocked()) {
    if (unlockControl(entered)) {
      closeControlLockModal();
    }
  } else {
    lockControl(entered || DEFAULT_PIN);
    closeControlLockModal();
  }
}

// تصدير واجهات القفل لـ window
window.isControlLocked = isControlLocked;
window.lockControl = lockControl;
window.unlockControl = unlockControl;
window.applyLockUiState = applyLockUiState;
window.openControlLockModal = openControlLockModal;
window.closeControlLockModal = closeControlLockModal;
window.handleControlLockSubmit = handleControlLockSubmit;
