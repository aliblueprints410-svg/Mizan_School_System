// وحدة التخزين وقواعد البيانات والنسخ الاحتياطي وتعدد سجلات المدارس (Storage & Multi-School Profile Engine)
// الميزانية القصوى: 260 سطر

let idb = null;
const IDB_NAME = 'SchoolSystemOfflineDB';
const IDB_STORE = 'app_data_store';

function initIndexedDB() {
  if (!window.indexedDB) return;
  try {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = function(e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = function(e) {
      idb = e.target.result;
      syncDataToIndexedDB();
    };
  } catch (e) {
    console.warn('IndexedDB initialization skipped:', e);
  }
}

function syncDataToIndexedDB() {
  if (!idb) return;
  try {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put({ id: 'current_school_state', data: appData, updatedAt: Date.now() });
  } catch (err) {
    console.warn('IndexedDB sync warning:', err);
  }
}

function getProfileKey(level, customSchoolCode = null) {
  const base = window.STORAGE_KEY || 'SCHOOL_SYSTEM_MODULAR_2026';
  const code = (customSchoolCode || (typeof window.getActiveSchoolCode === 'function' ? window.getActiveSchoolCode() : 'MIZAN-2026')).trim().toUpperCase();
  if (!code || code === 'MIZAN-2026') return `${base}_profile_${level || 'primary'}`;
  return `${base}_profile_${code}_${level || 'primary'}`;
}

function getProfileData(level) {
  try {
    const raw = localStorage.getItem(getProfileKey(level));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function createFreshProfile(level, baseConfig = {}) {
  const firstGrade = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[level]?.grades[0]?.val) || '1';
  return {
    config: {
      schoolName: baseConfig.schoolName || '',
      schoolLevel: level,
      schoolYear: baseConfig.schoolYear || '2026 - 2027 م',
      examType: baseConfig.examType || 'قائمة درجات الامتحانات ( النهائية ) دور اول',
      examDate: baseConfig.examDate || new Date().toISOString().split('T')[0],
      principal: baseConfig.principal || '',
      secretary: baseConfig.secretary || '',
      activeGrade: firstGrade,
      activeSection: 'أ',
      enableGraceMarks: false,
      gradeSections: {}
    },
    rooms: [
      { id: 'r1', name: 'القاعة الامتحانية (1)', capacity: 30 },
      { id: 'r2', name: 'القاعة الامتحانية (2)', capacity: 30 },
      { id: 'r3', name: 'القاعة الامتحانية (3)', capacity: 30 },
      { id: 'r4', name: 'القاعة الامتحانية (4)', capacity: 30 }
    ],
    students: [],
    grades: {},
    subjectDetails: {}
  };
}

function saveCurrentProfile(level) {
  const lvl = level || appData.config?.schoolLevel || 'primary';
  try {
    localStorage.setItem(getProfileKey(lvl), JSON.stringify(appData));
  } catch (e) {
    console.error('Error saving profile:', e);
  }
}

function switchSchoolProfile(newLevel) {
  const currentLevel = appData.config?.schoolLevel || 'primary';
  if (newLevel === currentLevel) return;

  if (window.isControlLocked && window.isControlLocked()) {
    if (typeof showToast === 'function') showToast('⚠️ سجل الكنترول مشمع ومقفل! لا يمكن التبديل بين المدارس إلا بعد فك القفل.', 'warning');
    if (typeof syncConfigUI === 'function') syncConfigUI();
    return;
  }

  // 1. أخذ لقطة أمان للسجل السابق
  if (typeof window.takeSnapshot === 'function') {
    const curTitle = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[currentLevel]?.title) || currentLevel;
    window.takeSnapshot('قبل التبديل من سجل مدرسة ' + curTitle);
  }

  // 2. حفظ السجل السابق
  saveCurrentProfile(currentLevel);

  // 3. تحميل السجل الهدف أو تجهيز سجل جديد مستقل
  const targetData = getProfileData(newLevel);
  if (targetData) {
    appData.config = { ...appData.config, ...(targetData.config || {}) };
    appData.config.schoolLevel = newLevel;
    appData.rooms = targetData.rooms || [];
    appData.students = targetData.students || [];
    appData.grades = targetData.grades || {};
    appData.subjectDetails = targetData.subjectDetails || {};
  } else {
    // إنشاء سجل فارغ وجديد تماماً للمرحلة المختارة
    const fresh = createFreshProfile(newLevel, appData.config);
    appData.config = fresh.config;
    appData.rooms = fresh.rooms;
    appData.students = fresh.students;
    appData.grades = fresh.grades;
    appData.subjectDetails = fresh.subjectDetails;
  }

  const activeKey = window.ACTIVE_LEVEL_KEY || 'SCHOOL_SYSTEM_ACTIVE_LEVEL';
  localStorage.setItem(activeKey, newLevel);
  saveData();

  if (typeof onSchoolLevelChange === 'function') onSchoolLevelChange(false);
  if (typeof syncConfigUI === 'function') syncConfigUI();
  if (typeof renderAll === 'function') renderAll();

  const title = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[newLevel]?.title) || newLevel;
  if (typeof showToast === 'function') {
    showToast(`🏫 تم الانتقال إلى سجل (${title}) - عدد الطلبة: ${appData.students.length}`, 'success');
  }
}

