import { z } from "zod";
import type { Catalogue } from "./catalogue-types";

const PackageSchema = z.object({
  name: z.string().default("Signature"),
  pricePerPax: z.coerce.number().nullable().optional().catch(null),
  priceLabel: z.string().nullable().optional().catch(null),
  minGuests: z.coerce.number().nullable().optional().catch(null),
  vegContents: z.array(z.string()).default([]).catch([]),
  nonVegContents: z.array(z.string()).default([]).catch([]),
  contents: z.array(z.string()).default([]).catch([]),
});

const SelectionRuleSchema = z.object({
  tier: z.string().default("ALL PACKAGES"),
  rule: z.string().default("As per package"),
});

const MenuCategorySchema = z.object({
  name: z.string().default("Menu"),
  selectionRules: z.array(SelectionRuleSchema).default([]).catch([]),
  items: z.array(z.string()).default([]).catch([]),
  subgroups: z.array(z.object({ heading: z.string(), items: z.array(z.string()) })).default([]).catch([]),
});

const AddOnSchema = z.object({
  name: z.string().default("Add-on"),
  price: z.string().default("Price on Request"),
  description: z.string().default(""),
});

const CatalogueSchema = z.object({
  vendor: z.object({
    name: z.string().default("Vendor"),
    tagline: z.string().optional().catch(undefined),
    about: z.string().default("Catering vendor menu extracted from the uploaded PDF."),
    instagram: z.string().optional().catch(undefined),
    website: z.string().optional().catch(undefined),
    cuisine: z.string().default("Catering"),
    formats: z.array(z.string()).default([]).catch([]),
    specialities: z.array(z.string()).default([]).catch([]),
  }),
  packages: z.array(PackageSchema).default([]).catch([]),
  categories: z.array(MenuCategorySchema).default([]).catch([]),
  addOns: z.array(AddOnSchema).default([]).catch([]),
  serviceNotes: z.array(z.string()).default([]).catch([]),
  terms: z.array(z.string()).default([]).catch([]),
});

