"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOpenApi = parseOpenApi;
const fs_1 = __importDefault(require("fs"));
function parseOpenApi(filePath) {
    const rawData = fs_1.default.readFileSync(filePath, "utf-8");
    const spec = JSON.parse(rawData);
    const endpoints = [];
    const paths = spec.paths || {};
    for (const route in paths) {
        for (const method in paths[route]) {
            const op = paths[route][method];
            // استخرج البارامترات
            const parameters = (op.parameters || []).map((p) => ({
                name: p.name,
                in: p.in,
                required: p.required || false,
                type: p.schema?.type || "string",
            }));
            // استخرج الـ responses
            const responses = Object.keys(op.responses || {});
            // استخرج الـ requestBody إن وجد
            const requestBody = op.requestBody
                ? JSON.stringify(op.requestBody?.content)
                : null;
            endpoints.push({
                method: method.toUpperCase(),
                route,
                operationId: op.operationId || `${method}_${route.replace(/\//g, "_")}`,
                summary: op.summary || "",
                parameters,
                requestBody,
                responses,
            });
        }
    }
    return {
        title: spec.info?.title || "Unknown API",
        version: spec.info?.version || "1.0.0",
        baseUrl: spec.servers?.[0]?.url || "",
        endpoints,
    };
}
// تشغيل مباشر للتجربة
const result = parseOpenApi("./examples/openapi.json");
console.log("API:", result.title, "v" + result.version);
console.log("Base URL:", result.baseUrl);
console.log(`\nEndpoints (${result.endpoints.length}):`);
result.endpoints.forEach((e) => {
    console.log(`  ${e.method} ${e.route} — ${e.summary}`);
});
