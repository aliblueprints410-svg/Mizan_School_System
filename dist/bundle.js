/* حزمة النظام الموزعة آلياً - يُمنع التعديل اليدوي المباشر هنا */

/* --- Start of coreState.js --- */
// وحدة الحالة العامة والتعقيم (Core State & Sanitization)
// الميزانية القصوى: 150 سطر

const STORAGE_KEY = 'SCHOOL_SYSTEM_MODULAR_2026';

let appData = {
  config: {
    schoolName: '',
    schoolLevel: 'primary',
    schoolYear: '2026 - 2027 م',
    examType: 'قائمة درجات الامتحانات ( النهائية ) دور اول',
    examDate: '2026-09-23',
    principal: '',
    secretary: '',
    activeGrade: '1',
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

// دالة التعقيم لمنع ثغرات XSS
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const ACTIVE_LEVEL_KEY = 'SCHOOL_SYSTEM_ACTIVE_LEVEL';
const SYSTEM_VERSION = 'v 1.0.6';
const DEVELOPER_INFO = {
  name: 'علي',
  telegram: 'https://t.me/Ali_Muhammed_410',
  whatsapp: 'eng.ali410'
};

function getSchoolGenderPolicy() {
  const custom = window.appData?.config?.schoolGender;
  if (custom === 'boys') return 'boys';
  if (custom === 'girls') return 'girls';
  if (custom === 'mixed') return 'mixed';

  const name = (window.appData?.config?.schoolName || '').trim();
  if (/بنين|ذكور|صبيان/i.test(name)) return 'boys';
  if (/بنات|إناث|اناث/i.test(name)) return 'girls';
  return 'mixed';
}

function syncStudentsWithSchoolGenderPolicy(silent = true) {
  const policy = getSchoolGenderPolicy();
  if (!window.appData || !Array.isArray(window.appData.students)) return 0;

  let changed = 0;
  if (policy === 'boys') {
    window.appData.students.forEach(s => {
      if (s.gender !== 'ذكر') {
        s.gender = 'ذكر';
        changed++;
      }
    });
  } else if (policy === 'girls') {
    window.appData.students.forEach(s => {
      if (s.gender !== 'أنثى') {
        s.gender = 'أنثى';
        changed++;
      }
    });
  }

  if (changed > 0) {
    if (typeof window.saveData === 'function') window.saveData();
    if (typeof window.renderAll === 'function') window.renderAll();
    if (!silent && typeof window.showToast === 'function') {
      const msg = policy === 'boys'
        ? `✅ تم توحيد جنس كافة الطلبة (${changed} طالب) إلى "ذكر" تلقائياً لمطابقة مدرسة البنين.`
        : `✅ تم توحيد جنس كافة الطالبات (${changed} طالبة) إلى "أنثى" تلقائياً لمطابقة مدرسة البنات.`;
      window.showToast(msg, 'info');
    }
  }
  return changed;
}

window.STORAGE_KEY = STORAGE_KEY;
window.ACTIVE_LEVEL_KEY = ACTIVE_LEVEL_KEY;
window.SYSTEM_VERSION = SYSTEM_VERSION;
window.DEVELOPER_INFO = DEVELOPER_INFO;
window.getSchoolGenderPolicy = getSchoolGenderPolicy;
window.syncStudentsWithSchoolGenderPolicy = syncStudentsWithSchoolGenderPolicy;
window.appData = appData;
window.escapeHtml = escapeHtml;



/* --- Start of subjectsConfig.js --- */
// وحدة تهيئة وتعريف المواد الدراسية والمسميات (Subjects Configuration & Aliases)
// الميزانية القصوى: 140 سطر

const SUBJECTS_INFO = {
  islamic: 'التربية الإسلامية',
  reading: 'القراءة',
  arabic: 'اللغة العربية',
  english: 'اللغة الإنكليزية',
  math: 'الرياضيات',
  science: 'العلوم',
  ethics: 'الأخلاقية',
  social: 'الاجتماعيات',
  computer: 'الحاسوب',
  physics: 'الفيزياء',
  chemistry: 'الكيمياء',
  biology: 'الأحياء',
  art: 'التربية الفنية',
  sport: 'التربية الرياضية'
};

const SUBJECT_ALIASES = {
  'التربية الإسلامية': 'islamic',
  'الإسلامية': 'islamic',
  'إسلامية': 'islamic',
  'القراءة': 'reading',
  'قراءة': 'reading',
  'اللغة العربية': 'arabic',
  'العربية': 'arabic',
  'عربي': 'arabic',
  'اللغة الإنكليزية': 'english',
  'الإنكليزية': 'english',
  'الانكليزية': 'english',
  'إنكليزي': 'english',
  'الرياضيات': 'math',
  'رياضيات': 'math',
  'العلوم': 'science',
  'علوم': 'science',
  'الأخلاقية': 'ethics',
  'الاخلاقية': 'ethics',
  'التربية الأخلاقية': 'ethics',
  'أخلاقية': 'ethics',
  'اخلاقية': 'ethics',
  'الاجتماعيات': 'social',
  'اجتماعيات': 'social',
  'الحاسوب': 'computer',
  'حاسوب': 'computer',
  'الفيزياء': 'physics',
  'الكيمياء': 'chemistry',
  'الأحياء': 'biology',
  'التربية الفنية': 'art',
  'الفنية': 'art',
  'فنية': 'art',
  'التربية الرياضية': 'sport',
  'الرياضة': 'sport',
  'رياضة': 'sport'
};

function getSubjectsForGrade(level = 'primary', gradeVal = '1') {
  const lvl = level || 'primary';
  const gStr = String(gradeVal || '1');

  if (lvl === 'primary') {
    // الصفوف 1 و 2 و 3
    if (['1', '2', '3'].includes(gStr)) {
      return [
        { id: 'islamic', name: 'التربية الإسلامية' },
        { id: 'reading', name: 'القراءة' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'science', name: 'العلوم' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'ethics', name: 'الأخلاقية' },
        { id: 'sport', name: 'التربية الرياضية' },
        { id: 'art', name: 'التربية الفنية' }
      ];
    }
    // الصفوف 4 و 5 و 6
    return [
      { id: 'islamic', name: 'التربية الإسلامية' },
      { id: 'arabic', name: 'اللغة العربية' },
      { id: 'math', name: 'الرياضيات' },
      { id: 'science', name: 'العلوم' },
      { id: 'english', name: 'اللغة الإنكليزية' },
      { id: 'social', name: 'الاجتماعيات' },
      { id: 'sport', name: 'التربية الرياضية' },
      { id: 'art', name: 'التربية الفنية' }
    ];
  }

  if (lvl === 'middle') {
    return [
      { id: 'islamic', name: 'التربية الإسلامية' },
      { id: 'arabic', name: 'اللغة العربية' },
      { id: 'english', name: 'اللغة الإنكليزية' },
      { id: 'math', name: 'الرياضيات' },
      { id: 'science', name: 'العلوم' },
      { id: 'social', name: 'الاجتماعيات' },
      { id: 'computer', name: 'الحاسوب' },
      { id: 'sport', name: 'التربية الرياضية' },
      { id: 'art', name: 'التربية الفنية' }
    ];
  }

  if (lvl === 'high') {
    return [
      { id: 'islamic', name: 'التربية الإسلامية' },
      { id: 'arabic', name: 'اللغة العربية' },
      { id: 'english', name: 'اللغة الإنكليزية' },
      { id: 'math', name: 'الرياضيات' },
      { id: 'physics', name: 'الفيزياء' },
      { id: 'chemistry', name: 'الكيمياء' },
      { id: 'biology', name: 'الأحياء' }
    ];
  }

  return SUBJECTS_BY_LEVEL[lvl] || [];
}

const SUBJECTS_BY_LEVEL = {
  primary: [
    { id: 'islamic', name: 'التربية الإسلامية' },
    { id: 'reading', name: 'القراءة (1-3)' },
    { id: 'arabic', name: 'اللغة العربية (4-6)' },
    { id: 'math', name: 'الرياضيات' },
    { id: 'science', name: 'العلوم' },
    { id: 'english', name: 'اللغة الإنكليزية' },
    { id: 'ethics', name: 'الأخلاقية (1-3)' },
    { id: 'social', name: 'الاجتماعيات (4-6)' },
    { id: 'sport', name: 'التربية الرياضية' },
    { id: 'art', name: 'التربية الفنية' }
  ],
  middle: [
    { id: 'islamic', name: 'التربية الإسلامية' },
    { id: 'arabic', name: 'اللغة العربية' },
    { id: 'english', name: 'اللغة الإنكليزية' },
    { id: 'math', name: 'الرياضيات' },
    { id: 'science', name: 'العلوم' },
    { id: 'social', name: 'الاجتماعيات' },
    { id: 'computer', name: 'الحاسوب' },
    { id: 'sport', name: 'التربية الرياضية' },
    { id: 'art', name: 'التربية الفنية' }
  ],
  high: [
    { id: 'islamic', name: 'التربية الإسلامية' },
    { id: 'arabic', name: 'اللغة العربية' },
    { id: 'english', name: 'اللغة الإنكليزية' },
    { id: 'math', name: 'الرياضيات' },
    { id: 'physics', name: 'الفيزياء' },
    { id: 'chemistry', name: 'الكيمياء' },
    { id: 'biology', name: 'الأحياء' }
  ]
};

function normalizeSubjectId(subId) {
  if (!subId) return 'islamic';
  if (SUBJECTS_INFO[subId]) return subId;
  if (SUBJECT_ALIASES[subId]) return SUBJECT_ALIASES[subId];
  return subId;
}

window.SUBJECTS_INFO = SUBJECTS_INFO;
window.SUBJECT_ALIASES = SUBJECT_ALIASES;
window.SUBJECTS_BY_LEVEL = SUBJECTS_BY_LEVEL;
window.getSubjectsForGrade = getSubjectsForGrade;
window.normalizeSubjectId = normalizeSubjectId;


/* --- Start of storage.js --- */
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


/* --- Start of auditAndSnapshots.js --- */
/**
 * auditAndSnapshots.js - درع الأمان وسجل التدقيق ونقاط الاستعادة والتراجع الذكي
 * مسؤولية الوحدة: إدارة سجل التعديلات (Audit Trail)، أخذ لقطات تلقائية (Auto-Snapshots)،
 * وتوفير إمكانية التراجع الفوري (Undo) واستعادة أي نقطة زمنية سابقة بنقرة واحدة.
 */

const SNAPSHOTS_KEY = 'school_snapshots_v1';
const AUDIT_LOG_KEY = 'school_audit_log_v1';
const MAX_SNAPSHOTS = 10;
const MAX_AUDIT_LOGS = 50;

/**
 * أخذ لقطة تلقائية للنظام وحفظها في الذاكرة المحلية
 * @param {string} reason سبب أخذ اللقطة (مثال: قبل استيراد إكسل، قبل درجات القرار)
 */
function takeSnapshot(reason = 'تعديل بيانات') {
  try {
    if (!window.appData) return;
    const snapshots = getSnapshots();
    const newSnapshot = {
      id: 'snap_' + Date.now(),
      timestamp: new Date().toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'medium' }),
      reason: String(reason),
      data: JSON.parse(JSON.stringify(window.appData))
    };

    snapshots.unshift(newSnapshot);
    if (snapshots.length > MAX_SNAPSHOTS) {
      snapshots.pop();
    }
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    logAudit('نقطة استعادة', `تم حفظ لقطة أمان: ${reason}`);
    updateUndoButtonState();
  } catch (err) {
    console.warn('تعذر حفظ لقطة الأمان:', err);
  }
}

/**
 * جلب قائمة اللقطات المخزنة
 */
function getSnapshots() {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * التراجع الفوري عن آخر عملية (Undo)
 */
function undoLastAction() {
  if (window.isControlLocked && window.isControlLocked()) {
    showToast('⚠️ سجل الكنترول مشمع ومقفل! لا يمكن التراجع إلا بعد فك القفل.', 'warning');
    return;
  }

  const snapshots = getSnapshots();
  if (snapshots.length === 0) {
    showToast('لا توجد نقاط استعادة سابقة للتراجع عنها.', 'info');
    return;
  }

  const previousSnapshot = snapshots.shift(); // أخذ آخر لقطة
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));

  if (previousSnapshot && previousSnapshot.data) {
    window.appData = previousSnapshot.data;
    if (typeof window.saveData === 'function') window.saveData();
    if (typeof window.renderAll === 'function') window.renderAll();
    
    logAudit('تراجع ذكي', `تم التراجع بنجاح إلى: ${previousSnapshot.reason}`);
    showToast(`↩️ تم التراجع بنجاح إلى: (${previousSnapshot.reason})`, 'success');
    updateUndoButtonState();
  }
}

/**
 * استعادة لقطة محددة عبر الـ ID
 */
function restoreSnapshotById(snapId) {
  if (window.isControlLocked && window.isControlLocked()) {
    showToast('⚠️ سجل الكنترول مشمع ومقفل! لا يمكن الاستعادة إلا بعد فك القفل.', 'warning');
    return;
  }

  const snapshots = getSnapshots();
  const target = snapshots.find(s => s.id === snapId);
  if (!target) {
    showToast('لم يتم العثور على نقطة الاستعادة المطلوبة.', 'error');
    return;
  }

  if (!confirm(`هل أنت متأكد من العودة إلى نقطة الاستعادة:\n"${target.reason}"\nالمسجلة في: ${target.timestamp}؟`)) {
    return;
  }

  // حفظ لقطة احتياطية للوضع الحالي قبل الاستعادة
  takeSnapshot('لقطة أمان قبل استرجاع نقطة قديمة');

  window.appData = JSON.parse(JSON.stringify(target.data));
  if (typeof window.saveData === 'function') window.saveData();
  if (typeof window.renderAll === 'function') window.renderAll();

  logAudit('استعادة نقطة', `تم الرجوع لنقطة: ${target.reason} (${target.timestamp})`);
  showToast(`✅ تم استرجاع النظام بنجاح إلى تاريخ: ${target.timestamp}`, 'success');
  closeAuditModal();
}

/**
 * تسجيل حدث في سجل التدقيق (Audit Log)
 */
function logAudit(action, details) {
  try {
    const logs = getAuditLogs();
    const entry = {
      id: 'log_' + Date.now(),
      time: new Date().toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'medium' }),
      action: String(action),
      details: String(details)
    };
    logs.unshift(entry);
    if (logs.length > MAX_AUDIT_LOGS) logs.pop();
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn('تعذر تسجيل التدقيق:', e);
  }
}

/**
 * جلب سجل التدقيق
 */
