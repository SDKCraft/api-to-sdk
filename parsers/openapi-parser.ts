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

export interface EnumModel {
  name: string;
  values: string[];
  baseType: "string" | "integer";
}

export interface UnionModel {
  name: string;
  refs: string[];
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
  enums: EnumModel[];
  unions: UnionModel[];
}

function openApiTypToTs(type: string, format?: string): string {
  if (type === "integer" || type === "number") return "number";
  if (type === "boolean") return "boolean";
  if (type === "array") return "unknown[]";
  return "string";
}

function resolveRef(ref: string): string {
  return ref.replace("#/components/schemas/", "");
}

function toPascalCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function synthesizeModelName(parentModelName: string, fieldName: string): string {
  return `${parentModelName}${toPascalCase(fieldName)}`;
}

/** true لو الـ schema عبارة عن enum بسيط (string/integer + enum array) */
function isEnumSchema(schema: any): boolean {
  return !!schema && Array.isArray(schema.enum) && (schema.type === "string" || schema.type === "integer" || !schema.type);
}

/** true لو الـ schema عبارة عن oneOf/anyOf فقط (union) بدون properties خاصة بيها */
function isUnionSchema(schema: any): boolean {
  return !!schema && (Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf)) && !schema.properties;
}

function buildAndRegisterEnum(
  name: string,
  schema: any,
  enums: EnumModel[]
): void {
  if (enums.some(e => e.name === name)) return;
  enums.push({
    name,
    values: schema.enum.map((v: any) => String(v)),
    baseType: schema.type === "integer" ? "integer" : "string",
  });
}

function buildAndRegisterUnion(
  name: string,
  schema: any,
  schemas: Record<string, any>,
  models: Model[],
  enums: EnumModel[],
  unions: UnionModel[]
): void {
  if (unions.some(u => u.name === name)) return;
  const branches: any[] = schema.oneOf || schema.anyOf || [];
  const refs: string[] = [];
  for (const branch of branches) {
    if (branch?.$ref) {
      refs.push(resolveRef(branch.$ref));
    } else if (branch) {
      // فرع inline (زي string/object بدون $ref) - نولّد اسم مركب ونسجله كموديل/enum لو لزم
      const syntheticName = `${name}Variant${refs.length + 1}`;
      if (isEnumSchema(branch)) {
        buildAndRegisterEnum(syntheticName, branch, enums);
      } else if (branch.type === "object" && branch.properties) {
        buildAndRegisterModel(syntheticName, branch, schemas, models, enums, unions);
      }
      refs.push(syntheticName);
    }
  }
  unions.push({ name, refs });
}

/**
 * يحل نوع الحقل (property) لاسم الموديل/enum/union أو النوع البدائي الصحيح.
 * بيتعامل مع: $ref مباشر، allOf، array، inline object، inline enum، inline union
 * (oneOf/anyOf)، والأنواع البدائية العادية.
 */
function resolvePropertyType(
  prop: any,
  context: { parentModelName: string; fieldName: string },
  schemas: Record<string, any>,
  models: Model[],
  enums: EnumModel[],
  unions: UnionModel[]
): string {
  if (!prop) return "string";

  if (prop.$ref) {
    return resolveRef(prop.$ref);
  }

  if (Array.isArray(prop.allOf)) {
    const refEntry = prop.allOf.find((s: any) => s && s.$ref);
    if (refEntry) return resolveRef(refEntry.$ref);
    return "unknown";
  }

  if (isUnionSchema(prop)) {
    const syntheticName = synthesizeModelName(context.parentModelName, context.fieldName);
    buildAndRegisterUnion(syntheticName, prop, schemas, models, enums, unions);
    return syntheticName;
  }

  if (isEnumSchema(prop)) {
    const syntheticName = synthesizeModelName(context.parentModelName, context.fieldName);
    buildAndRegisterEnum(syntheticName, prop, enums);
    return syntheticName;
  }

  if (prop.type === "array") {
    if (prop.items?.$ref) return `${resolveRef(prop.items.$ref)}[]`;
    if (prop.items?.allOf) {
      const refEntry = prop.items.allOf.find((s: any) => s && s.$ref);
      if (refEntry) return `${resolveRef(refEntry.$ref)}[]`;
    }
    if (prop.items && isEnumSchema(prop.items)) {
      const syntheticName = synthesizeModelName(context.parentModelName, context.fieldName);
      buildAndRegisterEnum(syntheticName, prop.items, enums);
      return `${syntheticName}[]`;
    }
    if (prop.items && isUnionSchema(prop.items)) {
      const syntheticName = synthesizeModelName(context.parentModelName, context.fieldName);
      buildAndRegisterUnion(syntheticName, prop.items, schemas, models, enums, unions);
      return `${syntheticName}[]`;
    }
    if (prop.items?.type === "object" && prop.items.properties) {
      const syntheticName = synthesizeModelName(context.parentModelName, context.fieldName);
      buildAndRegisterModel(syntheticName, prop.items, schemas, models, enums, unions);
      return `${syntheticName}[]`;
    }
    if (prop.items?.type && prop.items.type !== "array") {
      return `${openApiTypToTs(prop.items.type, prop.items.format)}[]`;
    }
    return "unknown[]";
  }

  if (prop.type === "object" && prop.properties) {
    const syntheticName = synthesizeModelName(context.parentModelName, context.fieldName);
    buildAndRegisterModel(syntheticName, prop, schemas, models, enums, unions);
    return syntheticName;
  }

  return openApiTypToTs(prop.type, prop.format);
}

