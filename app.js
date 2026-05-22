/**
 * Life Dashboard — app.js
 * Tech Stack : Vanilla JavaScript (no framework)
 * Storage    : Browser Local Storage API
 *
 * Tantangan tambahan:
 *   ✅ Custom name di greeting (disimpan di Local Storage)
 *   ✅ Sortir tugas (prioritas, deadline, nama, tanggal dibuat)
 *   ✅ Cegah duplikasi task berdasarkan judul
 *   ✅ Focus Timer (Pomodoro 25 menit)
 *   ✅ Quick Links (manajemen link favorit berbasis Local Storage)
 */

'use strict';

/* ============================================================
   STORAGE MANAGER
   Bertanggung jawab atas operasi baca/tulis Local Storage.
   ============================================================ */
const StorageManager = (() => {
  const KEYS = {
    tasks:  'todo-life-dashboard-tasks',
    name:   'todo-life-dashboard-username',
    links:  'todo-life-dashboard-links',
  };

  /** Membaca daftar task dari Local Storage. */
  function loadTasks() {
    try {
      const raw = localStorage.getItem(KEYS.tasks);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  /** Menyimpan seluruh daftar task ke Local Storage. */
  function saveTasks(tasks) {
    try {
      localStorage.setItem(KEYS.tasks, JSON.stringify(tasks));
      return true;
    } catch {
      UIRenderer.showToast('Data tidak dapat disimpan. Storage mungkin penuh.', 'error');
      return false;
    }
  }

  /** Membaca nama user dari Local Storage. */
  function loadName() {
    return localStorage.getItem(KEYS.name) || '';
  }

  /** Menyimpan nama user ke Local Storage. */
  function saveName(name) {
    try {
      localStorage.setItem(KEYS.name, name);
    } catch { /* silent */ }
  }

  /** Membaca daftar quick links dari Local Storage. */
  function loadLinks() {
    try {
      const raw = localStorage.getItem(KEYS.links);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  /** Menyimpan daftar quick links ke Local Storage. */
  function saveLinks(links) {
    try {
      localStorage.setItem(KEYS.links, JSON.stringify(links));
    } catch {
      UIRenderer.showToast('Link tidak dapat disimpan. Storage mungkin penuh.', 'error');
    }
  }

  return { loadTasks, saveTasks, loadName, saveName, loadLinks, saveLinks };
})();


/* ============================================================
   TASK MANAGER
   Bertanggung jawab atas operasi CRUD pada task.
   ============================================================ */
const TaskManager = (() => {
  let tasks = [];

  /** Fallback UUID jika crypto.randomUUID tidak tersedia. */
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /** Memuat task dari storage saat inisialisasi. */
  function init() {
    tasks = StorageManager.loadTasks();
  }

  /** Mengembalikan salinan daftar task. */
  function getAll() {
    return [...tasks];
  }

  /**
   * Validasi data task.
   * @returns {string|null} Pesan error, atau null jika valid.
   */
  function validate(data, excludeId = null) {
    const title = (data.title || '').trim();
    if (!title) return 'Judul task tidak boleh kosong';
    if (title.length > 100) return 'Judul task maksimal 100 karakter';
    if ((data.description || '').trim().length > 500) return 'Deskripsi maksimal 500 karakter';

    // Cegah duplikasi: cek judul yang sama (case-insensitive), kecuali task yang sedang diedit
    const duplicate = tasks.find(t =>
      t.id !== excludeId &&
      t.title.trim().toLowerCase() === title.toLowerCase()
    );
    if (duplicate) return `Task dengan judul "${title}" sudah ada.`;

    return null;
  }

  /** Membuat task baru dan menyimpannya. */
  function create(data) {
    const error = validate(data);
    if (error) return { success: false, error };

    const task = {
      id:          generateId(),
      title:       data.title.trim(),
      description: (data.description || '').trim(),
      category:    (data.category || '').trim(),
      priority:    ['low','medium','high'].includes(data.priority) ? data.priority : 'medium',
      dueDate:     data.dueDate || null,
      status:      'pending',
      createdAt:   new Date().toISOString(),
    };
    tasks.unshift(task);
    StorageManager.saveTasks(tasks);
    return { success: true, task };
  }

  /** Memperbarui task berdasarkan id. */
  function update(id, data) {
    const error = validate(data, id);
    if (error) return { success: false, error };

    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return { success: false, error: 'Task tidak ditemukan.' };

    tasks[idx] = {
      ...tasks[idx],
      title:       data.title.trim(),
      description: (data.description || '').trim(),
      category:    (data.category || '').trim(),
      priority:    ['low','medium','high'].includes(data.priority) ? data.priority : tasks[idx].priority,
      dueDate:     data.dueDate || null,
    };
    StorageManager.saveTasks(tasks);
    return { success: true, task: tasks[idx] };
  }

  /** Menghapus task berdasarkan id. */
  function remove(id) {
    const before = tasks.length;
    tasks = tasks.filter(t => t.id !== id);
    if (tasks.length < before) {
      StorageManager.saveTasks(tasks);
      return true;
    }
    return false;
  }

  /**
   * Siklus status: pending → in-progress → completed → pending
   */
  function cycleStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return { success: false, error: 'Task tidak ditemukan.' };
    const cycle = { pending: 'in-progress', 'in-progress': 'completed', completed: 'pending' };
    task.status = cycle[task.status] || 'pending';
    StorageManager.saveTasks(tasks);
    return { success: true, task };
  }

  return { init, getAll, create, update, remove, cycleStatus };
})();


/* ============================================================
   FILTER ENGINE
   Memfilter dan mengurutkan daftar task.
   ============================================================ */
const FilterEngine = (() => {
  // Nilai numerik untuk sort prioritas (lebih besar = lebih tinggi)
  const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

  /**
   * Menerapkan filter + sort pada daftar task.
   * @param {Array}  tasks   - Daftar task mentah
   * @param {Object} filters - { status, priority, category, search }
   * @param {string} sortBy  - 'newest'|'priority'|'due-date'|'name-az'
   */
  function apply(tasks, filters, sortBy) {
    let result = [...tasks];

    // Filter status
    if (filters.status && filters.status !== 'semua') {
      result = result.filter(t => t.status === filters.status);
    }
    // Filter prioritas
    if (filters.priority && filters.priority !== 'semua') {
      result = result.filter(t => t.priority === filters.priority);
    }
    // Filter kategori
    if (filters.category && filters.category !== 'semua') {
      result = result.filter(t => t.category === filters.category);
    }
    // Pencarian teks (case-insensitive, debounce ditangani di App)
    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q));
    }

    // Pengurutan (filter dulu, baru sort)
    return _sort(result, sortBy);
  }

  function _sort(tasks, sortBy) {
    const byCreatedDesc = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

    switch (sortBy) {
      // Tantangan: sort berdasarkan prioritas (high → medium → low)
      case 'priority':
        return tasks.sort((a, b) => {
          const diff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
          return diff !== 0 ? diff : byCreatedDesc(a, b);
        });

      // Tantangan: sort berdasarkan deadline (terdekat dulu, null di akhir)
      case 'due-date':
        return tasks.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return byCreatedDesc(a, b);
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          const diff = new Date(a.dueDate) - new Date(b.dueDate);
          return diff !== 0 ? diff : byCreatedDesc(a, b);
        });

      // Tantangan: sort berdasarkan nama A-Z (case-insensitive)
      case 'name-az':
        return tasks.sort((a, b) =>
          a.title.localeCompare(b.title, 'id', { sensitivity: 'base' })
        );

      // Tantangan: sort berdasarkan tanggal dibuat (terbaru dulu)
      case 'newest':
      default:
        return tasks.sort(byCreatedDesc);
    }
  }

  return { apply };
})();


