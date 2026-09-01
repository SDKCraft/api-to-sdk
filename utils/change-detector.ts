import { ApiSpec, Endpoint } from "sdkcraft-core";

export interface ChangeReport {
  newEndpoints: Endpoint[];
  removedEndpoints: Endpoint[];
  modifiedEndpoints: { old: Endpoint; new: Endpoint }[];
  breakingChanges: string[];
  summary: string;
}

export function detectChanges(oldSpec: ApiSpec, newSpec: ApiSpec): ChangeReport {
  const oldMap = new Map(oldSpec.endpoints.map(e => [`${e.method}:${e.route}`, e]));
  const newMap = new Map(newSpec.endpoints.map(e => [`${e.method}:${e.route}`, e]));

  const newEndpoints: Endpoint[] = [];
  const removedEndpoints: Endpoint[] = [];
  const modifiedEndpoints: { old: Endpoint; new: Endpoint }[] = [];
  const breakingChanges: string[] = [];

  // endpoints جديدة
  newMap.forEach((endpoint, key) => {
    if (!oldMap.has(key)) {
      newEndpoints.push(endpoint);
    }
  });

  // endpoints محذوفة
  oldMap.forEach((endpoint, key) => {
    if (!newMap.has(key)) {
      removedEndpoints.push(endpoint);
      breakingChanges.push(`❌ Removed: ${endpoint.method} ${endpoint.route}`);
    }
  });

  // endpoints متغيرة
  newMap.forEach((newEndpoint, key) => {
    const oldEndpoint = oldMap.get(key);
    if (oldEndpoint) {
      const oldParams = oldEndpoint.parameters.map(p => p.name).sort().join(",");
      const newParams = newEndpoint.parameters.map(p => p.name).sort().join(",");

      if (oldParams !== newParams) {
        modifiedEndpoints.push({ old: oldEndpoint, new: newEndpoint });

        // تحقق من breaking changes
        oldEndpoint.parameters.forEach(p => {
          if (p.required && !newEndpoint.parameters.find(np => np.name === p.name)) {
            breakingChanges.push(`⚠️ Breaking: Required param "${p.name}" removed from ${newEndpoint.method} ${newEndpoint.route}`);
          }
        });
      }
    }
  });

  const summary = `
📊 Change Summary: ${oldSpec.title} v${oldSpec.version} → v${newSpec.version}
✅ New endpoints: ${newEndpoints.length}
🗑️ Removed endpoints: ${removedEndpoints.length}
✏️ Modified endpoints: ${modifiedEndpoints.length}
🚨 Breaking changes: ${breakingChanges.length}
  `.trim();

  return { newEndpoints, removedEndpoints, modifiedEndpoints, breakingChanges, summary };
}