// وحدة بوابة تسجيل الدخول الموحدة للمدارس والأساتذة (School Code + Teacher Email + Password Auth Gate)
// الميزانية القصوى: 300 سطر

const AUTH_SESSION_KEY = 'MIZAN_VERIFIED_AUTH_SESSION_V2';

function getActiveAuthSession() {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveActiveAuthSession(sessionObj, remember = true) {
  try {
    const str = JSON.stringify(sessionObj);
    sessionStorage.setItem(AUTH_SESSION_KEY, str);
    if (remember) localStorage.setItem(AUTH_SESSION_KEY, str);
    else localStorage.removeItem(AUTH_SESSION_KEY);
  } catch (e) {}
}

function clearActiveAuthSession() {
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem('MIZAN_ACTIVE_AUTH_SESSION_2026');
    sessionStorage.removeItem('MIZAN_ACTIVE_AUTH_SESSION_2026');
  } catch (e) {}
}

function toggleAuthPasswordVisibility() {
  const inp = document.getElementById('authInputPassword');
  const icon = document.getElementById('authPassEyeIcon');
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    if (icon) icon.className = 'fa-solid fa-eye-slash';
  } else {
    inp.type = 'password';
    if (icon) icon.className = 'fa-solid fa-eye';
  }
}

function setAuthErrorMsg(msg, isSuccess = false) {
  const box = document.getElementById('authGateErrorBox');
  if (!box) return;
  if (!msg) {
    box.classList.add('hidden');
    box.innerText = '';
    return;
  }
  box.classList.remove('hidden');
  box.className = isSuccess
    ? 'p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold text-center leading-relaxed'
    : 'p-3 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-bold text-center leading-relaxed';
  box.innerText = msg;
}

async function fetchSchoolRecordFromSupabase(schoolCodeRaw) {
  const cleanCode = String(schoolCodeRaw || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!cleanCode) return { remoteRow: null, mergedUsers: {} };

  const baseUrl = (cloudConfig.supabaseUrl || '').replace(/\/$/, '');
  const checkUrl = `${baseUrl}/rest/v1/mizan_cloud_sync?or=(school_code.eq.${encodeURIComponent(cleanCode)},school_code.ilike.${encodeURIComponent(cleanCode)},school_code.ilike.${encodeURIComponent(cleanCode + '_*')})&order=updated_at.desc&select=school_code,payload,school_name,school_level,updated_at,updated_by&limit=10`;
  const res = await fetch(checkUrl, { headers: { 'apikey': cloudConfig.supabaseKey } });
  if (!res.ok) throw new Error('SUPABASE_FETCH_ERROR');

  const rawRows = await res.json();
  const rows = (Array.isArray(rawRows) ? rawRows : []).filter(r => r && r.school_code !== 'TEST_VERIFY_SYNC');
  if (rows.length === 0) return { remoteRow: null, mergedUsers: {} };

  const mergedUsers = {};
  [...rows].reverse().forEach(r => {
    const uMap = r?.payload?._security?.users || {};
    Object.assign(mergedUsers, uMap);

    // قراءة الأساتذة المضافين مباشرة من لوحة Supabase داخل _registered_teachers
    const arr = r?.payload?._registered_teachers;
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        if (item && item.email) {
          const em = String(item.email).trim().toLowerCase();
          mergedUsers[em] = { ...(mergedUsers[em] || {}), ...item, email: em };
        }
      });
    }
  });

  const exactRow = rows.find(r => r.school_code.toUpperCase() === cleanCode)
    || rows.find(r => r.school_code.toUpperCase().startsWith(cleanCode + '_'))
    || rows[0];

  return { remoteRow: exactRow, mergedUsers };
}

