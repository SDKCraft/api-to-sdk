import { ApiSpec } from "sdkcraft-core";

export interface SDKScore {
  total: number;
  max: number;
  grade: string;
  breakdown: {
    category: string;
    score: number;
    max: number;
    note: string;
  }[];
}

export function scoreSDK(spec: ApiSpec): SDKScore {
  const breakdown = [];

  // 1. عدد الـ endpoints (20 نقطة)
  const endpointScore = Math.min(spec.endpoints.length * 2, 20);
  breakdown.push({
    category: "Endpoints",
    score: endpointScore,
    max: 20,
    note: `${spec.endpoints.length} endpoints found`,
  });

  // 2. وجود descriptions (20 نقطة)
  const withSummary = spec.endpoints.filter(e => e.summary && e.summary.length > 3).length;
  const descScore = Math.round((withSummary / Math.max(spec.endpoints.length, 1)) * 20);
  breakdown.push({
    category: "Descriptions",
    score: descScore,
    max: 20,
    note: `${withSummary}/${spec.endpoints.length} endpoints have descriptions`,
  });

  // 3. وجود Models/Schemas (20 نقطة)
  const modelScore = spec.models.length > 0 ? Math.min(spec.models.length * 5, 20) : 0;
  breakdown.push({
    category: "Models & Schemas",
    score: modelScore,
    max: 20,
    note: spec.models.length > 0 ? `${spec.models.length} models defined` : "No models found",
  });

  // 4. وجود versioning (20 نقطة)
  const hasVersion = spec.version && spec.version !== "1.0.0" && spec.version.length > 0;
  const versionScore = hasVersion ? 20 : 10;
  breakdown.push({
    category: "Versioning",
    score: versionScore,
    max: 20,
    note: `API version: ${spec.version}`,
  });

  // 5. وجود baseUrl (20 نقطة)
  const hasBaseUrl = spec.baseUrl && spec.baseUrl.length > 0 && spec.baseUrl !== "/";
  const urlScore = hasBaseUrl ? 20 : 0;
  breakdown.push({
    category: "Base URL",
    score: urlScore,
    max: 20,
    note: hasBaseUrl ? spec.baseUrl : "No base URL defined",
  });

  const total = breakdown.reduce((sum, b) => sum + b.score, 0);
  const max = breakdown.reduce((sum, b) => sum + b.max, 0);

  const grade =
    total >= 90 ? "A+" :
    total >= 80 ? "A" :
    total >= 70 ? "B" :
    total >= 60 ? "C" :
    total >= 50 ? "D" : "F";

  return { total, max, grade, breakdown };
}