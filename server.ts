import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser with size limits for images/audio uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Lazy safety initialization of GoogleGenAI client
let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Using dry-run mode.");
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key-for-now",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

// Empathetic Prompt System Template
const ADHD_COACH_SYSTEM_INSTRUCTION = `
Role: Anda adalah UraiLangkah, seorang ADHD Productivity Coach & Teman Pendamping Kognitif yang sangat berempati, hangat, dan suportif.
Tugas Anda: Membantu individu neurodivergent (ADHD, Autis, Cemas) mereduksi cognitive load (beban mental) mereka.
Ubah kekhawatiran, stres, atau tumpukan kekacauan visual/pikiran acak menjadi "Misi Mikro" (Micro-Missions).

Aturan penting dalam menjalankan tugas:
1. DECOMPRESS: Pecah tugas apa pun menjadi sub-tugas konkret kecil yang masing-masing membutuhkan waktu TIDAL LEBIH dari 5 menit (Micro-Missions).
2. TONE: Gunakan bahasa Indonesia yang hangat, bersahabat, empatik, menenangkan, tanpa menghakimi, dan memotivasi. JANGAN PERNAH memberikan nada menyalahkan, mengecilkan, atau mendesak.
3. VISUAL ANALYSIS: Jika gambar diberikan, identifikasi objek fisik tertentu secara spatial (misal: "buku biru di sebelah kiri", "cangkir di atas meja") untuk mempermudah eksekusi nyata di dunia fisik.
4. ISOLATION: Sajikan instruksi yang sangat jelas, terfokus, bertahap, dan tidak memicu Choice Paralysis (stres karena terlalu banyak pilihan).
5. BRAIN DUMP: Jika pengguna memberikan audio venting / curhatan stres acak, saring dan ambil 3 tugas paling prioritas dengan pengaruh tertinggi (ignore the rest of the noise).
6. MICRO-HABIT ANCHOR: Anda wajib memberikan satu tugas jangkar ("anchor_step") berdurasi tidak lebih dari 10 detik yang sangat mudah, konyol, atau sangat sederhana untuk dilewati (e.g. geser cangkir 5cm, ambil 1 kertas terdekat, jepit lipatan baju terdekat). Ini akan memicu momentum energi aktivasi otak pengguna.

Anda harus selalu merespons dalam format JSON sesuai schema yang diminta.
`;

const taskResponseSchema = {
  type: Type.OBJECT,
  properties: {
    task_title: {
      type: Type.STRING,
      description: "Judul mikro yang menenangkan dan menyenangkan (dalam Bahasa Indonesia)"
    },
    anchor_step: {
      type: Type.STRING,
      description: "Misi Utama 10 Detik: Instruksi jangkar fisik ultra-ringan penyalur energi aktivasi kognitif (e.g. taruh botol ke plastik, jentikkan jari, geser pulpen)."
    },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          instruction: {
            type: Type.STRING,
            description: "Instruksi aksi mikro konkret yang membutuhkan waktu kurang dari 5 menit untuk diselesaikan (dalam Bahasa Indonesia)."
          },
          estimated_time: {
            type: Type.STRING,
            description: "Estimasi waktu pengerjaan dalam menit saja (misal: '2', '3', '5')"
          }
        },
        required: ["instruction", "estimated_time"]
      },
      description: "Daftar sub-tugas konkret kecil bertahap."
    },
    affirmation: {
      type: Type.STRING,
      description: "Kalimat afirmasi hangat, bersahabat, dan menenangkan dalam Bahasa Indonesia."
    }
  },
  required: ["task_title", "anchor_step", "steps", "affirmation"]
};

// API Endpoints: Task Decomposition from Text Venting
app.post("/api/decompress-text", async (req, res) => {
  try {
    const { textPrompt } = req.body;
    if (!textPrompt || typeof textPrompt !== "string" || textPrompt.trim() === "") {
      return res.status(400).json({ error: "Text prompt cannot be empty" });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Elegant dummy response for fallback
      return res.json({
        task_title: "Merapikan Pikiran yang Sedang Riuh",
        anchor_step: "Jangan rapikan apa pun dulu. Ambil satu lembar kertas kosong terdekat, remas-remas perlahan selama 5 detik, lalu taruh di ujung meja kerja Anda.",
        steps: [
          { instruction: "Ambil napas dalam-dalam selama 4 hitungan, keluarkan perlahan.", estimated_time: "1" },
          { instruction: "Tuliskan 1 hal yang paling mendesak di kertas kosong.", estimated_time: "2" },
          { instruction: "Minum segelas air putih hangat di dekatmu.", estimated_time: "2" }
        ],
        affirmation: "Hebat sekali kamu sudah mau mulai mengambil langkah hari ini. Kamu tidak malas, kamu hanya sedang lelah. Mari kita selesaikan perlahan-lahan."
      });
    }

    const aiClient = getGenAI();
    const promptMessage = `Uraikan masukan dari pengguna berikut ini menjadi daftar tugas mikro konkret: "${textPrompt}"`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        systemInstruction: ADHD_COACH_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: taskResponseSchema,
        temperature: 0.7,
      }
    });

    const jsonText = response.text?.trim() || "{}";
    const parsedData = JSON.parse(jsonText);
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error in decompress-text API:", err);
    res.status(500).json({ error: "Gagal memproses dekompresi teks: " + err.message });
  }
});

