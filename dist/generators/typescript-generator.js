"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTypeScriptSDK = generateTypeScriptSDK;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function generateTypeScriptSDK(spec, outputDir) {
    fs_1.default.mkdirSync(outputDir, { recursive: true });
    const lines = [];
    // Header
    lines.push(`// Auto-generated SDK for ${spec.title} v${spec.version}`);
    lines.push(`// Do not edit manually\n`);
    lines.push(`const BASE_URL = "${spec.baseUrl}";\n`);
    // دالة fetch مساعدة
    lines.push(`async function request(method: string, path: string, body?: any, params?: Record<string, any>): Promise<any> {`);
    lines.push(`  let url = BASE_URL + path;`);
    lines.push(`  if (params) {`);
    lines.push(`    const query = new URLSearchParams(params).toString();`);
    lines.push(`    if (query) url += "?" + query;`);
    lines.push(`  }`);
    lines.push(`  const res = await fetch(url, {`);
    lines.push(`    method,`);
    lines.push(`    headers: { "Content-Type": "application/json" },`);
    lines.push(`    body: body ? JSON.stringify(body) : undefined,`);
    lines.push(`  });`);
    lines.push(`  return res.json();`);
    lines.push(`}\n`);
    // توليد دالة لكل endpoint
    spec.endpoints.forEach((endpoint) => {
        const fnName = endpoint.operationId;
        const pathParams = endpoint.parameters.filter(p => p.in === "path");
        const queryParams = endpoint.parameters.filter(p => p.in === "query");
        // بناء arguments
        const args = [];
        pathParams.forEach(p => args.push(`${p.name}: ${p.type === "integer" ? "number" : "string"}`));
        if (queryParams.length > 0)
            args.push(`params?: Record<string, any>`);
        if (endpoint.requestBody)
            args.push(`body?: Record<string, any>`);
        // بناء الـ route مع استبدال path params
        let route = endpoint.route;
        pathParams.forEach(p => {
            route = route.replace(`{${p.name}}`, `\${${p.name}}`);
        });
        lines.push(`/** ${endpoint.summary} */`);
        lines.push(`export async function ${fnName}(${args.join(", ")}): Promise<any> {`);
        if (queryParams.length > 0 && endpoint.requestBody) {
            lines.push(`  return request("${endpoint.method}", \`${route}\`, body, params);`);
        }
        else if (queryParams.length > 0) {
            lines.push(`  return request("${endpoint.method}", \`${route}\`, undefined, params);`);
        }
        else if (endpoint.requestBody) {
            lines.push(`  return request("${endpoint.method}", \`${route}\`, body);`);
        }
        else {
            lines.push(`  return request("${endpoint.method}", \`${route}\`);`);
        }
        lines.push(`}\n`);
    });
    // حفظ الملف
    const outputPath = path_1.default.join(outputDir, "index.ts");
    fs_1.default.writeFileSync(outputPath, lines.join("\n"), "utf-8");
    console.log(`✅ TypeScript SDK generated at: ${outputPath}`);
}
