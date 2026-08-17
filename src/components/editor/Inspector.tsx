import { HexColorPicker } from "react-colorful";
import { useEditorStore } from "@/lib/editor/store";

interface Props {
  id: string;
  kind: string;
  el: HTMLElement | null;
}

function useCurrent(el: HTMLElement | null, prop: string, fallback = "") {
  if (!el) return fallback;
  return (el.style as unknown as Record<string, string>)[prop] || fallback;
}

function StyleInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
      <span style={{ color: "#9d8e7e" }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "#1a1410",
          border: "1px solid #4a3a2d",
          color: "#F4F0EB",
          padding: "6px 8px",
          borderRadius: 6,
          fontSize: 13,
        }}
      />
    </label>
  );
}

function ColorField({
  label,
  prop,
  el,
  id,
}: {
  label: string;
  prop: string;
  el: HTMLElement | null;
  id: string;
}) {
  const patch = useEditorStore((s) => s.patchStyle);
  const edits = useEditorStore((s) => s.edits);
  const stored = edits[id]?.style?.[prop];
  const current =
    stored ??
    (el
      ? getComputedStyle(el).getPropertyValue(
          prop === "backgroundColor"
            ? "background-color"
            : prop === "borderColor"
              ? "border-color"
              : "color",
        )
      : "#ffffff");

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "#9d8e7e", fontSize: 12 }}>{label}</span>
      <HexColorPicker
        color={toHex(current)}
        onChange={(c) => patch(id, { [prop]: c })}
        style={{ width: "100%", height: 120 }}
      />
      <input
        value={stored ?? toHex(current)}
        onChange={(e) => patch(id, { [prop]: e.target.value })}
        style={{
          background: "#1a1410",
          border: "1px solid #4a3a2d",
          color: "#F4F0EB",
          padding: "6px 8px",
          borderRadius: 6,
          fontSize: 12,
        }}
      />
    </div>
  );
}

