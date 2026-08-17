import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Hostd PDF export — permanent behaviour:
//  • Every `.hostd-page` becomes exactly one PDF page (1:1 mapping).
//  • Fixed mobile portrait canvas (1080 × 1920, 9:16) — never A4.
//  • Pages are cloned into an isolated iframe document that contains ONLY the
//    catalogue's inline styles + web fonts. This removes app CSS (Tailwind v4
//    emits `oklch()` colors, which html2canvas cannot parse and which used to
//    make the export fail) and neutralises any editor zoom transform.
//  • Fonts and images are awaited before capture, so no page renders blank or
//    with fallback type.
//  • Each page is captured independently with resolution fallbacks, so a single
//    heavy page can never drop out of the document.

const PAGE_W = 1080;
const PAGE_H = 1920;

function validatePages(pages: HTMLElement[]): void {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page.offsetWidth !== PAGE_W || page.offsetHeight !== PAGE_H) {
      throw new Error(
        `Page ${i + 1} is not the required ${PAGE_W} × ${PAGE_H} mobile size.`,
      );
    }

    const footer = page.querySelector<HTMLElement>("footer");
    const content = footer?.previousElementSibling as HTMLElement | null;
    if (!footer || !content) continue;
    const footerTop = footer.getBoundingClientRect().top;
    for (const child of Array.from(content.children)) {
      const box = (child as HTMLElement).getBoundingClientRect();
      if (box.bottom > footerTop + 1) {
        throw new Error(
          `Page ${i + 1} contains content outside its safe page area. ` +
            "Move or resize the overflowing element before export.",
        );
      }
    }
  }
}

function fontLinkTags(): string {
  return Array.from(
    document.querySelectorAll<HTMLLinkElement>(
      'link[rel="stylesheet"], link[rel="preconnect"]',
    ),
  )
    .filter((l) => /fonts\.(googleapis|gstatic)\.com/.test(l.href))
    .map((l) => l.outerHTML)
    .join("");
}

async function waitForImages(scope: HTMLElement): Promise<void> {
  const imgs = Array.from(scope.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          setTimeout(done, 8000);
        }),
    ),
  );
}

async function createStage(): Promise<{
  doc: Document;
  body: HTMLElement;
  destroy: () => void;
}> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    top: "0",
    left: "-20000px",
    width: `${PAGE_W}px`,
    height: `${PAGE_H}px`,
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  } as CSSStyleDeclaration);
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8">${fontLinkTags()}` +
      `<style>html,body{margin:0;padding:0;background:#ffffff;color:#1A1208;}` +
      `*{box-sizing:border-box;}` +
      `.hostd-page{margin:0 !important;box-shadow:none !important;transform:none !important;zoom:1 !important;}` +
      `</style></head><body></body></html>`,
  );
  doc.close();

  // Wait for the iframe document + its webfonts.
  await new Promise<void>((resolve) => {
    if (doc.readyState === "complete") return resolve();
    iframe.addEventListener("load", () => resolve(), { once: true });
    setTimeout(resolve, 3000);
  });
  try {
    await (doc as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    /* fonts API unavailable — continue */
  }

  return {
    doc,
    body: doc.body,
    destroy: () => iframe.remove(),
  };
}

async function capture(el: HTMLElement, scale: number): Promise<HTMLCanvasElement> {
  return await html2canvas(el, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: false,
    imageTimeout: 15000,
    logging: false,
    width: PAGE_W,
    height: PAGE_H,
    windowWidth: PAGE_W,
    windowHeight: PAGE_H,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
  });
}

export async function exportCatalogueToPdf(
  root: HTMLElement,
  fileName: string,
): Promise<void> {
  const pages = Array.from(root.querySelectorAll<HTMLElement>(".hostd-page"));
  if (!pages.length) throw new Error("No catalogue pages found to export");
  validatePages(pages);

  const stage = await createStage();
  const pdf = new jsPDF({
    unit: "px",
    format: [PAGE_W, PAGE_H],
    orientation: "portrait",
    compress: true,
    hotfixes: ["px_scaling"],
  });

  try {
    for (let i = 0; i < pages.length; i++) {
      // Fresh, isolated clone of this page at its true 1080 × 1920 size.
      const clone = pages[i].cloneNode(true) as HTMLElement;
      clone.style.width = `${PAGE_W}px`;
      clone.style.height = `${PAGE_H}px`;
      clone.style.margin = "0";
      clone.style.boxShadow = "none";
      clone.style.transform = "none";
      stage.body.replaceChildren(clone);

      await waitForImages(clone);
      // Let layout settle (multi-column balancing) before capture.
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      let canvas: HTMLCanvasElement | null = null;
      let lastErr: unknown = null;
      for (const scale of [2, 1.5, 1]) {
        try {
          canvas = await capture(clone, scale);
          if (canvas.width > 0 && canvas.height > 0) break;
          canvas = null;
        } catch (e) {
          lastErr = e;
          console.warn(`Page ${i + 1}: capture failed at ${scale}×, retrying…`, e);
        }
      }
      if (!canvas) {
        throw new Error(
          `Failed to render page ${i + 1} of ${pages.length}: ` +
            (lastErr instanceof Error ? lastErr.message : String(lastErr)),
        );
      }

      if (i > 0) pdf.addPage([PAGE_W, PAGE_H], "portrait");
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.94),
        "JPEG",
        0,
        0,
        PAGE_W,
        PAGE_H,
        undefined,
        "FAST",
      );
    }

    pdf.save(fileName);
  } finally {
    stage.destroy();
  }
}
