const MODEL = "gemini-3.1-flash-lite";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" },
  body: JSON.stringify(body)
});

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, {});
  if (event.httpMethod !== "POST") return json(405, { error: "Gunakan metode POST." });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json(503, { error: "API Key Gemini belum dipasang. Tambahkan GEMINI_API_KEY di Netlify Environment Variables lalu deploy ulang." });
  let p;
  try { p = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Data permintaan tidak valid." }); }
  const title = String(p.title || "").slice(0, 180);
  const idea = String(p.idea || "").slice(0, 5000);
  const characters = Array.isArray(p.characters) ? p.characters.slice(0, 4) : [];
  const duration = String(p.duration || "60 detik");
  const clip = String(p.clip || "8 detik");
  const style = String(p.style || "3D Cartoon Cinematic");
  if (!title && !idea) return json(400, { error: "Judul atau ide cerita wajib diisi." });
  const alternative = p.alternative === true;
  const previousScenes = Array.isArray(p.previousScenes) ? p.previousScenes.slice(0, 16) : [];
  const durationSeconds = /menit/i.test(duration) ? (parseInt(duration, 10) || 1) * 60 : (parseInt(duration, 10) || 60);
  const clipSeconds = parseInt(clip, 10) || 8;
  const count = Math.max(4, Math.min(16, Math.ceil(durationSeconds / clipSeconds)));
  const cast = characters.map(c => `${String(c.name || "Tokoh").slice(0,80)} — ${String(c.description || "").slice(0,400)}. Kunci: ${String(c.lock || "").slice(0,500)}`).join("\n");
  const prompt = `Anda adalah penulis skenario animasi profesional berbahasa Indonesia. Buat cerita animasi orisinal untuk proyek ini.\nJUDUL: ${title}\nIDE/PREMIS: ${idea || "Kembangkan premis menarik yang sesuai judul."}\nTOKOH YANG HARUS DIPERTAHANKAN:\n${cast || "Gunakan tokoh utama yang relevan."}\nDURASI TOTAL: ${duration}. TARGET DURASI KLIP: ${clip}. GAYA: ${style}.\nJUMLAH SCENE: buat tepat ${count} scene (jika durasi pendek tetap minimal 4; jangan melebihi 16). ${alternative ? "Buat versi alternatif yang benar-benar berbeda dari rancangan sebelumnya, bukan sekadar mengganti nama. Rancangan sebelumnya untuk dihindari: " + JSON.stringify(previousScenes).slice(0, 9000) : "Buat versi cerita paling kuat dan koheren."}\n\nKETENTUAN: Susun cerita utuh dengan pembuka, pengenalan, tujuan, konflik, usaha, klimaks, penyelesaian, dan penutup. Setiap scene harus menjadi kejadian yang spesifik dan berbeda; jangan mengulang adegan. Setiap scene wajib memiliki visual yang bisa difilmkan: lokasi, waktu, posisi tokoh, ekspresi, aksi, properti, pencahayaan, komposisi dan sudut kamera. Dialog harus alami, relevan dengan karakter, menyebut nama pembicara di setiap baris, dan menggerakkan cerita. Jangan membuat dialog generik atau sama berulang. Jaga kesinambungan sebab-akibat antarscene. Jangan mengganti nama tokoh yang diberikan. Jangan menambahkan tokoh utama baru tanpa alasan. Hindari narator kecuali diperlukan. Gunakan bahasa Indonesia yang hidup dan sesuai target anak/keluarga. Akhiri dengan pesan/emosi yang terasa alami, tidak menggurui.\n\nKELUARKAN HANYA JSON VALID dengan bentuk: {\"storyTitle\":\"...\",\"storySummary\":\"...\",\"scenes\":[{\"title\":\"...\",\"visual\":\"...\",\"dialogue\":\"Nama: kalimat\\nNama: kalimat\"}]}. Jangan sertakan markdown atau teks di luar JSON.`;
  let upstream;
  try {
    upstream = await fetch(`${API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: alternative ? 1.0 : 0.8, maxOutputTokens: 12000 } })
    });
  } catch { return json(502, { error: "Tidak dapat menghubungi Gemini. Periksa koneksi." }); }
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) return json(upstream.status === 429 ? 429 : 502, { error: data?.error?.message || `Gemini mengembalikan status ${upstream.status}.` });
  const raw = data?.candidates?.[0]?.content?.parts?.map(x => x.text || "").join("") || "";
  let result;
  try { result = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")); }
  catch { return json(502, { error: "Gemini belum mengembalikan format cerita yang valid. Silakan muat ulang." }); }
  if (!Array.isArray(result.scenes) || !result.scenes.length) return json(502, { error: "Gemini tidak menghasilkan daftar scene." });
  return json(200, { storyTitle: result.storyTitle || title, storySummary: result.storySummary || idea, scenes: result.scenes.slice(0, 16).map(s => ({ title: String(s.title || "Scene"), visual: String(s.visual || ""), dialogue: String(s.dialogue || "") })) , model: MODEL });
};
