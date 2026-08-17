export type PackageTier = "Signature" | "Premium" | "Luxe" | string;

export interface Vendor {
  name: string;
  tagline?: string;
  about: string;
  instagram?: string;
  website?: string;
  cuisine: string;
  formats: string[];
  specialities: string[];
  logoUrl?: string | null;
}

export interface Package {
  name: PackageTier;
  pricePerPax?: number | null;
  priceLabel?: string | null;
  minGuests?: number | null;
  // If vendor splits Veg / Non-Veg in the package itself:
  vegContents?: string[];
  nonVegContents?: string[];
  // Otherwise single block:
  contents?: string[];
}

export interface SelectionRule {
  tier: string; // SIGNATURE | PREMIUM | LUXE | ALL PACKAGES
  rule: string; // e.g. "Choose 4"
}

export interface MenuSubgroup {
  heading: string; // e.g. "SIGNATURE VEG STARTERS"
  items: string[];
}

export interface MenuCategory {
  name: string;
  selectionRules: SelectionRule[];
  items: string[];
  subgroups?: MenuSubgroup[];
}

export interface AddOn {
  name: string;
  price: string;
  description: string;
}

export interface Catalogue {
  vendor: Vendor;
  packages: Package[];
  categories: MenuCategory[];
  // Legacy: vendor-specific extras only (merged with STANDARD_* at render time).
  additionalAddOns: AddOn[];
  additionalNotes: string[];
  additionalTerms: string[];
  // Full editable lists (preferred when present). Produced by the Vendor Info form.
  addOns?: AddOn[];
  notes?: string[];
  terms?: string[];
  readyToBookCustomText?: string | null;
  galleryImageUrls?: string[];
  heroImageUrl?: string | null;
}
