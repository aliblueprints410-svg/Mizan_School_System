// وحدة بوابة تسجيل الدخول الموحدة للمدارس والأساتذة (School Code + Teacher Email + Password Auth Gate)
// الميزانية القصوى: 300 سطر

const AUTH_SESSION_KEY = 'MIZAN_VERIFIED_AUTH_SESSION_V2';
let currentAuthMode = 'login'; // 'login' | 'register'

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

function switchAuthGateTab(mode) {
  currentAuthMode = mode === 'register' ? 'register' : 'login';
  const btnLogin = document.getElementById('tabBtnAuthLogin');
  const btnReg = document.getElementById('tabBtnAuthRegister');
  const regExtra = document.getElementById('authRegisterExtraFields');
  const submitTxt = document.getElementById('authSubmitBtnText');

  if (currentAuthMode === 'register') {
    if (btnReg) btnReg.className = 'flex-1 py-2 rounded-lg font-black text-xs bg-amber-400 text-slate-950 shadow transition';
    if (btnLogin) btnLogin.className = 'flex-1 py-2 rounded-lg font-bold text-xs text-indigo-200 hover:text-white transition';
    if (regExtra) regExtra.classList.remove('hidden');
    if (submitTxt) submitTxt.innerText = 'تسجيل الحساب في Supabase والدخول للمدرسة';
  } else {
    if (btnLogin) btnLogin.className = 'flex-1 py-2 rounded-lg font-black text-xs bg-amber-400 text-slate-950 shadow transition';
    if (btnReg) btnReg.className = 'flex-1 py-2 rounded-lg font-bold text-xs text-indigo-200 hover:text-white transition';
    if (regExtra) regExtra.classList.add('hidden');
    if (submitTxt) submitTxt.innerText = 'تسجيل الدخول (للحسابات المسجلة فقط)';
  }
  setAuthErrorMsg('');
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
  const lvl = appData?.config?.schoolLevel || 'primary';
  const fullKey = `${schoolCodeRaw}_${lvl}`;
  const baseUrl = (cloudConfig.supabaseUrl || '').replace(/\/$/, '');
  const checkUrl = `${baseUrl}/rest/v1/mizan_cloud_sync?school_code=ilike.${encodeURIComponent(schoolCodeRaw + '_*')}&order=updated_at.desc&select=school_code,payload,school_name,school_level,updated_at,updated_by&limit=10`;
  const res = await fetch(checkUrl, { headers: { 'apikey': cloudConfig.supabaseKey } });
  if (!res.ok) throw new Error('SUPABASE_FETCH_ERROR');
  const rawRows = await res.json();
  const rows = (Array.isArray(rawRows) ? rawRows : []).filter(r => {
    if (r.school_code === 'TEST_VERIFY_SYNC') return false;
    if (r.school_code === 'SCH-2_primary' && r.updated_by === 'admin1 (admin1@gmail.com)') return false;
    return true;
  });
  if (rows.length === 0) return { remoteRow: null, mergedUsers: {} };

  const mergedUsers = {};
  [...rows].reverse().forEach(r => {
    const uMap = r?.payload?._security?.users || {};
    Object.assign(mergedUsers, uMap);
  });
  const exactRow = rows.find(r => r.school_code.toUpperCase().startsWith(fullKey.toUpperCase())) || rows[0];
  return { remoteRow: exactRow, mergedUsers };
}

