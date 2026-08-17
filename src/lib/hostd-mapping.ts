// Maps raw vendor packages and categories onto the Hostd standard names.
// Display names only — quantities, prices, items, notes remain untouched.

import type { Catalogue, MenuCategory, Package } from "./catalogue-types";
import { auditCoverage, reconcileCoverage } from "./menu-coverage";

const HOSTD_TIERS_BY_COUNT: Record<number, string[]> = {
  1: ["Signature"],
  2: ["Signature", "Luxe"],
  3: ["Signature", "Premium", "Luxe"],
  4: ["Signature", "Premium", "Luxe", "Royale"],
};

// Non-buffet package indicators — these packages are dropped before mapping.
const NON_BUFFET_PATTERNS: RegExp[] = [
  /\bchaat\b/i,
  /\bbeverage/i,
  /\bbreakfast\b/i,
  /\bhigh\s*tea\b/i,
  /\bsnack/i,
  /\bcocktail/i,
  /\blive\s*counter/i,
  /\blive\s*station/i,
  /\bstation\s*(only|package)?\b/i,
  /\badd[-\s]?on/i,
  /\bevent[-\s]?specific/i,
  /\bbar\b/i,
  /\bmocktail\s*(package|only)\b/i,
  /\bhors\b/i,
];

function isBuffetPackage(pkg: Package): boolean {
  const name = (pkg.name || "").toLowerCase();
  if (!name.trim()) return false;
  if (/\bbuffet\b/.test(name)) return true;
  return !NON_BUFFET_PATTERNS.some((re) => re.test(name));
}

export function filterBuffetPackages(packages: Package[]): Package[] {
  const buffets = packages.filter(isBuffetPackage);
  // Hostd tiers always progress from the lowest-priced buffet to the highest.
  // Unknown prices retain their original relative order after priced packages.
  const ordered = buffets
    .map((pkg, index) => ({ pkg, index }))
    .sort((a, b) => {
      const aPrice = a.pkg.pricePerPax;
      const bPrice = b.pkg.pricePerPax;
      if (aPrice == null && bPrice == null) return a.index - b.index;
      if (aPrice == null) return 1;
      if (bPrice == null) return -1;
      return aPrice - bPrice || a.index - b.index;
    })
    .map(({ pkg }) => pkg);
  // Cap at 4 — Hostd tier ladder only supports up to Royale.
  return ordered.slice(0, 4);
}

export function remapPackageNames(packages: Package[]): Package[] {
  if (!packages.length) return packages;
  const n = Math.min(packages.length, 4);
  const tiers = HOSTD_TIERS_BY_COUNT[n] ?? ["Signature", "Premium", "Luxe", "Royale"];
  return packages.map((pkg, i) => ({
    ...pkg,
    name: tiers[i] ?? pkg.name,
  }));
}

// Hostd canonical category headings (display order matters).
// Live Stations is intentionally last — it always closes the menu journey.
const HOSTD_CATEGORIES = [
  "Mocktail",
  "Soup",
  "Salad",
  "Chaat",
  "Veg Starters",
  "Non-Veg Starters",
  "Premium Non-Veg Starters",
  "Veg Main Course",
  "Non-Veg Main Course",
  "Dal",
  "Rice Preparations",
  "Indian Breads",
  "Accompaniments",
  "International Main Course",
  "Desserts",
  "Ice Creams",
  "Toppings",
  "Live Stations",
];


const HOSTD_ORDER: Record<string, number> = HOSTD_CATEGORIES.reduce(
  (acc, name, idx) => ({ ...acc, [name]: idx }),
  {},
);

