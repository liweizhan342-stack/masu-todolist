const STORAGE_KEY = 'masu-todolist-v4';
const LEGACY_KEYS = ['masu-todolist-v3', 'masu-todolist-v2', 'masu-todolist'];

const todoInput = document.getElementById('todoInput');
const searchInput = document.getElementById('searchInput');
const priorityInput = document.getElementById('priorityInput');
const statusInput = document.getElementById('statusInput');
const dueDateInput = document.getElementById('dueDateInput');
const tagInput = document.getElementById('tagInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const doneCount = document.getElementById('doneCount');
const selectedCount = document.getElementById('selectedCount');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const heroTotal = document.getElementById('heroTotal');
const heroToday = document.getElementById('heroToday');
const heroProgress = document.getElementById('heroProgress');
const heroInProgress = document.getElementById('heroInProgress');
const focusHigh = document.getElementById('focusHigh');
const focusOverdue = document.getElementById('focusOverdue');
const focusDueToday = document.getElementById('focusDueToday');
const focusWaiting = document.getElementById('focusWaiting');
const lastUpdated = document.getElementById('lastUpdated');
const topTasksList = document.getElementById('topTasksList');
const focusToggleBtn = document.getElementById('focusToggleBtn');
const markSelectedDoneBtn = document.getElementById('markSelectedDoneBtn');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

const drawer = document.getElementById('taskDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const drawerTitle = document.getElementById('drawerTitle');
const detailText = document.getElementById('detailText');
const detailNotes = document.getElementById('detailNotes');
const detailStatus = document.getElementById('detailStatus');
const detailPriority = document.getElementById('detailPriority');
const detailDueDate = document.getElementById('detailDueDate');
const detailEstimate = document.getElementById('detailEstimate');
const detailTags = document.getElementById('detailTags');
const detailMeta = document.getElementById('detailMeta');
const saveDrawerBtn = document.getElementById('saveDrawerBtn');
const deleteDrawerBtn = document.getElementById('deleteDrawerBtn');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');

let todos = loadTodos();
let currentFilter = 'all';
let filterText = '';
let focusOnly = false;
let sortableInstance = null;
let selectedIds = new Set();
let activeDrawerId = null;

function loadTodos() {
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) return normalizeTodos(JSON.parse(current));

  for (const legacyKey of LEGACY_KEYS) {
    const legacy = localStorage.getItem(legacyKey);
    if (legacy) {
      const parsed = normalizeTodos(JSON.parse(legacy));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
  }
  return [];
}

function normalizeTodos(items) {
  if (!Array.isArray(items)) return [];
  return items.filter(Boolean).map((item) => ({
    id: item.id || crypto.randomUUID(),
    text: String(item.text || '').trim(),
    notes: String(item.notes || '').trim(),
    status: ['todo', 'doing', 'waiting', 'done', 'cancelled'].includes(item.status)
      ? item.status
      : (item.done ? 'done' : 'todo'),
    priority: ['low', 'medium', 'high'].includes(item.priority) ? item.priority : 'medium',
    dueDate: item.dueDate || '',
    estimateMinutes: Number(item.estimateMinutes || 0),
    tags: normalizeTags(item.tags),
    createdAt: item.createdAt || formatDateTime(new Date()),
    updatedAt: item.updatedAt || item.createdAt || formatDateTime(new Date())
  })).filter(item => item.text);
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  lastUpdated.textContent = `最後更新：${formatDateTime(new Date())}`;
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).format(date);
}

function getTodayKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isDone(todo) {
  return todo.status === 'done';
}

function isToday(todo) {
  return Boolean(todo.dueDate) && todo.dueDate === getTodayKey();
}

function isOverdue(todo) {
  return Boolean(todo.dueDate) && !isDone(todo) && todo.status !== 'cancelled' && todo.dueDate < getTodayKey();
}

function priorityLabel(priority) {
  return { low: '低優先', medium: '中優先', high: '高優先' }[priority] || '中優先';
}

function statusLabel(status) {
  return {
    todo: '未開始',
    doing: '進行中',
    waiting: '等待中',
    done: '已完成',
    cancelled: '已取消'
  }[status] || '未開始';
}

function priorityRank(priority) {
  return { high: 3, medium: 2, low: 1 }[priority] || 0;
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  const now = formatDateTime(new Date());
  todos.unshift({
    id: crypto.randomUUID(),
    text,
    notes: '',
    status: statusInput.value,
    priority: priorityInput.value,
    dueDate: dueDateInput.value || '',
    estimateMinutes: 0,
    tags: normalizeTags(tagInput.value),
    createdAt: now,
    updatedAt: now
  });
  todoInput.value = '';
  dueDateInput.value = '';
  tagInput.value = '';
  priorityInput.value = 'medium';
  statusInput.value = 'todo';
  save();
  render();
  todoInput.focus();
}

function patchTodo(id, patch) {
  todos = todos.map(todo => todo.id === id ? { ...todo, ...patch, updatedAt: formatDateTime(new Date()) } : todo);
  save();
  render();
}

function deleteTodo(id) {
  todos = todos.filter(todo => todo.id !== id);
  selectedIds.delete(id);
  if (activeDrawerId === id) closeDrawer();
  save();
  render();
}

function clearDone() {
  todos = todos.filter(todo => !isDone(todo));
  selectedIds = new Set([...selectedIds].filter(id => todos.some(todo => todo.id === id)));
  save();
  render();
}

function matchesFilter(todo) {
  switch (currentFilter) {
    case 'active': return !isDone(todo) && todo.status !== 'cancelled';
    case 'done': return isDone(todo);
    case 'today': return isToday(todo);
    case 'overdue': return isOverdue(todo);
    case 'high': return todo.priority === 'high' && !isDone(todo);
    case 'waiting': return todo.status === 'waiting';
    default: return true;
  }
}

function matchesSearch(todo) {
  if (!filterText.trim()) return true;
  const haystack = [todo.text, todo.notes, ...(todo.tags || [])].join(' ').toLowerCase();
  return haystack.includes(filterText.trim().toLowerCase());
}

function matchesFocus(todo) {
  if (!focusOnly) return true;
  return !isDone(todo) && (todo.priority === 'high' || isToday(todo) || isOverdue(todo) || todo.status === 'doing');
}

function filteredTodos() {
  return todos.filter(todo => matchesFilter(todo) && matchesSearch(todo) && matchesFocus(todo));
}

function updateSummary() {
  const total = todos.length;
  const done = todos.filter(isDone).length;
  const active = todos.filter(todo => !isDone(todo) && todo.status !== 'cancelled').length;
  const overdue = todos.filter(isOverdue).length;
  const dueToday = todos.filter(todo => !isDone(todo) && isToday(todo)).length;
  const high = todos.filter(todo => !isDone(todo) && todo.priority === 'high').length;
  const waiting = todos.filter(todo => todo.status === 'waiting').length;
  const doing = todos.filter(todo => todo.status === 'doing').length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  totalCount.textContent = total;
  activeCount.textContent = active;
  doneCount.textContent = done;
  selectedCount.textContent = selectedIds.size;
  heroTotal.textContent = total;
  heroToday.textContent = overdue + dueToday;
  heroProgress.textContent = `${progress}%`;
  heroInProgress.textContent = doing;
  progressText.textContent = `${done} / ${total}`;
  progressFill.style.width = `${progress}%`;
  focusHigh.textContent = high;
  focusOverdue.textContent = overdue;
  focusDueToday.textContent = dueToday;
  focusWaiting.textContent = waiting;

  const recommended = [...todos]
    .filter(todo => !isDone(todo) && todo.status !== 'cancelled')
    .sort((a, b) => scoreTask(b) - scoreTask(a))
    .slice(0, 4);

  topTasksList.innerHTML = '';
  if (!recommended.length) {
    topTasksList.innerHTML = '<li><span class="hint">目前沒有可推薦任務</span><span>—</span></li>';
  } else {
    recommended.forEach(todo => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${escapeHtml(todo.text)}</span><small>${escapeHtml(statusLabel(todo.status))} · ${escapeHtml(priorityLabel(todo.priority))}</small>`;
      topTasksList.appendChild(li);
    });
  }
}

function scoreTask(todo) {
  return (isOverdue(todo) ? 100 : 0) + (isToday(todo) ? 40 : 0) + (todo.status === 'doing' ? 25 : 0) + priorityRank(todo.priority) * 10;
}

function render() {
  const list = filteredTodos();
  todoList.innerHTML = '';
  emptyState.style.display = list.length ? 'none' : 'block';

  list.forEach(todo => {
    const li = document.createElement('li');
    li.className = `task-item ${isDone(todo) ? 'done' : ''} ${isOverdue(todo) ? 'overdue' : ''}`;
    li.dataset.id = todo.id;
    const tags = (todo.tags || []).map(tag => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join('');
    const notePreview = todo.notes ? escapeHtml(todo.notes.slice(0, 80)) : '';

    li.innerHTML = `
      <div class="task-leading">
        <input class="select-check" type="checkbox" ${selectedIds.has(todo.id) ? 'checked' : ''} />
        <input class="task-check" type="checkbox" ${isDone(todo) ? 'checked' : ''} />
      </div>
      <div class="task-content">
        <div class="task-top">
          <div class="task-text-block">
            <div class="task-text">${escapeHtml(todo.text)}</div>
            ${notePreview ? `<div class="task-notes-preview">${notePreview}</div>` : ''}
          </div>
          <div class="task-actions inline-actions">
            <button class="icon-btn quick-status-btn" type="button">${escapeHtml(statusLabel(todo.status))}</button>
            <button class="icon-btn detail-btn" type="button">詳情</button>
            <button class="icon-btn danger delete-btn" type="button">🗑</button>
          </div>
        </div>
        <div class="task-meta">
          <span class="badge priority-${escapeHtml(todo.priority)}">${escapeHtml(priorityLabel(todo.priority))}</span>
          <span class="badge status-${escapeHtml(todo.status)}">${escapeHtml(statusLabel(todo.status))}</span>
          ${todo.dueDate ? `<span class="badge ${isOverdue(todo) ? 'overdue' : (isToday(todo) ? 'today' : '')}">${escapeHtml(todo.dueDate)}</span>` : ''}
          ${todo.estimateMinutes ? `<span class="badge">預估 ${todo.estimateMinutes} 分</span>` : ''}
          ${tags}
        </div>
      </div>
    `;

    li.querySelector('.task-check').addEventListener('change', () => {
      patchTodo(todo.id, { status: isDone(todo) ? 'todo' : 'done' });
    });

    li.querySelector('.select-check').addEventListener('change', (event) => {
      if (event.target.checked) selectedIds.add(todo.id);
      else selectedIds.delete(todo.id);
      render();
    });

    li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.id));
    li.querySelector('.detail-btn').addEventListener('click', () => openDrawer(todo.id));
    li.querySelector('.quick-status-btn').addEventListener('click', () => {
      const next = todo.status === 'todo' ? 'doing' : todo.status === 'doing' ? 'waiting' : todo.status === 'waiting' ? 'done' : 'todo';
      patchTodo(todo.id, { status: next });
    });

    todoList.appendChild(li);
  });

  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === currentFilter);
  });
  focusToggleBtn.classList.toggle('active', focusOnly);
  focusToggleBtn.textContent = focusOnly ? '顯示全部視角' : '只看焦點';

  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }

  if (window.Sortable && currentFilter === 'all' && !filterText.trim() && !focusOnly) {
    sortableInstance = new Sortable(todoList, {
      animation: 180,
      handle: '.task-text',
      ghostClass: 'sortable-ghost',
      onEnd: () => {
        const orderedIds = [...todoList.querySelectorAll('.task-item')].map(item => item.dataset.id);
        todos = orderedIds.map(id => todos.find(todo => todo.id === id)).filter(Boolean);
        save();
        render();
      }
    });
  }

  updateSummary();
}

function openDrawer(id) {
  const todo = todos.find(item => item.id === id);
  if (!todo) return;
  activeDrawerId = id;
  drawerTitle.textContent = todo.text;
  detailText.value = todo.text;
  detailNotes.value = todo.notes || '';
  detailStatus.value = todo.status;
  detailPriority.value = todo.priority;
  detailDueDate.value = todo.dueDate || '';
  detailEstimate.value = todo.estimateMinutes || '';
  detailTags.value = (todo.tags || []).join(', ');
  detailMeta.innerHTML = `建立：${escapeHtml(todo.createdAt)}<br>更新：${escapeHtml(todo.updatedAt || todo.createdAt)}`;
  drawer.classList.remove('hidden');
  drawerBackdrop.classList.remove('hidden');
}

function closeDrawer() {
  activeDrawerId = null;
  drawer.classList.add('hidden');
  drawerBackdrop.classList.add('hidden');
}

function saveDrawer() {
  if (!activeDrawerId) return;
  patchTodo(activeDrawerId, {
    text: detailText.value.trim() || '未命名任務',
    notes: detailNotes.value.trim(),
    status: detailStatus.value,
    priority: detailPriority.value,
    dueDate: detailDueDate.value || '',
    estimateMinutes: Number(detailEstimate.value || 0),
    tags: normalizeTags(detailTags.value)
  });
  closeDrawer();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(todos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'masu-todolist-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      todos = normalizeTodos(JSON.parse(reader.result));
      selectedIds.clear();
      save();
      render();
      alert('匯入成功');
    } catch {
      alert('匯入失敗：請確認 JSON 格式正確');
    }
  };
  reader.readAsText(file);
}

function markSelectedDone() {
  todos = todos.map(todo => selectedIds.has(todo.id) ? { ...todo, status: 'done', updatedAt: formatDateTime(new Date()) } : todo);
  save();
  render();
}

function deleteSelected() {
  todos = todos.filter(todo => !selectedIds.has(todo.id));
  selectedIds.clear();
  save();
  render();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') addTodo(); });
document.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => { currentFilter = btn.dataset.filter; render(); }));
searchInput.addEventListener('input', (event) => { filterText = event.target.value; render(); });
focusToggleBtn.addEventListener('click', () => { focusOnly = !focusOnly; render(); });
document.getElementById('clearDoneBtn').addEventListener('click', clearDone);
document.getElementById('exportBtn').addEventListener('click', exportJson);
document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', (event) => { const file = event.target.files[0]; if (file) importJson(file); event.target.value = ''; });
markSelectedDoneBtn.addEventListener('click', markSelectedDone);
deleteSelectedBtn.addEventListener('click', deleteSelected);
closeDrawerBtn.addEventListener('click', closeDrawer);
drawerBackdrop.addEventListener('click', closeDrawer);
saveDrawerBtn.addEventListener('click', saveDrawer);
deleteDrawerBtn.addEventListener('click', () => { if (activeDrawerId) deleteTodo(activeDrawerId); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => console.error('Service Worker 註冊失敗：', error));
  });
}

lastUpdated.textContent = `最後更新：${formatDateTime(new Date())}`;
render();
