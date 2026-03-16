/* ══════════════════════════════════════════════
   dashboard.js — Dashboard page logic
   ══════════════════════════════════════════════ */

let allTasks  = [];
let allUsers  = [];
let editingId = null;

// ── Bootstrap ─────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initUserUI();
  await Promise.all([loadTasks(), loadUsers()]);
  renderStats();
  renderTaskList();
  renderProgress();
  renderTeamSnapshot();
  populateAssigneeDropdown();
  setDefaultDeadline();
  protectNewTaskBtn();
});

// ── Data Loading ──────────────────────────────
async function loadTasks() {
  try { allTasks = await Tasks.getAll(); }
  catch (e) { showToast('Could not load tasks: ' + e.message, 'error'); }
}

async function loadUsers() {
  try { allUsers = await Users.getAll(); }
  catch (e) { /* non-critical */ }
}

// ── Stats ─────────────────────────────────────
function renderStats() {
  const total    = allTasks.length;
  const done     = allTasks.filter(t => t.status === 'DONE').length;
  const progress = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const overdue  = allTasks.filter(t => t.overdue).length;

  document.getElementById('stat-total').textContent   = total;
  document.getElementById('stat-done').textContent    = done;
  document.getElementById('stat-progress').textContent= progress;
  document.getElementById('stat-overdue').textContent = overdue;

  const badge = document.getElementById('badge-tasks');
  if (badge) badge.textContent = total;
}

