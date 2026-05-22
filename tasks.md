# Implementation Plan: To-Do Life Dashboard

## Overview

Implementasi aplikasi web satu halaman (SPA) menggunakan HTML, CSS, dan Vanilla JavaScript murni tanpa framework dan build tool. Data disimpan secara persisten di browser Local Storage. Arsitektur menggunakan Module Pattern (IIFE) dengan lima modul terpisah dalam satu file `js/app.js`.

## Tasks

- [ ] 1. Buat struktur HTML semantik di `index.html`
  - Buat elemen `<header>` dengan judul aplikasi
  - Buat `<section id="progress-section">` dengan empat stat-card dan progress bar (`role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`)
  - Buat `<section id="toolbar-section">` dengan `<input type="search">`, empat `<select>` (filter-status, filter-priority, filter-category, sort-by), tombol reset filter, dan tombol tambah task
  - Buat `<section id="task-list-section">` dengan `<ul id="task-list" role="list">` dan `<p id="empty-message" role="status" aria-live="polite">`
  - Buat `<dialog id="task-form-dialog">` dengan form lengkap: input judul (`aria-required`, `aria-describedby`), textarea deskripsi, input kategori, select prioritas, input tanggal tenggat, dan tombol Simpan/Batal
  - Buat `<dialog id="confirm-delete-dialog">` dengan teks konfirmasi dan tombol Hapus/Batal
  - Tambahkan `<script src="js/app.js">` di akhir `<body>`
  - Pastikan semua elemen interaktif memiliki `aria-label` yang deskriptif
  - _Requirements: 1.1, 1.5, 1.8, 2.1, 4.1–4.8, 5.1–5.3, 6.6, 6.7_

- [ ] 2. Buat styling lengkap di `css/style.css`
  - [ ] 2.1 Definisikan CSS Custom Properties (variabel warna, spacing, tipografi, border-radius, shadow)
    - Definisikan palet warna untuk status (`pending`, `in-progress`, `completed`) dan prioritas (`low`, `medium`, `high`)
    - Definisikan variabel spacing (`--spacing-xs` hingga `--spacing-xl`) dan tipografi
    - _Requirements: 6.1, 6.4_

  - [ ] 2.2 Buat layout utama dan komponen Progress Tracker
    - Styling `<header>`, `<main>`, dan `#progress-section` menggunakan CSS Grid (4 kolom di desktop, 2 kolom di mobile)
    - Styling stat-card dengan angka statistik yang menonjol
    - Styling progress bar container dan fill dengan transisi animasi
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3_

  - [ ] 2.3 Buat styling toolbar, task card, dan dialog
    - Styling `#toolbar-section` menggunakan Flexbox (horizontal di desktop, vertikal di mobile)
    - Styling `.task-card` dengan header, body, meta, dan action area
    - Styling `.priority-badge` dengan warna berbeda per level prioritas
    - Styling task `completed` dengan `text-decoration: line-through` dan `opacity: 0.5`
    - Styling `<dialog>` dengan overlay backdrop dan animasi buka/tutup
    - _Requirements: 1.4, 2.2, 6.1, 6.6_

  - [ ] 2.4 Buat responsive design dan accessibility styles
    - Terapkan mobile-first: default single-column untuk `#task-list` (`grid-template-columns: 1fr`)
    - Tambahkan media query `@media (min-width: 768px)` untuk multi-column (`repeat(auto-fill, minmax(300px, 1fr))`)
    - Pastikan semua elemen interaktif memiliki `min-height: 44px` dan `min-width: 44px`
    - Tambahkan `:focus-visible` outline dengan rasio kontras ≥ 3:1
    - _Requirements: 6.1, 6.2, 6.3, 6.7, 6.8_


- [ ] 3. Implementasi modul `Storage_Manager` di `js/app.js`
  - [ ] 3.1 Implementasi fungsi `loadTasks()`
    - Baca data dari `localStorage.getItem('todo-life-dashboard-tasks')`
    - Kembalikan `[]` jika key tidak ada (`null`), JSON tidak valid (tangkap exception `JSON.parse`), atau hasil parse bukan `Array` (periksa `Array.isArray()`)
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ] 3.2 Implementasi fungsi `saveTasks(tasks)`
    - Simpan array task ke Local Storage dengan `JSON.stringify`
    - Tangkap `QuotaExceededError` dan error lainnya; tampilkan notifikasi error non-blocking; jangan ubah state in-memory
    - _Requirements: 3.1, 3.5_

