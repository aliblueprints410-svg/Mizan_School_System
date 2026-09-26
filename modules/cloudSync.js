// وحدة المزامنة السحابية المركزية والعمل التعاوني اللحظي المحمي (Supabase Cloud Sync)
// الميزانية القصوى: 360 سطر

const CLOUD_CONFIG_KEY = 'MIZAN_CLOUD_SYNC_CONFIG_2026';

let cloudConfig = {
  supabaseUrl: 'https://rrlesmhpaanbpbcpdmre.supabase.co',
  supabaseKey: 'sb_publishable_gEAknXzFn1VWqD5jYwduAA_9w9ePzdU',
  schoolCode: 'MIZAN-2026',
  secretPin: '',
  userName: 'إدارة المدرسة / الكنترول',
  autoSync: true,
  enabled: true
};

let lastCloudUpdatedAt = null;
let isPullingFromCloud = false;
let cloudPushTimer = null;
let cloudPollInterval = null;
let pendingOfflinePush = false;
let cloudStatusState = 'idle'; // 'connected', 'syncing', 'locked_pin', 'needs_table', 'offline', 'error'

function loadCloudConfig() {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.supabaseUrl && parsed.supabaseUrl.includes('imnqwelbgxxnegapowpu')) {
        delete parsed.supabaseUrl;
        delete parsed.supabaseKey;
      }
      cloudConfig = { ...cloudConfig, ...parsed };
    }
  } catch (e) {
    console.warn('Cloud config load warning:', e);
  }
}

function saveCloudConfig() {
  try {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(cloudConfig));
  } catch (e) {}
}

function getFullSchoolCloudKey() {
  const code = (cloudConfig.schoolCode || 'MIZAN-2026').trim().toUpperCase().replace(/\s+/g, '-');
  const lvl = appData?.config?.schoolLevel || 'primary';
  return `${code}_${lvl}`;
}

function updateCloudUiBadge(state, customText = '') {
  cloudStatusState = state;
  const btn = document.getElementById('btnCloudSyncHeader');
  const modalStatus = document.getElementById('cloudModalStatusText');
  const sqlSetupBox = document.getElementById('cloudSqlSetupAlert');

  let badgeHtml = '';
  let statusDesc = '';
  const hasPin = !!(cloudConfig.secretPin && cloudConfig.secretPin.trim());
  const shieldIcon = hasPin ? '<i class="fa-solid fa-shield-halved text-amber-300 ml-1" title="محمي برمز سري"></i>' : '';

  if (!cloudConfig.enabled) {
    badgeHtml = '<i class="fa-solid fa-cloud text-slate-400"></i> <span class="text-slate-300">السحابة: متوقفة</span>';
    statusDesc = '⚪ المزامنة السحابية متوقفة حالياً (النظام يعمل بالوضع المحلي).';
  } else if (state === 'syncing') {
    badgeHtml = '<i class="fa-solid fa-rotate fa-spin text-amber-300"></i> <span class="text-amber-200">جاري المزامنة...</span>';
    statusDesc = '🔄 جاري التشفير والمزامنة الذكية مع قاعدة البيانات السحابية...';
  } else if (state === 'connected') {
    badgeHtml = `${shieldIcon}<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block ml-1"></span><i class="fa-solid fa-cloud text-emerald-400"></i> <span class="text-emerald-200">متصل ومؤمّن</span>`;
    statusDesc = customText || `🟢 متصل بقاعدة البيانات السحابية بنجاح (${getFullSchoolCloudKey()})${hasPin ? ' 🔒 محمي برمز سري' : ''}`;
  } else if (state === 'locked_pin') {
    badgeHtml = '<i class="fa-solid fa-lock text-rose-400"></i> <span class="text-rose-200">مطلوب الرمز السري</span>';
    statusDesc = customText || '🔒 هذا السجل السحابي محمي برمز سري (PIN) من قِبل إدارة المدرسة. يرجى إدخال الرمز الصحيح.';
  } else if (state === 'needs_table') {
    badgeHtml = '<i class="fa-solid fa-triangle-exclamation text-amber-400"></i> <span class="text-amber-300">تفعيل جدول السحابة</span>';
    statusDesc = '🟡 الاتصال بالسيرفر ناجح، يرجى تشغيل كود SQL لإنشاء جدول (mizan_cloud_sync) لأول مرة.';
  } else {
    badgeHtml = '<i class="fa-solid fa-cloud-bolt text-rose-400"></i> <span class="text-rose-200">أوفلاين / محلي</span>';
    statusDesc = customText || '⚪ وضع عدم الاتصال — تعديلاتك محفوظة محلياً وستُرفع تلقائياً فور عودة الإنترنت.';
  }

  if (btn) btn.innerHTML = badgeHtml;
  if (modalStatus) modalStatus.innerText = statusDesc;
  if (sqlSetupBox) {
    if (state === 'needs_table') sqlSetupBox.classList.remove('hidden');
    else sqlSetupBox.classList.add('hidden');
  }
}