/* ============================================================
   FOCUS TIMER (Pomodoro 25 menit)
   ============================================================ */
const FocusTimer = (() => {
  const WORK_SECONDS = 25 * 60;   // 25 menit standar Pomodoro

  let remaining  = WORK_SECONDS;
  let intervalId = null;
  let isRunning  = false;

  // Elemen DOM — diambil saat init agar tidak null
  let elDisplay, elBtnStart, elBtnPause, elBtnReset, elStatus;

  function _pad(n) { return String(n).padStart(2, '0'); }

  function _render() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    elDisplay.textContent = `${_pad(m)}:${_pad(s)}`;
    // Update <title> agar terlihat di tab browser saat timer berjalan
    if (isRunning) {
      document.title = `⏱️ ${_pad(m)}:${_pad(s)} — Life Dashboard`;
    } else {
      document.title = 'Life Dashboard';
    }
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    elBtnStart.hidden = true;
    elBtnPause.hidden = false;
    elStatus.textContent = '🍅 Fokus! Timer berjalan.';

    intervalId = setInterval(() => {
      remaining--;
      _render();
      if (remaining <= 0) {
        _finish();
      }
    }, 1000);
  }

  function pause() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(intervalId);
    elBtnStart.hidden = false;
    elBtnPause.hidden = true;
    elStatus.textContent = '⏸ Dijeda.';
    document.title = 'Life Dashboard';
  }

  function reset() {
    clearInterval(intervalId);
    isRunning  = false;
    remaining  = WORK_SECONDS;
    elBtnStart.hidden = false;
    elBtnPause.hidden = true;
    elStatus.textContent = '';
    document.title = 'Life Dashboard';
    _render();
  }

  function _finish() {
    clearInterval(intervalId);
    isRunning = false;
    remaining = 0;
    elBtnStart.hidden = false;
    elBtnPause.hidden = true;
    elStatus.textContent = '✅ Sesi selesai! Istirahat sebentar.';
    document.title = 'Life Dashboard';
    _render();
    // Notifikasi browser jika diizinkan
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Life Dashboard', { body: '🍅 Sesi fokus 25 menit selesai! Waktunya istirahat.' });
    }
    UIRenderer.showToast('🍅 Sesi fokus selesai! Istirahat sebentar.', 'success');
  }

  function init() {
    elDisplay  = document.getElementById('timer-display');
    elBtnStart = document.getElementById('btn-timer-start');
    elBtnPause = document.getElementById('btn-timer-pause');
    elBtnReset = document.getElementById('btn-timer-reset');
    elStatus   = document.getElementById('timer-status');

    elBtnStart.addEventListener('click', start);
    elBtnPause.addEventListener('click', pause);
    elBtnReset.addEventListener('click', reset);

    // Minta izin notifikasi (opsional, tidak memblokir)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    _render();
  }

  return { init };
})();


