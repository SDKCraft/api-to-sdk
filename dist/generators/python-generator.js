"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePythonSDK = generatePythonSDK;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function generatePythonSDK(spec, outputDir) {
    fs_1.default.mkdirSync(outputDir, { recursive: true });
    const lines = [];
    lines.push(`# Auto-generated SDK for ${spec.title} v${spec.version}`);
    lines.push(`# Do not edit manually\n`);
    lines.push(`import requests\n`);
    lines.push(`BASE_URL = "${spec.baseUrl}"\n`);
    spec.endpoints.forEach((endpoint) => {
        const fnName = toSnakeCase(endpoint.operationId);
        const pathParams = endpoint.parameters.filter(p => p.in === "path");
        const queryParams = endpoint.parameters.filter(p => p.in === "query");
        // arguments بدون self
        const args = [];
        pathParams.forEach(p => args.push(p.name));
        if (queryParams.length > 0)
            args.push(`params=None`);
        if (endpoint.requestBody)
            args.push(`body=None`);
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
        }
        else if (endpoint.method === "POST") {
            lines.push(`    response = requests.post(url, json=body)`);
        }
        else if (endpoint.method === "PUT") {
            lines.push(`    response = requests.put(url, json=body)`);
        }
        else if (endpoint.method === "DELETE") {
            lines.push(`    response = requests.delete(url)`);
        }
        lines.push(`    return response.json()\n`);
    });
    const outputPath = path_1.default.join(outputDir, "sdk.py");
    fs_1.default.writeFileSync(outputPath, lines.join("\n"), "utf-8");
    console.log(`✅ Python SDK generated at: ${outputPath}`);
}
function toSnakeCase(str) {
    return str.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
}
