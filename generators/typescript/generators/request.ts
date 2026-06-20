/**
 * يبني دالة `request<T>` الداخلية المسؤولة عن:
 * - بناء الـ URL النهائي (مع query params)
 * - إرفاق هيدرز المصادقة (API Key / Bearer Token)
 * - إعادة المحاولة (retry) عند 429 أو 5xx أو فشل الشبكة
 *
 * هذه الدالة private (مش exported) — بتُستخدم داخليًا فقط من دوال الـ endpoints.
 */
export function generateRequestFn(): string[] {
  const lines: string[] = [];

  lines.push(`async function sleep(ms: number): Promise<void> {`);
  lines.push(`  return new Promise(resolve => setTimeout(resolve, ms));`);
  lines.push(`}\n`);

  lines.push(`async function request<T>(method: string, path: string, body?: Record<string, unknown>, params?: Record<string, string>, retries = 3): Promise<T> {`);
  lines.push(`  let url = BASE_URL + path;`);
  lines.push(`  if (params) {`);
  lines.push(`    const query = new URLSearchParams(params).toString();`);
  lines.push(`    if (query) url += "?" + query;`);
  lines.push(`  }`);
  lines.push(`  const headers: Record<string, string> = { "Content-Type": "application/json" };`);
  lines.push(`  if (_apiKey) headers["X-API-Key"] = _apiKey;`);
  lines.push(`  if (_bearerToken) headers["Authorization"] = "Bearer " + _bearerToken;`);
  lines.push(`  for (let attempt = 1; attempt <= retries; attempt++) {`);
  lines.push(`    try {`);
  lines.push(`      const res = await fetch(url, {`);
  lines.push(`        method,`);
  lines.push(`        headers,`);
  lines.push(`        body: body ? JSON.stringify(body) : undefined,`);
  lines.push(`      });`);
  lines.push(`      if (res.status === 429 || res.status >= 500) {`);
  lines.push(`        if (attempt < retries) { await sleep(attempt * 1000); continue; }`);
  lines.push(`      }`);
  lines.push(`      if (!res.ok) throw new Error(\`API Error \${res.status}: \${res.statusText}\`);`);
  lines.push(`      return res.json() as Promise<T>;`);
  lines.push(`    } catch (err) {`);
  lines.push(`      if (attempt === retries) throw err;`);
  lines.push(`      await sleep(attempt * 1000);`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push(`  throw new Error("Request failed after " + retries + " retries");`);
  lines.push(`}\n`);

  return lines;
}
