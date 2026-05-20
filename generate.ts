import { parseOpenApi } from "./parsers/openapi-parser";
import { generateTypeScriptSDK } from "./generators/typescript-generator";
import { generatePythonSDK } from "./generators/python-generator";
import { generateDartSDK } from "./generators/dart-generator";

const spec = parseOpenApi("./examples/openapi.json");
generateTypeScriptSDK(spec, "./output/typescript");
generatePythonSDK(spec, "./output/python");
generateDartSDK(spec, "./output/dart");
