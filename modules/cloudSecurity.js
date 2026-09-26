// وحدة الحماية السحابية، التشفير (SHA-256)، الدمج الذكي للدرجات، والنسخ الاحتياطية السحابية
// الميزانية القصوى: 350 سطر

// دالة تجزئة وتشفير الرمز السري للسحابة (SHA-256 مع بديل متوافق)
async function computeCloudPinHash(pin, schoolCode) {
  const cleanPin = String(pin || '').trim();
  if (!cleanPin) return '';
  const rawText = `MIZAN_SHIELD_2026::${String(schoolCode || '').trim().toUpperCase()}::${cleanPin}`;

  try {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(rawText);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}

  let h1 = 0xdeadbeef ^ rawText.length;
  let h2 = 0x41c6ce57 ^ rawText.length;
  for (let i = 0, ch; i < rawText.length; i++) {
    ch = rawText.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

// محرك الدمج الذكي غير المدمّر للبيانات والدرجات بين الأساتذة والإدارة
function smartMergeCloudPayload(remotePayload, localPayload, preferLocalDeletions = false) {
  if (!remotePayload || typeof remotePayload !== 'object') return localPayload;
  if (!localPayload || typeof localPayload !== 'object') return remotePayload;

  const merged = {
    config: { ...(remotePayload.config || {}), ...(localPayload.config || {}) },
    rooms: (Array.isArray(localPayload.rooms) && localPayload.rooms.length > 0)
      ? localPayload.rooms
      : (remotePayload.rooms || []),
    students: [],
    grades: {},
    subjectDetails: {},
    _security: remotePayload._security || {}
  };

  if (
    (!localPayload.config?.schoolName || localPayload.config.schoolName === 'مدرسة ميزان النموذجية') &&
    remotePayload.config?.schoolName
  ) {
    merged.config.schoolName = remotePayload.config.schoolName;
    if (remotePayload.config.schoolGender) merged.config.schoolGender = remotePayload.config.schoolGender;
  }

  const remoteStudents = Array.isArray(remotePayload.students) ? remotePayload.students : [];
  const localStudents = Array.isArray(localPayload.students) ? localPayload.students : [];

  // درع منع المسح: إذا كان الجهاز المحلي فارغاً والسحابة فيها طلبة، نأخذ طلبة السحابة
  if (localStudents.length === 0 && remoteStudents.length > 0 && !preferLocalDeletions) {
    merged.students = JSON.parse(JSON.stringify(remoteStudents));
  } else if (preferLocalDeletions && localStudents.length > 0) {
    merged.students = JSON.parse(JSON.stringify(localStudents));
  } else {
    const studentMap = new Map();
    remoteStudents.forEach(st => { if (st && st.id) studentMap.set(st.id, { ...st }); });
    localStudents.forEach(st => {
      if (st && st.id) {
        const existing = studentMap.get(st.id) || {};
        studentMap.set(st.id, { ...existing, ...st });
      }
    });
    merged.students = Array.from(studentMap.values());
  }

  // دمج الدرجات مادة بمادة وفصلاً بفصل لمنع مسح عمل معلم آخر يعمل في نفس اللحظة
  const rGrades = remotePayload.grades || {};
  const lGrades = localPayload.grades || {};
  const allStudentIds = new Set([...Object.keys(rGrades), ...Object.keys(lGrades)]);

  allStudentIds.forEach(stId => {
    merged.grades[stId] = {};
    const rTerms = rGrades[stId] || {};
    const lTerms = lGrades[stId] || {};
    const allTerms = new Set([...Object.keys(rTerms), ...Object.keys(lTerms)]);

    allTerms.forEach(term => {
      merged.grades[stId][term] = { ...(rTerms[term] || {}) };
      const lSubjs = lTerms[term] || {};
      Object.keys(lSubjs).forEach(subj => {
        const val = lSubjs[subj];
        if (val !== undefined && val !== null && val !== '') {
          merged.grades[stId][term][subj] = val;
        }
      });
    });
  });

  // دمج تفاصيل سجل المعلم (اليومي والتحريري) مادة بمادة
  const rDetails = remotePayload.subjectDetails || {};
  const lDetails = localPayload.subjectDetails || {};
  const allDetailIds = new Set([...Object.keys(rDetails), ...Object.keys(lDetails)]);

  allDetailIds.forEach(stId => {
    merged.subjectDetails[stId] = {};
    const rTerms = rDetails[stId] || {};
    const lTerms = lDetails[stId] || {};
    const allTerms = new Set([...Object.keys(rTerms), ...Object.keys(lTerms)]);

    allTerms.forEach(term => {
      merged.subjectDetails[stId][term] = { ...(rTerms[term] || {}) };
      const lSubjs = lTerms[term] || {};
      Object.keys(lSubjs).forEach(subj => {
        const obj = lSubjs[subj];
        if (obj && typeof obj === 'object') {
          const prev = merged.subjectDetails[stId][term][subj] || {};
          merged.subjectDetails[stId][term][subj] = {
            ...prev,
            ...(obj.daily !== undefined && obj.daily !== '' ? { daily: obj.daily } : {}),
            ...(obj.written !== undefined && obj.written !== '' ? { written: obj.written } : {})
          };
        }
      });
    });
  });

  return merged;
}

// بناء سجل النسخ الاحتياطية السحابية المدمج داخل السحابة (يحفظ آخر 6 نسخ تلقائياً)
function buildCloudSecurityMeta(remotePayload, pinHash, updatedBy, remoteUpdatedAt) {
  const prevSec = (remotePayload && remotePayload._security) ? remotePayload._security : {};
  const backups = Array.isArray(prevSec.backups) ? [...prevSec.backups] : [];

  const remoteStudentsCount = Array.isArray(remotePayload?.students) ? remotePayload.students.length : 0;
  if (remoteStudentsCount > 0) {
    const lastBk = backups[0];
    const nowMs = Date.now();
    const lastMs = lastBk && lastBk.created_at ? new Date(lastBk.created_at).getTime() : 0;
    // حفظ نسخة سحابية جديدة إذا مضى أكثر من 30 ثانية أو تغير عدد الطلبة
    if (!lastBk || (nowMs - lastMs > 30000) || lastBk.studentsCount !== remoteStudentsCount) {
      backups.unshift({
        id: nowMs,
        created_at: remoteUpdatedAt || new Date().toISOString(),
        updated_by: updatedBy || 'الكنترول',
        studentsCount: remoteStudentsCount,
        snapshot: {
          config: remotePayload.config,
          rooms: remotePayload.rooms,
          students: remotePayload.students,
          grades: remotePayload.grades,
          subjectDetails: remotePayload.subjectDetails
        }
      });
    }
  }

  return {
    pinHash: pinHash || prevSec.pinHash || '',
    version: (Number(prevSec.version) || 0) + 1,
    backups: backups.slice(0, 6)
  };
}

// توليد ونسخ رابط دعوة الأساتذة السريع للاتصال بسحابة المدرسة بضغطة واحدة
function copyTeacherInviteLink() {
  const code = (document.getElementById('cloudInputSchoolCode')?.value || cloudConfig.schoolCode || 'MIZAN-2026').trim().toUpperCase();
  const pin = (document.getElementById('cloudInputPin')?.value || cloudConfig.secretPin || '').trim();
  const lvl = appData?.config?.schoolLevel || 'primary';

  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  params.set('cloud', code);
  params.set('level', lvl);
  if (pin) params.set('pin', pin);

  const inviteUrl = `${baseUrl}?${params.toString()}`;
  navigator.clipboard.writeText(inviteUrl).then(() => {
    if (typeof showToast === 'function') {
      showToast('🔗 تم نسخ رابط دخول الأساتذة السريع! أرسله للمعلمين عبر واتساب أو تليكرام.', 'success');
    } else {
      alert('✅ تم نسخ رابط دخول الأساتذة السريع:\n' + inviteUrl);
    }
  });
}

// التقاط بارامترات رابط الدعوة السريع عند فتح المعلم للرابط وتنظيف شريط العنوان للأمان
function applyCloudUrlParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    const cloudCode = params.get('cloud');
    const levelParam = params.get('level');
    const pinParam = params.get('pin');

    if (cloudCode) {
      cloudConfig.schoolCode = cloudCode.trim().toUpperCase();
      cloudConfig.enabled = true;
      if (pinParam !== null) cloudConfig.secretPin = pinParam.trim();
      if (levelParam && ['primary', 'middle', 'high'].includes(levelParam)) {
        if (typeof switchSchoolLevel === 'function') {
          switchSchoolLevel(levelParam, true);
        } else if (appData?.config) {
          appData.config.schoolLevel = levelParam;
        }
      }
      saveCloudConfig();
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  } catch (e) {}
}

// جلب وعرض سجل النسخ الاحتياطية المحفوظة داخل سحابة Supabase
async function loadCloudBackupsList() {
  const container = document.getElementById('cloudBackupsListContainer');
  if (!container) return;
  container.innerHTML = '<div class="text-center py-3 text-slate-500 text-xs"><i class="fa-solid fa-spinner fa-spin ml-1"></i> جاري جلب النسخ السحابية المحمية من السيرفر...</div>';

  const fullKey = getFullSchoolCloudKey();
  try {
    const url = `${cloudConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/mizan_cloud_sync?school_code=eq.${encodeURIComponent(fullKey)}&select=payload&limit=1`;
    const res = await fetch(url, { headers: { 'apikey': cloudConfig.supabaseKey } });
    if (!res.ok) {
      container.innerHTML = '<div class="text-center py-2 text-amber-700 text-xs">تعذر قراءة سجل النسخ السحابية حالياً.</div>';
      return;
    }
    const rows = await res.json();
    const backups = rows?.[0]?.payload?._security?.backups || [];
    if (!Array.isArray(backups) || backups.length === 0) {
      container.innerHTML = '<div class="text-center py-2 text-slate-500 text-xs">لا توجد نسخ سحابية سابقة لهذا الرمز حتى الآن (تُحفظ تلقائياً عند كل تعديل).</div>';
      return;
    }

    window._cachedCloudBackups = backups;
    container.innerHTML = backups.map(bk => {
      const dt = new Date(bk.created_at).toLocaleString('ar-IQ');
      return `<div class="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-[11px]">
        <div>
          <div class="font-bold text-slate-800"><i class="fa-solid fa-clock-rotate-left text-indigo-600 ml-1"></i> ${dt}</div>
          <div class="text-slate-500">بواسطة: <b>${bk.updated_by || 'الكنترول'}</b> | عدد الطلبة: <b>${bk.studentsCount || 0}</b></div>
        </div>
        <button onclick="restoreCloudBackupById(${bk.id})" class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold rounded-lg border border-indigo-200 transition">
          ⏪ استرجاع
        </button>
      </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = '<div class="text-center py-2 text-rose-600 text-xs">تعذر الاتصال بالسيرفر لجلب النسخ السحابية.</div>';
  }
}

async function restoreCloudBackupById(backupId) {
  const rows = window._cachedCloudBackups || [];
  const target = rows.find(r => r.id === backupId);
  if (!target || !target.snapshot) return;

  if (!confirm(`⚠️ هل أنت متأكد من استرجاع هذه النسخة السحابية المحمية بتاريخ (${new Date(target.created_at).toLocaleString('ar-IQ')})؟\nسيتم أخذ نقطة أمان محلية قبل الاسترجاع.`)) {
    return;
  }

  if (typeof createSnapshot === 'function') {
    createSnapshot('نقطة أمان تلقائية قبل استرجاع نسخة احتياطية سحابية');
  }

  appData.config = { ...appData.config, ...(target.snapshot.config || {}) };
  appData.rooms = target.snapshot.rooms || appData.rooms;
  appData.students = target.snapshot.students || [];
  appData.grades = target.snapshot.grades || {};
  appData.subjectDetails = target.snapshot.subjectDetails || {};

  if (typeof saveCurrentProfile === 'function') saveCurrentProfile();
  if (typeof syncConfigUI === 'function') syncConfigUI();
  if (typeof renderAll === 'function') renderAll();

  await pushToCloud(false, true);
  if (typeof showToast === 'function') {
    showToast('🛡️ تم استرجاع النسخة الاحتياطية السحابية ومزامنتها بنجاح!', 'success');
  }
}

window.computeCloudPinHash = computeCloudPinHash;
window.smartMergeCloudPayload = smartMergeCloudPayload;
window.buildCloudSecurityMeta = buildCloudSecurityMeta;
window.copyTeacherInviteLink = copyTeacherInviteLink;
window.applyCloudUrlParams = applyCloudUrlParams;
window.loadCloudBackupsList = loadCloudBackupsList;
window.restoreCloudBackupById = restoreCloudBackupById;