- [ ] 4. Implementasi modul `Task_Manager` di `js/app.js`
  - [ ] 4.1 Implementasi `init()` dan `getTasks()`
    - `init()`: muat tasks dari `Storage_Manager.loadTasks()` ke state in-memory `tasks[]`
    - `getTasks()`: kembalikan salinan dangkal `[...tasks]`
    - _Requirements: 3.2_

  - [ ] 4.2 Implementasi `createTask(data)`
    - Validasi: `title` tidak boleh kosong setelah `.trim()`, panjang ≤ 100 karakter; `description.trim().length` ≤ 500; `priority` harus salah satu dari `["low", "medium", "high"]`
    - Buat objek task baru dengan `id` dari `crypto.randomUUID()` (fallback ke `Math.random()` jika tidak tersedia), `status: 'pending'`, `createdAt: new Date().toISOString()`
    - Kembalikan `{ success: true, task }` atau `{ success: false, error: string }`
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 4.3 Implementasi `updateTask(id, data)` dan `deleteTask(id)`
    - `updateTask`: validasi sama dengan `createTask`; update hanya task dengan id yang cocok; task lain tidak berubah; kembalikan result object
    - `deleteTask`: filter out task dengan id yang cocok; panggil `Storage_Manager.saveTasks()`; jumlah task berkurang tepat satu
    - _Requirements: 1.6, 1.7, 1.9_

  - [ ] 4.4 Implementasi `updateStatus(id)`
    - Terapkan siklus: `pending → in-progress → completed → pending`
    - Panggil `Storage_Manager.saveTasks()` setelah update
    - Kembalikan result object; jika id tidak ditemukan kembalikan `{ success: false, error: ... }`
    - _Requirements: 2.1, 2.4_

- [ ] 5. Implementasi modul `Filter_Engine` di `js/app.js`
  - [ ] 5.1 Implementasi fungsi-fungsi filter internal
    - `filterByStatus(tasks, status)`: lewati semua task jika `status === 'semua'`
    - `filterByPriority(tasks, priority)`: lewati semua task jika `priority === 'semua'`
    - `filterByCategory(tasks, category)`: lewati semua task jika `category === 'semua'`
    - `filterBySearch(tasks, search)`: filter case-insensitive pada `task.title`; lewati jika `search` kosong
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 5.2 Implementasi fungsi `sort(tasks, sortBy)` dan `apply(tasks, criteria)`
    - Implementasi keempat mode pengurutan: `createdAt-desc`, `priority-desc` (dengan tie-break `createdAt-desc`), `dueDate-asc` (task `null` di akhir, tie-break `createdAt-desc`), `title-asc` (`localeCompare` dengan locale `'id'`)
    - `apply()`: jalankan filter terlebih dahulu, kemudian sort; kembalikan array baru
    - _Requirements: 4.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_


