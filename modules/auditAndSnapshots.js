/**
 * auditAndSnapshots.js - درع الأمان وسجل التدقيق ونقاط الاستعادة والتراجع الذكي
 * مسؤولية الوحدة: إدارة سجل التعديلات (Audit Trail)، أخذ لقطات تلقائية (Auto-Snapshots)،
 * وتوفير إمكانية التراجع الفوري (Undo) واستعادة أي نقطة زمنية سابقة بنقرة واحدة.
 */

const SNAPSHOTS_KEY = 'school_snapshots_v1';
const AUDIT_LOG_KEY = 'school_audit_log_v1';
const MAX_SNAPSHOTS = 10;
const MAX_AUDIT_LOGS = 50;

/**
 * أخذ لقطة تلقائية للنظام وحفظها في الذاكرة المحلية
 * @param {string} reason سبب أخذ اللقطة (مثال: قبل استيراد إكسل، قبل درجات القرار)
 */
function takeSnapshot(reason = 'تعديل بيانات') {
  try {
    if (!window.appData) return;
    const snapshots = getSnapshots();
    const newSnapshot = {
      id: 'snap_' + Date.now(),
      timestamp: new Date().toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'medium' }),
      reason: String(reason),
      data: JSON.parse(JSON.stringify(window.appData))
    };

    snapshots.unshift(newSnapshot);
    if (snapshots.length > MAX_SNAPSHOTS) {
      snapshots.pop();
    }
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    logAudit('نقطة استعادة', `تم حفظ لقطة أمان: ${reason}`);
    updateUndoButtonState();
  } catch (err) {
    console.warn('تعذر حفظ لقطة الأمان:', err);
  }
}

/**
 * جلب قائمة اللقطات المخزنة
 */
function getSnapshots() {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * التراجع الفوري عن آخر عملية (Undo)
 */
function undoLastAction() {
  if (window.isControlLocked && window.isControlLocked()) {
    showToast('⚠️ سجل الكنترول مشمع ومقفل! لا يمكن التراجع إلا بعد فك القفل.', 'warning');
    return;
  }

  const snapshots = getSnapshots();
  if (snapshots.length === 0) {
    showToast('لا توجد نقاط استعادة سابقة للتراجع عنها.', 'info');
    return;
  }

  const previousSnapshot = snapshots.shift(); // أخذ آخر لقطة
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));

  if (previousSnapshot && previousSnapshot.data) {
    window.appData = previousSnapshot.data;
    if (typeof window.saveData === 'function') window.saveData();
    if (typeof window.renderAll === 'function') window.renderAll();
    
    logAudit('تراجع ذكي', `تم التراجع بنجاح إلى: ${previousSnapshot.reason}`);
    showToast(`↩️ تم التراجع بنجاح إلى: (${previousSnapshot.reason})`, 'success');
    updateUndoButtonState();
  }
}

/**
 * استعادة لقطة محددة عبر الـ ID
 */
function restoreSnapshotById(snapId) {
  if (window.isControlLocked && window.isControlLocked()) {
    showToast('⚠️ سجل الكنترول مشمع ومقفل! لا يمكن الاستعادة إلا بعد فك القفل.', 'warning');
    return;
  }

  const snapshots = getSnapshots();
  const target = snapshots.find(s => s.id === snapId);
  if (!target) {
    showToast('لم يتم العثور على نقطة الاستعادة المطلوبة.', 'error');
    return;
  }

  if (!confirm(`هل أنت متأكد من العودة إلى نقطة الاستعادة:\n"${target.reason}"\nالمسجلة في: ${target.timestamp}؟`)) {
    return;
  }

  // حفظ لقطة احتياطية للوضع الحالي قبل الاستعادة
  takeSnapshot('لقطة أمان قبل استرجاع نقطة قديمة');

  window.appData = JSON.parse(JSON.stringify(target.data));
  if (typeof window.saveData === 'function') window.saveData();
  if (typeof window.renderAll === 'function') window.renderAll();

  logAudit('استعادة نقطة', `تم الرجوع لنقطة: ${target.reason} (${target.timestamp})`);
  showToast(`✅ تم استرجاع النظام بنجاح إلى تاريخ: ${target.timestamp}`, 'success');
  closeAuditModal();
}

