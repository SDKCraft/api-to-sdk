/**
 * يبني دالة `paginate<T>` العامة — أداة مساعدة (exported) للمستخدم النهائي
 * عشان يجمع كل صفحات نتيجة معينة تلقائيًا.
 */
export function generatePaginateFn(): string[] {
  const lines: string[] = [];

  lines.push(`/** Fetch all pages automatically */`);
  lines.push(`export async function paginate<T>(fn: (page: number) => Promise<T[]>, maxPages = 10): Promise<T[]> {`);
  lines.push(`  const results: T[] = [];`);
  lines.push(`  for (let page = 1; page <= maxPages; page++) {`);
  lines.push(`    const data = await fn(page);`);
  lines.push(`    if (!data || data.length === 0) break;`);
  lines.push(`    results.push(...data);`);
  lines.push(`  }`);
  lines.push(`  return results;`);
  lines.push(`}\n`);

  return lines;
}