/* ============================================================
   QUICK LINKS MANAGER
   Manajemen link favorit berbasis Local Storage.
   ============================================================ */
const QuickLinks = (() => {
  let links = [];

  function _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function _isValidUrl(str) {
    try {
      const url = new URL(str);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  }

  function _escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function _render() {
    const elList = document.getElementById('links-list');
    elList.innerHTML = '';

    if (links.length === 0) {
      elList.innerHTML = '<li class="links-empty">Belum ada link. Tambahkan di bawah.</li>';
      return;
    }

    links.forEach(link => {
      const li = document.createElement('li');
      li.className = 'links-item';
      li.innerHTML = `
        <a href="${_escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer"
           class="links-anchor" aria-label="Buka ${_escapeHTML(link.label)} di tab baru">
          🔗 ${_escapeHTML(link.label)}
        </a>
        <button type="button" class="btn btn--danger btn-icon links-delete"
                data-id="${link.id}" aria-label="Hapus link ${_escapeHTML(link.label)}">
          ✕
        </button>
      `;
      elList.appendChild(li);
    });
  }

  function _handleFormSubmit(e) {
    e.preventDefault();
    const elLabel    = document.getElementById('link-label-input');
    const elUrl      = document.getElementById('link-url-input');
    const elUrlError = document.getElementById('link-url-error');

    const label = elLabel.value.trim();
    const url   = elUrl.value.trim();

    elUrlError.textContent = '';
    elUrl.classList.remove('is-invalid');

    if (!label) {
      elLabel.focus();
      UIRenderer.showToast('Label link tidak boleh kosong.', 'error');
      return;
    }
    if (!url) {
      elUrlError.textContent = 'URL tidak boleh kosong.';
      elUrl.classList.add('is-invalid');
      elUrl.focus();
      return;
    }
    if (!_isValidUrl(url)) {
      elUrlError.textContent = 'URL tidak valid. Gunakan format https://...';
      elUrl.classList.add('is-invalid');
      elUrl.focus();
      return;
    }

    links.push({ id: _generateId(), label, url });
    StorageManager.saveLinks(links);
    _render();

    elLabel.value = '';
    elUrl.value   = '';
    elLabel.focus();
    UIRenderer.showToast('Link berhasil ditambahkan.', 'success');
  }

  function _handleListClick(e) {
    const btn = e.target.closest('.links-delete');
    if (!btn) return;
    const id = btn.dataset.id;
    links = links.filter(l => l.id !== id);
    StorageManager.saveLinks(links);
    _render();
    UIRenderer.showToast('Link dihapus.', 'info');
  }

  function init() {
    links = StorageManager.loadLinks();
    _render();

    document.getElementById('links-form').addEventListener('submit', _handleFormSubmit);
    document.getElementById('links-list').addEventListener('click', _handleListClick);
  }

  return { init };
})();


/* ============================================================
   UI RENDERER
   Bertanggung jawab merender DOM berdasarkan state terkini.
   ============================================================ */
const UIRenderer = (() => {
  // ── Elemen DOM ──────────────────────────────────────────
  const elClock         = document.getElementById('clock');
  const elGreeting      = document.getElementById('greeting');
  const elDateDisplay   = document.getElementById('date-display');
  const elNameInput     = document.getElementById('user-name-input');

  const elStatTotal     = document.getElementById('stat-total');
  const elStatCompleted = document.getElementById('stat-completed');
  const elStatInprogress= document.getElementById('stat-inprogress');
  const elStatPending   = document.getElementById('stat-pending');
  const elProgressFill  = document.getElementById('progress-bar-fill');
  const elProgressWrap  = document.getElementById('progress-bar-wrapper');
  const elProgressPct   = document.getElementById('progress-percent');

  const elTaskList      = document.getElementById('task-list');
  const elEmptyState    = document.getElementById('empty-state');
  const elEmptyMsg      = document.getElementById('empty-state-message');
  const elCategoryFilter= document.getElementById('filter-category');
  const elCategorySugg  = document.getElementById('category-suggestions');

  const elToast         = document.getElementById('toast');
  let toastTimer        = null;

  // ── Custom Name & Clock ──────────────────────────────────

  /** Memperbarui jam digital, greeting (dengan nama), dan tanggal. */
  function _updateClock() {
    const now  = new Date();
    const hh   = String(now.getHours()).padStart(2, '0');
    const mm   = String(now.getMinutes()).padStart(2, '0');
    const ss   = String(now.getSeconds()).padStart(2, '0');

    elClock.textContent = `${hh}:${mm}:${ss}`;
    elClock.setAttribute('datetime', now.toISOString());

    // Greeting berdasarkan jam + nama user (tantangan custom name)
    const hour = now.getHours();
    const name = StorageManager.loadName();
    const namePart = name ? `, ${name}` : '';

    let greetText;
    if (hour >= 5  && hour < 12) greetText = `🌤️ Selamat Pagi${namePart}!`;
    else if (hour >= 12 && hour < 15) greetText = `☀️ Selamat Siang${namePart}!`;
    else if (hour >= 15 && hour < 18) greetText = `🌤️ Selamat Sore${namePart}!`;
    else                               greetText = `🌙 Selamat Malam${namePart}!`;

    elGreeting.textContent = greetText;

    elDateDisplay.textContent = now.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  /** Memulai interval clock dan setup input nama. */
  function startClock() {
    // Isi input nama dari storage
    elNameInput.value = StorageManager.loadName();

    // Simpan nama saat user mengetik (debounce ringan)
    let nameTimer = null;
    elNameInput.addEventListener('input', () => {
      clearTimeout(nameTimer);
      nameTimer = setTimeout(() => {
        StorageManager.saveName(elNameInput.value.trim());
        _updateClock();   // Perbarui greeting langsung
      }, 400);
    });

    _updateClock();
    setInterval(_updateClock, 1000);
  }

  // ── Progress Tracker ────────────────────────────────────

  function updateProgress(allTasks) {
    const total      = allTasks.length;
    const completed  = allTasks.filter(t => t.status === 'completed').length;
    const inprogress = allTasks.filter(t => t.status === 'in-progress').length;
    const pending    = allTasks.filter(t => t.status === 'pending').length;
    const pct        = total > 0 ? Math.floor((completed / total) * 100) : 0;

    elStatTotal.textContent      = total;
    elStatCompleted.textContent  = completed;
    elStatInprogress.textContent = inprogress;
    elStatPending.textContent    = pending;

    elProgressFill.style.width = `${pct}%`;
    elProgressWrap.setAttribute('aria-valuenow', pct);
    elProgressPct.textContent  = `${pct}% selesai`;
  }

  // ── Task List ────────────────────────────────────────────

  function renderTasks(filteredTasks, allTasks) {
    elTaskList.innerHTML = '';
    updateProgress(allTasks);
    _updateCategoryOptions(allTasks);

    if (allTasks.length === 0) {
      elEmptyMsg.textContent = 'Belum ada task. Tambahkan task baru untuk memulai.';
      elEmptyState.hidden = false;
      return;
    }
    if (filteredTasks.length === 0) {
      elEmptyMsg.textContent = 'Tidak ada task yang sesuai dengan filter ini.';
      elEmptyState.hidden = false;
      return;
    }

    elEmptyState.hidden = true;
    filteredTasks.forEach(task => elTaskList.appendChild(_createTaskCard(task)));
  }

  function _createTaskCard(task) {
    const li = document.createElement('li');
    li.className = 'task-card';
    li.dataset.id       = task.id;
    li.dataset.status   = task.status;
    li.dataset.priority = task.priority;

    const today    = new Date(new Date().toDateString());
    const isOverdue = task.dueDate && task.status !== 'completed'
      && new Date(task.dueDate) < today;

    const dueDateHTML = task.dueDate
      ? `<span class="task-due-date ${isOverdue ? 'overdue' : ''}"
              aria-label="Tenggat: ${_formatDate(task.dueDate)}">
           📅 ${_formatDate(task.dueDate)}${isOverdue ? ' (Terlambat)' : ''}
         </span>`
      : '';

    const categoryHTML = task.category
      ? `<span class="badge" aria-label="Kategori: ${_esc(task.category)}">${_esc(task.category)}</span>`
      : '';

    const statusLabel = { pending: 'Pending', 'in-progress': 'In Progress', completed: 'Selesai' };
    const statusClass = { pending: 'badge--pending', 'in-progress': 'badge--inprogress', completed: 'badge--completed' };
    const priorityClass = { high: 'badge--high', medium: 'badge--medium', low: 'badge--low' };

    li.innerHTML = `
      <article>
        <div class="task-card-header">
          <button type="button" class="btn-status" data-id="${task.id}"
            aria-label="Ubah status: ${_esc(task.title)} (saat ini: ${statusLabel[task.status]})"
            title="Klik untuk ubah status"></button>
          <h3 class="task-title">${_esc(task.title)}</h3>
        </div>
        ${task.description ? `<p class="task-desc">${_esc(task.description)}</p>` : ''}
        <div class="task-meta">
          <span class="badge ${statusClass[task.status]}">${statusLabel[task.status]}</span>
          <span class="badge ${priorityClass[task.priority]}">${task.priority}</span>
          ${categoryHTML}
          ${dueDateHTML}
        </div>
        <div class="task-card-actions">
          <button type="button" class="btn btn--ghost btn-icon btn-edit"
                  data-id="${task.id}" aria-label="Edit task: ${_esc(task.title)}">✏️ Edit</button>
          <button type="button" class="btn btn--danger btn-icon btn-delete"
                  data-id="${task.id}" aria-label="Hapus task: ${_esc(task.title)}">🗑️ Hapus</button>
        </div>
      </article>`;
    return li;
  }

  function _updateCategoryOptions(allTasks) {
    const cats = [...new Set(allTasks.map(t => t.category).filter(Boolean))].sort();
    const cur  = elCategoryFilter.value;

    elCategoryFilter.innerHTML = '<option value="semua">Semua Kategori</option>';
    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat; opt.textContent = cat;
      elCategoryFilter.appendChild(opt);
    });
    if (cats.includes(cur)) elCategoryFilter.value = cur;

    elCategorySugg.innerHTML = '';
    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      elCategorySugg.appendChild(opt);
    });
  }

  // ── Toast ────────────────────────────────────────────────

  function showToast(message, type = 'info') {
    if (toastTimer) clearTimeout(toastTimer);
    elToast.textContent = message;
    elToast.hidden = false;
    elToast.className = `toast toast--${type}`;
    void elToast.offsetWidth;   // trigger reflow
    elToast.classList.add('toast--show');
    toastTimer = setTimeout(() => {
      elToast.classList.remove('toast--show');
      setTimeout(() => { elToast.hidden = true; }, 200);
    }, 3000);
  }

  // ── Helpers ──────────────────────────────────────────────

  function _esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function _formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  return { startClock, updateProgress, renderTasks, showToast };
})();