// Keyword → Hostd heading. Order: longest/most specific first.
const KEYWORD_MAP: { keys: string[]; target: string; vegOnly?: boolean; nonVegOnly?: boolean }[] = [
  { keys: ["welcome drink", "mocktail", "beverage", "drink"], target: "Mocktail" },
  { keys: ["soup"], target: "Soup" },
  { keys: ["chaat"], target: "Chaat" },
  { keys: ["salad"], target: "Salad" },

  // Premium non-veg starters (lobster, prawn, etc. often grouped)
  { keys: ["premium non veg starter", "premium non-veg starter", "premium nonveg starter"], target: "Premium Non-Veg Starters" },

  // Veg / Non-Veg starters explicit
  { keys: ["veg starter", "vegetarian starter", "veg canape", "veg appetizer", "veg small plate", "veg finger food"], target: "Veg Starters", vegOnly: true },
  { keys: ["non veg starter", "non-veg starter", "nonveg starter", "non veg canape", "non-veg canape", "non veg appetizer", "non-veg appetizer"], target: "Non-Veg Starters", nonVegOnly: true },

  // Generic starter buckets — assume veg if word "veg" present, else non-veg if "non" present, else default starters
  { keys: ["starter", "canape", "canapé", "appetizer", "finger food", "hot bites", "passed hors", "cocktail snack", "tapas", "small plate"], target: "Veg Starters" },

  // Indian mains
  { keys: ["veg main", "veg curry", "veg indian", "vegetarian main", "vegetarian curry"], target: "Veg Main Course", vegOnly: true },
  { keys: ["non veg main", "non-veg main", "nonveg main", "non veg curry", "non-veg curry"], target: "Non-Veg Main Course", nonVegOnly: true },
  { keys: ["indian kitchen", "north indian", "regional kitchen", "traditional kitchen", "curries", "curry"], target: "Veg Main Course" },
  { keys: ["main course", "mains"], target: "Veg Main Course" },

  // International
  { keys: ["oriental", "asian kitchen", "pan asian", "pan-asian", "thai", "chinese", "japanese", "italian", "continental", "mediterranean", "european", "international"], target: "International Main Course" },

  { keys: ["dal", "daal", "lentil"], target: "Dal" },
  { keys: ["rice", "biryani", "pulao", "pilaf", "grain"], target: "Rice Preparations" },
  { keys: ["bread", "roti", "naan", "kulcha", "paratha", "indian bread"], target: "Indian Breads" },
  { keys: ["accompaniment", "side", "condiment", "raita", "pickle"], target: "Accompaniments" },

  {
    keys: [
      "live kitchen", "interactive counter", "chef theatre", "chef theater",
      "live experience", "live station", "live counter",
      "live fire", "live grill", "open grill", "bbq station", "bbq",
      "barbecue", "barbeque", "grill counter", "fire kitchen",
      "live barbecue", "live barbeque", "grill", "tandoor counter",
      "sizzler", "smoker",
    ],
    target: "Live Stations",
  },

  { keys: ["ice cream", "icecream", "gelato", "kulfi", "frozen dessert"], target: "Ice Creams" },
  { keys: ["topping"], target: "Toppings" },
  { keys: ["dessert", "sweet ending", "dessert bar", "patisserie", "bakery", "mithai", "sweet"], target: "Desserts" },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

export function mapCategoryName(rawName: string): string {
  if (!rawName) return rawName;
  const lower = normalize(rawName);

  // Exact Hostd name first
  for (const h of HOSTD_CATEGORIES) {
    if (lower === normalize(h)) return h;
  }

  for (const entry of KEYWORD_MAP) {
    for (const key of entry.keys) {
      if (lower.includes(key)) {
        if (entry.vegOnly) return "Veg Starters" === entry.target || entry.target.startsWith("Veg") ? entry.target : entry.target;
        if (entry.nonVegOnly) return entry.target;
        // Generic — refine by veg/non-veg modifier in original name
        if (entry.target === "Veg Starters") {
          if (lower.includes("non veg") || lower.includes("non-veg") || lower.includes("nonveg")) return "Non-Veg Starters";
          if (lower.includes("veg")) return "Veg Starters";
          return "Veg Starters";
        }
        if (entry.target === "Veg Main Course") {
          if (lower.includes("non veg") || lower.includes("non-veg") || lower.includes("nonveg")) return "Non-Veg Main Course";
          if (lower.includes("veg")) return "Veg Main Course";
          return "Veg Main Course";
        }
        return entry.target;
      }
    }
  }
  return rawName;
}

function mergeCategories(categories: MenuCategory[]): MenuCategory[] {
  const byName = new Map<string, MenuCategory>();
  for (const c of categories) {
    const mappedName = mapCategoryName(c.name);
    const existing = byName.get(mappedName);
    if (!existing) {
      byName.set(mappedName, { ...c, name: mappedName });
    } else {
      // Merge items / subgroups, dedupe items
      const itemSet = new Set([...(existing.items ?? []), ...(c.items ?? [])]);
      existing.items = Array.from(itemSet);
      existing.subgroups = [...(existing.subgroups ?? []), ...(c.subgroups ?? [])];
    }
  }
  // Sort in Hostd canonical order; unknown names go before Live Stations.
  // Live Stations is ALWAYS the final Build Your Menu card.
  return Array.from(byName.values()).sort((a, b) => {
    const isLiveA = a.name === "Live Stations";
    const isLiveB = b.name === "Live Stations";
    if (isLiveA && !isLiveB) return 1;
    if (!isLiveA && isLiveB) return -1;
    const oa = HOSTD_ORDER[a.name] ?? 900;
    const ob = HOSTD_ORDER[b.name] ?? 900;
    return oa - ob;
  });
}

// Pairs of Hostd categories that should collapse into a single card with
// VEGETARIAN / NON-VEGETARIAN subgroups.
const VEG_NONVEG_PAIRS: [string, string, string][] = [
  ["Veg Starters", "Non-Veg Starters", "Starters"],
  ["Veg Main Course", "Non-Veg Main Course", "Main Course"],
];

function dedupeRules(
  rules: { tier: string; rule: string }[],
): { tier: string; rule: string }[] {
  const seen = new Set<string>();
  const out: { tier: string; rule: string }[] = [];
  for (const r of rules) {
    const key = `${r.tier.toUpperCase()}::${r.rule.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

function combineVegNonVeg(categories: MenuCategory[]): MenuCategory[] {
  const byName = new Map(categories.map((c) => [c.name, c]));
  const consumed = new Set<string>();
  const out: MenuCategory[] = [];

  for (const cat of categories) {
    if (consumed.has(cat.name)) continue;
    const pair = VEG_NONVEG_PAIRS.find(
      ([veg, nonVeg]) =>
        (cat.name === veg && byName.has(nonVeg)) ||
        (cat.name === nonVeg && byName.has(veg)),
    );
    if (pair) {
      const [vegName, nonVegName, combinedName] = pair;
      const veg = byName.get(vegName);
      const nonVeg = byName.get(nonVegName);
      consumed.add(vegName);
      consumed.add(nonVegName);
      const subgroups: { heading: string; items: string[] }[] = [];
      if (veg && veg.items.length) subgroups.push({ heading: "VEGETARIAN", items: veg.items });
      if (nonVeg && nonVeg.items.length)
        subgroups.push({ heading: "NON-VEGETARIAN", items: nonVeg.items });
      // Preserve any pre-existing subgroups too
      if (veg?.subgroups?.length) subgroups.push(...veg.subgroups);
      if (nonVeg?.subgroups?.length) subgroups.push(...nonVeg.subgroups);

      out.push({
        name: combinedName,
        items: [],
        subgroups,
        selectionRules: dedupeRules([
          ...(veg?.selectionRules ?? []),
          ...(nonVeg?.selectionRules ?? []),
        ]),
      });
    } else {
      const singlePair = VEG_NONVEG_PAIRS.find(
        ([vegName, nonVegName]) => cat.name === vegName || cat.name === nonVegName,
      );
      if (!singlePair) {
        out.push(cat);
        continue;
      }

      const [vegName, , combinedName] = singlePair;
      out.push({
        ...cat,
        name: combinedName,
        items: [],
        subgroups: [
          {
            heading: cat.name === vegName ? "VEGETARIAN" : "NON-VEGETARIAN",
            items: cat.items,
          },
          ...(cat.subgroups ?? []),
        ],
      });
    }
  }
  return out;
}

// Word/phrase-level mapping applied to package inclusion strings so the
// Package page uses the same Hostd terminology as Build Your Menu. Order
// matters: more specific phrases first (ice cream before dessert, etc.).
const INCLUSION_REPLACEMENTS: [RegExp, string][] = [
  // Rule 8 — clean quantity format only. Vague wording is stripped so lines read
  // "6 Veg Starters", never "Selection of 6 Veg Starters" or "Choose 6 Starters".
  [/\b(any|assorted|an\s+assortment\s+of)?\s*\b(selections?\s+of|choice\s+of|choose(\s+any)?|pick(\s+any)?|opt\s+for)\b\s*/gi, ""],
  [/\b(welcome\s+)?mocktails?\b/gi, "Mocktail"],
  [/\bwelcome\s+drinks?\b/gi, "Mocktail"],
  [/\bbeverages?\b/gi, "Mocktail"],
  [/\bsoups?\b/gi, "Soup"],
  [/\bsalads?\b/gi, "Salad"],
  [/\bchaats?\b/gi, "Chaat"],
  [/\b(ice[-\s]?creams?|gelatos?|kulfis?|frozen\s+desserts?)\b/gi, "Ice Cream"],
  [/\b(dessert\s+bars?|desserts?|sweet\s+endings?|mithais?|patisserie|pastries)\b/gi, "Desserts"],
  [
    /\b(rice\s+preparations?|biryanis?|pulaos?|pilafs?|steamed\s+rice|rice)\b/gi,
    "Rice Preparations",
  ],
  [
    /\b(indian\s+breads?|breads?|rotis?|naans?|kulchas?|parathas?|tandoori\s+breads?)\b/gi,
    "Indian Breads",
  ],
  [/\b(lentils?|daals?|dals?)\b/gi, "Dal"],
  [
    /\b(accompaniments?|sides?|side\s+dishes?|raitas?|condiments?|pickles?|papads?)\b/gi,
    "Accompaniments",
  ],
  [
    /\b(live\s+(?:fire|grill|counter|kitchen|station|barbecue|barbeque|bbq)s?|bbq\s+stations?|grill\s+counters?|tandoor\s+counters?|open\s+grills?|chef\s+theatres?|chef\s+theaters?|interactive\s+counters?|live\s+experiences?)\b/gi,
    "Live Stations",
  ],
  [
    /\b(main\s+courses?|mains|gravies|gravy|curries|curry|main\s+dishes?)\b/gi,
    "Main Course",
  ],
  [
    /\b(canap[eé]s?|appetizers?|appetisers?|finger\s+foods?|small\s+plates?|hors\s+d'?oeuvres?|tapas|starters?)\b/gi,
    "Starters",
  ],
];


function remapInclusionText(text: string): string {
  let out = text;
  for (const [re, sub] of INCLUSION_REPLACEMENTS) out = out.replace(re, sub);
  return out;
}

function remapInclusions(items?: string[]): string[] | undefined {
  if (!items) return items;
  return items.map(remapInclusionText);
}

// ---------------------------------------------------------------------------
// Package-driven selection rules
// ---------------------------------------------------------------------------
// The package page is the single source of truth. For each buffet package we
// parse its inclusion lines (e.g. "4 Starters", "3 Main Course (1 Dal + 2
// Gravies)", "1 Beverage OR Salad OR Chaat", "Rice / Bread", "1 Live
// Counter") and derive Choose-N selection rules per Hostd category. A Build
// Your Menu category only shows a package's pill when that package includes
// it — never hardcoded.


const PACKAGE_INCLUSION_MAP: { re: RegExp; targets: string[] }[] = [
  { re: /\b(welcome\s+drinks?|beverages?|mocktails?)\b/i, targets: ["Mocktail"] },
  { re: /\bsoups?\b/i, targets: ["Soup"] },
  { re: /\bsalads?\b/i, targets: ["Salad"] },
  { re: /\blive\s+chaats?\b/i, targets: ["Live Stations"] },
  { re: /\bchaats?\b/i, targets: ["Chaat"] },
  {
    re: /\blive\s+(counters?|stations?|mains?|kitchens?|grills?|bbqs?|barbecues?|barbeques?|fires?|chefs?)\b/i,
    targets: ["Live Stations"],
  },
  { re: /\blive\s+station\b/i, targets: ["Live Stations"] },
  { re: /\bpremium\s+non[-\s]?veg\s+starters?\b/i, targets: ["Premium Non-Veg Starters"] },
  { re: /\bnon[-\s]?veg\s+starters?\b/i, targets: ["Non-Veg Starters"] },
  { re: /\bveg\s+starters?\b/i, targets: ["Veg Starters"] },
  { re: /\b(starters?|canap[eé]s?|appetizers?|finger\s+foods?)\b/i, targets: ["Veg Starters", "Non-Veg Starters"] },
  { re: /\bnon[-\s]?veg\s+main(?:\s+course)?\b/i, targets: ["Non-Veg Main Course"] },
  { re: /\bveg\s+main(?:\s+course)?\b/i, targets: ["Veg Main Course"] },
  { re: /\b(main\s+courses?|mains|gravies|gravy|curries|curry)\b/i, targets: ["Veg Main Course", "Non-Veg Main Course"] },
  { re: /\b(dals?|daals?|lentils?)\b/i, targets: ["Dal"] },
  { re: /\b(rice|biryanis?|pulaos?)\b/i, targets: ["Rice Preparations"] },
  { re: /\b(breads?|rotis?|naans?|kulchas?|parathas?)\b/i, targets: ["Indian Breads"] },
  { re: /\b(accompaniments?|raitas?|pickles?)\b/i, targets: ["Accompaniments"] },
  { re: /\b(ice[-\s]?creams?|gelatos?|kulfis?)\b/i, targets: ["Ice Creams"] },
  { re: /\b(desserts?|sweets?|mithais?|patisserie|pastries)\b/i, targets: ["Desserts"] },
];

function matchTargets(text: string): string[] {
  for (const { re, targets } of PACKAGE_INCLUSION_MAP) {
    if (re.test(text)) return targets;
  }
  return [];
}

type ParsedInclusion = { cat: string; count: number; orWith: string[] };

function parseInclusionLine(line: string): ParsedInclusion[] {
  const results: ParsedInclusion[] = [];
  const parenMatch = line.match(/\(([^)]+)\)/);
  const inner = parenMatch ? parenMatch[1] : "";
  const outer = parenMatch ? line.replace(parenMatch[0], "") : line;

  // Outer clause: leading number applies to every OR/slash alternative.
  const numMatch = outer.match(/\b(\d+)\b/);
  const outerCount = numMatch ? parseInt(numMatch[1], 10) : 1;
  const stripped = numMatch ? outer.replace(numMatch[0], "") : outer;
  const alternatives = stripped.split(/\s+or\s+|\//i);
  const altTargets = alternatives.map((alt) => matchTargets(alt));
  const isOrClause = altTargets.filter((t) => t.length > 0).length > 1;

  altTargets.forEach((targets, idx) => {
    const others = isOrClause
      ? altTargets.filter((_, j) => j !== idx).flat()
      : [];
    for (const cat of targets) {
      results.push({ cat, count: outerCount, orWith: others.filter((o) => o !== cat) });
    }
  });

  // Parenthetical breakdown: each part has its own count (e.g. "1 Dal + 2 Gravies").
  if (inner) {
    const parts = inner.split(/\+|,|\s+and\s+/i);
    for (const p of parts) {
      const m = p.match(/\b(\d+)\b/);
      const c = m ? parseInt(m[1], 10) : 1;
      for (const cat of matchTargets(p)) {
        results.push({ cat, count: c, orWith: [] });
      }
    }
  }
  return results;
}

type Inclusion = { count: number; orWith: string[] };

function collectPackageInclusions(pkg: Package): Map<string, Inclusion> {
  const lines: string[] = [
    ...(pkg.contents ?? []),
    ...(pkg.vegContents ?? []),
    ...(pkg.nonVegContents ?? []),
  ];
  const out = new Map<string, Inclusion>();
  for (const line of lines) {
    for (const { cat, count, orWith } of parseInclusionLine(line)) {
      const prev = out.get(cat);
      const mergedOr = Array.from(new Set([...(prev?.orWith ?? []), ...orWith]));
      if (!prev || count > prev.count) out.set(cat, { count, orWith: mergedOr });
      else out.set(cat, { count: prev.count, orWith: mergedOr });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Hostd standard fallback quantities — used ONLY to fill gaps where the vendor
// did not state a quantity for a category that exists in their menu. Vendor
// data always wins; defaults never override or invent categories.
// ---------------------------------------------------------------------------
const DEFAULT_QUANTITIES: Record<string, Record<string, number>> = {
  Signature: {
    Mocktail: 1,
    Soup: 1,
    Starters: 2,
    "Main Course": 4,
    "Indian Breads": 4,
    Accompaniments: 3,
    Desserts: 2,
  },
  Premium: {
    Mocktail: 1,
    Soup: 1,
    Starters: 4,
    "Live Stations": 2,
    "Main Course": 4,
    "Indian Breads": 4,
    Accompaniments: 3,
    Desserts: 2,
  },
  Luxe: {
    Mocktail: 1,
    Soup: 1,
    Starters: 6,
    "Live Stations": 3,
    "Main Course": 4,
    "Indian Breads": 4,
    Accompaniments: 3,
    Desserts: 3,
  },
  Royale: {
    Mocktail: 1,
    Soup: 1,
    Starters: 6,
    "Live Stations": 3,
    "Main Course": 4,
    "Indian Breads": 4,
    Accompaniments: 3,
    Desserts: 3,
  },
};

// Internal (pre-collapse) category name -> the label used in the defaults table.
function defaultKeyFor(categoryName: string): string | null {
  if (categoryName === "Veg Starters" || categoryName === "Non-Veg Starters") return "Starters";
  if (categoryName === "Veg Main Course" || categoryName === "Non-Veg Main Course")
    return "Main Course";
  if (DEFAULT_QUANTITIES.Luxe[categoryName] !== undefined) return categoryName;
  return null;
}

// Display name shown to the user on both pages (veg/non-veg pairs collapse).
function displayCategoryName(categoryName: string): string {
  const pair = VEG_NONVEG_PAIRS.find(([v, nv]) => categoryName === v || categoryName === nv);
  return pair ? pair[2] : categoryName;
}

// Rule 8 — selection badges use the clean quantity format ("6 Veg Starters"),
// never "Choose" or "Selection of".
function ruleText(count: number, categoryName: string, orWith: string[]): string {
  const label = displayCategoryName(categoryName);
  const base = `${count} ${label}`;
  const names = Array.from(new Set(orWith.map(displayCategoryName))).filter(
    (n) => n !== label,
  );
  if (!names.length) return base;
  return `${base} (or ${names.join(" / ")})`;
}

function derivePackageSelectionRules(
  packages: Package[],
  categories: MenuCategory[],
): MenuCategory[] {
  const perPkg = packages.map((p) => ({
    tier: p.name,
    inclusions: collectPackageInclusions(p),
  }));

  // Fallback: if a category present in the vendor menu has no quantity in ANY
  // package, fill each package from the Hostd standard defaults.
  for (const c of categories) {
    const stated = perPkg.some(({ inclusions }) => inclusions.has(c.name));
    if (stated) continue;
    const key = defaultKeyFor(c.name);
    if (!key) continue;
    for (const { tier, inclusions } of perPkg) {
      const table = DEFAULT_QUANTITIES[tier];
      const fallback = table?.[key];
      if (fallback && fallback > 0) inclusions.set(c.name, { count: fallback, orWith: [] });
    }
  }

  return categories.map((c) => {
    const found = perPkg
      .map(({ tier, inclusions }) => ({ tier, incl: inclusions.get(c.name) }))
      .filter((x): x is { tier: string; incl: Inclusion } => x.incl != null);

    if (!found.length) return { ...c, selectionRules: [] };

    const orWith = Array.from(new Set(found.flatMap((f) => f.incl.orWith)));
    const allPackages = found.length === packages.length;
    const allEqual = found.every((f) => f.incl.count === found[0].incl.count);

    if (allPackages && allEqual && packages.length > 1) {
      return {
        ...c,
        selectionRules: [
          { tier: "ALL PACKAGES", rule: ruleText(found[0].incl.count, c.name, orWith) },
        ],
      };
    }

    return {
      ...c,
      selectionRules: found.map((f) => ({
        tier: f.tier,
        rule: ruleText(f.incl.count, c.name, f.incl.orWith.length ? f.incl.orWith : orWith),
      })),
    };
  });
}

// Ensure the package page states every quantity the Build Your Menu pages show,
// so the two sections can never disagree (validation rule 6 / 11).
function syncPackageInclusions(
  packages: Package[],
  categories: MenuCategory[],
): Package[] {
  return packages.map((pkg) => {
    const inclusions = collectPackageInclusions(pkg);
    const additions: string[] = [];
    for (const c of categories) {
      if (inclusions.has(c.name)) continue;
      const key = defaultKeyFor(c.name);
      const fallback = key ? DEFAULT_QUANTITIES[pkg.name]?.[key] : undefined;
      if (!fallback || fallback <= 0) continue;
      const label = displayCategoryName(c.name);
      const line = `${fallback} ${label}`;
      if (!additions.includes(line)) additions.push(line);
      inclusions.set(c.name, { count: fallback, orWith: [] });
    }
    if (!additions.length) return pkg;
    const hasSplit =
      (pkg.vegContents?.length ?? 0) > 0 || (pkg.nonVegContents?.length ?? 0) > 0;
    if (hasSplit) {
      return {
        ...pkg,
        vegContents: [...(pkg.vegContents ?? []), ...additions],
      };
    }
    return { ...pkg, contents: [...(pkg.contents ?? []), ...additions] };
  });
}

export function applyHostdMapping(catalogue: Catalogue): Catalogue {
  // Step 1: keep only buffet packages (up to 4).
  const buffetPackages = filterBuffetPackages(catalogue.packages);

  // Step 2: rename to Hostd tiers based on actual buffet count. Preserve the
  // vendor's inclusion lines verbatim (word-level Hostd terminology remap
  // only) — never simplify, deduplicate, or drop options.
  const renamed = remapPackageNames(buffetPackages);
  const remapped = renamed.map((p) => ({
    ...p,
    contents: remapInclusions(p.contents),
    vegContents: remapInclusions(p.vegContents),
    nonVegContents: remapInclusions(p.nonVegContents),
  }));

  // Step 3: map & merge vendor categories to Hostd headings (Live Stations
  // is last in HOSTD_CATEGORIES ordering).
  const merged = mergeCategories(catalogue.categories);

  // Step 4: fill any missing quantities from the Hostd defaults on BOTH sides
  // so the package page and Build Your Menu always agree.
  const packages = syncPackageInclusions(remapped, merged);

  // Step 5: derive selection rules from package inclusions — package page is
  // the single source of truth. Categories WITHOUT a derivable rule are kept:
  // dropping them would silently delete vendor dishes (rules 6, 14, 16, 20).
  // Only genuinely empty categories are removed.
  const withDerivedRules = derivePackageSelectionRules(packages, merged).filter(
    (category) =>
      (category.items?.length ?? 0) > 0 ||
      (category.subgroups ?? []).some((sg) => sg.items.length > 0),
  );

  // The package inclusions use the shared Hostd labels "Starters" and "Main
  // Course". Collapse their veg/non-veg menu counterparts after deriving the
  // quantity pills so both catalogue sections display those exact same names.
  const synchronizedCategories = combineVegNonVeg(withDerivedRules);

  // Step 6: mandatory coverage audit — every source dish must exist in the
  // rendered dataset. Anything lost during mapping/merging is re-attached
  // before rendering rather than silently dropped.
  const covered = reconcileCoverage(
    catalogue.categories,
    synchronizedCategories,
    mapCategoryName,
  );

  // Live Stations always closes the Build Your Menu journey (rule 18).
  const finalCategories = [
    ...covered.filter((c) => !/live station/i.test(c.name)),
    ...covered.filter((c) => /live station/i.test(c.name)),
  ];

  const report = auditCoverage(catalogue.categories, finalCategories);
  if (report.missing.length > 0) {
    console.error("Hostd coverage audit failed — missing dishes:", report.missing);
  }

  return { ...catalogue, packages, categories: finalCategories };
}




