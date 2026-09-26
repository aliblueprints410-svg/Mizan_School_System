/**
 * officialDocs.js - حزمة الوثائق المدرسية الرسمية التلقائية
 * مسؤولية الوحدة: توليد وطباعة الوثائق المدرسية المعتمدة رسمياً:
 * 1. تأييد استمرار بالدوام (لمن يهمه الأمر).
 * 2. وثيقة نقل طالب مع بيان الموقف الدراسي.
 * 3. بطاقات الاشتراك بالامتحانات وأرقام الجلوس (Exam Hall Passes).
 */

let activeDocType = 'enrollment'; // enrollment | transfer | examPass

/**
 * تبديل نوع الوثيقة المعروضة في لوحة الوثائق
 */
function switchDocType(type) {
  activeDocType = type;
  document.querySelectorAll('.doc-nav-btn').forEach(btn => {
    btn.classList.remove('bg-indigo-600', 'text-white');
    btn.classList.add('bg-slate-100', 'text-slate-700');
  });
  const currentBtn = document.getElementById(`btn-doc-${type}`);
  if (currentBtn) {
    currentBtn.classList.add('bg-indigo-600', 'text-white');
    currentBtn.classList.remove('bg-slate-100', 'text-slate-700');
  }
  renderOfficialDocsView();
}

/**
 * تحديث وعرض محتوى الوثيقة المختارة
 */
