/* ══════════════════════════════════════════════
   tasks-page.js — All Tasks page
   ══════════════════════════════════════════════ */

let allTasks   = [];
let allUsers   = [];
let editingId  = null;
let filterStatus   = '';
let filterPriority = '';
let filterAssignee = '';
let searchQuery    = '';

document.addEventListener('DOMContentLoaded', async () => {
  initUserUI();
  protectNewTaskBtn();
  await Promise.all([loadTasks(), loadUsers()]);
  renderTable();
  populateAssigneeDropdown();
  setDefaultDeadline();
});

async function loadTasks() {
  try { allTasks = await Tasks.getAll(); }
  catch (e) { showToast('Could not load tasks: ' + e.message, 'error'); }
}

async function loadUsers() {
  try { allUsers = await Users.getAll(); }
  catch (e) { /* non-critical */ }
}

// ── Filters ───────────────────────────────────
function setStatusFilter(status) {
  filterStatus = status;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderTable();
}

function applyFilters() {
  filterPriority = document.getElementById('priority-filter').value;
  filterAssignee = document.getElementById('assignee-filter').value;
  renderTable();
}

function filterTasks(q) {
  searchQuery = q.toLowerCase();
  renderTable();
}

function getFilteredTasks() {
  return allTasks.filter(t => {
    if (filterStatus   && t.status   !== filterStatus)   return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee && (!t.assignee || String(t.assignee.id) !== filterAssignee)) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery)
        && !(t.description || '').toLowerCase().includes(searchQuery)) return false;
    return true;
  });
}