async function pushToCloud(silent = true, forceOverwrite = false) {
  if (!cloudConfig.enabled || !cloudConfig.supabaseUrl || !cloudConfig.supabaseKey) return false;
  if (isPullingFromCloud) return false;

  if (!navigator.onLine) {
    pendingOfflinePush = true;
    updateCloudUiBadge('offline');
    return false;
  }

  updateCloudUiBadge('syncing');
  const fullKey = getFullSchoolCloudKey();
  const pinHash = typeof computeCloudPinHash === 'function'
    ? await computeCloudPinHash(cloudConfig.secretPin, cloudConfig.schoolCode)
    : '';

  try {
    // 1. جلب السجل السحابي الحالي للتحقق من الرمز السري وإجراء الدمج الذكي غير المدمّر
    const checkUrl = `${cloudConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/mizan_cloud_sync?school_code=eq.${encodeURIComponent(fullKey)}&select=payload,pin_hash,updated_at&limit=1`;
    const checkRes = await fetch(checkUrl, { headers: { 'apikey': cloudConfig.supabaseKey } });

    let payloadToPush = appData;
    if (checkRes.ok) {
      const existingRows = await checkRes.json();
      if (Array.isArray(existingRows) && existingRows.length > 0) {
        const remoteRow = existingRows[0];
        if (remoteRow.pin_hash && remoteRow.pin_hash !== '' && remoteRow.pin_hash !== pinHash) {
          updateCloudUiBadge('locked_pin', '🔒 الرمز السري للسحابة غير مطابق! تم رفض التعديل لحماية بيانات المدرسة.');
          if (!silent && typeof showToast === 'function') {
            showToast('🔒 الرمز السري للسحابة (PIN) غير صحيح! لا يمكن الكتابة فوق سجل المدرسة المحمي.', 'error');
          }
          return false;
        }
        // درع منع المسح من جهاز فارغ + دمج درجات المواد المتزامنة
        if (!forceOverwrite && typeof smartMergeCloudPayload === 'function' && remoteRow.payload) {
          const remoteCount = Array.isArray(remoteRow.payload.students) ? remoteRow.payload.students.length : 0;
          const localCount = Array.isArray(appData.students) ? appData.students.length : 0;
          if (localCount === 0 && remoteCount > 0) {
            // الجهاز المحلي فارغ بينما السحابة تحتوي على طلبة -> نسحب بدلاً من المسح!
            await pullFromCloud(true);
            return true;
          }
          payloadToPush = smartMergeCloudPayload(remoteRow.payload, appData, true);
          appData.grades = payloadToPush.grades;
          appData.subjectDetails = payloadToPush.subjectDetails;
        }
      }
    }

    const nowIso = new Date().toISOString();
    const bodyObj = {
      school_code: fullKey,
      school_name: payloadToPush?.config?.schoolName || 'مدرسة ميزان',
      school_level: payloadToPush?.config?.schoolLevel || 'primary',
      payload: forceOverwrite ? { ...payloadToPush, allowEmptyOverwrite: true } : payloadToPush,
      updated_at: nowIso,
      updated_by: cloudConfig.userName || 'الكنترول',
      pin_hash: pinHash
    };

    const res = await fetch(`${cloudConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/mizan_cloud_sync`, {
      method: 'POST',
      headers: {
        'apikey': cloudConfig.supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(bodyObj)
    });

    if (res.ok) {
      pendingOfflinePush = false;
      lastCloudUpdatedAt = nowIso;
      updateCloudUiBadge('connected', `🟢 تمت المزامنة والتأمين في السحابة (${new Date().toLocaleTimeString('ar-IQ')})`);
      if (!silent && typeof showToast === 'function') {
        showToast('☁️ تم دمج ورفع كافة بيانات المدرسة والدرجات إلى السحابة المحمية بنجاح!', 'success');
      }
      return true;
    } else {
      const errText = await res.text();
      if (errText.includes('INVALID_CLOUD_PIN')) {
        updateCloudUiBadge('locked_pin');
        if (!silent && typeof showToast === 'function') showToast('🔒 الرمز السري للسحابة غير صحيح!', 'error');
      } else if (errText.includes('PGRST205') || res.status === 404) {
        updateCloudUiBadge('needs_table');
        if (!silent) openCloudSyncModal();
      } else {
        updateCloudUiBadge('error', `⚠️ تنبيه سحابي (${res.status})`);
      }
      return false;
    }
  } catch (err) {
    pendingOfflinePush = true;
    updateCloudUiBadge('offline');
    return false;
  }
}

async function pullFromCloud(silent = false) {
  if (!cloudConfig.enabled || !cloudConfig.supabaseUrl || !cloudConfig.supabaseKey) return false;

  updateCloudUiBadge('syncing');
  const fullKey = getFullSchoolCloudKey();
  const pinHash = typeof computeCloudPinHash === 'function'
    ? await computeCloudPinHash(cloudConfig.secretPin, cloudConfig.schoolCode)
    : '';

  try {
    const url = `${cloudConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/mizan_cloud_sync?school_code=eq.${encodeURIComponent(fullKey)}&select=*&limit=1`;
    const res = await fetch(url, { headers: { 'apikey': cloudConfig.supabaseKey } });

    if (!res.ok) {
      const errText = await res.text();
      if (errText.includes('PGRST205') || res.status === 404) {
        updateCloudUiBadge('needs_table');
        if (!silent) openCloudSyncModal();
      } else {
        updateCloudUiBadge('error');
      }
      return false;
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      if (Array.isArray(appData.students) && appData.students.length > 0) {
        await pushToCloud(true);
      } else {
        updateCloudUiBadge('connected', `🟢 السحابة جاهزة (${fullKey}) — بانتظار رفع بيانات الطلبة`);
      }
      return true;
    }

    const cloudRecord = rows[0];
    if (cloudRecord.pin_hash && cloudRecord.pin_hash !== '' && cloudRecord.pin_hash !== pinHash) {
      updateCloudUiBadge('locked_pin', '🔒 هذا السجل محمي برمز سري (PIN). يرجى إدخال الرمز الصحيح في إعدادات السحابة.');
      if (!silent) {
        openCloudSyncModal();
        if (typeof showToast === 'function') showToast('🔒 يرجى إدخال الرمز السري للسحابة (PIN) الخاص بالمدرسة للوصول للبيانات.', 'warning');
      }
      return false;
    }

    const incomingData = cloudRecord.payload;
    if (incomingData && typeof incomingData === 'object') {
      isPullingFromCloud = true;
      lastCloudUpdatedAt = cloudRecord.updated_at;

      const merged = typeof smartMergeCloudPayload === 'function'
        ? smartMergeCloudPayload(incomingData, appData, false)
        : incomingData;

      appData.config = { ...appData.config, ...(merged.config || {}) };
      appData.rooms = merged.rooms || appData.rooms;
      appData.students = merged.students || [];
      appData.grades = merged.grades || {};
      appData.subjectDetails = merged.subjectDetails || {};

      if (typeof saveCurrentProfile === 'function') saveCurrentProfile();
      if (typeof syncConfigUI === 'function') syncConfigUI();
      if (typeof renderAll === 'function') renderAll();

      isPullingFromCloud = false;
      const byWho = cloudRecord.updated_by || 'الكنترول';
      updateCloudUiBadge('connected', `🟢 متصل ومؤمّن (آخر تحديث بواسطة: ${byWho})`);

      if (!silent && typeof showToast === 'function') {
        showToast(`☁️ تم جلب ودمج أحدث البيانات والدرجات من السحابة (${appData.students.length} طالب)`, 'info');
      }
      return true;
    }
  } catch (err) {
    isPullingFromCloud = false;
    updateCloudUiBadge('offline');
  }
  return false;
}

async function checkCloudForUpdates() {
  if (!cloudConfig.enabled || !cloudConfig.autoSync || isPullingFromCloud) return;
  if (!navigator.onLine) {
    updateCloudUiBadge('offline');
    return;
  }
  if (pendingOfflinePush) {
    await pushToCloud(true);
    return;
  }

  const fullKey = getFullSchoolCloudKey();
  try {
    const url = `${cloudConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/mizan_cloud_sync?school_code=eq.${encodeURIComponent(fullKey)}&select=updated_at,updated_by,pin_hash&limit=1`;
    const res = await fetch(url, { headers: { 'apikey': cloudConfig.supabaseKey } });
    if (!res.ok) return;

    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0) {
      const remoteTime = rows[0].updated_at;
      if (remoteTime && remoteTime !== lastCloudUpdatedAt) {
        if (!lastCloudUpdatedAt || new Date(remoteTime) > new Date(lastCloudUpdatedAt)) {
          const ok = await pullFromCloud(true);
          if (ok && typeof showToast === 'function') {
            showToast(`☁️ مزامنة حية: تم استلام تحديثات جديدة من (${rows[0].updated_by || 'معلم آخر'})`, 'info');
          }
        }
      } else if (cloudStatusState !== 'locked_pin') {
        updateCloudUiBadge('connected');
      }
    } else {
      updateCloudUiBadge('connected');
    }
  } catch (e) {
    updateCloudUiBadge('offline');
  }
}