function extractJsonBlock(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = fence ? fence[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response");
  candidate = candidate.slice(start, end + 1);
  return candidate
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function arrayFrom(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value.split(/\n|;|,(?=\s*[A-Z])/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (obj[k] !== undefined) return obj[k];
  return undefined;
}

function normalizeCatalogue(parsed: unknown) {
  const root = record(parsed);
  const vendor = record(pick(root, ["vendor", "vendorProfile", "profile", "caterer"]));
  const packages = arrayFrom(pick(root, ["packages", "packageCards", "tiers", "pricingPackages"]));
  const categories = arrayFrom(pick(root, ["categories", "menuCategories", "buildYourMenu", "menu", "dishes"]));
  return {
    vendor: {
      name: String(pick(vendor, ["name", "vendorName", "brandName"]) || "Vendor"),
      tagline: pick(vendor, ["tagline", "subtitle"]),
      about: String(pick(vendor, ["about", "description", "profile"]) || "Catering vendor menu extracted from the uploaded PDF."),
      instagram: pick(vendor, ["instagram", "instagramHandle"]),
      website: pick(vendor, ["website", "site"]),
      cuisine: String(pick(vendor, ["cuisine", "cuisineType"]) || "Catering"),
      formats: arrayFrom(pick(vendor, ["formats", "formatsAvailable", "services"])).map(String),
      specialities: arrayFrom(pick(vendor, ["specialities", "specialties", "highlights"])).map(String),
    },
    packages: packages.map((pkg) => {
      const p = record(pkg);
      return {
        name: pick(p, ["name", "tier", "packageName"]),
        pricePerPax: pick(p, ["pricePerPax", "price", "perPax"]),
        priceLabel: pick(p, ["priceLabel", "priceText"]),
        minGuests: pick(p, ["minGuests", "minimumGuests"]),
        vegContents: arrayFrom(pick(p, ["vegContents", "veg", "vegetarian"])).map(String),
        nonVegContents: arrayFrom(pick(p, ["nonVegContents", "nonVeg", "nonVegetarian"])).map(String),
        contents: arrayFrom(pick(p, ["contents", "items", "inclusions"])).map(String),
      };
    }),
    categories: categories.map((category) => {
      const c = record(category);
      const subgroups = arrayFrom(pick(c, ["subgroups", "groups", "sections"])).map((group) => {
        const g = record(group);
        return {
          heading: String(pick(g, ["heading", "name", "title"]) || "Options"),
          items: arrayFrom(pick(g, ["items", "dishes", "options"])).map(String),
        };
      });
      const selectionRules = arrayFrom(pick(c, ["selectionRules", "rules", "selection"])).map((rule) => {
        const r = record(rule);
        return typeof rule === "string"
          ? { tier: "ALL PACKAGES", rule }
          : { tier: pick(r, ["tier", "package", "name"]), rule: pick(r, ["rule", "text", "value"]) };
      });
      return {
        name: pick(c, ["name", "category", "title"]),
        selectionRules,
        items: arrayFrom(pick(c, ["items", "dishes", "options"])).map(String),
        subgroups,
      };
    }),
    addOns: arrayFrom(pick(root, ["addOns", "addons", "addOnCards"])).map((addOn) => {
      const a = record(addOn);
      return typeof addOn === "string"
        ? { name: addOn, price: "Price on Request", description: "" }
        : {
            name: pick(a, ["name", "title"]),
            price: String(pick(a, ["price", "priceLabel"]) || "Price on Request"),
            description: String(pick(a, ["description", "details"]) || ""),
          };
    }),
    serviceNotes: arrayFrom(pick(root, ["serviceNotes", "notes", "otherNotes"])).map(String),
    terms: arrayFrom(pick(root, ["terms", "termsAndConditions", "conditions"])).map(String),
  };
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function dedupeStrings(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const k = norm(s);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

export function parseCatalogueResponse(text: string): Catalogue {
  const parsed = JSON.parse(extractJsonBlock(text));
  const result = CatalogueSchema.safeParse(normalizeCatalogue(parsed));
  if (!result.success) {
    console.warn("Catalogue schema validation issues:", result.error.issues.slice(0, 5));
    throw new Error("The menu was extracted, but the output structure could not be rendered. Please try a clearer file.");
  }
  const base = result.data;

  // Dedupe merged data across files
  const packagesSeen = new Set<string>();
  const packages = base.packages.filter((p) => {
    const k = norm(p.name);
    if (packagesSeen.has(k)) return false;
    packagesSeen.add(k);
    return true;
  }).map((p) => ({
    ...p,
    contents: dedupeStrings(p.contents ?? []),
    vegContents: dedupeStrings(p.vegContents ?? []),
    nonVegContents: dedupeStrings(p.nonVegContents ?? []),
  }));

  const catSeen = new Map<string, typeof base.categories[number]>();
  for (const c of base.categories) {
    const k = norm(c.name);
    const existing = catSeen.get(k);
    if (!existing) {
      catSeen.set(k, { ...c, items: dedupeStrings(c.items) });
    } else {
      existing.items = dedupeStrings([...existing.items, ...c.items]);
      existing.subgroups = [...(existing.subgroups ?? []), ...(c.subgroups ?? [])];
    }
  }
  const categories = Array.from(catSeen.values());

  const addOnsSeen = new Set<string>();
  const addOns = base.addOns.filter((a) => {
    const k = norm(a.name);
    if (addOnsSeen.has(k)) return false;
    addOnsSeen.add(k);
    return true;
  });

  return {
    vendor: {
      ...base.vendor,
      formats: dedupeStrings(base.vendor.formats),
      specialities: dedupeStrings(base.vendor.specialities),
      logoUrl: null,
    },
    packages,
    categories,
    additionalAddOns: addOns,
    additionalNotes: dedupeStrings(base.serviceNotes),
    additionalTerms: dedupeStrings(base.terms),
    readyToBookCustomText: null,
    heroImageUrl: null,
    galleryImageUrls: [],
  } satisfies Catalogue;
}

export async function extractCatalogueFromFiles(files: File[]): Promise<Catalogue> {
  const { extractFromFiles } = await import("./file-extract");
  const extracted = await extractFromFiles(files);

  const textBlocks: string[] = [];
  const images: string[] = [];
  for (const f of extracted) {
    if (f.text && f.text.trim()) {
      textBlocks.push(`===== FILE: ${f.name} =====\n${f.text.trim()}`);
    }
    images.push(...f.imageDataUrls);
  }

  const combinedText = textBlocks.join("\n\n");
  if (!combinedText && images.length === 0) {
    throw new Error("Could not extract any content from the uploaded files.");
  }

  const res = await fetch("/api/extract-catalogue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: combinedText, images }),
  });
  const json = await res.json().catch(() => ({ error: "Invalid server response" }));
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || `Server error ${res.status}`);
  }
  const text = (json as { text?: string }).text;
  if (!text) throw new Error("Model returned no text");
  return parseCatalogueResponse(text);
}

// Legacy single-PDF entry point — used by older callers.
export async function extractCatalogueFromPdf(pdf: File): Promise<Catalogue> {
  return extractCatalogueFromFiles([pdf]);
}

