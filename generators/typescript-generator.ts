import fs from "fs";
import path from "path";
import { ApiSpec, Endpoint } from "../parsers/openapi-parser";

export function generateTypeScriptSDK(spec: ApiSpec, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });

  const lines: string[] = [];

  // Header
  lines.push(`// Auto-generated SDK for ${spec.title} v${spec.version}`);
  lines.push(`// Do not edit manually\n`);
  lines.push(`const BASE_URL = "${spec.baseUrl}";\n`);

  // دالة fetch مساعدة
lines.push(`let _apiKey: string | null = null;`);
lines.push(`let _bearerToken: string | null = null;\n`);
lines.push(`export function setApiKey(key: string): void {`);
lines.push(`  _apiKey = key;`);
lines.push(`}`);
lines.push(`\nexport function setBearerToken(token: string): void {`);
lines.push(`  _bearerToken = token;`);
lines.push(`}\n`);
lines.push(`async function request(method: string, path: string, body?: any, params?: Record<string, any>): Promise<any> {`);
lines.push(`  let url = BASE_URL + path;`);
lines.push(`  if (params) {`);
lines.push(`    const query = new URLSearchParams(params).toString();`);
lines.push(`    if (query) url += "?" + query;`);
lines.push(`  }`);
lines.push(`  const headers: Record<string, string> = { "Content-Type": "application/json" };`);
lines.push(`  if (_apiKey) headers["X-API-Key"] = _apiKey;`);
lines.push(`  if (_bearerToken) headers["Authorization"] = "Bearer " + _bearerToken;`);
lines.push(`  const res = await fetch(url, {`);
lines.push(`    method,`);
lines.push(`    headers,`);
lines.push(`    body: body ? JSON.stringify(body) : undefined,`);
lines.push(`  });`);
lines.push(`  if (!res.ok) throw new Error("API Error: " + res.status + " " + res.statusText);`);
lines.push(`  return res.json();`);
lines.push(`}\n`);
lines.push(`/** Fetch all pages automatically */`);
lines.push(`export async function paginate(fn: (page: number) => Promise<any>, maxPages = 10): Promise<any[]> {`);
lines.push(`  const results: any[] = [];`);
lines.push(`  for (let page = 1; page <= maxPages; page++) {`);
lines.push(`    const data = await fn(page);`);
lines.push(`    if (!data || (Array.isArray(data) && data.length === 0)) break;`);
lines.push(`    if (Array.isArray(data)) results.push(...data);`);
lines.push(`    else if (data.data) results.push(...data.data);`);
lines.push(`    else { results.push(data); break; }`);
lines.push(`  }`);
lines.push(`  return results;`);
lines.push(`}\n`);
  // توليد دالة لكل endpoint
  spec.endpoints.forEach((endpoint: Endpoint) => {
    const fnName = endpoint.operationId;
    const pathParams = endpoint.parameters.filter(p => p.in === "path");
    const queryParams = endpoint.parameters.filter(p => p.in === "query");

    // بناء arguments
    const args: string[] = [];
    pathParams.forEach(p => args.push(`${p.name}: ${p.type === "integer" ? "number" : "string"}`));
    if (queryParams.length > 0) args.push(`params?: Record<string, any>`);
    if (endpoint.requestBody) args.push(`body?: Record<string, any>`);

    // بناء الـ route مع استبدال path params
    let route = endpoint.route;
    pathParams.forEach(p => {
      route = route.replace(`{${p.name}}`, `\${${p.name}}`);
    });

    lines.push(`/** ${endpoint.summary} */`);
    lines.push(`export async function ${fnName}(${args.join(", ")}): Promise<any> {`);

    if (queryParams.length > 0 && endpoint.requestBody) {
      lines.push(`  return request("${endpoint.method}", \`${route}\`, body, params);`);
    } else if (queryParams.length > 0) {
      lines.push(`  return request("${endpoint.method}", \`${route}\`, undefined, params);`);
    } else if (endpoint.requestBody) {
      lines.push(`  return request("${endpoint.method}", \`${route}\`, body);`);
    } else {
      lines.push(`  return request("${endpoint.method}", \`${route}\`);`);
    }

    lines.push(`}\n`);
  });

  // حفظ الملف
  const outputPath = path.join(outputDir, "index.ts");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf-8");
  console.log(`✅ TypeScript SDK generated at: ${outputPath}`);
}