async function handleAuthGateSubmit(event) {
  if (event) event.preventDefault();

  const schoolCodeRaw = (document.getElementById('authInputSchoolCode')?.value || '').trim().toUpperCase().replace(/\s+/g, '-');
  const emailRaw = (document.getElementById('authInputEmail')?.value || '').trim().toLowerCase();
  const passwordRaw = (document.getElementById('authInputPassword')?.value || '').trim();
  const teacherNameRaw = (document.getElementById('authInputTeacherName')?.value || '').trim();
  const newSchoolNameRaw = (document.getElementById('authInputNewSchoolName')?.value || '').trim();
  const rememberMe = !!document.getElementById('authInputRemember')?.checked;

  if (!schoolCodeRaw || schoolCodeRaw.length < 3) {
    setAuthErrorMsg('⚠️ يرجى إدخال كود المدرسة بشكل صحيح (مثال: SCH-1 أو AMZA-2026).');
    return;
  }
  if (!emailRaw || !emailRaw.includes('@')) {
    setAuthErrorMsg('⚠️ يرجى إدخال البريد الإلكتروني للأستاذ بصيغة صحيحة (مثال: teacher@gmail.com).');
    return;
  }
  if (!passwordRaw || passwordRaw.length < 4) {
    setAuthErrorMsg('⚠️ يرجى إدخال كلمة مرور لا تقل عن 4 أحرف أو أرقام.');
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
    const usersMap = { ...mergedUsers };
    const existingUser = usersMap[emailRaw];

    // 1. وضع تسجيل الدخول الصارم (يقبل فقط الأكواد والإيميلات المسجلة فعلياً في Supabase)
    if (currentAuthMode === 'login') {
      if (!remoteRow) {
        setAuthErrorMsg(`❌ كود المدرسة (${schoolCodeRaw}) غير مسجل في قاعدة بيانات Supabase! يرجى التأكد من الكود أو إنشاء مدرسة جديدة من تبويب «تسجيل أستاذ / مدرسة جديدة».`);
        if (btn) btn.disabled = false;
        return;
      }
      if (!existingUser) {
        setAuthErrorMsg(`❌ البريد الإلكتروني (${emailRaw}) غير مسجل ضمن أساتذة مدرسة (${remoteRow.school_name || schoolCodeRaw}) في Supabase! يرجى التسجيل أولاً من تبويب «تسجيل أستاذ / مدرسة جديدة».`);
        if (btn) btn.disabled = false;
        return;
      }
      if (existingUser.passHash !== passHash) {
        setAuthErrorMsg(`❌ كلمة المرور غير صحيحة لحساب الأستاذ (${emailRaw})!`);
        if (btn) btn.disabled = false;
        return;
      }
    } else {
      // 2. وضع التسجيل الجديد الصريح في Supabase (register)
      if (existingUser) {
        setAuthErrorMsg(`⚠️ البريد الإلكتروني (${emailRaw}) مسجل مسبقاً في هذه المدرسة! يرجى الانتقال إلى تبويب «تسجيل الدخول».`);
        if (btn) btn.disabled = false;
        return;
      }
      if (!teacherNameRaw) {
        setAuthErrorMsg('⚠️ يرجى كتابة «اسم الأستاذ والصفة» لتسجيل الحساب في قاعدة بيانات Supabase.');
        if (btn) btn.disabled = false;
        return;
      }
      if (!remoteRow && !newSchoolNameRaw) {
        setAuthErrorMsg(`⚠️ كود المدرسة (${schoolCodeRaw}) جديد؛ يرجى كتابة «اسم المدرسة الرسمي» لتأسيسها في قاعدة بيانات Supabase.`);
        if (btn) btn.disabled = false;
        return;
      }
    }

    const nowIso = new Date().toISOString();
    const displayTeacherName = existingUser?.name || teacherNameRaw || emailRaw.split('@')[0];
    const userRole = existingUser?.role || (Object.keys(usersMap).length === 0 ? 'مدير المدرسة / الكنترول' : 'معلم المادة');

    usersMap[emailRaw] = {
      email: emailRaw,
      name: displayTeacherName,
      role: userRole,
      passHash: passHash,
      registeredAt: existingUser?.registeredAt || nowIso,
      lastLoginAt: nowIso
    };

    window._activeSchoolUsersMap = usersMap;
    cloudConfig.userName = `${displayTeacherName} (${emailRaw})`;
    cloudConfig.enabled = true;

    const targetSchoolName = newSchoolNameRaw || remoteRow?.school_name || '';
    if (typeof switchActiveSchoolCode === 'function') {
      await switchActiveSchoolCode(schoolCodeRaw, targetSchoolName);
    } else {
      cloudConfig.schoolCode = schoolCodeRaw;
      saveCloudConfig();
    }

    if (targetSchoolName && (!appData.config.schoolName || appData.config.schoolName === 'مدرسة ميزان النموذجية')) {
      appData.config.schoolName = targetSchoolName;
      if (typeof syncStudentsWithSchoolGenderPolicy === 'function') syncStudentsWithSchoolGenderPolicy(true);
      if (typeof syncConfigUI === 'function') syncConfigUI();
    }

    if (!appData._security) appData._security = {};
    appData._security.users = usersMap;
    window._activeSchoolUsersMap = usersMap;

    // حفظ وتوثيق الحساب في جدول Supabase قبل السماح بالدخول
    setAuthErrorMsg('☁️ جاري توثيق وحفظ بيانات الحساب في جدول Supabase...', true);
    const pushOk = typeof pushToCloud === 'function' ? await pushToCloud(true) : false;
    if (!pushOk) {
      setAuthErrorMsg('❌ تعذر حفظ أو توثيق الحساب في قاعدة بيانات Supabase! تأكد من الاتصال بالإنترنت.');
      if (btn) btn.disabled = false;
      return;
    }

    const sessionObj = {
      schoolCode: schoolCodeRaw,
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
      const msg = currentAuthMode === 'register'
        ? `✅ تم تسجيل حساب (${displayTeacherName}) في Supabase لمدرسة (${appData.config?.schoolName || schoolCodeRaw})`
        : `👋 مرحباً بك (${displayTeacherName}) في سجل مدرسة (${appData.config?.schoolName || schoolCodeRaw})`;
      showToast(msg, 'success');
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
  switchAuthGateTab('login');
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
  // مسح أي جلسات قديمة غير موثقة من الإصدار السابق
  localStorage.removeItem('MIZAN_ACTIVE_AUTH_SESSION_2026');
  sessionStorage.removeItem('MIZAN_ACTIVE_AUTH_SESSION_2026');

  const session = getActiveAuthSession();
  const urlParams = new URLSearchParams(window.location.search);
  const urlCloudCode = urlParams.get('cloud');

  if (urlCloudCode) {
    const codeInp = document.getElementById('authInputSchoolCode');
    if (codeInp) codeInp.value = urlCloudCode.trim().toUpperCase();
  }

  if (session && session.schoolCode && session.email && (!urlCloudCode || urlCloudCode.toUpperCase() === session.schoolCode)) {
    cloudConfig.schoolCode = session.schoolCode;
    cloudConfig.userName = `${session.teacherName || session.email} (${session.email})`;
    saveCloudConfig();
    updateHeaderAuthBadge(session);
    hideAuthGateOverlay();

    // تحقق حي من Supabase للتأكد من أن الحساب والمدرسة لا يزالان مسجلين فعلياً
    if (navigator.onLine && cloudConfig.supabaseUrl && cloudConfig.supabaseKey) {
      try {
        const { remoteRow, mergedUsers } = await fetchSchoolRecordFromSupabase(session.schoolCode);
        const u = mergedUsers[session.email.toLowerCase()];
        if (!remoteRow || !u || (session.passHash && u.passHash !== session.passHash)) {
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
    const code = (cloudConfig.schoolCode || 'MIZAN-2026').trim().toUpperCase();
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
        <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">مسجل في Supabase ✓</span>
      </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = '<div class="text-center py-2 text-rose-600 text-xs">تعذر جلب قائمة الأساتذة من Supabase.</div>';
  }
}

window.getActiveAuthSession = getActiveAuthSession;
window.switchAuthGateTab = switchAuthGateTab;
window.toggleAuthPasswordVisibility = toggleAuthPasswordVisibility;
window.handleAuthGateSubmit = handleAuthGateSubmit;
window.showAuthGateOverlay = showAuthGateOverlay;
window.hideAuthGateOverlay = hideAuthGateOverlay;
window.logoutFromMizan = logoutFromMizan;
window.initAuthGateOnBoot = initAuthGateOnBoot;
window.renderCloudRegisteredUsersList = renderCloudRegisteredUsersList;
