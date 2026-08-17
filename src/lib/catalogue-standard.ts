// Standard Hostd catalogue content. These act as editable defaults for every vendor.
// The user may edit, disable, delete, reorder, or extend them in the Vendor Info form.

import type { AddOn } from "./catalogue-types";

export const STANDARD_NOTES: string[] = [
  "Water bottles included",
  "Dietary preferences accommodated",
  "Servers available",
  "Seating assistance available",
  "Sampling available at additional cost",
];

export const STANDARD_TERMS: string[] = [
  "Food tasting available on request.",
  "Advance payment required for booking confirmation.",
  "GST applicable.",
  "Final pricing may vary based on guest count and event requirements.",
  "Additional charges may apply for specialized services and sustainable serviceware.",
  "Menu availability is subject to seasonality and ingredient availability.",
];

export const STANDARD_ADDONS: AddOn[] = [
  { name: "Live Stations", price: "Price on Request", description: "Customised live cooking station" },
  { name: "Bar Services", price: "Price on Request", description: "Bar setup (mixers, glassware, soda, ice)" },
  { name: "Mocktail Services", price: "Price on Request", description: "Custom beverage service" },
  { name: "Canapé Service", price: "Price on Request", description: "Additional gourmet canapés and passed appetizers" },
  { name: "Tables & Chairs", price: "Price on Request", description: "Seating arrangements included" },
  { name: "Tablecloth", price: "Price on Request", description: "Available" },
  { name: "Centerpiece", price: "Price on Request", description: "Table centerpieces available" },
];

export const STANDARD_READY_TO_BOOK =
  "Select your preferred package and menu options. For any customizations, dietary requirements or special event requests, please connect with your Hostd Event Steward. They will assist you with vendor finalization, coordination, menu planning and ensuring the catering experience is tailored to your event requirements.";