// ── Task List ─────────────────────────────────
function renderTaskList(tasks) {
  const container = document.getElementById('task-list-container');
  const list = tasks || allTasks.filter(t => t.status !== 'DONE').slice(0, 8);

  if (!list.length) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">✓</div>
      <div class="empty-state-text">No active tasks found</div>
    </div>`;
    return;
  }

  container.innerHTML = list.map(task => `
    <div class="task-item" onclick="openDetailModal(${task.id})">
      <div class="task-checkbox ${task.status === 'DONE' ? 'checked' : ''}"
           onclick="event.stopPropagation(); toggleTaskDone(${task.id}, this)">${task.status === 'DONE' ? '✓' : ''}</div>
      <div class="task-body">
        <div class="task-name ${task.status === 'DONE' ? 'done' : ''}">${escHtml(task.title)}</div>
        <div class="task-meta">
          ${priorityBadge(task.priority)}
          ${statusChip(task.status)}
          ${task.assignee ? `<span style="display:flex;align-items:center;gap:4px">
            ${avatarHtml(getInitials(task.assignee.fullName || task.assignee.username),
              avatarColor(task.assignee.id))}
            <span style="font-size:11px;color:var(--text2)">${escHtml(task.assignee.fullName || task.assignee.username)}</span>
          </span>` : ''}
          ${task.deadline ? `<span class="task-date ${task.overdue || isUrgent(task.deadline) ? 'urgent' : ''}">📅 ${fmtDate(task.deadline)}</span>` : ''}
          ${task.commentCount > 0 ? `<span style="font-size:11px;color:var(--text3)">💬 ${task.commentCount}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// ── Progress ──────────────────────────────────
function renderProgress() {
  const container = document.getElementById('progress-container');
  const total     = allTasks.length || 1;

  const byStatus = ['TODO','IN_PROGRESS','IN_REVIEW','DONE'].map(s => ({
    label: s.replace('_', ' '),
    count: allTasks.filter(t => t.status === s).length,
    color: { TODO:'var(--text3)', IN_PROGRESS:'var(--blue)', IN_REVIEW:'var(--purple)', DONE:'var(--green)' }[s],
  }));

  container.innerHTML = byStatus.map(s => `
    <div class="progress-row">
      <div class="progress-label">
        <span>${s.label}</span>
        <span>${s.count} / ${total}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${Math.round(s.count/total*100)}%;background:${s.color}"></div>
      </div>
    </div>
  `).join('');
}

// ── Team Snapshot ─────────────────────────────
function renderTeamSnapshot() {
  const container = document.getElementById('team-snapshot');
  if (!allUsers.length) {
    container.innerHTML = `<div class="empty-state-text" style="color:var(--text3);font-size:12px">No team members loaded</div>`;
    return;
  }

  container.innerHTML = allUsers.slice(0, 4).map(u => {
    const utasks = allTasks.filter(t => t.assignee && t.assignee.id === u.id);
    const udone  = utasks.filter(t => t.status === 'DONE').length;
    const pct    = utasks.length ? Math.round(udone / utasks.length * 100) : 0;
    const color  = avatarColor(u.id);
    return `
      <div class="member-row">
        ${avatarHtml(getInitials(u.fullName || u.username), color, 32)}
        <div class="member-info">
          <div class="member-name">${escHtml(u.fullName || u.username)}</div>
          <div class="member-sub">${udone}/${utasks.length} tasks done</div>
          <div class="progress-track" style="margin-top:4px">
            <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
          </div>
        </div>
        ${roleBadge(u.role)}
      </div>`;
  }).join('');
}

// ── Search ────────────────────────────────────
let searchTimer;
function handleSearch(q) {
  clearTimeout(searchTimer);
  if (!q.trim()) {
    renderTaskList();
    return;
  }
  searchTimer = setTimeout(async () => {
    try {
      const results = await Tasks.search(q);
      renderTaskList(results);
    } catch {
      renderTaskList(allTasks.filter(t =>
        t.title.toLowerCase().includes(q.toLowerCase())));
    }
  }, 320);
}

// ── Toggle Done ───────────────────────────────
async function toggleTaskDone(id, checkEl) {
  const task = allTasks.find(t => t.id === id);
  if (!task) return;
  const newStatus = task.status === 'DONE' ? 'IN_PROGRESS' : 'DONE';
  try {
    const updated = await Tasks.updateStatus(id, newStatus);
    Object.assign(task, updated);
    renderStats();
    renderTaskList();
    renderProgress();
  } catch (e) {
    showToast('Failed to update status: ' + e.message, 'error');
  }
}

// ── Task Modal (Create / Edit) ─────────────────
function openTaskModal(task = null) {
  editingId = task ? task.id : null;
  document.getElementById('modal-title').textContent = task ? 'Edit Task' : 'New Task';
  document.getElementById('task-title').value    = task ? task.title    : '';
  document.getElementById('task-desc').value     = task ? (task.description || '') : '';
  document.getElementById('task-priority').value = task ? task.priority : 'MEDIUM';
  document.getElementById('task-status').value   = task ? task.status   : 'TODO';
  document.getElementById('task-deadline').value = task && task.deadline ? task.deadline : '';
  document.getElementById('task-assignee').value = task && task.assignee ? task.assignee.id : '';

  document.getElementById('modal-backdrop').classList.add('open');
  document.getElementById('task-modal').classList.add('open');
  document.getElementById('task-title').focus();
}

function closeTaskModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
  document.getElementById('task-modal').classList.remove('open');
}

async function saveTask() {
  const title    = document.getElementById('task-title').value.trim();
  const desc     = document.getElementById('task-desc').value.trim();
  const priority = document.getElementById('task-priority').value;
  const status   = document.getElementById('task-status').value;
  const deadline = document.getElementById('task-deadline').value;
  const assigneeId = document.getElementById('task-assignee').value;

  if (!title) {
    showToast('Task title is required.', 'error');
    document.getElementById('task-title').focus();
    return;
  }

  const body = {
    title, description: desc || null, priority, status,
    deadline: deadline || null,
    assigneeId: assigneeId ? parseInt(assigneeId) : null,
  };

  try {
    if (editingId) {
      const updated = await Tasks.update(editingId, body);
      const idx = allTasks.findIndex(t => t.id === editingId);
      if (idx !== -1) allTasks[idx] = updated;
      showToast('Task updated successfully.', 'success');
    } else {
      const created = await Tasks.create(body);
      allTasks.unshift(created);
      showToast('Task created successfully.', 'success');
    }
    closeTaskModal();
    renderStats();
    renderTaskList();
    renderProgress();
  } catch (e) {
    showToast('Failed to save task: ' + e.message, 'error');
  }
}

// ── Task Detail Modal ─────────────────────────
async function openDetailModal(taskId) {
  document.getElementById('detail-backdrop').classList.add('open');
  document.getElementById('detail-modal').classList.add('open');
  const body = document.getElementById('detail-body');
  body.innerHTML = '<div class="loading-spinner">Loading task details…</div>';

  try {
    const [task, comments] = await Promise.all([
      Tasks.getById(taskId),
      Comments.getAll(taskId),
    ]);

    document.getElementById('detail-title').textContent = task.title;

    const user = currentUser();
    const canEdit = user && (user.role === 'ADMIN' || user.role === 'EDITOR');

    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-main">
          ${task.description ? `
            <div class="detail-section">
              <div class="detail-section-title">Description</div>
              <div class="detail-desc">${escHtml(task.description)}</div>
            </div>` : ''}

          <div class="detail-section">
            <div class="detail-section-title">Comments (${comments.length})</div>
            <div class="comment-list" id="comment-list-${taskId}">
              ${comments.length ? comments.map(c => renderComment(c)).join('') :
                '<div style="color:var(--text3);font-size:12px">No comments yet</div>'}
            </div>
            <div class="comment-input-row" style="margin-top:12px">
              <input class="form-input" type="text" id="new-comment-${taskId}"
                     placeholder="Add a comment…"
                     onkeydown="if(event.key==='Enter') submitComment(${taskId})">
              <button class="btn-primary" onclick="submitComment(${taskId})">Send</button>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">Files (${task.fileCount})</div>
            <div class="file-list" id="file-list-${taskId}">
              ${task.files && task.files.length ? task.files.map(f => renderFile(f)).join('') :
                '<div style="color:var(--text3);font-size:12px">No files attached</div>'}
            </div>
            <label class="btn-secondary" style="margin-top:10px;cursor:pointer">
              📎 Attach File
              <input type="file" style="display:none" onchange="uploadFile(${taskId}, this)">
            </label>
          </div>
        </div>

        <div class="detail-sidebar">
          <div class="detail-section">
            <div class="detail-section-title">Details</div>
            <table style="width:100%;font-size:12px;border-collapse:collapse">
              ${detailRow('Status',   statusChip(task.status))}
              ${detailRow('Priority', priorityBadge(task.priority))}
              ${detailRow('Deadline', task.deadline
                ? `<span class="${task.overdue ? 'urgentColor' : ''}">${fmtDate(task.deadline)}</span>`
                : '—')}
              ${detailRow('Assignee', task.assignee
                ? escHtml(task.assignee.fullName || task.assignee.username) : 'Unassigned')}
              ${detailRow('Created by', task.createdBy
                ? escHtml(task.createdBy.fullName || task.createdBy.username) : '—')}
              ${detailRow('Created', fmtDate(task.createdAt))}
            </table>
          </div>
          ${canEdit ? `
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
              <button class="btn-secondary" style="width:100%;justify-content:center"
                      onclick="closeDetailModal(); openTaskModal(${JSON.stringify(task).replace(/"/g,'&quot;')})">
                ✎ Edit Task
              </button>
              <select class="form-input" onchange="quickStatus(${taskId}, this.value)">
                <option value="">Change Status…</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>` : ''}
        </div>
      </div>`;
  } catch (e) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state-text" style="color:var(--red)">${e.message}</div></div>`;
  }
}

