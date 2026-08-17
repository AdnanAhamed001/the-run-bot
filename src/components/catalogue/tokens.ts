// Hostd catalogue design tokens — matched to uploaded templates.
export const HOSTD = {
  brand: "#6E1F2A",
  brandDeep: "#5A1822",
  pageBg: "#FFFFFF",
  cardBg: "#F7F1E6",
  cardBorder: "#EFE6D6",
  ink: "#1B1B1B",
  muted: "#8A8680",
  green: "#3F8A3A",
  gold: "#B98A2A",
  divider: "#E1D9CB",
  // Tier card colors — WCAG-compliant progression
  signature: "#DCC7A4",
  premium: "#D8D8D8",
  luxe: "#E7D282",
  royale: "#8B5E83",
  allBlack: "#0D0D0D",
} as const;

export function tierColor(tier: string): string {
  const k = (tier || "").trim().toLowerCase();
  if (k.startsWith("sig")) return HOSTD.signature;
  if (k.startsWith("prem")) return HOSTD.premium;
  if (k.startsWith("lux")) return HOSTD.luxe;
  if (k.startsWith("roy")) return HOSTD.royale;
  if (k.startsWith("all")) return HOSTD.allBlack;
  return HOSTD.cardBg;
}

export function tierTextColor(tier: string): string {
  const k = (tier || "").trim().toLowerCase();
  if (k.startsWith("roy") || k.startsWith("all")) return "#FFFFFF";
  return HOSTD.ink;
}

export const FONTS = {
  serif: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
  sans: "'Inter', system-ui, -apple-system, sans-serif",
};
