import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import {
  parseOpenApi,
  generateTypeScriptSDK,
  generatePythonSDK,
  generateDartSDK,
  generateGoSDK,
  generateJavaSDK,
  generateKotlinSDK,
  generateCSharpSDK,
  generateSwiftSDK,
} from "sdkcraft-core";
import { scoreSDK } from "./utils/sdk-scorer";
const app = express();

// ---- Rate Limiting ----
// ملاحظة مهمة: الحدود دي محفوظة في الذاكرة (in-memory)، يعني هتتصفر مع كل
// إعادة تشغيل للسيرفر (زي "spin down" في Render Free Tier عند عدم النشاط).
// للحصول على حد شهري دقيق 100% ومستمر عبر إعادة التشغيل، لازم ننقلها لاحقًا
// لتخزين دائم عبر Supabase (المتاح أصلاً في المشروع) مربوط بحساب المستخدم.

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// توليد SDK الأساسي: حد سخي لأنه بدون تكلفة API خارجية، وهو أهم نقطة تجربة أولى للمستخدم
const generateLimiter = rateLimit({
  windowMs: MONTH_MS,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Free tier limit reached: 50 SDK generations per month. Try again next month, or contact us for higher limits." },
});

// توثيق الـ AI (بيستخدم Llama 3.3 70B المجاني عبر OpenRouter) - تكلفة حقيقية، حد أضيق
const aiDocsLimiter = rateLimit({
  windowMs: MONTH_MS,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Free tier limit reached: 5 AI-powered doc generations per month. Try again next month, or contact us for higher limits." },
});

// API change detection + Batch upload: عمليات أثقل، حد أضيق كمان (مؤقتًا بالـ IP لحد ما يكتمل نظام الحسابات)
const advancedFeaturesLimiter = rateLimit({
  windowMs: MONTH_MS,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Free tier limit reached: 3 uses per month for this feature. Try again next month, or contact us for higher limits." },
});
const storage = multer.diskStorage({
  destination: "uploads/",   filename: (_req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

app.post("/generate", generateLimiter, upload.single("file"), (req, res) => {
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
if (langs.includes("kotlin"))     generateKotlinSDK(spec, path.join(outputDir, "kotlin"));
if (langs.includes("csharp"))     generateCSharpSDK(spec, path.join(outputDir, "csharp"));
if (langs.includes("swift"))     generateSwiftSDK(spec, path.join(outputDir, "swift"));
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

    // Add a ready-to-use GitHub Actions workflow so users get CI/CD regeneration out of the box
    const langsList = JSON.stringify(langs);
    files[".github/workflows/regenerate-sdk.yml"] = `name: Regenerate SDK (SDKCraft)

# This workflow automatically regenerates your SDK whenever your OpenAPI spec changes.
# 1. Update SPEC_PATH below to point to your OpenAPI spec file in this repo.
# 2. Commit this file to your repository's default branch.

on:
  push:
    paths:
      - '**/*.yaml'
      - '**/*.yml'
      - '**/*.json'

env:
  SPEC_PATH: openapi.yaml   # <-- change this to your actual spec file path

jobs:
  regenerate:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Call SDKCraft API to regenerate SDK
        run: |
          curl -s -X POST https://api-to-sdk-production.up.railway.app/generate \\
            -F "file=@\${SPEC_PATH}" \\
            -F 'langs=${langsList}' \\
            -o sdkcraft-output.json

      - name: Write regenerated files
        run: |
          node -e "
            const fs = require('fs');
            const path = require('path');
            const data = JSON.parse(fs.readFileSync('sdkcraft-output.json', 'utf8'));
            if (!data.files) { console.error('SDKCraft API error:', data.error || 'unknown'); process.exit(1); }
            for (const [filename, fileContent] of Object.entries(data.files)) {
              const dir = path.dirname(filename);
              if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync(filename, fileContent);
            }
          "
          rm sdkcraft-output.json

      - name: Commit and push if changed
        run: |
          git config user.name "SDKCraft Bot"
          git config user.email "bot@sdkcraft.dev"
          git add .
          git diff --staged --quiet || git commit -m "chore: regenerate SDK from updated OpenAPI spec"
          git push
`;

    // تنظيف الملفات المؤقتة
    fs.rmSync(inputPath, { force: true });
    fs.rmSync(outputDir, { recursive: true, force: true });

 const score = scoreSDK(spec);

res.json({
  success: true,
  title: spec.title,
  version: spec.version,
  endpoints: spec.endpoints.length,
  files,
  score,
});

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/generate-docs", aiDocsLimiter, upload.single("file"), async (req, res) => {
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
app.post("/generate-batch", advancedFeaturesLimiter, upload.array("files", 20), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
// API Change Detection
app.post("/detect-changes", advancedFeaturesLimiter, upload.fields([
  { name: "oldFile", maxCount: 1 },
  { name: "newFile", maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files.oldFile || !files.newFile) {
      return res.status(400).json({ error: "Please upload both old and new API files" });
    }

    const { detectChanges } = await import("./utils/change-detector");
    const oldSpec = parseOpenApi(files.oldFile[0].path);
    const newSpec = parseOpenApi(files.newFile[0].path);
    const report = detectChanges(oldSpec, newSpec);

    fs.rmSync(files.oldFile[0].path, { force: true });
    fs.rmSync(files.newFile[0].path, { force: true });

    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
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
if (langs.includes("kotlin"))     generateKotlinSDK(spec, path.join(outputDir, "kotlin"));
if (langs.includes("csharp"))     generateCSharpSDK(spec, path.join(outputDir, "csharp"));
if (langs.includes("swift"))     generateSwiftSDK(spec, path.join(outputDir, "swift"));
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
app.post("/github-token", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });
  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ client_id: "Ov23likCdgCy06sl4WWk", client_secret: process.env.GITHUB_CLIENT_SECRET, code }),
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error });
    res.json({ token: data.access_token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", name: "SDKCraft API" });
});
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ SDKCraft API running on http://localhost:${PORT}`);
});