function renderOfficialDocsView() {
  const container = document.getElementById('officialDocPreviewContainer');
  if (!container) return;

  const students = (window.appData && window.appData.students) ? window.appData.students : [];
  if (students.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
        <i class="fa-solid fa-folder-open text-4xl text-slate-300 mb-3"></i>
        <h4 class="font-bold text-slate-700 text-lg">لا يوجد طلبة مسجلين في النظام</h4>
        <p class="text-xs text-slate-500 mt-1">يرجى إدخال أو استيراد الطلبة أولاً لتوليد الوثائق الرسمية لهم.</p>
      </div>
    `;
    return;
  }

  const yearInput = document.getElementById('docSchoolYearInput');
  if (yearInput && !yearInput.value) {
    yearInput.value = window.appData?.config?.schoolYear || '2026 - 2027 م';
  }
  const dateInput = document.getElementById('docIssueDateInput');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // ملء قائمة اختيار الطالب إذا كانت فارغة أو تغير الطلبة
  populateStudentSelector(students);

  const selectedStudentId = document.getElementById('docStudentSelect')?.value || students[0]?.id;
  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0];

  if (activeDocType === 'enrollment') {
    renderEnrollmentDoc(currentStudent, container);
  } else if (activeDocType === 'transfer') {
    renderTransferDoc(currentStudent, container);
  } else if (activeDocType === 'examPass') {
    renderExamPassDoc(students, container);
  }
}

function onDocSchoolYearChange(val) {
  if (window.appData && window.appData.config) {
    window.appData.config.schoolYear = val;
    const cfgEl = document.getElementById('cfgSchoolYear');
    if (cfgEl) cfgEl.value = val;
    if (typeof saveData === 'function') saveData();
  }
  renderOfficialDocsView();
}

/**
 * ملء قائمة اختيار الطالب للوثائق الفردية
 */
function populateStudentSelector(students) {
  const sel = document.getElementById('docStudentSelect');
  if (!sel) return;
  const curVal = sel.value;
  sel.innerHTML = students.map(s => `
    <option value="${s.id}" ${s.id === curVal ? 'selected' : ''}>
      ${escapeHtml(s.name)} - (${escapeHtml(s.grade)} / ${escapeHtml(s.section)})
    </option>
  `).join('');
}

/**
 * 1. وثيقة تأييد استمرار بالدوام
 */
function renderEnrollmentDoc(student, container) {
  const cfg = window.appData?.config || {};
  const schoolName = cfg.schoolName ? `مدرسة ${cfg.schoolName}` : 'إدارة المدرسة';
  const schoolYear = document.getElementById('docSchoolYearInput')?.value || cfg.schoolYear || '2026 - 2027 م';
  const rawDate = document.getElementById('docIssueDateInput')?.value;
  const today = rawDate ? new Date(rawDate).toLocaleDateString('ar-IQ') : new Date().toLocaleDateString('ar-IQ');
  const refNum = 'م / ' + (new Date().getFullYear()) + ' / ' + (Math.abs(hashString(student.id)) % 899 + 100);
  const destination = document.getElementById('docCustomDestination')?.value || 'إلى / من يهمه الأمر المحترم';

  container.innerHTML = `
    <div class="bg-white p-8 md:p-12 rounded-xl shadow-lg border border-slate-200 max-w-4xl mx-auto print-area doc-a4">
      <!-- ترويسة رسمية -->
      <div class="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
        <div class="text-right text-xs leading-relaxed font-bold text-slate-800">
          <div>جمهورية العراق</div>
          <div>وزارة التربية</div>
          <div>المديرية العامة للتربية</div>
          <div class="text-indigo-900">${escapeHtml(schoolName)}</div>
        </div>
        <div class="text-center">
          <i class="fa-solid fa-stamp text-4xl text-amber-600 mb-1 opacity-80"></i>
          <h2 class="text-xl font-black text-slate-900">تأييد استمرار بالدوام</h2>
          <span class="text-xs font-mono text-slate-500">رقم الصادر: ${refNum}</span>
        </div>
        <div class="text-left text-xs leading-relaxed font-bold text-slate-800">
          <div>التاريخ: ${today}</div>
          <div>العام الدراسي: ${escapeHtml(schoolYear)}</div>
          <div>المرحلة: ${escapeHtml(student.grade)}</div>
        </div>
      </div>

      <!-- محتوى التأييد -->
      <div class="py-6 space-y-6 text-base text-slate-900 leading-loose">
        <h3 class="text-lg font-bold text-slate-800">${escapeHtml(destination)}</h3>
        <p class="text-justify text-base">
          نؤيد لكم بأن الطالب/ـة: <span class="font-black text-indigo-950 text-lg border-b border-dashed border-slate-900 px-2">${escapeHtml(student.name)}</span>
          المسجل/ـة برقم قيد: <span class="font-bold">(${escapeHtml(student.id)})</span>، هو أحد طلبة مدرستنا في الصف 
          <span class="font-bold underline">${escapeHtml(student.grade)}</span> (شعبة: <span class="font-bold">${escapeHtml(student.section)}</span>)،
          وهو <strong>مستمر/ة بالدوام الرسمي</strong> للعام الدراسي <span class="font-bold">(${escapeHtml(schoolYear)})</span> 
          وحسن السيرة والسلوك حتى تاريخ صدور هذا الكتاب.
        </p>
        <p class="text-sm text-slate-700">
          وقد زُوّد بهذا التأييد بناءً على طلبه لتقديمه إلى جهتكم الموقرة دون تحمل إدارتنا أي تبعات مالية أو قانونية خارج نطاق واجبه المدرسي.
        </p>
      </div>

      <!-- التواقيع والباركود -->
      <div class="mt-12 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-800">
        <div>
          <p class="mb-8">معاون / منظم السجل</p>
          <p class="font-black">${escapeHtml(cfg.secretary || '...........................')}</p>
        </div>
        <div class="flex flex-col items-center justify-center">
          <div class="w-16 h-16 border border-dashed border-slate-400 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">
            ختم المدرسة
          </div>
          <span class="text-[10px] text-slate-400 mt-1 font-mono">${student.id}</span>
        </div>
        <div>
          <p class="mb-8">مدير / مديرة المدرسة</p>
          <p class="font-black">${escapeHtml(cfg.principal || '...........................')}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * 2. وثيقة نقل طالب
 */
function renderTransferDoc(student, container) {
  const cfg = window.appData?.config || {};
  const schoolName = cfg.schoolName ? `مدرسة ${cfg.schoolName}` : 'إدارة المدرسة';
  const schoolYear = document.getElementById('docSchoolYearInput')?.value || cfg.schoolYear || '2026 - 2027 م';
  const rawDate = document.getElementById('docIssueDateInput')?.value;
  const today = rawDate ? new Date(rawDate).toLocaleDateString('ar-IQ') : new Date().toLocaleDateString('ar-IQ');
  const targetSchool = document.getElementById('docTargetSchoolInput')?.value || 'مدرسة ...........................';

  container.innerHTML = `
    <div class="bg-white p-8 md:p-12 rounded-xl shadow-lg border border-slate-200 max-w-4xl mx-auto print-area doc-a4">
      <div class="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
        <div class="text-right text-xs font-bold leading-relaxed">
          <div>جمهورية العراق - وزارة التربية</div>
          <div class="text-indigo-900">${escapeHtml(schoolName)}</div>
        </div>
        <div class="text-center">
          <h2 class="text-xl font-black text-slate-900">استمارة وثيقة نقل طالب</h2>
          <span class="text-xs text-slate-500 font-mono">تاريخ الإصدار: ${today}</span>
        </div>
        <div class="text-left text-xs font-bold leading-relaxed">
          <div>العام الدراسي: ${escapeHtml(schoolYear)}</div>
        </div>
      </div>

      <div class="py-4 space-y-4 text-sm text-slate-900 leading-relaxed">
        <p class="font-bold text-base">إلى إدارة / <span class="border-b border-slate-800 px-2 text-indigo-900">${escapeHtml(targetSchool)}</span> المحترمون</p>
        <p>تحية طيبة وبعد،</p>
        <p>
          نرسل إليكم إضبارة ومعلومات التلميذ/ـة: <span class="font-black text-indigo-900 text-base px-2">${escapeHtml(student.name)}</span>
          المقيد في الصف <span class="font-bold">${escapeHtml(student.grade)}</span> (شعبة: ${escapeHtml(student.section)}).
        </p>
        <table class="w-full text-center border-collapse border border-slate-300 text-xs my-4">
          <thead class="bg-slate-100 font-bold">
            <tr>
              <th class="border border-slate-300 p-2">رقم القيد</th>
              <th class="border border-slate-300 p-2">الجنس</th>
              <th class="border border-slate-300 p-2">الموقف الدراسي</th>
              <th class="border border-slate-300 p-2">السلوك والمواظبة</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-slate-300 p-2 font-mono">${escapeHtml(student.id)}</td>
              <td class="border border-slate-300 p-2">${student.gender === 'أنثى' ? 'أنثى' : 'ذكر'}</td>
              <td class="border border-slate-300 p-2 text-emerald-800 font-bold">مستمر بالدوام (مؤهل للنقل)</td>
              <td class="border border-slate-300 p-2 text-indigo-900 font-bold">حسن السيرة والسلوك</td>
            </tr>
          </tbody>
        </table>
        <p class="text-xs text-slate-600">
          يرجى تزويدنا بكتاب استلام الإضبارة والمباشرة الرسمية للطفل لديكم في أقرب فرصة.
        </p>
      </div>

      <div class="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs font-bold">
        <div>
          <p class="mb-10">منظم الاستمارة</p>
          <p>${escapeHtml(cfg.secretary || '...........................')}</p>
        </div>
        <div>
          <p class="mb-10">مدير / مديرة المدرسة</p>
          <p>${escapeHtml(cfg.principal || '...........................')}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * 3. بطاقات الاشتراك بالامتحانات وقاعات الجلوس (Exam Hall Passes)
 */
function renderExamPassDoc(students, container) {
  const cfg = window.appData?.config || {};
  const schoolName = cfg.schoolName ? `مدرسة ${cfg.schoolName}` : 'إدارة المدرسة';
  const activeGrade = document.getElementById('docGradeFilterSelect')?.value || 'all';
  const filtered = activeGrade === 'all' ? students : students.filter(s => s.grade === activeGrade);

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between no-print bg-white p-3 rounded-lg border border-slate-200 text-xs">
        <span class="font-bold text-slate-700">عدد البطاقات الجاهزة للطباعة: ${filtered.length} بطاقة</span>
        <button onclick="window.print()" class="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700 flex items-center gap-1">
          <i class="fa-solid fa-print"></i> طباعة كافة البطاقات (4 لكل ورقة)
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
        ${filtered.map((s, idx) => `
          <div class="bg-white p-4 rounded-xl border-2 border-indigo-900 print:border-slate-800 shadow-sm relative overflow-hidden page-break-inside-avoid">
            <div class="flex items-center justify-between border-b pb-2 mb-2">
              <div class="text-right">
                <h4 class="font-black text-sm text-indigo-950">${escapeHtml(schoolName)}</h4>
                <span class="text-[10px] text-slate-500 font-bold">بطاقة الاشتراك بالامتحانات الرسمية</span>
              </div>
              <div class="w-10 h-10 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                صورة
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs mb-3">
              <div><span class="text-slate-500">اسم الطالب:</span> <strong class="text-slate-900">${escapeHtml(s.name)}</strong></div>
              <div><span class="text-slate-500">الصف والشعبة:</span> <strong>${escapeHtml(s.grade)} / ${escapeHtml(s.section)}</strong></div>
              <div><span class="text-slate-500">الرقم الامتحاني:</span> <strong class="font-mono text-indigo-700">${1000 + idx + 1}</strong></div>
              <div><span class="text-slate-500">رقم القيد:</span> <strong class="font-mono">${escapeHtml(s.id)}</strong></div>
            </div>

            <div class="bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <span>القاعة الامتحانية: <strong class="text-slate-900">قاعة رقم ${(idx % 4) + 1}</strong></span>
              <span class="font-mono text-[9px]">||||| | |||| ||| ${s.id}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// تصدير دوال الوحدة على window
window.switchDocType = switchDocType;
window.renderOfficialDocsView = renderOfficialDocsView;
window.onDocSchoolYearChange = onDocSchoolYearChange;