/* ============================================================
   APP CONTROLLER
   Menghubungkan semua modul dan menangani event.
   ============================================================ */
const App = (() => {
  let filters = { status: 'semua', priority: 'semua', category: 'semua', search: '' };
  let sortBy  = 'newest';
  let editingId = null;
  let searchDebounceTimer = null;

  // ── Elemen DOM ──────────────────────────────────────────
  const elBtnAddTask    = document.getElementById('btn-add-task');
  const elModalOverlay  = document.getElementById('modal-overlay');
  const elModalTitle    = document.getElementById('modal-title');
  const elBtnModalClose = document.getElementById('btn-modal-close');
  const elBtnCancelForm = document.getElementById('btn-cancel-form');
  const elTaskForm      = document.getElementById('task-form');
  const elBtnSubmit     = document.getElementById('btn-submit-form');

  const elInputTitle    = document.getElementById('input-title');
  const elInputDesc     = document.getElementById('input-desc');
  const elInputCategory = document.getElementById('input-category');
  const elInputPriority = document.getElementById('input-priority');
  const elInputDueDate  = document.getElementById('input-due-date');
  const elTitleError    = document.getElementById('title-error');

  const elSearchInput    = document.getElementById('search-input');
  const elFilterStatus   = document.getElementById('filter-status');
  const elFilterPriority = document.getElementById('filter-priority');
  const elFilterCategory = document.getElementById('filter-category');
  const elSortSelect     = document.getElementById('sort-select');
  const elBtnReset       = document.getElementById('btn-reset-filter');
  const elTaskList       = document.getElementById('task-list');

  // ── Render ───────────────────────────────────────────────

  function refresh() {
    const all      = TaskManager.getAll();
    const filtered = FilterEngine.apply(all, filters, sortBy);
    UIRenderer.renderTasks(filtered, all);
  }

  // ── Modal ────────────────────────────────────────────────

  function openModal(task = null) {
    editingId = task ? task.id : null;
    elModalTitle.textContent = task ? 'Edit Task' : 'Tambah Task';
    elBtnSubmit.textContent  = task ? 'Simpan Perubahan' : 'Simpan';

    elInputTitle.value    = task ? task.title       : '';
    elInputDesc.value     = task ? task.description : '';
    elInputCategory.value = task ? task.category    : '';
    elInputPriority.value = task ? task.priority    : 'medium';
    elInputDueDate.value  = task ? (task.dueDate || '') : '';

    _clearFormError();
    elModalOverlay.hidden = false;
    elInputTitle.focus();
  }

  function closeModal() {
    elModalOverlay.hidden = true;
    editingId = null;
    elTaskForm.reset();
    _clearFormError();
  }

  function _clearFormError() {
    elTitleError.textContent = '';
    elInputTitle.classList.remove('is-invalid');
  }

  // ── Form submit ──────────────────────────────────────────

  function handleFormSubmit(e) {
    e.preventDefault();
    _clearFormError();

    const data = {
      title:       elInputTitle.value,
      description: elInputDesc.value,
      category:    elInputCategory.value,
      priority:    elInputPriority.value,
      dueDate:     elInputDueDate.value || null,
    };

    let result;
    if (editingId) {
      result = TaskManager.update(editingId, data);
    } else {
      result = TaskManager.create(data);
    }

    if (!result.success) {
      // Tampilkan error validasi (termasuk pesan duplikasi)
      elTitleError.textContent = result.error;
      elInputTitle.classList.add('is-invalid');
      elInputTitle.focus();
      return;
    }

    UIRenderer.showToast(
      editingId ? 'Task berhasil diperbarui.' : 'Task berhasil ditambahkan.',
      'success'
    );
    closeModal();
    refresh();
  }

  // ── Task list click (delegasi) ───────────────────────────

  function handleTaskListClick(e) {
    const btnStatus = e.target.closest('.btn-status');
    if (btnStatus) {
      const res = TaskManager.cycleStatus(btnStatus.dataset.id);
      if (!res.success) UIRenderer.showToast(res.error, 'error');
      refresh();
      return;
    }

    const btnEdit = e.target.closest('.btn-edit');
    if (btnEdit) {
      const task = TaskManager.getAll().find(t => t.id === btnEdit.dataset.id);
      if (task) openModal(task);
      return;
    }

    const btnDelete = e.target.closest('.btn-delete');
    if (btnDelete) {
      const task = TaskManager.getAll().find(t => t.id === btnDelete.dataset.id);
      if (!task) return;
      if (window.confirm(`Hapus task "${task.title}"?\nTindakan ini tidak dapat dibatalkan.`)) {
        TaskManager.remove(task.id);
        UIRenderer.showToast('Task berhasil dihapus.', 'info');
        refresh();
      }
    }
  }

  // ── Filter & Search ──────────────────────────────────────

  function handleSearchInput() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      filters.search = elSearchInput.value;
      refresh();
    }, 300);
  }

  function handleFilterChange() {
    filters.status   = elFilterStatus.value;
    filters.priority = elFilterPriority.value;
    filters.category = elFilterCategory.value;
    refresh();
  }

  function handleSortChange() {
    sortBy = elSortSelect.value;
    refresh();
  }

  function handleResetFilter() {
    filters = { status: 'semua', priority: 'semua', category: 'semua', search: '' };
    sortBy  = 'newest';
    elSearchInput.value    = '';
    elFilterStatus.value   = 'semua';
    elFilterPriority.value = 'semua';
    elFilterCategory.value = 'semua';
    elSortSelect.value     = 'newest';
    refresh();
  }

  // ── Keyboard ─────────────────────────────────────────────

  function handleKeyDown(e) {
    if (e.key === 'Escape' && !elModalOverlay.hidden) closeModal();
  }

  // ── Init ─────────────────────────────────────────────────

  function init() {
    TaskManager.init();
    UIRenderer.startClock();
    FocusTimer.init();
    QuickLinks.init();
    refresh();

    elBtnAddTask.addEventListener('click', () => openModal());
    elBtnModalClose.addEventListener('click', closeModal);
    elBtnCancelForm.addEventListener('click', closeModal);
    elModalOverlay.addEventListener('click', e => { if (e.target === elModalOverlay) closeModal(); });

    elTaskForm.addEventListener('submit', handleFormSubmit);
    elTaskList.addEventListener('click', handleTaskListClick);

    elSearchInput.addEventListener('input', handleSearchInput);
    elFilterStatus.addEventListener('change', handleFilterChange);
    elFilterPriority.addEventListener('change', handleFilterChange);
    elFilterCategory.addEventListener('change', handleFilterChange);
    elSortSelect.addEventListener('change', handleSortChange);
    elBtnReset.addEventListener('click', handleResetFilter);

    document.addEventListener('keydown', handleKeyDown);
  }

  return { init };
})();

// ── Bootstrap ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', App.init);
