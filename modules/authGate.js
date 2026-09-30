// وحدة بوابة تسجيل الدخول الموحدة للمدارس والأساتذة (Unified Supabase Auth Gate)
// متطابقة 100% مع تطبيق مدرستي بنظام الحسابات السحابي الرسمي وعزل المدارس الصارم

const AUTH_SESSION_KEY = 'MIZAN_VERIFIED_AUTH_SESSION_V2';
const SYS_TEACHER_SCHOOL_PREFIX = '__SYS_TEACHER_SCHOOL__:';

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

// 1. التحقق من كود المدرسة من جدول schools في Supabase
async function fetchSchoolFromSupabase(schoolCodeRaw) {
  const cleanCode = String(schoolCodeRaw || '').trim().replace(/\s+/g, '');
  if (!cleanCode) return null;

  const baseUrl = (cloudConfig.supabaseUrl || '').replace(/\/$/, '');
  const url = `${baseUrl}/rest/v1/schools?school_code=ilike.${encodeURIComponent(cleanCode)}&select=id,name,school_code&limit=1`;
  const res = await fetch(url, {
    headers: {
      'apikey': cloudConfig.supabaseKey,
      'Authorization': `Bearer ${cloudConfig.supabaseKey}`
    }
  });

  if (!res.ok) throw new Error('SCHOOL_QUERY_ERROR');
  const rows = await res.json();
  return (Array.isArray(rows) && rows.length > 0) ? rows[0] : null;
}

// 2. تسجيل دخول الأستاذ عبر محرك المصادقة السحابي الرسمي Supabase Auth
async function loginTeacherWithSupabase(email, password) {
  const baseUrl = (cloudConfig.supabaseUrl || '').replace(/\/$/, '');
  const authUrl = `${baseUrl}/auth/v1/token?grant_type=password`;

  const res = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'apikey': cloudConfig.supabaseKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password: password.trim()
    })
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error_description || data.msg || data.message || '';
    if (errorMsg.includes('Invalid login credentials') || errorMsg.includes('invalid_grant')) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات أو استخدام خيار نسيت كلمة المرور.');
    }
    throw new Error(errorMsg || 'فشل تسجيل الدخول من خادم المصادقة.');
  }

  return data;
}