- [ ] 6. Implementasi modul `Progress_Tracker` di `js/app.js`
  - [ ] 6.1 Implementasi fungsi `calculate(tasks)`
    - Hitung `total`, `completed`, `inProgress`, `pending` dari array tasks
    - Hitung `percentage`: jika `total === 0` kembalikan `0`; jika tidak, `Math.floor((completed / total) * 100)`
    - Kembalikan objek `{ total, completed, inProgress, pending, percentage }`
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 7. Implementasi modul `UI_Renderer` di `js/app.js`
  - [ ] 7.1 Implementasi `init()` — pasang semua event listener
    - Pasang listener pada `#add-task-btn` → `openAddForm()`
    - Pasang listener pada `#task-form` submit → validasi inline → `Task_Manager.createTask/updateTask` → `refresh()` → `closeForm()`
    - Pasang listener pada `#cancel-form-btn` → `closeForm()`
    - Pasang listener pada `#confirm-delete-btn` dan `#cancel-delete-btn`
    - Pasang listener pada `#filter-status`, `#filter-priority`, `#filter-category`, `#sort-by` (change) → update `filterCriteria` → `refresh()`
    - Pasang listener pada `#reset-filter-btn` → reset `filterCriteria` → reset nilai DOM → `refresh()`
    - _Requirements: 1.5, 1.8, 2.1, 4.1–4.8_

  - [ ] 7.2 Implementasi `refresh()` dan `renderProgressTracker(stats)`
    - `refresh()`: ambil `Task_Manager.getTasks()`, panggil `Filter_Engine.apply()`, `Progress_Tracker.calculate()`, lalu `renderTaskList()`, `renderProgressTracker()`, `renderCategoryOptions()`
    - `renderProgressTracker(stats)`: perbarui teks angka di setiap stat-card; perbarui `style.width` progress bar fill; perbarui `aria-valuenow` pada progress bar container
    - _Requirements: 2.3, 5.1, 5.2, 5.3, 5.4_

  - [ ] 7.3 Implementasi `renderTaskList(tasks)` dan `renderTaskCard(task)`
    - `renderTaskList()`: kosongkan `#task-list`; jika array kosong tampilkan pesan di `#empty-message`; jika tidak kosong render setiap kartu
    - `renderTaskCard(task)`: buat `<li class="task-card">` dengan header (tombol status-toggle, judul, priority-badge), deskripsi, meta (kategori, due-date), dan action buttons (edit, hapus)
    - Tambahkan `aria-label` deskriptif pada setiap tombol yang menyertakan judul task
    - Tambahkan class CSS sesuai status dan prioritas task
    - _Requirements: 1.4, 2.2, 4.6, 4.7, 6.6_

  - [ ] 7.4 Implementasi manajemen form: `openAddForm()`, `openEditForm(task)`, `closeForm()`
    - `openAddForm()`: reset semua field form; ubah `#form-title` menjadi "Tambah Task"; buka `<dialog>` dengan `.showModal()`; pindahkan fokus ke `#input-title`
    - `openEditForm(task)`: isi semua field form dengan data task; ubah `#form-title` menjadi "Edit Task"; buka dialog; pindahkan fokus ke `#input-title`
    - `closeForm()`: tutup dialog dengan `.close()`; kembalikan fokus ke tombol pemicu
    - Implementasi focus trap: navigasi Tab di dalam dialog tidak keluar dari dialog
    - _Requirements: 1.5, 6.6, 6.7_

  - [ ] 7.5 Implementasi `showDeleteConfirm(taskId)`, `renderCategoryOptions(tasks)`, dan debounce pencarian
    - `showDeleteConfirm(taskId)`: simpan `taskId` di closure; buka `#confirm-delete-dialog` dengan `.showModal()`; pindahkan fokus ke tombol konfirmasi
    - `renderCategoryOptions(tasks)`: ekstrak kategori unik dari semua tasks; perbarui opsi `#filter-category` secara dinamis
    - Debounce pencarian: `clearTimeout(searchDebounceTimer)` → `searchDebounceTimer = setTimeout(() => { update filterCriteria.search; refresh(); }, 300)`
    - `showError(message)` dan `showValidationError(fieldId, message)`: tampilkan pesan error di elemen yang sesuai
    - _Requirements: 1.8, 1.9, 4.4, 4.3, 6.6_

- [ ] 8. Inisialisasi aplikasi (bootstrap `DOMContentLoaded`)
  - Tambahkan event listener `DOMContentLoaded` di akhir `js/app.js`
  - Urutan inisialisasi: `Task_Manager.init()` → `UI_Renderer.init()` → `UI_Renderer.refresh()`
  - _Requirements: 3.2, 6.4, 6.5_

- [ ] 9. Checkpoint — Pastikan semua fitur inti berfungsi
  - Pastikan semua tests pass, tanyakan kepada pengguna jika ada pertanyaan.


- [ ] 10. Siapkan infrastruktur property-based testing
  - [ ] 10.1 Buat `package.json` dengan dependensi `vitest` dan `fast-check`
    - Inisialisasi `package.json` dengan `"type": "module"`
    - Tambahkan `fast-check` dan `vitest` sebagai `devDependencies` dengan versi yang di-pin
    - Tambahkan script `"test": "vitest --run"` dan `"test:watch": "vitest"`
    - _Requirements: (infrastruktur testing)_

  - [ ] 10.2 Buat `vitest.config.js` dan file helper test
    - Buat `vitest.config.js` dengan konfigurasi environment `jsdom` untuk mensimulasikan browser API
    - Buat `tests/helpers.js` dengan fungsi `createTestTask(overrides)` dan `Task_Manager._setTasksForTest(tasks)` untuk keperluan testing
    - _Requirements: (infrastruktur testing)_

