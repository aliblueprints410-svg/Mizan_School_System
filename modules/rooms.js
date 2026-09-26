// وحدة إدارة وتوزيع القاعات الامتحانية (Exam Rooms Manager)
// الميزانية القصوى: 220 سطر

let activeRoomGradeFilter = 'all';

function setRoomGradeFilter(val) {
  activeRoomGradeFilter = val;
  distributeStudentsToRooms();
}

function distributeStudentsToRooms() {
  const roomsContainer = document.getElementById('roomsDisplayContainer');
  const unallocBox = document.getElementById('unallocatedStudentsContainer');
  const unallocList = document.getElementById('unallocatedStudentsList');
  const unallocBadge = document.getElementById('unallocatedCountBadge');

  if (!roomsContainer) return;

  const rooms = appData.rooms || [];
  let students = [...(appData.students || [])];

  const lvl = appData.config?.schoolLevel || 'primary';
  const activeGradesList = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[lvl]) ? SCHOOL_LEVELS[lvl].grades : [];
  const gradesObj = {};
  activeGradesList.forEach(g => gradesObj[g.val] = g.name);

  const filterSelect = document.getElementById('roomGradeFilterSelect');
  if (filterSelect && filterSelect.value) {
    activeRoomGradeFilter = filterSelect.value;
  }

  if (activeRoomGradeFilter && activeRoomGradeFilter !== 'all') {
    students = students.filter(s => String(s.grade) === String(activeRoomGradeFilter));
  }

  students.sort((a, b) => {
    if (String(a.grade) !== String(b.grade)) return String(a.grade).localeCompare(String(b.grade));
    if (a.section !== b.section) return a.section.localeCompare(b.section, 'ar');
    return a.name.localeCompare(b.name, 'ar');
  });

  let currentIndex = 0;
  const roomAllocations = {};

  rooms.forEach(room => {
    const cap = Math.max(1, Number(room.capacity) || 0);
    roomAllocations[room.id] = students.slice(currentIndex, currentIndex + cap);
    currentIndex += cap;
  });

  const unallocatedStudents = students.slice(currentIndex);

  roomsContainer.innerHTML = rooms.map((room, rIdx) => {
    const allocated = roomAllocations[room.id] || [];
    return `
      <div class="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden flex flex-col">
        <div class="bg-slate-900 text-white p-3 flex justify-between items-center text-sm font-bold">
          <span>${escapeHtml(room.name || ('القاعة الامتحانية (' + (rIdx + 1) + ')'))}</span>
          <span class="text-xs bg-indigo-600 px-2 py-0.5 rounded font-mono">المشغول: ${allocated.length} / ${room.capacity}</span>
        </div>
        <div class="p-3 max-h-80 overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
          ${allocated.length === 0 ? '<div class="text-center text-slate-400 py-6">لا يوجد طلبة في هذه القاعة</div>' : ''}
          ${allocated.map((st, idx) => `
            <div class="py-1.5 flex justify-between items-center">
              <div class="flex items-center gap-2">
                <span class="w-6 text-center font-bold text-slate-400 font-mono">${idx + 1}</span>
                <span class="font-bold text-slate-800">${escapeHtml(st.name)}</span>
              </div>
              <span class="text-slate-500 font-medium">مقعد (${idx + 1}) | ${escapeHtml(gradesObj[st.grade] || ('الصف ' + st.grade))} - شعبة (${escapeHtml(st.section)})</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  if (unallocatedStudents.length > 0 && unallocBox && unallocList) {
    unallocBox.classList.remove('hidden');
    if (unallocBadge) unallocBadge.innerText = `${unallocatedStudents.length} طالب`;

    unallocList.innerHTML = unallocatedStudents.map((st, idx) => `
      <tr class="hover:bg-rose-50/50">
        <td class="p-1.5 text-center font-mono font-bold text-rose-900">${idx + 1}</td>
        <td class="p-1.5 font-bold text-slate-800">${escapeHtml(st.name)}</td>
        <td class="p-1.5 text-center font-medium text-slate-600">${escapeHtml(gradesObj[st.grade] || st.grade)}</td>
        <td class="p-1.5 text-center font-bold text-indigo-700">${escapeHtml(st.section)}</td>
      </tr>
    `).join('');
  } else if (unallocBox) {
    unallocBox.classList.add('hidden');
  }
}

function addNewRoom() {
  if (!appData.rooms) appData.rooms = [];
  const nextNum = appData.rooms.length + 1;
  appData.rooms.push({
    id: 'room_' + Date.now(),
    name: 'القاعة الامتحانية (' + nextNum + ')',
    capacity: 30
  });
  saveData();
  renderRoomsSettings();
  distributeStudentsToRooms();
}

function renderRoomsSettings() {
  const container = document.getElementById('roomsSettingsGrid');
  if (!container) return;
  const rooms = appData.rooms || [];

  const filterContainer = document.getElementById('roomGradeFilterSelectContainer');
  if (filterContainer) {
    const lvl = appData.config?.schoolLevel || 'primary';
    const gradesList = (window.SCHOOL_LEVELS && SCHOOL_LEVELS[lvl]) ? SCHOOL_LEVELS[lvl].grades : [];
    filterContainer.innerHTML = `
      <label class="font-bold text-xs text-slate-700 ml-1">توزيع صف محدد:</label>
      <select id="roomGradeFilterSelect" onchange="setRoomGradeFilter(this.value)" class="border rounded px-2.5 py-1 text-xs font-bold bg-white text-indigo-900">
        <option value="all" ${activeRoomGradeFilter === 'all' ? 'selected' : ''}>توزيع كافة الصفوف معاً</option>
        ${gradesList.map(g => `<option value="${g.val}" ${activeRoomGradeFilter === String(g.val) ? 'selected' : ''}>${escapeHtml(g.name)} فقط</option>`).join('')}
      </select>
    `;
  }

  container.innerHTML = rooms.map((room) => `
    <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col gap-2">
      <div class="flex justify-between items-center gap-2">
        <input type="text" value="${escapeHtml(room.name)}" onchange="updateRoomName('${escapeHtml(room.id)}', this.value)" class="w-full border rounded px-2 py-1 font-bold text-slate-800 bg-white" placeholder="اسم القاعة">
        <button onclick="deleteRoom('${escapeHtml(room.id)}')" class="text-rose-600 hover:text-rose-800 p-1" title="حذف القاعة">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
      <div class="flex items-center justify-between gap-2">
        <label class="text-slate-600 font-semibold">عدد المقاعد (السعة):</label>
        <input type="number" min="1" max="500" value="${room.capacity}" onchange="updateRoomCapacity('${escapeHtml(room.id)}', this.value)" class="w-20 border rounded px-2 py-1 text-center font-bold bg-white">
      </div>
    </div>
  `).join('');
}

function updateRoomName(id, newName) {
  const room = (appData.rooms || []).find(r => r.id === id);
  if (room && newName.trim()) {
    room.name = newName.trim();
    saveData();
    distributeStudentsToRooms();
  }
}

function updateRoomCapacity(id, val) {
  const room = (appData.rooms || []).find(r => r.id === id);
  if (room) {
    room.capacity = Math.max(1, Number(val) || 1);
    saveData();
    distributeStudentsToRooms();
  }
}

function deleteRoom(id) {
  if (confirm('هل أنت متأكد من حذف هذه القاعة؟')) {
    appData.rooms = (appData.rooms || []).filter(r => r.id !== id);
    saveData();
    renderRoomsSettings();
    distributeStudentsToRooms();
  }
}

window.distributeStudentsToRooms = distributeStudentsToRooms;
window.addNewRoom = addNewRoom;
window.renderRoomsSettings = renderRoomsSettings;
window.updateRoomName = updateRoomName;
window.updateRoomCapacity = updateRoomCapacity;
window.deleteRoom = deleteRoom;
window.setRoomGradeFilter = setRoomGradeFilter;
