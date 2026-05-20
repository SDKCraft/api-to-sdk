import fs from "fs";
import path from "path";
import { ApiSpec, Endpoint } from "../parsers/openapi-parser";

export function generatePythonSDK(spec: ApiSpec, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });

  const lines: string[] = [];

  lines.push(`# Auto-generated SDK for ${spec.title} v${spec.version}`);
  lines.push(`# Do not edit manually\n`);
  lines.push(`import requests\n`);
  lines.push(`BASE_URL = "${spec.baseUrl}"\n`);

  spec.endpoints.forEach((endpoint: Endpoint) => {
    const fnName = toSnakeCase(endpoint.operationId);
    const pathParams = endpoint.parameters.filter(p => p.in === "path");
    const queryParams = endpoint.parameters.filter(p => p.in === "query");

    // arguments بدون self
    const args: string[] = [];
    pathParams.forEach(p => args.push(p.name));
    if (queryParams.length > 0) args.push(`params=None`);
    if (endpoint.requestBody) args.push(`body=None`);

    const argsStr = args.length > 0 ? args.join(", ") : "";

    let route = endpoint.route;
    pathParams.forEach(p => {
      route = route.replace(`{${p.name}}`, `{${p.name}}`);
    });

    lines.push(`def ${fnName}(${argsStr}):`);
    lines.push(`    """${endpoint.summary}"""`);
    lines.push(`    url = f"${spec.baseUrl}${route}"`);

    if (endpoint.method === "GET") {
      const paramsArg = queryParams.length > 0 ? `, params=params` : ``;
      lines.push(`    response = requests.get(url${paramsArg})`);
    } else if (endpoint.method === "POST") {
      lines.push(`    response = requests.post(url, json=body)`);
    } else if (endpoint.method === "PUT") {
      lines.push(`    response = requests.put(url, json=body)`);
    } else if (endpoint.method === "DELETE") {
      lines.push(`    response = requests.delete(url)`);
    }

    lines.push(`    return response.json()\n`);
  });

  const outputPath = path.join(outputDir, "sdk.py");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf-8");
  console.log(`✅ Python SDK generated at: ${outputPath}`);
}

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
}
