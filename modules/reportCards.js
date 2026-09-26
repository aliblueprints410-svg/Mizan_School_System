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
