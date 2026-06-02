#!/usr/bin/env node
import "dotenv/config";
import fs from "fs";
import { parseOpenApi } from "./parsers/openapi-parser";
import { generateTypeScriptSDK } from "./generators/typescript-generator";
import { generatePythonSDK } from "./generators/python-generator";
import { generateDartSDK } from "./generators/dart-generator";
import { generateGoSDK } from "./generators/go-generator";
import { generateJavaSDK } from "./generators/java-generator";
import { generateAIDocs } from "./generators/doc-generator";

const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : undefined;
}

const input  = getArg("--input");
const lang   = getArg("--lang");
const output = getArg("--output");
const docs   = args.includes("--docs");

const validLangs = ["typescript", "python", "dart", "go", "java", "all"];

if (!input || !lang || !output) {
  console.error("❌ Missing required arguments.\n");
  console.log("Usage: api-to-sdk --input <file> --lang <language> --output <dir>");
  console.log("Languages: typescript | python | dart | go | java | all");
  process.exit(1);
}

if (!validLangs.includes(lang)) {
  console.error(`❌ Invalid language: "${lang}"`);
  process.exit(1);
}

if (!fs.existsSync(input)) {
  console.error(`❌ File not found: "${input}"`);
  process.exit(1);
}

// الدالة الرئيسية async
async function main() {
  try {
    console.log(`\n📂 Reading: ${input}`);
    const spec = parseOpenApi(input!);
    console.log(`📋 API: ${spec.title} v${spec.version}`);
    console.log(`🔗 Base URL: ${spec.baseUrl || "⚠️  Not specified"}`);
    console.log(`📌 Endpoints: ${spec.endpoints.length}\n`);

    if (spec.endpoints.length === 0) {
      console.error("❌ No endpoints found in the OpenAPI file.");
      process.exit(1);
    }

    if (lang === "typescript" || lang === "all") generateTypeScriptSDK(spec, output + "/typescript");
    if (lang === "python"     || lang === "all") generatePythonSDK(spec, output + "/python");
    if (lang === "dart"       || lang === "all") generateDartSDK(spec, output + "/dart");

    // ✅ توليد الدوكيومنتيشن بالذكاء الاصطناعي
    if (docs) {
      console.log("🤖 Generating AI documentation...");
      const aiDocs = await generateAIDocs(spec);
      if (!fs.existsSync(output!)) fs.mkdirSync(output!, { recursive: true });
      fs.writeFileSync(`${output}/README.md`, aiDocs);
      console.log(`✅ AI Documentation generated: ${output}/README.md`);
    }

    console.log(`\n✨ Done! SDK generated in: ${output}`);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();