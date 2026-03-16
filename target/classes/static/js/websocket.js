/* ══════════════════════════════════════════════
   websocket.js — Real-time WebSocket via STOMP
   ══════════════════════════════════════════════ */

let stompClient = null;

function connectWebSocket() {
  const token = localStorage.getItem('tf_token');
  if (!token) return;

  const user = currentUser();
  if (!user) return;

  try {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.debug = null; // Silence debug logs in console

    stompClient.connect(
      { Authorization: 'Bearer ' + token },
      (frame) => {
        console.log('WebSocket connected');

        // ── Subscribe: Global task updates ────────
        stompClient.subscribe('/topic/tasks', (msg) => {
          const data = JSON.parse(msg.body);
          handleTaskUpdate(data);
        });

        // ── Subscribe: Personal notifications ─────
        stompClient.subscribe('/user/queue/notifications', (msg) => {
          const data = JSON.parse(msg.body);
          handlePersonalNotification(data);
        });

        // ── Subscribe: Comment updates for open tasks
        subscribeToOpenTaskComments();
      },
      (error) => {
        console.warn('WebSocket error, will retry in 5s:', error);
        setTimeout(connectWebSocket, 5000);
      }
    );
  } catch (e) {
    console.warn('WebSocket init failed:', e.message);
  }
}

// ── Event Handlers ────────────────────────────

function handleTaskUpdate(data) {
  switch (data.type) {
    case 'STATUS_CHANGED':
      showToast(`Task "${data.title}" moved to ${String(data.status).replace('_', ' ')}`, 'info');
      // Refresh task list silently
      Tasks.getAll().then(tasks => {
        allTasks = tasks;
        if (typeof renderStats    === 'function') renderStats();
        if (typeof renderTaskList === 'function') renderTaskList();
        if (typeof renderProgress === 'function') renderProgress();
      }).catch(() => {});
      break;

    case 'TASK_DELETED':
      showToast(`A task was deleted`, 'info');
      break;
  }
}

function handlePersonalNotification(data) {
  switch (data.type) {
    case 'TASK_ASSIGNED':
      showToast(`You were assigned: "${data.title}"`, 'success');
      // Refresh my-tasks badge
      Tasks.getMy().then(tasks => {
        const badge = document.getElementById('badge-my-tasks');
        if (badge) badge.textContent = tasks.filter(t => t.status !== 'DONE').length;
      }).catch(() => {});
      break;

    case 'DEADLINE_REMINDER':
      showToast(`⏰ Deadline reminder: "${data.title}"`, 'error');
      break;
  }
}

function subscribeToOpenTaskComments() {
  // If a detail modal is open, subscribe to that task's comment channel
  const detailModal = document.getElementById('detail-modal');
  if (!detailModal || !detailModal.classList.contains('open')) return;

  const titleEl = document.getElementById('detail-title');
  if (!titleEl) return;

  // We use the global allTasks to find the open task ID
  const task = allTasks.find(t => t.title === titleEl.textContent);
  if (!task || !stompClient) return;

  stompClient.subscribe(`/topic/tasks/${task.id}/comments`, (msg) => {
    const data = JSON.parse(msg.body);
    if (data.type === 'NEW_COMMENT' && data.comment) {
      const list = document.getElementById('comment-list-' + task.id);
      if (list) {
        const placeholder = list.querySelector('[style*="No comments"]');
        if (placeholder) list.innerHTML = '';
        list.insertAdjacentHTML('afterbegin', renderComment(data.comment));
      }
    }
  });
}

// ── Disconnect on page unload ─────────────────
window.addEventListener('beforeunload', () => {
  if (stompClient && stompClient.connected) {
    stompClient.disconnect();
  }
});

// ── Auto-connect when script loads ────────────
connectWebSocket();
