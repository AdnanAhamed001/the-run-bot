import { useState } from "react";
import type { AddOn, Catalogue } from "@/lib/catalogue-types";
import {
  STANDARD_ADDONS,
  STANDARD_NOTES,
  STANDARD_TERMS,
  STANDARD_READY_TO_BOOK,
} from "@/lib/catalogue-standard";

interface Props {
  initial: Catalogue;
  onSubmit: (next: Catalogue) => void;
  onBack: () => void;
}

// ---- shared row types ---------------------------------------------------

interface TextRow {
  id: string;
  enabled: boolean;
  text: string;
}
interface AddOnRow {
  id: string;
  enabled: boolean;
  name: string;
  price: string;
  description: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

// ---- primitives ---------------------------------------------------------

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#DCCBB8",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
      {hint && <div style={{ fontSize: 12, color: "#7a6a5c", marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "#1a1410",
  color: "#F4F0EB",
  borderRadius: 8,
  border: "1px solid #4a3a2d",
  fontSize: 14,
  fontFamily: "inherit",
};

const iconBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #4a3a2d",
  color: "#DCCBB8",
  borderRadius: 6,
  padding: "4px 10px",
  cursor: "pointer",
  fontSize: 13,
  lineHeight: 1.2,
};

const primaryBtn: React.CSSProperties = {
  background: "#7B2D3A",
  color: "white",
  border: "none",
  padding: "6px 14px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function reorder<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// ---- editable list of plain text lines (notes / terms / formats / etc.) ---

function EditableTextList({
  title,
  rows,
  setRows,
  placeholder,
  addLabel = "+ Add",
}: {
  title: string;
  rows: TextRow[];
  setRows: (r: TextRow[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  const patch = (i: number, p: Partial<TextRow>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...p } : r)));

  return (
    <div style={{ padding: 16, background: "#1c1610", borderRadius: 10, marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <strong style={{ fontSize: 15 }}>{title}</strong>
        <button
          style={primaryBtn}
          onClick={() =>
            setRows([...rows, { id: uid(), enabled: true, text: "" }])
          }
        >
          {addLabel}
        </button>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.id}
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto auto",
            gap: 8,
            alignItems: "center",
            marginBottom: 6,
            opacity: r.enabled ? 1 : 0.45,
          }}
        >
          <input
            type="checkbox"
            checked={r.enabled}
            onChange={(e) => patch(i, { enabled: e.target.checked })}
            title="Enabled"
          />
          <input
            style={inputStyle}
            value={r.text}
            placeholder={placeholder}
            onChange={(e) => patch(i, { text: e.target.value })}
          />
          <div style={{ display: "flex", gap: 4 }}>
            <button style={iconBtn} onClick={() => setRows(reorder(rows, i, i - 1))} title="Move up">
              ↑
            </button>
            <button style={iconBtn} onClick={() => setRows(reorder(rows, i, i + 1))} title="Move down">
              ↓
            </button>
          </div>
          <button
            style={{ ...iconBtn, color: "#c98787", borderColor: "#5b2424" }}
            onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
            title="Delete"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ---- editable list of Add-Ons -------------------------------------------

function EditableAddOnList({
  rows,
  setRows,
}: {
  rows: AddOnRow[];
  setRows: (r: AddOnRow[]) => void;
}) {
  const patch = (i: number, p: Partial<AddOnRow>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...p } : r)));

  return (
    <div style={{ padding: 16, background: "#1c1610", borderRadius: 10, marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <strong style={{ fontSize: 15 }}>Add-Ons (Standard + Custom)</strong>
        <button
          style={primaryBtn}
          onClick={() =>
            setRows([
              ...rows,
              {
                id: uid(),
                enabled: true,
                name: "",
                price: "Price on Request",
                description: "",
              },
            ])
          }
        >
          + Add
        </button>
      </div>
      <div style={{ fontSize: 12, color: "#9d8e7e", marginBottom: 10 }}>
        Standard Hostd add-ons appear first. Edit, disable, delete, reorder, or add your own.
      </div>
      {rows.map((r, i) => (
        <div
          key={r.id}
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr 1fr 2fr auto auto",
            gap: 8,
            alignItems: "center",
            marginBottom: 6,
            opacity: r.enabled ? 1 : 0.45,
          }}
        >
          <input
            type="checkbox"
            checked={r.enabled}
            onChange={(e) => patch(i, { enabled: e.target.checked })}
            title="Enabled"
          />
          <input
            style={inputStyle}
            placeholder="Name"
            value={r.name}
            onChange={(e) => patch(i, { name: e.target.value })}
          />
          <input
            style={inputStyle}
            placeholder="Price"
            value={r.price}
            onChange={(e) => patch(i, { price: e.target.value })}
          />
          <input
            style={inputStyle}
            placeholder="Description"
            value={r.description}
            onChange={(e) => patch(i, { description: e.target.value })}
          />
          <div style={{ display: "flex", gap: 4 }}>
            <button style={iconBtn} onClick={() => setRows(reorder(rows, i, i - 1))}>↑</button>
            <button style={iconBtn} onClick={() => setRows(reorder(rows, i, i + 1))}>↓</button>
          </div>
          <button
            style={{ ...iconBtn, color: "#c98787", borderColor: "#5b2424" }}
            onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ---- helpers to seed rows from catalogue --------------------------------

function seedTextRows(existing: string[] | undefined, standards: string[]): TextRow[] {
  const source = existing && existing.length > 0 ? existing : standards;
  return source.map((t) => ({ id: uid(), enabled: true, text: t }));
}

function seedAddOnRows(existing: AddOn[] | undefined, standards: AddOn[]): AddOnRow[] {
  const source = existing && existing.length > 0 ? existing : standards;
  return source.map((a) => ({ id: uid(), enabled: true, ...a }));
}

// -------------------------------------------------------------------------

export function VendorInfoForm({ initial, onSubmit, onBack }: Props) {
  // Vendor primitives
  const [name, setName] = useState(initial.vendor.name);
  const [about, setAbout] = useState(initial.vendor.about);
  const [cuisine, setCuisine] = useState(initial.vendor.cuisine);
  const [instagram, setInstagram] = useState(initial.vendor.instagram ?? "");
  const [website, setWebsite] = useState(initial.vendor.website ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.vendor.logoUrl ?? null);
  const [heroUrl, setHeroUrl] = useState<string | null>(initial.heroImageUrl ?? null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>(initial.galleryImageUrls ?? []);

  // Editable list-based fields
  const [formats, setFormats] = useState<TextRow[]>(
    (initial.vendor.formats ?? []).map((t) => ({ id: uid(), enabled: true, text: t })),
  );
  const [specialities, setSpecialities] = useState<TextRow[]>(
    (initial.vendor.specialities ?? []).map((t) => ({ id: uid(), enabled: true, text: t })),
  );

  // Full editable lists (standards preloaded when nothing prior)
  const [addOns, setAddOns] = useState<AddOnRow[]>(
    seedAddOnRows(initial.addOns, [
      ...STANDARD_ADDONS,
      ...(initial.additionalAddOns ?? []),
    ]),
  );
  const [notes, setNotes] = useState<TextRow[]>(
    seedTextRows(initial.notes, [...STANDARD_NOTES, ...(initial.additionalNotes ?? [])]),
  );
  const [terms, setTerms] = useState<TextRow[]>(
    seedTextRows(initial.terms, [...STANDARD_TERMS, ...(initial.additionalTerms ?? [])]),
  );

  const [readyText, setReadyText] = useState(
    initial.readyToBookCustomText ?? STANDARD_READY_TO_BOOK,
  );

  async function handleLogo(file: File | null) {
    setLogoUrl(file ? await fileToDataUrl(file) : null);
  }
  async function handleHero(file: File | null) {
    setHeroUrl(file ? await fileToDataUrl(file) : null);
  }
  async function handleGallery(files: File[]) {
    const urls = await Promise.all(files.slice(0, 8).map(fileToDataUrl));
    setGalleryUrls(urls);
  }

  function handleSubmit() {
    const activeText = (rows: TextRow[]) =>
      rows.filter((r) => r.enabled && r.text.trim()).map((r) => r.text.trim());
    const activeAddOns: AddOn[] = addOns
      .filter((r) => r.enabled && r.name.trim())
      .map(({ name, price, description }) => ({ name, price, description }));

    const next: Catalogue = {
      ...initial,
      vendor: {
        ...initial.vendor,
        name: name.trim() || "Vendor",
        about: about.trim(),
        cuisine: cuisine.trim(),
        instagram: instagram.trim() || undefined,
        website: website.trim() || undefined,
        formats: activeText(formats),
        specialities: activeText(specialities),
        logoUrl,
      },
      heroImageUrl: heroUrl,
      galleryImageUrls: galleryUrls,
      // Full lists = source of truth going forward.
      addOns: activeAddOns,
      notes: activeText(notes),
      terms: activeText(terms),
      // Legacy fields cleared — the full lists already contain everything.
      additionalAddOns: [],
      additionalNotes: [],
      additionalTerms: [],
      readyToBookCustomText: readyText.trim() || null,
    };
    onSubmit(next);
  }

  return (
    <div
      style={{
        background: "#231b15",
        borderRadius: 16,
        padding: 32,
        color: "#F4F0EB",
        border: "1px solid #2f251d",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, margin: 0 }}>
            Vendor Information
          </h2>
          <p style={{ color: "#9d8e7e", margin: "4px 0 0", fontSize: 14 }}>
            Every field below — including standard Hostd content — is fully editable. Toggle
            items off, delete them, reorder, or add new entries before generating the catalogue.
          </p>
        </div>
        <button
          onClick={onBack}
          style={{
            background: "#2a201a",
            border: "1px solid #4a3a2d",
            color: "#F4F0EB",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <Field label="Vendor name *">
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Cuisine">
            <input style={inputStyle} value={cuisine} onChange={(e) => setCuisine(e.target.value)} />
          </Field>
          <Field label="Instagram">
            <input
              style={inputStyle}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@handle or url"
            />
          </Field>
          <Field label="Website">
            <input style={inputStyle} value={website} onChange={(e) => setWebsite(e.target.value)} />
          </Field>
          <Field label="About / vendor description">
            <textarea
              style={{ ...inputStyle, minHeight: 140, resize: "vertical" }}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </Field>
        </div>

        <div>
          <Field label="Vendor logo">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleLogo(e.target.files?.[0] ?? null)}
              style={{ ...inputStyle, padding: 8 }}
            />
            {logoUrl && (
              <img
                src={logoUrl}
                alt="logo preview"
                style={{ marginTop: 8, height: 50, background: "#fff", padding: 4, borderRadius: 4 }}
              />
            )}
          </Field>
          <Field label="Hero image (page 1)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleHero(e.target.files?.[0] ?? null)}
              style={{ ...inputStyle, padding: 8 }}
            />
            {heroUrl && (
              <img
                src={heroUrl}
                alt="hero preview"
                style={{
                  marginTop: 8,
                  width: "100%",
                  maxHeight: 140,
                  objectFit: "cover",
                  borderRadius: 6,
                }}
              />
            )}
          </Field>
          <Field label="Vendor gallery (up to 8)">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleGallery(Array.from(e.target.files ?? []))}
              style={{ ...inputStyle, padding: 8 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#9d8e7e" }}>
              {galleryUrls.length} image(s) selected
            </div>
          </Field>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
        <EditableTextList
          title="Formats Available"
          rows={formats}
          setRows={setFormats}
          placeholder="e.g. Buffet Setup"
        />
        <EditableTextList
          title="Specialities"
          rows={specialities}
          setRows={setSpecialities}
          placeholder="e.g. Gourmet Canapés"
        />
      </div>

      <EditableAddOnList rows={addOns} setRows={setAddOns} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <EditableTextList
          title="Other Notes"
          rows={notes}
          setRows={setNotes}
          placeholder="One note per row"
        />
        <EditableTextList
          title="Terms & Conditions"
          rows={terms}
          setRows={setTerms}
          placeholder="One term per row"
        />
      </div>

      <Field label="Ready-to-Book Text">
        <textarea
          style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
          value={readyText}
          onChange={(e) => setReadyText(e.target.value)}
        />
      </Field>

      <button
        onClick={handleSubmit}
        style={{
          marginTop: 16,
          background: "#7B2D3A",
          color: "white",
          border: "none",
          padding: "12px 28px",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Generate Catalogue →
      </button>
    </div>
  );
}
