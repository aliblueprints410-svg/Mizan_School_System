// المنسق العام لتشغيل النظام (Bootstrap Orchestrator)
// الميزانية القصوى: 80 سطر (صارم)

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-amber-500', 'text-slate-900', 'font-bold');
    btn.classList.add('text-indigo-100', 'hover:bg-indigo-800');
  });

  const target = document.getElementById(tabId);
  if (target) target.classList.remove('hidden');

  const activeBtn = document.getElementById('btn-' + tabId);
  if (activeBtn) {
    activeBtn.classList.remove('text-indigo-100', 'hover:bg-indigo-800');
    activeBtn.classList.add('bg-amber-500', 'text-slate-900', 'font-bold');
  }

  if (tabId === 'stats-tab') {
    if (typeof renderStatsTable === 'function') renderStatsTable();
    if (typeof renderAcademicAnalytics === 'function') renderAcademicAnalytics();
  }
  if (tabId === 'grades-tab' && typeof renderGradesSheet === 'function') renderGradesSheet();
  if (tabId === 'docs-tab' && typeof renderOfficialDocsView === 'function') renderOfficialDocsView();
  if (tabId === 'rooms-tab') {
    if (typeof renderRoomsSettings === 'function') renderRoomsSettings();
    if (typeof distributeStudentsToRooms === 'function') distributeStudentsToRooms();
  }
  if (tabId === 'students-tab' && typeof renderStudentsTable === 'function') renderStudentsTable();
}

function updateDashboardCounts() {
  const total = (appData.students || []).length;
  const male = (appData.students || []).filter(s => s.gender === 'ذكر').length;
  const female = (appData.students || []).filter(s => s.gender === 'أنثى').length;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setEl('dashTotalStudents', total);
  setEl('dashMaleStudents', male);
  setEl('dashFemaleStudents', female);
  setEl('dashRoomsCount', (appData.rooms || []).length);
}

function renderAll() {
  if (typeof renderStudentsTable === 'function') renderStudentsTable();
  if (typeof renderStatsTable === 'function') renderStatsTable();
  if (typeof renderGradesSheet === 'function') renderGradesSheet();
  if (typeof renderRoomsSettings === 'function') renderRoomsSettings();
  if (typeof distributeStudentsToRooms === 'function') distributeStudentsToRooms();
  if (typeof renderAcademicAnalytics === 'function') renderAcademicAnalytics();
  if (typeof applyLockUiState === 'function') applyLockUiState();
  if (typeof updateUndoButtonState === 'function') updateUndoButtonState();
  updateDashboardCounts();
}

window.addEventListener('DOMContentLoaded', () => {
  if (typeof loadData === 'function') loadData();
  if (typeof applyLockUiState === 'function') applyLockUiState();
  if (typeof updateUndoButtonState === 'function') updateUndoButtonState();
  if (typeof initCloudSyncEngine === 'function') initCloudSyncEngine();
});

window.switchTab = switchTab;
window.updateDashboardCounts = updateDashboardCounts;
window.renderAll = renderAll;