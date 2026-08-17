import type { Vendor } from "@/lib/catalogue-types";
import { HOSTD, FONTS } from "./tokens";
import { PageHeading, SectionLabel } from "./CataloguePage";

const CardShell = ({
  children,
  minHeight,
}: {
  children: React.ReactNode;
  minHeight?: number;
}) => (
  <div
    style={{
      background: HOSTD.cardBg,
      borderRadius: 24,
      padding: "26px 30px",
      boxSizing: "border-box",
      minHeight,
    }}
  >
    {children}
  </div>
);

export function VendorProfile({
  vendor,
  heroImageUrl,
}: {
  vendor: Vendor;
  heroImageUrl?: string | null;
}) {
  return (
    <>
      <PageHeading>{vendor.name}</PageHeading>

      {heroImageUrl ? (
        <div
          style={{
            width: "100%",
            height: 440,
            borderRadius: 24,
            overflow: "hidden",
            backgroundImage: `url(${heroImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : null}

      {vendor.about ? (
        <div>
          <SectionLabel>ABOUT</SectionLabel>
          <CardShell>
            <p
              style={{
                fontSize: 22,
                lineHeight: 1.45,
                margin: 0,
                color: HOSTD.ink,
              }}
            >
              {vendor.about}
            </p>
            {(vendor.instagram || vendor.website) && (
              <div style={{ marginTop: 18, color: HOSTD.brand, fontSize: 16 }}>
                {vendor.instagram && <div>Instagram: {vendor.instagram}</div>}
                {vendor.website && <div>Website: {vendor.website}</div>}
              </div>
            )}
          </CardShell>
        </div>
      ) : null}

      {vendor.cuisine ? (
        <div>
          <SectionLabel>CUISINE</SectionLabel>
          <CardShell>
            <p style={{ fontSize: 22, margin: 0 }}>{vendor.cuisine}</p>
          </CardShell>
        </div>
      ) : null}

      {vendor.formats?.length > 0 ? (
        <div>
          <SectionLabel>FORMATS AVAILABLE</SectionLabel>
          <CardShell>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px 32px",
                fontSize: 22,
              }}
            >
              {vendor.formats.map((f) => (
                <div key={f} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <span style={{ color: HOSTD.green, fontWeight: 900, fontSize: 22 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </CardShell>
        </div>
      ) : null}

      {vendor.specialities?.length > 0 ? (
        <div>
          <SectionLabel>SPECIALITIES</SectionLabel>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              alignContent: "flex-start",
              gap: "14px 14px",
              rowGap: 14,
              columnGap: 14,
            }}
          >
            {vendor.specialities.map((s) => (
              <span
                key={s}
                style={{
                  minHeight: 50,
                  padding: "12px 28px",
                  borderRadius: 999,
                  background: HOSTD.brand,
                  color: "white",
                  fontSize: 18,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  maxWidth: "100%",
                  fontFamily: FONTS.sans,
                  boxSizing: "border-box",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
