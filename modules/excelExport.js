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

      const subjectMap = {
        'اسلامية': 'islamic', 'الاسلامية': 'islamic', 'التربية الاسلامية': 'islamic', 'التربية الإسلامية': 'islamic',
        'قراءة': 'reading', 'القراءة': 'reading',
        'عربي': 'arabic', 'العربية': 'arabic', 'اللغة العربية': 'arabic',
        'انكليزي': 'english', 'إنكليزي': 'english', 'انجليزي': 'english',
        'الانكليزية': 'english', 'الإنكليزية': 'english', 'الانجليزية': 'english', 'الإنجليزية': 'english',
        'اللغة الانكليزية': 'english', 'اللغة الإنكليزية': 'english',
        'اللغة الانجليزية': 'english', 'اللغة الإنجليزية': 'english',
        'رياضيات': 'math', 'الرياضيات': 'math',
        'علوم': 'science', 'العلوم': 'science',
        'اجتماعيات': 'social', 'الاجتماعيات': 'social',
        'اخلاقية': 'ethics', 'أخلاقية': 'ethics', 'الاخلاقية': 'ethics', 'الأخلاقية': 'ethics', 'التربية الاخلاقية': 'ethics', 'التربية الأخلاقية': 'ethics',
        'رياضة': 'sport', 'الرياضة': 'sport', 'التربية الرياضية': 'sport',
        'فنية': 'art', 'الفنية': 'art', 'التربية الفنية': 'art'
      };

      const detailFieldMap = {
        'يومي ف1': 'daily1', 'يومي 1': 'daily1', 'شهر1 ف1': 'm1', 'شهر 1 ف1': 'm1', 'شهر2 ف1': 'm2', 'شهر 2 ف1': 'm2',
        'نصف السنة': 'mid', 'درجة نصف السنة': 'mid',
        'يومي ف2': 'daily2', 'يومي 2': 'daily2', 'شهر1 ف2': 'm3', 'شهر 1 ف2': 'm3', 'شهر2 ف2': 'm4', 'شهر 2 ف2': 'm4',
        'آخر السنة': 'final', 'اخر السنة': 'final', 'الامتحان النهائي': 'final', 'درجة آخر السنة': 'final'
      };

      let headerRowIdx = -1, nameCol = -1, regCol = -1, gradeCol = -1;
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
          } else if (str.includes('الصف') || str === 'المرحلة') {
            gradeCol = cIdx;
          } else if (str.includes('القيد') || str.includes('التسلسل') || str === 'ت') {
            regCol = cIdx;
          } else if (forcedSubjectId && detailFieldMap[str]) {
            colToDetailField[cIdx] = detailFieldMap[str];
            headerRowIdx = r;
          } else if (forcedSubjectId && (str.includes('الدرجة النهائية') || str.includes('المعدل النهائي'))) {
            colToSubject[cIdx] = forcedSubjectId;
            headerRowIdx = r;
          } else if (subjectMap[str]) {
            colToSubject[cIdx] = subjectMap[str];
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

      if (nameCol === -1) nameCol = 1;

      // خرائط ذكية لمطابقة الطلاب بالاسم والصف الدراسي معاً لمنع أي تداخل
      const studentMapByGradeAndName = {};
      const studentMapByNameList = {};
      (appData.students || []).forEach(st => {
        const norm = typeof normalizeStudentName === 'function' ? normalizeStudentName(st.name) : String(st.name || '').trim();
        const gKey = String(st.grade || '1').trim();
        studentMapByGradeAndName[`${gKey}::${norm}`] = st;
        if (!studentMapByNameList[norm]) studentMapByNameList[norm] = [];
        studentMapByNameList[norm].push(st);
      });

      let updatedStudentsCount = 0, updatedMarksCount = 0;
      const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
      if (!appData.grades) appData.grades = {};
      if (!appData.subjectDetails) appData.subjectDetails = {};

      const currentActiveGrade = appData.config?.activeGrade || '1';

      for (let r = startRow; r < jsonRows.length; r++) {
        const row = jsonRows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        const rawName = nameCol !== -1 && row[nameCol] !== undefined ? String(row[nameCol]).trim() : '';
        if (!rawName || rawName.length < 3 || rawName.includes('اسم الطالب') || rawName.includes('إجمالي') || rawName.includes('ملخص')) continue;

        let rowGrade = '';
        if (gradeCol !== -1 && row[gradeCol] !== undefined) {
          const gStr = String(row[gradeCol]).trim();
          if (gStr.includes('أول') || gStr === '1') rowGrade = '1';
          else if (gStr.includes('ثاني') || gStr === '2') rowGrade = '2';
          else if (gStr.includes('ثالث') || gStr === '3') rowGrade = '3';
          else if (gStr.includes('رابع') || gStr === '4') rowGrade = '4';
          else if (gStr.includes('خامس') || gStr === '5') rowGrade = '5';
          else if (gStr.includes('سادس') || gStr === '6') rowGrade = '6';
        }

        const normName = typeof normalizeStudentName === 'function' ? normalizeStudentName(rawName) : rawName;
        let matchedStudent = null;

        // 1. المطابقة الدقيقة بالصف والاسم
        if (rowGrade && studentMapByGradeAndName[`${rowGrade}::${normName}`]) {
          matchedStudent = studentMapByGradeAndName[`${rowGrade}::${normName}`];
        }
        // 2. المطابقة بالصف النشط حالياً
        else if (studentMapByGradeAndName[`${currentActiveGrade}::${normName}`]) {
          matchedStudent = studentMapByGradeAndName[`${currentActiveGrade}::${normName}`];
        }
        // 3. المطابقة بقائمة الأسماء
        else if (studentMapByNameList[normName] && studentMapByNameList[normName].length > 0) {
          matchedStudent = rowGrade
            ? studentMapByNameList[normName].find(s => String(s.grade) === rowGrade) || studentMapByNameList[normName][0]
            : studentMapByNameList[normName].find(s => String(s.grade) === currentActiveGrade) || studentMapByNameList[normName][0];
        }
        // 4. مطابقة تقريبية بالاسم
        else {
          for (let k in studentMapByNameList) {
            if (k.startsWith(normName) || normName.startsWith(k)) {
              matchedStudent = studentMapByNameList[k][0];
              break;
            }
          }
        }

        if (!matchedStudent) continue;

        let stHasUpdate = false;
        if (!appData.grades[matchedStudent.id]) appData.grades[matchedStudent.id] = {};

        // تفاصيل المادة المفردة
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

        // تفريغ درجات كافة المواد
        const stGradeStr = String(matchedStudent.grade || '1');
        for (let colIdx in colToSubject) {
          let subId = colToSubject[colIdx];
          // تصحيح ذكي لمادة القراءة واللغة العربية حسب مرحلة الطالب
          if (['1', '2', '3'].includes(stGradeStr) && subId === 'arabic') subId = 'reading';
          if (['4', '5', '6'].includes(stGradeStr) && subId === 'reading') subId = 'arabic';

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
        if (typeof saveData === 'function') saveData();
        if (typeof renderGradesSheet === 'function') renderGradesSheet();
        if (typeof renderAll === 'function') renderAll();
        if (typeof renderSubjectDetailTable === 'function' && forcedSubjectId) renderSubjectDetailTable();
        if (typeof scheduleCloudPush === 'function') scheduleCloudPush();
        alert(`🎉 نجاح تام!\nتم استيراد وتحديث درجات (${updatedStudentsCount}) طالب بنجاح.\nإجمالي الدرجات المرصودة: (${updatedMarksCount}) درجة.`);
      } else {
        alert('⚠️ لم يتم العثور على طلبة مطابقين للأسماء أو الصفوف في الملف، يرجى التأكد من مطابقة أسماء الطلبة.');
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

