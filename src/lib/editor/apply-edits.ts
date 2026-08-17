import type { ElementEdit } from "./store";

// Store original inline style/text per element so we can restore on edit removal.
const ORIGINAL = new WeakMap<HTMLElement, { style: string; text: string }>();

function remember(el: HTMLElement) {
  if (!ORIGINAL.has(el)) {
    ORIGINAL.set(el, {
      style: el.getAttribute("style") ?? "",
      text: el.textContent ?? "",
    });
  }
}

export function applyEdits(
  root: HTMLElement,
  edits: Record<string, ElementEdit>,
) {
  const all = Array.from(root.querySelectorAll<HTMLElement>("[data-el-id]"));
  for (const el of all) {
    const id = el.getAttribute("data-el-id")!;
    const edit = edits[id];
    remember(el);
    const orig = ORIGINAL.get(el)!;

    // Reset to original first, then apply.
    el.setAttribute("style", orig.style);
    el.style.display = "";
    el.style.visibility = "";

    if (!edit) continue;

    if (edit.hidden) {
      el.style.display = "none";
      continue;
    }

    // Text
    if (edit.text != null && el.getAttribute("data-el-kind") === "text") {
      // Only replace textContent if there are no child elements (to preserve nested nodes)
      const hasChildren = Array.from(el.children).some(
        (c) => (c as HTMLElement).getAttribute?.("data-el-kind"),
      );
      if (!hasChildren) el.textContent = edit.text;
    }

    // Image replacement
    if (edit.src && el.tagName === "IMG") {
      (el as HTMLImageElement).src = edit.src;
    }

    // Style overrides
    if (edit.style) {
      for (const [k, v] of Object.entries(edit.style)) {
        (el.style as unknown as Record<string, string>)[k] = v;
      }
    }

    // Transform (translate + rotate)
    const parts: string[] = [];
    if (edit.translate) {
      parts.push(`translate(${edit.translate.x}px, ${edit.translate.y}px)`);
    }
    if (edit.rotate) {
      parts.push(`rotate(${edit.rotate}deg)`);
    }
    if (parts.length) {
      el.style.transform = parts.join(" ");
      el.style.transformOrigin = "center center";
    }

    if (edit.size?.width != null) el.style.width = `${edit.size.width}px`;
    if (edit.size?.height != null) el.style.height = `${edit.size.height}px`;
  }
}
