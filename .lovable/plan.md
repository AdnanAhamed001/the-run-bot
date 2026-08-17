
## Phase 1 — Full Canva-like editor (existing single-file upload flow preserved)

Multi-file upload/merge lands in Phase 2. Existing extraction, Hostd mapping, pagination, and PDF export stay untouched.

### Architecture

```text
Upload PDF ──► Extract ──► VendorInfoForm ──► [NEW] Editor ──► PDF export
                                                    │
                                                    └─ Same DOM the exporter already scrapes
```

Approach: keep the current `CatalogueDocument` render, but wrap every element in an editor shell that adds selection, transforms, and inspector panels. The exporter (`pdf-export.ts`) keeps working because the DOM structure is preserved — we only add data-* hooks, absolute positioning overlays, and inline style overrides captured in an "edits" store.

### Libraries to add
- `zustand` + `zundo` — editor state + undo/redo history
- `react-moveable` — drag / resize / rotate handles
- `react-selecto` — marquee + multi-select
- `react-colorful` — HEX/RGB color picker
- `react-rnd` fallback for panel windows

### New files
- `src/lib/editor/store.ts` — Zustand store: `edits: Record<elementId, StyleOverrides>`, `selection: string[]`, `zoom`, `history`, `locks`, `pageIndex`
- `src/lib/editor/element-registry.ts` — assigns stable `data-el-id` to every editable node during render (text, image, card, pill, background, logo, footer, header, page-number)
- `src/lib/editor/apply-edits.ts` — merges store overrides into inline styles / text content at render time; runs both in editor and just before PDF export
- `src/components/editor/EditorShell.tsx` — layout: left page thumbnails, center canvas (zoomable, pan), right inspector, top toolbar
- `src/components/editor/Toolbar.tsx` — zoom, undo, redo, snap-to-grid toggle, export
- `src/components/editor/TextInspector.tsx` — font family, size, weight, color, bold/italic/underline, align, letter/line spacing
- `src/components/editor/ImageInspector.tsx` — replace (file upload), crop, rotate, delete, position
- `src/components/editor/ColorInspector.tsx` — background/border/text color via HEX + RGB + picker
- `src/components/editor/LayoutInspector.tsx` — width, height, padding, margin, duplicate, delete
- `src/components/editor/PageThumbnails.tsx` — mini rendered pages, click to navigate
- `src/components/editor/SelectionOverlay.tsx` — Moveable + Selecto wiring for the active page
- `src/components/editor/EditableText.tsx` — contentEditable wrapper honoring locks

### Modifications
- `src/components/catalogue/*` — tag every meaningful node with `data-el-id` + `data-el-kind` + `data-el-lock` where applicable. Read overrides from the store via `useElementOverride(id)` and apply as inline styles. No visual change when store is empty.
- `src/routes/index.tsx` — after `handleFormSubmit`, go to a new `stage: "editor"` that mounts `EditorShell`. Existing preview → download remains the fallback for exports; export button lives in the editor toolbar.

### Editing behaviors
- Text: click to select, double-click to edit inline. Toolbar updates the store; store overrides drive inline styles.
- Image: click select shows Moveable box (drag/resize/rotate). "Replace" opens file picker → object URL stored in edits. Crop = CSS `object-position` + `clip-path` box adjusted via handles.
- Colors: inspector edits push `backgroundColor` / `color` / `borderColor` overrides. HEX and RGB inputs synced.
- Layout: drag = translate override (x,y), resize = width/height override. Padding/margin sliders in inspector. Duplicate clones the element node + assigns new id. Delete adds `hidden: true` to overrides.
- Grid intact: default position stays flow-based; only user-moved elements go absolute. Snap-to-grid toggles a 8 px snap on Moveable.
- Locks: page container, header, footer, page numbers, Hostd branding get `data-el-lock="true"` and cannot be selected or transformed.

### Canvas controls
- Zoom slider 25–200 % (CSS transform on the canvas root)
- Undo / Redo bound to zundo history and Cmd+Z / Cmd+Shift+Z
- Auto-save: debounce store → `localStorage` under `hostd-editor-<vendor>-<hash>`
- Page thumbnails: render each `CataloguePage` at 15 % scale in a scrollable rail
- Multi-page nav: click thumbnail scrolls canvas to that page

### Export
- Reuse `exportCatalogueToPdf`. Before capturing, call `applyEdits` to inject a `<style>` block + inline overrides, then run existing html2canvas → jsPDF pipeline. PNG/JPG deferred (you selected PDF-only for v1).

### Out of scope for Phase 1
- Multi-file upload + unified parser (Phase 2)
- PNG / JPG export
- Real-time collab / cloud persistence (localStorage only)
- Adding brand-new elements from scratch (only duplicate/edit/delete existing ones)

### Risks / trade-offs
- The editor is large — expect 3–5 build iterations to stabilize (contentEditable quirks, Moveable + zoom interaction, export fidelity after transforms).
- Duplicated/absolute-positioned elements may drift when the exporter re-flows; we solve by locking exported layout to the same DOM the editor shows (no re-pagination on export).
- Adding `data-el-id` to catalogue components is a mechanical but wide change; no behavior change when the editor is unused, so current flow stays safe.

Reply "go" to start with the store + element tagging + shell scaffold, and I'll iterate from there.
