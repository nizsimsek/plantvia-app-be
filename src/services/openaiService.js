import OpenAI from "openai";
import sharp from "sharp";

const openAiTimeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 30000);

export async function optimizeImageForAi(buffer) {
  return sharp(buffer)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();
}

export async function analyzePlantWithOpenAI({ imageBuffer, question, plant = null }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const optimized = imageBuffer ? await optimizeImageForAi(imageBuffer) : null;
  const imageBase64 = optimized?.toString("base64");
  
  console.info("[openai-plant-analysis]", {
    hasImage: Boolean(imageBase64),
    originalImageBytes: imageBuffer?.length || 0,
    optimizedImageBytes: optimized?.length || 0,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini"
  });

  const systemPrompt = `
Sen Plantvia uygulamasının premium bitki bakım asistanısın.
Amacın kullanıcıya bitki fotoğrafı, bitki profili ve sorusu üzerinden pratik, güvenli ve anlaşılır bakım önerisi vermek.
Yanıtların Türkçe olmalı.

Davranış kuralları:
- Kesin hastalık teşhisi, garanti tedavi veya profesyonel tarım/tıp iddiası verme.
- Kullanıcı bitkinin ne olduğunu sorarsa fotoğraftaki yaprak, gövde, damar, büyüme formu ve saksı görünümünden olası tür/ad tahmini yap; emin değilsen 2-3 olası türü ve ayırt edici kontrolleri açıkla.
- Fotoğrafta görünmeyen bir detayı görmüş gibi davranma.
- Görsel varsa yaprak, gövde, toprak yüzeyi, saksı, drenaj ve ışık belirtilerini ayrı ayrı değerlendir.
- Görsel yoksa bunu açıkça belirt ve cevabı kullanıcının sorusu ile bitki profiline göre sınırla.
- Öneriler sabit/generic olmamalı; soru, fotoğraf ve bitki profiline özel olmalı.
- Öneriler kısa, uygulanabilir ve ölçülebilir olmalı.
- Kullanıcıya gereksiz korku verme; risk varsa gözlem ve uzman desteği öner.

Sadece geçerli JSON döndür. Markdown, açıklama metni veya code block kullanma.
JSON şeması:
{
  "answer": "2-4 cümlelik ana değerlendirme. Fotoğraftan görülen/görülmeyen noktaları ve kullanıcının sorusuna cevabı içerir.",
  "suggestions": [
    "Bu vakaya özel uygulanabilir öneri 1",
    "Bu vakaya özel uygulanabilir öneri 2",
    "Bu vakaya özel uygulanabilir öneri 3"
  ],
  "confidenceLevel": "Low | Medium | High",
  "warning": "Kısa güvenlik uyarısı veya takip önerisi"
}`;
  const userPrompt = `
Kullanıcı sorusu:
${question}

Fotoğraf durumu:
${imageBase64 ? "Kullanıcı bitki fotoğrafı gönderdi. Görseli değerlendir." : "Kullanıcı fotoğraf göndermedi. Bunu cevapta belirt ve görsel analiz yapma."}

Bitki profili:
${formatPlantContext(plant)}

Şimdi bu bağlama göre JSON cevabı üret.`;

  const content = [{ type: "text", text: userPrompt }];
  if (imageBase64) {
    content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } });
  }

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content }
    ],
    temperature: 0.4,
    response_format: { type: "json_object" },
    max_tokens: Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 700)
  }, { timeout: openAiTimeoutMs });

  const rawContent = response.choices[0]?.message?.content;
  return normalizeAnalysisResult(rawContent);
}

function normalizeAnalysisResult(rawContent) {
  if (!rawContent) {
    throw new Error("OpenAI returned an empty analysis.");
  }
  
  const parsed = JSON.parse(rawContent);
  const suggestions = normalizeSuggestions(parsed.suggestions);
  
  return {
    answer: ensureText(parsed.answer, "Analiz üretilemedi. Lütfen daha net bir fotoğraf ve soru ile tekrar dene."),
    suggestions,
    confidenceLevel: normalizeConfidence(parsed.confidenceLevel),
    warning: ensureText(parsed.warning, "Bu analiz kesin teşhis değildir; ciddi belirtilerde yerel bir uzmana danış.")
  };
}

function normalizeSuggestions(value) {
  if (!Array.isArray(value)) {
    throw new Error("OpenAI response did not include suggestions.");
  }
  const cleaned = value.map(item => String(item).trim()).filter(Boolean).slice(0, 5);
  if (!cleaned.length) {
    throw new Error("OpenAI response included empty suggestions.");
  }
  return cleaned;
}

function normalizeConfidence(value) {
  const confidence = String(value || "Medium").trim();
  return ["Low", "Medium", "High"].includes(confidence) ? confidence : "Medium";
}

function ensureText(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function formatPlantContext(plant) {
  if (!plant) {
    return "Bitki profili bağlı değil. Sadece fotoğraf ve kullanıcı sorusuna göre cevap ver.";
  }
  
  return [
    `Ad: ${plant.name || "Belirtilmemiş"}`,
    `Tür: ${plant.species || "Belirtilmemiş"}`,
    `Konum: ${plant.location || "Belirtilmemiş"}`,
    `Sulama sıklığı: ${plant.wateringFrequencyDays || "Belirtilmemiş"} gün`,
    `Son sulama tarihi: ${plant.lastWateredAt || "Belirtilmemiş"}`,
    `Hatırlatma saati: ${plant.reminderTime || "Belirtilmemiş"}`,
    `Kullanıcı notu: ${plant.notes || "Yok"}`
  ].join("\n");
}
