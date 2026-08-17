// Pagination for MenuCategory[] onto the fixed Hostd page canvas (1080 × 1920).
// Cards are independent blocks: a card is only placed on the current page when
// it fits COMPLETELY, including a comfortable bottom margin. Otherwise the
// ENTIRE card moves to the next page. Splitting happens only when a single
// card cannot fit on an empty page (unavoidable), in which case the remainder
// continues as a "<name> (Continued)" card without selection pills.

import type { MenuCategory, MenuSubgroup } from "./catalogue-types";

// Page 1920 − top gradient (10) − header (~130) − footer (~80) − page padding
// − gaps ~ 1490 usable body.
// The measured content region is ~1660px after the fixed header/footer. Keep a
// 72px safety margin while still allowing cards that genuinely fit to share a page.
const RAW_USABLE_HEIGHT = 1630;
const BOTTOM_MARGIN = 72;
const USABLE_HEIGHT = RAW_USABLE_HEIGHT - BOTTOM_MARGIN;
const FIRST_PAGE_EXTRA = 100; // "Build Your Menu" heading only on first page

// Line metrics MUST mirror src/components/catalogue/Bullets.tsx (fontSize 26,
// lineHeight 1.45, rowGap 14). Keep in sync or pages will overflow.
const LINE_H = 38;
const ROW_GAP = 14;
const ROW_H = LINE_H + ROW_GAP; // single-line dish row
const CARD_INNER_W = 1080 - 140 - 72; // page padding + card padding
const COL_GAP = 44;
const CHAR_W = 13.5; // average glyph advance at 26px Inter

function colWidth(cols: number): number {
  return (CARD_INNER_W - COL_GAP * (cols - 1)) / cols;
}

// Wrap-aware row height: long dish names occupy 2–3 lines and must be budgeted.
function rowHeight(text: string, cols: number): number {
  const perLine = Math.max(8, Math.floor(colWidth(cols) / CHAR_W));
  const lines = Math.max(1, Math.ceil(text.length / perLine));
  return lines * LINE_H + ROW_GAP;
}

function itemsHeight(items: string[], cols: number): number {
  // Multi-column balances height, so total ÷ cols is the effective column height.
  const total = items.reduce((n, t) => n + rowHeight(t, cols), 0);
  return Math.ceil(total / cols);
}
const CARD_HEADER = 120; // original card: title 40 + selection pills row
const CONT_CARD_HEADER = 70; // continuation: smaller italic heading, no pills
const CARD_PADDING = 64; // 32 top + 32 bottom
const CONT_CARD_PADDING = 48; // 20 top + 28 bottom
const CARD_MARGIN = 28;
const SUBGROUP_HEADER = 46;
const SUBGROUP_GAP = 22;
const LIVE_EXTRA = 40;

const MIN_ITEMS_START = 3; // never leave a card with fewer than this on the first page


function isContinuation(cat: MenuCategory): boolean {
  return /\(continued\)/i.test(cat.name);
}

function columnsFor(total: number): number {
  if (total <= 12) return 1;
  if (total <= 24) return 2;
  return 3;
}

function subgroupHeight(items: string[], cols: number): number {
  return SUBGROUP_HEADER + itemsHeight(items, cols) + SUBGROUP_GAP;
}

function totalItemCount(cat: MenuCategory): number {
  const hasSubs = !!(cat.subgroups && cat.subgroups.length);
  return hasSubs
    ? (cat.subgroups ?? []).reduce((n, sg) => n + sg.items.length, 0)
    : cat.items.length;
}

function estimateCardHeight(cat: MenuCategory): number {
  const cont = isContinuation(cat);
  const isLive = /live/i.test(cat.name) && !cont;
  const hasSubs = !!(cat.subgroups && cat.subgroups.length);
  const total = totalItemCount(cat);
  const cols = columnsFor(total);

  let body = 0;
  if (hasSubs) {
    for (const sg of cat.subgroups!) body += subgroupHeight(sg.items, cols);
  } else {
    body = itemsHeight(cat.items, cols);
  }
  const header = cont ? CONT_CARD_HEADER : CARD_HEADER;
  const padding = cont ? CONT_CARD_PADDING : CARD_PADDING;
  return padding + header + body + (isLive ? LIVE_EXTRA : 0);
}