async function handleAuthGateSubmit(event) {
  if (event) event.preventDefault();

  const schoolCodeRaw = (document.getElementById('authInputSchoolCode')?.value || '').trim().toUpperCase().replace(/\s+/g, '');
  const emailRaw = (document.getElementById('authInputEmail')?.value || '').trim().toLowerCase();
  const passwordRaw = (document.getElementById('authInputPassword')?.value || '').trim();
  const rememberMe = !!document.getElementById('authInputRemember')?.checked;

  if (!schoolCodeRaw) {
    setAuthErrorMsg('⚠️ يرجى إدخال كود المدرسة (مثال: 101 أو AMZA أو SCH-1).');
    return;
  }
  if (!emailRaw || !emailRaw.includes('@')) {
    setAuthErrorMsg('⚠️ يرجى إدخال البريد الإلكتروني للأستاذ بصيغة صحيحة (مثال: teacher@gmail.com).');
    return;
  }
  if (!passwordRaw) {
    setAuthErrorMsg('⚠️ يرجى إدخال كلمة المرور.');
    return;
  }

  if (!navigator.onLine || !cloudConfig.supabaseUrl || !cloudConfig.supabaseKey) {
    setAuthErrorMsg('⚠️ يلزم الاتصال بالإنترنت للتحقق من قاعدة بيانات Supabase.');
    return;
  }

  const btn = document.getElementById('authSubmitBtn');
  if (btn) btn.disabled = true;
  setAuthErrorMsg('🔄 جاري فحص قاعدة بيانات Supabase للتحقق من كود المدرسة وحساب الأستاذ...', true);

  try {
    const passHash = typeof computeCloudPinHash === 'function'
      ? await computeCloudPinHash(passwordRaw, `${schoolCodeRaw}::${emailRaw}`)
      : passwordRaw;

    const { remoteRow, mergedUsers } = await fetchSchoolRecordFromSupabase(schoolCodeRaw);
    const existingUser = mergedUsers[emailRaw];

    if (!remoteRow) {
      setAuthErrorMsg(`❌ كود المدرسة (${schoolCodeRaw}) غير مسجل في السحابة! يرجى مراجعة إدارة المنظومة لتفعيل كود مدرستك.`);
      if (btn) btn.disabled = false;
      return;
    }

    if (!existingUser) {
      setAuthErrorMsg(`❌ البريد الإلكتروني (${emailRaw}) غير مضاف ضمن أساتذة مدرسة (${remoteRow.school_name || schoolCodeRaw})! يرجى التواصل مع الإدارة لتفعيل حسابك.`);
      if (btn) btn.disabled = false;
      return;
    }

    const isHashMatch = existingUser.passHash && existingUser.passHash === passHash;
    const isPlainMatch = existingUser.password && String(existingUser.password).trim() === passwordRaw;

    let isAltHashMatch = false;
    if (!isHashMatch && existingUser.passHash && typeof computeCloudPinHash === 'function') {
      const altHash = await computeCloudPinHash(passwordRaw, schoolCodeRaw);
      if (existingUser.passHash === altHash) isAltHashMatch = true;
    }

    if (!isHashMatch && !isPlainMatch && !isAltHashMatch) {
      setAuthErrorMsg(`❌ كلمة المرور غير صحيحة لحساب الأستاذ (${emailRaw})!`);
      if (btn) btn.disabled = false;
      return;
    }

    const nowIso = new Date().toISOString();
    const displayTeacherName = existingUser?.name || emailRaw.split('@')[0];
    const userRole = existingUser?.role || 'معلم المادة';

    cloudConfig.userName = `${displayTeacherName} (${emailRaw})`;
    cloudConfig.enabled = true;

    const targetSchoolName = remoteRow.school_name || '';
    const targetFullKey = remoteRow.school_code || schoolCodeRaw;

    if (typeof switchActiveSchoolCode === 'function') {
      await switchActiveSchoolCode(schoolCodeRaw, targetSchoolName, null, targetFullKey);
    } else {
      cloudConfig.schoolCode = schoolCodeRaw;
      cloudConfig.fullSchoolKey = targetFullKey;
      saveCloudConfig();
    }

    if (targetSchoolName && (!appData.config.schoolName || appData.config.schoolName === 'مدرسة ميزان النموذجية')) {
      appData.config.schoolName = targetSchoolName;
      if (typeof syncStudentsWithSchoolGenderPolicy === 'function') syncStudentsWithSchoolGenderPolicy(true);
      if (typeof syncConfigUI === 'function') syncConfigUI();
    }

    if (!appData._security) appData._security = {};
    appData._security.users = mergedUsers;
    window._activeSchoolUsersMap = mergedUsers;

    const sessionObj = {
      schoolCode: schoolCodeRaw,
      fullSchoolKey: targetFullKey,
      email: emailRaw,
      teacherName: displayTeacherName,
      role: userRole,
      passHash: passHash,
      loggedInAt: nowIso
    };

    saveActiveAuthSession(sessionObj, rememberMe);
    updateHeaderAuthBadge(sessionObj);
    hideAuthGateOverlay();

    if (typeof showToast === 'function') {
      showToast(`👋 مرحباً بك (${displayTeacherName}) في سجل مدرسة (${appData.config?.schoolName || schoolCodeRaw})`, 'success');
    }
  } catch (err) {
    setAuthErrorMsg('⚠️ تعذر الاتصال بقاعدة بيانات Supabase للتحقق من الحساب.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function updateHeaderAuthBadge(sessionObj) {
  const badge = document.getElementById('headerAuthUserBadge');
  const codeSpan = document.getElementById('headerAuthSchoolCode');
  const emailSpan = document.getElementById('headerAuthTeacherEmail');
  if (!sessionObj) {
    if (badge) badge.classList.add('hidden');
    return;
  }
  if (badge) badge.classList.remove('hidden');
  if (codeSpan) codeSpan.innerText = sessionObj.schoolCode || '';
  if (emailSpan) emailSpan.innerText = sessionObj.teacherName || sessionObj.email || '';
}

function showAuthGateOverlay() {
  const overlay = document.getElementById('authGateOverlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
}

function hideAuthGateOverlay() {
  const overlay = document.getElementById('authGateOverlay');
  if (overlay) overlay.classList.add('hidden');
}

function logoutFromMizan() {
  if (!confirm('🚪 هل تريد تسجيل الخروج من حساب الأستاذ والعودة إلى نافذة تسجيل الدخول؟')) return;
  clearActiveAuthSession();
  window._activeSchoolUsersMap = {};
  const passInp = document.getElementById('authInputPassword');
  if (passInp) passInp.value = '';
  setAuthErrorMsg('');
  showAuthGateOverlay();
}

async function initAuthGateOnBoot() {
  localStorage.removeItem('MIZAN_ACTIVE_AUTH_SESSION_2026');
  sessionStorage.removeItem('MIZAN_ACTIVE_AUTH_SESSION_2026');

  const session = getActiveAuthSession();
  const urlParams = new URLSearchParams(window.location.search);
  const urlCloudCode = urlParams.get('cloud');

  if (urlCloudCode) {
    const codeInp = document.getElementById('authInputSchoolCode');
    if (codeInp) codeInp.value = urlCloudCode.trim().toUpperCase().replace(/\s+/g, '');
  }

  if (session && session.schoolCode && session.email && (!urlCloudCode || urlCloudCode.toUpperCase() === session.schoolCode)) {
    cloudConfig.schoolCode = session.schoolCode;
    cloudConfig.fullSchoolKey = session.fullSchoolKey || session.schoolCode;
    cloudConfig.userName = `${session.teacherName || session.email} (${session.email})`;
    saveCloudConfig();
    updateHeaderAuthBadge(session);
    hideAuthGateOverlay();

    if (navigator.onLine && cloudConfig.supabaseUrl && cloudConfig.supabaseKey) {
      try {
        const { remoteRow, mergedUsers } = await fetchSchoolRecordFromSupabase(session.schoolCode);
        const u = mergedUsers[session.email.toLowerCase()];
        if (!remoteRow || !u) {
          clearActiveAuthSession();
          updateHeaderAuthBadge(null);
          showAuthGateOverlay();
          setAuthErrorMsg('⚠️ هذا الحساب أو كود المدرسة غير مسجل في قاعدة بيانات Supabase، يرجى تسجيل الدخول بحساب مسجل.');
        } else {
          window._activeSchoolUsersMap = mergedUsers;
        }
      } catch (e) {}
    }
  } else {
    showAuthGateOverlay();
  }
}

async function renderCloudRegisteredUsersList() {
  const container = document.getElementById('cloudRegisteredUsersContainer');
  if (!container) return;
  container.innerHTML = '<div class="text-center py-2 text-slate-500 text-xs"><i class="fa-solid fa-spinner fa-spin ml-1"></i> جاري جلب الحسابات المسجلة من Supabase...</div>';

  try {
    const code = (cloudConfig.schoolCode || 'MIZAN-2026').trim().toUpperCase().replace(/\s+/g, '');
    const { mergedUsers } = await fetchSchoolRecordFromSupabase(code);
    const list = Object.values(mergedUsers || {});
    if (list.length === 0) {
      container.innerHTML = '<div class="text-center py-2 text-slate-500 text-xs">لا توجد حسابات مسجلة لهذا الكود في Supabase بعد.</div>';
      return;
    }
    container.innerHTML = list.map(u => {
      const dt = u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ar-IQ') : '';
      return `<div class="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-[11px]">
        <div>
          <div class="font-black text-slate-800"><i class="fa-solid fa-user-check text-emerald-600 ml-1"></i> ${u.name || u.email} <span class="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 mr-1">${u.role || 'معلم'}</span></div>
          <div class="font-mono text-slate-600 mt-0.5">${u.email} ${dt ? `| آخر دخول: ${dt}` : ''}</div>
        </div>
        <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">معتمد في Supabase ✓</span>
      </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = '<div class="text-center py-2 text-rose-600 text-xs">تعذر جلب قائمة الأساتذة من Supabase.</div>';
  }
}

window.getActiveAuthSession = getActiveAuthSession;
window.toggleAuthPasswordVisibility = toggleAuthPasswordVisibility;
window.handleAuthGateSubmit = handleAuthGateSubmit;
window.showAuthGateOverlay = showAuthGateOverlay;
window.hideAuthGateOverlay = hideAuthGateOverlay;
window.logoutFromMizan = logoutFromMizan;
window.initAuthGateOnBoot = initAuthGateOnBoot;
window.renderCloudRegisteredUsersList = renderCloudRegisteredUsersList;
