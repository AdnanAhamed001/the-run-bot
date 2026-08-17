// Derive Build-Your-Menu selection rules directly from the package quantity strings.
// This guarantees Package Page and Menu Page stay in sync, and that quantity pills
// always reflect actual package quantities — never invented.

import type {
  Catalogue,
  MenuCategory,
  Package,
  SelectionRule,
} from "./catalogue-types";

interface ParsedQty {
  count: number;
  label: string; // raw label after the number, normalised
}

// Parse "6 Veg Starters", "1 Beverage OR 1 Salad OR 1 Chaat", "2 Live Stations"
function parseQuantityLine(line: string): ParsedQty[] {
  return line
    .split(/\s+OR\s+/i)
    .map((part) => {
      const m = part.trim().match(/^(\d+)\s+(.+)$/);
      if (!m) return null;
      return { count: parseInt(m[1], 10), label: m[2].trim() };
    })
    .filter((x): x is ParsedQty => x !== null);
}

// Plural-safe equality: "Starters" matches category "Starters" or "Veg Starters" depending on context.
function normLabel(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// True if the package label (e.g. "Veg Starters", "Starters", "Beverage")
// belongs to the given menu category (e.g. "Veg Starters", "Beverages").
function labelMatchesCategory(label: string, categoryName: string): boolean {
  const l = normLabel(label);
  const c = normLabel(categoryName);
  if (l === c) return true;

  // Singular/plural variants
  const lSingular = l.replace(/s$/, "");
  const cSingular = c.replace(/s$/, "");
  if (lSingular === cSingular) return true;

  // Compound match — category contains the label or vice versa
  if (c.includes(l) || l.includes(c)) return true;
  if (c.includes(lSingular) || lSingular.includes(c)) return true;

  return false;
}

function collectQuantitiesForPackage(pkg: Package): string[] {
  const out: string[] = [];
  if (pkg.contents?.length) out.push(...pkg.contents);
  if (pkg.vegContents?.length) out.push(...pkg.vegContents);
  if (pkg.nonVegContents?.length) out.push(...pkg.nonVegContents);
  return out;
}

// Generate selection rules for every category from package quantity lines.
export function deriveSelectionRulesForCategory(
  categoryName: string,
  packages: Package[],
): SelectionRule[] {
  const perPackage: { tier: string; count: number; verbatim: string }[] = [];

  for (const pkg of packages) {
    let bestMatch: { count: number; verbatim: string } | null = null;
    for (const line of collectQuantitiesForPackage(pkg)) {
      const parsed = parseQuantityLine(line);
      for (const p of parsed) {
        if (labelMatchesCategory(p.label, categoryName)) {
          if (!bestMatch || p.count > bestMatch.count) {
            bestMatch = { count: p.count, verbatim: line };
          }
        }
      }
    }
    if (bestMatch) {
      perPackage.push({
        tier: pkg.name.toUpperCase(),
        count: bestMatch.count,
        verbatim: bestMatch.verbatim,
      });
    }
  }

  if (perPackage.length === 0) return [];

  // Are quantities identical across every package that contains this category?
  // AND does it appear in every package we have?
  const allPackagesIncluded = perPackage.length === packages.length;
  const allEqual = perPackage.every((p) => p.count === perPackage[0].count);

  if (allPackagesIncluded && allEqual && packages.length > 1) {
    return [{ tier: "ALL PACKAGES", rule: `${perPackage[0].count} ${categoryName}` }];
  }

  return perPackage.map((p) => ({
    tier: p.tier,
    rule: `${p.count} ${categoryName}`,
  }));
}

// Returns a copy of the catalogue with selectionRules on every category
// replaced by the rules derived from the package quantities.
export function syncSelectionRules(catalogue: Catalogue): Catalogue {
  const categories: MenuCategory[] = catalogue.categories.map((cat) => {
    const derived = deriveSelectionRulesForCategory(cat.name, catalogue.packages);
    return {
      ...cat,
      selectionRules: derived.length > 0 ? derived : cat.selectionRules,
    };
  });
  return { ...catalogue, categories };
}
