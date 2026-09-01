import { ApiSpec } from "sdkcraft-core";

// موديلات مجانية أولاً (تكلفة صفر) - لو كلهم فشلوا (مثلاً بسبب rate limit عام
// على الموديلات المجانية في OpenRouter وقت الضغط)، نلجأ لموديل مدفوع رخيص
// (Claude Haiku) كضمانة نهائية للاعتمادية، بدل ما يفشل الطلب بالكامل للمستخدم.
const FREE_MODELS = [
  "google/gemma-4-31b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
];

const PAID_FALLBACK_MODEL = "anthropic/claude-haiku-4.5";

const MODELS = [...FREE_MODELS, PAID_FALLBACK_MODEL];

// ---- سقف يومي على استدعاءات الموديل المدفوع (paid fallback) ----
// بدون هذا السقف، لو الموديلات المجانية بـ OpenRouter بقت غير متاحة لفترة طويلة
// (شائع وقت الضغط العام على الموديلات المجانية)، كل طلب توليد وثائق هيروح تلقائيًا
// للموديل المدفوع بلا أي حد أقصى — يعني فاتورة مفتوحة بلا سقف واضح.
// هذا عداد في الذاكرة (in-memory) بيتصفّر كل 24 ساعة، مناسب لأن السيرفر عندنا
// حاليًا instance واحد بس على Render (مش موزّع/scaled) — لو مستقبلاً بقى عندك
// أكتر من instance، محتاج تنقل العداد ده لمخزن مشترك (Redis/DB) عشان يفضل دقيق.
const MAX_PAID_FALLBACK_CALLS_PER_DAY = Number(process.env.MAX_PAID_FALLBACK_CALLS_PER_DAY) || 50;
let paidFallbackCount = 0;
let paidFallbackWindowStart = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

function paidFallbackAllowed(): boolean {
  const now = Date.now();
  if (now - paidFallbackWindowStart >= DAY_MS) {
    paidFallbackCount = 0;
    paidFallbackWindowStart = now;
  }
  return paidFallbackCount < MAX_PAID_FALLBACK_CALLS_PER_DAY;
}

export async function generateAIDocs(api: ApiSpec): Promise<string> {
  const prompt = `You are a technical documentation expert.
Given this OpenAPI spec summary, generate professional Markdown documentation:
API Title: ${api.title}
Version: ${api.version}
Endpoints: ${JSON.stringify(api.endpoints, null, 2)}
Generate:
1. Overview section
2. Authentication guide
3. Each endpoint with: description, parameters,
request/response examples, error codes
4. Quick start code example in TypeScript`;

  for (const model of MODELS) {
    const isPaid = model === PAID_FALLBACK_MODEL;
    if (isPaid && !paidFallbackAllowed()) {
      console.log(`🛑 Paid fallback daily cap reached (${MAX_PAID_FALLBACK_CALLS_PER_DAY}/day) — skipping ${model}`);
      continue;
    }
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4000,
          }),
        }
      );
      const data = await response.json() as any;
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        if (isPaid) {
          paidFallbackCount++;
          console.log(`✅ Used model: ${model} (paid fallback — free models unavailable) [${paidFallbackCount}/${MAX_PAID_FALLBACK_CALLS_PER_DAY} today]`);
        } else {
          console.log(`✅ Used model: ${model}`);
        }
        return text;
      }
      console.log(`⚠️ Model ${model} returned empty, trying next...`);
    } catch (err) {
      console.log(`❌ Model ${model} failed, trying next...`);
    }
  }
  return "Failed to generate documentation. Please try again later — our free-tier AI models are currently at capacity.";
}