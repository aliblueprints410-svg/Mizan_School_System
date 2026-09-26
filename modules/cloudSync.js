// وحدة المزامنة السحابية المركزية والعمل التعاوني اللحظي (Supabase Cloud Database Sync)
// الميزانية القصوى: 350 سطر

const CLOUD_CONFIG_KEY = 'MIZAN_CLOUD_SYNC_CONFIG_2026';

let cloudConfig = {
  supabaseUrl: 'https://imnqwelbgxxnegapowpu.supabase.co',
  supabaseKey: 'sb_publishable_Pf2C0cVb5IsXAWvFBYOrSQ_D09k-Ho_',
  schoolCode: 'MIZAN-2026',
  userName: 'إدارة المدرسة / الكنترول',
  autoSync: true,
  enabled: true
};

let lastCloudUpdatedAt = null;
let isPullingFromCloud = false;
let cloudPushTimer = null;
let cloudPollInterval = null;
let cloudStatusState = 'idle'; // 'connected', 'syncing', 'needs_table', 'offline', 'error'

function loadCloudConfig() {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
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

  if (!cloudConfig.enabled) {
    badgeHtml = '<i class="fa-solid fa-cloud text-slate-400"></i> <span class="text-slate-300">السحابة: متوقفة</span>';
    statusDesc = '⚪ المزامنة السحابية متوقفة حالياً (النظام يعمل بالوضع المحلي).';
  } else if (state === 'syncing') {
    badgeHtml = '<i class="fa-solid fa-rotate fa-spin text-amber-300"></i> <span class="text-amber-200">جاري المزامنة...</span>';
    statusDesc = '🔄 جاري مزامنة البيانات مع قاعدة البيانات السحابية...';
  } else if (state === 'connected') {
    badgeHtml = '<i class="fa-solid fa-cloud-Showers-heavy hidden"></i><span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block ml-1"></span><i class="fa-solid fa-cloud text-emerald-400"></i> <span class="text-emerald-200">متصل بالسحابة</span>';
    statusDesc = customText || `🟢 متصل بقاعدة البيانات السحابية بنجاح (الكود: ${getFullSchoolCloudKey()})`;
  } else if (state === 'needs_table') {
    badgeHtml = '<i class="fa-solid fa-triangle-exclamation text-amber-400"></i> <span class="text-amber-300">تفعيل جدول السحابة</span>';
    statusDesc = '🟡 الاتصال بالسيرفر ناجح، يرجى تشغيل كود SQL لإنشاء جدول (mizan_cloud_sync) لأول مرة.';
  } else {
    badgeHtml = '<i class="fa-solid fa-cloud-bolt text-rose-400"></i> <span class="text-rose-200">أوفلاين / محلي</span>';
    statusDesc = customText || '⚪ تعذر الوصول للسحابة حالياً — بياناتك محفوظة محلياً بأمان.';
  }

  if (btn) btn.innerHTML = badgeHtml;
  if (modalStatus) modalStatus.innerText = statusDesc;
  if (sqlSetupBox) {
    if (state === 'needs_table') sqlSetupBox.classList.remove('hidden');
    else sqlSetupBox.classList.add('hidden');
  }
}

async function pushToCloud(silent = true) {
  if (!cloudConfig.enabled || !cloudConfig.supabaseUrl || !cloudConfig.supabaseKey) return false;
  if (isPullingFromCloud) return false;

  updateCloudUiBadge('syncing');
  const fullKey = getFullSchoolCloudKey();
  const nowIso = new Date().toISOString();

  const bodyObj = {
    school_code: fullKey,
    school_name: appData?.config?.schoolName || 'مدرسة ميزان',
    school_level: appData?.config?.schoolLevel || 'primary',
    payload: appData,
    updated_at: nowIso,
    updated_by: cloudConfig.userName || 'الكنترول'
  };

  try {
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
      lastCloudUpdatedAt = nowIso;
      updateCloudUiBadge('connected', `🟢 تمت المزامنة والحفظ في السحابة (${new Date().toLocaleTimeString('ar-IQ')})`);
      if (!silent && typeof showToast === 'function') {
        showToast('☁️ تم رفع ومزامنة كافة بيانات المدرسة والدرجات إلى السحابة بنجاح!', 'success');
      }
      return true;
    } else {
      const errText = await res.text();
      if (errText.includes('PGRST205') || res.status === 404) {
        updateCloudUiBadge('needs_table');
        if (!silent) openCloudSyncModal();
      } else {
        updateCloudUiBadge('error', `⚠️ خطأ سحابي (${res.status})`);
      }
      return false;
    }
  } catch (err) {
    updateCloudUiBadge('offline');
    return false;
  }
}

