# Requirements Document

## Introduction

To-Do List Life Dashboard adalah aplikasi web berbasis browser yang memungkinkan pengguna mengelola tugas-tugas harian mereka dalam satu tampilan dashboard yang bersih dan minimalis. Aplikasi dibangun menggunakan HTML, CSS, dan Vanilla JavaScript tanpa framework, dengan data disimpan secara persisten menggunakan browser Local Storage API. Dashboard menampilkan ringkasan progres tugas, daftar tugas yang dapat difilter dan diurutkan, serta mendukung tampilan responsif di semua modern browser.

---

## Glossary

- **Dashboard**: Halaman utama aplikasi yang menampilkan ringkasan dan daftar tugas secara keseluruhan.
- **Task**: Satu unit pekerjaan yang memiliki judul, status, prioritas, kategori, dan tanggal tenggat.
- **Task_Manager**: Modul JavaScript yang bertanggung jawab atas operasi CRUD pada task (create, read, update, delete).
- **Storage_Manager**: Modul JavaScript yang bertanggung jawab atas operasi baca dan tulis ke browser Local Storage API.
- **UI_Renderer**: Modul JavaScript yang bertanggung jawab merender ulang tampilan DOM berdasarkan state terkini.
- **Filter_Engine**: Modul JavaScript yang memfilter dan mengurutkan daftar task berdasarkan kriteria yang dipilih pengguna.
- **Progress_Tracker**: Komponen UI yang menampilkan ringkasan statistik progres tugas.
- **Local Storage**: Browser API standar untuk menyimpan data key-value secara persisten di sisi klien.
- **Modern Browser**: Google Chrome, Mozilla Firefox, Microsoft Edge, dan Safari versi terbaru (rilis dalam 2 tahun terakhir).
- **Status**: Kondisi task, bernilai salah satu dari: `pending`, `in-progress`, atau `completed`.
- **Priority**: Tingkat urgensi task, bernilai salah satu dari: `low`, `medium`, atau `high`.
- **Category**: Label pengelompokan task yang ditentukan oleh pengguna (contoh: Kerja, Pribadi, Belajar).

---

## Requirements

### Requirement 1: Manajemen Task (CRUD)

**User Story:** Sebagai pengguna, saya ingin dapat membuat, melihat, mengedit, dan menghapus task, sehingga saya dapat mengelola daftar pekerjaan saya secara lengkap.

#### Acceptance Criteria

1. WHEN pengguna mengisi form tambah task dan menekan tombol simpan, THE Task_Manager SHALL membuat task baru dengan atribut: judul (wajib, maksimal 100 karakter), deskripsi (opsional, maksimal 500 karakter), kategori, prioritas (salah satu dari: `low`, `medium`, `high`), tanggal tenggat (opsional), dan status awal `pending`.
2. IF pengguna menekan tombol simpan dengan kolom judul kosong, THEN THE Task_Manager SHALL menampilkan pesan validasi "Judul task tidak boleh kosong" dan membatalkan penyimpanan.
3. IF pengguna menekan tombol simpan dengan kolom judul melebihi 100 karakter, THEN THE Task_Manager SHALL menampilkan pesan validasi yang mengindikasikan batas maksimal judul dan membatalkan penyimpanan.
4. THE UI_Renderer SHALL menampilkan seluruh task yang tersimpan dalam bentuk daftar kartu (card list) pada Dashboard, diurutkan berdasarkan waktu pembuatan dari yang paling baru ke yang paling lama secara default.
5. WHEN pengguna menekan tombol edit pada sebuah task, THE UI_Renderer SHALL menampilkan form yang telah terisi dengan data task tersebut untuk diedit.
6. IF pengguna menekan tombol simpan pada form edit dengan kolom judul kosong, THEN THE Task_Manager SHALL menampilkan pesan validasi "Judul task tidak boleh kosong" dan membatalkan penyimpanan perubahan.
7. WHEN pengguna menyimpan perubahan pada form edit dengan judul yang valid, THE Task_Manager SHALL memperbarui data task yang bersangkutan tanpa mengubah task lainnya.
8. WHEN pengguna menekan tombol hapus pada sebuah task, THE UI_Renderer SHALL menampilkan dialog konfirmasi sebelum penghapusan dieksekusi.
9. WHEN pengguna mengonfirmasi penghapusan pada dialog konfirmasi, THE Task_Manager SHALL menghapus task tersebut dari daftar secara permanen.

---

### Requirement 2: Pembaruan Status Task

**User Story:** Sebagai pengguna, saya ingin mengubah status task dengan cepat, sehingga saya dapat melacak progres pekerjaan saya.

#### Acceptance Criteria

