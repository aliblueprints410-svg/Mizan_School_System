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
  if (finalGrade !== null) appData.grades[studentId][normSub] = finalGrade;
  else delete appData.grades[studentId][normSub];

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