function scheduleCloudPush() {
  if (!cloudConfig.enabled || !cloudConfig.autoSync || isPullingFromCloud) return;
  if (cloudPushTimer) clearTimeout(cloudPushTimer);
  cloudPushTimer = setTimeout(() => { pushToCloud(true); }, 1500);
}

function openCloudSyncModal() {
  const modal = document.getElementById('cloudSyncModal');
  if (!modal) return;
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal('cloudInputUrl', cloudConfig.supabaseUrl || '');
  setVal('cloudInputKey', cloudConfig.supabaseKey || '');
  setVal('cloudInputSchoolCode', cloudConfig.schoolCode || 'MIZAN-2026');
  setVal('cloudInputPin', cloudConfig.secretPin || '');
  setVal('cloudInputUserName', cloudConfig.userName || 'إدارة المدرسة / الكنترول');

  const chk = document.getElementById('cloudInputEnabled');
  if (chk) chk.checked = !!cloudConfig.enabled;
  modal.classList.remove('hidden');

  if (typeof loadCloudBackupsList === 'function') loadCloudBackupsList();
}

function closeCloudSyncModal() {
  const modal = document.getElementById('cloudSyncModal');
  if (modal) modal.classList.add('hidden');
}

function saveCloudSettingsFromModal() {
  cloudConfig.supabaseUrl = (document.getElementById('cloudInputUrl')?.value || '').trim();
  cloudConfig.supabaseKey = (document.getElementById('cloudInputKey')?.value || '').trim();
  cloudConfig.schoolCode = (document.getElementById('cloudInputSchoolCode')?.value || 'MIZAN-2026').trim().toUpperCase();
  cloudConfig.secretPin = (document.getElementById('cloudInputPin')?.value || '').trim();
  cloudConfig.userName = (document.getElementById('cloudInputUserName')?.value || 'الكنترول').trim();
  cloudConfig.enabled = !!document.getElementById('cloudInputEnabled')?.checked;

  saveCloudConfig();
  if (cloudConfig.enabled) pullFromCloud(false);
  else updateCloudUiBadge('offline');
  closeCloudSyncModal();
}

function initCloudSyncEngine() {
  loadCloudConfig();
  if (typeof applyCloudUrlParams === 'function') applyCloudUrlParams();

  window.addEventListener('online', () => {
    if (pendingOfflinePush) pushToCloud(false);
    else checkCloudForUpdates();
  });
  window.addEventListener('offline', () => updateCloudUiBadge('offline'));

  if (cloudConfig.enabled) {
    setTimeout(() => { pullFromCloud(true); }, 800);
    if (cloudPollInterval) clearInterval(cloudPollInterval);
    cloudPollInterval = setInterval(checkCloudForUpdates, 8000);
  } else {
    updateCloudUiBadge('offline');
  }
}

window.loadCloudConfig = loadCloudConfig;
window.pushToCloud = pushToCloud;
window.pullFromCloud = pullFromCloud;
window.scheduleCloudPush = scheduleCloudPush;
window.openCloudSyncModal = openCloudSyncModal;
window.closeCloudSyncModal = closeCloudSyncModal;
window.saveCloudSettingsFromModal = saveCloudSettingsFromModal;
window.initCloudSyncEngine = initCloudSyncEngine;