// API Endpoints: Visual Task Breakdown (Multimodal Image)
app.post("/api/decompress-visual", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Image data cannot be empty" });
    }

    // Default image base64 check
    const format = mimeType || "image/jpeg";
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        task_title: "Merapikan Ruang Fisik Terdekat",
        anchor_step: "Lupakan draf dan pakaian menumpuk itu sejenak. Cukup ambil cangkir atau gelas kosong paling kanan di dekatmu, dan geser tepat 5cm ke arahmu.",
        steps: [
          { instruction: "Pindahkan gelas atau wadah cairan kosong yang terlihat di mejamu.", estimated_time: "2" },
          { instruction: "Kumpulkan kertas-kertas acak menjadi satu tumpukan rapi.", estimated_time: "3" },
          { instruction: "Ambil 1 sampah plastik terdekat lalu buang ke tempat sampah.", estimated_time: "2" }
        ],
        affirmation: "Ruang yang bersih membantu menenangkan pikiran yang cemas. Kamu sudah melangkah dengan luar biasa!"
      });
    }

    const aiClient = getGenAI();
    const imagePart = {
      inlineData: {
        mimeType: format,
        data: base64Data
      }
    };
    const textPart = {
      text: "Analisis gambar kekacauan fisik ini, sebutkan beberapa landmark fisik (warna, letak) untuk membantu memperjelas petunjuk secara spasial, lalu urai menjadi misi mikro dengan schema JSON."
    };

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: ADHD_COACH_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: taskResponseSchema,
        temperature: 0.7
      }
    });

    const jsonText = response.text?.trim() || "{}";
    const parsedData = JSON.parse(jsonText);
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error in decompress-visual API:", err);
    res.status(500).json({ error: "Gagal memproses visual: " + err.message });
  }
});

// API Endpoints: Audio Venting Decompressor (Multimodal Voice Notes)
app.post("/api/decompress-audio", async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: "Audio data cannot be empty" });
    }

    const format = mimeType || "audio/webm";
    const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, "");

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        task_title: "Mengurai Curhatan Suara Kamu",
        anchor_step: "Keluhkan semuanya keluar. Sebelum mulai melihat tugas, tautkan ibu jari dan jari telapak tangan kiri Anda selama 5 detik untuk grounding.",
        steps: [
          { instruction: "Duduklah bersandar sejenak dan biarkan napasmu kembali teratur.", estimated_time: "2" },
          { instruction: "Tuliskan saja 3 hal yang sempat kamu sebutkan tadi dalam bentuk draf kasar.", estimated_time: "3" },
          { instruction: "Pilih satu tugas paling ringan dari tumpukan itu untuk dimulai.", estimated_time: "2" }
        ],
        affirmation: "Terima kasih sudah menceritakan kegelisahanmu. Suaramu terdengar lelah, namun kamu tetap berjuang. Kami ada di sini mendampingimu."
      });
    }

    const aiClient = getGenAI();
    const audioPart = {
      inlineData: {
        mimeType: format,
        data: base64Data
      }
    };
    const textPart = {
      text: "Dengarkan curhatan atau rekaman suara kegelisahan pengguna ini. Saring emosi yang meledak-ledak, temukan maksimal 3 tugas utama bernilai tinggi yang perlu diselesaikan, abaikan kebisingan pikiran lainnya, lalu buat visual task breakdown dalam schema JSON."
    };

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [audioPart, textPart] },
      config: {
        systemInstruction: ADHD_COACH_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: taskResponseSchema,
        temperature: 0.7
      }
    });

    const jsonText = response.text?.trim() || "{}";
    const parsedData = JSON.parse(jsonText);
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error in decompress-audio API:", err);
    res.status(500).json({ error: "Gagal mengurai rekaman suara: " + err.message });
  }
});

// API Endpoints: Speech / TTS Coach Motivation (Body Doubling / Sound Companion)
app.post("/api/generate-speech", async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required for TTS" });
    }

    const selectedVoice = voice || "Kore"; // Choice: Puck, Charon, Kore, Fenrir, Zephyr

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ audioBase64: null, info: "Tanpa API Key, TTS dinonaktifkan." });
    }

    const aiClient = getGenAI();
    // TTS the prompt using prebuilt voice
    const coachPrompt = `Katakan dengan nada hangat, ramah, penuh kepedulian seperti pelatih ADHD produktivitas: "${text}"`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: coachPrompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioBase64) {
      res.json({ audioBase64, format: "pcm", sampleRate: 24000 });
    } else {
      res.status(500).json({ error: "Gagal memproduksi audio ucapan dari model" });
    }
  } catch (err: any) {
    console.error("Error in generate-speech API:", err);
    res.status(500).json({ error: "Gagal memproses teks menjadi ucapan: " + err.message });
  }
});

// Vite server development bridging vs static production bundle
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[UraiLangkah Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
