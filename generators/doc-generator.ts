import { ApiSpec } from "../parsers/openapi-parser";

export async function generateAIDocs(api: ApiSpec): Promise<string> {
  const prompt = `You are a technical documentation expert.
Given this OpenAPI spec summary, generate professional Markdown documentation:
API Title: ${api.title}
Version: ${api.version}
Endpoints: ${JSON.stringify(api.endpoints, null, 2)}
Generate:
1. Overview section
2. Authentication guide
3. Each endpoint with: description, parameters, request/response examples, error codes
4. Quick start code example in TypeScript`;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemma-4-31b-it:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
      }),
    }
  );

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || "";
}
