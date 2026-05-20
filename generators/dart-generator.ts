import fs from "fs";
import path from "path";
import { ApiSpec, Endpoint } from "../parsers/openapi-parser";

export function generateDartSDK(spec: ApiSpec, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });

  const lines: string[] = [];

  lines.push(`// Auto-generated SDK for ${spec.title} v${spec.version}`);
  lines.push(`// Do not edit manually\n`);
  lines.push(`import 'dart:convert';`);
  lines.push(`import 'package:http/http.dart' as http;\n`);
  lines.push(`const String baseUrl = '${spec.baseUrl}';\n`);

  // دالة مساعدة
  lines.push(`Future<dynamic> _request(String method, String path, {Map<String, dynamic>? body, Map<String, String>? params}) async {`);
  lines.push(`  Uri uri = Uri.parse(baseUrl + path);`);
  lines.push(`  if (params != null) uri = uri.replace(queryParameters: params);`);
  lines.push(`  http.Response response;`);
  lines.push(`  final headers = {'Content-Type': 'application/json'};`);
  lines.push(`  if (method == 'GET') {`);
  lines.push(`    response = await http.get(uri, headers: headers);`);
  lines.push(`  } else if (method == 'POST') {`);
  lines.push(`    response = await http.post(uri, headers: headers, body: jsonEncode(body));`);
  lines.push(`  } else if (method == 'PUT') {`);
  lines.push(`    response = await http.put(uri, headers: headers, body: jsonEncode(body));`);
  lines.push(`  } else {`);
  lines.push(`    response = await http.delete(uri, headers: headers);`);
  lines.push(`  }`);
  lines.push(`  return jsonDecode(response.body);`);
  lines.push(`}\n`);

  spec.endpoints.forEach((endpoint: Endpoint) => {
    const fnName = toCamelCase(endpoint.operationId);
    const pathParams = endpoint.parameters.filter(p => p.in === "path");
    const queryParams = endpoint.parameters.filter(p => p.in === "query");

    const args: string[] = [];
    pathParams.forEach(p => args.push(`String ${p.name}`));
    if (queryParams.length > 0) args.push(`Map<String, String>? params`);
    if (endpoint.requestBody) args.push(`Map<String, dynamic>? body`);

    let route = endpoint.route;
    pathParams.forEach(p => {
      route = route.replace(`{${p.name}}`, `\${${p.name}}`);
    });

    lines.push(`/// ${endpoint.summary}`);
    lines.push(`Future<dynamic> ${fnName}(${args.join(", ")}) async {`);

    const hasQuery = queryParams.length > 0;
    const hasBody = !!endpoint.requestBody;

    if (hasQuery && hasBody) {
      lines.push(`  return _request('${endpoint.method}', '${route}', body: body, params: params);`);
    } else if (hasQuery) {
      lines.push(`  return _request('${endpoint.method}', '${route}', params: params);`);
    } else if (hasBody) {
      lines.push(`  return _request('${endpoint.method}', '${route}', body: body);`);
    } else {
      lines.push(`  return _request('${endpoint.method}', '${route}');`);
    }

    lines.push(`}\n`);
  });

  const outputPath = path.join(outputDir, "sdk.dart");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf-8");
  console.log(`✅ Dart SDK generated at: ${outputPath}`);
}

function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}
