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

  const select = document.getElementById('gradeFilterSelect') || document.getElementById('modalGradeFilterSelect');
  const val = select ? select.value : '';
  const [gradeVal, secVal] = (val && val.includes('-')) ? val.split('-') : ['1', 'أ'];
  const lvl = appData.config?.schoolLevel || 'primary';
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
    rows.push(['رقم القيد', 'اسم الطالب', `درجة ${subInfo}`]);
    studs.forEach(s => {
      const curGrade = appData.grades?.[s.id]?.[targetSubjectId] ?? '';
      rows.push([s.reg, s.name, curGrade]);
    });
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
      subjectMap['اسلامية'] = 'islamic';
      subjectMap['التربية الاسلامية'] = 'islamic';
      subjectMap['الاسلامية'] = 'islamic';
      subjectMap['عربي'] = 'arabic';
      subjectMap['اللغة العربية'] = 'arabic';
      subjectMap['قراءة'] = 'arabic';
      subjectMap['القراءة'] = 'arabic';
      subjectMap['انكليزي'] = 'english';
      subjectMap['انجليزي'] = 'english';
      subjectMap['الانكليزية'] = 'english';
      subjectMap['اللغة الانكليزية'] = 'english';
      subjectMap['اللغة الإنجليزية'] = 'english';
      subjectMap['رياضيات'] = 'math';
      subjectMap['الرياضيات'] = 'math';
      subjectMap['علوم'] = 'science';
      subjectMap['العلوم'] = 'science';
      subjectMap['اجتماعيات'] = 'social';
      subjectMap['الاجتماعيات'] = 'social';
      subjectMap['اخلاقية'] = 'ethics';
      subjectMap['التربية الاخلاقية'] = 'ethics';
      subjectMap['رياضة'] = 'sport';
      subjectMap['فنية'] = 'art';

      let headerRowIdx = -1;
      let nameCol = -1;
      let regCol = -1;
      const colToSubject = {};

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

        if (nameCol !== -1 && (Object.keys(colToSubject).length > 0 || forcedSubjectId)) break;
      }

      if (nameCol === -1 && regCol === -1) {
        nameCol = 1;
        regCol = 0;
      }

      if (forcedSubjectId && Object.keys(colToSubject).length === 0) {
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

      const studentMapByName = {};
      const studentMapByReg = {};
      (appData.students || []).forEach(st => {
        studentMapByName[normalizeStudentName(st.name)] = st;
        if (st.reg) studentMapByReg[String(st.reg).trim()] = st;
      });

      let updatedStudentsCount = 0;
      let updatedMarksCount = 0;
      const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;

      if (!appData.grades) appData.grades = {};

      for (let r = startRow; r < jsonRows.length; r++) {
        const row = jsonRows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        let matchedStudent = null;

        if (regCol !== -1 && row[regCol] !== undefined) {
          const regStr = String(row[regCol]).trim();
          if (studentMapByReg[regStr]) matchedStudent = studentMapByReg[regStr];
        }

        if (!matchedStudent && nameCol !== -1 && row[nameCol]) {
          const rawName = String(row[nameCol]).trim();
          const normName = normalizeStudentName(rawName);
          if (studentMapByName[normName]) {
            matchedStudent = studentMapByName[normName];
          } else {
            for (let k in studentMapByName) {
              if (k.startsWith(normName) || normName.startsWith(k)) {
                matchedStudent = studentMapByName[k];
                break;
              }
            }
          }
        }

        if (!matchedStudent) continue;

        let stHasUpdate = false;
        if (!appData.grades[matchedStudent.id]) appData.grades[matchedStudent.id] = {};

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

