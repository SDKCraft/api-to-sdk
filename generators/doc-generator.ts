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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  const data = await response.json() as any;
  console.log("Gemini response:", JSON.stringify(data, null, 2));
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}