function closeDetailModal() {
  document.getElementById('detail-backdrop').classList.remove('open');
  document.getElementById('detail-modal').classList.remove('open');
}

function detailRow(label, valueHtml) {
  return `<tr>
    <td style="padding:6px 0;color:var(--text2);vertical-align:top">${label}</td>
    <td style="padding:6px 0 6px 10px;vertical-align:top">${valueHtml}</td>
  </tr>`;
}

function renderComment(c) {
  const initials = getInitials(c.author ? (c.author.fullName || c.author.username) : '?');
  const color    = avatarColor(c.author ? c.author.id : 0);
  return `
    <div class="comment-item">
      <div class="comment-header">
        ${avatarHtml(initials, color, 22)}
        <span class="comment-author">${escHtml(c.author ? (c.author.fullName || c.author.username) : 'Unknown')}</span>
        <span class="comment-time">${fmtDate(c.createdAt)}</span>
      </div>
      <div class="comment-content">${escHtml(c.content)}</div>
    </div>`;
}

function renderFile(f) {
  return `
    <div class="file-item">
      <span>📄</span>
      <span class="file-name">${escHtml(f.originalName || f.storedName || 'File')}</span>
      <span class="file-size">${fileSizeFmt(f.fileSize)}</span>
      <a href="${Files.downloadUrl(f.id)}" target="_blank" class="btn-icon" title="Download">↓</a>
    </div>`;
}

async function submitComment(taskId) {
  const input   = document.getElementById('new-comment-' + taskId);
  const content = input.value.trim();
  if (!content) return;

  try {
    const comment = await Comments.add(taskId, { content });
    const list    = document.getElementById('comment-list-' + taskId);
    if (list.querySelector('[style*="No comments"]')) list.innerHTML = '';
    list.insertAdjacentHTML('afterbegin', renderComment(comment));
    input.value = '';
    // Update comment count in task list
    const task = allTasks.find(t => t.id === taskId);
    if (task) { task.commentCount = (task.commentCount || 0) + 1; renderTaskList(); }
  } catch (e) {
    showToast('Failed to add comment: ' + e.message, 'error');
  }
}

async function uploadFile(taskId, input) {
  const file = input.files[0];
  if (!file) return;
  try {
    await Files.upload(taskId, file);
    showToast('File uploaded: ' + file.name, 'success');
    // Refresh detail modal
    openDetailModal(taskId);
  } catch (e) {
    showToast('Upload failed: ' + e.message, 'error');
  }
}

async function quickStatus(taskId, status) {
  if (!status) return;
  try {
    const updated = await Tasks.updateStatus(taskId, status);
    const idx = allTasks.findIndex(t => t.id === taskId);
    if (idx !== -1) allTasks[idx] = updated;
    renderStats();
    renderTaskList();
    renderProgress();
    showToast('Status updated to ' + status.replace('_', ' '), 'success');
    closeDetailModal();
  } catch (e) {
    showToast('Failed: ' + e.message, 'error');
  }
}

// ── Helpers ───────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function populateAssigneeDropdown() {
  const sel = document.getElementById('task-assignee');
  if (!sel) return;
  sel.innerHTML = '<option value="">Unassigned</option>' +
    allUsers.map(u => `<option value="${u.id}">${escHtml(u.fullName || u.username)}</option>`).join('');
}

function setDefaultDeadline() {
  const dl = document.getElementById('task-deadline');
  if (!dl) return;
  const d = new Date(); d.setDate(d.getDate() + 7);
  dl.value = d.toISOString().split('T')[0];
}

function protectNewTaskBtn() {
  const user = currentUser();
  const btn  = document.getElementById('btn-new-task');
  if (!btn) return;
  if (user && user.role === 'VIEWER') {
    btn.disabled = true;
    btn.title    = 'Viewers cannot create tasks';
    btn.style.opacity = '.4';
    btn.style.cursor  = 'not-allowed';
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}
