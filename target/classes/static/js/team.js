/* ══════════════════════════════════════════════
   team.js — Team page
   ══════════════════════════════════════════════ */

let allUsers  = [];
let allTasks  = [];
let searchQ   = '';

document.addEventListener('DOMContentLoaded', async () => {
    initUserUI();
    await Promise.all([loadUsers(), loadTasks()]);
    renderStats();
    renderCards();
});

async function loadUsers() {
    try { allUsers = await Users.getAll(); }
    catch (e) { showToast('Could not load team: ' + e.message, 'error'); }
}

async function loadTasks() {
    try { allTasks = await Tasks.getAll(); }
    catch (e) { /* non-critical */ }
}

// ── Stats ─────────────────────────────────────
function renderStats() {
    const active = allTasks.filter(t => t.status !== 'DONE').length;
    const done   = allTasks.filter(t => t.status === 'DONE').length;
    const rate   = allTasks.length ? Math.round(done / allTasks.length * 100) : 0;

    document.getElementById('ts-members').textContent = allUsers.length;
    document.getElementById('ts-active').textContent  = active;
    document.getElementById('ts-rate').textContent    = rate + '%';
}

// ── Member Cards ──────────────────────────────
function filterMembers(q) {
    searchQ = q.toLowerCase();
    renderCards();
}

function renderCards() {
    const container = document.getElementById('member-cards');
    const users = allUsers.filter(u =>
        !searchQ ||
        (u.fullName || '').toLowerCase().includes(searchQ) ||
        u.username.toLowerCase().includes(searchQ) ||
        u.email.toLowerCase().includes(searchQ)
    );

    if (!users.length) {
        container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">◈</div>
      <div class="empty-state-text">No members found</div>
    </div>`;
        return;
    }

    container.innerHTML = users.map(u => {
        const uTasks  = allTasks.filter(t => t.assignee && t.assignee.id === u.id);
        const uDone   = uTasks.filter(t => t.status === 'DONE').length;
        const uActive = uTasks.filter(t => t.status === 'IN_PROGRESS').length;
        const pct     = uTasks.length ? Math.round(uDone / uTasks.length * 100) : 0;
        const color   = avatarColor(u.id);
        const initials = getInitials(u.fullName || u.username);

        return `
      <div class="panel" style="cursor:pointer;transition:border-color .15s"
           onclick="openMemberPanel(${u.id})"
           onmouseenter="this.style.borderColor='var(--border3)'"
           onmouseleave="this.style.borderColor='var(--border2)'">
        <div class="panel-body">
          <!-- Header -->
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
            <div style="width:52px;height:52px;border-radius:50%;background:${color};
                        display:flex;align-items:center;justify-content:center;
                        font-size:18px;font-weight:700;color:#fff;flex-shrink:0">
              ${initials}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:14px;font-weight:600;white-space:nowrap;
                          overflow:hidden;text-overflow:ellipsis">
                ${escHtml(u.fullName || u.username)}
              </div>
              <div style="font-size:12px;color:var(--text2);margin-top:2px">
                ${escHtml(u.email)}
              </div>
            </div>
            ${roleBadge(u.role)}
          </div>
 
          <!-- Task counts -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);
                      gap:8px;margin-bottom:14px;text-align:center">
            ${miniStat('Assigned', uTasks.length, 'var(--blue)')}
            ${miniStat('Active', uActive, 'var(--amber)')}
            ${miniStat('Done', uDone, 'var(--green)')}
          </div>
 
          <!-- Progress bar -->
          <div>
            <div class="progress-label">
              <span style="font-size:11px">Completion</span>
              <span style="font-size:11px">${pct}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
            </div>
          </div>
 
          <!-- Status indicator -->
          <div style="margin-top:12px;display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;
                        background:${u.active ? 'var(--green)' : 'var(--text3)'}"></div>
            <span style="font-size:11px;color:var(--text2)">${u.active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>`;
    }).join('');
}

function miniStat(label, val, color) {
    return `<div style="background:var(--bg3);border-radius:var(--radius);padding:8px 4px">
    <div style="font-size:16px;font-weight:700;color:${color}">${val}</div>
    <div style="font-size:10px;color:var(--text3);margin-top:2px">${label}</div>
  </div>`;
}

// ── Member Detail Panel ───────────────────────
async function openMemberPanel(userId) {
    document.getElementById('member-backdrop').classList.add('open');
    document.getElementById('member-modal').classList.add('open');
    const body = document.getElementById('member-modal-body');
    body.innerHTML = '<div class="loading-spinner">Loading…</div>';

    const u = allUsers.find(u => u.id === userId);
    if (!u) return;

    document.getElementById('member-modal-title').textContent =
        u.fullName || u.username;

    const uTasks  = allTasks.filter(t => t.assignee && t.assignee.id === u.id);
    const uDone   = uTasks.filter(t => t.status === 'DONE').length;
    const color   = avatarColor(u.id);
    const pct     = uTasks.length ? Math.round(uDone / uTasks.length * 100) : 0;

    body.innerHTML = `
    <!-- Profile header -->
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;
                padding-bottom:20px;border-bottom:1px solid var(--border)">
      <div style="width:64px;height:64px;border-radius:50%;background:${color};
                  display:flex;align-items:center;justify-content:center;
                  font-size:22px;font-weight:700;color:#fff">
        ${getInitials(u.fullName || u.username)}
      </div>
      <div>
        <div style="font-size:16px;font-weight:600">${escHtml(u.fullName || u.username)}</div>
        <div style="font-size:13px;color:var(--text2)">${escHtml(u.email)}</div>
        <div style="margin-top:6px;display:flex;gap:8px;align-items:center">
          ${roleBadge(u.role)}
          <span style="font-size:11px;color:${u.active ? 'var(--green)' : 'var(--text3)'}">
            ● ${u.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
 
    <!-- Performance summary -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
      ${miniStat('Total', uTasks.length, 'var(--blue)')}
      ${miniStat('Done', uDone, 'var(--green)')}
      ${miniStat('Rate', pct + '%', color)}
    </div>
 
    <!-- Assigned tasks list -->
    <div style="font-size:11px;font-weight:600;color:var(--text2);text-transform:uppercase;
                letter-spacing:.06em;margin-bottom:10px">
      Assigned Tasks (${uTasks.length})
    </div>
    <div style="max-height:260px;overflow-y:auto">
      ${uTasks.length
        ? uTasks.map(t => `
          <div style="display:flex;align-items:center;gap:10px;padding:9px 0;
                      border-bottom:1px solid var(--border)">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500;white-space:nowrap;
                          overflow:hidden;text-overflow:ellipsis;
                          ${t.status === 'DONE' ? 'text-decoration:line-through;color:var(--text2)' : ''}">
                ${escHtml(t.title)}
              </div>
              <div style="display:flex;gap:6px;margin-top:4px;align-items:center">
                ${priorityBadge(t.priority)}
                ${t.deadline
            ? `<span style="font-size:11px;color:${t.overdue ? 'var(--red)' : 'var(--text3)'}">
                      📅 ${fmtDate(t.deadline)}</span>`
            : ''}
              </div>
            </div>
            ${statusChip(t.status)}
          </div>`).join('')
        : '<div style="color:var(--text3);font-size:12px;padding:12px 0">No tasks assigned</div>'}
    </div>`;
}

function closeMemberPanel() {
    document.getElementById('member-backdrop').classList.remove('open');
    document.getElementById('member-modal').classList.remove('open');
}

// ── Helpers ───────────────────────────────────
function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
