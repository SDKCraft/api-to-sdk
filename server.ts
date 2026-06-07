import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { parseOpenApi } from "./parsers/openapi-parser";
import { generateTypeScriptSDK } from "./generators/typescript-generator";
import { generatePythonSDK } from "./generators/python-generator";
import { generateDartSDK } from "./generators/dart-generator";
import { generateGoSDK } from "./generators/go-generator";
import { generateJavaSDK } from "./generators/java-generator";

const app = express();
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

app.post("/generate", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const langs = req.body.langs
      ? JSON.parse(req.body.langs)
      : ["typescript"];

    const inputPath = req.file.path;
    const outputDir = path.join("temp-output", Date.now().toString());

    const spec = parseOpenApi(inputPath);

    if (langs.includes("typescript")) generateTypeScriptSDK(spec, path.join(outputDir, "typescript"));
    if (langs.includes("python"))     generatePythonSDK(spec, path.join(outputDir, "python"));
    if (langs.includes("dart"))       generateDartSDK(spec, path.join(outputDir, "dart"));
    if (langs.includes("go"))         generateGoSDK(spec, path.join(outputDir, "go"));
    if (langs.includes("java"))       generateJavaSDK(spec, path.join(outputDir, "java"));

    // جمع كل الملفات المولّدة
    const files: Record<string, string> = {};
    const collectFiles = (dir: string, prefix = "") => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).forEach(f => {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
          collectFiles(fullPath, prefix + f + "/");
        } else {
          files[prefix + f] = fs.readFileSync(fullPath, "utf-8");
        }
      });
    };
    collectFiles(outputDir);

    // تنظيف الملفات المؤقتة
    fs.rmSync(inputPath, { force: true });
    fs.rmSync(outputDir, { recursive: true, force: true });

    res.json({
      success: true,
      title: spec.title,
      version: spec.version,
      endpoints: spec.endpoints.length,
      files,
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/generate-docs", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { generateAIDocs } = await import("./generators/doc-generator");
    const spec = parseOpenApi(req.file.path);
    const docs = await generateAIDocs(spec);
    fs.rmSync(req.file.path, { force: true });
    res.json({ success: true, docs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
// رفع عدة ملفات دفعة واحدة
app.post("/generate-batch", upload.array("files", 20), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const langs = req.body.langs ? JSON.parse(req.body.langs) : ["typescript"];
    const results: any[] = [];

    for (const file of files) {
      try {
        const spec = parseOpenApi(file.path);
        const outputDir = path.join("temp-output", Date.now().toString());

        if (langs.includes("typescript")) generateTypeScriptSDK(spec, path.join(outputDir, "typescript"));
        if (langs.includes("python"))     generatePythonSDK(spec, path.join(outputDir, "python"));
        if (langs.includes("dart"))       generateDartSDK(spec, path.join(outputDir, "dart"));
        if (langs.includes("go"))         generateGoSDK(spec, path.join(outputDir, "go"));
        if (langs.includes("java"))       generateJavaSDK(spec, path.join(outputDir, "java"));

        const generatedFiles: Record<string, string> = {};
        const collectFiles = (dir: string, prefix = "") => {
          if (!fs.existsSync(dir)) return;
          fs.readdirSync(dir).forEach(f => {
            const fullPath = path.join(dir, f);
            if (fs.statSync(fullPath).isDirectory()) {
              collectFiles(fullPath, prefix + f + "/");
            } else {
              generatedFiles[prefix + f] = fs.readFileSync(fullPath, "utf-8");
            }
          });
        };
        collectFiles(outputDir);

        fs.rmSync(file.path, { force: true });
        fs.rmSync(outputDir, { recursive: true, force: true });

        results.push({
          filename: file.originalname,
          success: true,
          title: spec.title,
          version: spec.version,
          endpoints: spec.endpoints.length,
          files: generatedFiles,
        });

      } catch (err: any) {
        results.push({
          filename: file.originalname,
          success: false,
          error: err.message,
        });
      }
    }

    res.json({ success: true, total: files.length, results });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/health", (req, res) => {
  res.json({ status: "ok", name: "SDKCraft API" });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ SDKCraft API running on http://localhost:${PORT}`);
});