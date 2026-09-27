// وحدة بوابة تسجيل الدخول الموحدة للمدارس والأساتذة (School Code + Teacher Email + Password Auth Gate)
// الميزانية القصوى: 300 سطر

const AUTH_SESSION_KEY = 'MIZAN_ACTIVE_AUTH_SESSION_2026';
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
    if (submitTxt) submitTxt.innerText = 'إنشاء الحساب والدخول إلى سحابة المدرسة';
  } else {
    if (btnLogin) btnLogin.className = 'flex-1 py-2 rounded-lg font-black text-xs bg-amber-400 text-slate-950 shadow transition';
    if (btnReg) btnReg.className = 'flex-1 py-2 rounded-lg font-bold text-xs text-indigo-200 hover:text-white transition';
    if (regExtra) regExtra.classList.add('hidden');
    if (submitTxt) submitTxt.innerText = 'تسجيل الدخول وربط سجل المدرسة';
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
    ? 'p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold text-center'
    : 'p-3 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-bold text-center';
  box.innerText = msg;
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
    setAuthErrorMsg('⚠️ يرجى إدخال كود المدرسة بشكل صحيح (مثال: AMZA-2026).');
    return;
  }
  if (!emailRaw || !emailRaw.includes('@')) {
    setAuthErrorMsg('⚠️ يرجى إدخال البريد الإلكتروني للأستاذ بصيغة صحيحة (مثال: teacher@gmail.com).');
    return;
  }
  if (!passwordRaw || passwordRaw.length < 4) {
    setAuthErrorMsg('⚠️ يرجى إدخال كلمة مرور لا تقل عن 4أحرف أو أرقام.');
    return;
  }

  const btn = document.getElementById('authSubmitBtn');
  if (btn) btn.disabled = true;
  setAuthErrorMsg('🔄 جاري التحقق من بيانات المدرسة وحساب الأستاذ في سحابة Supabase...', true);

  try {
    const lvl = appData?.config?.schoolLevel || 'primary';
    const fullKey = `${schoolCodeRaw}_${lvl}`;
    const passHash = typeof computeCloudPinHash === 'function'
      ? await computeCloudPinHash(passwordRaw, `${schoolCodeRaw}::${emailRaw}`)
      : passwordRaw;

    // فحص سجل المدرسة في Supabase
    let remoteRow = null;
    if (navigator.onLine && cloudConfig.supabaseUrl && cloudConfig.supabaseKey) {
      const checkUrl = `${cloudConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/mizan_cloud_sync?school_code=eq.${encodeURIComponent(fullKey)}&select=payload,school_name,updated_at&limit=1`;
      const res = await fetch(checkUrl, { headers: { 'apikey': cloudConfig.supabaseKey } });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) remoteRow = rows[0];
      }
    }

    const remotePayload = remoteRow?.payload || null;
    const usersMap = (remotePayload && remotePayload._security && remotePayload._security.users)
      ? { ...remotePayload._security.users }
      : {};

    const existingUser = usersMap[emailRaw];
    if (existingUser && existingUser.passHash && existingUser.passHash !== passHash) {
      setAuthErrorMsg('❌ كلمة المرور غير صحيحة لحساب هذا الأستاذ (' + emailRaw + ') في هذه المدرسة!');
      if (btn) btn.disabled = false;
      return;
    }

    const displayTeacherName = teacherNameRaw || existingUser?.name || emailRaw.split('@')[0];
    const userRole = existingUser?.role || (Object.keys(usersMap).length === 0 ? 'مدير المدرسة / الكنترول' : 'معلم المادة');

    // تسجيل أو تحديث حساب الأستاذ في سجل المدرسة
    usersMap[emailRaw] = {
      email: emailRaw,
      name: displayTeacherName,
      role: userRole,
      passHash: passHash,
      lastLoginAt: new Date().toISOString()
    };

    // تفعيل عزل المدرسة وتحميل سجلها المستقل
    cloudConfig.userName = `${displayTeacherName} (${emailRaw})`;
    cloudConfig.enabled = true;

    if (typeof switchActiveSchoolCode === 'function') {
      await switchActiveSchoolCode(schoolCodeRaw, newSchoolNameRaw || remoteRow?.school_name || '');
    } else {
      cloudConfig.schoolCode = schoolCodeRaw;
      saveCloudConfig();
    }

    if (newSchoolNameRaw && (!appData.config.schoolName || appData.config.schoolName === 'مدرسة ميزان النموذجية')) {
      appData.config.schoolName = newSchoolNameRaw;
      if (typeof syncStudentsWithSchoolGenderPolicy === 'function') syncStudentsWithSchoolGenderPolicy(true);
      if (typeof syncConfigUI === 'function') syncConfigUI();
    }

    if (!appData._security) appData._security = {};
    appData._security.users = usersMap;
    window._activeSchoolUsersMap = usersMap;

    const sessionObj = {
      schoolCode: schoolCodeRaw,
      email: emailRaw,
      teacherName: displayTeacherName,
      role: userRole,
      loggedInAt: new Date().toISOString()
    };
    saveActiveAuthSession(sessionObj, rememberMe);
    updateHeaderAuthBadge(sessionObj);
    hideAuthGateOverlay();

    // رفع تحديث سجل دخول الأستاذ إلى السحابة
    if (typeof pushToCloud === 'function') {
      pushToCloud(true);
    }

    if (typeof showToast === 'function') {
      showToast(`👋 مرحباً بك (${displayTeacherName}) في سجل مدرسة (${appData.config?.schoolName || schoolCodeRaw})`, 'success');
    }
  } catch (err) {
    setAuthErrorMsg('⚠️ تعذر التحقق السحابي، يرجى التأكد من الاتصال بالإنترنت والمحاولة مجدداً.');
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

  const codeInp = document.getElementById('authInputSchoolCode');
  if (codeInp && !codeInp.value) {
    codeInp.value = (cloudConfig.schoolCode && cloudConfig.schoolCode !== 'MIZAN-2026') ? cloudConfig.schoolCode : '';
  }
}

function hideAuthGateOverlay() {
  const overlay = document.getElementById('authGateOverlay');
  if (overlay) overlay.classList.add('hidden');
}

function logoutFromMizan() {
  if (!confirm('🚪 هل تريد تسجيل الخروج من حساب الأستاذ والعودة إلى نافذة تسجيل الدخول؟')) return;
  clearActiveAuthSession();
  const passInp = document.getElementById('authInputPassword');
  if (passInp) passInp.value = '';
  setAuthErrorMsg('');
  showAuthGateOverlay();
}

function initAuthGateOnBoot() {
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
  } else {
    showAuthGateOverlay();
  }
}

window.switchAuthGateTab = switchAuthGateTab;
window.toggleAuthPasswordVisibility = toggleAuthPasswordVisibility;
window.handleAuthGateSubmit = handleAuthGateSubmit;
window.showAuthGateOverlay = showAuthGateOverlay;
window.hideAuthGateOverlay = hideAuthGateOverlay;
window.logoutFromMizan = logoutFromMizan;
window.initAuthGateOnBoot = initAuthGateOnBoot;
