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
  name: 'م. علي محمد',
  telegram: 'https://t.me/Ali_Muhammed_410',
  whatsapp: 'https://wa.me/9647749509636'
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

