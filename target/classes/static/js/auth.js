/* ══════════════════════════════════════════════
   auth.js — Authentication helpers
   ══════════════════════════════════════════════ */

// Redirect to dashboard if already logged in
(function guardAuth() {
  const path = window.location.pathname;
  const isAuthPage =
    path.endsWith('index.html') ||
    path.endsWith('register.html') ||
    path.endsWith('reset-password.html') ||
    path === '/';
  const token = localStorage.getItem('tf_token');

  if (token && isAuthPage) {
    window.location.href = '/dashboard.html';
  }
  if (!token && !isAuthPage) {
    window.location.href = '/index.html';
  }
})();

// ── Login ─────────────────────────────────────
async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errEl    = document.getElementById('error-msg');
  errEl.style.display = 'none';

  if (!username || !password) {
    errEl.textContent = 'Please enter email/username and password.';
    errEl.style.display = 'block';
    return;
  }

  try {
    const res = await Auth.login({ username, password });
    localStorage.setItem('tf_token',    res.token);
    localStorage.setItem('tf_user',     JSON.stringify(res));
    window.location.href = '/dashboard.html';
  } catch (e) {
    errEl.textContent = e.message || 'Invalid credentials.';
    errEl.style.display = 'block';
  }
}

// ── Register ──────────────────────────────────
async function register() {
  const fullName = document.getElementById('fullName').value.trim();
  const username = document.getElementById('username').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errEl    = document.getElementById('error-msg');
  const okEl     = document.getElementById('success-msg');
  errEl.style.display = 'none';
  okEl.style.display  = 'none';

  if (!username || !email || !password) {
    errEl.textContent = 'All fields are required.';
    errEl.style.display = 'block';
    return;
  }

  try {
    await Auth.register({ username, email, password, fullName });
    okEl.textContent = 'Account created! Redirecting to login…';
    okEl.style.display = 'block';
    setTimeout(() => (window.location.href = '/index.html'), 1800);
  } catch (e) {
    errEl.textContent = e.message || 'Registration failed.';
    errEl.style.display = 'block';
  }
}

// ── Logout ────────────────────────────────────
function logout() {
  localStorage.clear();
  window.location.href = '/index.html';
}

// ── Get current user from localStorage ────────
function currentUser() {
  try { return JSON.parse(localStorage.getItem('tf_user')); } catch { return null; }
}

// ── Bootstrap current-user UI in sidebar ──────
function initUserUI() {
  const user = currentUser();
  if (!user) return;

  const nameEl   = document.getElementById('user-name');
  const roleEl   = document.getElementById('user-role');
  const avatarEl = document.getElementById('user-avatar');

  if (nameEl)   nameEl.textContent   = user.fullName || user.username;
  if (roleEl)   roleEl.textContent   = user.role;
  if (avatarEl) avatarEl.textContent = getInitials(user.fullName || user.username);

  // Hide admin-only nav items for non-admins
  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    const rolesNav = document.getElementById('nav-roles');
    if (rolesNav) rolesNav.style.display = 'none';
  }
}

// Allow Enter key on auth forms
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const path = window.location.pathname;
  if (path.endsWith('index.html') || path === '/') login();
  if (path.endsWith('register.html')) register();
});