function loadData() {
  const primaryKey = getProfileKey('primary');
  const legacyRaw = localStorage.getItem(STORAGE_KEY);

  // ترحيل البيانات القديمة بذكاء: لو كان هناك سجل ابتدائي سابق
  if (!localStorage.getItem(primaryKey) && legacyRaw) {
    try {
      localStorage.setItem(primaryKey, legacyRaw);
    } catch (e) {}
  }

  const activeKey = window.ACTIVE_LEVEL_KEY || 'SCHOOL_SYSTEM_ACTIVE_LEVEL';
  let activeLevel = localStorage.getItem(activeKey) || 'primary';
  let saved = getProfileData(activeLevel);

  // إذا لم نجد بيانات للمستوى النشط ولكن وجدنا في primary، نبدأ من primary
  if (!saved && activeLevel !== 'primary' && getProfileData('primary')) {
    activeLevel = 'primary';
    localStorage.setItem(activeKey, 'primary');
    saved = getProfileData('primary');
  }

  if (saved) {
    appData.config = { ...appData.config, ...(saved.config || {}) };
    appData.config.schoolLevel = activeLevel;
    appData.rooms = saved.rooms || appData.rooms;
    appData.students = saved.students || [];
    appData.grades = saved.grades || {};
    appData.subjectDetails = saved.subjectDetails || {};
  } else {
    Object.assign(appData, createFreshProfile(activeLevel, appData.config));
  }

  if (typeof onSchoolLevelChange === 'function') {
    onSchoolLevelChange(false);
  }
  if (typeof syncConfigUI === 'function') syncConfigUI();
  if (typeof renderAll === 'function') renderAll();
}

function saveData() {
  const lvl = appData.config?.schoolLevel || 'primary';
  const activeKey = window.ACTIVE_LEVEL_KEY || 'SCHOOL_SYSTEM_ACTIVE_LEVEL';
  try {
    localStorage.setItem(getProfileKey(lvl), JSON.stringify(appData));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    localStorage.setItem(activeKey, lvl);
  } catch (e) {
    console.error('Error saving data to localStorage:', e);
    alert('تحذير: تعذر حفظ البيانات محلياً. قد تكون المساحة التخزينية للمتصفح ممتلئة.');
  }

  syncDataToIndexedDB();
  if (typeof syncConfigUI === 'function') syncConfigUI();
  if (typeof updateDashboardCounts === 'function') updateDashboardCounts();
  if (typeof scheduleCloudPush === 'function') scheduleCloudPush();
}

