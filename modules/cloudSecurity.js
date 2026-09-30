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

// محرك الدمج الذكي غير المدمّر للبيانات والدرجات بين الأساتذة والإدارة (مع عزل تام بين المدارس المختلفة)
function smartMergeCloudPayload(remotePayload, localPayload, preferLocalDeletions = false) {
  if (!remotePayload || typeof remotePayload !== 'object') return localPayload;
  if (!localPayload || typeof localPayload !== 'object') return remotePayload;

  // عزل صارم بين المدارس: إذا كانت البيانات المحلية تخص كود مدرسة آخر مختلف عن السحابة، نمنع الدمج نهائياً
  const rTenant = remotePayload._tenantCode || '';
  const lTenant = localPayload._tenantCode || '';
  if (rTenant && lTenant && rTenant !== lTenant) {
    return JSON.parse(JSON.stringify(remotePayload));
  }

  const merged = {
    config: { ...(remotePayload.config || {}), ...(localPayload.config || {}) },
    rooms: (Array.isArray(localPayload.rooms) && localPayload.rooms.length > 0)
      ? localPayload.rooms
      : (remotePayload.rooms || []),
    students: [],
    grades: {},
    subjectDetails: {},
    _tenantCode: rTenant || lTenant || '',
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
  const idRemap = {};

  // درع منع المسح الصارم: دمج قوائم الطلبة وعدم حذف أي طالب موجود في السحابة إلا عند الاسترجاع القسري الصريح
  if (preferLocalDeletions) {
    merged.students = JSON.parse(JSON.stringify(localStudents));
  } else {
    const studentMap = new Map();
    const nameKeyMap = new Map();
    const makeKey = s => `${String(s.name || '').trim().replace(/\s+/g, ' ')}__${s.grade || ''}__${s.section || ''}`;

    remoteStudents.forEach(st => {
      if (st && st.id) {
        studentMap.set(st.id, { ...st });
        nameKeyMap.set(makeKey(st), st.id);
      }
    });

    localStudents.forEach(st => {
      if (!st || !st.id) return;
      const nKey = makeKey(st);
      const canonicalId = studentMap.has(st.id) ? st.id : (nameKeyMap.get(nKey) || st.id);
      if (canonicalId !== st.id) idRemap[st.id] = canonicalId;
      const existing = studentMap.get(canonicalId) || {};
      studentMap.set(canonicalId, { ...existing, ...st, id: canonicalId });
      nameKeyMap.set(nKey, canonicalId);
    });

    merged.students = Array.from(studentMap.values());
  }

  // توحيد معرفات الدرجات في حال تطابق اسم الطالب والصف والشعبة بين جهازين
  const normalizedLocalGrades = JSON.parse(JSON.stringify(localPayload.grades || {}));
  const normalizedLocalDetails = JSON.parse(JSON.stringify(localPayload.subjectDetails || {}));
  Object.keys(idRemap).forEach(oldId => {
    const newId = idRemap[oldId];
    if (normalizedLocalGrades[oldId]) {
      normalizedLocalGrades[newId] = { ...(normalizedLocalGrades[newId] || {}), ...normalizedLocalGrades[oldId] };
      delete normalizedLocalGrades[oldId];
    }
    Object.keys(normalizedLocalDetails).forEach(subj => {
      if (normalizedLocalDetails[subj] && normalizedLocalDetails[subj][oldId]) {
        normalizedLocalDetails[subj][newId] = {
          ...(normalizedLocalDetails[subj][newId] || {}),
          ...normalizedLocalDetails[subj][oldId]
        };
        delete normalizedLocalDetails[subj][oldId];
      }
    });
  });

  // دمج الدرجات النهائية مادة بمادة لكل طالب: grades[studentId][subjectId] = mark
  const rGrades = remotePayload.grades || {};
  const lGrades = normalizedLocalGrades;
  const allStudentIds = new Set([...Object.keys(rGrades), ...Object.keys(lGrades)]);

  allStudentIds.forEach(stId => {
    merged.grades[stId] = { ...(rGrades[stId] || {}) };
    const lSubjs = lGrades[stId] || {};
    Object.keys(lSubjs).forEach(subj => {
      const val = lSubjs[subj];
      if (val !== undefined && val !== null && val !== '' && typeof val !== 'object') {
        merged.grades[stId][subj] = val;
      }
    });
  });

  // دمج تفاصيل سجل المعلم (اليومي، الشهري، نصف السنة، النهائي): subjectDetails[subjectId][studentId]
  const rDetails = remotePayload.subjectDetails || {};
  const lDetails = normalizedLocalDetails;
  const allSubjIds = new Set([...Object.keys(rDetails), ...Object.keys(lDetails)]);

  allSubjIds.forEach(subj => {
    merged.subjectDetails[subj] = {};
    const rStudMap = rDetails[subj] || {};
    const lStudMap = lDetails[subj] || {};
    const allDetailStudIds = new Set([...Object.keys(rStudMap), ...Object.keys(lStudMap)]);

    allDetailStudIds.forEach(stId => {
      const rObj = (rStudMap[stId] && typeof rStudMap[stId] === 'object') ? rStudMap[stId] : {};
      const lObj = (lStudMap[stId] && typeof lStudMap[stId] === 'object') ? lStudMap[stId] : {};
      merged.subjectDetails[subj][stId] = { ...rObj };
      Object.keys(lObj).forEach(field => {
        const v = lObj[field];
        if (v !== undefined && v !== null && v !== '') {
          merged.subjectDetails[subj][stId][field] = v;
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
    users: { ...(prevSec.users || {}), ...(window._activeSchoolUsersMap || {}) },
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
    const url = `${cloudConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/mizan_cloud_sync?school_code=ilike.${encodeURIComponent(fullKey + '*')}&order=updated_at.desc&select=payload&limit=1`;
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

// إدارة قائمة المدارس المعزولة على الجهاز (Multi-School Switcher)
const SCHOOLS_REGISTRY_KEY = 'MIZAN_SCHOOLS_REGISTRY_2026';

function getSavedSchoolsList() {
  try {
    return JSON.parse(localStorage.getItem(SCHOOLS_REGISTRY_KEY) || '[]');
  } catch (e) { return []; }
}

function registerCurrentSchoolInList() {
  try {
    const code = (cloudConfig.schoolCode || 'MIZAN-2026').trim().toUpperCase();
    const name = appData?.config?.schoolName || 'مدرسة غير مسماة';
    const lvl = appData?.config?.schoolLevel || 'primary';
    const list = getSavedSchoolsList().filter(item => item.code !== code);
    list.unshift({ code, name, level: lvl, pin: cloudConfig.secretPin || '', updatedAt: Date.now() });
    localStorage.setItem(SCHOOLS_REGISTRY_KEY, JSON.stringify(list.slice(0, 20)));
  } catch (e) {}
}

function renderSavedSchoolsSwitcher() {
  const box = document.getElementById('savedSchoolsSwitcherList');
  if (!box) return;
  registerCurrentSchoolInList();
  const list = getSavedSchoolsList();
  const activeCode = (cloudConfig.schoolCode || 'MIZAN-2026').trim().toUpperCase();

  box.innerHTML = list.map(s => {
    const isAct = s.code === activeCode;
    return `<button onclick="switchActiveSchoolCode('${s.code}')" class="px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition ${isAct ? 'bg-indigo-600 text-white border-indigo-700 shadow' : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'}">
      <i class="fa-solid fa-school ${isAct ? 'text-amber-300' : 'text-indigo-600'}"></i>
      <span>${s.name || s.code}</span>
      <span class="font-mono text-[10px] opacity-80">(${s.code})</span>
    </button>`;
  }).join('');
}

async function switchActiveSchoolCode(targetCode, customSchoolName = '', customPin = null, customFullKey = '') {
  const cleanTarget = String(targetCode || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!cleanTarget) return;
  const lvl = appData?.config?.schoolLevel || 'primary';

  // 1. حفظ المدرسة الحالية في خزنتها المعزولة قبل الانتقال
  registerCurrentSchoolInList();
  if (typeof saveCurrentProfile === 'function') saveCurrentProfile(lvl);

  // 2. تحديث رمز المدرسة النشط
  const savedItem = getSavedSchoolsList().find(x => x.code === cleanTarget);
  cloudConfig.schoolCode = cleanTarget;
  cloudConfig.fullSchoolKey = customFullKey || (savedItem?.fullKey || cleanTarget);
  if (customPin !== null) cloudConfig.secretPin = customPin;
  else if (savedItem && savedItem.pin !== undefined) cloudConfig.secretPin = savedItem.pin;
  saveCloudConfig();

  // 3. تصفير الذاكرة المؤقتة وتحميل بيانات المدرسة الهدف فقط (منع تداخل أي طالب)
  const localTarget = typeof getProfileData === 'function' ? getProfileData(lvl) : null;
  if (localTarget && (!localTarget._tenantCode || localTarget._tenantCode === getFullSchoolCloudKey())) {
    appData.config = { ...appData.config, ...(localTarget.config || {}) };
    appData.rooms = localTarget.rooms || [];
    appData.students = localTarget.students || [];
    appData.grades = localTarget.grades || {};
    appData.subjectDetails = localTarget.subjectDetails || {};
  } else if (typeof createFreshProfile === 'function') {
    const fresh = createFreshProfile(lvl, { schoolName: customSchoolName || savedItem?.name || '' });
    appData.config = fresh.config;
    appData.rooms = fresh.rooms;
    appData.students = [];
    appData.grades = {};
    appData.subjectDetails = {};
  }
  appData._tenantCode = getFullSchoolCloudKey();

  if (typeof saveCurrentProfile === 'function') saveCurrentProfile(lvl);
  if (typeof syncConfigUI === 'function') syncConfigUI();
  if (typeof renderAll === 'function') renderAll();

  const codeInput = document.getElementById('cloudInputSchoolCode');
  if (codeInput) codeInput.value = cleanTarget;
  const pinInput = document.getElementById('cloudInputPin');
  if (pinInput) pinInput.value = cloudConfig.secretPin || '';

  renderSavedSchoolsSwitcher();
  await pullFromCloud(false);
}

function createNewIsolatedSchoolPrompt() {
  if (typeof logoutFromMizan === 'function') logoutFromMizan();
}

window.computeCloudPinHash = computeCloudPinHash;
window.smartMergeCloudPayload = smartMergeCloudPayload;
window.buildCloudSecurityMeta = buildCloudSecurityMeta;
window.copyTeacherInviteLink = copyTeacherInviteLink;
window.applyCloudUrlParams = applyCloudUrlParams;
window.loadCloudBackupsList = loadCloudBackupsList;
window.restoreCloudBackupById = restoreCloudBackupById;
window.registerCurrentSchoolInList = registerCurrentSchoolInList;
window.renderSavedSchoolsSwitcher = renderSavedSchoolsSwitcher;
window.switchActiveSchoolCode = switchActiveSchoolCode;
window.createNewIsolatedSchoolPrompt = createNewIsolatedSchoolPrompt;
