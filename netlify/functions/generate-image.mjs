const MODEL = "gemini-nano-banana-2.1";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, {});
  if (event.httpMethod !== "POST") return json(405, { error: "Gunakan metode POST." });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json(503, { error: "API Key Gemini belum dipasang. Tambahkan GEMINI_API_KEY di Netlify Environment Variables lalu deploy ulang." });

  let payload;
  try { payload = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Data permintaan tidak valid." }); }

  const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";
  const imageData = typeof payload.imageData === "string" ? payload.imageData : "";
  const mimeType = typeof payload.mimeType === "string" ? payload.mimeType : "image/png";
  const images = Array.isArray(payload.images) ? payload.images.slice(0, 4) : [];
  if (!prompt) return json(400, { error: "Prompt gambar kosong." });
  if (!/^image\/(png|jpeg|webp)$/.test(mimeType)) return json(400, { error: "Format foto harus PNG, JPG, atau WEBP." });
  if (imageData && imageData.length > 5_500_000) return json(413, { error: "Foto terlalu besar untuk dikirim. Kompres foto hingga di bawah 4 MB lalu coba lagi." });
  if (images.some(x => !x || typeof x.imageData !== "string" || !/^image\/(png|jpeg|webp)$/.test(x.mimeType || "image/png") || x.imageData.length > 5_500_000)) return json(400, { error: "Salah satu foto referensi tidak valid atau terlalu besar." });

  const parts = [];
  if (imageData) parts.push({ inlineData: { mimeType, data: imageData } });
  for (const img of images) parts.push({ inlineData: { mimeType: img.mimeType || "image/png", data: img.imageData } });
  parts.push({ text: prompt });

  let upstream;
  try {
    upstream = await fetch(`${API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: "4:3", imageSize: "2K" }
        }
      })
    });
  } catch {
    return json(502, { error: "Tidak dapat menghubungi layanan Gemini. Periksa koneksi dan coba lagi." });
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const message = data?.error?.message || `Gemini mengembalikan status ${upstream.status}.`;
    return json(upstream.status === 429 ? 429 : 502, { error: message });
  }

  const responseParts = data?.candidates?.flatMap(c => c?.content?.parts || []) || [];
  const image = responseParts.find(p => p?.inlineData?.data);
  const text = responseParts.find(p => typeof p?.text === "string")?.text || "";
  if (!image) return json(502, { error: text || "Gemini tidak mengembalikan gambar. Coba prompt lain atau periksa kuota API." });

  return json(200, {
    image: `data:${image.inlineData.mimeType || "image/png"};base64,${image.inlineData.data}`,
    mimeType: image.inlineData.mimeType || "image/png",
    model: MODEL,
    note: text
  });
};
