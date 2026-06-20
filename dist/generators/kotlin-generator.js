"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateKotlinSDK = generateKotlinSDK;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function toKotlinType(type, nullable) {
    const base = type === "number" ? "Double"
        : type === "boolean" ? "Boolean"
            : type === "integer" ? "Int"
                : "String";
    return nullable ? "$base?" : base;
}
function generateModels(models) {
    const lines = [];
    models.forEach(model => {
        lines.push(`data class ${model.name}(`);
        model.fields.forEach((field, i) => {
            const type = toKotlinType(field.type, field.nullable || !field.required);
            const default_ = !field.required ? " = null" : "";
            const comma = i < model.fields.length - 1 ? "," : "";
            lines.push(`  val ${field.name}: ${type}${default_}${comma}`);
        });
        lines.push(`)\n`);
    });
    return lines;
}
function generateKotlinSDK(spec, outputDir) {
    fs_1.default.mkdirSync(outputDir, { recursive: true });
    const lines = [];
    lines.push(`// Auto-generated SDK for ${spec.title} v${spec.version}`);
    lines.push(`// Do not edit manually\n`);
    lines.push(`import kotlinx.coroutines.Dispatchers`);
    lines.push(`import kotlinx.coroutines.withContext`);
    lines.push(`import java.net.HttpURLConnection`);
    lines.push(`import java.net.URL\n`);
    // Models
    if (spec.models.length > 0) {
        lines.push(`// ---- Models ----\n`);
        generateModels(spec.models).forEach(l => lines.push(l));
    }
    lines.push(`class ${spec.title.replace(/\s+/g, "")}Client(`);
    lines.push(`  private val baseUrl: String = "${spec.baseUrl}",`);
    lines.push(`  private val apiKey: String? = null,`);
    lines.push(`  private val bearerToken: String? = null,`);
    lines.push(`  private val timeout: Int = 30000`);
    lines.push(`) {\n`);
    lines.push(`  private suspend fun request(method: String, path: String, body: String? = null): String =`);
    lines.push(`    withContext(Dispatchers.IO) {`);
    lines.push(`      val url = URL(baseUrl + path)`);
    lines.push(`      val conn = url.openConnection() as HttpURLConnection`);
    lines.push(`      conn.requestMethod = method`);
    lines.push(`      conn.connectTimeout = timeout`);
    lines.push(`      conn.readTimeout = timeout`);
    lines.push(`      conn.setRequestProperty("Content-Type", "application/json")`);
    lines.push(`      apiKey?.let { conn.setRequestProperty("X-API-Key", it) }`);
    lines.push(`      bearerToken?.let { conn.setRequestProperty("Authorization", "Bearer \$it") }`);
    lines.push(`      if (body != null) {`);
    lines.push(`        conn.doOutput = true`);
    lines.push(`        conn.outputStream.write(body.toByteArray())`);
    lines.push(`      }`);
    lines.push(`      val code = conn.responseCode`);
    lines.push(`      if (code !in 200..299) throw Exception("API Error \$code: \${conn.responseMessage}")`);
    lines.push(`      conn.inputStream.bufferedReader().readText()`);
    lines.push(`    }\n`);
    // Endpoints
    spec.endpoints.forEach((endpoint) => {
        const fnName = endpoint.operationId;
        const pathParams = endpoint.parameters.filter(p => p.in === "path");
        const returnType = endpoint.responseModel || "String";
        const args = [];
        pathParams.forEach(p => {
            args.push(`${p.name}: ${p.type === "integer" ? "Int" : "String"}`);
        });
        if (endpoint.requestBodyModel) {
            args.push(`body: ${endpoint.requestBodyModel}? = null`);
        }
        let route = endpoint.route;
        pathParams.forEach(p => {
            route = route.replace(`{${p.name}}`, `\${${p.name}}`);
        });
        lines.push(`  /** ${endpoint.summary} */`);
        lines.push(`  suspend fun ${fnName}(${args.join(", ")}): ${returnType} {`);
        if (endpoint.requestBody) {
            lines.push(`    val json = request("${endpoint.method}", \`${route}\`, body?.toString())`);
        }
        else {
            lines.push(`    val json = request("${endpoint.method}", "${route}")`);
        }
        lines.push(`    return json as ${returnType}`);
        lines.push(`  }\n`);
    });
    lines.push(`}`);
    const outputPath = path_1.default.join(outputDir, "ApiClient.kt");
    fs_1.default.writeFileSync(outputPath, lines.join("\n"), "utf-8");
    console.log(`✅ Kotlin SDK generated at: ${outputPath}`);
}