- [ ] 11. Implementasi property-based tests — `Storage_Manager`
  - [ ]* 11.1 Tulis property test untuk Property 6: Serialisasi Local Storage adalah Round-Trip
    - **Property 6: Serialisasi Local Storage adalah Round-Trip**
    - **Validates: Requirements 3.1, 3.2**
    - Gunakan `fc.array(fc.record({ id: fc.uuid(), title: fc.string({minLength:1, maxLength:100}), ... }))` untuk generate array task valid
    - Verifikasi `saveTasks(tasks)` diikuti `loadTasks()` menghasilkan array yang identik secara struktural

  - [ ]* 11.2 Tulis property test untuk Property 7: Data Tidak Valid di Local Storage Selalu Menghasilkan Array Kosong
    - **Property 7: Data Tidak Valid di Local Storage Selalu Menghasilkan Array Kosong**
    - **Validates: Requirements 3.4**
    - Gunakan `fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))` untuk generate nilai non-array
    - Verifikasi `loadTasks()` selalu mengembalikan `[]` tanpa melempar exception

- [ ] 12. Implementasi property-based tests — `Task_Manager` (validasi dan CRUD)
  - [ ]* 12.1 Tulis property test untuk Property 1: Validasi Input Task — Judul Tidak Valid Selalu Ditolak
    - **Property 1: Validasi Input Task — Judul Tidak Valid Selalu Ditolak**
    - **Validates: Requirements 1.2, 1.3, 1.6**
    - Test tiga kasus: string kosong, string hanya whitespace (`fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))`), string > 100 karakter (`fc.string({minLength:101, maxLength:300})`)
    - Verifikasi `createTask()` dan `updateTask()` mengembalikan `{ success: false }`

  - [ ]* 12.2 Tulis property test untuk Property 2: Task Baru Selalu Memiliki Status `pending` dan Semua Field Wajib
    - **Property 2: Task Baru Selalu Memiliki Status `pending` dan Semua Field Wajib**
    - **Validates: Requirements 1.1**
    - Gunakan `fc.record({ title: fc.string({minLength:1, maxLength:100}), priority: fc.constantFrom('low','medium','high') })` untuk generate data valid
    - Verifikasi task hasil `createTask()` memiliki `status === 'pending'`, `id` truthy, `createdAt` valid ISO string, dan semua field input tersimpan

  - [ ]* 12.3 Tulis property test untuk Property 3: Update Task Tidak Mempengaruhi Task Lain (Isolasi)
    - **Property 3: Update Task Tidak Mempengaruhi Task Lain (Isolasi)**
    - **Validates: Requirements 1.7**
    - Generate array minimal dua task; panggil `updateTask()` pada satu task; verifikasi semua task lain identik (semua field tidak berubah)

  - [ ]* 12.4 Tulis property test untuk Property 4: Penghapusan Task Bersifat Permanen
    - **Property 4: Penghapusan Task Bersifat Permanen**
    - **Validates: Requirements 1.9**
    - Generate array task tidak kosong; pilih satu id secara acak; panggil `deleteTask(id)`; verifikasi task tidak ada di `getTasks()` dan jumlah berkurang tepat satu

  - [ ]* 12.5 Tulis property test untuk Property 5: Siklus Status Task adalah Round-Trip
    - **Property 5: Siklus Status Task adalah Round-Trip**
    - **Validates: Requirements 2.1**
    - Gunakan `fc.constantFrom('pending', 'in-progress', 'completed')` untuk status awal
    - Panggil `updateStatus(id)` tiga kali; verifikasi status kembali ke nilai awal


