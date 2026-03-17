/* ══════════════════════════════════════════════
   api.js — Centralised API layer
   All calls go through apiFetch() which:
     • Attaches Authorization: Bearer <token>
     • Parses JSON
     • Redirects to login on 401
   ══════════════════════════════════════════════ */

// Empty string = same origin (frontend and backend on same port 8080)
const API_BASE = '';

// ── Core Fetch Wrapper ────────────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('tf_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, { ...options, headers });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = '/index.html';
    return;
  }

  if (res.status === 204) return null; // No Content

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed: ' + res.status);
  return data;
}

// ── Auth ──────────────────────────────────────
const Auth = {
  login:    (body) => apiFetch('/api/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (body) => apiFetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword:  (body) => apiFetch('/api/auth/reset-password',  { method: 'POST', body: JSON.stringify(body) }),
};

// ── Tasks ─────────────────────────────────────
const Tasks = {
  getAll:        ()        => apiFetch('/api/tasks'),
  getMy:         ()        => apiFetch('/api/tasks/my'),
  getById:       (id)      => apiFetch('/api/tasks/' + id),
  search:        (q)       => apiFetch('/api/tasks/search?q=' + encodeURIComponent(q)),
  create:        (body)    => apiFetch('/api/tasks',          { method: 'POST',  body: JSON.stringify(body) }),
  update:        (id, body)=> apiFetch('/api/tasks/' + id,    { method: 'PUT',   body: JSON.stringify(body) }),
  updateStatus:  (id, s)   => apiFetch('/api/tasks/' + id + '/status?status=' + s, { method: 'PATCH' }),
  delete:        (id)      => apiFetch('/api/tasks/' + id,    { method: 'DELETE' }),
  report:        ()        => apiFetch('/api/tasks/reports'),
};

// ── Comments ──────────────────────────────────
const Comments = {
  getAll:  (taskId)        => apiFetch('/api/tasks/' + taskId + '/comments'),
  add:     (taskId, body)  => apiFetch('/api/tasks/' + taskId + '/comments', { method: 'POST', body: JSON.stringify(body) }),
  delete:  (taskId, cid)   => apiFetch('/api/tasks/' + taskId + '/comments/' + cid, { method: 'DELETE' }),
};

// ── Files ─────────────────────────────────────
const Files = {
  upload: (taskId, file) => {
    const token = localStorage.getItem('tf_token');
    const fd = new FormData();
    fd.append('file', file);
    return fetch(API_BASE + '/api/tasks/' + taskId + '/files', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: fd,
    }).then(r => r.json());
  },
  delete:  (fileId) => apiFetch('/api/files/' + fileId, { method: 'DELETE' }),
  downloadUrl: (fileId) => API_BASE + '/api/files/' + fileId + '/download',
};

// ── Users ─────────────────────────────────────
const Users = {
  getAll:       ()             => apiFetch('/api/users'),
  getById:      (id)           => apiFetch('/api/users/' + id),
  updateRole:   (id, role)     => apiFetch('/api/users/' + id + '/role?role=' + role, { method: 'PATCH' }),
  toggleActive: (id)           => apiFetch('/api/users/' + id + '/toggle-active', { method: 'PATCH' }),
};

// ── Toast helper ──────────────────────────────
function showToast(message, type = 'info') {
  let wrap = document.getElementById('toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toast-wrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = message;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3800);
}

// ── Format helpers ────────────────────────────
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function isUrgent(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(Date.now() + 3 * 86400000);
}

function priorityBadge(p) {
  const map = { CRITICAL: 'badge-critical', HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' };
  return `<span class="badge ${map[p] || 'badge-medium'}">${p}</span>`;
}

function statusChip(s) {
  return `<span class="status-chip status-${s}">${s.replace('_', ' ')}</span>`;
}

function roleBadge(r) {
  return `<span class="role-chip role-${r}">${r}</span>`;
}

function avatarHtml(initials, color, size = 28) {
  return `<div class="mini-avatar" style="background:${color};width:${size}px;height:${size}px;font-size:${Math.floor(size*0.38)}px">${initials}</div>`;
}

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#6e40c9','#1f6feb','#1a7f37','#b45309','#0e7490','#be185d','#7c3aed'];
function avatarColor(id) {
  return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
}

function fileSizeFmt(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
