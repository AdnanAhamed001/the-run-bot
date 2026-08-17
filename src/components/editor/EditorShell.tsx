import { useEffect, useRef, useState } from "react";
import Moveable from "react-moveable";
import { useEditorStore, useTemporalStore } from "@/lib/editor/store";
import { applyEdits } from "@/lib/editor/apply-edits";
import { tagCatalogueDom } from "@/lib/editor/tag-elements";
import { CatalogueDocument } from "@/components/catalogue/Catalogue";
import { exportCatalogueToPdf } from "@/lib/pdf-export";
import type { Catalogue } from "@/lib/catalogue-types";
import { Inspector } from "./Inspector";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Grid3x3,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface Props {
  data: Catalogue;
  onBack: () => void;
}

const STORAGE_KEY = (name: string) => `hostd-editor:${name}`;

export function EditorShell({ data, onBack }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const {
    edits,
    selection,
    zoom,
    snapToGrid,
    setZoom,
    setSnap,
    select,
    setEdit,
    patchStyle,
    loadFromStorage,
    persist,
  } = useEditorStore();

  const undo = useTemporalStore((s) => s.undo);
  const redo = useTemporalStore((s) => s.redo);
  const pastStates = useTemporalStore((s) => s.pastStates.length);
  const futureStates = useTemporalStore((s) => s.futureStates.length);

  // Load from storage on mount
  useEffect(() => {
    loadFromStorage(STORAGE_KEY(data.vendor.name));
  }, [data.vendor.name, loadFromStorage]);

  // Debounced persist
  useEffect(() => {
    const t = setTimeout(() => persist(STORAGE_KEY(data.vendor.name)), 500);
    return () => clearTimeout(t);
  }, [edits, data.vendor.name, persist]);

  // Tag DOM + apply edits after each render
  useEffect(() => {
    if (!canvasRef.current) return;
    tagCatalogueDom(canvasRef.current);
    applyEdits(canvasRef.current, edits);
    const pages = canvasRef.current.querySelectorAll(".hostd-page").length;
    setPageCount(pages);
  }, [edits, data]);

  // Click handler for selection
  useEffect(() => {
    const root = canvasRef.current;
    if (!root) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const editable = target.closest<HTMLElement>("[data-el-id]");
      if (!editable) {
        select([]);
        setSelectedEl(null);
        return;
      }
      if (editable.getAttribute("data-el-lock") === "true") {
        return;
      }
      e.stopPropagation();
      const id = editable.getAttribute("data-el-id")!;
      select([id]);
      setSelectedEl(editable);
    };

    const onDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const editable = target.closest<HTMLElement>('[data-el-kind="text"]');
      if (!editable || editable.getAttribute("data-el-lock") === "true") return;
      if (editable.children.length > 0) return;
      e.preventDefault();
      e.stopPropagation();
      editable.contentEditable = "true";
      editable.focus();
      const range = document.createRange();
      range.selectNodeContents(editable);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    };

    const onBlur = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.contentEditable === "true") {
        el.contentEditable = "false";
        const id = el.getAttribute("data-el-id");
        if (id) setEdit(id, { text: el.textContent ?? "" });
      }
    };

    root.addEventListener("click", onClick);
    root.addEventListener("dblclick", onDblClick);
    root.addEventListener("blur", onBlur, true);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("dblclick", onDblClick);
      root.removeEventListener("blur", onBlur, true);
    };
  }, [select, setEdit]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.key.toLowerCase() === "z" && e.shiftKey) ||
        e.key.toLowerCase() === "y"
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const selectedId = selection[0];
  const selectedKind = selectedEl?.getAttribute("data-el-kind") ?? "";

  async function handleExport() {
    if (!canvasRef.current) return;
    setExporting(true);
    setExportError(null);
    const root = canvasRef.current.querySelector<HTMLDivElement>(".hostd-doc");
    if (!root) {
      setExporting(false);
      return;
    }
    // Neutralize zoom transform for capture
    const canvasBox = canvasRef.current.querySelector<HTMLDivElement>(
      ".hostd-canvas-inner",
    );
    const prev = canvasBox?.style.transform ?? "";
    if (canvasBox) canvasBox.style.transform = "none";
    try {
      const fname = `${data.vendor.name.replace(/\s+/g, "-")}-Hostd-Catalogue.pdf`;
      await exportCatalogueToPdf(root, fname);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "PDF export failed. Please try again.",
      );
    } finally {
      if (canvasBox) canvasBox.style.transform = prev;
      setExporting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#1a1410",
        display: "grid",
        gridTemplateColumns: "180px 1fr 300px",
        gridTemplateRows: "56px 1fr",
        color: "#F4F0EB",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
          borderBottom: "1px solid #2f251d",
          background: "#231b15",
        }}
      >
        <button onClick={onBack} style={btnStyle}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ width: 1, height: 24, background: "#4a3a2d", margin: "0 6px" }} />
        <button onClick={() => undo()} disabled={pastStates === 0} style={btnStyle}>
          <Undo2 size={14} />
        </button>
        <button onClick={() => redo()} disabled={futureStates === 0} style={btnStyle}>
          <Redo2 size={14} />
        </button>
        <div style={{ width: 1, height: 24, background: "#4a3a2d", margin: "0 6px" }} />
        <button onClick={() => setZoom(zoom - 0.1)} style={btnStyle}>
          <ZoomOut size={14} />
        </button>
        <span style={{ fontSize: 12, minWidth: 40, textAlign: "center" }}>
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={() => setZoom(zoom + 0.1)} style={btnStyle}>
          <ZoomIn size={14} />
        </button>
        <div style={{ width: 1, height: 24, background: "#4a3a2d", margin: "0 6px" }} />
        <button
          onClick={() => setSnap(!snapToGrid)}
          style={{ ...btnStyle, background: snapToGrid ? "#7B2D3A" : "transparent" }}
        >
          <Grid3x3 size={14} /> Snap
        </button>
        <div style={{ flex: 1 }} />
        {exportError ? (
          <span role="alert" style={{ fontSize: 12, color: "#f6c8c8", maxWidth: 320 }}>
            {exportError}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#9d8e7e" }}>Auto-saved</span>
        )}
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{ ...btnStyle, background: "#7B2D3A", color: "white" }}
        >
          {exporting ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Exporting…
            </>
          ) : (
            <>
              <Download size={14} /> Export PDF
            </>
          )}
        </button>
      </div>

      {/* Page thumbnails */}
      <div
        style={{
          background: "#231b15",
          borderRight: "1px solid #2f251d",
          overflowY: "auto",
          padding: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            color: "#9d8e7e",
            marginBottom: 12,
          }}
        >
          Pages ({pageCount})
        </div>
        <PageList pageCount={pageCount} canvasRef={canvasRef} />
      </div>

      {/* Canvas */}
      <div
        style={{
          overflow: "auto",
          background: "#0f0b08",
          position: "relative",
        }}
        ref={canvasRef}
      >
        <div
          className="hostd-canvas-inner"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            padding: "24px 0",
            width: "fit-content",
            margin: "0 auto",
          }}
        >
          <CatalogueDocument data={data} />
        </div>
        {selectedEl && (
          <Moveable
            target={selectedEl}
            draggable
            resizable
            rotatable
            snappable={snapToGrid}
            snapGridWidth={snapToGrid ? 8 : 0}
            snapGridHeight={snapToGrid ? 8 : 0}
            origin={false}
            zoom={0.6}
            onDrag={({ target, beforeTranslate }) => {
              const t = beforeTranslate;
              (target as HTMLElement).style.transform = `translate(${t[0]}px, ${t[1]}px)`;
            }}
            onDragEnd={({ lastEvent }) => {
              if (!selectedId || !lastEvent) return;
              const [x, y] = lastEvent.beforeTranslate;
              setEdit(selectedId, { translate: { x, y } });
            }}
            onResize={({ target, width, height, drag }) => {
              const el = target as HTMLElement;
              el.style.width = `${width}px`;
              el.style.height = `${height}px`;
              el.style.transform = `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px)`;
            }}
            onResizeEnd={({ lastEvent }) => {
              if (!selectedId || !lastEvent) return;
              setEdit(selectedId, {
                size: {
                  width: Math.round(lastEvent.width),
                  height: Math.round(lastEvent.height),
                },
                translate: {
                  x: lastEvent.drag.beforeTranslate[0],
                  y: lastEvent.drag.beforeTranslate[1],
                },
              });
            }}
            onRotate={({ target, rotate }) => {
              (target as HTMLElement).style.transform += ` rotate(${rotate}deg)`;
            }}
            onRotateEnd={({ lastEvent }) => {
              if (!selectedId || !lastEvent) return;
              setEdit(selectedId, { rotate: lastEvent.rotate });
            }}
          />
        )}
      </div>

      {/* Inspector */}
      <Inspector id={selectedId ?? ""} kind={selectedKind} el={selectedEl} />
    </div>
  );
}

function PageList({
  pageCount,
  canvasRef,
}: {
  pageCount: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}) {
  const scrollTo = (idx: number) => {
    const page = canvasRef.current?.querySelectorAll<HTMLElement>(".hostd-page")[
      idx
    ];
    page?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {Array.from({ length: pageCount }).map((_, i) => (
        <button
          key={i}
          onClick={() => scrollTo(i)}
          style={{
            aspectRatio: "1080/1920",
            background: "#fff",
            border: "1px solid #4a3a2d",
            borderRadius: 4,
            cursor: "pointer",
            color: "#1a1410",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            padding: 6,
          }}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  background: "transparent",
  color: "#F4F0EB",
  border: "1px solid #4a3a2d",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
};