function makeContinuationName(name: string): string {
  return /\(continued\)/i.test(name) ? name : `${name} (Continued)`;
}

function splitFlat(
  cat: MenuCategory,
  remaining: number,
): { first: MenuCategory | null; rest: MenuCategory | null } {
  const cont = isContinuation(cat);
  const header = cont ? CONT_CARD_HEADER : CARD_HEADER;
  const padding = cont ? CONT_CARD_PADDING : CARD_PADDING;
  const bodyBudget = remaining - padding - header;
  const cols = columnsFor(cat.items.length);
  if (bodyBudget < ROW_H * 2) return { first: null, rest: cat };
  let used = 0;
  let canFit = 0;
  for (const it of cat.items) {
    const h = rowHeight(it, cols) / cols;
    if (used + h > bodyBudget) break;
    used += h;
    canFit++;
  }
  if (canFit >= cat.items.length) return { first: cat, rest: null };
  if (canFit < MIN_ITEMS_START) return { first: null, rest: cat };
  return {
    first: { ...cat, items: cat.items.slice(0, canFit) },
    rest: {
      ...cat,
      name: makeContinuationName(cat.name),
      items: cat.items.slice(canFit),
      selectionRules: [],
    },
  };
}

function splitWithSubgroups(
  cat: MenuCategory,
  remaining: number,
): { first: MenuCategory | null; rest: MenuCategory | null } {
  const cont = isContinuation(cat);
  const header = cont ? CONT_CARD_HEADER : CARD_HEADER;
  const padding = cont ? CONT_CARD_PADDING : CARD_PADDING;
  const bodyBudget = remaining - padding - header;
  const total = totalItemCount(cat);
  const cols = columnsFor(total);
  if (bodyBudget < SUBGROUP_HEADER + ROW_H * 2) return { first: null, rest: cat };

  const firstSubs: MenuSubgroup[] = [];
  const restSubs: MenuSubgroup[] = [];
  let used = 0;
  let filled = false;

  for (const sg of cat.subgroups!) {
    if (filled) {
      restSubs.push(sg);
      continue;
    }
    const remain = bodyBudget - used;
    const fullH = subgroupHeight(sg.items, cols);
    if (fullH <= remain) {
      firstSubs.push(sg);
      used += fullH;
      continue;
    }
    const itemBudget = remain - SUBGROUP_HEADER - SUBGROUP_GAP;
    let sgUsed = 0;
    let canFit = 0;
    for (const it of sg.items) {
      const h = rowHeight(it, cols) / cols;
      if (sgUsed + h > itemBudget) break;
      sgUsed += h;
      canFit++;
    }
    if (canFit >= MIN_ITEMS_START) {
      firstSubs.push({ heading: sg.heading, items: sg.items.slice(0, canFit) });
      restSubs.push({ heading: sg.heading, items: sg.items.slice(canFit) });
    } else {
      restSubs.push(sg);
    }
    filled = true;
  }

  const firstCount = firstSubs.reduce((n, sg) => n + sg.items.length, 0);
  if (firstCount < MIN_ITEMS_START) return { first: null, rest: cat };
  if (!restSubs.length) return { first: cat, rest: null };
  return {
    first: { ...cat, subgroups: firstSubs, items: [] },
    rest: {
      ...cat,
      name: makeContinuationName(cat.name),
      subgroups: restSubs,
      items: [],
      selectionRules: [],
    },
  };
}

function splitToFit(
  cat: MenuCategory,
  remaining: number,
): { first: MenuCategory | null; rest: MenuCategory | null } {
  const hasSubs = !!(cat.subgroups && cat.subgroups.length);
  return hasSubs ? splitWithSubgroups(cat, remaining) : splitFlat(cat, remaining);
}

