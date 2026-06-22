# 🚀 Adasis - Enterprise GACT Management System

> **Disclamer:** Proyek ini adalah sistem Enterprise untuk manajemen internal (General Affair & Coal Transport). Data yang ditampilkan pada screenshot adalah data *dummy* / simulasi.

![Adasis Banner](./screenshots/banner.png) <!-- GANTI DENGAN SCREENSHOT DASHBOARD UTAMA ANDA -->

Adasis adalah aplikasi berbasis web *Enterprise-Grade* yang dirancang khusus untuk mendigitalisasi operasional **General Affair & Transport (GACT)** pada perusahaan pertambangan. Sistem ini menggantikan proses manual berbasis kertas menjadi alur kerja digital yang modern, *real-time*, dan terotomatisasi penuh dengan integrasi Notifikasi WhatsApp.

---

## ✨ Nilai Bisnis & Solusi (Business Value)
- **Digitalisasi Work Order (WO):** Memangkas waktu persetujuan (approval) perbaikan infrastruktur dengan alur digital *multi-tier* (User -> Unit Head -> Section Head).
- **Pemantauan Transportasi Batubara:** Memantau status P2H (Pemeriksaan Harian) sarana, ketersediaan unit, dan distribusi Kuota BBM (Fuel) secara terpusat.
- **WhatsApp Notification Gateway:** Notifikasi otomatis *real-time* kepada *approver* dan *requester* pada setiap tahap pergerakan Work Order menggunakan WhatsApp API.
- **Role-Based Access Control (RBAC):** Sistem otorisasi dinamis dengan 7 peran berbeda untuk memastikan keamanan dan privasi data operasional.

---

## 💻 Tech Stack & Architecture

Aplikasi ini dibangun menggunakan arsitektur *Decoupled* (Pemisahan Frontend dan Backend) dengan teknologi modern:

### Frontend
* **React.js (Vite)** - Library UI utama untuk performa *rendering* yang sangat cepat.
* **Tailwind CSS** - *Styling framework* menggunakan prinsip *Utility-first* dengan desain antarmuka *Glassmorphism* dan *Premium UI*.
* **Lucide React** - Sistem ikon modern SVG.
* **SweetAlert2** - Umpan balik (feedback) pengguna dan interaksi *Pop-up* yang elegan.

### Backend
* **Node.js & Express.js** - RESTful API Server.
* **Prisma ORM** - Interaksi database yang *Type-Safe* dan pemodelan relasional yang efisien.
* **Microsoft SQL Server** - Database relasional skala *Enterprise*.
* **WhatsApp-Web.js** - Node client untuk integrasi pengiriman pesan WhatsApp secara *headless*.
* **Multer** - Manajemen unggah file dan gambar (Bukti Temuan & Bukti Perbaikan).

---

## 📸 Cuplikan Layar (Screenshots)

| Dashboard Infrastruktur | Alur Persetujuan Work Order (WO) |
|:---:|:---:|
| ![Dashboard Infra](./screenshots/infra.png) | ![Approval Flow](./screenshots/approval.png) |
| **Pemeriksaan Harian (P2H) Sarana** | **WhatsApp Notification Gateway** |
| ![P2H Form](./screenshots/p2h.png) | ![WA Notification](./screenshots/wa.png) |

*(Catatan: Buat folder `screenshots` di dalam project Anda dan masukkan gambar aplikasi Anda ke dalam folder tersebut dengan nama yang sesuai)*

---

## ⚙️ Instalasi & Cara Menjalankan Lokal

### Prasyarat
- **Node.js** (v18+)
- **Microsoft SQL Server** (Lokal / Remote)
- Nomor WhatsApp aktif (untuk bot notifikasi)

### 1. Setup Database & Backend
```bash
cd backend
npm install

# Buat file .env dan isi konfigurasi koneksi database
cp .env.example .env

# Jalankan migrasi Prisma untuk membuat tabel di SQL Server
npx prisma db push

# Jalankan server development Backend (Port 5000)
npm run dev
```

### 2. Setup Frontend
```bash
# Buka terminal baru di folder root proyek
npm install

# Jalankan server development Frontend (Port 5173)
npm run dev
```

### 3. Autentikasi WhatsApp Bot
- Pada saat Backend pertama kali berjalan, akan muncul **QR Code** di terminal.
- Buka aplikasi WhatsApp Anda > Tautkan Perangkat > Scan QR Code tersebut.
- Sistem notifikasi siap digunakan!

---

## 🔒 Keamanan & Role Pengguna

Sistem ini memiliki manajemen akses yang ketat:
1. **ADMIN:** Akses Super User.
2. **ADMIN_INFRA:** Manajemen Master Data dan WO Infrastruktur.
3. **ADMIN_TRANSPORT:** Pemantauan Sarana, P2H, dan Kuota Fuel.
4. **USER:** Pengajuan WO reguler.
5. **UH_CGA / SH_CGA:** Otoritas Persetujuan (Approval) bertingkat.
6. **DRIVER:** Pengisian P2H Sarana.
7. **FUELMAN:** Validasi Kupon pengisian BBM.

---

## 👨‍💻 Tentang Pengembang

Sistem ini dikembangkan dari awal hingga *production-ready* sebagai solusi digitalisasi Enterprise. Jika Anda tertarik dengan portofolio ini, silakan hubungi saya untuk diskusi lebih lanjut!
