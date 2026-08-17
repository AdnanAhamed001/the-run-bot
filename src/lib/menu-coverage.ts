// Coverage audit: guarantees every dish extracted from the vendor menu(s)
// survives normalization and reaches the rendered Build Your Menu.

import type { Catalogue, MenuCategory } from "./catalogue-types";

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

export function collectDishes(categories: MenuCategory[]): string[] {
  const out: string[] = [];
  for (const c of categories) {
    out.push(...(c.items ?? []));
    for (const sg of c.subgroups ?? []) out.push(...(sg.items ?? []));
  }
  return out.filter((s) => typeof s === "string" && s.trim().length > 0);
}

export interface CoverageReport {
  sourceCount: number;
  renderedCount: number;
  missing: string[];
}

export function auditCoverage(
  source: MenuCategory[],
  rendered: MenuCategory[],
): CoverageReport {
  const renderedKeys = new Set(collectDishes(rendered).map(norm));
  const seen = new Set<string>();
  const missing: string[] = [];
  for (const dish of collectDishes(source)) {
    const k = norm(dish);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    if (!renderedKeys.has(k)) missing.push(dish);
  }
  return { sourceCount: seen.size, renderedCount: renderedKeys.size, missing };
}

// Re-attach any dish that was lost during mapping/merging. Dishes go back into
// the category they came from when that category still exists, otherwise into a
// clearly-labelled recovery card. Nothing is ever silently dropped.
export function reconcileCoverage(
  source: MenuCategory[],
  rendered: MenuCategory[],
  mapName: (raw: string) => string,
): MenuCategory[] {
  const report = auditCoverage(source, rendered);
  if (!report.missing.length) return rendered;

  const missingKeys = new Set(report.missing.map(norm));
  // Which source category did each missing dish belong to?
  const byTarget = new Map<string, string[]>();
  for (const c of source) {
    const target = mapName(c.name);
    for (const dish of [
      ...(c.items ?? []),
      ...(c.subgroups ?? []).flatMap((sg) => sg.items ?? []),
    ]) {
      if (!missingKeys.has(norm(dish))) continue;
      missingKeys.delete(norm(dish));
      const list = byTarget.get(target) ?? [];
      list.push(dish);
      byTarget.set(target, list);
    }
  }

  const out = rendered.map((c) => ({
    ...c,
    items: [...(c.items ?? [])],
    subgroups: (c.subgroups ?? []).map((sg) => ({ ...sg, items: [...sg.items] })),
  }));

  for (const [target, dishes] of byTarget) {
    const existing = out.find(
      (c) => norm(c.name) === norm(target) || norm(c.name).includes(norm(target)),
    );
    if (existing) {
      if (existing.subgroups.length) {
        existing.subgroups.push({ heading: "ALSO AVAILABLE", items: dishes });
      } else {
        existing.items.push(...dishes);
      }
    } else {
      out.push({
        name: target,
        selectionRules: [],
        items: dishes,
        subgroups: [],
      });
    }
  }

  return out;
}

export function auditCatalogue(
  original: Catalogue,
  mapped: Catalogue,
): CoverageReport {
  return auditCoverage(original.categories, mapped.categories);
}