# F'Cube Monitor - Personal Productivity & Monitoring PWA

**F'Cube Monitor** adalah aplikasi pemantau produktivitas pribadi berkonsep **Local-First & Offline-First** yang dirancang dengan React, Vite, TypeScript, dan Tailwind CSS v4. Aplikasi ini dikonfigurasi sebagai Progressive Web App (PWA) yang dapat di-install di perangkat mobile maupun desktop, berjalan 100% offline, serta mengamankan seluruh data pengguna di penyimpanan lokal perangkat tanpa sistem login.

---

## 🎯 Tujuan Utama & Filosofi Desain

1. **Privacy-First (Keamanan Data Mutlak):** Tidak ada database eksternal atau server pihak ketiga. Semua pelacakan kebiasaan, catatan personal, dan rencana inventaris disimpan secara lokal di dalam browser pengguna menggunakan enkripsi serialisasi JSON di `LocalStorage`.
2. **Offline-First Utility:** Menggunakan Service Worker kustom (`sw.js`) dengan strategi caching **Network-First with Cache-Fallback**. Aplikasi akan langsung memuat shell aplikasi dan aset penting saat tidak ada internet, lalu menyinkronkan data kembali saat terhubung online.
3. **Aesthetic App-Like Frame (Bukan Tampilan Website Biasa):** Didesain khusus menyerupai aplikasi native desktop/mobile. Menghindari warna yang menyilaukan mata dengan mengandalkan warna latar belakang putih bermotif **designer dot-grid**, bingkai tipis berwarna slate, serta aksen emerald/rose yang selektif dan elegan.
4. **UX Mendalam (Notifikasi, Pengingat & Insights):**
   * **Pusat Notifikasi & Log Aktivitas:** Drawer geser kanan untuk melacak aktivitas sistem.
   * **Pengingat Alram Kebiasaan:** Penjadwalan alram lokal (jam & hari) yang terintegrasi dengan pemutar suara synthesizer (Audio API) dan notifikasi push OS.
   * **Insights & Konsistensi:** Kalkulator indeks kepatuhan rutinitas 7 hari terakhir serta grafik alokasi anggaran kebutuhan.

---

## 📂 Struktur Direktori Project

```text
c:/F'Cube/
├── public/
│   ├── manifest.webmanifest      # Metadata instalasi PWA
│   ├── sw.js                     # Service Worker kustom (offline caching)
│   └── favicon.ico               # Favicon aplikasi
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx           # Menu navigasi desktop
│   │   ├── BottomNav.tsx         # Menu navigasi mobile (bottom bar)
│   │   ├── Dashboard.tsx         # Panel analitik, indeks konsistensi, & pintasan checklist
│   │   ├── HabitTracker.tsx      # Manajemen kebiasaan (baik/buruk) & pengatur alram
│   │   ├── DocumentManager.tsx   # Knowledge base dengan editor Markdown & split screen
│   │   └── NeedsLogger.tsx       # Logger kebutuhan barang ("Apa Saja Yang Dibutuhkan")
│   ├── hooks/
│   │   └── useLocalStorage.ts    # Custom hook sinkronisasi state ke LocalStorage
│   ├── App.tsx                   # Koordinator aplikasi, jam sistem, & pemantau alram pengingat
│   ├── main.tsx                  # Titik masuk React dan pendaftaran service worker
│   ├── vite-env.d.ts             # Definisi tipe TypeScript untuk Vite
│   └── index.css                 # File style utama (Tailwind v4 imports & tema khusus)
├── index.html                    # Kerangka HTML utama aplikasi
├── package.json                  # Manajemen dependencies dan script npm
├── tsconfig.json                 # Konfigurasi TypeScript
├── vite.config.ts                # Konfigurasi bundler Vite dengan Tailwind v4
└── APP_DOCUMENTATION.md          # Dokumen arsitektur sistem
```

---

## 🗄️ Skema Penyimpanan Lokal (Local Storage Schema)

Seluruh data disimpan dalam format JSON terenkripsi di dalam browser pengguna dengan kunci (key) berikut:

### 1. Kebiasaan (`my-monitor-habits`)
```typescript
interface Habit {
  id: string;                  // UUID unik
  name: string;                // Nama kebiasaan (misal: "Minum Air 3L")
  description: string;         // Catatan tambahan
  type: 'good' | 'bad';        // Kebiasaan baik vs Kebiasaan buruk untuk dihindari
  frequency: 'daily';          // Frekuensi harian
  createdAt: string;           // Tanggal pembuatan (ISO string)
  history: {
    [dateStr: string]: boolean; // Key: "YYYY-MM-DD", Value: true jika selesai/berhasil dihindari
  };
}
```

### 2. Catatan & Dokumen (`my-monitor-notes`)
```typescript
interface DocumentNote {
  id: string;                  // UUID unik
  title: string;               // Judul dokumen
  content: string;             // Isi dokumen dalam format Markdown mentah
  tags: string[];              // Tag kategori untuk filter pencarian
  createdAt: string;
  updatedAt: string;
}
```

### 3. Log Kebutuhan (`my-monitor-needs`)
```typescript
interface NeedItem {
  id: string;                  // UUID unik
  name: string;                // Nama barang/tools
  category: string;            // Kategori (Hardware, Software, Subscription, dll)
  qty: number;                 // Jumlah barang yang dibutuhkan
  estimatedCost: number;       // Perkiraan harga per barang
  link: string;                // Link referensi/pembelian online
  priority: 'low' | 'medium' | 'high';
  status: 'needed' | 'purchased' | 'researched';
  notes: string;               // Detail spesifikasi barang
  updatedAt: string;
}
```

### 4. Pusat Notifikasi (`my-monitor-notifications`)
```typescript
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;                // Waktu notifikasi (ISO string)
  read: boolean;               // Status dibaca
  type: 'info' | 'alert' | 'success';
}
```

### 5. Pengingat / Alram (`my-monitor-reminders`)
```typescript
interface ReminderItem {
  id: string;
  title: string;
  time: string;                // Format "HH:MM" (misal: "08:30")
  days: string[];              // Daftar hari aktif (misal: ["Mon", "Wed", "Fri"])
  isActive: boolean;           // Status alram aktif/mati
  habitId?: string;            // ID kebiasaan terkait (opsional)
  lastTriggeredDate?: string;  // Format "YYYY-MM-DD" untuk mencegah alram berulang di menit yang sama
}
```

---

## 🛠️ Langkah Menjalankan Aplikasi Secara Lokal

### 1. Prasyarat (Prerequisites)
Pastikan komputer Anda sudah terinstal [Node.js](https://nodejs.org/).

### 2. Instalasi Dependensi
Buka folder project di terminal Anda, lalu jalankan:
```bash
npm install
```

### 3. Jalankan Server Pengembangan (Development Server)
Jalankan perintah berikut untuk menjalankan server lokal:
```bash
npm run dev
```
Setelah berjalan, buka browser Anda di alamat `http://localhost:5173`.

### 4. Build untuk Produksi
Gunakan perintah ini untuk memvalidasi TypeScript dan mengompilasi file static terkompresi di folder `/dist`:
```bash
npm run build
```

---

## ☁️ Panduan Deploy ke Vercel (1-Click Deploy)

Aplikasi local-first ini dapat dihosting secara gratis di Vercel:
1. Hubungkan project lokal Anda ke akun GitHub Anda.
2. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan import repositori GitHub tersebut.
3. Vercel akan mendeteksi framework Vite secara otomatis. Klik **Deploy**.
4. Project Anda akan live dalam beberapa detik dan siap diinstal sebagai aplikasi PWA!
