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

