import { ApiSpec } from "../parsers/openapi-parser";

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
        const isPaid = model === PAID_FALLBACK_MODEL;
        console.log(`✅ Used model: ${model}${isPaid ? " (paid fallback — free models unavailable)" : ""}`);
        return text;
      }
      console.log(`⚠️ Model ${model} returned empty, trying next...`);
    } catch (err) {
      console.log(`❌ Model ${model} failed, trying next...`);
    }
  }
  return "Failed to generate documentation. Please try again later.";
}
