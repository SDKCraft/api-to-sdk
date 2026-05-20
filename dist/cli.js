#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openapi_parser_1 = require("./parsers/openapi-parser");
const typescript_generator_1 = require("./generators/typescript-generator");
const python_generator_1 = require("./generators/python-generator");
const dart_generator_1 = require("./generators/dart-generator");
const args = process.argv.slice(2);
function getArg(flag) {
    const index = args.indexOf(flag);
    return index !== -1 ? args[index + 1] : undefined;
}
const input = getArg("--input");
const lang = getArg("--lang");
const output = getArg("--output");
if (!input || !lang || !output) {
    console.log("Usage: api-to-sdk --input <file> --lang <language> --output <dir>");
    console.log("Languages: typescript | python | dart | all");
    process.exit(1);
}
console.log("Reading: " + input);
const spec = (0, openapi_parser_1.parseOpenApi)(input);
console.log("API: " + spec.title + " v" + spec.version);
console.log("Endpoints: " + spec.endpoints.length);
if (lang === "typescript" || lang === "all")
    (0, typescript_generator_1.generateTypeScriptSDK)(spec, output + "/typescript");
if (lang === "python" || lang === "all")
    (0, python_generator_1.generatePythonSDK)(spec, output + "/python");
if (lang === "dart" || lang === "all")
    (0, dart_generator_1.generateDartSDK)(spec, output + "/dart");
console.log("Done!");