export function paginateCategories(categories: MenuCategory[]): MenuCategory[][] {
  const FIRST_BUDGET = USABLE_HEIGHT - FIRST_PAGE_EXTRA;
  const CONT_BUDGET = USABLE_HEIGHT;

  const queue: MenuCategory[] = [...categories];
  const pages: MenuCategory[][] = [];
  let cur: MenuCategory[] = [];
  let curH = 0;
  let budget = FIRST_BUDGET;

  const flush = () => {
    if (cur.length) pages.push(cur);
    cur = [];
    curH = 0;
    budget = CONT_BUDGET;
  };

  let guard = 0;
  while (queue.length && guard++ < 500) {
    const cat = queue.shift()!;
    const margin = cur.length ? CARD_MARGIN : 0;
    const catH = estimateCardHeight(cat) + margin;

    // Card fits completely (bottom margin already reserved in budget).
    if (curH + catH <= budget) {
      cur.push(cat);
      curH += catH;
      continue;
    }

    // Doesn't fit — never stretch or cut: move the WHOLE card to a fresh page.
    if (cur.length) {
      flush();
      queue.unshift(cat);
      continue;
    }

    // Empty page and the card is taller than a full page: splitting is the
    // only way to avoid clipping.
    const { first, rest } = splitToFit(cat, CONT_BUDGET);
    if (first) {
      cur.push(first);
      curH = estimateCardHeight(first);
      if (rest) queue.unshift(rest);
    } else {
      cur.push(cat);
      curH = estimateCardHeight(cat);
    }
  }
  if (cur.length) pages.push(cur);
  return pages;
}


// ---------------------------------------------------------------------------
// Package pagination — package cards are NEVER split. If the next card does
// not fit, push it to a new page. First package page reserves space for the
// "Choose Your Package" heading.
// ---------------------------------------------------------------------------

import type { Package } from "./catalogue-types";

const PKG_PADDING = 64;         // 32 + 32
const PKG_HEADER = 80;          // title + optional min-guests row + price line
const PKG_DIVIDER = 40;         // divider + margins
const PKG_ROW_H = ROW_H;        // dish row — same metrics as menu bullets
const PKG_MARGIN = 28;          // must mirror CataloguePage content gap
const PKG_MIN_GUEST_ROW = 30;
const HEADING_H = 100;

function estimatePackageHeight(pkg: Package): number {
  const hasSplit =
    (pkg.vegContents?.length ?? 0) > 0 || (pkg.nonVegContents?.length ?? 0) > 0;
  let body: number;
  if (hasSplit) {
    // Each list renders in a half-width column: measure at 2-col width but
    // stack vertically (no balancing), hence × 2.
    const veg = itemsHeight(pkg.vegContents ?? [], 2) * 2;
    const nv = itemsHeight(pkg.nonVegContents ?? [], 2) * 2;
    body = Math.max(veg, nv) + PKG_ROW_H; // + VEG / NON-VEG subheading
  } else {
    body = itemsHeight(pkg.contents ?? [], 2);
  }
  const guestExtra = pkg.minGuests != null ? PKG_MIN_GUEST_ROW : 0;
  return PKG_PADDING + PKG_HEADER + guestExtra + PKG_DIVIDER + body;
}

export function paginatePackages(packages: Package[]): Package[][] {
  const pages: Package[][] = [];
  let cur: Package[] = [];
  let curH = 0;
  let budget = USABLE_HEIGHT - HEADING_H;

  const flush = () => {
    if (cur.length) pages.push(cur);
    cur = [];
    curH = 0;
    budget = USABLE_HEIGHT; // continuation package pages have no heading
  };

  for (const pkg of packages) {
    const h = estimatePackageHeight(pkg);
    const withMargin = cur.length ? h + PKG_MARGIN : h;
    if (curH + withMargin <= budget) {
      cur.push(pkg);
      curH += withMargin;
    } else {
      // Never split a package card — move the whole card to a fresh page.
      flush();
      cur.push(pkg);
      curH = h;
    }
  }
  if (cur.length) pages.push(cur);
  return pages;
}