function exportFullBackupJSON() {
  saveCurrentProfile();
  const currentLvl = appData.config?.schoolLevel || 'primary';
  const fullBackup = {
    backupFormat: 'multi_school_v1',
    activeLevel: currentLvl,
    profiles: {
      primary: getProfileData('primary') || (currentLvl === 'primary' ? appData : null),
      middle: getProfileData('middle') || (currentLvl === 'middle' ? appData : null),
      high: getProfileData('high') || (currentLvl === 'high' ? appData : null)
    }
  };

  const dataStr = JSON.stringify(fullBackup, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const schoolName = (appData.config?.schoolName || 'مدرسة').replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  link.href = url;
  link.setAttribute('download', `نسخة_احتياطية_شاملة_${schoolName}_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function triggerImportBackup() {
  const fileInput = document.getElementById('backupFileInput');
  if (fileInput) fileInput.click();
}

function handleBackupImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported || typeof imported !== 'object') {
        throw new Error('الملف ليس بتنسيق JSON صالح.');
      }
      if (confirm('هل أنت متأكد من استرجاع هذه النسخة الاحتياطية؟ سيتم تحديث بيانات المدرسة.')) {
        if (imported.backupFormat === 'multi_school_v1' && imported.profiles) {
          // استرجاع النسخة متعددة السجلات
          ['primary', 'middle', 'high'].forEach(lvl => {
            if (imported.profiles[lvl]) {
              localStorage.setItem(getProfileKey(lvl), JSON.stringify(imported.profiles[lvl]));
            }
          });
          const targetLvl = imported.activeLevel || 'primary';
          localStorage.setItem(window.ACTIVE_LEVEL_KEY || 'SCHOOL_SYSTEM_ACTIVE_LEVEL', targetLvl);
          loadData();
        } else {
          // استرجاع نسخة أحادية تقليدية
          appData.config = imported.config || appData.config;
          appData.rooms = imported.rooms || appData.rooms;
          appData.students = imported.students || [];
          appData.grades = imported.grades || {};
          appData.subjectDetails = imported.subjectDetails || {};
          saveData();
          if (typeof onSchoolLevelChange === 'function') onSchoolLevelChange(false);
          if (typeof renderAll === 'function') renderAll();
        }
        alert('تم استرجاع النسخة الاحتياطية بنجاح!');
      }
    } catch (err) {
      alert('خطأ في استيراد ملف النسخة الاحتياطية: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function clearStudentsAndGradesOnly() {
  const lvlTitle = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[appData.config?.schoolLevel]?.title) || 'الحالية';
  const confirmMsg = `هل تريد تفريغ سجل الطلبة والدرجات لمرحلة (${lvlTitle}) فقط؟\n\n(لن تتأثر المراحل والمدارس الأخرى).`;
  if (confirm(confirmMsg)) {
    if (typeof window.takeSnapshot === 'function') {
      window.takeSnapshot('قبل تفريغ سجل طلبة ' + lvlTitle);
    }
    appData.students = [];
    appData.grades = {};
    appData.subjectDetails = {};
    saveData();
    if (typeof renderAll === 'function') renderAll();
    alert("تم تفريغ سجل الطلبة والدرجات بنجاح.");
  }
}

function resetDataPrompt() {
  if (confirm('تنبيه شديد الأهمية: سيتم مسح كافة بيانات المدارس والمراحل بالكامل!\nهل أنت متأكد من المتابعة؟')) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(window.ACTIVE_LEVEL_KEY || 'SCHOOL_SYSTEM_ACTIVE_LEVEL');
    ['primary', 'middle', 'high'].forEach(lvl => {
      localStorage.removeItem(getProfileKey(lvl));
    });
    location.reload();
  }
}

initIndexedDB();

window.getProfileKey = getProfileKey;
window.getProfileData = getProfileData;
window.createFreshProfile = createFreshProfile;
window.saveCurrentProfile = saveCurrentProfile;
window.switchSchoolProfile = switchSchoolProfile;
window.loadData = loadData;
window.saveData = saveData;
window.syncDataToIndexedDB = syncDataToIndexedDB;
window.exportFullBackupJSON = exportFullBackupJSON;
window.triggerImportBackup = triggerImportBackup;
window.handleBackupImport = handleBackupImport;
window.clearStudentsAndGradesOnly = clearStudentsAndGradesOnly;
window.resetDataPrompt = resetDataPrompt;
