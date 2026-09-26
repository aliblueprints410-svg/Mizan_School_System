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