1. WHEN pengguna menekan tombol atau checkbox pada sebuah task, THE Task_Manager SHALL mengubah status task tersebut ke nilai berikutnya dalam urutan siklus: `pending` → `in-progress` → `completed` → `pending`.
2. WHEN status task berubah menjadi `completed`, THE UI_Renderer SHALL menampilkan task tersebut dengan teks judul dicoret (strikethrough) dan opacity dikurangi menjadi 50% untuk membedakannya dari task aktif.
3. WHEN status task diperbarui, THE Progress_Tracker SHALL memperbarui tampilan statistik progres dalam waktu kurang dari atau sama dengan 500ms tanpa perlu reload halaman.
4. IF operasi pembaruan status task gagal, THEN THE Task_Manager SHALL menampilkan pesan error yang mengindikasikan bahwa status tidak dapat diperbarui dan mempertahankan status task pada nilai sebelumnya.

---

### Requirement 3: Penyimpanan Persisten dengan Local Storage

**User Story:** Sebagai pengguna, saya ingin data task saya tersimpan secara otomatis, sehingga data tidak hilang ketika saya menutup atau me-refresh browser.

#### Acceptance Criteria

1. WHEN Task_Manager melakukan operasi create, update, atau delete pada task, THE Storage_Manager SHALL menyimpan seluruh daftar task ke Local Storage menggunakan key `todo-life-dashboard-tasks` dalam format JSON.
2. WHEN aplikasi pertama kali dimuat di browser, THE Storage_Manager SHALL membaca data task dari Local Storage menggunakan key `todo-life-dashboard-tasks` dan meneruskannya ke UI_Renderer untuk ditampilkan.
3. IF Local Storage tidak mengandung data task dengan key `todo-life-dashboard-tasks` saat aplikasi dimuat, THEN THE Storage_Manager SHALL menginisialisasi daftar task dengan array kosong dan melanjutkan pemuatan UI.
4. IF data yang dibaca dari Local Storage bukan merupakan JSON yang valid atau strukturnya tidak sesuai, THEN THE Storage_Manager SHALL menginisialisasi daftar task dengan array kosong dan melanjutkan pemuatan UI.
5. IF operasi tulis ke Local Storage gagal (contoh: storage penuh), THEN THE Storage_Manager SHALL menampilkan pesan error kepada pengguna yang mengindikasikan bahwa data tidak dapat disimpan, dan THE Storage_Manager SHALL mempertahankan state UI tanpa mengubah tampilan daftar task yang sedang ditampilkan.

---

### Requirement 4: Filter dan Pencarian Task

**User Story:** Sebagai pengguna, saya ingin memfilter dan mencari task berdasarkan berbagai kriteria, sehingga saya dapat menemukan task yang relevan dengan cepat.

#### Acceptance Criteria

1. WHEN pengguna memilih nilai filter status (`semua` / `pending` / `in-progress` / `completed`), THE Filter_Engine SHALL menampilkan semua task yang statusnya sesuai dengan pilihan tersebut dan menyembunyikan semua task yang tidak sesuai; jika pilihan adalah `semua`, THE Filter_Engine SHALL menampilkan seluruh task tanpa memandang status.
2. WHEN pengguna memilih nilai filter prioritas (`semua` / `low` / `medium` / `high`), THE Filter_Engine SHALL menampilkan semua task yang prioritasnya sesuai dengan pilihan tersebut dan menyembunyikan semua task yang tidak sesuai; jika pilihan adalah `semua`, THE Filter_Engine SHALL menampilkan seluruh task tanpa memandang prioritas.
3. WHEN pengguna memilih nilai filter kategori (`semua` atau nilai kategori tertentu), THE Filter_Engine SHALL menampilkan semua task yang kategorinya sesuai dengan pilihan tersebut dan menyembunyikan semua task yang tidak sesuai; jika pilihan adalah `semua`, THE Filter_Engine SHALL menampilkan seluruh task tanpa memandang kategori.
4. WHEN pengguna mengetik teks pada kolom pencarian dan berhenti mengetik selama 300ms, THE Filter_Engine SHALL menampilkan hanya task yang judulnya mengandung teks tersebut (case-insensitive) dan menyembunyikan semua task yang tidak cocok.
5. WHEN beberapa filter aktif secara bersamaan, THE Filter_Engine SHALL menampilkan hanya task yang memenuhi semua kriteria filter yang aktif (logika AND).
6. IF tidak ada task yang cocok dengan kriteria filter aktif sementara daftar task tidak kosong, THEN THE UI_Renderer SHALL menampilkan pesan "Tidak ada task yang sesuai dengan filter ini."
7. IF daftar task kosong (belum ada task yang dibuat), THEN THE UI_Renderer SHALL menampilkan pesan "Belum ada task. Tambahkan task baru untuk memulai."
8. WHEN pengguna menekan tombol reset filter, THE Filter_Engine SHALL mengatur semua nilai filter status, prioritas, dan kategori kembali ke `semua` serta mengosongkan kolom pencarian, sehingga seluruh task ditampilkan kembali.

---

### Requirement 5: Ringkasan Progres (Progress Tracker)

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan statistik task saya di bagian atas dashboard, sehingga saya dapat mengetahui progres keseluruhan secara sekilas.

#### Acceptance Criteria

