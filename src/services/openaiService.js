import OpenAI from "openai";
import sharp from "sharp";

const openAiTimeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 30000);

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not configured.");
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function optimizeImageForAi(buffer) {
  return sharp(buffer)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();
}

export async function analyzePlantWithOpenAI({ imageBuffer, question, plant = null, locale = "en" }) {
  const optimized = imageBuffer ? await optimizeImageForAi(imageBuffer) : null;
  const imageBase64 = optimized?.toString("base64");
  const isTurkish = locale.startsWith("tr");

  console.info("[openai-plant-analysis]", {
    hasImage: Boolean(imageBase64),
    originalImageBytes: imageBuffer?.length || 0,
    optimizedImageBytes: optimized?.length || 0,
    model: process.env.OPENAI_MODEL || "gpt-4o",
    locale
  });

  const systemPrompt = isTurkish
    ? `Sen Plantvia uygulamasının premium bitki bakım asistanısın.
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
}`
    : `You are Plantvia's premium plant care assistant.
Your goal is to provide practical, safe, and clear care advice based on the user's plant photo, plant profile, and question.
Respond in English.

Behavioral rules:
- Do not make definitive disease diagnoses, guarantee treatments, or claim professional agricultural/medical expertise.
- If the user asks what a plant is, estimate the likely species from the visible leaves, stem, veins, growth form, and pot; if unsure, suggest 2-3 possible species and the distinguishing checks.
- Do not describe details that are not visible in the photo.
- If a photo is provided, evaluate leaves, stem, soil surface, pot, drainage, and light indicators separately.
- If no photo is provided, state this clearly and limit the answer to the user's question and plant profile.
- Suggestions must not be generic; tailor them to the specific question, photo, and plant profile.
- Keep suggestions short, actionable, and measurable.
- Do not alarm the user unnecessarily; if there is a risk, recommend observation and professional support.

Return only valid JSON. No markdown, explanatory text, or code blocks.
JSON schema:
{
  "answer": "2-4 sentence main assessment covering what is/isn't visible in the photo and the answer to the user's question.",
  "suggestions": [
    "Actionable suggestion specific to this case 1",
    "Actionable suggestion specific to this case 2",
    "Actionable suggestion specific to this case 3"
  ],
  "confidenceLevel": "Low | Medium | High",
  "warning": "Brief safety notice or follow-up recommendation"
}`;
  const userPrompt = isTurkish
    ? `Kullanıcı sorusu:\n${question}\n\nFotoğraf durumu:\n${imageBase64 ? "Kullanıcı bitki fotoğrafı gönderdi. Görseli değerlendir." : "Kullanıcı fotoğraf göndermedi. Bunu cevapta belirt ve görsel analiz yapma."}\n\nBitki profili:\n${formatPlantContext(plant, true)}\n\nŞimdi bu bağlama göre JSON cevabı üret.`
    : `User question:\n${question}\n\nPhoto status:\n${imageBase64 ? "The user sent a plant photo. Evaluate the image." : "The user did not send a photo. State this and do not perform visual analysis."}\n\nPlant profile:\n${formatPlantContext(plant, false)}\n\nNow produce the JSON response based on this context.`;

  const content = [{ type: "text", text: userPrompt }];
  if (imageBase64) {
    content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } });
  }

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content }
    ],
    temperature: 0.4,
    response_format: { type: "json_object" },
    max_tokens: Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 700)
  }, { timeout: openAiTimeoutMs });

  const rawContent = response.choices[0]?.message?.content;
  return normalizeAnalysisResult(rawContent, isTurkish);
}

function normalizeAnalysisResult(rawContent, isTurkish = false) {
  if (!rawContent) {
    throw new Error("OpenAI returned an empty analysis.");
  }

  const parsed = JSON.parse(rawContent);
  const suggestions = normalizeSuggestions(parsed.suggestions);

  return {
    answer: ensureText(
      parsed.answer,
      isTurkish
        ? "Analiz üretilemedi. Lütfen daha net bir fotoğraf ve soru ile tekrar dene."
        : "Analysis could not be generated. Please try again with a clearer photo and question."
    ),
    suggestions,
    confidenceLevel: normalizeConfidence(parsed.confidenceLevel),
    warning: ensureText(
      parsed.warning,
      isTurkish
        ? "Bu analiz kesin teşhis değildir; ciddi belirtilerde yerel bir uzmana danış."
        : "This analysis is not a definitive diagnosis; consult a local expert for serious symptoms."
    )
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

function formatPlantContext(plant, isTurkish = false) {
  if (!plant) {
    return isTurkish
      ? "Bitki profili bağlı değil. Sadece fotoğraf ve kullanıcı sorusuna göre cevap ver."
      : "No plant profile linked. Answer based on the photo and user's question only.";
  }

  const na = isTurkish ? "Belirtilmemiş" : "Not specified";
  const none = isTurkish ? "Yok" : "None";

  return isTurkish
    ? [
        `Ad: ${plant.name || na}`,
        `Tür: ${plant.species || na}`,
        `Konum: ${plant.location || na}`,
        `Sulama sıklığı: ${plant.wateringFrequencyDays || na} gün`,
        `Son sulama tarihi: ${plant.lastWateredAt || na}`,
        `Hatırlatma saati: ${plant.reminderTime || na}`,
        `Kullanıcı notu: ${plant.notes || none}`
      ].join("\n")
    : [
        `Name: ${plant.name || na}`,
        `Species: ${plant.species || na}`,
        `Location: ${plant.location || na}`,
        `Watering frequency: every ${plant.wateringFrequencyDays || na} days`,
        `Last watered: ${plant.lastWateredAt || na}`,
        `Reminder time: ${plant.reminderTime || na}`,
        `User note: ${plant.notes || none}`
      ].join("\n");
}
