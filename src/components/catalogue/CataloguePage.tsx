import type { ReactNode } from "react";
import { HOSTD, FONTS } from "./tokens";
import hostdLogo from "@/assets/hostd-logo.png";


interface Props {
  pageNumber: number;
  totalPages: number;
  vendorName: string;
  logoUrl?: string | null;
  showVendorCatalogueLabel?: boolean;
  children: ReactNode;
}

export function CataloguePage({
  pageNumber,
  totalPages,
  vendorName,
  logoUrl,
  showVendorCatalogueLabel,
  children,
}: Props) {
  return (
    <section
      className="hostd-page"
      style={{
        width: 1080,
        height: 1920,
        background: HOSTD.pageBg,
        padding: "0 70px 40px",
        color: HOSTD.ink,
        fontFamily: FONTS.sans,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        breakAfter: "page",
        pageBreakAfter: "always",
        marginBottom: 24,
        boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
      }}
    >
      {/* Top gradient bar (maroon → bronze → gold) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 10,
          background: "linear-gradient(90deg,#6E1F2A 0%,#A35C2A 50%,#E8C764 100%)",
        }}
      />
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 38,
          paddingBottom: 22,
          borderBottom: `1px solid ${HOSTD.divider}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${vendorName} logo`}
              style={{ height: 56, width: "auto", objectFit: "contain" }}
              crossOrigin="anonymous"
            />
          ) : null}
          <img
            src={hostdLogo}
            alt="hostd — Your personal party starters"
            style={{
              height: 56,
              width: "auto",
              objectFit: "contain",
              imageRendering: "auto",
            }}
          />
        </div>

        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: HOSTD.brand,
            letterSpacing: 2,
          }}
        >
          {showVendorCatalogueLabel ? "VENDOR CATALOGUE" : `PAGE ${pageNumber} OF ${totalPages}`}
        </span>
      </header>

      {/* Content */}
      <div style={{ flex: 1, paddingTop: 32, display: "flex", flexDirection: "column", gap: 28 }}>
        {children}
      </div>

      {/* Footer */}
      <footer
        style={{
          marginTop: 28,
          paddingTop: 18,
          borderTop: `1px solid ${HOSTD.divider}`,
          textAlign: "center",
          fontSize: 14,
          color: HOSTD.muted,
        }}
      >
        {vendorName} Catering Catalogue | Powered by Hostd
      </footer>
    </section>
  );
}

export function PageHeading({ children }: { children: ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: FONTS.serif,
        fontSize: 63,
        fontWeight: 700,
        color: HOSTD.brand,
        margin: 0,
        lineHeight: 1.05,
        letterSpacing: -0.5,
      }}
    >
      {children}
    </h1>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 20,
        fontWeight: 800,
        color: HOSTD.brand,
        letterSpacing: 2.5,
        margin: "0 0 14px 0",
        textTransform: "uppercase",
      }}
    >
      {children}
    </h2>
  );
}
