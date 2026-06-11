# AI-Augmented Sales Dashboard

Dashboard analitik penjualan interaktif yang mengombinasikan visualisasi data (D3.js) dengan kecerdasan buatan (Generative AI) untuk menghasilkan *insight* secara otomatis. Dibangun menggunakan pendekatan **Data Storytelling** dengan kerangka kerja SCR (*Setup, Conflict, Resolution*).

---

## ⚡ Fitur Utama

- **Data Storytelling Otomatis**: AI tidak hanya meringkas data, tetapi merangkainya menjadi narasi bisnis (*Setup*), mendeteksi akar masalah/anomali (*Conflict*), dan merumuskan rekomendasi strategis (*Resolution*).
- **Brutalist UI Design**: Antarmuka *high-contrast* dan tegas. Fokus penuh pada keterbacaan angka dan kejelasan masalah visual tanpa animasi dekoratif berlebih.
- **Deteksi Anomali**: Algoritma mendeteksi margin negatif, produk rugi, dan lonjakan/penurunan tren bulanan secara otomatis sebelum data dikirim ke mesin AI untuk dianalisis lebih dalam.
- **Deep Dive AI Chat**: Fitur "Tanyakan ke AI" dengan tombol cepat (*quick prompt*) untuk menggali analisis spesifik (misal: evaluasi performa produk, analisis kerugian wilayah).
- **Cloud & LLM Integration**: Menarik dataset secara *live* dari *cloud database* (Supabase) dan mengolah narasinya menggunakan *Large Language Model* via OpenRouter API.

## 🛠 Tech Stack

- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript
- **Visualisasi Data**: D3.js (v7)
- **Database**: Supabase (REST API)
- **AI Engine**: OpenRouter API (Default Model: `gemini-3-flash`)
- **Assets**: Space Grotesk & Space Mono (Google Fonts), FontAwesome 6.5

## 📂 Struktur Inti

```text
.
├── index.html            # Layout utama (Grid System & UI Elements)
├── style.css             # Styling sistem desain Brutalist
├── app.js                # Main orchestrator, kalkulasi data KPI & rendering D3.js
├── config.js             # File konfigurasi utama (API Key & pemetaan kolom DB)
├── supabaseLoader.js     # Modul koneksi API dan normalisasi data Supabase
├── anomalyDetector.js    # Logic pendeteksi outlier (profit turun/naik tajam)
├── aiInsight.js          # Generator prompt untuk 3 Insight Utama & Custom QnA
└── storyEngine.js        # Logic pembentuk alur cerita SCR 
```

## 🚀 Cara Menjalankan

Karena dashboard ini sangat bergantung pada Fetch API untuk mengambil data dari Supabase dan AI, proyek **harus** dijalankan di atas web server lokal (tidak bisa sekadar *double-click* file HTML).

1. Buka folder proyek di VS Code.
2. Pastikan file `config.js` sudah ada dan terisi dengan API Key yang valid (Anda dapat menduplikat dari `config.example.js` jika belum ada).
3. Jalankan ekstensi **Live Server** di VS Code.
4. Dashboard akan terbuka secara otomatis di `http://127.0.0.1:5500`.

## 📌 Catatan Teknis

- **Penanganan CORS**: Endpoint API AI di-routing melalui `corsproxy.io` secara bawaan untuk mencegah pemblokiran koneksi lintas origin di browser klien.
- **Sistem Caching**: Response dari AI di-*cache* di `localStorage` menggunakan sistem *fingerprinting* data. Hal ini mencegah panggilan API yang berulang dan menghemat kuota *rate-limit* ketika pengguna sekadar melakukan *refresh* (F5).

---
*Developed by Ragil Hidayatulloh (23082010014)*