// 3. التحقق من عزل المدارس وربط الأستاذ بالمدرسة (بما يطابق تطبيق مدرستي)
async function verifyAndBindTeacherSchool(user, accessToken, school, cleanEmail) {
  let boundSchoolId = user?.user_metadata?.school_id;
  let boundSchoolCode = user?.user_metadata?.school_code;
  let boundSchoolName = user?.user_metadata?.school_name;

  // فحص سجل ربط الأساتذة في جدول announcements كنسخة احتياطية
  const baseUrl = (cloudConfig.supabaseUrl || '').replace(/\/$/, '');
  const sysTitle = `${SYS_TEACHER_SCHOOL_PREFIX}${cleanEmail}`;
  try {
    const checkUrl = `${baseUrl}/rest/v1/announcements?title=eq.${encodeURIComponent(sysTitle)}&order=created_at.desc&select=content&limit=1`;
    const annRes = await fetch(checkUrl, {
      headers: {
        'apikey': cloudConfig.supabaseKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (annRes.ok) {
      const rows = await annRes.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0]?.content) {
        const parsed = JSON.parse(rows[0].content);
        boundSchoolId = boundSchoolId || parsed.school_id;
        boundSchoolCode = boundSchoolCode || parsed.school_code;
        boundSchoolName = boundSchoolName || parsed.school_name;
      }
    }
  } catch (e) {}

  // حظر الدخول إذا كان حساب الأستاذ مسجلاً ومقيداً بمدرسة أخرى
  if (boundSchoolId && boundSchoolId !== school.id) {
    const other = boundSchoolName || boundSchoolCode || 'مدرسة أخرى';
    throw new Error(`عذراً، حساب الأستاذ هذا تابع لـ (${other}) ولا يمكنه الدخول إلى (${school.name})!`);
  }
  if (boundSchoolCode && boundSchoolCode.toLowerCase() !== school.school_code.toLowerCase()) {
    const other = boundSchoolName || boundSchoolCode;
    throw new Error(`عذراً، حساب الأستاذ هذا تابع لـ (${other}) ولا يمكنه الدخول إلى (${school.name})!`);
  }

  // إذا لم يكن الحساب مقيداً بعد، نقيده تلقائياً بهذه المدرسة
  if (!boundSchoolId) {
    try {
      await fetch(`${baseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'apikey': cloudConfig.supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            school_id: school.id,
            school_code: school.school_code,
            school_name: school.name
          }
        })
      });

      const randomId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'mizan_' + Date.now();

      await fetch(`${baseUrl}/rest/v1/announcements`, {
        method: 'POST',
        headers: {
          'apikey': cloudConfig.supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          id: randomId,
          school_id: school.id,
          title: sysTitle,
          content: JSON.stringify({
            email: cleanEmail,
            school_id: school.id,
            school_code: school.school_code,
            school_name: school.name
          }),
          created_at: new Date().toISOString(),
          priority: false,
          is_deleted: false
        })
      });
    } catch (_) {}
  }
}

// 4. معالجة نموذج تسجيل الدخول الموحد
async function handleAuthGateSubmit(event) {
  if (event) event.preventDefault();

  const schoolCodeRaw = (document.getElementById('authInputSchoolCode')?.value || '').trim();
  const emailRaw = (document.getElementById('authInputEmail')?.value || '').trim().toLowerCase();
  const passwordRaw = (document.getElementById('authInputPassword')?.value || '').trim();
  const rememberMe = !!document.getElementById('authInputRemember')?.checked;

  if (!schoolCodeRaw) {
    setAuthErrorMsg('⚠️ يرجى إدخال كود المدرسة (مثال: SCH-1 أو SCH-2 أو SCH-1234).');
    return;
  }
  if (!emailRaw || !emailRaw.includes('@')) {
    setAuthErrorMsg('⚠️ يرجى إدخال بريد إلكتروني صحيح للأستاذ.');
    return;
  }
  if (!passwordRaw) {
    setAuthErrorMsg('⚠️ يرجى إدخال كلمة المرور.');
    return;
  }

  if (!navigator.onLine || !cloudConfig.supabaseUrl || !cloudConfig.supabaseKey) {
    setAuthErrorMsg('⚠️ يلزم الاتصال بالإنترنت للتحقق من بيانات الدخول في خادم السحابة.');
    return;
  }

  const btn = document.getElementById('authSubmitBtn');
  if (btn) btn.disabled = true;
  setAuthErrorMsg('🔄 جاري التحقق من كود المدرسة وحساب الأستاذ في Supabase...', true);

  try {
    // أ. التحقق من كود المدرسة
    const school = await fetchSchoolFromSupabase(schoolCodeRaw);
    if (!school) {
      setAuthErrorMsg(`❌ كود المدرسة (${schoolCodeRaw}) غير مسجل في السحابة! تأكد من الكود المعتمد في جدول المدارس.`);
      if (btn) btn.disabled = false;
      return;
    }

    // ب. مصادقة حساب الأستاذ عبر Supabase Auth
    const authData = await loginTeacherWithSupabase(emailRaw, passwordRaw);
    const user = authData.user;
    const accessToken = authData.access_token;
    const refreshToken = authData.refresh_token;

    // ج. التحقق من قيود المدرسة وعزل البيانات
    await verifyAndBindTeacherSchool(user, accessToken, school, emailRaw);

    // د. إعداد الجلسة وبيانات النظام
    const displayTeacherName = user?.user_metadata?.name || user?.user_metadata?.full_name || emailRaw.split('@')[0];
    const userRole = user?.user_metadata?.role || 'معلم المادة';

    cloudConfig.schoolCode = school.school_code;
    cloudConfig.fullSchoolKey = school.school_code;
    cloudConfig.userName = `${displayTeacherName} (${emailRaw})`;
    cloudConfig.enabled = true;
    saveCloudConfig();

    if (school.name && (!appData.config.schoolName || appData.config.schoolName === 'مدرسة ميزان النموذجية')) {
      appData.config.schoolName = school.name;
      if (typeof syncStudentsWithSchoolGenderPolicy === 'function') syncStudentsWithSchoolGenderPolicy(true);
      if (typeof syncConfigUI === 'function') syncConfigUI();
    }

    const sessionObj = {
      schoolCode: school.school_code,
      schoolId: school.id,
      schoolName: school.name,
      email: emailRaw,
      teacherName: displayTeacherName,
      role: userRole,
      accessToken: accessToken,
      refreshToken: refreshToken,
      loggedInAt: new Date().toISOString()
    };

    saveActiveAuthSession(sessionObj, rememberMe);
    updateHeaderAuthBadge(sessionObj);
    hideAuthGateOverlay();

    if (typeof showToast === 'function') {
      showToast(`👋 أهلاً بك يا أستاذ (${displayTeacherName}) في إدارة: ${school.name}`, 'success');
    }

    // جلب أحدث شيتات ميزان لهذه المدرسة
    if (typeof pullFromCloud === 'function') {
      setTimeout(() => pullFromCloud(true), 400);
    }
  } catch (err) {
    const cleanMsg = (err.message || 'تعذر التحقق من الحساب.').replace('Error: ', '');
    setAuthErrorMsg(`❌ ${cleanMsg}`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// 5. استعادة كلمة المرور وإرسال رابط التعيين للبريد الرسمي للأستاذ
async function requestPasswordReset() {
  const emailInput = document.getElementById('authInputEmail');
  let email = (emailInput?.value || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    email = prompt('📧 أدخل البريد الإلكتروني الخاص بحسابك لتلقي رابط إعادة تعيين كلمة المرور:');
  }

  if (!email || !email.includes('@')) {
    alert('يرجى كتابة بريد إلكتروني صحيح.');
    return;
  }

  setAuthErrorMsg('🔄 جاري إرسال رابط تعيين كلمة المرور إلى بريدك...', true);

  try {
    const baseUrl = (cloudConfig.supabaseUrl || '').replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'apikey': cloudConfig.supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });

    if (res.ok) {
      setAuthErrorMsg(`📩 تم إرسال رابط تعيين كلمة المرور إلى (${email}).`, true);
      alert(`📩 تم إرسال رابط إعادة تعيين كلمة المرور إلى:\n${email}\n\nيرجى مراجعة بريدك الإلكتروني (الوارد أو الرسائل غير المرغوب فيها Spam) والضغط على الرابط لتحديد كلمة مرورك الجديدة.`);
    } else {
      const errData = await res.json();
      setAuthErrorMsg(`⚠️ تعذر الإرسال: ${errData.msg || errData.message || 'تأكد من صحة البريد'}`);
    }
  } catch (e) {
    setAuthErrorMsg('⚠️ حدث خطأ في الاتصال بالسيرفر لإرسال الرابط.');
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
  const passInp = document.getElementById('authInputPassword');
  if (passInp) passInp.value = '';
  setAuthErrorMsg('');
  showAuthGateOverlay();
}

// 6. التحقق التلقائي عند بدء التشغيل مع دعم أوفلاين الصارم
async function initAuthGateOnBoot() {
  const session = getActiveAuthSession();
  const urlParams = new URLSearchParams(window.location.search);
  const urlCloudCode = urlParams.get('cloud');

  if (urlCloudCode) {
    const codeInp = document.getElementById('authInputSchoolCode');
    if (codeInp) codeInp.value = urlCloudCode.trim().toUpperCase().replace(/\s+/g, '');
  }

  if (session && session.schoolCode && session.email && (!urlCloudCode || urlCloudCode.toUpperCase() === session.schoolCode.toUpperCase())) {
    cloudConfig.schoolCode = session.schoolCode;
    cloudConfig.fullSchoolKey = session.schoolCode;
    cloudConfig.userName = `${session.teacherName || session.email} (${session.email})`;
    updateHeaderAuthBadge(session);
    hideAuthGateOverlay();

    // التحقق بالخلفية إذا كان هناك إنترنت وتجديد التوكن
    if (navigator.onLine && cloudConfig.supabaseUrl && cloudConfig.supabaseKey && session.accessToken) {
      try {
        const baseUrl = cloudConfig.supabaseUrl.replace(/\/$/, '');
        const verifyRes = await fetch(`${baseUrl}/auth/v1/user`, {
          headers: {
            'apikey': cloudConfig.supabaseKey,
            'Authorization': `Bearer ${session.accessToken}`
          }
        });

        if (!verifyRes.ok && session.refreshToken) {
          // محاولة تجديد الجلسة بالـ refreshToken
          const refreshRes = await fetch(`${baseUrl}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: {
              'apikey': cloudConfig.supabaseKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: session.refreshToken })
          });
          if (refreshRes.ok) {
            const freshData = await refreshRes.json();
            session.accessToken = freshData.access_token;
            session.refreshToken = freshData.refresh_token;
            saveActiveAuthSession(session, true);
          } else {
            clearActiveAuthSession();
            updateHeaderAuthBadge(null);
            showAuthGateOverlay();
            setAuthErrorMsg('⚠️ انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.');
          }
        }
      } catch (e) {}
    }
  } else {
    showAuthGateOverlay();
  }
}

window.getActiveAuthSession = getActiveAuthSession;
window.toggleAuthPasswordVisibility = toggleAuthPasswordVisibility;
window.handleAuthGateSubmit = handleAuthGateSubmit;
window.requestPasswordReset = requestPasswordReset;
window.showAuthGateOverlay = showAuthGateOverlay;
window.hideAuthGateOverlay = hideAuthGateOverlay;
window.logoutFromMizan = logoutFromMizan;
window.initAuthGateOnBoot = initAuthGateOnBoot;
