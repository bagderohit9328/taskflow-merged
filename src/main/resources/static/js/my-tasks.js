/* ══════════════════════════════════════════════
   my-tasks.js — My Tasks page
   ══════════════════════════════════════════════ */

let myTasks    = [];
let tabFilter  = '';
let searchQ    = '';

document.addEventListener('DOMContentLoaded', async () => {
    initUserUI();
    await loadMyTasks();
    renderStats();
    renderList();
});

async function loadMyTasks() {
    try {
        myTasks = await Tasks.getMy();
    } catch (e) {
        showToast('Could not load tasks: ' + e.message, 'error');
    }
}

// ── Stats ─────────────────────────────────────
function renderStats() {
    const total    = myTasks.length;
    const progress = myTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const done     = myTasks.filter(t => t.status === 'DONE').length;
    const overdue  = myTasks.filter(t => t.overdue).length;

    document.getElementById('ms-total').textContent    = total;
    document.getElementById('ms-progress').textContent = progress;
    document.getElementById('ms-done').textContent     = done;
    document.getElementById('ms-overdue').textContent  = overdue;
}

// ── Filters ───────────────────────────────────
function setTab(btn, status) {
    tabFilter = status;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderList();
}

function filterTasks(q) {
    searchQ = q.toLowerCase();
    renderList();
}

function filtered() {
    return myTasks.filter(t => {
        if (tabFilter && t.status !== tabFilter) return false;
        if (searchQ && !t.title.toLowerCase().includes(searchQ)) return false;
        return true;
    });
}

// ── Render grouped list ───────────────────────
function renderList() {
    const container = document.getElementById('my-task-list');
    const tasks     = filtered();

    if (!tasks.length) {
        container.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">✓</div>
      <div class="empty-state-text">No tasks found</div>
    </div>`;
        return;
    }

    // Group by priority when showing all, else flat list
    if (!tabFilter) {
        const groups = [
            { label: 'Critical', key: 'CRITICAL', color: 'var(--red)' },
            { label: 'High',     key: 'HIGH',     color: 'var(--amber)' },
            { label: 'Medium',   key: 'MEDIUM',   color: 'var(--blue)' },
            { label: 'Low',      key: 'LOW',      color: 'var(--green)' },
        ];

        container.innerHTML = groups.map(g => {
            const group = tasks.filter(t => t.priority === g.key);
            if (!group.length) return '';
            return `
        <div style="margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <div style="width:3px;height:16px;background:${g.color};border-radius:2px"></div>
            <span style="font-size:12px;font-weight:600;color:var(--text2);text-transform:uppercase;
                         letter-spacing:.06em">${g.label}</span>
            <span style="font-size:11px;color:var(--text3)">${group.length}</span>
          </div>
          <div class="panel">
            <div class="panel-body" style="padding:4px 20px">
              ${group.map(t => taskRow(t)).join('')}
            </div>
          </div>
        </div>`;
        }).join('');
    } else {
        container.innerHTML = `<div class="panel">
      <div class="panel-body" style="padding:4px 20px">
        ${tasks.map(t => taskRow(t)).join('')}
      </div>
    </div>`;
    }
}

function taskRow(t) {
    const urgentCls = t.overdue || isUrgent(t.deadline) ? 'urgent' : '';
    return `
    <div class="task-item" onclick="openDetailModal(${t.id})">
      <div class="task-checkbox ${t.status === 'DONE' ? 'checked' : ''}"
           onclick="event.stopPropagation(); toggleDone(${t.id})">${t.status === 'DONE' ? '✓' : ''}</div>
      <div class="task-body">
        <div class="task-name ${t.status === 'DONE' ? 'done' : ''}">${escHtml(t.title)}</div>
        <div class="task-meta">
          ${priorityBadge(t.priority)}
          ${statusChip(t.status)}
          ${t.deadline
        ? `<span class="task-date ${urgentCls}">📅 ${fmtDate(t.deadline)}</span>`
        : ''}
          ${t.commentCount > 0
        ? `<span style="font-size:11px;color:var(--text3)">💬 ${t.commentCount}</span>`
        : ''}
        </div>
      </div>
    </div>`;
}

// ── Toggle done ───────────────────────────────
async function toggleDone(id) {
    const task = myTasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'DONE' ? 'IN_PROGRESS' : 'DONE';
    try {
        const updated = await Tasks.updateStatus(id, newStatus);
        Object.assign(task, updated);
        renderStats();
        renderList();
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
            <div class="comment-list" id="clist-${taskId}">
              ${comments.length
            ? comments.map(c => commentHtml(c)).join('')
            : '<div style="color:var(--text3);font-size:12px">No comments yet</div>'}
            </div>
            <div class="comment-input-row" style="margin-top:12px">
              <input class="form-input" type="text" id="ci-${taskId}"
                     placeholder="Add a comment…"
                     onkeydown="if(event.key==='Enter') submitComment(${taskId})">
              <button class="btn-primary" onclick="submitComment(${taskId})">Send</button>
            </div>
          </div>
        </div>
 
        <div class="detail-sidebar">
          <div class="detail-section">
            <div class="detail-section-title">Details</div>
            <table style="width:100%;font-size:12px;border-collapse:collapse">
              ${dRow('Status',   statusChip(task.status))}
              ${dRow('Priority', priorityBadge(task.priority))}
              ${dRow('Deadline', task.deadline
            ? `<span class="${task.overdue ? 'urgent' : ''}">${fmtDate(task.deadline)}</span>`
            : '—')}
              ${dRow('Created by', task.createdBy
            ? escHtml(task.createdBy.fullName || task.createdBy.username) : '—')}
            </table>
          </div>
          <div style="margin-top:12px">
            <div class="detail-section-title" style="margin-bottom:8px">Quick Update</div>
            <select class="form-input" onchange="quickStatus(${taskId}, this.value)">
              <option value="">Change status…</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
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

function dRow(label, val) {
    return `<tr>
    <td style="padding:6px 0;color:var(--text2)">${label}</td>
    <td style="padding:6px 0 6px 10px">${val}</td>
  </tr>`;
}

function commentHtml(c) {
    return `<div class="comment-item">
    <div class="comment-header">
      ${avatarHtml(getInitials(c.author ? (c.author.fullName||c.author.username) : '?'),
        avatarColor(c.author ? c.author.id : 0), 22)}
      <span class="comment-author">${escHtml(c.author ? (c.author.fullName||c.author.username) : '?')}</span>
      <span class="comment-time">${fmtDate(c.createdAt)}</span>
    </div>
    <div class="comment-content">${escHtml(c.content)}</div>
  </div>`;
}

async function submitComment(taskId) {
    const input = document.getElementById('ci-' + taskId);
    const content = input.value.trim();
    if (!content) return;
    try {
        const comment = await Comments.add(taskId, { content });
        const list = document.getElementById('clist-' + taskId);
        if (list.querySelector('[style*="No comments"]')) list.innerHTML = '';
        list.insertAdjacentHTML('afterbegin', commentHtml(comment));
        input.value = '';
        const t = myTasks.find(t => t.id === taskId);
        if (t) { t.commentCount = (t.commentCount || 0) + 1; }
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function quickStatus(taskId, status) {
    if (!status) return;
    try {
        const updated = await Tasks.updateStatus(taskId, status);
        const t = myTasks.find(t => t.id === taskId);
        if (t) Object.assign(t, updated);
        renderStats();
        renderList();
        showToast('Status updated to ' + status.replace('_',' '), 'success');
        closeDetailModal();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// ── Helpers ───────────────────────────────────
function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
