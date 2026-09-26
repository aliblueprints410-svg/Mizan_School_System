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