- [ ] 13. Implementasi property-based tests — `Filter_Engine`
  - [ ]* 13.1 Tulis property test untuk Property 8: Hasil Filter Hanya Berisi Task yang Memenuhi Semua Kriteria Aktif
    - **Property 8: Hasil Filter Hanya Berisi Task yang Memenuhi Semua Kriteria Aktif**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
    - Generate kombinasi acak kriteria filter (status, priority, category, search) dan array task
    - Verifikasi setiap task dalam hasil `Filter_Engine.apply()` memenuhi semua kriteria aktif (logika AND)

  - [ ]* 13.2 Tulis property test untuk Property 9: Reset Filter Mengembalikan Semua Task
    - **Property 9: Reset Filter Mengembalikan Semua Task**
    - **Validates: Requirements 4.8**
    - Generate array task dan kombinasi filter aktif sembarang
    - Verifikasi `Filter_Engine.apply(tasks, defaultCriteria)` menghasilkan semua task diurutkan `createdAt-desc`

  - [ ]* 13.3 Tulis property test untuk Property 11: Pengurutan Prioritas Tidak Pernah Melanggar Urutan `high → medium → low`
    - **Property 11: Pengurutan Prioritas Tidak Pernah Melanggar Urutan `high → medium → low`**
    - **Validates: Requirements 7.2**
    - Generate array task dengan prioritas acak; sort dengan `priority-desc`
    - Verifikasi tidak ada pasangan berurutan `(tasks[i], tasks[i+1])` di mana `PRIORITY_ORDER[tasks[i].priority] < PRIORITY_ORDER[tasks[i+1].priority]`

  - [ ]* 13.4 Tulis property test untuk Property 12: Pengurutan Tanggal Tenggat Menempatkan Task Tanpa Tenggat di Akhir
    - **Property 12: Pengurutan Tanggal Tenggat Menempatkan Task Tanpa Tenggat di Akhir**
    - **Validates: Requirements 7.3**
    - Generate array task campuran (dengan dan tanpa `dueDate`); sort dengan `dueDate-asc`
    - Verifikasi semua task dengan `dueDate !== null` muncul sebelum semua task dengan `dueDate === null`, dan task ber-dueDate diurutkan ascending

  - [ ]* 13.5 Tulis property test untuk Property 13: Pengurutan Nama Bersifat Alfabetis Ascending (Case-Insensitive)
    - **Property 13: Pengurutan Nama Bersifat Alfabetis Ascending (Case-Insensitive)**
    - **Validates: Requirements 7.5**
    - Generate array task dengan judul acak; sort dengan `title-asc`
    - Verifikasi untuk setiap pasangan berurutan `tasks[i].title.toLowerCase() <= tasks[i+1].title.toLowerCase()`

  - [ ]* 13.6 Tulis property test untuk Property 14: Filter Diterapkan Sebelum Pengurutan
    - **Property 14: Filter Diterapkan Sebelum Pengurutan**
    - **Validates: Requirements 7.6**
    - Generate array task dan kriteria filter+sort acak
    - Verifikasi hasil `apply(tasks, criteria)` adalah subset terurut dari `apply(tasks, { ...criteria, sortBy: 'createdAt-desc' })`

- [ ] 14. Implementasi property-based tests — `Progress_Tracker`
  - [ ]* 14.1 Tulis property test untuk Property 10: Statistik Progress Tracker Selalu Konsisten
    - **Property 10: Statistik Progress Tracker Selalu Konsisten**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Gunakan `fc.array(fc.record({ status: fc.constantFrom('pending','in-progress','completed') }))` untuk generate array task
    - Verifikasi `total === completed + inProgress + pending` dan `percentage === (total === 0 ? 0 : Math.floor((completed / total) * 100))`

- [ ] 15. Checkpoint akhir — Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan kepada pengguna jika ada pertanyaan.

## Notes

- Task yang ditandai dengan `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk keterlacakan
- Checkpoint memastikan validasi inkremental di setiap tahap
- Property tests memvalidasi properti kebenaran universal (berlaku untuk semua input valid)
- Unit tests memvalidasi contoh spesifik dan kasus tepi
- Semua kode berada dalam satu file `js/app.js` menggunakan Module Pattern (IIFE)
- File CSS utama ada di `css/style.css` (bukan `style.css` di root)
- Jalankan tests dengan: `npm test` (single run) atau `npm run test:watch` (watch mode)


## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["10.1", "10.2"] },
    { "id": 1, "tasks": ["1", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1", "3.2"] },
    { "id": 3, "tasks": ["2.4", "4.1", "4.2"] },
    { "id": 4, "tasks": ["4.3", "4.4", "5.1", "6.1"] },
    { "id": 5, "tasks": ["5.2", "7.1", "7.2"] },
    { "id": 6, "tasks": ["7.3", "7.4", "7.5"] },
    { "id": 7, "tasks": ["8"] },
    { "id": 8, "tasks": ["11.1", "11.2", "12.1", "12.2"] },
    { "id": 9, "tasks": ["12.3", "12.4", "12.5", "13.1"] },
    { "id": 10, "tasks": ["13.2", "13.3", "13.4", "13.5", "13.6", "14.1"] }
  ]
}
```