// ── Table Rendering ───────────────────────────
function renderTable() {
  const tbody  = document.getElementById('task-tbody');
  const tasks  = getFilteredTasks();

  if (!tasks.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text3)">
      No tasks match your filters</td></tr>`;
    return;
  }

  tbody.innerHTML = tasks.map(t => {
    const assigneeName = t.assignee
      ? escHtml(t.assignee.fullName || t.assignee.username) : '—';
    const assigneeAvatar = t.assignee
      ? avatarHtml(getInitials(t.assignee.fullName || t.assignee.username),
          avatarColor(t.assignee.id)) : '';
    const urgentClass = t.overdue ? 'urgent' : (isUrgent(t.deadline) ? 'urgent' : '');

    return `<tr style="cursor:pointer" onclick="openDetailModal(${t.id})">
      <td>
        <div class="task-checkbox ${t.status === 'DONE' ? 'checked' : ''}"
             onclick="event.stopPropagation(); quickToggle(${t.id})">${t.status === 'DONE' ? '✓' : ''}</div>
      </td>
      <td class="task-title-cell" title="${escHtml(t.title)}">${escHtml(t.title)}</td>
      <td>${priorityBadge(t.priority)}</td>
      <td>${statusChip(t.status)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          ${assigneeAvatar}
          <span style="font-size:12px">${assigneeName}</span>
        </div>
      </td>
      <td>
        <span class="task-date ${urgentClass}" style="font-size:12px">
          ${t.deadline ? fmtDate(t.deadline) : '—'}
        </span>
      </td>
      <td onclick="event.stopPropagation()">
        <div style="display:flex;gap:4px">
          <button class="btn-icon" title="Edit" onclick="openTaskModal(${t.id})">✎</button>
          <button class="btn-icon" title="Delete" style="color:var(--red)"
                  onclick="deleteTask(${t.id})">✕</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── CRUD Actions ──────────────────────────────
async function quickToggle(id) {
  const task      = allTasks.find(t => t.id === id);
  if (!task) return;
  const newStatus = task.status === 'DONE' ? 'IN_PROGRESS' : 'DONE';
  try {
    const updated = await Tasks.updateStatus(id, newStatus);
    Object.assign(task, updated);
    renderTable();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function deleteTask(id) {
  if (!confirm('Delete this task? This cannot be undone.')) return;
  try {
    await Tasks.delete(id);
    allTasks = allTasks.filter(t => t.id !== id);
    renderTable();
    showToast('Task deleted.', 'success');
  } catch (e) {
    showToast('Delete failed: ' + e.message, 'error');
  }
}

// ── Modal (reused from dashboard.js pattern) ──
function openTaskModal(idOrObj = null) {
  const task = typeof idOrObj === 'number'
    ? allTasks.find(t => t.id === idOrObj)
    : idOrObj;

  editingId = task ? task.id : null;
  document.getElementById('modal-title').textContent = task ? 'Edit Task' : 'New Task';
  document.getElementById('task-title').value    = task ? task.title : '';
  document.getElementById('task-desc').value     = task ? (task.description || '') : '';
  document.getElementById('task-priority').value = task ? task.priority : 'MEDIUM';
  document.getElementById('task-status').value   = task ? task.status : 'TODO';
  document.getElementById('task-deadline').value = task && task.deadline ? task.deadline : '';
  document.getElementById('task-assignee').value = task && task.assignee ? task.assignee.id : '';

  document.getElementById('modal-backdrop').classList.add('open');
  document.getElementById('task-modal').classList.add('open');
}

function closeTaskModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
  document.getElementById('task-modal').classList.remove('open');
}

async function saveTask() {
  const title    = document.getElementById('task-title').value.trim();
  if (!title) { showToast('Title required', 'error'); return; }

  const body = {
    title,
    description: document.getElementById('task-desc').value.trim() || null,
    priority:    document.getElementById('task-priority').value,
    status:      document.getElementById('task-status').value,
    deadline:    document.getElementById('task-deadline').value || null,
    assigneeId:  document.getElementById('task-assignee').value
                   ? parseInt(document.getElementById('task-assignee').value) : null,
  };

  try {
    if (editingId) {
      const updated = await Tasks.update(editingId, body);
      const idx = allTasks.findIndex(t => t.id === editingId);
      if (idx !== -1) allTasks[idx] = updated;
      showToast('Task updated.', 'success');
    } else {
      const created = await Tasks.create(body);
      allTasks.unshift(created);
      showToast('Task created.', 'success');
    }
    closeTaskModal();
    renderTable();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ── Detail Modal ──────────────────────────────
async function openDetailModal(taskId) {
  document.getElementById('detail-backdrop').classList.add('open');
  document.getElementById('detail-modal').classList.add('open');
  const body = document.getElementById('detail-body');
  body.innerHTML = '<div class="loading-spinner">Loading…</div>';

  try {
    const [task, comments] = await Promise.all([
      Tasks.getById(taskId),
      Comments.getAll(taskId),
    ]);

    document.getElementById('detail-title').textContent = task.title;
    const user = currentUser();
    const canEdit = user && (user.role !== 'VIEWER');

    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-main">
          ${task.description ? `<div class="detail-section">
            <div class="detail-section-title">Description</div>
            <div class="detail-desc">${escHtml(task.description)}</div></div>` : ''}

          <div class="detail-section">
            <div class="detail-section-title">Comments (${comments.length})</div>
            <div class="comment-list" id="comment-list-${taskId}">
              ${comments.length ? comments.map(c => renderComment(c)).join('')
                : '<div style="color:var(--text3);font-size:12px">No comments yet</div>'}
            </div>
            <div class="comment-input-row" style="margin-top:12px">
              <input class="form-input" type="text" id="new-comment-${taskId}"
                     placeholder="Add a comment…"
                     onkeydown="if(event.key==='Enter') submitComment(${taskId})">
              <button class="btn-primary" onclick="submitComment(${taskId})">Send</button>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">Files</div>
            <div class="file-list" id="file-list-${taskId}">
              <div style="color:var(--text3);font-size:12px">No files attached</div>
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
              ${detailRow('Deadline', task.deadline ? fmtDate(task.deadline) : '—')}
              ${detailRow('Assignee', task.assignee
                ? escHtml(task.assignee.fullName || task.assignee.username) : 'Unassigned')}
              ${detailRow('Created',  fmtDate(task.createdAt))}
            </table>
          </div>
          ${canEdit ? `<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
            <button class="btn-secondary" style="width:100%;justify-content:center"
              onclick="closeDetailModal(); openTaskModal(${task.id})">✎ Edit</button>
            <button class="btn-danger" style="width:100%;justify-content:center"
              onclick="closeDetailModal(); deleteTask(${task.id})">✕ Delete</button>
          </div>` : ''}
        </div>
      </div>`;
  } catch (e) {
    body.innerHTML = `<div class="empty-state"><div style="color:var(--red)">${e.message}</div></div>`;
  }
}

function closeDetailModal() {
  document.getElementById('detail-backdrop').classList.remove('open');
  document.getElementById('detail-modal').classList.remove('open');
}

function detailRow(label, valueHtml) {
  return `<tr><td style="padding:6px 0;color:var(--text2)">${label}</td>
    <td style="padding:6px 0 6px 10px">${valueHtml}</td></tr>`;
}

function renderComment(c) {
  return `<div class="comment-item">
    <div class="comment-header">
      ${avatarHtml(getInitials(c.author ? (c.author.fullName || c.author.username) : '?'),
        avatarColor(c.author ? c.author.id : 0), 22)}
      <span class="comment-author">${escHtml(c.author ? (c.author.fullName || c.author.username) : '?')}</span>
      <span class="comment-time">${fmtDate(c.createdAt)}</span>
    </div>
    <div class="comment-content">${escHtml(c.content)}</div>
  </div>`;
}

async function submitComment(taskId) {
  const input = document.getElementById('new-comment-' + taskId);
  const content = input.value.trim();
  if (!content) return;
  try {
    const comment = await Comments.add(taskId, { content });
    const list = document.getElementById('comment-list-' + taskId);
    const placeholder = list.querySelector('[style*="No comments"]');
    if (placeholder) list.innerHTML = '';
    list.insertAdjacentHTML('afterbegin', renderComment(comment));
    input.value = '';
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function uploadFile(taskId, input) {
  const file = input.files[0];
  if (!file) return;
  try {
    await Files.upload(taskId, file);
    showToast('File uploaded: ' + file.name, 'success');
    openDetailModal(taskId);
  } catch (e) {
    showToast('Upload failed: ' + e.message, 'error');
  }
}

// ── Helpers ───────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function populateAssigneeDropdown() {
  const sel = document.getElementById('task-assignee');
  const af  = document.getElementById('assignee-filter');
  const opts = allUsers.map(u =>
    `<option value="${u.id}">${escHtml(u.fullName || u.username)}</option>`).join('');
  if (sel) sel.innerHTML = '<option value="">Unassigned</option>' + opts;
  if (af)  af.innerHTML  = '<option value="">All Members</option>' + opts;
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
  if (btn && user && user.role === 'VIEWER') {
    btn.disabled = true;
    btn.title    = 'Viewers cannot create tasks';
    btn.style.opacity = '.4';
    btn.style.cursor  = 'not-allowed';
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}
