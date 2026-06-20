const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// عدّل هذا المسار إذا كان مولد TypeScript في مكان مختلف
const GENERATOR_DIR = path.join(ROOT, "src", "generators", "typescript");
const SUB_DIR = path.join(GENERATOR_DIR, "generators");

fs.mkdirSync(SUB_DIR, { recursive: true });

const files = {
  "header.ts": "",
  "models.ts": "",
  "request.ts": "",
  "paginate.ts": "",
  "endpoints.ts": "",
};

for (const file of Object.keys(files)) {
  const fullPath = path.join(SUB_DIR, file);

  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, files[file], "utf8");
    console.log("✅ Created:", fullPath);
  } else {
    console.log("⏩ Exists:", fullPath);
  }
}

console.log("\n✔ Folder structure ready.");