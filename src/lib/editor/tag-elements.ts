// Walks a rendered catalogue DOM and assigns stable data-el-id / data-el-kind
// attributes to every editable element. Deterministic path-based IDs mean
// re-tagging on re-render is idempotent.

const EDITABLE_TEXT_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "LI",
]);

export type ElKind =
  | "text"
  | "image"
  | "card"
  | "pill"
  | "background"
  | "logo"
  | "footer"
  | "header"
  | "page-number";

function classify(el: HTMLElement): ElKind | null {
  const tag = el.tagName;
  if (tag === "IMG") {
    const alt = (el.getAttribute("alt") ?? "").toLowerCase();
    if (alt.includes("hostd")) return "logo";
    return "image";
  }
  if (tag === "HEADER") return "header";
  if (tag === "FOOTER") return "footer";
  if (EDITABLE_TEXT_TAGS.has(tag)) return "text";
  // SPAN that contains only text and is styled like a pill (border-radius 999)
  if (tag === "SPAN") {
    const style = el.getAttribute("style") ?? "";
    if (/border-radius:\s*999/.test(style)) return "pill";
    // text-only span (e.g. dish item)
    if (el.children.length === 0 && el.textContent?.trim()) return "text";
  }
  // DIV cards: has borderRadius and background
  if (tag === "DIV") {
    const style = el.getAttribute("style") ?? "";
    if (
      /border-radius:\s*(?:1[4-9]|[2-9]\d)px/.test(style) &&
      /background/.test(style)
    ) {
      return "card";
    }
    // Hero / gallery blocks with background-image
    if (/background-image:\s*url/.test(style)) return "background";
  }
  return null;
}

function isLocked(el: HTMLElement, kind: ElKind): boolean {
  if (kind === "logo") {
    const alt = (el.getAttribute("alt") ?? "").toLowerCase();
    return alt.includes("hostd");
  }
  if (kind === "footer") return true;
  if (kind === "page-number") return true;
  // The top gradient bar
  const style = el.getAttribute("style") ?? "";
  if (/linear-gradient\(90deg,\s*#6E1F2A/i.test(style)) return true;
  return false;
}

export function tagCatalogueDom(root: HTMLElement) {
  const pages = Array.from(root.querySelectorAll<HTMLElement>(".hostd-page"));
  pages.forEach((page, pageIdx) => {
    page.setAttribute("data-page-index", String(pageIdx));
    // Walk all descendants
    const walker = document.createTreeWalker(page, NodeFilter.SHOW_ELEMENT);
    let index = 0;
    while (walker.nextNode()) {
      const el = walker.currentNode as HTMLElement;
      if (el.hasAttribute("data-el-id")) {
        index++;
        continue;
      }
      const kind = classify(el);
      if (!kind) {
        index++;
        continue;
      }
      const id = `p${pageIdx}-${kind}-${index}`;
      el.setAttribute("data-el-id", id);
      el.setAttribute("data-el-kind", kind);
      if (isLocked(el, kind)) el.setAttribute("data-el-lock", "true");
      index++;
    }
    // Detect page-number span
    const pageNumSpan = page.querySelector<HTMLElement>(
      "header > span:last-child",
    );
    if (pageNumSpan) {
      pageNumSpan.setAttribute("data-el-kind", "page-number");
      pageNumSpan.setAttribute("data-el-lock", "true");
    }
  });
}
