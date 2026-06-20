import { Endpoint } from "../../../parsers/openapi-parser";

/**
 * يبني دالة واحدة (exported) لكل endpoint في الـ spec.
 * بيتعامل مع: path params, query params, request body, و retry عبر request<T>.
 */
function buildEndpointFn(endpoint: Endpoint): string[] {
  const lines: string[] = [];

  const fnName = endpoint.operationId;
  const pathParams = endpoint.parameters.filter(p => p.in === "path");
  const queryParams = endpoint.parameters.filter(p => p.in === "query");

  const returnType = endpoint.responseModel || "unknown";

  const args: string[] = [];
  pathParams.forEach(p => args.push(`${p.name}: ${p.type === "integer" ? "number" : "string"}`));
  if (queryParams.length > 0) args.push(`params?: Record<string, string>`);
  if (endpoint.requestBodyModel) {
    args.push(`body?: ${endpoint.requestBodyModel}`);
  } else if (endpoint.requestBody) {
    args.push(`body?: Record<string, unknown>`);
  }

  let route = endpoint.route;
  pathParams.forEach(p => {
    route = route.replace(`{${p.name}}`, `\${${p.name}}`);
  });

  lines.push(`/** ${endpoint.summary} */`);
  lines.push(`export async function ${fnName}(${args.join(", ")}): Promise<${returnType}> {`);

  if (queryParams.length > 0 && endpoint.requestBody) {
    lines.push(`  return request<${returnType}>("${endpoint.method}", \`${route}\`, body, params);`);
  } else if (queryParams.length > 0) {
    lines.push(`  return request<${returnType}>("${endpoint.method}", \`${route}\`, undefined, params);`);
  } else if (endpoint.requestBody) {
    lines.push(`  return request<${returnType}>("${endpoint.method}", \`${route}\`, body as unknown as Record<string, unknown>);`);
  } else {
    lines.push(`  return request<${returnType}>("${endpoint.method}", \`${route}\`);`);
  }

  lines.push(`}\n`);

  return lines;
}

/**
 * يبني كل دوال الـ endpoints مجتمعة.
 */
export function generateEndpoints(endpoints: Endpoint[]): string[] {
  const lines: string[] = [];
  endpoints.forEach(endpoint => {
    lines.push(...buildEndpointFn(endpoint));
  });
  return lines;
}