async function pullFromCloud(silent = false) {
  if (!cloudConfig.enabled || !cloudConfig.supabaseUrl || !cloudConfig.supabaseKey) return false;

  updateCloudUiBadge('syncing');
  const fullKey = getFullSchoolCloudKey();

  try {
    const url = `${cloudConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/mizan_cloud_sync?school_code=eq.${encodeURIComponent(fullKey)}&select=*&limit=1`;
    const res = await fetch(url, {
      headers: { 'apikey': cloudConfig.supabaseKey }
    });

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
      // لا توجد بيانات بعد لهذا الكود في السحابة، نقوم برفع البيانات الحالية كبداية
      await pushToCloud(true);
      return true;
    }

    const cloudRecord = rows[0];
    const incomingData = cloudRecord.payload;

    if (incomingData && typeof incomingData === 'object') {
      isPullingFromCloud = true;
      lastCloudUpdatedAt = cloudRecord.updated_at;

      appData.config = { ...appData.config, ...(incomingData.config || {}) };
      appData.rooms = incomingData.rooms || appData.rooms;
      appData.students = incomingData.students || [];
      appData.grades = incomingData.grades || {};
      appData.subjectDetails = incomingData.subjectDetails || {};

      if (typeof saveCurrentProfile === 'function') saveCurrentProfile();
      if (typeof syncConfigUI === 'function') syncConfigUI();
      if (typeof renderAll === 'function') renderAll();

      isPullingFromCloud = false;
      const byWho = cloudRecord.updated_by || 'الكنترول';
      updateCloudUiBadge('connected', `🟢 متصل ومحدث من السحابة (آخر تحديث بواسطة: ${byWho})`);

      if (!silent && typeof showToast === 'function') {
        showToast(`☁️ تم جلب أحدث البيانات والدرجات من السحابة (${appData.students.length} طالب)`, 'info');
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
  const fullKey = getFullSchoolCloudKey();

  try {
    const url = `${cloudConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/mizan_cloud_sync?school_code=eq.${encodeURIComponent(fullKey)}&select=updated_at,updated_by&limit=1`;
    const res = await fetch(url, {
      headers: { 'apikey': cloudConfig.supabaseKey }
    });

    if (!res.ok) {
      const txt = await res.text();
      if (txt.includes('PGRST205')) updateCloudUiBadge('needs_table');
      return;
    }

    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0) {
      const remoteTime = rows[0].updated_at;
      if (remoteTime && remoteTime !== lastCloudUpdatedAt) {
        if (!lastCloudUpdatedAt || new Date(remoteTime) > new Date(lastCloudUpdatedAt)) {
          await pullFromCloud(true);
          if (typeof showToast === 'function') {
            showToast(`☁️ مزامنة فورية: تم تحديث البيانات من (${rows[0].updated_by || 'معلم آخر'})`, 'info');
          }
        }
      } else {
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
  cloudPushTimer = setTimeout(() => {
    pushToCloud(true);
  }, 1500);
}

function openCloudSyncModal() {
  const modal = document.getElementById('cloudSyncModal');
  if (!modal) return;

  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal('cloudInputUrl', cloudConfig.supabaseUrl || '');
  setVal('cloudInputKey', cloudConfig.supabaseKey || '');
  setVal('cloudInputSchoolCode', cloudConfig.schoolCode || 'MIZAN-2026');
  setVal('cloudInputUserName', cloudConfig.userName || 'إدارة المدرسة / الكنترول');

  const chk = document.getElementById('cloudInputEnabled');
  if (chk) chk.checked = !!cloudConfig.enabled;

  modal.classList.remove('hidden');
}

function closeCloudSyncModal() {
  const modal = document.getElementById('cloudSyncModal');
  if (modal) modal.classList.add('hidden');
}

function saveCloudSettingsFromModal() {
  cloudConfig.supabaseUrl = (document.getElementById('cloudInputUrl')?.value || '').trim();
  cloudConfig.supabaseKey = (document.getElementById('cloudInputKey')?.value || '').trim();
  cloudConfig.schoolCode = (document.getElementById('cloudInputSchoolCode')?.value || 'MIZAN-2026').trim().toUpperCase();
  cloudConfig.userName = (document.getElementById('cloudInputUserName')?.value || 'الكنترول').trim();
  cloudConfig.enabled = !!document.getElementById('cloudInputEnabled')?.checked;

  saveCloudConfig();
  if (cloudConfig.enabled) {
    pullFromCloud(false);
  } else {
    updateCloudUiBadge('offline');
  }
  closeCloudSyncModal();
}

function copyCloudSetupSql() {
  const sql = `CREATE TABLE IF NOT EXISTS public.mizan_cloud_sync (
  school_code TEXT PRIMARY KEY,
  school_name TEXT DEFAULT '',
  school_level TEXT DEFAULT 'primary',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT DEFAULT 'الكنترول'
);
ALTER TABLE public.mizan_cloud_sync ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all mizan_cloud_sync" ON public.mizan_cloud_sync;
CREATE POLICY "Allow all mizan_cloud_sync" ON public.mizan_cloud_sync FOR ALL USING (true) WITH CHECK (true);`;

  navigator.clipboard.writeText(sql).then(() => {
    alert('✅ تم نسخ كود SQL بنجاح!\n\nالخطوة الوحيدة:\n1. افتح لوحة تحكم Supabase الخاصة بك.\n2. ادخل على قسم (SQL Editor).\n3. الصق الكود واضغط (RUN).\nوستعمل المزامنة السحابية فوراً!');
  });
}

function initCloudSyncEngine() {
  loadCloudConfig();
  if (cloudConfig.enabled) {
    setTimeout(() => { checkCloudForUpdates(); }, 1200);
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
window.copyCloudSetupSql = copyCloudSetupSql;
window.initCloudSyncEngine = initCloudSyncEngine;
