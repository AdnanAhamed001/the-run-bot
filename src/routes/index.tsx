import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { extractCatalogueFromFiles } from "@/lib/catalogue-client";
import type { Catalogue } from "@/lib/catalogue-types";
import { VendorInfoForm } from "@/components/catalogue/VendorInfoForm";
import { EditorShell } from "@/components/editor/EditorShell";
import { syncSelectionRules } from "@/lib/selection-rules";
import { Upload, Loader2, FileText, X, Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hostd Catalogue Engine" },
      {
        name: "description",
        content:
          "Automatically convert any catering vendor menu (PDF, DOCX, XLSX, images) into a standardized Hostd catalogue.",
      },
      { property: "og:title", content: "Hostd Catalogue Engine" },
      {
        property: "og:description",
        content:
          "Convert catering vendor files into standardized, mobile-ready Hostd catalogues.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Stage = "upload" | "form" | "editor";

const ACCEPTED =
  ".pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*";

function formatSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function Index() {
  const [stage, setStage] = useState<Stage>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draft, setDraft] = useState<Catalogue | null>(null);
  const [finalCatalogue, setFinalCatalogue] = useState<Catalogue | null>(null);

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const incoming = Array.from(list);
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const merged = [...prev];
      for (const f of incoming) {
        const k = `${f.name}:${f.size}`;
        if (!seen.has(k)) {
          seen.add(k);
          merged.push(f);
        }
      }
      return merged;
    });
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleExtract() {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await extractCatalogueFromFiles(files);
      setDraft(result);
      setStage("form");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extract catalogue");
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(next: Catalogue) {
    setFinalCatalogue(syncSelectionRules(next));
    setStage("editor");
  }

  function handleReset() {
    setStage("upload");
    setFiles([]);
    setDraft(null);
    setFinalCatalogue(null);
    setError(null);
  }

  if (stage === "editor" && finalCatalogue) {
    return <EditorShell data={finalCatalogue} onBack={() => setStage("form")} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "#1a1410" }}>
      <header
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid #2a221c",
          color: "#F4F0EB",
        }}
      >
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700 }}>
          Hostd Catalogue Engine
        </div>
        <div style={{ fontSize: 13, color: "#9d8e7e" }}>
          Vendor files → Merge → Vendor Info → Visual Editor → Mobile-optimized PDF
        </div>
      </header>

      <main className="mx-auto" style={{ maxWidth: 1200, padding: "32px" }}>
        {stage === "upload" && (
          <div
            style={{
              background: "#231b15",
              borderRadius: 16,
              padding: 40,
              color: "#F4F0EB",
              border: "1px solid #2f251d",
            }}
          >
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 40,
                margin: "0 0 8px 0",
              }}
            >
              Upload Vendor Files
            </h1>
            <p style={{ color: "#9d8e7e", marginBottom: 28 }}>
              Upload one or more vendor documents — PDF, DOCX, XLSX, JPG or PNG.
              All files are treated as one vendor and merged into a single catalogue.
            </p>

            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
              style={{
                display: "block",
                border: `2px dashed ${dragOver ? "#DCCBB8" : "#4a3a2d"}`,
                borderRadius: 12,
                padding: 36,
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "#2a201a" : "transparent",
                transition: "all .15s",
              }}
            >
              <FileText size={36} color="#DCCBB8" style={{ margin: "0 auto" }} />
              <div style={{ marginTop: 12, fontWeight: 600 }}>
                Drag & drop files here, or click to browse
              </div>
              <div style={{ fontSize: 13, color: "#9d8e7e", marginTop: 4 }}>
                PDF · DOCX · XLSX · JPG · PNG — select multiple
              </div>
              <input
                type="file"
                accept={ACCEPTED}
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>

            {files.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#DCCBB8",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginBottom: 10,
                    fontWeight: 700,
                  }}
                >
                  {files.length} file{files.length === 1 ? "" : "s"} ready
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}:${i}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        background: "#1a1410",
                        border: "1px solid #2f251d",
                        borderRadius: 8,
                      }}
                    >
                      <FileText size={16} color="#DCCBB8" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {f.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#7a6a5c" }}>
                          {formatSize(f.size)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        aria-label={`Remove ${f.name}`}
                        style={{
                          background: "transparent",
                          border: "1px solid #4a3a2d",
                          borderRadius: 6,
                          color: "#DCCBB8",
                          padding: 6,
                          cursor: "pointer",
                          display: "inline-flex",
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <label
                  style={{
                    marginTop: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#DCCBB8",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} /> Add more files
                  <input
                    type="file"
                    accept={ACCEPTED}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            )}

            <button
              onClick={handleExtract}
              disabled={files.length === 0 || loading}
              className="mt-6 inline-flex items-center gap-2 rounded-md px-6 py-3 font-semibold disabled:opacity-50"
              style={{ background: "#7B2D3A", color: "white" }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Merging & extracting…
                </>
              ) : (
                <>
                  <Upload size={18} /> Generate catalogue →
                </>
              )}
            </button>

            {error && (
              <div
                style={{
                  marginTop: 20,
                  padding: 14,
                  background: "#3a1a1a",
                  border: "1px solid #5b2424",
                  borderRadius: 8,
                  color: "#f6c8c8",
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        {stage === "form" && draft && (
          <VendorInfoForm
            initial={draft}
            onSubmit={handleFormSubmit}
            onBack={handleReset}
          />
        )}
      </main>
    </div>
  );
}
