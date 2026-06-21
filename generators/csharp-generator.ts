import fs from "fs";
import path from "path";
import { ApiSpec, Endpoint } from "../parsers/openapi-parser";

export function generateCSharpSDK(spec: ApiSpec, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });

  const lines: string[] = [];

  lines.push(`// Auto-generated SDK for ${spec.title} v${spec.version}`);
  lines.push(`// Do not edit manually\n`);
  lines.push(`using System;`);
  lines.push(`using System.Net.Http;`);
  lines.push(`using System.Net.Http.Headers;`);
  lines.push(`using System.Text;`);
  lines.push(`using System.Text.Json;`);
  lines.push(`using System.Threading.Tasks;\n`);
  lines.push(`namespace SDKCraft\n{`);
  lines.push(`  public class ApiClient\n  {`);
  lines.push(`    private readonly HttpClient _client = new HttpClient();`);
  lines.push(`    private const string BaseUrl = "${spec.baseUrl}";\n`);
  lines.push(`    public void SetApiKey(string key) =>`);
  lines.push(`      _client.DefaultRequestHeaders.Add("X-API-Key", key);\n`);
  lines.push(`    public void SetBearerToken(string token) =>`);
  lines.push(`      _client.DefaultRequestHeaders.Authorization =`);
  lines.push(`        new AuthenticationHeaderValue("Bearer", token);\n`);
  lines.push(`    private async Task<string> RequestAsync(string method, string path, object? body = null)\n    {`);
  lines.push(`      var url = BaseUrl + path;`);
  lines.push(`      HttpResponseMessage response;`);
  lines.push(`      if (method == "GET")`);
  lines.push(`        response = await _client.GetAsync(url);`);
  lines.push(`      else\n      {`);
  lines.push(`        var json = body != null ? JsonSerializer.Serialize(body) : "{}";`);
  lines.push(`        var content = new StringContent(json, Encoding.UTF8, "application/json");`);
  lines.push(`        response = method == "POST"`);
  lines.push(`          ? await _client.PostAsync(url, content)`);
  lines.push(`          : method == "PUT"`);
  lines.push(`            ? await _client.PutAsync(url, content)`);
  lines.push(`            : await _client.DeleteAsync(url);`);
  lines.push(`      }`);
  lines.push(`      response.EnsureSuccessStatusCode();`);
  lines.push(`      return await response.Content.ReadAsStringAsync();`);
  lines.push(`    }\n`);

  spec.endpoints.forEach((endpoint: Endpoint) => {
    const fnName = capitalize(endpoint.operationId);
    const pathParams = endpoint.parameters.filter(p => p.in === "path");

    const args: string[] = [];
    pathParams.forEach(p => args.push(`string ${p.name}`));
    if (endpoint.requestBody) args.push(`object? body = null`);

    let route = endpoint.route;
    pathParams.forEach(p => {
      route = route.replace(`{${p.name}}`, `{${p.name}}`);
    });

    const routeStr = pathParams.length > 0
      ? `$"${route}"`
      : `"${route}"`;

    lines.push(`    /// <summary>${endpoint.summary}</summary>`);
    lines.push(`    public async Task<string> ${fnName}Async(${args.join(", ")}) =>`);
    lines.push(`      await RequestAsync("${endpoint.method}", ${routeStr}${endpoint.requestBody ? ", body" : ""});\n`);
  });

  lines.push(`  }`);
  lines.push(`}`);

  const outputPath = path.join(outputDir, "ApiClient.cs");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf-8");
  console.log(`✅ C# SDK generated at: ${outputPath}`);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}