#!/usr/bin/env node
import { parseOpenApi } from "./parsers/openapi-parser";
import { generateTypeScriptSDK } from "./generators/typescript-generator";
import { generatePythonSDK } from "./generators/python-generator";
import { generateDartSDK } from "./generators/dart-generator";

const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : undefined;
}

const input  = getArg("--input");
const lang   = getArg("--lang");
const output = getArg("--output");

if (!input || !lang || !output) {
  console.log("Usage: api-to-sdk --input <file> --lang <language> --output <dir>");
  console.log("Languages: typescript | python | dart | all");
  process.exit(1);
}

console.log("Reading: " + input);
const spec = parseOpenApi(input);
console.log("API: " + spec.title + " v" + spec.version);
console.log("Endpoints: " + spec.endpoints.length);

if (lang === "typescript" || lang === "all") generateTypeScriptSDK(spec, output + "/typescript");
if (lang === "python"     || lang === "all") generatePythonSDK(spec, output + "/python");
if (lang === "dart"       || lang === "all") generateDartSDK(spec, output + "/dart");

console.log("Done!");