1. THE Progress_Tracker SHALL menampilkan jumlah total task, jumlah task `completed`, jumlah task `in-progress`, dan jumlah task `pending` secara bersamaan; jumlah ini mencerminkan seluruh task yang tersimpan tanpa dipengaruhi oleh filter yang sedang aktif.
2. THE Progress_Tracker SHALL menampilkan persentase penyelesaian task dalam bentuk progress bar visual, dihitung sebagai `floor((jumlah completed / jumlah total) × 100)` dan dibulatkan ke bawah ke bilangan bulat terdekat; rumus ini hanya diterapkan ketika jumlah total task lebih dari nol.
3. IF jumlah total task adalah nol, THEN THE Progress_Tracker SHALL menampilkan persentase penyelesaian sebagai 0% untuk menghindari pembagian dengan nol.
4. WHEN data task berubah akibat operasi CRUD atau pembaruan status, THE Progress_Tracker SHALL memperbarui semua statistik dan progress bar secara otomatis dalam waktu kurang dari atau sama dengan 500ms tanpa perlu reload halaman.

---

### Requirement 6: Antarmuka Responsif dan Aksesibel

**User Story:** Sebagai pengguna, saya ingin tampilan dashboard yang bersih, minimalis, dan dapat digunakan di berbagai ukuran layar, sehingga saya dapat mengakses aplikasi dari perangkat apa pun.

#### Acceptance Criteria

1. THE Dashboard SHALL menampilkan seluruh konten tanpa horizontal scrollbar dan seluruh elemen interaktif dapat dijangkau serta digunakan pada lebar viewport antara 320px hingga 2560px.
2. WHEN lebar viewport kurang dari 768px, THE UI_Renderer SHALL menampilkan layout satu kolom (single-column) untuk daftar task; lebar viewport menentukan tipe layout dan hanya satu tipe layout yang aktif pada satu waktu.
3. WHEN lebar viewport 768px atau lebih, THE UI_Renderer SHALL menampilkan layout multi-kolom untuk daftar task; lebar viewport menentukan tipe layout dan hanya satu tipe layout yang aktif pada satu waktu.
4. THE Dashboard SHALL memuat dan menampilkan seluruh konten dalam waktu kurang dari 2 detik pada koneksi jaringan lokal (tanpa request jaringan eksternal).
5. THE Dashboard SHALL berjalan tanpa error JavaScript pada versi terbaru Google Chrome, Mozilla Firefox, Microsoft Edge, dan Safari yang tersedia pada saat pengujian dilakukan.
6. THE UI_Renderer SHALL menggunakan elemen HTML semantik (seperti `<main>`, `<section>`, `<article>`, `<button>`) agar dapat diakses oleh screen reader, dan setiap elemen interaktif SHALL memiliki accessible name yang dapat dibaca oleh screen reader.
7. WHEN pengguna berinteraksi menggunakan keyboard saja, THE Dashboard SHALL memastikan semua elemen interaktif (tombol, input, checkbox) dapat dijangkau melalui navigasi Tab dalam urutan yang mengikuti urutan visual dari atas ke bawah dan kiri ke kanan, serta dapat diaktifkan melalui tombol Enter atau Space.
8. WHILE pengguna menavigasi menggunakan keyboard, THE Dashboard SHALL menampilkan indikator fokus yang terlihat pada setiap elemen interaktif yang sedang aktif dengan rasio kontras minimum 3:1 antara indikator fokus dan latar belakang di sekitarnya.

---

### Requirement 7: Pengurutan Task

**User Story:** Sebagai pengguna, saya ingin mengurutkan daftar task berdasarkan kriteria tertentu, sehingga saya dapat memprioritaskan pekerjaan yang paling penting atau mendesak.

#### Acceptance Criteria

1. THE Filter_Engine SHALL menerapkan urutan default berdasarkan waktu pembuatan dari yang paling baru ke yang paling lama sebelum pengguna memilih opsi pengurutan secara eksplisit.
2. WHEN pengguna memilih opsi urutan "Prioritas (Tinggi ke Rendah)", THE Filter_Engine SHALL mengurutkan task dengan urutan: `high` → `medium` → `low`; task dengan nilai prioritas yang sama diurutkan berdasarkan waktu pembuatan dari yang paling baru ke yang paling lama.
3. WHEN pengguna memilih opsi urutan "Tanggal Tenggat (Terdekat)", THE Filter_Engine SHALL mengurutkan task berdasarkan tanggal tenggat dari yang paling dekat ke yang paling jauh, dengan task tanpa tanggal tenggat ditempatkan di akhir daftar; task dengan tanggal tenggat yang sama diurutkan berdasarkan waktu pembuatan dari yang paling baru ke yang paling lama.
4. WHEN pengguna memilih opsi urutan "Tanggal Dibuat (Terbaru)", THE Filter_Engine SHALL mengurutkan task berdasarkan waktu pembuatan dari yang paling baru ke yang paling lama.
5. WHEN pengguna memilih opsi urutan "Nama (A-Z)", THE Filter_Engine SHALL mengurutkan task berdasarkan judul secara alfabetis ascending (case-insensitive).
6. WHEN pengurutan diterapkan bersamaan dengan filter aktif, THE Filter_Engine SHALL menerapkan filter terlebih dahulu, kemudian mengurutkan hasil filter tersebut.
