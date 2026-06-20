import { Model } from "../../../parsers/openapi-parser";

/**
 * يحوّل قائمة Models إلى TypeScript interfaces.
 */
function buildModelInterface(model: Model): string[] {
  const lines: string[] = [];
  lines.push(`export interface ${model.name} {`);
  model.fields.forEach(field => {
    const optional = !field.required ? "?" : "";
    const nullable = field.nullable ? " | null" : "";
    lines.push(`  ${field.name}${optional}: ${field.type}${nullable};`);
  });
  lines.push(`}\n`);
  return lines;
}

/**
 * يبني قسم الـ Models كامل، بما فيه عنوان القسم لو فيه models.
 * بيرجّع [] لو القائمة فاضية (مفيش داعي لعنوان قسم بدون محتوى).
 */
export function generateModels(models: Model[]): string[] {
  if (models.length === 0) return [];

  const lines: string[] = [`// ---- Models ----\n`];
  models.forEach(model => {
    lines.push(...buildModelInterface(model));
  });
  return lines;
}
