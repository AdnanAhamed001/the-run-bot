// Multi-format file extraction. Runs entirely in the browser.
// Returns text blocks (labelled with filename) plus image data URLs
// for anything the server should feed to a multimodal model.

export interface ExtractedFile {
  name: string;
  text: string; // May be empty for image-only files
  imageDataUrls: string[]; // For JPG/PNG uploads
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .filter(Boolean);
    pages.push(`--- Page ${i} ---\n${strings.join(" ")}`);
  }
  return pages.join("\n\n");
}

async function extractDocxText(file: File): Promise<string> {
  // @ts-expect-error - mammoth ships a browser build without types
  const mammoth = await import("mammoth/mammoth.browser.js");
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await (mammoth as unknown as {
    extractRawText: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  }).extractRawText({ arrayBuffer });
  return value;
}

async function extractXlsxText(file: File): Promise<string> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
  const chunks: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    chunks.push(`--- Sheet: ${sheetName} ---\n${csv}`);
  }
  return chunks.join("\n\n");
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function detectKind(file: File): "pdf" | "docx" | "xlsx" | "image" | "unknown" {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx") || type.includes("wordprocessingml")) return "docx";
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || type.includes("spreadsheetml") || type.includes("ms-excel"))
    return "xlsx";
  if (type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(name)) return "image";
  return "unknown";
}

export async function extractFromFile(file: File): Promise<ExtractedFile> {
  const kind = detectKind(file);
  try {
    if (kind === "pdf") return { name: file.name, text: await extractPdfText(file), imageDataUrls: [] };
    if (kind === "docx") return { name: file.name, text: await extractDocxText(file), imageDataUrls: [] };
    if (kind === "xlsx") return { name: file.name, text: await extractXlsxText(file), imageDataUrls: [] };
    if (kind === "image") return { name: file.name, text: "", imageDataUrls: [await readAsDataUrl(file)] };
    throw new Error(`Unsupported file type: ${file.name}`);
  } catch (e) {
    throw new Error(`Failed to read ${file.name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function extractFromFiles(files: File[]): Promise<ExtractedFile[]> {
  return Promise.all(files.map(extractFromFile));
}
