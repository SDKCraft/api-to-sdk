import fs from "fs";
import path from "path";
import { ApiSpec, Endpoint } from "../parsers/openapi-parser";

export function generateJavaSDK(spec: ApiSpec, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });

  const lines: string[] = [];

  lines.push(`// Auto-generated SDK for ${spec.title} v${spec.version}`);
  lines.push(`// Do not edit manually\n`);
  lines.push(`import java.net.URI;`);
  lines.push(`import java.net.http.HttpClient;`);
  lines.push(`import java.net.http.HttpRequest;`);
  lines.push(`import java.net.http.HttpResponse;`);
  lines.push(`import java.time.Duration;\n`);
  lines.push(`public class ApiClient {\n`);
  lines.push(`  private static final String BASE_URL = "${spec.baseUrl}";`);
  lines.push(`  private String apiKey = "";`);
  lines.push(`  private String bearerToken = "";`);
  lines.push(`  private final HttpClient client = HttpClient.newBuilder()`);
  lines.push(`    .connectTimeout(Duration.ofSeconds(30)).build();\n`);
  lines.push(`  public void setApiKey(String key) { this.apiKey = key; }`);
  lines.push(`  public void setBearerToken(String token) { this.bearerToken = token; }\n`);
  lines.push(`  private String request(String method, String path, String body) throws Exception {`);
  lines.push(`    HttpRequest.Builder builder = HttpRequest.newBuilder()`);
  lines.push(`      .uri(URI.create(BASE_URL + path))`);
  lines.push(`      .header("Content-Type", "application/json");`);
  lines.push(`    if (!apiKey.isEmpty()) builder.header("X-API-Key", apiKey);`);
  lines.push(`    if (!bearerToken.isEmpty()) builder.header("Authorization", "Bearer " + bearerToken);`);
  lines.push(`    if (method.equals("GET")) builder.GET();`);
  lines.push(`    else builder.method(method, HttpRequest.BodyPublishers.ofString(body != null ? body : ""));`);
  lines.push(`    HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());`);
  lines.push(`    if (response.statusCode() >= 400)`);
  lines.push(`      throw new RuntimeException("API Error: " + response.statusCode());`);
  lines.push(`    return response.body();`);
  lines.push(`  }\n`);

  spec.endpoints.forEach((endpoint: Endpoint) => {
    const fnName = endpoint.operationId;
    const pathParams = endpoint.parameters.filter(p => p.in === "path");

    const args: string[] = [];
    pathParams.forEach(p => args.push(`String ${p.name}`));
    if (endpoint.requestBody) args.push(`String body`);

    let route = endpoint.route;
    pathParams.forEach(p => {
      route = route.replace(`{${p.name}}`, `" + ${p.name} + "`);
    });

    lines.push(`  /** ${endpoint.summary} */`);
    lines.push(`  public String ${fnName}(${args.join(", ")}) throws Exception {`);

    if (endpoint.requestBody) {
      lines.push(`    return request("${endpoint.method}", "${route}", body);`);
    } else {
      lines.push(`    return request("${endpoint.method}", "${route}", null);`);
    }

    lines.push(`  }\n`);
  });

  lines.push(`}`);

  const outputPath = path.join(outputDir, "ApiClient.java");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf-8");
  console.log(`✅ Java SDK generated at: ${outputPath}`);
}