function collectSchemaProperties(
  schema: any,
  schemas: Record<string, any>,
  seen: Set<string> = new Set()
): { properties: Record<string, any>; required: string[] } {
  let properties: Record<string, any> = {};
  let required: string[] = [];

  if (Array.isArray(schema.allOf)) {
    for (const branch of schema.allOf) {
      if (!branch) continue;
      if (branch.$ref) {
        const refName = resolveRef(branch.$ref);
        if (seen.has(refName)) continue;
        const refSchema = schemas[refName];
        if (refSchema) {
          const nested = collectSchemaProperties(refSchema, schemas, new Set([...seen, refName]));
          properties = { ...properties, ...nested.properties };
          required = [...required, ...nested.required];
        }
      } else {
        const nested = collectSchemaProperties(branch, schemas, seen);
        properties = { ...properties, ...nested.properties };
        required = [...required, ...nested.required];
      }
    }
  }

  if (schema.properties) {
    properties = { ...properties, ...schema.properties };
  }
  if (Array.isArray(schema.required)) {
    required = [...required, ...schema.required];
  }

  return { properties, required };
}

function buildAndRegisterModel(
  name: string,
  schema: any,
  schemas: Record<string, any>,
  models: Model[],
  enums: EnumModel[],
  unions: UnionModel[]
): void {
  if (models.some(m => m.name === name)) return;
  const { properties, required } = collectSchemaProperties(schema, schemas);
  const fields: ModelField[] = [];
  for (const fieldName in properties) {
    const prop = properties[fieldName];
    fields.push({
      name: fieldName,
      type: resolvePropertyType(prop, { parentModelName: name, fieldName }, schemas, models, enums, unions),
      required: required.includes(fieldName),
      nullable: prop.nullable || false,
    });
  }
  models.push({ name, fields });
}

function extractModels(
  schemas: Record<string, any>,
  models: Model[],
  enums: EnumModel[],
  unions: UnionModel[]
): void {
  for (const name in schemas) {
    if (models.some(m => m.name === name)) continue;
    if (enums.some(e => e.name === name)) continue;
    if (unions.some(u => u.name === name)) continue;
    const schema = schemas[name];

    if (isEnumSchema(schema)) {
      buildAndRegisterEnum(name, schema, enums);
      continue;
    }
    if (isUnionSchema(schema)) {
      buildAndRegisterUnion(name, schema, schemas, models, enums, unions);
      continue;
    }
    const isObjectLike = schema.type === "object" || !!schema.properties || Array.isArray(schema.allOf);
    if (isObjectLike) {
      buildAndRegisterModel(name, schema, schemas, models, enums, unions);
    }
  }
}

function toPascalSegment(segment: string): string {
  return segment
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function buildFallbackOperationId(method: string, route: string): string {
  const segments = route.split("/").filter(Boolean);
  const nameParts = segments.map(seg => {
    const paramMatch = seg.match(/^\{(.+)\}$/);
    if (paramMatch) {
      return "By" + toPascalSegment(paramMatch[1]);
    }
    return toPascalSegment(seg);
  });
  const combined = nameParts.join("");
  const withMethod = method.toLowerCase() + combined;
  return combined.length > 0 ? withMethod : method.toLowerCase() + "Root";
}

export function parseOpenApi(filePath: string): ApiSpec {
  const rawData = fs.readFileSync(filePath, "utf-8");
  const spec = filePath.endsWith(".yaml") || filePath.endsWith(".yml")
    ? yaml.load(rawData) as any
    : JSON.parse(rawData);

  const schemas = spec.components?.schemas || {};
  const models: Model[] = [];
  const enums: EnumModel[] = [];
  const unions: UnionModel[] = [];
  extractModels(schemas, models, enums, unions);

  const endpoints: Endpoint[] = [];
  const paths = spec.paths || {};

  for (const route in paths) {
    const validMethods = ["get", "post", "put", "patch", "delete", "options", "head", "trace"];
    for (const method in paths[route]) {
      if (!validMethods.includes(method.toLowerCase())) continue;
      const op = paths[route][method];
      const pathLevelParams = paths[route].parameters || [];
      const parameters: Parameter[] = [...pathLevelParams, ...(op.parameters || [])].map((p: any) => ({
        name: p.name,
        in: p.in,
        required: p.required || false,
        type: p.schema?.type || "string",
      }));

      const responses = Object.keys(op.responses || {});

      const requestBody = op.requestBody
        ? JSON.stringify(op.requestBody?.content)
        : null;

      let requestBodyModel: string | null = null;
      const rbRef = op.requestBody?.content?.["application/json"]?.schema?.$ref;
      if (rbRef) requestBodyModel = resolveRef(rbRef);

      let responseModel: string | null = null;
      const successResponse = op.responses?.["200"] || op.responses?.["201"];
      const resRef = successResponse?.content?.["application/json"]?.schema?.$ref;
      const resArrayRef = successResponse?.content?.["application/json"]?.schema?.items?.$ref;
      if (resRef) responseModel = resolveRef(resRef);
      else if (resArrayRef) responseModel = resolveRef(resArrayRef) + "[]";

      endpoints.push({
        method: method.toUpperCase(),
        route,
        operationId: op.operationId || buildFallbackOperationId(method, route),
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
    enums,
    unions,
  };
}
