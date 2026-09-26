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
