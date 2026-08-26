import fs from "fs";
import yaml from "js-yaml";

export interface Parameter {
  name: string;
  in: string;
  required: boolean;
  type: string;
}

export interface ModelField {
  name: string;
  type: string;
  required: boolean;
  nullable: boolean;
}

export interface Model {
  name: string;
  fields: ModelField[];
}

export interface Endpoint {
  method: string;
  route: string;
  operationId: string;
  summary: string;
  parameters: Parameter[];
  requestBody: string | null;
  requestBodyModel: string | null;
  responseModel: string | null;
  responses: string[];
}

export interface ApiSpec {
  title: string;
  version: string;
  baseUrl: string;
  endpoints: Endpoint[];
  models: Model[];
}

function openApiTypToTs(schema: any, isArrayItem = false): string {
  if (schema?.$ref) return resolveRef(schema.$ref);

  if (schema?.type === "integer" || schema?.type === "number") {
    return "number";
  }

  if (schema?.type === "boolean") return "boolean";

  if (schema?.type === "string") return "string";
  
  if (schema?.type === "array") {
    return `${openApiTypToTs(schema.items, true)}[]`;
  }

  return isArrayItem ? "unknown" : "string";
}

function extractModels(schemas: Record<string, any>): Model[] {
  const models: Model[] = [];
  for (const name in schemas) {
    const schema = schemas[name];
    if (schema.type === "object" || schema.properties) {
      const required: string[] = schema.required || [];
      const fields: ModelField[] = [];
      for (const fieldName in schema.properties || {}) {
        const prop = schema.properties[fieldName];
        fields.push({
          name: fieldName,
          type: openApiTypToTs(prop),
          required: required.includes(fieldName),
          nullable: prop.nullable || false,
        });
      }
      models.push({ name, fields });
    }
  }
  return models;
}

function resolveRef(ref: string): string {
  return ref.replace("#/components/schemas/", "");
}

export function parseOpenApi(filePath: string): ApiSpec {
  const rawData = fs.readFileSync(filePath, "utf-8");
  const spec = filePath.endsWith(".yaml") || filePath.endsWith(".yml")
    ? yaml.load(rawData) as any
    : JSON.parse(rawData);

  const schemas = spec.components?.schemas || {};
  const models = extractModels(schemas);
  const endpoints: Endpoint[] = [];
  const paths = spec.paths || {};

  for (const route in paths) {
    for (const method in paths[route]) {
      const op = paths[route][method];

      const parameters: Parameter[] = (op.parameters || []).map((p: any) => ({
        name: p.name,
        in: p.in,
        required: p.required || false,
        type: p.schema?.type || "string",
      }));

      const responses = Object.keys(op.responses || {});

      const requestBody = op.requestBody
        ? JSON.stringify(op.requestBody?.content)
        : null;

      // استخرج اسم الـ model من requestBody
      let requestBodyModel: string | null = null;
      const rbRef = op.requestBody?.content?.["application/json"]?.schema?.$ref;
      if (rbRef) requestBodyModel = resolveRef(rbRef);

      // استخرج اسم الـ model من response
      let responseModel: string | null = null;
      const successResponse = op.responses?.["200"] || op.responses?.["201"];
      const resRef = successResponse?.content?.["application/json"]?.schema?.$ref;
      const resArrayRef = successResponse?.content?.["application/json"]?.schema?.items?.$ref;
      if (resRef) responseModel = resolveRef(resRef);
      else if (resArrayRef) responseModel = resolveRef(resArrayRef) + "[]";

      endpoints.push({
        method: method.toUpperCase(),
        route,
        operationId: op.operationId || `${method}_${route.replace(/\//g, "_")}`,
        summary: op.summary || "",
        parameters,
        requestBody,
        requestBodyModel,
        responseModel,
        responses,
      });
    }
  }

  return {
    title: spec.info?.title || "Unknown API",
    version: spec.info?.version || "1.0.0",
    baseUrl: spec.servers?.[0]?.url || "",
    endpoints,
    models,
  };
}