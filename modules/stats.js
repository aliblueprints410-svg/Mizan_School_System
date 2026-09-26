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
