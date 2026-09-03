import request from "supertest";
import app from "../app";

describe("GET /health", () => {
  it("returns ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", name: "SDKCraft API" });
  });
});

describe("CORS", () => {
  it("allows the production domain", async () => {
    const res = await request(app)
      .options("/generate")
      .set("Origin", "https://sdkcraft.com")
      .set("Access-Control-Request-Method", "POST");
    expect(res.headers["access-control-allow-origin"]).toBe("https://sdkcraft.com");
  });

  it("rejects an untrusted origin without crashing (regression: used to throw and return 500)", async () => {
    const res = await request(app)
      .options("/generate")
      .set("Origin", "https://evil-scraper.com")
      .set("Access-Control-Request-Method", "POST");
    // مفيش header يسمح بالأصل الخبيث، والأهم إن السيرفر ما وقعش بـ 500
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    expect(res.status).not.toBe(500);
  });

  it("blocks a spoofed subdomain trick (evil.com pretending to include our domain)", async () => {
    const res = await request(app)
      .options("/generate")
      .set("Origin", "https://sdkcraft.com.evil.com")
      .set("Access-Control-Request-Method", "POST");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("POST /generate", () => {
  it("rejects with 400 when no file is uploaded", async () => {
    const res = await request(app).post("/generate");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No file uploaded");
  });

  it("generates a TypeScript SDK from a valid spec", async () => {
    const res = await request(app)
      .post("/generate")
      .field("langs", JSON.stringify(["typescript"]))
      .attach("file", "tests/fixtures/valid-spec-v1.json");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.title).toBe("Test API");
    expect(res.body.endpoints).toBe(1);
    expect(res.body.files).toHaveProperty(["typescript/index.ts"]);
  });
});

describe("POST /generate-batch", () => {
  it("rejects with 400 when no files are uploaded", async () => {
    const res = await request(app).post("/generate-batch");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No files uploaded");
  });
});

describe("POST /detect-changes", () => {
  // Regression test: قبل إصلاح اليوم، الطلب من غير أي ملفات كان يسبب
  // "Cannot read properties of undefined (reading 'oldFile')" (500) بدل رسالة 400 واضحة،
  // لأن req.files كانت ترجع undefined مش object فاضي لما مفيش أي ملف مرفوع.
  it("returns a clean 400 (not a 500 crash) when no files are uploaded at all", async () => {
    const res = await request(app).post("/detect-changes");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Please upload both old and new API files");
  });

  it("returns 400 when only one file is uploaded", async () => {
    const res = await request(app)
      .post("/detect-changes")
      .attach("oldFile", "tests/fixtures/valid-spec-v1.json");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Please upload both old and new API files");
  });

  it("detects a new endpoint added between two spec versions", async () => {
    const res = await request(app)
      .post("/detect-changes")
      .attach("oldFile", "tests/fixtures/valid-spec-v1.json")
      .attach("newFile", "tests/fixtures/valid-spec-v2.json");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.report.newEndpoints.length).toBe(1);
    expect(res.body.report.newEndpoints[0].operationId).toBe("listOrders");
  });
});

describe("POST /github-token", () => {
  it("rejects with 400 when no code is provided", async () => {
    const res = await request(app).post("/github-token").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No code provided");
  });
});