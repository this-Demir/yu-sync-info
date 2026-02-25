// Dynamic import of term course JSONs (code-split per term)
// Usage: const data = await loadTermData(activeTerm);

const termToImporter = {
  "2026-spring": () => import(/* webpackChunkName: "term-2026-spring" */ "./yu_sync_courses_2026_spring.json"),
  "2026-fall":   () => import(/* webpackChunkName: "term-2026-fall"   */ "./yu_sync_courses_2026_fall.json"),
  "2025-spring": () => import(/* webpackChunkName: "term-2025-spring" */ "./yu_sync_courses_2025_spring.json"),
  "2025-fall":   () => import(/* webpackChunkName: "term-2025-fall"   */ "./yu_sync_courses_2025_fall.json"),
};

/**
 * Dynamically loads course data for a given term key.
 * Returns [] if the term is unknown or file missing.
 */
export async function loadTermData(termKey) {
  try {
    const importer = termToImporter[termKey];
    if (!importer) return [];
    const mod = await importer();

    return Array.isArray(mod?.default) ? mod.default : (Array.isArray(mod) ? mod : []);
  } catch (err) {
    
    if (process?.env?.NODE_ENV !== "production") {
      console.warn(`[loadTermData] failed for term "${termKey}":`, err);
    }
    return [];
  }
}

/** Optional: list known terms for prefetching or UI */
export function getAvailableTerms() {
  return Object.keys(termToImporter);
}