function getAuditLogs() {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * مسح سجل التدقيق
 */
function clearAuditLogs() {
  if (confirm('هل ترغب في مسح سجل التدقيق؟')) {
    localStorage.removeItem(AUDIT_LOG_KEY);
    renderAuditLogsUi();
    showToast('تم إفراغ سجل التدقيق.', 'info');
  }
}

/**
 * تحديث حالة زر التراجع (تفعيل أو تعطيل)
 */
function updateUndoButtonState() {
  const btn = document.getElementById('btnQuickUndo');
  if (!btn) return;
  const count = getSnapshots().length;
  btn.title = count > 0 ? `تراجع عن آخر إجراء (تتوفر ${count} نقاط استعادة)` : 'لا توجد نقاط للتراجع حالياً';
  btn.classList.toggle('opacity-50', count === 0);
  btn.classList.toggle('cursor-not-allowed', count === 0);
}

/**
 * فتح نافذة سجل التدقيق ونقاط الأمان
 */
function openAuditModal() {
  const modal = document.getElementById('auditModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  renderAuditLogsUi();
  renderSnapshotsUi();
}

/**
 * إغلاق نافذة سجل التدقيق
 */
function closeAuditModal() {
  const modal = document.getElementById('auditModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * رسم قائمة نقاط الاستعادة في النافذة
 */
function renderSnapshotsUi() {
  const container = document.getElementById('snapshotsListContainer');
  if (!container) return;
  const snapshots = getSnapshots();

  if (snapshots.length === 0) {
    container.innerHTML = '<div class="text-center py-6 text-slate-400 text-sm">لا توجد نقاط استعادة محفوظة حتى الآن.</div>';
    return;
  }

  container.innerHTML = snapshots.map(s => `
    <div class="flex items-center justify-between p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 transition">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <div>
          <h4 class="font-bold text-slate-800 text-sm">${escapeHtml(s.reason)}</h4>
          <span class="text-xs text-slate-500 font-mono">${s.timestamp}</span>
        </div>
      </div>
      <button onclick="restoreSnapshotById('${s.id}')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm">
        <i class="fa-solid fa-rotate-right"></i> استعادة هذه النقطة
      </button>
    </div>
  `).join('');
}

/**
 * رسم سجل التدقيق في النافذة
 */
function renderAuditLogsUi() {
  const container = document.getElementById('auditLogsContainer');
  if (!container) return;
  const logs = getAuditLogs();

  if (logs.length === 0) {
    container.innerHTML = '<div class="text-center py-6 text-slate-400 text-sm">السجل فارغ.</div>';
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-right text-xs">
        <thead class="bg-slate-100 text-slate-600 border-b">
          <tr>
            <th class="p-2">الوقت والتاريخ</th>
            <th class="p-2">نوع الحدث</th>
            <th class="p-2">التفاصيل</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${logs.map(l => `
            <tr class="hover:bg-slate-50">
              <td class="p-2 font-mono text-slate-500 whitespace-nowrap">${l.time}</td>
              <td class="p-2"><span class="px-2 py-0.5 rounded font-bold ${l.action.includes('تراجع') ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}">${escapeHtml(l.action)}</span></td>
              <td class="p-2 text-slate-700">${escapeHtml(l.details)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// تصدير الواجهات العامة على نطاق window
window.takeSnapshot = takeSnapshot;
window.getSnapshots = getSnapshots;
window.undoLastAction = undoLastAction;
window.restoreSnapshotById = restoreSnapshotById;
window.logAudit = logAudit;
window.getAuditLogs = getAuditLogs;
window.clearAuditLogs = clearAuditLogs;
window.openAuditModal = openAuditModal;
window.closeAuditModal = closeAuditModal;
window.updateUndoButtonState = updateUndoButtonState;


/* --- Start of controlLock.js --- */
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


/* --- Start of header.js --- */
// وحدة إعدادات الترويسة والمراحل والشعب (Header & Structure Configuration)
// الميزانية القصوى: 280 سطر

const SCHOOL_LEVELS = {
  primary: {
    title: 'ابتدائية',
    grades: [
      { val: '1', name: 'الأول الابتدائي' },
      { val: '2', name: 'الثاني الابتدائي' },
      { val: '3', name: 'الثالث الابتدائي' },
      { val: '4', name: 'الرابع الابتدائي' },
      { val: '5', name: 'الخامس الابتدائي' },
      { val: '6', name: 'السادس الابتدائي' }
    ]
  },
  middle: {
    title: 'متوسطة',
    grades: [
      { val: '1', name: 'الأول المتوسط' },
      { val: '2', name: 'الثاني المتوسط' },
      { val: '3', name: 'الثالث المتوسط' }
    ]
  },
  high: {
    title: 'إعدادية / ثانوية',
    grades: [
      { val: '4', name: 'الرابع الإعدادي' },
      { val: '5', name: 'الخامس الإعدادي' },
      { val: '6', name: 'السادس الإعدادي' }
    ]
  }
};

const ALL_AVAILABLE_SECTIONS = ['أ', 'ب', 'جـ', 'د', 'هـ', 'و'];

function getSectionsForGrade(gradeVal) {
  if (!appData.config.gradeSections) appData.config.gradeSections = {};
  if (!appData.config.gradeSections[gradeVal] || appData.config.gradeSections[gradeVal].length === 0) {
    appData.config.gradeSections[gradeVal] = ['أ', 'ب'];
  }
  return appData.config.gradeSections[gradeVal];
}

function updateGradeSectionCount(gradeVal, count) {
  if (!appData.config.gradeSections) appData.config.gradeSections = {};
  const num = Math.max(1, Math.min(6, parseInt(count) || 1));
  appData.config.gradeSections[gradeVal] = ALL_AVAILABLE_SECTIONS.slice(0, num);
  saveData();
  onSchoolLevelChange(false);
}

function renderGradeSectionsUI() {
  const container = document.getElementById('gradeSectionsSettingsGrid');
  if (!container) return;

  const lvl = appData.config.schoolLevel || 'primary';
  const gradesList = SCHOOL_LEVELS[lvl].grades;

  container.innerHTML = gradesList.map(g => {
    const activeSecs = getSectionsForGrade(g.val);
    const count = activeSecs.length;

    return `
      <div class="bg-indigo-50/50 border border-indigo-200 rounded-lg p-2.5 text-center">
        <label class="block text-xs font-bold text-indigo-950 mb-1 truncate">${escapeHtml(g.name)}</label>
        <select onchange="updateGradeSectionCount('${g.val}', this.value)" class="w-full border rounded p-1 text-xs font-bold bg-white text-center outline-none">
          <option value="1" ${count === 1 ? 'selected' : ''}>شعبة واحدة (أ)</option>
          <option value="2" ${count === 2 ? 'selected' : ''}>شعبتان (أ، ب)</option>
          <option value="3" ${count === 3 ? 'selected' : ''}>3 شعب (أ، ب، جـ)</option>
          <option value="4" ${count === 4 ? 'selected' : ''}>4 شعب (أ إلى د)</option>
          <option value="5" ${count === 5 ? 'selected' : ''}>5 شعب (أ إلى هـ)</option>
          <option value="6" ${count === 6 ? 'selected' : ''}>6 شعب (أ إلى و)</option>
        </select>
        <div class="mt-1 text-[11px] font-mono font-semibold text-slate-500">
          الشعب: ${escapeHtml(activeSecs.join(' ، '))}
        </div>
      </div>
    `;
  }).join('');
}

function renderDashboardSubjectCards() {
  const container = document.getElementById('dashboardSubjectCardsGrid');
  if (!container) return;
  container.innerHTML = '';
}

function onSchoolLevelChange(updateState = true) {
  if (updateState) {
    const lvlEl = document.getElementById('cfgSchoolLevel');
    const newLvl = lvlEl ? lvlEl.value : 'primary';
    const currentLvl = appData.config?.schoolLevel || 'primary';
    if (newLvl !== currentLvl) {
      if (typeof switchSchoolProfile === 'function') {
        switchSchoolProfile(newLvl);
        return;
      }
    }
    if (lvlEl) appData.config.schoolLevel = newLvl;
  }
  const lvl = appData.config.schoolLevel || 'primary';
  const gradesList = (SCHOOL_LEVELS[lvl] && SCHOOL_LEVELS[lvl].grades) ? SCHOOL_LEVELS[lvl].grades : SCHOOL_LEVELS.primary.grades;

  const fillSelect = (elId) => {
    const sel = document.getElementById(elId);
    if (!sel) return;
    const curr = sel.value;
    sel.innerHTML = gradesList.map(g => `<option value="${g.val}">${escapeHtml(g.name)}</option>`).join('');
    if (gradesList.some(g => String(g.val) === String(curr))) {
      sel.value = curr;
    } else if (gradesList.length > 0) {
      sel.value = gradesList[0].val;
    }
  };

  fillSelect('cfgActiveGrade');
  fillSelect('manualGrade');

  const filterGrade = document.getElementById('filterGrade');
  if (filterGrade) {
    filterGrade.innerHTML = `<option value="all">كل الصفوف</option>` + 
      gradesList.map(g => `<option value="${g.val}">${escapeHtml(g.name)}</option>`).join('');
  }

  const gradeFilterSelect = document.getElementById('gradeFilterSelect');
  if (gradeFilterSelect) {
    let opts = [];
    gradesList.forEach(g => {
      const activeSecs = getSectionsForGrade(g.val);
      activeSecs.forEach(sec => {
        opts.push(`<option value="${g.val}-${sec}">${escapeHtml(g.name)} - شعبة (${escapeHtml(sec)})</option>`);
      });
    });
    gradeFilterSelect.innerHTML = opts.join('') + `<option value="all">عرض جميع الطلبة</option>`;
  }

  updateManualSectionOptions();
  renderGradeSectionsUI();
  renderDashboardSubjectCards();

  if (updateState) {
    saveData();
    if (typeof renderAll === 'function') renderAll();
  }
}

function updateManualSectionOptions() {
  const gradeEl = document.getElementById('manualGrade');
  const secEl = document.getElementById('manualSection');
  if (!gradeEl || !secEl) return;
  const gradeVal = gradeEl.value || '1';
  const activeSecs = getSectionsForGrade(gradeVal);
  secEl.innerHTML = activeSecs.map(s => `<option value="${s}">${s}</option>`).join('');
}

document.getElementById('manualGrade')?.addEventListener('change', updateManualSectionOptions);

function updateSchoolGenderBadge() {
  const badge = document.getElementById('schoolGenderBadge');
  const notice = document.getElementById('excelGenderPolicyNotice');
  const policy = (typeof getSchoolGenderPolicy === 'function') ? getSchoolGenderPolicy() : 'mixed';

  let label = '';
  let badgeClass = '';
  let noticeText = '';

  if (policy === 'boys') {
    label = '👦 مدرسة بنين (كافة الطلبة ذكور 100%)';
    badgeClass = 'bg-blue-100 text-blue-900 border border-blue-300';
    noticeText = '🛡️ سياسة الكنترول: المدرسة للبنين — سيتم تثبيت كافة الطلبة كـ "ذكور" 100% وتجاوز أي لبس بالأسماء المشتركة أو أعمدة الإكسل.';
  } else if (policy === 'girls') {
    label = '👧 مدرسة بنات (كافة الطالبات إناث 100%)';
    badgeClass = 'bg-pink-100 text-pink-900 border border-pink-300';
    noticeText = '🛡️ سياسة الكنترول: المدرسة للبنات — سيتم تثبيت كافة الطالبات كـ "إناث" 100% وتجاوز أي لبس بالأسماء المشتركة أو أعمدة الإكسل.';
  } else {
    label = '👥 مدرسة مختلطة (كشف فردي)';
    badgeClass = 'bg-slate-100 text-slate-700 border border-slate-300';
    noticeText = 'ℹ️ المدرسة مختلطة: سيتم استيراد الجنس من ملف الإكسل أو الكشف التلقائي للاسم.';
  }

  if (badge) {
    badge.innerText = label;
    badge.className = `text-[11px] font-bold px-2 py-0.5 rounded-full transition shadow-sm ${badgeClass}`;
  }

  if (notice) {
    notice.innerText = noticeText;
    notice.className = `mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${badgeClass}`;
  }

  if (typeof detectGenderPreview === 'function') {
    const manualName = document.getElementById('manualStudentName');
    detectGenderPreview(manualName ? manualName.value : '');
  }
}

function syncConfigUI() {
  const c = appData.config;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
  };

  setVal('cfgSchoolName', c.schoolName || '');
  setVal('cfgSchoolLevel', c.schoolLevel || 'primary');
  setVal('cfgSchoolGender', c.schoolGender || 'auto');
  setVal('cfgSchoolYear', c.schoolYear || '2026 - 2027 م');
  setVal('cfgPrincipal', c.principal || '');
  setVal('cfgSecretary', c.secretary || '');
  setVal('cfgActiveGrade', c.activeGrade || '1');
  setVal('cfgActiveSection', c.activeSection || 'أ');

  const displaySchool = c.schoolName ? `إدارة مدرسة ${c.schoolName}` : 'إدارة مدرسة ...........................';
  const navSchoolName = document.getElementById('navSchoolName');
  if (navSchoolName) navSchoolName.innerText = displaySchool;

  document.querySelectorAll('.header-school-name').forEach(el => el.innerText = displaySchool);
  document.querySelectorAll('.header-school-year').forEach(el => el.innerText = 'للعام الدراسي ' + (c.schoolYear || '2026 - 2027 م'));
  document.querySelectorAll('.header-exam-type').forEach(el => el.innerText = c.examType || 'قائمة الدرجات');
  document.querySelectorAll('.header-principal-name').forEach(el => el.innerText = c.principal || '...........................');
  document.querySelectorAll('.header-secretary-name').forEach(el => el.innerText = c.secretary || '...........................');

  renderGradeSectionsUI();
  renderDashboardSubjectCards();
  updateSchoolGenderBadge();
}

['cfgSchoolName', 'cfgSchoolYear', 'cfgPrincipal', 'cfgSecretary', 'cfgActiveGrade', 'cfgActiveSection', 'cfgSchoolGender'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    const handler = (e) => {
      const key = id.replace('cfg', '');
      const normKey = key.charAt(0).toLowerCase() + key.slice(1);
      appData.config[normKey] = e.target.value;
      saveData();
      if (id === 'cfgSchoolName' || id === 'cfgSchoolGender') {
        updateSchoolGenderBadge();
        if (typeof syncStudentsWithSchoolGenderPolicy === 'function') {
          syncStudentsWithSchoolGenderPolicy(true);
        }
      }
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  }
});

window.SCHOOL_LEVELS = SCHOOL_LEVELS;
window.getSectionsForGrade = getSectionsForGrade;
window.updateGradeSectionCount = updateGradeSectionCount;
window.onSchoolLevelChange = onSchoolLevelChange;
window.syncConfigUI = syncConfigUI;
window.updateSchoolGenderBadge = updateSchoolGenderBadge;
window.renderDashboardSubjectCards = renderDashboardSubjectCards;



/* --- Start of students.js --- */
// وحدة إدارة الطلبة وكشف الجنس واستيراد الإكسل (Students & Excel Importer)
// الميزانية القصوى: 380 سطر

const FEMALE_NAMES = new Set([
  'فاطمة', 'زهراء', 'زينب', 'مريم', 'نور', 'سارة', 'ساره', 'هدى', 'تبارك', 'بنين', 'اية', 'آية', 'رقية',
  'حوراء', 'دعاء', 'اسراء', 'إسراء', 'شيماء', 'شهد', 'مروة', 'هاجر', 'سعاد', 'هديل', 'امنة', 'آمنة',
  'خديجة', 'رند', 'ريام', 'روان', 'رنين', 'ريتاج', 'سما', 'طيبة', 'ضحى', 'عائشة', 'فرح', 'كوثر',
  'لمى', 'ليلى', 'ملاك', 'منى', 'نادية', 'نوران', 'ولاء', 'ياسمين', 'يقين', 'رنا', 'أبرار', 'ابرار',
  'براء', 'جمانة', 'حنين', 'ختام', 'داليا', 'دينا', 'رشا', 'رسل', 'سالي', 'سمر', 'ديمة', 'شمس',
  'قمر', 'سحر', 'أمل', 'إيمان', 'بشرى', 'بلقيس', 'جنان', 'حنان', 'رحاب', 'عبير', 'غدير', 'تسنيم',
  'غفران', 'سوسن', 'إيناس', 'أفنان', 'أنهار', 'إكرام', 'سهام', 'أحلام', 'ريحانة', 'سجى', 'نبأ',
  'نغم', 'أصيل', 'هدية', 'وسن', 'وصال', 'وفاء', 'يمامة', 'أريج', 'أنفال', 'رؤى', 'جود', 'سدرة',
  'مسك', 'ميس', 'ميساء', 'ميعاد', 'ندى', 'نهى', 'سنا', 'رويدة', 'ريما', 'رنيم', 'لمياء', 'نجلاء',
  'شيماء', 'حسناء', 'شروق', 'صفاء', 'اسيل', 'أسيل', 'غزل', 'يارا', 'لجين', 'سيلين', 'ميرنا', 'سوزان'
]);

const MALE_NAMES_WITH_TA_OR_ALIF = new Set([
  'مصطفى', 'مرتضى', 'مجتبى', 'موسى', 'عيسى', 'يحيى', 'يحيي', 'زكريا', 'رضا', 'طه', 'ضياء', 'علاء', 'بهاء',
  'حمزة', 'حمزه', 'أسامة', 'اسامة', 'قتيبة', 'قتيبه', 'عكرمة', 'عكرمه', 'طلحة', 'طلحه', 'حذيفة', 'حذيفه',
  'عروة', 'عروه', 'عبيدة', 'عبيده', 'عنترة', 'عنتره', 'معاوية', 'معاويه', 'سلامة', 'سلامه', 'عرفة', 'عرفه',
  'ربيعة', 'ربيعه', 'أمية', 'اميه', 'قتادة', 'قتاده', 'قيس', 'وائل'
]);

function autoDetectGender(fullName) {
  const policy = (typeof getSchoolGenderPolicy === 'function') ? getSchoolGenderPolicy() : 'mixed';
  if (policy === 'boys') return 'ذكر';
  if (policy === 'girls') return 'أنثى';

  if (!fullName) return 'ذكر';
  const clean = fullName.trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'ذكر';

  const firstRaw = parts[0];
  const firstWithoutAl = firstRaw.replace(/^الـ|^ال/g, '');

  if (parts.length >= 2) {
    const twoWords = parts[0] + ' ' + parts[1];
    if (twoWords === 'نور الهدى' || twoWords === 'تقى الهدى') return 'أنثى';
    if (parts[1] === 'الدين') return 'ذكر';
    if (parts[0] === 'عبد' || parts[0] === 'سيف' || parts[0] === 'صلاح' || parts[0] === 'زين' || parts[0] === 'نجم') {
      if (parts[0] === 'عبد') return 'ذكر';
      if (twoWords === 'زين العابدين' || twoWords === 'زين الدين' || twoWords === 'سيف الدين' || twoWords === 'سيف الإسلام') return 'ذكر';
    }
  }

  if (MALE_NAMES_WITH_TA_OR_ALIF.has(firstRaw) || MALE_NAMES_WITH_TA_OR_ALIF.has(firstWithoutAl)) {
    return 'ذكر';
  }

  if (FEMALE_NAMES.has(firstRaw) || FEMALE_NAMES.has(firstWithoutAl)) {
    return 'أنثى';
  }

  if (firstRaw.endsWith('ة') || firstRaw.endsWith('ه') || firstRaw.endsWith('اء') || firstRaw.endsWith('ى')) {
    return 'أنثى';
  }

  return 'ذكر';
}

function detectGenderPreview(name) {
  const policy = (typeof getSchoolGenderPolicy === 'function') ? getSchoolGenderPolicy() : 'mixed';
  const g = policy === 'boys' ? 'ذكر' : (policy === 'girls' ? 'أنثى' : autoDetectGender(name));
  const sel = document.getElementById('manualGender');
  if (sel) {
    sel.value = g;
    sel.disabled = (policy !== 'mixed');
  }
  const hint = document.getElementById('genderAutoHint');
  if (hint) {
    if (policy === 'boys') {
      hint.innerText = '🛡️ مدرسة بنين: مثبت كـ (ذكر) تلقائياً.';
    } else if (policy === 'girls') {
      hint.innerText = '🛡️ مدرسة بنات: مثبت كـ (أنثى) تلقائياً.';
    } else {
      hint.innerText = `الجنس المكتشف تلقائياً: (${g})`;
    }
  }
}

function reSequenceRegNumbers() {
  const groups = {};
  appData.students.forEach(s => {
    const key = `${s.grade}-${s.section}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });

  for (let k in groups) {
    groups[k].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    groups[k].forEach((st, idx) => {
      st.reg = idx + 1;
    });
  }

  appData.students.sort((a, b) => {
    if (String(a.grade) !== String(b.grade)) return String(a.grade).localeCompare(String(b.grade));
    if (a.section !== b.section) return a.section.localeCompare(b.section, 'ar');
    return a.name.localeCompare(b.name, 'ar');
  });
}

function addStudentManual(e) {
  e.preventDefault();
  const nameInput = document.getElementById('manualStudentName');
  const gradeInput = document.getElementById('manualGrade');
  const sectionInput = document.getElementById('manualSection');
  const genderInput = document.getElementById('manualGender');

  if (!nameInput || !gradeInput || !sectionInput) return;

  if (window.isControlLocked && window.isControlLocked()) {
    showToast('⚠️ سجل الكنترول مشمع ومقفل! لا يمكن إضافة طلبة إلا بعد فك القفل.', 'warning');
    return;
  }

  const name = nameInput.value.trim();
  const grade = gradeInput.value;
  const section = sectionInput.value;
  const policy = (typeof getSchoolGenderPolicy === 'function') ? getSchoolGenderPolicy() : 'mixed';
  let gender = genderInput ? genderInput.value : autoDetectGender(name);
  if (policy === 'boys') gender = 'ذكر';
  if (policy === 'girls') gender = 'أنثى';

  if (!name) return;

  if (typeof window.takeSnapshot === 'function') {
    window.takeSnapshot('قبل إضافة طالب يدوياً: ' + name);
  }

  const countInSec = appData.students.filter(s => String(s.grade) === String(grade) && s.section === section).length;
  const newId = 'st_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

  appData.students.push({
    id: newId,
    reg: countInSec + 1,
    name: name,
    grade: grade,
    section: section,
    gender: gender
  });

  reSequenceRegNumbers();
  saveData();
  if (typeof renderAll === 'function') renderAll();
  nameInput.value = '';
}

function handleExcelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (window.isControlLocked && window.isControlLocked()) {
    showToast('⚠️ سجل الكنترول مشمع ومقفل! لا يمكن استيراد طلبة إلا بعد فك القفل.', 'warning');
    event.target.value = '';
    return;
  }

  if (typeof window.takeSnapshot === 'function') {
    window.takeSnapshot('قبل استيراد قائمة طلبة من ملف إكسل');
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!jsonRows || jsonRows.length === 0) {
        alert('ملف الإكسل فارغ.');
        return;
      }

      let nameCol = -1;
      let gradeCol = -1;
      let sectionCol = -1;
      let genderCol = -1;
      let headerRowIdx = -1;

      for (let r = 0; r < Math.min(10, jsonRows.length); r++) {
        const row = jsonRows[r];
        if (!Array.isArray(row)) continue;

        row.forEach((cell, cIdx) => {
          const str = String(cell || '').trim();
          if (str.includes('اسم الطالب') || str.includes('اسم التلميذ') || str === 'الاسم' || str === 'اسم الطالب/ة') {
            nameCol = cIdx;
            headerRowIdx = r;
          } else if (str.includes('الصف') || str === 'المرحلة') {
            gradeCol = cIdx;
          } else if (str.includes('الشعبة') || str === 'شعبة') {
            sectionCol = cIdx;
          } else if (str.includes('الجنس') || str === 'نوع الطالب') {
            genderCol = cIdx;
          }
        });

        if (nameCol !== -1) break;
      }

      let importedCount = 0;
      const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
      const defaultGrade = appData.config?.activeGrade || '1';
      const defaultSection = appData.config?.activeSection || 'أ';

      for (let r = startRow; r < jsonRows.length; r++) {
        const row = jsonRows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        let nameVal = '';
        let gradeVal = defaultGrade;
        let sectionVal = defaultSection;
        let genderVal = '';

        if (nameCol !== -1 && row[nameCol]) {
          nameVal = String(row[nameCol]).trim();
        } else {
          for (let cell of row) {
            if (typeof cell === 'string') {
              const trimmed = cell.trim();
              const words = trimmed.split(/\s+/);
              if (words.length >= 2 && !trimmed.includes('الابتدائي') && !trimmed.includes('المتوسط') && !trimmed.includes('الإعدادي') && isNaN(trimmed)) {
                nameVal = trimmed;
                break;
              }
            }
          }
        }

        if (!nameVal || nameVal.length < 3 || !isNaN(nameVal)) continue;

        if (gradeCol !== -1 && row[gradeCol] !== undefined) {
          const gStr = String(row[gradeCol]).trim();
          if (gStr.includes('أول') || gStr === '1') gradeVal = '1';
          else if (gStr.includes('ثاني') || gStr === '2') gradeVal = '2';
          else if (gStr.includes('ثالث') || gStr === '3') gradeVal = '3';
          else if (gStr.includes('رابع') || gStr === '4') gradeVal = '4';
          else if (gStr.includes('خامس') || gStr === '5') gradeVal = '5';
          else if (gStr.includes('سادس') || gStr === '6') gradeVal = '6';
        }

        if (sectionCol !== -1 && row[sectionCol] !== undefined) {
          const sStr = String(row[sectionCol]).trim();
          if (['أ', 'ب', 'جـ', 'ج', 'د', 'هـ', 'و'].includes(sStr)) {
            sectionVal = (sStr === 'ج' ? 'جـ' : sStr);
          }
        }

        const policy = (typeof getSchoolGenderPolicy === 'function') ? getSchoolGenderPolicy() : 'mixed';
        if (policy === 'boys') genderVal = 'ذكر';
        else if (policy === 'girls') genderVal = 'أنثى';
        else {
          if (genderCol !== -1 && row[genderCol] !== undefined) {
            const genStr = String(row[genderCol]).trim();
            if (genStr.includes('ذكر') || genStr === 'ولد') genderVal = 'ذكر';
            else if (genStr.includes('أنثى') || genStr.includes('انثى') || genStr === 'بنت') genderVal = 'أنثى';
          }
          if (!genderVal) genderVal = autoDetectGender(nameVal);
        }

        const newId = 'st_' + (Date.now() + importedCount) + '_' + Math.floor(Math.random() * 100);
        appData.students.push({
          id: newId,
          reg: appData.students.length + 1,
          name: nameVal,
          grade: gradeVal,
          section: sectionVal,
          gender: genderVal
        });

        importedCount++;
      }

      if (importedCount > 0) {
        if (typeof syncStudentsWithSchoolGenderPolicy === 'function') syncStudentsWithSchoolGenderPolicy(true);
        reSequenceRegNumbers();
        saveData();
        if (typeof renderAll === 'function') renderAll();
        const policy = (typeof getSchoolGenderPolicy === 'function') ? getSchoolGenderPolicy() : 'mixed';
        const policyNote = policy === 'boys' ? ' (تم تثبيت كافة الطلبة كـ ذكور لمطابقة مدرسة البنين)' : (policy === 'girls' ? ' (تم تثبيت كافة الطالبات كـ إناث لمطابقة مدرسة البنات)' : '');
        alert(`تم استيراد ${importedCount} طالب بنجاح${policyNote}!`);
      } else {
        alert('لم يتم العثور على بيانات صالحة في الملف.');
      }
    } catch (err) {
      alert('خطأ أثناء قراءة ملف الإكسل: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
  event.target.value = '';
}

function deleteStudent(id) {
  if (window.isControlLocked && window.isControlLocked()) {
    showToast('⚠️ سجل الكنترول مشمع ومقفل! لا يمكن حذف طلبة إلا بعد فك القفل.', 'warning');
    return;
  }
  if (confirm('هل أنت متأكد من رغبتك في حذف هذا الطالب وسجل درجاته؟')) {
    if (typeof window.takeSnapshot === 'function') {
      window.takeSnapshot('قبل حذف طالب وسجل درجاته');
    }
    appData.students = (appData.students || []).filter(s => s.id !== id);
    if (appData.grades) delete appData.grades[id];
    if (appData.subjectDetails) {
      for (let sub in appData.subjectDetails) {
        delete appData.subjectDetails[sub][id];
      }
    }
    reSequenceRegNumbers();
    saveData();
    if (typeof renderAll === 'function') renderAll();
  }
}

function compareStudents(a, b, sortMode) {
  if (sortMode === 'name-asc') return a.name.localeCompare(b.name, 'ar');
  if (sortMode === 'name-desc') return b.name.localeCompare(a.name, 'ar');
  if (sortMode === 'reg-asc') return (Number(a.reg) || 0) - (Number(b.reg) || 0);
  const diff = sortMode === 'grade-desc' ? Number(b.grade) - Number(a.grade) : Number(a.grade) - Number(b.grade);
  if (String(a.grade) !== String(b.grade)) return diff;
  if (a.section !== b.section) return sortMode === 'grade-desc' ? b.section.localeCompare(a.section, 'ar') : a.section.localeCompare(b.section, 'ar');
  return a.name.localeCompare(b.name, 'ar');
}

function renderStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  if (!tbody) return;

  const search = (document.getElementById('searchStudentInput')?.value || '').toLowerCase().trim();
  const filterGradeEl = document.getElementById('filterGrade');
  const filterGrade = filterGradeEl ? filterGradeEl.value : 'all';

  const lvl = appData.config.schoolLevel || 'primary';
  const activeGradesList = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[lvl]) ? SCHOOL_LEVELS[lvl].grades : [];
  const validGradeVals = activeGradesList.map(g => g.val.toString());
  const gradesObj = {};
  activeGradesList.forEach(g => gradesObj[g.val] = g.name);

  const isAllGrades = !filterGrade || filterGrade === 'all';

  let list = (appData.students || []).filter(s => {
    const isCurrentLevel = validGradeVals.length === 0 || validGradeVals.includes(s.grade.toString());
    const matchesSearch = !search || s.name.toLowerCase().includes(search) || String(s.reg).includes(search);
    const matchesGrade = isAllGrades || (s.grade.toString() === filterGrade.toString());
    return isCurrentLevel && matchesSearch && matchesGrade;
  });

  const sortMode = document.getElementById('sortStudentsSelect')?.value || 'name-asc';
  list.sort((a, b) => compareStudents(a, b, sortMode));

  const countBadge = document.getElementById('studentsCountBadge');
  if (countBadge) countBadge.innerText = list.length + ' طالب';

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center p-8 text-slate-400 italic">لا يوجد طلبة مطابقين للبحث أو مسجلين حالياً.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((st, idx) => {
    const gradeName = gradesObj[st.grade] || ('الصف ' + st.grade);
    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-200 text-center">
        <td class="p-2.5 font-bold font-mono text-slate-600 bg-slate-50">${idx + 1}</td>
        <td class="p-2.5 font-bold font-mono text-indigo-900 bg-indigo-50/50">${escapeHtml(st.reg)}</td>
        <td class="p-2.5 font-bold text-slate-900 text-right pr-4">${escapeHtml(st.name)}</td>
        <td class="p-2.5 font-bold text-slate-700">${escapeHtml(gradeName)}</td>
        <td class="p-2.5 font-bold text-indigo-700">${escapeHtml(st.section)}</td>
        <td class="p-2.5">
          <span class="px-2.5 py-0.5 rounded text-xs ${st.gender === 'ذكر' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'} font-semibold">${escapeHtml(st.gender)}</span>
        </td>
        <td class="p-2.5 no-print">
          <button onclick="deleteStudent('${escapeHtml(st.id)}')" class="text-rose-600 hover:text-rose-800 p-1.5 transition" title="حذف الطالب">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function applySortToStudentSequence() {
  if (window.isControlLocked && window.isControlLocked()) {
    showToast('⚠️ سجل الكنترول مشمع ومقفل! لا يمكن تعديل التسلسل إلا بعد فك القفل.', 'warning');
    return;
  }
  const sortMode = document.getElementById('sortStudentsSelect')?.value || 'name-asc';
  appData.students.sort((a, b) => compareStudents(a, b, sortMode));
  appData.students.forEach((st, idx) => { st.reg = idx + 1; });
  saveData();
  renderStudentsTable();
  alert('✅ تم تثبيت تسلسل الطلبة وإعادة ترقيم قيودهم رسمياً وفق الفرز المختار!');
}

function toggleSortColumn(col) {
  const sel = document.getElementById('sortStudentsSelect');
  if (!sel) return;
  if (col === 'name') sel.value = (sel.value === 'name-asc' ? 'name-desc' : 'name-asc');
  else if (col === 'grade') sel.value = (sel.value === 'grade-asc' ? 'grade-desc' : 'grade-asc');
  else if (col === 'reg') sel.value = (sel.value === 'reg-asc' ? 'name-asc' : 'reg-asc');
  renderStudentsTable();
}

function exportToCSV() {
  if (!appData.students || appData.students.length === 0) {
    alert('لا توجد بيانات طلاب لتصديرها.');
    return;
  }
  let csv = "\uFEFFالتسلسل,رقم القيد,اسم الطالب,الصف,الشعبة,الجنس\n";
  appData.students.forEach((st, idx) => {
    const cleanName = String(st.name || '').replace(/"/g, '""');
    csv += `"${idx + 1}","${st.reg}","${cleanName}","${st.grade}","${st.section}","${st.gender}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const dateStr = appData.config.examDate || new Date().toISOString().split('T')[0];
  link.setAttribute("download", `سجل_الطلبة_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.autoDetectGender = autoDetectGender;
window.detectGenderPreview = detectGenderPreview;
window.reSequenceRegNumbers = reSequenceRegNumbers;
window.addStudentManual = addStudentManual;
window.handleExcelUpload = handleExcelUpload;
window.deleteStudent = deleteStudent;
window.renderStudentsTable = renderStudentsTable;
window.applySortToStudentSequence = applySortToStudentSequence;
window.toggleSortColumn = toggleSortColumn;
window.exportToCSV = exportToCSV;


/* --- Start of grades.js --- */
// وحدة كشوفات المواد والقائمة الجامعة للدرجات (Grades & Master Sheet)
// الميزانية القصوى: 420 سطر

let currentActiveSubject = 'islamic';

// يتم استدعاء تعريفات المواد والمسميات من modules/subjectsConfig.js

function computeStudentSubjectFinal(studentId, subjectId) {
  const normSub = normalizeSubjectId(subjectId);
  const d = appData.subjectDetails?.[normSub]?.[studentId] || {};
  const st = (appData.students || []).find(s => s.id === studentId);
  const lvl = appData.config?.schoolLevel || 'primary';
  const gVal = st?.grade || document.getElementById('modalGradeFilterSelect')?.value?.split('-')[0] || '';
  const isLower = lvl === 'primary' && ['1', '2', '3', '4'].includes(String(gVal));

  let t1 = null, t2 = null, annual = null, finalGrade = null;
  const mid = (d.mid !== undefined && d.mid !== '' && d.mid !== null) ? Number(d.mid) : null;
  const fin = (d.final !== undefined && d.final !== '' && d.final !== null) ? Number(d.final) : null;

  if (isLower) {
    finalGrade = (mid !== null && fin !== null) ? Math.round((mid + fin) / 2) : (fin ?? mid);
  } else {
    const calcAvg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
    const fVals = keys => keys.map(k => d[k]).filter(v => v !== undefined && v !== '' && v !== null).map(Number);
    t1 = calcAvg(fVals(['daily1', 'm1', 'm2']));
    t2 = calcAvg(fVals(['daily2', 'm3', 'm4']));
    const terms = [t1, mid, t2].filter(v => v !== null);
    annual = calcAvg(terms);
    finalGrade = (annual !== null && fin !== null) ? Math.round((annual + fin) / 2) : (fin ?? annual);
  }

  if (!appData.grades) appData.grades = {};
  if (!appData.grades[studentId]) appData.grades[studentId] = {};
  if (finalGrade !== null) {
    appData.grades[studentId][normSub] = finalGrade;
  } else if (appData.grades[studentId][normSub] !== undefined && appData.grades[studentId][normSub] !== '') {
    finalGrade = Number(appData.grades[studentId][normSub]);
  }

  return { t1, t2, annual, finalGrade };
}

function openSubjectSheet(subjectId) {
  openSubjectSheetModal(subjectId);
}

function openSubjectSheetModal(subjectId) {
  const lvl = appData.config?.schoolLevel || 'primary';
  const subjects = (window.SUBJECTS_BY_LEVEL && window.SUBJECTS_BY_LEVEL[lvl]) || [];

  if (subjectId) {
    currentActiveSubject = normalizeSubjectId(subjectId);
  } else if (!currentActiveSubject || !subjects.some(s => s.id === currentActiveSubject)) {
    currentActiveSubject = subjects[0]?.id || 'islamic';
  }

  const modal = document.getElementById('subjectDetailModal');
  const title = document.getElementById('modalSubjectTitle');
  if (!modal) return;

  const subName = (window.SUBJECTS_INFO && window.SUBJECTS_INFO[currentActiveSubject]) || currentActiveSubject;
  if (title) title.innerText = 'سجل درجات مادة: ' + subName;

  populateModalSubjectPicker();
  populateModalGradeFilter();
  modal.classList.remove('hidden');
  renderSubjectDetailTable();
}

function populateModalSubjectPicker() {
  const sel = document.getElementById('modalSubjectPicker');
  if (!sel) return;
  const lvl = appData.config?.schoolLevel || 'primary';
  const filterVal = document.getElementById('modalGradeFilterSelect')?.value || '';
  const gVal = filterVal ? filterVal.split('-')[0] : '1';
  const subs = (typeof getSubjectsForGrade === 'function') ? getSubjectsForGrade(lvl, gVal) : ((window.SUBJECTS_BY_LEVEL && window.SUBJECTS_BY_LEVEL[lvl]) || []);

  if (!subs.some(s => s.id === currentActiveSubject)) {
    currentActiveSubject = subs[0]?.id || 'islamic';
  }

  sel.innerHTML = subs.map(s => {
    const fn = (window.SUBJECTS_INFO && window.SUBJECTS_INFO[s.id]) || s.name;
    return `<option value="${s.id}" ${s.id === currentActiveSubject ? 'selected' : ''}>📖 مادة: ${escapeHtml(fn)}</option>`;
  }).join('');
}

function onModalGradeFilterChange() {
  populateModalSubjectPicker();
  renderSubjectDetailTable();
}

function changeActiveSubjectFromPicker(subjectId) {
  if (!subjectId) return;
  currentActiveSubject = normalizeSubjectId(subjectId);
  const title = document.getElementById('modalSubjectTitle');
  const subName = (window.SUBJECTS_INFO && window.SUBJECTS_INFO[currentActiveSubject]) || currentActiveSubject;
  if (title) title.innerText = 'سجل درجات مادة: ' + subName;
  renderSubjectDetailTable();
}

function closeSubjectModal() {
  const modal = document.getElementById('subjectDetailModal');
  if (modal) modal.classList.add('hidden');
  renderGradesSheet();
}

function populateModalGradeFilter() {
  const sel = document.getElementById('modalGradeFilterSelect');
  if (!sel) return;

  const lvl = appData.config?.schoolLevel || 'primary';
  const defaultGrades = [
    { val: '1', name: 'الأول الابتدائي' }, { val: '2', name: 'الثاني الابتدائي' }, { val: '3', name: 'الثالث الابتدائي' },
    { val: '4', name: 'الرابع الابتدائي' }, { val: '5', name: 'الخامس الابتدائي' }, { val: '6', name: 'السادس الابتدائي' }
  ];
  const gradesList = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[lvl]) ? SCHOOL_LEVELS[lvl].grades : defaultGrades;
  let opts = '';
  gradesList.forEach(g => {
    const activeSecs = (typeof getSectionsForGrade === 'function') ? getSectionsForGrade(g.val) : ['أ', 'ب'];
    activeSecs.forEach(sec => {
      opts += `<option value="${g.val}-${sec}">${escapeHtml(g.name)} - شعبة (${escapeHtml(sec)})</option>`;
    });
  });

  const prev = sel.value;
  sel.innerHTML = opts;
  if (prev && Array.from(sel.options).some(o => o.value === prev)) sel.value = prev;
}

function renderSubjectDetailTable() {
  const container = document.getElementById('subjectDetailTableContainer');
  const filterVal = document.getElementById('modalGradeFilterSelect')?.value;
  if (!container || !filterVal || !currentActiveSubject) return;

  const [gradeVal, secVal] = filterVal.split('-');
  const lvl = appData.config?.schoolLevel || 'primary';
  const isLower = lvl === 'primary' && ['1', '2', '3', '4'].includes(String(gradeVal));
  const studs = (appData.students || []).filter(s => String(s.grade) === String(gradeVal) && s.section === secVal);
  studs.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  if (!appData.subjectDetails) appData.subjectDetails = {};
  if (!appData.subjectDetails[currentActiveSubject]) appData.subjectDetails[currentActiveSubject] = {};

  if (studs.length === 0) {
    container.innerHTML = '<div class="text-center p-8 text-slate-400 font-bold bg-white rounded-lg">لا يوجد طلبة مسجلين في هذا الصف والشعبة.</div>';
    return;
  }

  const rows = studs.map((st, idx) => {
    const d = appData.subjectDetails[currentActiveSubject][st.id] || {};
    const { t1, t2, annual, finalGrade } = computeStudentSubjectFinal(st.id, currentActiveSubject);
    const dispFinal = finalGrade !== null ? finalGrade : '-';
    const fCls = (finalGrade !== null && finalGrade < 50) ? 'bg-rose-100 text-rose-700 font-black' : (finalGrade !== null ? 'bg-emerald-100 text-emerald-800 font-black' : 'text-slate-400');

    if (isLower) {
      return `<tr class="hover:bg-slate-50 border-b border-slate-200">
        <td class="p-2 border border-slate-300 font-bold bg-slate-50 font-mono text-center">${idx + 1}</td>
        <td class="p-2 border border-slate-300 font-bold text-right pr-3 text-slate-900">${escapeHtml(st.name)}</td>
        <td class="p-2 border border-slate-300 bg-indigo-50/40 text-center"><input type="number" min="0" max="100" value="${d.mid ?? ''}" onchange="updateSubDetail('${escapeHtml(st.id)}','mid',this.value)" class="w-20 text-center font-bold border border-indigo-300 rounded p-1"></td>
        <td class="p-2 border border-slate-300 bg-amber-50/40 text-center"><input type="number" min="0" max="100" value="${d.final ?? ''}" onchange="updateSubDetail('${escapeHtml(st.id)}','final',this.value)" class="w-20 text-center font-bold border border-amber-300 rounded p-1"></td>
        <td class="p-2 border border-slate-300 text-center font-black text-sm ${fCls}">${dispFinal}</td>
      </tr>`;
    }

    return `<tr class="hover:bg-slate-50 border-b border-slate-200">
      <td class="p-1 border border-slate-300 font-bold bg-slate-50 font-mono text-center">${idx + 1}</td>
      <td class="p-1 border border-slate-300 font-bold text-right pr-2 text-slate-900">${escapeHtml(st.name)}</td>
      <td class="p-1 border border-slate-300 text-center"><input type="number" min="0" max="100" value="${d.daily1 ?? ''}" onchange="updateSubDetail('${escapeHtml(st.id)}','daily1',this.value)" class="w-10 text-center border rounded p-0.5"></td>
      <td class="p-1 border border-slate-300 text-center"><input type="number" min="0" max="100" value="${d.m1 ?? ''}" onchange="updateSubDetail('${escapeHtml(st.id)}','m1',this.value)" class="w-10 text-center border rounded p-0.5"></td>
      <td class="p-1 border border-slate-300 text-center"><input type="number" min="0" max="100" value="${d.m2 ?? ''}" onchange="updateSubDetail('${escapeHtml(st.id)}','m2',this.value)" class="w-10 text-center border rounded p-0.5"></td>
      <td class="p-1 border border-slate-300 font-bold bg-slate-100 text-indigo-900 text-center">${t1 ?? '-'}</td>
      <td class="p-1 border border-slate-300 bg-indigo-50/50 text-center"><input type="number" min="0" max="100" value="${d.mid ?? ''}" onchange="updateSubDetail('${escapeHtml(st.id)}','mid',this.value)" class="w-11 font-bold text-center border border-indigo-300 rounded p-0.5"></td>
      <td class="p-1 border border-slate-300 text-center"><input type="number" min="0" max="100" value="${d.daily2 ?? ''}" onchange="updateSubDetail('${escapeHtml(st.id)}','daily2',this.value)" class="w-10 text-center border rounded p-0.5"></td>
      <td class="p-1 border border-slate-300 text-center"><input type="number" min="0" max="100" value="${d.m3 ?? ''}" onchange="updateSubDetail('${escapeHtml(st.id)}','m3',this.value)" class="w-10 text-center border rounded p-0.5"></td>
      <td class="p-1 border border-slate-300 text-center"><input type="number" min="0" max="100" value="${d.m4 ?? ''}" onchange="updateSubDetail('${escapeHtml(st.id)}','m4',this.value)" class="w-10 text-center border rounded p-0.5"></td>
      <td class="p-1 border border-slate-300 font-bold bg-slate-100 text-indigo-900 text-center">${t2 ?? '-'}</td>
      <td class="p-1 border border-slate-300 font-black bg-indigo-50 text-indigo-950 text-center">${annual ?? '-'}</td>
      <td class="p-1 border border-slate-300 bg-amber-50/50 text-center"><input type="number" min="0" max="100" value="${d.final ?? ''}" onchange="updateSubDetail('${escapeHtml(st.id)}','final',this.value)" class="w-11 font-bold text-center border border-amber-300 rounded p-0.5"></td>
      <td class="p-1 border border-slate-300 text-center text-sm ${fCls}">${dispFinal}</td>
    </tr>`;
  }).join('');

  if (isLower) {
    container.innerHTML = `
      <div class="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 font-semibold flex items-center gap-2">
        <i class="fa-solid fa-circle-info text-blue-600"></i> نظام الصفوف (1 - 4): لا توجد امتحانات شهرية، الرصد حصراً لامتحاني نصف السنة وآخر السنة.
      </div>
      <table class="w-full text-center border-collapse border border-slate-300 text-xs bg-white shadow-sm rounded-lg overflow-hidden">
        <thead><tr class="bg-slate-800 text-white font-bold text-sm">
          <th class="p-2.5 border border-slate-600 w-12 text-center">ت</th>
          <th class="p-2.5 border border-slate-600 text-right pr-4">اسم الطالب</th>
          <th class="p-2.5 border border-slate-600 bg-indigo-900 w-40">درجة نصف السنة</th>
          <th class="p-2.5 border border-slate-600 bg-amber-800 w-40">درجة آخر السنة (النهائي)</th>
          <th class="p-2.5 border border-slate-600 bg-emerald-900 w-36">المعدل النهائي</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  } else {
    container.innerHTML = `
      <table class="w-full text-center border-collapse border border-slate-300 text-xs bg-white">
        <thead>
          <tr class="bg-slate-800 text-white">
            <th rowspan="2" class="p-2 border border-slate-600 w-10">ت</th>
            <th rowspan="2" class="p-2 border border-slate-600 w-44 text-right pr-3">اسم الطالب</th>
            <th colspan="4" class="p-1 border border-slate-600 bg-slate-700">الفصل الأول</th>
            <th rowspan="2" class="p-1 border border-slate-600 bg-indigo-900 w-14">نصف السنة</th>
            <th colspan="4" class="p-1 border border-slate-600 bg-slate-700">الفصل الثاني</th>
            <th rowspan="2" class="p-1 border border-slate-600 bg-indigo-950 w-14">السعي السنوي</th>
            <th rowspan="2" class="p-1 border border-slate-600 bg-amber-800 w-14">الامتحان النهائي</th>
            <th rowspan="2" class="p-1 border border-slate-600 bg-emerald-900 w-16">الدرجة النهائية</th>
          </tr>
          <tr class="bg-slate-700 text-slate-200 text-[11px]">
            <th class="p-1 border border-slate-600 w-10">يومي</th><th class="p-1 border border-slate-600 w-10">شهر 1</th><th class="p-1 border border-slate-600 w-10">شهر 2</th><th class="p-1 border border-slate-600 w-10 bg-slate-600">معدل</th>
            <th class="p-1 border border-slate-600 w-10">يومي</th><th class="p-1 border border-slate-600 w-10">شهر 1</th><th class="p-1 border border-slate-600 w-10">شهر 2</th><th class="p-1 border border-slate-600 w-10 bg-slate-600">معدل</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }
}

function updateSubDetail(studentId, field, val) {
  if (window.isControlLocked && window.isControlLocked()) {
    showToast('⚠️ سجل الكنترول مشمع ومقفل! لا يمكن تعديل الدرجات إلا بعد فك القفل.', 'warning');
    renderSubjectDetailTable();
    return;
  }
  const normSub = normalizeSubjectId(currentActiveSubject);
  if (!appData.subjectDetails) appData.subjectDetails = {};
  if (!appData.subjectDetails[normSub]) appData.subjectDetails[normSub] = {};
  if (!appData.subjectDetails[normSub][studentId]) appData.subjectDetails[normSub][studentId] = {};

  if (val === '' || val === null || val === undefined) {
    delete appData.subjectDetails[normSub][studentId][field];
  } else {
    appData.subjectDetails[normSub][studentId][field] = Math.min(100, Math.max(0, Number(val)));
  }

  computeStudentSubjectFinal(studentId, normSub);
  saveData();
  renderSubjectDetailTable();
}

function populateGradesFilters() {
  const select = document.getElementById('gradeFilterSelect');
  if (!select) return;

  const lvl = appData.config?.schoolLevel || 'primary';
  const defaultGrades = [
    { val: '1', name: 'الأول الابتدائي' },
    { val: '2', name: 'الثاني الابتدائي' },
    { val: '3', name: 'الثالث الابتدائي' },
    { val: '4', name: 'الرابع الابتدائي' },
    { val: '5', name: 'الخامس الابتدائي' },
    { val: '6', name: 'السادس الابتدائي' }
  ];
  const gradesList = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[lvl]) ? SCHOOL_LEVELS[lvl].grades : defaultGrades;

  let opts = '';
  gradesList.forEach(g => {
    const activeSecs = (typeof getSectionsForGrade === 'function') ? getSectionsForGrade(g.val) : ['أ', 'ب'];
    activeSecs.forEach(sec => {
      opts += `<option value="${g.val}-${sec}">${escapeHtml(g.name)} - شعبة (${escapeHtml(sec)})</option>`;
    });
  });

  const prev = select.value;
  select.innerHTML = opts;
  if (prev && Array.from(select.options).some(o => o.value === prev)) {
    select.value = prev;
  }
}

function renderGradesSheet() {
  const thead = document.getElementById('gradesTableHead');
  const tbody = document.getElementById('gradesTableBody');
  const select = document.getElementById('gradeFilterSelect');
  const printGradeEl = document.getElementById('printGradeTitle');
  const printSecEl = document.getElementById('printSectionTitle');
  const printDateEl = document.getElementById('printDateTitle');

  const graceBtn = document.getElementById('btnToggleGrace');
  const useGrace = !!appData.config?.enableGraceMarks;
  if (graceBtn) {
    if (useGrace) {
      graceBtn.className = 'px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow ring-2 ring-purple-300';
      graceBtn.innerHTML = '<i class="fa-solid fa-scale-balanced"></i> درجات القرار (5 درجات): <span class="bg-purple-900 px-1.5 py-0.5 rounded text-[10px]">مُفعلة</span>';
    } else {
      graceBtn.className = 'px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 shadow-sm';
      graceBtn.innerHTML = '<i class="fa-solid fa-scale-balanced text-slate-500"></i> درجات القرار (5 درجات): <span class="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">مُعطلة</span>';
    }
  }

  if (!select) return;
  if (select.options.length === 0) populateGradesFilters();

  const val = select.value;
  if (!val) return;

  const [gradeVal, secVal] = val.split('-');
  const lvl = appData.config?.schoolLevel || 'primary';
  const subjects = (typeof getSubjectsForGrade === 'function') ? getSubjectsForGrade(lvl, gradeVal) : (SUBJECTS_BY_LEVEL[lvl] || []);

  const activeGradesList = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[lvl]) ? SCHOOL_LEVELS[lvl].grades : [];
  const gObj = activeGradesList.find(g => String(g.val) === String(gradeVal));
  if (printGradeEl) printGradeEl.innerText = gObj ? gObj.name : ('الصف ' + gradeVal);
  if (printSecEl) printSecEl.innerText = secVal;
  if (printDateEl) printDateEl.innerText = appData.config?.examDate || new Date().toISOString().split('T')[0];

  const studs = (appData.students || []).filter(s => String(s.grade) === String(gradeVal) && s.section === secVal);
  studs.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  if (!appData.grades) appData.grades = {};

  if (thead) {
    const subjectsHead = subjects.map(s => `
      <th class="border border-slate-600 p-2 w-16 cursor-pointer hover:bg-slate-700 transition" onclick="openSubjectSheet('${s.id}')" title="انقر لفتح سجل تقييم ${escapeHtml(s.name)}">
        ${escapeHtml(s.name)} <i class="fa-solid fa-pen text-[9px] text-indigo-300 ml-1"></i>
      </th>
    `).join('');

    thead.innerHTML = `
      <tr class="bg-slate-800 text-white font-bold">
        <th class="p-2 border border-slate-600 w-12 text-center">التسلسل</th>
        <th class="p-2 border border-slate-600 text-right pr-4">اسم الطالب</th>
        ${subjectsHead}
        <th class="border border-slate-600 p-2 w-16 bg-slate-900">المجموع</th>
        <th class="border border-slate-600 p-2 w-16 bg-slate-900">المعدل</th>
        <th class="border border-slate-600 p-2 w-28 bg-slate-900">النتيجة</th>
      </tr>
    `;
  }

  if (tbody) {
    if (studs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${subjects.length + 5}" class="p-8 text-center text-slate-400 font-bold bg-white">لا يوجد طلبة مسجلين في هذا الصف والشعبة.</td></tr>`;
      return;
    }

    tbody.innerHTML = studs.map((st, idx) => {
      const stGrades = appData.grades[st.id] || {};
      const finalEval = (useGrace && typeof calculateGraceMarks === 'function') 
        ? calculateGraceMarks(stGrades, subjects)
        : { modifiedGrades: { ...stGrades }, graceMarksApplied: {}, newStatus: '', graceMarksUsed: 0 };

      let total = 0, countEntered = 0, fails = 0;
      subjects.forEach(sub => {
        const mark = stGrades[sub.id];
        if (mark !== undefined && mark !== null && mark !== '') {
          const num = Number(mark);
          total += num; countEntered++;
          if (num < 50) fails++;
        }
      });

      const avg = countEntered === subjects.length && subjects.length > 0 
        ? (total / subjects.length).toFixed(1) 
        : (countEntered > 0 ? (total / countEntered).toFixed(1) + ' *' : '-');

      let resultText = '-', resultClass = 'text-slate-400';
      if (useGrace && finalEval.newStatus && finalEval.newStatus !== 'غير مكتمل') {
        resultText = finalEval.newStatus;
        if (resultText.includes('ناجح بالقرار')) resultClass = 'bg-purple-100 text-purple-900 border border-purple-300 font-black';
        else if (resultText.includes('مكمل بالقرار')) resultClass = 'bg-amber-100 text-amber-900 border border-purple-300 font-black';
        else if (resultText === 'ناجح') resultClass = 'bg-emerald-100 text-emerald-800 font-bold';
        else if (resultText.includes('مكمل')) resultClass = 'bg-amber-100 text-amber-800 font-bold';
        else resultClass = 'bg-rose-100 text-rose-800 font-bold';
      } else if (countEntered === subjects.length && subjects.length > 0) {
        if (fails === 0) { resultText = 'ناجح'; resultClass = 'bg-emerald-100 text-emerald-800 font-bold'; }
        else if (fails <= 2) { resultText = 'مكمل (' + fails + ')'; resultClass = 'bg-amber-100 text-amber-800 font-bold'; }
        else { resultText = 'راسب (' + fails + ')'; resultClass = 'bg-rose-100 text-rose-800 font-bold'; }
      } else if (countEntered > 0) {
        resultText = `رُصد (${countEntered}/${subjects.length})`;
        resultClass = 'bg-slate-100 text-slate-600 font-semibold text-[10px]';
      }

      const inputsHtml = subjects.map(sub => {
        const mark = (stGrades[sub.id] !== undefined && stGrades[sub.id] !== null) ? stGrades[sub.id] : '';
        const isFail = mark !== '' && Number(mark) < 50;
        const graceGiven = finalEval.graceMarksApplied[sub.id] || 0;
        const inputClass = graceGiven > 0 ? 'text-purple-800 bg-purple-50 border-purple-400 font-black ring-1 ring-purple-300' : (isFail ? 'text-rose-600 bg-rose-50 border-rose-400 font-black' : 'text-slate-800 border-slate-300');

        return `<td class="p-1 border border-slate-300 relative">
          <input type="number" min="0" max="100" value="${mark}" onchange="updateGrade('${escapeHtml(st.id)}', '${escapeHtml(sub.id)}', this.value)" class="w-12 text-center p-1 font-bold border rounded outline-none ${inputClass}" title="${graceGiven > 0 ? 'ممنوح +' + graceGiven + ' درجات قرار' : ''}">
          ${graceGiven > 0 ? `<span class="absolute top-0.5 left-0.5 bg-purple-600 text-white rounded-full w-3.5 h-3.5 text-[8px] flex items-center justify-center font-bold no-print" title="+${graceGiven}">*</span>` : ''}
        </td>`;
      }).join('');

      return `<tr class="hover:bg-slate-50 border-b border-slate-300 text-center font-medium bg-white">
        <td class="p-1.5 border border-slate-300 font-mono font-bold text-slate-700 bg-slate-50">${idx + 1}</td>
        <td class="p-1.5 border border-slate-300 font-bold text-slate-900 text-right pr-4">${escapeHtml(st.name)}</td>
        ${inputsHtml}
        <td class="p-1.5 border border-slate-300 font-mono font-black text-indigo-900 bg-indigo-50/40">${countEntered > 0 ? total : '-'}</td>
        <td class="p-1.5 border border-slate-300 font-mono font-black text-slate-800 bg-slate-50">${avg}</td>
        <td class="p-1.5 border border-slate-300"><span class="px-2 py-0.5 rounded text-[11px] ${resultClass}">${resultText}</span></td>
      </tr>`;
    }).join('');
  }
}

function updateGrade(studentId, subjectId, val) {
  if (window.isControlLocked && window.isControlLocked()) {
    showToast('⚠️ سجل الكنترول مشمع ومقفل! لا يمكن تعديل الدرجات إلا بعد فك القفل.', 'warning');
    renderGradesSheet();
    return;
  }
  const normSub = normalizeSubjectId(subjectId);
  if (!appData.grades) appData.grades = {};
  if (!appData.grades[studentId]) appData.grades[studentId] = {};

  if (val === '' || val === null || val === undefined) {
    delete appData.grades[studentId][normSub];
  } else {
    appData.grades[studentId][normSub] = Math.min(100, Math.max(0, Number(val)));
  }

  saveData();
  renderGradesSheet();
}

function openGrandSheet() {
  const gradesTab = document.getElementById('grades-tab');
  if (gradesTab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    gradesTab.classList.remove('hidden');
  }
  populateGradesFilters();
  renderGradesSheet();
}

window.SUBJECTS_INFO = SUBJECTS_INFO;
window.SUBJECTS_BY_LEVEL = SUBJECTS_BY_LEVEL;
window.normalizeSubjectId = normalizeSubjectId;
window.computeStudentSubjectFinal = computeStudentSubjectFinal;
window.renderGradesSheet = renderGradesSheet;
window.populateGradesFilters = populateGradesFilters;
window.openGrandSheet = openGrandSheet;
window.openSubjectSheet = openSubjectSheet;
window.openSubjectSheetModal = openSubjectSheetModal;
window.populateModalSubjectPicker = populateModalSubjectPicker;
window.changeActiveSubjectFromPicker = changeActiveSubjectFromPicker;
window.onModalGradeFilterChange = onModalGradeFilterChange;
window.closeSubjectModal = closeSubjectModal;
window.renderSubjectDetailTable = renderSubjectDetailTable;
window.updateSubDetail = updateSubDetail;
window.updateGrade = updateGrade;


/* --- Start of graceMarks.js --- */
// وحدة محرك درجات القرار الوزاري (Ministry Grace Marks Engine)
// الميزانية القصوى: 120 سطر

function calculateGraceMarks(studentGrades, subjects) {
  const result = {
    originalGrades: { ...studentGrades },
    modifiedGrades: { ...studentGrades },
    graceMarksUsed: 0,
    graceMarksApplied: {},
    originalStatus: '',
    newStatus: '',
    originalFails: 0,
    newFails: 0
  };

  let total = 0;
  let countEntered = 0;
  let failList = [];

  subjects.forEach(sub => {
    const mark = studentGrades[sub.id];
    if (mark !== undefined && mark !== null && mark !== '') {
      const num = Number(mark);
      total += num;
      countEntered++;
      if (num < 50) {
        failList.push({ id: sub.id, name: sub.name, mark: num, needed: 50 - num });
      }
    }
  });

  result.originalFails = failList.length;

  if (countEntered !== subjects.length || subjects.length === 0) {
    result.originalStatus = 'غير مكتمل';
    result.newStatus = 'غير مكتمل';
    return result;
  }

  if (result.originalFails === 0) {
    result.originalStatus = 'ناجح';
    result.newStatus = 'ناجح';
    return result;
  } else if (result.originalFails <= 2) {
    result.originalStatus = `مكمل (${result.originalFails})`;
  } else {
    result.originalStatus = `راسب (${result.originalFails})`;
  }

  failList.sort((a, b) => a.needed - b.needed);

  // السيناريو الأول: تحويل الطالب من مكمل إلى ناجح
  if (result.originalFails <= 2) {
    const totalNeededForAll = failList.reduce((acc, curr) => acc + curr.needed, 0);
    if (totalNeededForAll <= 5) {
      failList.forEach(item => {
        result.modifiedGrades[item.id] = 50;
        result.graceMarksApplied[item.id] = item.needed;
        result.graceMarksUsed += item.needed;
      });
      result.newFails = 0;
      result.newStatus = 'ناجح بالقرار';
      return result;
    }
  }

  // السيناريو الثاني: تحويل الطالب من راسب إلى مكمل (3 رسوب -> 2 رسوب)
  if (result.originalFails === 3) {
    const easiestToPass = failList[0];
    if (easiestToPass.needed <= 5) {
      result.modifiedGrades[easiestToPass.id] = 50;
      result.graceMarksApplied[easiestToPass.id] = easiestToPass.needed;
      result.graceMarksUsed = easiestToPass.needed;
      result.newFails = 2;
      result.newStatus = 'مكمل بالقرار (2)';
      return result;
    }
  }

  result.newFails = result.originalFails;
  result.newStatus = result.originalStatus;
  return result;
}

function toggleGraceMarks() {
  if (window.isControlLocked && window.isControlLocked()) {
    showToast('⚠️ سجل الكنترول مشمع ومقفل! لا يمكن تغيير درجات القرار إلا بعد فك القفل.', 'warning');
    return;
  }
  if (typeof window.takeSnapshot === 'function') {
    window.takeSnapshot('قبل تعديل حالة درجات القرار الوزاري');
  }
  if (!appData.config) appData.config = {};
  appData.config.enableGraceMarks = !appData.config.enableGraceMarks;
  saveData();
  if (typeof renderGradesSheet === 'function') renderGradesSheet();
  if (typeof renderReportCardsSheet === 'function') renderReportCardsSheet();
}

window.calculateGraceMarks = calculateGraceMarks;
window.toggleGraceMarks = toggleGraceMarks;


/* --- Start of stats.js --- */
// وحدة استمارة إحصاء أعداد طلبة المدرسة (Stats Report Generator)
// الميزانية القصوى: 180 سطر

function renderStatsReport() {
  const thead = document.getElementById('statsTableHead');
  const tbody = document.getElementById('statsTableBody');
  const tfoot = document.getElementById('statsTableFoot');

  if (!thead || !tbody || !tfoot) return;

  const lvl = appData.config?.schoolLevel || 'primary';

  const defaultGrades = {
    primary: [
      { val: '1', name: 'الأول الابتدائي' },
      { val: '2', name: 'الثاني الابتدائي' },
      { val: '3', name: 'الثالث الابتدائي' },
      { val: '4', name: 'الرابع الابتدائي' },
      { val: '5', name: 'الخامس الابتدائي' },
      { val: '6', name: 'السادس الابتدائي' }
    ],
    middle: [
      { val: '1', name: 'الأول المتوسط' },
      { val: '2', name: 'الثاني المتوسط' },
      { val: '3', name: 'الثالث المتوسط' }
    ],
    high: [
      { val: '4', name: 'الرابع الإعدادي' },
      { val: '5', name: 'الخامس الإعدادي' },
      { val: '6', name: 'السادس الإعدادي' }
    ]
  };

  const gradesList = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[lvl]?.grades) 
    ? SCHOOL_LEVELS[lvl].grades 
    : (defaultGrades[lvl] || defaultGrades.primary);

  const configuredSections = [];
  gradesList.forEach(g => {
    const secs = (typeof getSectionsForGrade === 'function') ? getSectionsForGrade(g.val) : ['أ', 'ب'];
    secs.forEach(s => configuredSections.push(s));
  });
  const studentSections = (appData.students || []).map(s => s.section).filter(Boolean);
  let detectedSections = Array.from(new Set([...configuredSections, ...studentSections]));
  detectedSections.sort((a, b) => a.localeCompare(b, 'ar'));

  if (detectedSections.length === 0) {
    detectedSections = ['أ', 'ب'];
  }

  thead.innerHTML = `
    <tr class="bg-slate-900 text-white font-bold">
      <th rowspan="2" class="border border-slate-600 p-2 w-12">الشعب</th>
      ${gradesList.map(g => `<th colspan="3" class="border border-slate-600 p-2">${escapeHtml(g.name)}</th>`).join('')}
      <th colspan="3" class="border border-slate-600 p-2 bg-indigo-950">المجموع الكلي</th>
    </tr>
    <tr class="bg-slate-800 text-slate-200 font-semibold text-[11px]">
      ${gradesList.map(() => `
        <th class="border border-slate-600 p-1 w-10">مجموع</th>
        <th class="border border-slate-600 p-1 w-8">إناث</th>
        <th class="border border-slate-600 p-1 w-8">ذكور</th>
      `).join('')}
      <th class="border border-slate-600 p-1 w-12 bg-amber-900 text-white font-bold">كلي</th>
      <th class="border border-slate-600 p-1 w-10 bg-slate-900">إناث</th>
      <th class="border border-slate-600 p-1 w-10 bg-slate-900">ذكور</th>
    </tr>
  `;

  const colTotals = {};
  gradesList.forEach(g => {
    colTotals[g.val] = { m: 0, f: 0, total: 0 };
  });

  let grandTotalM = 0;
  let grandTotalF = 0;

  tbody.innerHTML = detectedSections.map(sec => {
    let rowCells = '';
    let secM = 0;
    let secF = 0;

    gradesList.forEach(g => {
      const activeGradeSecs = (typeof getSectionsForGrade === 'function') ? getSectionsForGrade(g.val) : ['أ', 'ب'];
      const isSecValidForGrade = activeGradeSecs.includes(sec);

      const studs = (appData.students || []).filter(s => String(s.grade) === String(g.val) && s.section === sec);
      const mCount = studs.filter(s => s.gender === 'ذكر').length;
      const fCount = studs.filter(s => s.gender === 'أنثى').length;
      const tCount = studs.length;

      secM += mCount;
      secF += fCount;

      colTotals[g.val].m += mCount;
      colTotals[g.val].f += fCount;
      colTotals[g.val].total += tCount;

      if (!isSecValidForGrade && tCount === 0) {
        rowCells += `
          <td class="p-1.5 border border-slate-300 font-bold bg-slate-100 text-slate-400">-</td>
          <td class="p-1.5 border border-slate-300 bg-slate-100 text-slate-400">-</td>
          <td class="p-1.5 border border-slate-300 bg-slate-100 text-slate-400">-</td>
        `;
      } else {
        rowCells += `
          <td class="p-1.5 border border-slate-300 font-bold bg-slate-50">${tCount || '-'}</td>
          <td class="p-1.5 border border-slate-300 text-pink-700">${fCount || '-'}</td>
          <td class="p-1.5 border border-slate-300 text-blue-700">${mCount || '-'}</td>
        `;
      }
    });

    const secTotal = secM + secF;
    grandTotalM += secM;
    grandTotalF += secF;

    return `
      <tr class="text-center font-medium hover:bg-slate-50 transition border-b border-slate-300">
        <td class="p-2 border border-slate-300 font-bold bg-slate-100 text-slate-800">${escapeHtml(sec)}</td>
        ${rowCells}
        <td class="p-1.5 border border-slate-300 font-black bg-amber-50 text-amber-950">${secTotal}</td>
        <td class="p-1.5 border border-slate-300 font-bold text-pink-800 bg-pink-50/50">${secF}</td>
        <td class="p-1.5 border border-slate-300 font-bold text-blue-800 bg-blue-50/50">${secM}</td>
      </tr>
    `;
  }).join('');

  let footerGradeCells = '';
  gradesList.forEach(g => {
    footerGradeCells += `
      <td class="p-2 border border-slate-400 font-black bg-slate-200 text-slate-900">${colTotals[g.val].total}</td>
      <td class="p-2 border border-slate-400 font-bold bg-pink-100 text-pink-900">${colTotals[g.val].f}</td>
      <td class="p-2 border border-slate-400 font-bold bg-blue-100 text-blue-900">${colTotals[g.val].m}</td>
    `;
  });

  const grandTotalAll = grandTotalM + grandTotalF;

  tfoot.innerHTML = `
    <tr class="font-bold text-center border-t-2 border-slate-600">
      <td class="p-2 border border-slate-400 font-black bg-slate-300 text-slate-900">المجموع</td>
      ${footerGradeCells}
      <td class="p-2 border border-slate-400 font-black bg-amber-300 text-amber-950 text-sm">${grandTotalAll}</td>
      <td class="p-2 border border-slate-400 font-black bg-pink-200 text-pink-950">${grandTotalF}</td>
      <td class="p-2 border border-slate-400 font-black bg-blue-200 text-blue-950">${grandTotalM}</td>
    </tr>
  `;
}

window.renderStatsReport = renderStatsReport;
window.renderStatsTable = renderStatsReport;


/* --- Start of rooms.js --- */
// وحدة إدارة وتوزيع القاعات الامتحانية (Exam Rooms Manager)
// الميزانية القصوى: 220 سطر

let activeRoomGradeFilter = 'all';

function setRoomGradeFilter(val) {
  activeRoomGradeFilter = val;
  distributeStudentsToRooms();
}

function distributeStudentsToRooms() {
  const roomsContainer = document.getElementById('roomsDisplayContainer');
  const unallocBox = document.getElementById('unallocatedStudentsContainer');
  const unallocList = document.getElementById('unallocatedStudentsList');
  const unallocBadge = document.getElementById('unallocatedCountBadge');

  if (!roomsContainer) return;

  const rooms = appData.rooms || [];
  let students = [...(appData.students || [])];

  const lvl = appData.config?.schoolLevel || 'primary';
  const activeGradesList = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[lvl]) ? SCHOOL_LEVELS[lvl].grades : [];
  const gradesObj = {};
  activeGradesList.forEach(g => gradesObj[g.val] = g.name);

  const filterSelect = document.getElementById('roomGradeFilterSelect');
  if (filterSelect && filterSelect.value) {
    activeRoomGradeFilter = filterSelect.value;
  }

  if (activeRoomGradeFilter && activeRoomGradeFilter !== 'all') {
    students = students.filter(s => String(s.grade) === String(activeRoomGradeFilter));
  }

  students.sort((a, b) => {
    if (String(a.grade) !== String(b.grade)) return String(a.grade).localeCompare(String(b.grade));
    if (a.section !== b.section) return a.section.localeCompare(b.section, 'ar');
    return a.name.localeCompare(b.name, 'ar');
  });

  let currentIndex = 0;
  const roomAllocations = {};

  rooms.forEach(room => {
    const cap = Math.max(1, Number(room.capacity) || 0);
    roomAllocations[room.id] = students.slice(currentIndex, currentIndex + cap);
    currentIndex += cap;
  });

  const unallocatedStudents = students.slice(currentIndex);

  roomsContainer.innerHTML = rooms.map((room, rIdx) => {
    const allocated = roomAllocations[room.id] || [];
    return `
      <div class="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden flex flex-col">
        <div class="bg-slate-900 text-white p-3 flex justify-between items-center text-sm font-bold">
          <span>${escapeHtml(room.name || ('القاعة الامتحانية (' + (rIdx + 1) + ')'))}</span>
          <span class="text-xs bg-indigo-600 px-2 py-0.5 rounded font-mono">المشغول: ${allocated.length} / ${room.capacity}</span>
        </div>
        <div class="p-3 max-h-80 overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
          ${allocated.length === 0 ? '<div class="text-center text-slate-400 py-6">لا يوجد طلبة في هذه القاعة</div>' : ''}
          ${allocated.map((st, idx) => `
            <div class="py-1.5 flex justify-between items-center">
              <div class="flex items-center gap-2">
                <span class="w-6 text-center font-bold text-slate-400 font-mono">${idx + 1}</span>
                <span class="font-bold text-slate-800">${escapeHtml(st.name)}</span>
              </div>
              <span class="text-slate-500 font-medium">مقعد (${idx + 1}) | ${escapeHtml(gradesObj[st.grade] || ('الصف ' + st.grade))} - شعبة (${escapeHtml(st.section)})</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  if (unallocatedStudents.length > 0 && unallocBox && unallocList) {
    unallocBox.classList.remove('hidden');
    if (unallocBadge) unallocBadge.innerText = `${unallocatedStudents.length} طالب`;

    unallocList.innerHTML = unallocatedStudents.map((st, idx) => `
      <tr class="hover:bg-rose-50/50">
        <td class="p-1.5 text-center font-mono font-bold text-rose-900">${idx + 1}</td>
        <td class="p-1.5 font-bold text-slate-800">${escapeHtml(st.name)}</td>
        <td class="p-1.5 text-center font-medium text-slate-600">${escapeHtml(gradesObj[st.grade] || st.grade)}</td>
        <td class="p-1.5 text-center font-bold text-indigo-700">${escapeHtml(st.section)}</td>
      </tr>
    `).join('');
  } else if (unallocBox) {
    unallocBox.classList.add('hidden');
  }
}

function addNewRoom() {
  if (!appData.rooms) appData.rooms = [];
  const nextNum = appData.rooms.length + 1;
  appData.rooms.push({
    id: 'room_' + Date.now(),
    name: 'القاعة الامتحانية (' + nextNum + ')',
    capacity: 30
  });
  saveData();
  renderRoomsSettings();
  distributeStudentsToRooms();
}

function renderRoomsSettings() {
  const container = document.getElementById('roomsSettingsGrid');
  if (!container) return;
  const rooms = appData.rooms || [];

  const filterContainer = document.getElementById('roomGradeFilterSelectContainer');
  if (filterContainer) {
    const lvl = appData.config?.schoolLevel || 'primary';
    const gradesList = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[lvl]) ? SCHOOL_LEVELS[lvl].grades : [];
    filterContainer.innerHTML = `
      <label class="font-bold text-xs text-slate-700 ml-1">توزيع صف محدد:</label>
      <select id="roomGradeFilterSelect" onchange="setRoomGradeFilter(this.value)" class="border rounded px-2.5 py-1 text-xs font-bold bg-white text-indigo-900">
        <option value="all" ${activeRoomGradeFilter === 'all' ? 'selected' : ''}>توزيع كافة الصفوف معاً</option>
        ${gradesList.map(g => `<option value="${g.val}" ${activeRoomGradeFilter === String(g.val) ? 'selected' : ''}>${escapeHtml(g.name)} فقط</option>`).join('')}
      </select>
    `;
  }

  container.innerHTML = rooms.map((room) => `
    <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col gap-2">
      <div class="flex justify-between items-center gap-2">
        <input type="text" value="${escapeHtml(room.name)}" onchange="updateRoomName('${escapeHtml(room.id)}', this.value)" class="w-full border rounded px-2 py-1 font-bold text-slate-800 bg-white" placeholder="اسم القاعة">
        <button onclick="deleteRoom('${escapeHtml(room.id)}')" class="text-rose-600 hover:text-rose-800 p-1" title="حذف القاعة">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
      <div class="flex items-center justify-between gap-2">
        <label class="text-slate-600 font-semibold">عدد المقاعد (السعة):</label>
        <input type="number" min="1" max="500" value="${room.capacity}" onchange="updateRoomCapacity('${escapeHtml(room.id)}', this.value)" class="w-20 border rounded px-2 py-1 text-center font-bold bg-white">
      </div>
    </div>
  `).join('');
}

function updateRoomName(id, newName) {
  const room = (appData.rooms || []).find(r => r.id === id);
  if (room && newName.trim()) {
    room.name = newName.trim();
    saveData();
    distributeStudentsToRooms();
  }
}

function updateRoomCapacity(id, val) {
  const room = (appData.rooms || []).find(r => r.id === id);
  if (room) {
    room.capacity = Math.max(1, Number(val) || 1);
    saveData();
    distributeStudentsToRooms();
  }
}

function deleteRoom(id) {
  if (confirm('هل أنت متأكد من حذف هذه القاعة؟')) {
    appData.rooms = (appData.rooms || []).filter(r => r.id !== id);
    saveData();
    renderRoomsSettings();
    distributeStudentsToRooms();
  }
}

window.distributeStudentsToRooms = distributeStudentsToRooms;
window.addNewRoom = addNewRoom;
window.renderRoomsSettings = renderRoomsSettings;
window.updateRoomName = updateRoomName;
window.updateRoomCapacity = updateRoomCapacity;
window.deleteRoom = deleteRoom;
window.setRoomGradeFilter = setRoomGradeFilter;


/* --- Start of reportCards.js --- */
// وحدة كروت وشهادات نتائج الطلبة لأولياء الأمور (Report Cards Generator)
// الميزانية القصوى: 260 سطر

function getGradeAppreciation(score) {
  if (score === null || score === undefined || score === '' || isNaN(score)) return '-';
  const n = Number(score);
  if (n >= 90) return 'ممتاز';
  if (n >= 80) return 'جيد جداً';
  if (n >= 70) return 'جيد';
  if (n >= 60) return 'متوسط';
  if (n >= 50) return 'مقبول';
  return 'راسب';
}

function openReportCardsModal() {
  const modal = document.getElementById('reportCardsModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  populateReportCardFilters();
  renderReportCardsSheet();
}

function closeReportCardsModal() {
  const modal = document.getElementById('reportCardsModal');
  if (modal) modal.classList.add('hidden');
}

function populateReportCardFilters() {
  const sel = document.getElementById('reportCardFilterSelect');
  if (!sel) return;

  const lvl = appData.config?.schoolLevel || 'primary';
  const defaultGrades = [
    { val: '1', name: 'الأول الابتدائي' },
    { val: '2', name: 'الثاني الابتدائي' },
    { val: '3', name: 'الثالث الابتدائي' },
    { val: '4', name: 'الرابع الابتدائي' },
    { val: '5', name: 'الخامس الابتدائي' },
    { val: '6', name: 'السادس الابتدائي' }
  ];
  const gradesList = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[lvl]) ? SCHOOL_LEVELS[lvl].grades : defaultGrades;

  let opts = '';
  gradesList.forEach(g => {
    const activeSecs = (typeof getSectionsForGrade === 'function') ? getSectionsForGrade(g.val) : ['أ', 'ب'];
    activeSecs.forEach(sec => {
      opts += `<option value="${g.val}-${sec}">${escapeHtml(g.name)} - شعبة (${escapeHtml(sec)})</option>`;
    });
  });

  const prev = sel.value;
  sel.innerHTML = opts;
  if (prev && Array.from(sel.options).some(o => o.value === prev)) {
    sel.value = prev;
  }
}

function renderReportCardsSheet() {
  const container = document.getElementById('reportCardsContainer');
  const filterVal = document.getElementById('reportCardFilterSelect')?.value;
  const layoutType = document.getElementById('reportCardLayoutType')?.value || 'grid4';

  if (!container) return;
  if (!filterVal) {
    populateReportCardFilters();
  }

  const currentFilter = document.getElementById('reportCardFilterSelect')?.value;
  if (!currentFilter) return;

  const [gradeVal, secVal] = currentFilter.split('-');
  const lvl = appData.config?.schoolLevel || 'primary';
  const subjects = (typeof getSubjectsForGrade === 'function') ? getSubjectsForGrade(lvl, gradeVal) : ((window.SUBJECTS_BY_LEVEL && window.SUBJECTS_BY_LEVEL[lvl]) || []);

  const activeGradesList = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[lvl]) ? SCHOOL_LEVELS[lvl].grades : [];
  const gObj = activeGradesList.find(g => String(g.val) === String(gradeVal));
  const gradeTitle = gObj ? gObj.name : ('الصف ' + gradeVal);

  const studs = (appData.students || []).filter(s => String(s.grade) === String(gradeVal) && s.section === secVal);
  studs.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  if (studs.length === 0) {
    container.innerHTML = '<div class="text-center p-12 text-slate-400 font-bold bg-white rounded-xl">لا يوجد طلبة مسجلين في هذا الصف والشعبة لتوليد بطاقات نتائجهم.</div>';
    return;
  }

  const schoolName = appData.config?.schoolName ? `مدرسة ${appData.config.schoolName}` : 'المدرسة';
  const schoolYear = appData.config?.schoolYear || '2026 - 2027 م';
  const examType = appData.config?.examType || 'قائمة درجات الامتحانات';
  const principal = appData.config?.principal || '...................';
  const secretary = appData.config?.secretary || '...................';
  const useGrace = !!appData.config?.enableGraceMarks;

  const cardsHtml = studs.map((st) => {
    const rawGrades = appData.grades?.[st.id] || {};
    let finalEval = {
      modifiedGrades: { ...rawGrades },
      graceMarksApplied: {},
      newStatus: '',
      graceMarksUsed: 0
    };

    if (useGrace && typeof calculateGraceMarks === 'function') {
      finalEval = calculateGraceMarks(rawGrades, subjects);
    } else {
      let t = 0;
      let cnt = 0;
      let f = 0;
      subjects.forEach(sub => {
        const m = rawGrades[sub.id];
        if (m !== undefined && m !== null && m !== '') {
          t += Number(m);
          cnt++;
          if (Number(m) < 50) f++;
        }
      });
      if (cnt === subjects.length && subjects.length > 0) {
        finalEval.newStatus = f === 0 ? 'ناجح' : (f <= 2 ? `مكمل (${f})` : `راسب (${f})`);
      } else {
        finalEval.newStatus = cnt > 0 ? `رُصد (${cnt}/${subjects.length})` : 'غير مكتمل';
      }
    }

    let totalMarks = 0;
    let countMarks = 0;
    const tableRows = subjects.map(sub => {
      const markVal = finalEval.modifiedGrades[sub.id];
      const hasMark = (markVal !== undefined && markVal !== null && markVal !== '');
      const num = hasMark ? Number(markVal) : null;
      if (hasMark) {
        totalMarks += num;
        countMarks++;
      }
      const graceGiven = finalEval.graceMarksApplied[sub.id] || 0;
      const isFail = hasMark && num < 50;
      const apprec = hasMark ? getGradeAppreciation(num) : '-';
      const markDisplay = hasMark ? (graceGiven > 0 ? `${num} <span class="text-[10px] text-purple-600 font-bold" title="درجة قرار: +${graceGiven}">*</span>` : num) : '-';

      return `
        <tr class="border-b border-slate-300 text-center ${isFail ? 'bg-rose-50 text-rose-800' : ''}">
          <td class="p-1 border border-slate-300 font-bold text-right pr-2 text-xs">${escapeHtml(sub.name)}</td>
          <td class="p-1 border border-slate-300 font-mono font-bold text-xs">${markDisplay}</td>
          <td class="p-1 border border-slate-300 text-[11px] font-semibold">${apprec}</td>
        </tr>
      `;
    }).join('');

    const avg = countMarks === subjects.length && subjects.length > 0 
      ? (totalMarks / subjects.length).toFixed(1) 
      : (countMarks > 0 ? (totalMarks / countMarks).toFixed(1) + '*' : '-');

    const statusBadgeClass = finalEval.newStatus.includes('ناجح') 
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
      : (finalEval.newStatus.includes('مكمل') ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300');

    return `
      <div class="report-card-item bg-white border-2 border-slate-700 rounded-xl p-4 flex flex-col justify-between shadow-sm page-break-avoid">
        <div>
          <div class="text-center border-b-2 border-slate-800 pb-2 mb-2">
            <div class="flex justify-between items-center text-[10px] text-slate-600 font-bold">
              <span>وزارة التربية والتعليم</span>
              <span>${escapeHtml(schoolYear)}</span>
            </div>
            <h4 class="font-black text-sm text-slate-900 mt-0.5">${escapeHtml(schoolName)}</h4>
            <div class="text-[11px] font-bold text-indigo-900">${escapeHtml(examType)}</div>
          </div>

          <div class="bg-slate-50 border border-slate-200 rounded p-2 mb-3 text-xs grid grid-cols-2 gap-1 font-semibold">
            <div>اسم الطالب: <b class="text-slate-900 text-sm font-black">${escapeHtml(st.name)}</b></div>
            <div>رقم القيد / التسلسل: <b class="font-mono text-indigo-800 font-bold">${escapeHtml(st.reg)}</b></div>
            <div>الصف: <b class="text-slate-800">${escapeHtml(gradeTitle)}</b></div>
            <div>الشعبة: <b class="text-indigo-800 font-bold">${escapeHtml(st.section)}</b></div>
          </div>

          <table class="w-full text-center border-collapse border border-slate-400 mb-2">
            <thead class="bg-slate-800 text-white text-[11px]">
              <tr>
                <th class="p-1 border border-slate-400 text-right pr-2">المادة</th>
                <th class="p-1 border border-slate-400 w-16">الدرجة</th>
                <th class="p-1 border border-slate-400 w-20">التقدير</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
            <tfoot class="bg-slate-100 text-slate-900 text-xs font-bold border-t-2 border-slate-400">
              <tr>
                <td class="p-1 border border-slate-400 text-right pr-2">المجموع / المعدل</td>
                <td class="p-1 border border-slate-400 font-mono">${totalMarks}</td>
                <td class="p-1 border border-slate-400 font-mono">${avg}%</td>
              </tr>
            </tfoot>
          </table>

          <div class="flex items-center justify-between p-2 rounded border ${statusBadgeClass} text-xs font-black my-2">
            <span>النتيجة النهائية:</span>
            <span class="text-sm">${finalEval.newStatus}</span>
          </div>
          ${useGrace && finalEval.graceMarksUsed > 0 ? `<div class="text-[10px] text-purple-700 text-center font-bold mb-1">* تم منح التلميذ (${finalEval.graceMarksUsed}) درجات قرار قانونية</div>` : ''}
        </div>

        <div class="border-t border-slate-300 pt-2 mt-2 flex justify-between items-center text-[10px] font-bold text-slate-700">
          <div>منظم السجل: <span>${escapeHtml(secretary)}</span></div>
          <div class="text-center">ختم الإدارة</div>
          <div>المدير: <span>${escapeHtml(principal)}</span></div>
        </div>
      </div>
    `;
  }).join('');

  if (layoutType === 'grid4') {
    container.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
  } else {
    container.className = 'grid grid-cols-1 max-w-xl mx-auto gap-6';
  }

  container.innerHTML = cardsHtml;
}

window.getGradeAppreciation = getGradeAppreciation;
window.openReportCardsModal = openReportCardsModal;
window.closeReportCardsModal = closeReportCardsModal;
window.populateReportCardFilters = populateReportCardFilters;
window.renderReportCardsSheet = renderReportCardsSheet;


/* --- Start of officialDocs.js --- */
/**
 * officialDocs.js - حزمة الوثائق المدرسية الرسمية التلقائية
 * مسؤولية الوحدة: توليد وطباعة الوثائق المدرسية المعتمدة رسمياً:
 * 1. تأييد استمرار بالدوام (لمن يهمه الأمر).
 * 2. وثيقة نقل طالب مع بيان الموقف الدراسي.
 * 3. بطاقات الاشتراك بالامتحانات وأرقام الجلوس (Exam Hall Passes).
 */

let activeDocType = 'enrollment'; // enrollment | transfer | examPass

/**
 * تبديل نوع الوثيقة المعروضة في لوحة الوثائق
 */
function switchDocType(type) {
  activeDocType = type;
  document.querySelectorAll('.doc-nav-btn').forEach(btn => {
    btn.classList.remove('bg-indigo-600', 'text-white');
    btn.classList.add('bg-slate-100', 'text-slate-700');
  });
  const currentBtn = document.getElementById(`btn-doc-${type}`);
  if (currentBtn) {
    currentBtn.classList.add('bg-indigo-600', 'text-white');
    currentBtn.classList.remove('bg-slate-100', 'text-slate-700');
  }
  renderOfficialDocsView();
}

/**
 * تحديث وعرض محتوى الوثيقة المختارة
 */
function renderOfficialDocsView() {
  const container = document.getElementById('officialDocPreviewContainer');
  if (!container) return;

  const students = (window.appData && window.appData.students) ? window.appData.students : [];
  if (students.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
        <i class="fa-solid fa-folder-open text-4xl text-slate-300 mb-3"></i>
        <h4 class="font-bold text-slate-700 text-lg">لا يوجد طلبة مسجلين في النظام</h4>
        <p class="text-xs text-slate-500 mt-1">يرجى إدخال أو استيراد الطلبة أولاً لتوليد الوثائق الرسمية لهم.</p>
      </div>
    `;
    return;
  }

  const yearInput = document.getElementById('docSchoolYearInput');
  if (yearInput && !yearInput.value) {
    yearInput.value = window.appData?.config?.schoolYear || '2026 - 2027 م';
  }
  const dateInput = document.getElementById('docIssueDateInput');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // ملء قائمة اختيار الطالب إذا كانت فارغة أو تغير الطلبة
  populateStudentSelector(students);

  const selectedStudentId = document.getElementById('docStudentSelect')?.value || students[0]?.id;
  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0];

  if (activeDocType === 'enrollment') {
    renderEnrollmentDoc(currentStudent, container);
  } else if (activeDocType === 'transfer') {
    renderTransferDoc(currentStudent, container);
  } else if (activeDocType === 'examPass') {
    renderExamPassDoc(students, container);
  }
}

function onDocSchoolYearChange(val) {
  if (window.appData && window.appData.config) {
    window.appData.config.schoolYear = val;
    const cfgEl = document.getElementById('cfgSchoolYear');
    if (cfgEl) cfgEl.value = val;
    if (typeof saveData === 'function') saveData();
  }
  renderOfficialDocsView();
}

/**
 * ملء قائمة اختيار الطالب للوثائق الفردية
 */
function populateStudentSelector(students) {
  const sel = document.getElementById('docStudentSelect');
  if (!sel) return;
  const curVal = sel.value;
  sel.innerHTML = students.map(s => `
    <option value="${s.id}" ${s.id === curVal ? 'selected' : ''}>
      ${escapeHtml(s.name)} - (${escapeHtml(s.grade)} / ${escapeHtml(s.section)})
    </option>
  `).join('');
}

/**
 * 1. وثيقة تأييد استمرار بالدوام
 */
function renderEnrollmentDoc(student, container) {
  const cfg = window.appData?.config || {};
  const schoolName = cfg.schoolName ? `مدرسة ${cfg.schoolName}` : 'إدارة المدرسة';
  const schoolYear = document.getElementById('docSchoolYearInput')?.value || cfg.schoolYear || '2026 - 2027 م';
  const rawDate = document.getElementById('docIssueDateInput')?.value;
  const today = rawDate ? new Date(rawDate).toLocaleDateString('ar-IQ') : new Date().toLocaleDateString('ar-IQ');
  const refNum = 'م / ' + (new Date().getFullYear()) + ' / ' + (Math.abs(hashString(student.id)) % 899 + 100);
  const destination = document.getElementById('docCustomDestination')?.value || 'إلى / من يهمه الأمر المحترم';

  container.innerHTML = `
    <div class="bg-white p-8 md:p-12 rounded-xl shadow-lg border border-slate-200 max-w-4xl mx-auto print-area doc-a4">
      <!-- ترويسة رسمية -->
      <div class="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
        <div class="text-right text-xs leading-relaxed font-bold text-slate-800">
          <div>جمهورية العراق</div>
          <div>وزارة التربية</div>
          <div>المديرية العامة للتربية</div>
          <div class="text-indigo-900">${escapeHtml(schoolName)}</div>
        </div>
        <div class="text-center">
          <i class="fa-solid fa-stamp text-4xl text-amber-600 mb-1 opacity-80"></i>
          <h2 class="text-xl font-black text-slate-900">تأييد استمرار بالدوام</h2>
          <span class="text-xs font-mono text-slate-500">رقم الصادر: ${refNum}</span>
        </div>
        <div class="text-left text-xs leading-relaxed font-bold text-slate-800">
          <div>التاريخ: ${today}</div>
          <div>العام الدراسي: ${escapeHtml(schoolYear)}</div>
          <div>المرحلة: ${escapeHtml(student.grade)}</div>
        </div>
      </div>

      <!-- محتوى التأييد -->
      <div class="py-6 space-y-6 text-base text-slate-900 leading-loose">
        <h3 class="text-lg font-bold text-slate-800">${escapeHtml(destination)}</h3>
        <p class="text-justify text-base">
          نؤيد لكم بأن الطالب/ـة: <span class="font-black text-indigo-950 text-lg border-b border-dashed border-slate-900 px-2">${escapeHtml(student.name)}</span>
          المسجل/ـة برقم قيد: <span class="font-bold">(${escapeHtml(student.id)})</span>، هو أحد طلبة مدرستنا في الصف 
          <span class="font-bold underline">${escapeHtml(student.grade)}</span> (شعبة: <span class="font-bold">${escapeHtml(student.section)}</span>)،
          وهو <strong>مستمر/ة بالدوام الرسمي</strong> للعام الدراسي <span class="font-bold">(${escapeHtml(schoolYear)})</span> 
          وحسن السيرة والسلوك حتى تاريخ صدور هذا الكتاب.
        </p>
        <p class="text-sm text-slate-700">
          وقد زُوّد بهذا التأييد بناءً على طلبه لتقديمه إلى جهتكم الموقرة دون تحمل إدارتنا أي تبعات مالية أو قانونية خارج نطاق واجبه المدرسي.
        </p>
      </div>

      <!-- التواقيع والباركود -->
      <div class="mt-12 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-800">
        <div>
          <p class="mb-8">معاون / منظم السجل</p>
          <p class="font-black">${escapeHtml(cfg.secretary || '...........................')}</p>
        </div>
        <div class="flex flex-col items-center justify-center">
          <div class="w-16 h-16 border border-dashed border-slate-400 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">
            ختم المدرسة
          </div>
          <span class="text-[10px] text-slate-400 mt-1 font-mono">${student.id}</span>
        </div>
        <div>
          <p class="mb-8">مدير / مديرة المدرسة</p>
          <p class="font-black">${escapeHtml(cfg.principal || '...........................')}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * 2. وثيقة نقل طالب
 */
function renderTransferDoc(student, container) {
  const cfg = window.appData?.config || {};
  const schoolName = cfg.schoolName ? `مدرسة ${cfg.schoolName}` : 'إدارة المدرسة';
  const schoolYear = document.getElementById('docSchoolYearInput')?.value || cfg.schoolYear || '2026 - 2027 م';
  const rawDate = document.getElementById('docIssueDateInput')?.value;
  const today = rawDate ? new Date(rawDate).toLocaleDateString('ar-IQ') : new Date().toLocaleDateString('ar-IQ');
  const targetSchool = document.getElementById('docTargetSchoolInput')?.value || 'مدرسة ...........................';

  container.innerHTML = `
    <div class="bg-white p-8 md:p-12 rounded-xl shadow-lg border border-slate-200 max-w-4xl mx-auto print-area doc-a4">
      <div class="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
        <div class="text-right text-xs font-bold leading-relaxed">
          <div>جمهورية العراق - وزارة التربية</div>
          <div class="text-indigo-900">${escapeHtml(schoolName)}</div>
        </div>
        <div class="text-center">
          <h2 class="text-xl font-black text-slate-900">استمارة وثيقة نقل طالب</h2>
          <span class="text-xs text-slate-500 font-mono">تاريخ الإصدار: ${today}</span>
        </div>
        <div class="text-left text-xs font-bold leading-relaxed">
          <div>العام الدراسي: ${escapeHtml(schoolYear)}</div>
        </div>
      </div>

      <div class="py-4 space-y-4 text-sm text-slate-900 leading-relaxed">
        <p class="font-bold text-base">إلى إدارة / <span class="border-b border-slate-800 px-2 text-indigo-900">${escapeHtml(targetSchool)}</span> المحترمون</p>
        <p>تحية طيبة وبعد،</p>
        <p>
          نرسل إليكم إضبارة ومعلومات التلميذ/ـة: <span class="font-black text-indigo-900 text-base px-2">${escapeHtml(student.name)}</span>
          المقيد في الصف <span class="font-bold">${escapeHtml(student.grade)}</span> (شعبة: ${escapeHtml(student.section)}).
        </p>
        <table class="w-full text-center border-collapse border border-slate-300 text-xs my-4">
          <thead class="bg-slate-100 font-bold">
            <tr>
              <th class="border border-slate-300 p-2">رقم القيد</th>
              <th class="border border-slate-300 p-2">الجنس</th>
              <th class="border border-slate-300 p-2">الموقف الدراسي</th>
              <th class="border border-slate-300 p-2">السلوك والمواظبة</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-slate-300 p-2 font-mono">${escapeHtml(student.id)}</td>
              <td class="border border-slate-300 p-2">${student.gender === 'أنثى' ? 'أنثى' : 'ذكر'}</td>
              <td class="border border-slate-300 p-2 text-emerald-800 font-bold">مستمر بالدوام (مؤهل للنقل)</td>
              <td class="border border-slate-300 p-2 text-indigo-900 font-bold">حسن السيرة والسلوك</td>
            </tr>
          </tbody>
        </table>
        <p class="text-xs text-slate-600">
          يرجى تزويدنا بكتاب استلام الإضبارة والمباشرة الرسمية للطفل لديكم في أقرب فرصة.
        </p>
      </div>

      <div class="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs font-bold">
        <div>
          <p class="mb-10">منظم الاستمارة</p>
          <p>${escapeHtml(cfg.secretary || '...........................')}</p>
        </div>
        <div>
          <p class="mb-10">مدير / مديرة المدرسة</p>
          <p>${escapeHtml(cfg.principal || '...........................')}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * 3. بطاقات الاشتراك بالامتحانات وقاعات الجلوس (Exam Hall Passes)
 */
function renderExamPassDoc(students, container) {
  const cfg = window.appData?.config || {};
  const schoolName = cfg.schoolName ? `مدرسة ${cfg.schoolName}` : 'إدارة المدرسة';
  const activeGrade = document.getElementById('docGradeFilterSelect')?.value || 'all';
  const filtered = activeGrade === 'all' ? students : students.filter(s => s.grade === activeGrade);

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between no-print bg-white p-3 rounded-lg border border-slate-200 text-xs">
        <span class="font-bold text-slate-700">عدد البطاقات الجاهزة للطباعة: ${filtered.length} بطاقة</span>
        <button onclick="window.print()" class="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700 flex items-center gap-1">
          <i class="fa-solid fa-print"></i> طباعة كافة البطاقات (4 لكل ورقة)
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
        ${filtered.map((s, idx) => `
          <div class="bg-white p-4 rounded-xl border-2 border-indigo-900 print:border-slate-800 shadow-sm relative overflow-hidden page-break-inside-avoid">
            <div class="flex items-center justify-between border-b pb-2 mb-2">
              <div class="text-right">
                <h4 class="font-black text-sm text-indigo-950">${escapeHtml(schoolName)}</h4>
                <span class="text-[10px] text-slate-500 font-bold">بطاقة الاشتراك بالامتحانات الرسمية</span>
              </div>
              <div class="w-10 h-10 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                صورة
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs mb-3">
              <div><span class="text-slate-500">اسم الطالب:</span> <strong class="text-slate-900">${escapeHtml(s.name)}</strong></div>
              <div><span class="text-slate-500">الصف والشعبة:</span> <strong>${escapeHtml(s.grade)} / ${escapeHtml(s.section)}</strong></div>
              <div><span class="text-slate-500">الرقم الامتحاني:</span> <strong class="font-mono text-indigo-700">${1000 + idx + 1}</strong></div>
              <div><span class="text-slate-500">رقم القيد:</span> <strong class="font-mono">${escapeHtml(s.id)}</strong></div>
            </div>

            <div class="bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <span>القاعة الامتحانية: <strong class="text-slate-900">قاعة رقم ${(idx % 4) + 1}</strong></span>
              <span class="font-mono text-[9px]">||||| | |||| ||| ${s.id}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// تصدير دوال الوحدة على window
window.switchDocType = switchDocType;
window.renderOfficialDocsView = renderOfficialDocsView;
window.onDocSchoolYearChange = onDocSchoolYearChange;


/* --- Start of analytics.js --- */
// وحدة التحليلات والمؤشرات البيانية ولوحة الشرف (Academic Analytics & Honors)
// الميزانية القصوى: 200 سطر

let chartPassRateInstance = null;
let chartAppreciationInstance = null;

function renderAcademicAnalytics() {
  const lvl = appData.config?.schoolLevel || 'primary';
  const subjects = (window.SUBJECTS_BY_LEVEL && window.SUBJECTS_BY_LEVEL[lvl]) ? window.SUBJECTS_BY_LEVEL[lvl] : [];
  const students = appData.students || [];
  const grades = appData.grades || {};

  const studentsWithStats = students.map(st => {
    const stGrades = grades[st.id] || {};
    let total = 0;
    let count = 0;
    let fails = 0;
    subjects.forEach(sub => {
      const m = stGrades[sub.id];
      if (m !== undefined && m !== null && m !== '') {
        total += Number(m);
        count++;
        if (Number(m) < 50) fails++;
      }
    });

    const isComplete = count === subjects.length && subjects.length > 0;
    const avg = isComplete ? Number((total / subjects.length).toFixed(2)) : 0;

    return {
      ...st,
      total,
      count,
      fails,
      isComplete,
      avg,
      isPassed: isComplete && fails === 0
    };
  });

  const topStudents = studentsWithStats
    .filter(s => s.isPassed)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  const topStudentsListEl = document.getElementById('analyticsTopStudentsList');
  if (topStudentsListEl) {
    if (topStudents.length === 0) {
      topStudentsListEl.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400 font-bold">لا يوجد طلبة استكملوا درجات النجاح بعد لعرض لوحة الشرف.</td></tr>';
    } else {
      const medals = ['🥇 الأول', '🥈 الثاني', '🥉 الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
      topStudentsListEl.innerHTML = topStudents.map((st, idx) => `
        <tr class="hover:bg-slate-50 border-b border-slate-200 text-center font-medium">
          <td class="p-2 font-bold font-mono ${idx < 3 ? 'text-amber-600 font-black' : 'text-slate-600'}">${medals[idx] || (idx + 1)}</td>
          <td class="p-2 font-bold text-slate-900 text-right pr-4">${escapeHtml(st.name)}</td>
          <td class="p-2 text-slate-700">الصف ${escapeHtml(st.grade)} (${escapeHtml(st.section)})</td>
          <td class="p-2 font-mono font-bold text-indigo-900">${st.total}</td>
          <td class="p-2 font-mono font-black text-emerald-700 bg-emerald-50">${st.avg}%</td>
        </tr>
      `).join('');
    }
  }

  const subjectPassRates = subjects.map(sub => {
    let totalAssessed = 0;
    let passed = 0;
    students.forEach(st => {
      const m = grades[st.id]?.[sub.id];
      if (m !== undefined && m !== null && m !== '') {
        totalAssessed++;
        if (Number(m) >= 50) passed++;
      }
    });
    const rate = totalAssessed > 0 ? Math.round((passed / totalAssessed) * 100) : 0;
    return { name: sub.name, rate, totalAssessed };
  });

  let apprecCounts = { 'ممتاز': 0, 'جيد جداً': 0, 'جيد': 0, 'متوسط': 0, 'مقبول': 0, 'راسب': 0 };
  studentsWithStats.forEach(st => {
    if (st.isComplete) {
      if (st.fails > 0) {
        apprecCounts['راسب']++;
      } else {
        const a = (typeof getGradeAppreciation === 'function') ? getGradeAppreciation(st.avg) : 'مقبول';
        if (apprecCounts[a] !== undefined) apprecCounts[a]++;
      }
    }
  });

  if (typeof Chart !== 'undefined') {
    const ctxPass = document.getElementById('chartSubjectPassRate')?.getContext('2d');
    if (ctxPass) {
      if (chartPassRateInstance) chartPassRateInstance.destroy();
      chartPassRateInstance = new Chart(ctxPass, {
        type: 'bar',
        data: {
          labels: subjectPassRates.map(s => s.name),
          datasets: [{
            label: 'نسبة النجاح (%)',
            data: subjectPassRates.map(s => s.rate),
            backgroundColor: subjectPassRates.map(s => s.rate >= 70 ? 'rgba(16, 185, 129, 0.75)' : (s.rate >= 50 ? 'rgba(245, 158, 11, 0.75)' : 'rgba(239, 68, 68, 0.75)')),
            borderColor: '#1e293b',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 0, max: 100, ticks: { callback: v => v + '%' } }
          }
        }
      });
    }

    const ctxApprec = document.getElementById('chartAppreciationDist')?.getContext('2d');
    if (ctxApprec) {
      if (chartAppreciationInstance) chartAppreciationInstance.destroy();
      chartAppreciationInstance = new Chart(ctxApprec, {
        type: 'doughnut',
        data: {
          labels: Object.keys(apprecCounts),
          datasets: [{
            data: Object.values(apprecCounts),
            backgroundColor: [
              '#10b981',
              '#06b6d4',
              '#3b82f6',
              '#f59e0b',
              '#8b5cf6',
              '#ef4444'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  }
}

window.renderAcademicAnalytics = renderAcademicAnalytics;


/* --- Start of excelExport.js --- */
// وحدة تصدير الدفتر المدرسي بصيغة إكسل رسمية (Excel .xlsx Exporter)
// الميزانية القصوى: 140 سطر

function exportMasterSheetToExcel() {
  if (typeof XLSX === 'undefined') {
    alert('مكتبة الإكسل غير محملة، يرجى التأكد من اتصال الإنترنت.');
    return;
  }

  const wb = XLSX.utils.book_new();
  const lvl = appData.config?.schoolLevel || 'primary';
  const subjects = (window.SUBJECTS_BY_LEVEL && window.SUBJECTS_BY_LEVEL[lvl]) ? window.SUBJECTS_BY_LEVEL[lvl] : [];
  const schoolName = appData.config?.schoolName || 'المدرسة';
  const schoolYear = appData.config?.schoolYear || '2026 - 2027';
  const examType = appData.config?.examType || 'قائمة الدرجات';
  const useGrace = !!appData.config?.enableGraceMarks;

  const masterData = [];
  masterData.push([`إدارة مدرسة: ${schoolName}`, '', `العام الدراسي: ${schoolYear}`, '', `نوع الامتحان: ${examType}`]);
  masterData.push([]);

  const headers = ['ت', 'رقم القيد', 'اسم الطالب الرباعي', 'الصف', 'الشعبة', 'الجنس'];
  subjects.forEach(s => headers.push(s.name));
  headers.push('المجموع', 'المعدل', 'النتيجة', 'درجات القرار المستخدمة');
  masterData.push(headers);

  const studs = [...(appData.students || [])];
  studs.sort((a, b) => {
    if (String(a.grade) !== String(b.grade)) return String(a.grade).localeCompare(String(b.grade));
    if (a.section !== b.section) return a.section.localeCompare(b.section, 'ar');
    return a.name.localeCompare(b.name, 'ar');
  });

  studs.forEach((st, idx) => {
    const rawGrades = appData.grades?.[st.id] || {};
    let finalEval = {
      modifiedGrades: { ...rawGrades },
      graceMarksUsed: 0,
      newStatus: ''
    };

    if (useGrace && typeof calculateGraceMarks === 'function') {
      finalEval = calculateGraceMarks(rawGrades, subjects);
    } else {
      let t = 0;
      let cnt = 0;
      let f = 0;
      subjects.forEach(sub => {
        const m = rawGrades[sub.id];
        if (m !== undefined && m !== null && m !== '') {
          t += Number(m);
          cnt++;
          if (Number(m) < 50) f++;
        }
      });
      if (cnt === subjects.length && subjects.length > 0) {
        finalEval.newStatus = f === 0 ? 'ناجح' : (f <= 2 ? `مكمل (${f})` : `راسب (${f})`);
      } else {
        finalEval.newStatus = cnt > 0 ? `رُصد (${cnt}/${subjects.length})` : '-';
      }
    }

    let total = 0;
    let count = 0;
    const row = [idx + 1, st.reg, st.name, st.grade, st.section, st.gender];

    subjects.forEach(sub => {
      const mark = finalEval.modifiedGrades[sub.id];
      if (mark !== undefined && mark !== null && mark !== '') {
        const n = Number(mark);
        row.push(n);
        total += n;
        count++;
      } else {
        row.push('-');
      }
    });

    const avg = count === subjects.length && subjects.length > 0 ? Number((total / subjects.length).toFixed(1)) : '-';
    row.push(count > 0 ? total : '-');
    row.push(avg);
    row.push(finalEval.newStatus);
    row.push(finalEval.graceMarksUsed || 0);

    masterData.push(row);
  });

  const wsMaster = XLSX.utils.aoa_to_sheet(masterData);
  XLSX.utils.book_append_sheet(wb, wsMaster, 'الماستر شيت للدرجات');

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `الماستر_شيت_المدرسي_${schoolName.replace(/\s+/g, '_')}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function normalizeStudentName(name) {
  if (!name) return '';
  return String(name)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/عبد\s+/g, 'عبد');
}

function downloadGradesTemplateExcel(targetSubjectId = null) {
  if (typeof XLSX === 'undefined') {
    alert('مكتبة الإكسل غير محملة.');
    return;
  }

  const select = targetSubjectId
    ? (document.getElementById('modalGradeFilterSelect') || document.getElementById('gradeFilterSelect'))
    : (document.getElementById('gradeFilterSelect') || document.getElementById('modalGradeFilterSelect'));
  const val = select ? select.value : '';
  const [gradeVal, secVal] = (val && val.includes('-')) ? val.split('-') : ['1', 'أ'];
  const lvl = appData.config?.schoolLevel || 'primary';
  const isLower = lvl === 'primary' && ['1', '2', '3', '4'].includes(String(gradeVal));
  const subjects = (typeof getSubjectsForGrade === 'function') ? getSubjectsForGrade(lvl, gradeVal) : ((window.SUBJECTS_BY_LEVEL && window.SUBJECTS_BY_LEVEL[lvl]) || []);

  const studs = (appData.students || []).filter(s => String(s.grade) === String(gradeVal) && s.section === secVal);
  studs.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  if (studs.length === 0) {
    alert('لا يوجد طلبة مسجلين في هذا الصف والشعبة حالياً لتوليد النموذج.');
    return;
  }

  const wb = XLSX.utils.book_new();
  const rows = [];

  if (targetSubjectId) {
    const subInfo = (window.SUBJECTS_INFO && window.SUBJECTS_INFO[targetSubjectId]) || targetSubjectId;
    if (isLower) {
      rows.push(['رقم القيد', 'اسم الطالب', 'نصف السنة', 'آخر السنة', `الدرجة النهائية (${subInfo})`]);
      studs.forEach(s => {
        const d = appData.subjectDetails?.[targetSubjectId]?.[s.id] || {};
        const curGrade = appData.grades?.[s.id]?.[targetSubjectId] ?? '';
        rows.push([s.reg, s.name, d.mid ?? '', d.final ?? '', curGrade]);
      });
    } else {
      rows.push(['رقم القيد', 'اسم الطالب', 'يومي ف1', 'شهر1 ف1', 'شهر2 ف1', 'نصف السنة', 'يومي ف2', 'شهر1 ف2', 'شهر2 ف2', 'الامتحان النهائي', `الدرجة النهائية (${subInfo})`]);
      studs.forEach(s => {
        const d = appData.subjectDetails?.[targetSubjectId]?.[s.id] || {};
        const curGrade = appData.grades?.[s.id]?.[targetSubjectId] ?? '';
        rows.push([s.reg, s.name, d.daily1 ?? '', d.m1 ?? '', d.m2 ?? '', d.mid ?? '', d.daily2 ?? '', d.m3 ?? '', d.m4 ?? '', d.final ?? '', curGrade]);
      });
    }
  } else {
    const headerRow = ['رقم القيد', 'اسم الطالب'];
    subjects.forEach(s => headerRow.push(s.name));
    rows.push(headerRow);

    studs.forEach(s => {
      const stGrades = appData.grades?.[s.id] || {};
      const r = [s.reg, s.name];
      subjects.forEach(sub => {
        r.push(stGrades[sub.id] ?? '');
      });
      rows.push(r);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'درجات الطلبة');
  const targetName = targetSubjectId ? `_${targetSubjectId}` : '_كافة_المواد';
  const fileName = `نموذج_درجات_الصف_${gradeVal}_شعبة_${secVal}${targetName}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function handleExcelGradesUpload(event, forcedSubjectId = null) {
  const file = event.target.files[0];
  if (!file) return;

  if (window.isControlLocked && window.isControlLocked()) {
    showToast('⚠️ سجل الكنترول مشمع ومقفل! لا يمكن استيراد الدرجات إلا بعد فك القفل.', 'warning');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      if (!jsonRows || jsonRows.length === 0) {
        alert('ملف الإكسل فارغ.');
        return;
      }

      if (typeof window.takeSnapshot === 'function') {
        window.takeSnapshot('قبل استيراد درجات من ملف إكسل');
      }

      const lvl = appData.config?.schoolLevel || 'primary';
      const allSubjects = (window.SUBJECTS_BY_LEVEL && window.SUBJECTS_BY_LEVEL[lvl]) || [];

      const subjectMap = {};
      allSubjects.forEach(s => {
        subjectMap[s.name.trim()] = s.id;
        subjectMap[s.id] = s.id;
      });
      Object.assign(subjectMap, {
        'اسلامية': 'islamic', 'التربية الاسلامية': 'islamic', 'الاسلامية': 'islamic',
        'عربي': 'arabic', 'اللغة العربية': 'arabic', 'قراءة': 'arabic', 'القراءة': 'arabic',
        'انكليزي': 'english', 'انجليزي': 'english', 'الانكليزية': 'english', 'اللغة الانكليزية': 'english', 'اللغة الإنجليزية': 'english',
        'رياضيات': 'math', 'الرياضيات': 'math', 'علوم': 'science', 'العلوم': 'science',
        'اجتماعيات': 'social', 'الاجتماعيات': 'social', 'اخلاقية': 'ethics', 'التربية الاخلاقية': 'ethics',
        'رياضة': 'sport', 'فنية': 'art'
      });

      const detailFieldMap = {
        'يومي ف1': 'daily1', 'يومي 1': 'daily1', 'شهر1 ف1': 'm1', 'شهر 1 ف1': 'm1', 'شهر2 ف1': 'm2', 'شهر 2 ف1': 'm2',
        'نصف السنة': 'mid', 'درجة نصف السنة': 'mid',
        'يومي ف2': 'daily2', 'يومي 2': 'daily2', 'شهر1 ف2': 'm3', 'شهر 1 ف2': 'm3', 'شهر2 ف2': 'm4', 'شهر 2 ف2': 'm4',
        'آخر السنة': 'final', 'اخر السنة': 'final', 'الامتحان النهائي': 'final', 'درجة آخر السنة': 'final'
      };

      let headerRowIdx = -1, nameCol = -1, regCol = -1;
      const colToSubject = {};
      const colToDetailField = {};

      for (let r = 0; r < Math.min(10, jsonRows.length); r++) {
        const row = jsonRows[r];
        if (!Array.isArray(row)) continue;

        row.forEach((cell, cIdx) => {
          const str = String(cell || '').trim();
          if (str.includes('اسم الطالب') || str.includes('اسم التلميذ') || str === 'الاسم' || str === 'اسم الطالب/ة') {
            nameCol = cIdx;
            headerRowIdx = r;
          } else if (str.includes('القيد') || str.includes('التسلسل') || str === 'ت') {
            regCol = cIdx;
          } else if (forcedSubjectId && detailFieldMap[str]) {
            colToDetailField[cIdx] = detailFieldMap[str];
            headerRowIdx = r;
          } else if (forcedSubjectId && (str.includes('الدرجة النهائية') || str.includes('المعدل النهائي'))) {
            colToSubject[cIdx] = forcedSubjectId;
            headerRowIdx = r;
          } else {
            for (let sName in subjectMap) {
              if (str === sName || str.includes(sName)) {
                colToSubject[cIdx] = subjectMap[sName];
                headerRowIdx = r;
                break;
              }
            }
          }
        });

        if (nameCol !== -1 && (Object.keys(colToSubject).length > 0 || Object.keys(colToDetailField).length > 0 || forcedSubjectId)) break;
      }

      if (nameCol === -1 && regCol === -1) { nameCol = 1; regCol = 0; }

      if (forcedSubjectId && Object.keys(colToSubject).length === 0 && Object.keys(colToDetailField).length === 0) {
        for (let r = (headerRowIdx !== -1 ? headerRowIdx + 1 : 1); r < Math.min(jsonRows.length, 5); r++) {
          const row = jsonRows[r];
          if (!row) continue;
          row.forEach((cell, cIdx) => {
            if (cIdx !== nameCol && cIdx !== regCol && !isNaN(Number(cell)) && cell !== '') {
              colToSubject[cIdx] = forcedSubjectId;
            }
          });
          if (Object.keys(colToSubject).length > 0) break;
        }
      }

      const studentMapByName = {}, studentMapByReg = {};
      (appData.students || []).forEach(st => {
        studentMapByName[normalizeStudentName(st.name)] = st;
        if (st.reg) studentMapByReg[String(st.reg).trim()] = st;
      });

      let updatedStudentsCount = 0, updatedMarksCount = 0;
      const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
      if (!appData.grades) appData.grades = {};
      if (!appData.subjectDetails) appData.subjectDetails = {};

      for (let r = startRow; r < jsonRows.length; r++) {
        const row = jsonRows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        let matchedStudent = null;
        if (regCol !== -1 && row[regCol] !== undefined) {
          const regStr = String(row[regCol]).trim();
          if (studentMapByReg[regStr]) matchedStudent = studentMapByReg[regStr];
        }
        if (!matchedStudent && nameCol !== -1 && row[nameCol]) {
          const normName = normalizeStudentName(String(row[nameCol]).trim());
          if (studentMapByName[normName]) matchedStudent = studentMapByName[normName];
          else {
            for (let k in studentMapByName) {
              if (k.startsWith(normName) || normName.startsWith(k)) { matchedStudent = studentMapByName[k]; break; }
            }
          }
        }
        if (!matchedStudent) continue;

        let stHasUpdate = false;
        if (!appData.grades[matchedStudent.id]) appData.grades[matchedStudent.id] = {};

        if (forcedSubjectId && Object.keys(colToDetailField).length > 0) {
          if (!appData.subjectDetails[forcedSubjectId]) appData.subjectDetails[forcedSubjectId] = {};
          if (!appData.subjectDetails[forcedSubjectId][matchedStudent.id]) appData.subjectDetails[forcedSubjectId][matchedStudent.id] = {};
          for (let colIdx in colToDetailField) {
            const fKey = colToDetailField[colIdx];
            const rawVal = row[colIdx];
            if (rawVal !== undefined && rawVal !== null && rawVal !== '' && !isNaN(Number(rawVal))) {
              appData.subjectDetails[forcedSubjectId][matchedStudent.id][fKey] = Math.min(100, Math.max(0, Math.round(Number(rawVal))));
              stHasUpdate = true;
              updatedMarksCount++;
            }
          }
          if (stHasUpdate && typeof computeStudentSubjectFinal === 'function') {
            computeStudentSubjectFinal(matchedStudent.id, forcedSubjectId);
          }
        }

        for (let colIdx in colToSubject) {
          const subId = colToSubject[colIdx];
          const rawMark = row[colIdx];
          if (rawMark !== undefined && rawMark !== null && rawMark !== '' && !isNaN(Number(rawMark))) {
            const markNum = Math.min(100, Math.max(0, Math.round(Number(rawMark))));
            appData.grades[matchedStudent.id][subId] = markNum;
            stHasUpdate = true;
            updatedMarksCount++;
          }
        }

        if (stHasUpdate) updatedStudentsCount++;
      }

      if (updatedStudentsCount > 0) {
        saveData();
        if (typeof renderGradesSheet === 'function') renderGradesSheet();
        if (typeof renderAll === 'function') renderAll();
        if (typeof renderSubjectDetailTable === 'function' && forcedSubjectId) renderSubjectDetailTable();
        alert(`🎉 نجاح تام!\nتم استيراد وتحديث درجات (${updatedStudentsCount}) طالب بنجاح.\nإجمالي الدرجات المرصودة: (${updatedMarksCount}) درجة.`);
      } else {
        alert('⚠️ لم يتم العثور على طلبة مطابقين للأسماء أو أرقام القيود في الملف، يرجى التأكد من مطابقة أسماء الطلبة.');
      }
    } catch (err) {
      alert('خطأ أثناء قراءة ملف الإكسل: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
  event.target.value = '';
}

function handleModalSubjectExcelUpload(event) {
  const currentSub = window.currentActiveSubject || 'islamic';
  handleExcelGradesUpload(event, currentSub);
}

function downloadActiveSubjectTemplateExcel() {
  const currentSub = window.currentActiveSubject || 'islamic';
  downloadGradesTemplateExcel(currentSub);
}

window.exportMasterSheetToExcel = exportMasterSheetToExcel;
window.normalizeStudentName = normalizeStudentName;
window.downloadGradesTemplateExcel = downloadGradesTemplateExcel;
window.handleExcelGradesUpload = handleExcelGradesUpload;
window.handleModalSubjectExcelUpload = handleModalSubjectExcelUpload;
window.downloadActiveSubjectTemplateExcel = downloadActiveSubjectTemplateExcel;



/* --- Start of cloudSecurity.js --- */
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


/* --- Start of cloudSync.js --- */
// وحدة المزامنة السحابية المركزية والعمل التعاوني اللحظي المحمي (Supabase Cloud Sync)
// الميزانية القصوى: 360 سطر

const CLOUD_CONFIG_KEY = 'MIZAN_CLOUD_SYNC_CONFIG_2026';

let cloudConfig = {
  supabaseUrl: 'https://imnqwelbgxxnegapowpu.supabase.co',
  supabaseKey: 'sb_publishable_Pf2C0cVb5IsXAWvFBYOrSQ_D09k-Ho_',
  schoolCode: 'SCH-1',
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
      if (parsed.supabaseUrl && (parsed.supabaseUrl.includes('rrlesmhpaanbpbcpdmre') || !parsed.supabaseUrl.includes('imnqwelbgxxnegapowpu'))) {
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
  if (cloudConfig.fullSchoolKey) return cloudConfig.fullSchoolKey;
  const code = (cloudConfig.schoolCode || 'MIZAN-2026').trim().toUpperCase().replace(/\s+/g, '');
  return code;
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
    const baseUrl = cloudConfig.supabaseUrl.replace(/\/$/, '');
    // 1. جلب أحدث سجل سحابي للمدرسة للتحقق من الرمز السري وإجراء الدمج الذكي غير المدمّر
    const checkUrl = `${baseUrl}/rest/v1/mizan_cloud_sync?school_code=ilike.${encodeURIComponent(fullKey + '*')}&order=updated_at.desc&select=payload,updated_at,updated_by&limit=1`;
    const checkRes = await fetch(checkUrl, { headers: { 'apikey': cloudConfig.supabaseKey } });

    let payloadToPush = { ...appData };
    let remotePayload = null;
    let remoteUpdatedAt = null;
    let remoteUpdatedBy = null;

    if (checkRes.ok) {
      const existingRows = await checkRes.json();
      if (Array.isArray(existingRows) && existingRows.length > 0) {
        const remoteRow = existingRows[0];
        remotePayload = remoteRow.payload;
        remoteUpdatedAt = remoteRow.updated_at;
        remoteUpdatedBy = remoteRow.updated_by;

        const remotePinHash = remotePayload?._security?.pinHash || '';
        if (remotePinHash && remotePinHash !== '' && remotePinHash !== pinHash) {
          updateCloudUiBadge('locked_pin', '🔒 الرمز السري للسحابة غير مطابق! تم رفض التعديل لحماية بيانات المدرسة.');
          if (!silent && typeof showToast === 'function') {
            showToast('🔒 الرمز السري للسحابة (PIN) غير صحيح! لا يمكن الكتابة فوق سجل المدرسة المحمي.', 'error');
          }
          return false;
        }

        // درع منع المسح من جهاز فارغ + دمج الطلبة ودرجات المواد المتزامنة دون فقدان أي طالب
        if (!forceOverwrite && typeof smartMergeCloudPayload === 'function' && remotePayload) {
          payloadToPush = smartMergeCloudPayload(remotePayload, appData, false);
          appData.students = payloadToPush.students;
          appData.grades = payloadToPush.grades;
          appData.subjectDetails = payloadToPush.subjectDetails;
          if (typeof saveCurrentProfile === 'function') saveCurrentProfile();
        }
      }
    }

    payloadToPush._tenantCode = fullKey;
    appData._tenantCode = fullKey;
    if (typeof buildCloudSecurityMeta === 'function') {
      payloadToPush._security = buildCloudSecurityMeta(remotePayload, pinHash, remoteUpdatedBy, remoteUpdatedAt);
    }
    const registeredTeachers = Object.values(payloadToPush._security?.users || {}).map(u => ({
      name: u.name,
      email: u.email,
      role: u.role,
      registeredAt: u.registeredAt || u.lastLoginAt
    }));
    payloadToPush = { _registered_teachers: registeredTeachers, ...payloadToPush };

    const nowIso = new Date().toISOString();
    const bodyObj = {
      school_code: fullKey,
      school_name: payloadToPush?.config?.schoolName || 'مدرسة ميزان',
      school_level: payloadToPush?.config?.schoolLevel || 'primary',
      payload: payloadToPush,
      updated_at: nowIso,
      updated_by: cloudConfig.userName || 'الكنترول'
    };

    let res = await fetch(`${baseUrl}/rest/v1/mizan_cloud_sync?on_conflict=school_code`, {
      method: 'POST',
      headers: {
        'apikey': cloudConfig.supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(bodyObj)
    });

    // إذا كانت سياسة RLS في Supabase تسمح بـ INSERT و SELECT فقط وتمنع UPDATE، نحفظ التحديث كإصدار سحابي جديد (Append-Only)
    if (!res.ok && (res.status === 401 || res.status === 403 || res.status === 409)) {
      const versionedBody = { ...bodyObj, school_code: `${fullKey}__v${Date.now()}` };
      res = await fetch(`${baseUrl}/rest/v1/mizan_cloud_sync`, {
        method: 'POST',
        headers: {
          'apikey': cloudConfig.supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(versionedBody)
      });
    }

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
    const url = `${cloudConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/mizan_cloud_sync?school_code=ilike.${encodeURIComponent(fullKey + '*')}&order=updated_at.desc&select=*&limit=1`;
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
    const incomingData = cloudRecord.payload;
    const remotePinHash = incomingData?._security?.pinHash || '';

    if (remotePinHash && remotePinHash !== '' && remotePinHash !== pinHash) {
      updateCloudUiBadge('locked_pin', '🔒 هذا السجل محمي برمز سري (PIN). يرجى إدخال الرمز الصحيح في إعدادات السحابة.');
      if (!silent) {
        openCloudSyncModal();
        if (typeof showToast === 'function') showToast('🔒 يرجى إدخال الرمز السري للسحابة (PIN) الخاص بالمدرسة للوصول للبيانات.', 'warning');
      }
      return false;
    }

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
      appData._security = merged._security || incomingData._security || appData._security || {};
      if (appData._security.users) {
        window._activeSchoolUsersMap = { ...appData._security.users, ...(window._activeSchoolUsersMap || {}) };
      }

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
  if (typeof getActiveAuthSession === 'function' && !getActiveAuthSession()) return;
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
    const url = `${cloudConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/mizan_cloud_sync?school_code=ilike.${encodeURIComponent(fullKey + '*')}&order=updated_at.desc&select=updated_at,updated_by&limit=1`;
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
  if (typeof getActiveAuthSession === 'function' && !getActiveAuthSession()) return;
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

  if (typeof renderSavedSchoolsSwitcher === 'function') renderSavedSchoolsSwitcher();
  if (typeof renderCloudRegisteredUsersList === 'function') renderCloudRegisteredUsersList();
  if (typeof loadCloudBackupsList === 'function') loadCloudBackupsList();
}

function closeCloudSyncModal() {
  const modal = document.getElementById('cloudSyncModal');
  if (modal) modal.classList.add('hidden');
}

async function saveCloudSettingsFromModal() {
  const oldCode = (cloudConfig.schoolCode || 'MIZAN-2026').trim().toUpperCase();
  const newCode = (document.getElementById('cloudInputSchoolCode')?.value || 'MIZAN-2026').trim().toUpperCase().replace(/\s+/g, '-');
  const newPin = (document.getElementById('cloudInputPin')?.value || '').trim();

  cloudConfig.supabaseUrl = (document.getElementById('cloudInputUrl')?.value || '').trim();
  cloudConfig.supabaseKey = (document.getElementById('cloudInputKey')?.value || '').trim();
  cloudConfig.userName = (document.getElementById('cloudInputUserName')?.value || 'الكنترول').trim();
  cloudConfig.enabled = !!document.getElementById('cloudInputEnabled')?.checked;

  if (newCode !== oldCode && typeof switchActiveSchoolCode === 'function') {
    await switchActiveSchoolCode(newCode, '', newPin);
  } else {
    cloudConfig.schoolCode = newCode;
    cloudConfig.secretPin = newPin;
    saveCloudConfig();
    if (typeof registerCurrentSchoolInList === 'function') registerCurrentSchoolInList();
    if (cloudConfig.enabled) await pullFromCloud(false);
    else updateCloudUiBadge('offline');
  }
  closeCloudSyncModal();
}

function initCloudSyncEngine() {
  loadCloudConfig();
  if (typeof applyCloudUrlParams === 'function') applyCloudUrlParams();
  appData._tenantCode = getFullSchoolCloudKey();

  window.addEventListener('online', () => {
    if (typeof getActiveAuthSession === 'function' && !getActiveAuthSession()) return;
    if (pendingOfflinePush) pushToCloud(false);
    else checkCloudForUpdates();
  });
  window.addEventListener('offline', () => updateCloudUiBadge('offline'));

  if (cloudConfig.enabled) {
    setTimeout(() => {
      if (typeof getActiveAuthSession !== 'function' || getActiveAuthSession()) pullFromCloud(true);
    }, 800);
    if (cloudPollInterval) clearInterval(cloudPollInterval);
    cloudPollInterval = setInterval(checkCloudForUpdates, 8000);
  } else {
    updateCloudUiBadge('offline');
  }
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
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(sql).then(() => alert('✅ تم نسخ كود SQL بنجاح!\n\n1. افتح مشروع مدرستي في لوحة Supabase.\n2. ادخل على (SQL Editor).\n3. الصق الكود واضغط (RUN).\nوسيعمل حفظ درجات ميزان تلقائياً!')).catch(() => prompt('انسخ كود SQL أدناه يدوياً:', sql));
  } else {
    prompt('انسخ كود SQL أدناه يدوياً:', sql);
  }
}

window.getActiveSchoolCode = () => (cloudConfig.schoolCode || 'SCH-1').trim().toUpperCase().replace(/\s+/g, '-');
window.loadCloudConfig = loadCloudConfig;
window.pushToCloud = pushToCloud;
window.pullFromCloud = pullFromCloud;
window.scheduleCloudPush = scheduleCloudPush;
window.openCloudSyncModal = openCloudSyncModal;
window.closeCloudSyncModal = closeCloudSyncModal;
window.saveCloudSettingsFromModal = saveCloudSettingsFromModal;
window.copyCloudSetupSql = copyCloudSetupSql;
window.initCloudSyncEngine = initCloudSyncEngine;


/* --- Start of authGate.js --- */
// وحدة بوابة تسجيل الدخول الموحدة للمدارس والأساتذة (Unified Supabase Auth Gate)
// متطابقة 100% مع تطبيق مدرستي بنظام الحسابات السحابي الرسمي وعزل المدارس الصارم

const AUTH_SESSION_KEY = 'MIZAN_VERIFIED_AUTH_SESSION_V2';
const SYS_TEACHER_SCHOOL_PREFIX = '__SYS_TEACHER_SCHOOL__:';

function getActiveAuthSession() {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveActiveAuthSession(sessionObj, remember = true) {
  try {
    const str = JSON.stringify(sessionObj);
    sessionStorage.setItem(AUTH_SESSION_KEY, str);
    if (remember) localStorage.setItem(AUTH_SESSION_KEY, str);
    else localStorage.removeItem(AUTH_SESSION_KEY);
  } catch (e) {}
}

function clearActiveAuthSession() {
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem('MIZAN_ACTIVE_AUTH_SESSION_2026');
    sessionStorage.removeItem('MIZAN_ACTIVE_AUTH_SESSION_2026');
  } catch (e) {}
}

function toggleAuthPasswordVisibility() {
  const inp = document.getElementById('authInputPassword');
  const icon = document.getElementById('authPassEyeIcon');
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    if (icon) icon.className = 'fa-solid fa-eye-slash';
  } else {
    inp.type = 'password';
    if (icon) icon.className = 'fa-solid fa-eye';
  }
}

function setAuthErrorMsg(msg, isSuccess = false) {
  const box = document.getElementById('authGateErrorBox');
  if (!box) return;
  if (!msg) {
    box.classList.add('hidden');
    box.innerText = '';
    return;
  }
  box.classList.remove('hidden');
  box.className = isSuccess
    ? 'p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold text-center leading-relaxed'
    : 'p-3 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-bold text-center leading-relaxed';
  box.innerText = msg;
}

// 1. التحقق من كود المدرسة من جدول schools في Supabase
async function fetchSchoolFromSupabase(schoolCodeRaw) {
  const cleanCode = String(schoolCodeRaw || '').trim().replace(/\s+/g, '');
  if (!cleanCode) return null;

  const baseUrl = (cloudConfig.supabaseUrl || '').replace(/\/$/, '');
  const url = `${baseUrl}/rest/v1/schools?school_code=ilike.${encodeURIComponent(cleanCode)}&select=id,name,school_code&limit=1`;
  const res = await fetch(url, {
    headers: {
      'apikey': cloudConfig.supabaseKey,
      'Authorization': `Bearer ${cloudConfig.supabaseKey}`
    }
  });

  if (!res.ok) throw new Error('SCHOOL_QUERY_ERROR');
  const rows = await res.json();
  return (Array.isArray(rows) && rows.length > 0) ? rows[0] : null;
}

// 2. تسجيل دخول الأستاذ عبر محرك المصادقة السحابي الرسمي Supabase Auth
async function loginTeacherWithSupabase(email, password) {
  const baseUrl = (cloudConfig.supabaseUrl || '').replace(/\/$/, '');
  const authUrl = `${baseUrl}/auth/v1/token?grant_type=password`;

  const res = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'apikey': cloudConfig.supabaseKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password: password.trim()
    })
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error_description || data.msg || data.message || '';
    if (errorMsg.includes('Invalid login credentials') || errorMsg.includes('invalid_grant')) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات أو استخدام خيار نسيت كلمة المرور.');
    }
    throw new Error(errorMsg || 'فشل تسجيل الدخول من خادم المصادقة.');
  }

  return data;
}

// 3. التحقق من عزل المدارس وربط الأستاذ بالمدرسة (بما يطابق تطبيق مدرستي)
async function verifyAndBindTeacherSchool(user, accessToken, school, cleanEmail) {
  let boundSchoolId = user?.user_metadata?.school_id;
  let boundSchoolCode = user?.user_metadata?.school_code;
  let boundSchoolName = user?.user_metadata?.school_name;

  // فحص سجل ربط الأساتذة في جدول announcements كنسخة احتياطية
  const baseUrl = (cloudConfig.supabaseUrl || '').replace(/\/$/, '');
  const sysTitle = `${SYS_TEACHER_SCHOOL_PREFIX}${cleanEmail}`;
  try {
    const checkUrl = `${baseUrl}/rest/v1/announcements?title=eq.${encodeURIComponent(sysTitle)}&order=created_at.desc&select=content&limit=1`;
    const annRes = await fetch(checkUrl, {
      headers: {
        'apikey': cloudConfig.supabaseKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (annRes.ok) {
      const rows = await annRes.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0]?.content) {
        const parsed = JSON.parse(rows[0].content);
        boundSchoolId = boundSchoolId || parsed.school_id;
        boundSchoolCode = boundSchoolCode || parsed.school_code;
        boundSchoolName = boundSchoolName || parsed.school_name;
      }
    }
  } catch (e) {}

  // حظر الدخول إذا كان حساب الأستاذ مسجلاً ومقيداً بمدرسة أخرى
  if (boundSchoolId && boundSchoolId !== school.id) {
    const other = boundSchoolName || boundSchoolCode || 'مدرسة أخرى';
    throw new Error(`عذراً، حساب الأستاذ هذا تابع لـ (${other}) ولا يمكنه الدخول إلى (${school.name})!`);
  }
  if (boundSchoolCode && boundSchoolCode.toLowerCase() !== school.school_code.toLowerCase()) {
    const other = boundSchoolName || boundSchoolCode;
    throw new Error(`عذراً، حساب الأستاذ هذا تابع لـ (${other}) ولا يمكنه الدخول إلى (${school.name})!`);
  }

  // إذا لم يكن الحساب مقيداً بعد، نقيده تلقائياً بهذه المدرسة
  if (!boundSchoolId) {
    try {
      await fetch(`${baseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'apikey': cloudConfig.supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            school_id: school.id,
            school_code: school.school_code,
            school_name: school.name
          }
        })
      });

      const randomId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'mizan_' + Date.now();

      await fetch(`${baseUrl}/rest/v1/announcements`, {
        method: 'POST',
        headers: {
          'apikey': cloudConfig.supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          id: randomId,
          school_id: school.id,
          title: sysTitle,
          content: JSON.stringify({
            email: cleanEmail,
            school_id: school.id,
            school_code: school.school_code,
            school_name: school.name
          }),
          created_at: new Date().toISOString(),
          priority: false,
          is_deleted: false
        })
      });
    } catch (_) {}
  }
}

// 4. معالجة نموذج تسجيل الدخول الموحد
async function handleAuthGateSubmit(event) {
  if (event) event.preventDefault();

  const schoolCodeRaw = (document.getElementById('authInputSchoolCode')?.value || '').trim();
  const emailRaw = (document.getElementById('authInputEmail')?.value || '').trim().toLowerCase();
  const passwordRaw = (document.getElementById('authInputPassword')?.value || '').trim();
  const rememberMe = !!document.getElementById('authInputRemember')?.checked;

  if (!schoolCodeRaw) {
    setAuthErrorMsg('⚠️ يرجى إدخال كود المدرسة (مثال: SCH-1 أو SCH-2 أو SCH-1234).');
    return;
  }
  if (!emailRaw || !emailRaw.includes('@')) {
    setAuthErrorMsg('⚠️ يرجى إدخال بريد إلكتروني صحيح للأستاذ.');
    return;
  }
  if (!passwordRaw) {
    setAuthErrorMsg('⚠️ يرجى إدخال كلمة المرور.');
    return;
  }

  if (!navigator.onLine || !cloudConfig.supabaseUrl || !cloudConfig.supabaseKey) {
    setAuthErrorMsg('⚠️ يلزم الاتصال بالإنترنت للتحقق من بيانات الدخول في خادم السحابة.');
    return;
  }

  const btn = document.getElementById('authSubmitBtn');
  if (btn) btn.disabled = true;
  setAuthErrorMsg('🔄 جاري التحقق من كود المدرسة وحساب الأستاذ في Supabase...', true);

  try {
    // أ. التحقق من كود المدرسة
    const school = await fetchSchoolFromSupabase(schoolCodeRaw);
    if (!school) {
      setAuthErrorMsg(`❌ كود المدرسة (${schoolCodeRaw}) غير مسجل في السحابة! تأكد من الكود المعتمد في جدول المدارس.`);
      if (btn) btn.disabled = false;
      return;
    }

    // ب. مصادقة حساب الأستاذ عبر Supabase Auth
    const authData = await loginTeacherWithSupabase(emailRaw, passwordRaw);
    const user = authData.user;
    const accessToken = authData.access_token;
    const refreshToken = authData.refresh_token;

    // ج. التحقق من قيود المدرسة وعزل البيانات
    await verifyAndBindTeacherSchool(user, accessToken, school, emailRaw);

    // د. إعداد الجلسة وبيانات النظام
    const displayTeacherName = user?.user_metadata?.name || user?.user_metadata?.full_name || emailRaw.split('@')[0];
    const userRole = user?.user_metadata?.role || 'معلم المادة';

    cloudConfig.schoolCode = school.school_code;
    cloudConfig.fullSchoolKey = school.school_code;
    cloudConfig.userName = `${displayTeacherName} (${emailRaw})`;
    cloudConfig.enabled = true;
    saveCloudConfig();

    if (school.name && (!appData.config.schoolName || appData.config.schoolName === 'مدرسة ميزان النموذجية')) {
      appData.config.schoolName = school.name;
      if (typeof syncStudentsWithSchoolGenderPolicy === 'function') syncStudentsWithSchoolGenderPolicy(true);
      if (typeof syncConfigUI === 'function') syncConfigUI();
    }

    const sessionObj = {
      schoolCode: school.school_code,
      schoolId: school.id,
      schoolName: school.name,
      email: emailRaw,
      teacherName: displayTeacherName,
      role: userRole,
      accessToken: accessToken,
      refreshToken: refreshToken,
      loggedInAt: new Date().toISOString()
    };

    saveActiveAuthSession(sessionObj, rememberMe);
    updateHeaderAuthBadge(sessionObj);
    hideAuthGateOverlay();

    if (typeof showToast === 'function') {
      showToast(`👋 أهلاً بك يا أستاذ (${displayTeacherName}) في إدارة: ${school.name}`, 'success');
    }

    // جلب أحدث شيتات ميزان لهذه المدرسة
    if (typeof pullFromCloud === 'function') {
      setTimeout(() => pullFromCloud(true), 400);
    }
  } catch (err) {
    const cleanMsg = (err.message || 'تعذر التحقق من الحساب.').replace('Error: ', '');
    setAuthErrorMsg(`❌ ${cleanMsg}`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// 5. استعادة كلمة المرور وإرسال رابط التعيين للبريد الرسمي للأستاذ
async function requestPasswordReset() {
  const emailInput = document.getElementById('authInputEmail');
  let email = (emailInput?.value || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    email = prompt('📧 أدخل البريد الإلكتروني الخاص بحسابك لتلقي رابط إعادة تعيين كلمة المرور:');
  }

  if (!email || !email.includes('@')) {
    alert('يرجى كتابة بريد إلكتروني صحيح.');
    return;
  }

  setAuthErrorMsg('🔄 جاري إرسال رابط تعيين كلمة المرور إلى بريدك...', true);

  try {
    const baseUrl = (cloudConfig.supabaseUrl || '').replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'apikey': cloudConfig.supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });

    if (res.ok) {
      setAuthErrorMsg(`📩 تم إرسال رابط تعيين كلمة المرور إلى (${email}).`, true);
      alert(`📩 تم إرسال رابط إعادة تعيين كلمة المرور إلى:\n${email}\n\nيرجى مراجعة بريدك الإلكتروني (الوارد أو الرسائل غير المرغوب فيها Spam) والضغط على الرابط لتحديد كلمة مرورك الجديدة.`);
    } else {
      const errData = await res.json();
      setAuthErrorMsg(`⚠️ تعذر الإرسال: ${errData.msg || errData.message || 'تأكد من صحة البريد'}`);
    }
  } catch (e) {
    setAuthErrorMsg('⚠️ حدث خطأ في الاتصال بالسيرفر لإرسال الرابط.');
  }
}

function updateHeaderAuthBadge(sessionObj) {
  const badge = document.getElementById('headerAuthUserBadge');
  const codeSpan = document.getElementById('headerAuthSchoolCode');
  const emailSpan = document.getElementById('headerAuthTeacherEmail');
  if (!sessionObj) {
    if (badge) badge.classList.add('hidden');
    return;
  }
  if (badge) badge.classList.remove('hidden');
  if (codeSpan) codeSpan.innerText = sessionObj.schoolCode || '';
  if (emailSpan) emailSpan.innerText = sessionObj.teacherName || sessionObj.email || '';
}

function showAuthGateOverlay() {
  const overlay = document.getElementById('authGateOverlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
}

function hideAuthGateOverlay() {
  const overlay = document.getElementById('authGateOverlay');
  if (overlay) overlay.classList.add('hidden');
}

function logoutFromMizan() {
  if (!confirm('🚪 هل تريد تسجيل الخروج من حساب الأستاذ والعودة إلى نافذة تسجيل الدخول؟')) return;
  clearActiveAuthSession();
  const passInp = document.getElementById('authInputPassword');
  if (passInp) passInp.value = '';
  setAuthErrorMsg('');
  showAuthGateOverlay();
}

// 6. التحقق التلقائي عند بدء التشغيل مع دعم أوفلاين الصارم
async function initAuthGateOnBoot() {
  const session = getActiveAuthSession();
  const urlParams = new URLSearchParams(window.location.search);
  const urlCloudCode = urlParams.get('cloud');

  if (urlCloudCode) {
    const codeInp = document.getElementById('authInputSchoolCode');
    if (codeInp) codeInp.value = urlCloudCode.trim().toUpperCase().replace(/\s+/g, '');
  }

  if (session && session.schoolCode && session.email && (!urlCloudCode || urlCloudCode.toUpperCase() === session.schoolCode.toUpperCase())) {
    cloudConfig.schoolCode = session.schoolCode;
    cloudConfig.fullSchoolKey = session.schoolCode;
    cloudConfig.userName = `${session.teacherName || session.email} (${session.email})`;
    updateHeaderAuthBadge(session);
    hideAuthGateOverlay();

    // التحقق بالخلفية إذا كان هناك إنترنت وتجديد التوكن
    if (navigator.onLine && cloudConfig.supabaseUrl && cloudConfig.supabaseKey && session.accessToken) {
      try {
        const baseUrl = cloudConfig.supabaseUrl.replace(/\/$/, '');
        const verifyRes = await fetch(`${baseUrl}/auth/v1/user`, {
          headers: {
            'apikey': cloudConfig.supabaseKey,
            'Authorization': `Bearer ${session.accessToken}`
          }
        });

        if (!verifyRes.ok && session.refreshToken) {
          // محاولة تجديد الجلسة بالـ refreshToken
          const refreshRes = await fetch(`${baseUrl}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: {
              'apikey': cloudConfig.supabaseKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: session.refreshToken })
          });
          if (refreshRes.ok) {
            const freshData = await refreshRes.json();
            session.accessToken = freshData.access_token;
            session.refreshToken = freshData.refresh_token;
            saveActiveAuthSession(session, true);
          } else {
            clearActiveAuthSession();
            updateHeaderAuthBadge(null);
            showAuthGateOverlay();
            setAuthErrorMsg('⚠️ انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.');
          }
        }
      } catch (e) {}
    }
  } else {
    showAuthGateOverlay();
  }
}

window.getActiveAuthSession = getActiveAuthSession;
window.toggleAuthPasswordVisibility = toggleAuthPasswordVisibility;
window.handleAuthGateSubmit = handleAuthGateSubmit;
window.requestPasswordReset = requestPasswordReset;
window.showAuthGateOverlay = showAuthGateOverlay;
window.hideAuthGateOverlay = hideAuthGateOverlay;
window.logoutFromMizan = logoutFromMizan;
window.initAuthGateOnBoot = initAuthGateOnBoot;


/* --- Start of app.js (Orchestrator) --- */
// المنسق العام لتشغيل النظام (Bootstrap Orchestrator)
// الميزانية القصوى: 80 سطر (صارم)

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-amber-500', 'text-slate-900', 'font-bold');
    btn.classList.add('text-indigo-100', 'hover:bg-indigo-800');
  });

  const target = document.getElementById(tabId);
  if (target) target.classList.remove('hidden');

  const activeBtn = document.getElementById('btn-' + tabId);
  if (activeBtn) {
    activeBtn.classList.remove('text-indigo-100', 'hover:bg-indigo-800');
    activeBtn.classList.add('bg-amber-500', 'text-slate-900', 'font-bold');
  }

  if (tabId === 'stats-tab') {
    if (typeof renderStatsTable === 'function') renderStatsTable();
    if (typeof renderAcademicAnalytics === 'function') renderAcademicAnalytics();
  }
  if (tabId === 'grades-tab' && typeof renderGradesSheet === 'function') renderGradesSheet();
  if (tabId === 'docs-tab' && typeof renderOfficialDocsView === 'function') renderOfficialDocsView();
  if (tabId === 'rooms-tab') {
    if (typeof renderRoomsSettings === 'function') renderRoomsSettings();
    if (typeof distributeStudentsToRooms === 'function') distributeStudentsToRooms();
  }
  if (tabId === 'students-tab' && typeof renderStudentsTable === 'function') renderStudentsTable();
}

function updateDashboardCounts() {
  const total = (appData.students || []).length;
  const male = (appData.students || []).filter(s => s.gender === 'ذكر').length;
  const female = (appData.students || []).filter(s => s.gender === 'أنثى').length;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setEl('dashTotalStudents', total);
  setEl('dashMaleStudents', male);
  setEl('dashFemaleStudents', female);
  setEl('dashRoomsCount', (appData.rooms || []).length);
}

function renderAll() {
  if (typeof renderStudentsTable === 'function') renderStudentsTable();
  if (typeof renderStatsTable === 'function') renderStatsTable();
  if (typeof renderGradesSheet === 'function') renderGradesSheet();
  if (typeof renderRoomsSettings === 'function') renderRoomsSettings();
  if (typeof distributeStudentsToRooms === 'function') distributeStudentsToRooms();
  if (typeof renderAcademicAnalytics === 'function') renderAcademicAnalytics();
  if (typeof applyLockUiState === 'function') applyLockUiState();
  if (typeof updateUndoButtonState === 'function') updateUndoButtonState();
  updateDashboardCounts();
}

window.addEventListener('DOMContentLoaded', () => {
  if (typeof loadData === 'function') loadData();
  if (typeof applyLockUiState === 'function') applyLockUiState();
  if (typeof updateUndoButtonState === 'function') updateUndoButtonState();
  if (typeof initAuthGateOnBoot === 'function') initAuthGateOnBoot();
  if (typeof initCloudSyncEngine === 'function') initCloudSyncEngine();
});

window.switchTab = switchTab;
window.updateDashboardCounts = updateDashboardCounts;
window.renderAll = renderAll;