function toHex(color: string): string {
  if (!color) return "#000000";
  if (color.startsWith("#")) return color;
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return "#000000";
  return (
    "#" +
    [m[1], m[2], m[3]]
      .map((n) => parseInt(n).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function Inspector({ id, kind, el }: Props) {
  const patch = useEditorStore((s) => s.patchStyle);
  const setEdit = useEditorStore((s) => s.setEdit);
  const remove = useEditorStore((s) => s.deleteElement);
  const edits = useEditorStore((s) => s.edits);
  const edit = edits[id];

  const locked = el?.getAttribute("data-el-lock") === "true";

  return (
    <aside
      style={{
        width: 300,
        background: "#231b15",
        borderLeft: "1px solid #2f251d",
        padding: 16,
        color: "#F4F0EB",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          color: "#9d8e7e",
          marginBottom: 6,
        }}
      >
        {kind || "No selection"}
      </div>
      <div style={{ fontSize: 12, color: "#6c5f52", marginBottom: 16, wordBreak: "break-all" }}>
        {id || "Click an element to edit"}
      </div>

      {locked && (
        <div
          style={{
            padding: 10,
            background: "#3a2d1a",
            border: "1px solid #5b4424",
            borderRadius: 8,
            fontSize: 12,
            color: "#f6dcc8",
          }}
        >
          This element is locked by the Hostd template.
        </div>
      )}

      {!id && (
        <div style={{ fontSize: 13, color: "#9d8e7e" }}>
          Click any text, image, card, or pill on the canvas to edit its
          properties.
        </div>
      )}

      {id && !locked && (
        <div style={{ display: "grid", gap: 14 }}>
          {kind === "text" && (
            <>
              <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
                <span style={{ color: "#9d8e7e" }}>Text</span>
                <textarea
                  value={edit?.text ?? el?.textContent ?? ""}
                  onChange={(e) => setEdit(id, { text: e.target.value })}
                  rows={3}
                  style={{
                    background: "#1a1410",
                    border: "1px solid #4a3a2d",
                    color: "#F4F0EB",
                    padding: "6px 8px",
                    borderRadius: 6,
                    fontSize: 13,
                    resize: "vertical",
                  }}
                />
              </label>
              <StyleInput
                label="Font family"
                value={useCurrent(el, "fontFamily", edit?.style?.fontFamily ?? "")}
                onChange={(v) => patch(id, { fontFamily: v })}
              />
              <StyleInput
                label="Font size (px)"
                value={(edit?.style?.fontSize ?? el?.style.fontSize ?? "").replace("px", "")}
                onChange={(v) => patch(id, { fontSize: `${v}px` })}
                type="number"
              />
              <StyleInput
                label="Font weight"
                value={edit?.style?.fontWeight ?? el?.style.fontWeight ?? ""}
                onChange={(v) => patch(id, { fontWeight: v })}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <ToggleBtn
                  active={(edit?.style?.fontWeight ?? "") === "700"}
                  onClick={() =>
                    patch(id, {
                      fontWeight:
                        (edit?.style?.fontWeight ?? "") === "700"
                          ? "400"
                          : "700",
                    })
                  }
                >
                  B
                </ToggleBtn>
                <ToggleBtn
                  active={edit?.style?.fontStyle === "italic"}
                  onClick={() =>
                    patch(id, {
                      fontStyle:
                        edit?.style?.fontStyle === "italic" ? "normal" : "italic",
                    })
                  }
                >
                  I
                </ToggleBtn>
                <ToggleBtn
                  active={edit?.style?.textDecoration === "underline"}
                  onClick={() =>
                    patch(id, {
                      textDecoration:
                        edit?.style?.textDecoration === "underline"
                          ? "none"
                          : "underline",
                    })
                  }
                >
                  U
                </ToggleBtn>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["left", "center", "right", "justify"].map((a) => (
                  <ToggleBtn
                    key={a}
                    active={edit?.style?.textAlign === a}
                    onClick={() => patch(id, { textAlign: a })}
                  >
                    {a[0].toUpperCase()}
                  </ToggleBtn>
                ))}
              </div>
              <StyleInput
                label="Letter spacing (px)"
                value={(edit?.style?.letterSpacing ?? "").replace("px", "")}
                onChange={(v) => patch(id, { letterSpacing: `${v}px` })}
                type="number"
              />
              <StyleInput
                label="Line height"
                value={edit?.style?.lineHeight ?? ""}
                onChange={(v) => patch(id, { lineHeight: v })}
              />
              <ColorField label="Text color" prop="color" el={el} id={id} />
            </>
          )}

          {(kind === "image" || kind === "background" || kind === "logo") && (
            <>
              <label
                style={{
                  display: "grid",
                  gap: 4,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <span style={{ color: "#9d8e7e" }}>Replace image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    if (kind === "background") {
                      patch(id, { backgroundImage: `url(${url})` });
                    } else {
                      setEdit(id, { src: url });
                    }
                  }}
                  style={{ fontSize: 12 }}
                />
              </label>
              <StyleInput
                label="Object position"
                value={edit?.style?.objectPosition ?? "center"}
                onChange={(v) => patch(id, { objectPosition: v })}
              />
              <StyleInput
                label="Rotation (deg)"
                value={String(edit?.rotate ?? 0)}
                onChange={(v) => setEdit(id, { rotate: Number(v) })}
                type="number"
              />
            </>
          )}

          {(kind === "card" || kind === "pill") && (
            <>
              <ColorField
                label="Background"
                prop="backgroundColor"
                el={el}
                id={id}
              />
              <ColorField
                label="Border color"
                prop="borderColor"
                el={el}
                id={id}
              />
              <StyleInput
                label="Border width (px)"
                value={(edit?.style?.borderWidth ?? "").replace("px", "")}
                onChange={(v) =>
                  patch(id, { borderWidth: `${v}px`, borderStyle: "solid" })
                }
                type="number"
              />
              <StyleInput
                label="Border radius (px)"
                value={(edit?.style?.borderRadius ?? "").replace("px", "")}
                onChange={(v) => patch(id, { borderRadius: `${v}px` })}
                type="number"
              />
            </>
          )}

          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: "pointer", fontSize: 12, color: "#9d8e7e" }}>
              Layout
            </summary>
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              <StyleInput
                label="Width (px)"
                value={String(edit?.size?.width ?? Math.round(el?.offsetWidth ?? 0))}
                onChange={(v) =>
                  setEdit(id, { size: { ...edit?.size, width: Number(v) } })
                }
                type="number"
              />
              <StyleInput
                label="Height (px)"
                value={String(edit?.size?.height ?? Math.round(el?.offsetHeight ?? 0))}
                onChange={(v) =>
                  setEdit(id, { size: { ...edit?.size, height: Number(v) } })
                }
                type="number"
              />
              <StyleInput
                label="Padding"
                value={edit?.style?.padding ?? ""}
                onChange={(v) => patch(id, { padding: v })}
              />
              <StyleInput
                label="Margin"
                value={edit?.style?.margin ?? ""}
                onChange={(v) => patch(id, { margin: v })}
              />
            </div>
          </details>

          <button
            onClick={() => remove(id)}
            style={{
              marginTop: 12,
              padding: "8px 12px",
              background: "#7B2D3A",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Delete element
          </button>
        </div>
      )}
    </aside>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "6px 8px",
        background: active ? "#7B2D3A" : "#1a1410",
        color: "#F4F0EB",
        border: "1px solid #4a3a2d",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}
