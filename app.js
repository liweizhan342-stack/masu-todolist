const STORAGE_KEY = 'masu-todolist-v3';
    const LEGACY_KEYS = ['masu-todolist-v2', 'masu-todolist'];

    const todoInput = document.getElementById('todoInput');
    const searchInput = document.getElementById('searchInput');
    const priorityInput = document.getElementById('priorityInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const addBtn = document.getElementById('addBtn');
    const todoList = document.getElementById('todoList');
    const emptyState = document.getElementById('emptyState');
    const totalCount = document.getElementById('totalCount');
    const activeCount = document.getElementById('activeCount');
    const doneCount = document.getElementById('doneCount');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const heroTotal = document.getElementById('heroTotal');
    const heroToday = document.getElementById('heroToday');
    const heroProgress = document.getElementById('heroProgress');
    const focusHigh = document.getElementById('focusHigh');
    const focusOverdue = document.getElementById('focusOverdue');
    const focusDueToday = document.getElementById('focusDueToday');
    const focusActive = document.getElementById('focusActive');
    const lastUpdated = document.getElementById('lastUpdated');
    const topTasksList = document.getElementById('topTasksList');
    const focusToggleBtn = document.getElementById('focusToggleBtn');

    let todos = loadTodos();
    let currentFilter = 'all';
    let filterText = '';
    let focusOnly = false;
    let sortableInstance = null;
    let editingId = null;

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
      return items
        .filter(Boolean)
        .map((item) => ({
          id: item.id || crypto.randomUUID(),
          text: String(item.text || '').trim(),
          priority: ['low', 'medium', 'high'].includes(item.priority) ? item.priority : 'medium',
          dueDate: item.dueDate || '',
          done: Boolean(item.done),
          createdAt: item.createdAt || formatDateTime(new Date()),
          updatedAt: item.updatedAt || item.createdAt || formatDateTime(new Date())
        }))
        .filter(item => item.text);
    }

    function save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      lastUpdated.textContent = `最後更新：${formatDateTime(new Date())}`;
    }

    function formatDateTime(date) {
      return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).format(date);
    }

    function getTodayKey() {
      const now = new Date();
      const month = `${now.getMonth() + 1}`.padStart(2, '0');
      const day = `${now.getDate()}`.padStart(2, '0');
      return `${now.getFullYear()}-${month}-${day}`;
    }

    function isToday(todo) {
      return Boolean(todo.dueDate) && todo.dueDate === getTodayKey();
    }

    function isOverdue(todo) {
      return Boolean(todo.dueDate) && !todo.done && todo.dueDate < getTodayKey();
    }

    function priorityLabel(priority) {
      return { low: '低優先', medium: '中優先', high: '高優先' }[priority] || '中優先';
    }

    function priorityRank(priority) {
      return { high: 3, medium: 2, low: 1 }[priority] || 0;
    }

    function dueLabel(todo) {
      if (!todo.dueDate) return '';
      if (isOverdue(todo)) return `已逾期：${todo.dueDate}`;
      if (isToday(todo)) return `今天到期：${todo.dueDate}`;
      return `截止：${todo.dueDate}`;
    }

    function addTodo() {
      const text = todoInput.value.trim();
      if (!text) return;
      const now = formatDateTime(new Date());
      todos.unshift({
        id: crypto.randomUUID(),
        text,
        priority: priorityInput.value,
        dueDate: dueDateInput.value || '',
        done: false,
        createdAt: now,
        updatedAt: now
      });
      todoInput.value = '';
      dueDateInput.value = '';
      priorityInput.value = 'medium';
      save();
      render();
      todoInput.focus();
    }

    function toggleTodo(id) {
      todos = todos.map(todo => todo.id === id
        ? { ...todo, done: !todo.done, updatedAt: formatDateTime(new Date()) }
        : todo
      );
      save();
      render();
    }

    function deleteTodo(id) {
      todos = todos.filter(todo => todo.id !== id);
      if (editingId === id) editingId = null;
      save();
      render();
    }

    function clearDone() {
      todos = todos.filter(todo => !todo.done);
      save();
      render();
    }

    function startEdit(id) {
      editingId = id;
      render();
      const input = document.querySelector(`[data-edit-id="${id}"]`);
      if (input) {
        input.focus();
        input.select();
      }
    }

    function commitEdit(id, value) {
      const text = value.trim();
      if (!text) {
        deleteTodo(id);
        return;
      }
      todos = todos.map(todo => todo.id === id
        ? { ...todo, text, updatedAt: formatDateTime(new Date()) }
        : todo
      );
      editingId = null;
      save();
      render();
    }

    function cancelEdit() {
      editingId = null;
      render();
    }

    function matchesFilter(todo) {
      switch (currentFilter) {
        case 'active': return !todo.done;
        case 'done': return todo.done;
        case 'today': return isToday(todo);
        case 'overdue': return isOverdue(todo);
        case 'high': return todo.priority === 'high' && !todo.done;
        default: return true;
      }
    }

    function matchesSearch(todo) {
      if (!filterText.trim()) return true;
      return (todo.text || '').toLowerCase().includes(filterText.trim().toLowerCase());
    }

    function matchesFocus(todo) {
      if (!focusOnly) return true;
      return !todo.done && (todo.priority === 'high' || isToday(todo) || isOverdue(todo));
    }

    function filteredTodos() {
      return todos.filter(todo => matchesFilter(todo) && matchesSearch(todo) && matchesFocus(todo));
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
          const data = normalizeTodos(JSON.parse(reader.result));
          todos = data;
          editingId = null;
          save();
          render();
          alert('匯入成功');
        } catch (error) {
          alert('匯入失敗：請確認 JSON 格式正確');
        }
      };
      reader.readAsText(file);
    }

    function updateSummary() {
      const total = todos.length;
      const done = todos.filter(todo => todo.done).length;
      const active = total - done;
      const overdue = todos.filter(isOverdue).length;
      const dueToday = todos.filter(todo => !todo.done && isToday(todo)).length;
      const high = todos.filter(todo => !todo.done && todo.priority === 'high').length;
      const progress = total ? Math.round((done / total) * 100) : 0;

      totalCount.textContent = total;
      activeCount.textContent = active;
      doneCount.textContent = done;
      heroTotal.textContent = total;
      heroToday.textContent = overdue + dueToday;
      heroProgress.textContent = `${progress}%`;
      progressText.textContent = `${done} / ${total}`;
      progressFill.style.width = `${progress}%`;
      focusHigh.textContent = high;
      focusOverdue.textContent = overdue;
      focusDueToday.textContent = dueToday;
      focusActive.textContent = active;

      const recommended = [...todos]
        .filter(todo => !todo.done)
        .sort((a, b) => {
          const scoreA = (isOverdue(a) ? 100 : 0) + (isToday(a) ? 40 : 0) + priorityRank(a.priority) * 10;
          const scoreB = (isOverdue(b) ? 100 : 0) + (isToday(b) ? 40 : 0) + priorityRank(b.priority) * 10;
          return scoreB - scoreA;
        })
        .slice(0, 3);

      topTasksList.innerHTML = '';
      if (!recommended.length) {
        topTasksList.innerHTML = '<li><span class="hint">目前沒有可推薦任務</span><span>—</span></li>';
      } else {
        recommended.forEach(todo => {
          const li = document.createElement('li');
          li.innerHTML = `<span>${escapeHtml(todo.text)}</span><small>${escapeHtml(priorityLabel(todo.priority))}${todo.dueDate ? ` · ${escapeHtml(todo.dueDate)}` : ''}</small>`;
          topTasksList.appendChild(li);
        });
      }
    }

    function render() {
      const list = filteredTodos();
      todoList.innerHTML = '';
      emptyState.style.display = list.length ? 'none' : 'block';

      list.forEach(todo => {
        const li = document.createElement('li');
        li.className = `task-item${todo.done ? ' done' : ''}${isOverdue(todo) ? ' overdue' : ''}`;
        li.dataset.id = todo.id;

        const editing = editingId === todo.id;
        const due = dueLabel(todo);

        li.innerHTML = `
          <div class="drag-handle" title="拖曳排序">⋮⋮</div>
          <input class="task-check" type="checkbox" ${todo.done ? 'checked' : ''} aria-label="切換完成狀態" />
          <div class="task-content">
            <div class="task-top">
              <div style="flex:1; min-width:0;">
                ${editing
                  ? `<input class="task-edit-input" data-edit-id="${todo.id}" type="text" value="${escapeAttribute(todo.text)}" />`
                  : `<div class="task-text" title="雙擊可編輯">${escapeHtml(todo.text)}</div>`}
              </div>
            </div>
            <div class="task-meta">
              <span class="badge priority-${escapeHtml(todo.priority)}">${escapeHtml(priorityLabel(todo.priority))}</span>
              ${todo.dueDate ? `<span class="badge ${isOverdue(todo) ? 'overdue' : (isToday(todo) ? 'today' : '')}">${escapeHtml(due)}</span>` : ''}
              <span class="badge">建立：${escapeHtml(todo.createdAt)}</span>
              ${todo.updatedAt ? `<span class="badge">更新：${escapeHtml(todo.updatedAt)}</span>` : ''}
            </div>
          </div>
          <div class="task-actions">
            <button class="icon-btn edit-btn" type="button" title="編輯">✎</button>
            <button class="icon-btn danger delete-btn" type="button" title="刪除">🗑</button>
          </div>
        `;

        li.querySelector('.task-check').addEventListener('change', () => toggleTodo(todo.id));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.id));
        li.querySelector('.edit-btn').addEventListener('click', () => startEdit(todo.id));

        const textEl = li.querySelector('.task-text');
        if (textEl) {
          textEl.addEventListener('dblclick', () => startEdit(todo.id));
        }

        const editInput = li.querySelector('.task-edit-input');
        if (editInput) {
          editInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') commitEdit(todo.id, editInput.value);
            if (event.key === 'Escape') cancelEdit();
          });
          editInput.addEventListener('blur', () => commitEdit(todo.id, editInput.value));
        }

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
          handle: '.drag-handle',
          ghostClass: 'sortable-ghost',
          chosenClass: 'sortable-chosen',
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

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text ?? '';
      return div.innerHTML;
    }

    function escapeAttribute(text) {
      return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') addTodo();
    });
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        render();
      });
    });
    searchInput.addEventListener('input', (event) => {
      filterText = event.target.value;
      render();
    });
    focusToggleBtn.addEventListener('click', () => {
      focusOnly = !focusOnly;
      render();
    });
    document.getElementById('clearDoneBtn').addEventListener('click', clearDone);
    document.getElementById('exportBtn').addEventListener('click', exportJson);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) importJson(file);
      event.target.value = '';
    });

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((error) => {
          console.error('Service Worker 註冊失敗：', error);
        });
      });
    }

    lastUpdated.textContent = `最後更新：${formatDateTime(new Date())}`;
    render();
  