/**
 * تسجيل حدث في سجل التدقيق (Audit Log)
 */
function logAudit(action, details) {
  try {
    const logs = getAuditLogs();
    const entry = {
      id: 'log_' + Date.now(),
      time: new Date().toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'medium' }),
      action: String(action),
      details: String(details)
    };
    logs.unshift(entry);
    if (logs.length > MAX_AUDIT_LOGS) logs.pop();
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn('تعذر تسجيل التدقيق:', e);
  }
}

/**
 * جلب سجل التدقيق
 */
function getAuditLogs() {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * مسح سجل التدقيق
 */
function clearAuditLogs() {
  if (confirm('هل ترغب في مسح سجل التدقيق؟')) {
    localStorage.removeItem(AUDIT_LOG_KEY);
    renderAuditLogsUi();
    showToast('تم إفراغ سجل التدقيق.', 'info');
  }
}

/**
 * تحديث حالة زر التراجع (تفعيل أو تعطيل)
 */
function updateUndoButtonState() {
  const btn = document.getElementById('btnQuickUndo');
  if (!btn) return;
  const count = getSnapshots().length;
  btn.title = count > 0 ? `تراجع عن آخر إجراء (تتوفر ${count} نقاط استعادة)` : 'لا توجد نقاط للتراجع حالياً';
  btn.classList.toggle('opacity-50', count === 0);
  btn.classList.toggle('cursor-not-allowed', count === 0);
}

/**
 * فتح نافذة سجل التدقيق ونقاط الأمان
 */
function openAuditModal() {
  const modal = document.getElementById('auditModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  renderAuditLogsUi();
  renderSnapshotsUi();
}

/**
 * إغلاق نافذة سجل التدقيق
 */
function closeAuditModal() {
  const modal = document.getElementById('auditModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * رسم قائمة نقاط الاستعادة في النافذة
 */
function renderSnapshotsUi() {
  const container = document.getElementById('snapshotsListContainer');
  if (!container) return;
  const snapshots = getSnapshots();

  if (snapshots.length === 0) {
    container.innerHTML = '<div class="text-center py-6 text-slate-400 text-sm">لا توجد نقاط استعادة محفوظة حتى الآن.</div>';
    return;
  }

  container.innerHTML = snapshots.map(s => `
    <div class="flex items-center justify-between p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 transition">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <div>
          <h4 class="font-bold text-slate-800 text-sm">${escapeHtml(s.reason)}</h4>
          <span class="text-xs text-slate-500 font-mono">${s.timestamp}</span>
        </div>
      </div>
      <button onclick="restoreSnapshotById('${s.id}')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm">
        <i class="fa-solid fa-rotate-right"></i> استعادة هذه النقطة
      </button>
    </div>
  `).join('');
}

/**
 * رسم سجل التدقيق في النافذة
 */
function renderAuditLogsUi() {
  const container = document.getElementById('auditLogsContainer');
  if (!container) return;
  const logs = getAuditLogs();

  if (logs.length === 0) {
    container.innerHTML = '<div class="text-center py-6 text-slate-400 text-sm">السجل فارغ.</div>';
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-right text-xs">
        <thead class="bg-slate-100 text-slate-600 border-b">
          <tr>
            <th class="p-2">الوقت والتاريخ</th>
            <th class="p-2">نوع الحدث</th>
            <th class="p-2">التفاصيل</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${logs.map(l => `
            <tr class="hover:bg-slate-50">
              <td class="p-2 font-mono text-slate-500 whitespace-nowrap">${l.time}</td>
              <td class="p-2"><span class="px-2 py-0.5 rounded font-bold ${l.action.includes('تراجع') ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}">${escapeHtml(l.action)}</span></td>
              <td class="p-2 text-slate-700">${escapeHtml(l.details)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// تصدير الواجهات العامة على نطاق window
window.takeSnapshot = takeSnapshot;
window.getSnapshots = getSnapshots;
window.undoLastAction = undoLastAction;
window.restoreSnapshotById = restoreSnapshotById;
window.logAudit = logAudit;
window.getAuditLogs = getAuditLogs;
window.clearAuditLogs = clearAuditLogs;
window.openAuditModal = openAuditModal;
window.closeAuditModal = closeAuditModal;
window.updateUndoButtonState = updateUndoButtonState;
