SYAHBANA STUDIO — GEMINI EDITION (STORY + IMAGE + GOOGLE FLOW)
=============================================================

PAKET
- index.html
- netlify.toml
- netlify/functions/generate-image.mjs
- netlify/functions/generate-story.mjs

FITUR MODE ANIMASI BEBAS
1. Judul dan ide cerita dapat diubah. Setelah kolom judul/ide dikonfirmasi (change/blur), cerita akan diselaraskan otomatis melalui Gemini.
2. Generate Cerita Otomatis: Gemini menyusun premis, alur, konflik, klimaks, penyelesaian, adegan visual, dan dialog per tokoh.
3. Muat Ulang / Cerita Alternatif: membuat versi cerita baru yang berbeda dari versi sebelumnya.
4. Ganti Cerita: mengosongkan storyboard agar pengguna dapat memasukkan ide baru.
5. Seluruh judul scene, visual/aksi/kamera, dan dialog dapat diedit manual.
6. Scene dapat ditambah atau dihapus.
7. Setiap scene mempunyai tombol Generate Gambar Scene dan Generate Ulang tersendiri. Gambar scene lain tidak diganti ketika satu scene dibuat ulang.
8. Foto karakter yang diunggah digunakan sebagai referensi saat gambar scene dibuat.
9. Prompt Google Flow dibangun dari scene terpilih dan memuat dialog, Character Lock, Voice Lock, Style Lock, Camera & Motion, Continuity Lock, gambar referensi scene, Audio & Lingkungan, Negative Prompt, serta instruksi akhir.
10. Perubahan storyboard langsung memperbarui pilihan scene dan prompt Flow.
11. Character Sheet empat sudut menggunakan Gemini Nano Banana 2.1.
12. Hasil generate ditampilkan dalam aplikasi. Penyimpanan proyek/storyboard memakai localStorage browser; kapasitas browser membatasi jumlah gambar besar yang dapat disimpan.

BACKEND GEMINI
- generate-image.mjs: Gemini Nano Banana 2.1 untuk Character Sheet dan gambar referensi scene.
- generate-story.mjs: Gemini 3.1 Flash-Lite untuk penulisan cerita dan dialog.
- API Key hanya dibaca dari environment variable server Netlify: GEMINI_API_KEY.
- Model, kuota, ketersediaan, dan biaya mengikuti ketentuan Google yang berlaku.

PENTING SEBELUM DEPLOY
1. Buat API Key: https://aistudio.google.com/api-keys
2. Pastikan Gemini API aktif dan kuota/billing akun Google sesuai kebutuhan.
3. Deploy menggunakan Netlify CLI atau GitHub + Netlify agar Netlify Functions ikut diterbitkan. Netlify Drop statis tidak cukup untuk fungsi backend.
4. Setelah deploy, buka Site configuration > Environment variables.
5. Tambahkan variable:
   Key   : GEMINI_API_KEY
   Value : API Key dari Google AI Studio
6. Simpan dan lakukan redeploy.
7. Jangan pernah menaruh API Key di index.html atau membagikannya di publik.

CARA DEPLOY — GITHUB + NETLIFY
- Unggah isi folder syahbana-studio-netlify ke repository GitHub.
- Netlify: Add new project > Import an existing project.
- Pilih repository.
- Build command: kosongkan.
- Publish directory: .
- Functions directory: netlify/functions (sudah diatur netlify.toml).
- Deploy, tambahkan GEMINI_API_KEY, lalu redeploy.

CARA DEPLOY — NETLIFY CLI
- Instal Node.js: https://nodejs.org/
- Buka terminal pada folder yang berisi index.html dan netlify.toml.
- Jalankan:
    npx netlify-cli login
    npx netlify-cli init
    npx netlify-cli deploy --prod
- Pastikan Netlify menggunakan publish directory '.' dan functions directory 'netlify/functions'.
- Tambahkan GEMINI_API_KEY di Netlify Environment Variables lalu redeploy.

BATASAN YANG PERLU DIKETAHUI
- Paket ini belum mengintegrasikan Google Flow secara langsung; aplikasi menghasilkan prompt lengkap untuk disalin ke Google Flow.
- Mode Rujukan Buku Pemerintah belum diimplementasikan lengkap pada paket ini. Jangan gunakan paket ini untuk mengklaim alur SIBI/11 tahap sudah berfungsi. Alur resmi 11 tahap tetap menjadi spesifikasi pengembangan berikutnya dan tidak boleh diubah urutannya.
- Generate AI belum dapat diuji live sampai API Key dipasang dan Netlify Functions berhasil diterbitkan.
- Gambar hasil AI dapat menghabiskan ruang penyimpanan browser. Unduh hasil penting sebagai cadangan.
