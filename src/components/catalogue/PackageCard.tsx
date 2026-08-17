import type { Package } from "@/lib/catalogue-types";
import { HOSTD, FONTS, tierColor, tierTextColor } from "./tokens";
import { BULLET, BulletList } from "./Bullets";

function ContentList({ items, color }: { items: string[]; color: string }) {
  return <BulletList items={items} color={color} weight={500} />;
}


export function PackageCard({ pkg }: { pkg: Package }) {
  const bg = tierColor(pkg.name);
  const fg = tierTextColor(pkg.name);
  const isDark = fg === "#FFFFFF";
  const mutedFg = isDark ? "rgba(255,255,255,0.75)" : HOSTD.muted;
  const brandFg = isDark ? "#FFFFFF" : HOSTD.brand;
  const dividerFg = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)";

  const hasSplit =
    (pkg.vegContents?.length ?? 0) > 0 || (pkg.nonVegContents?.length ?? 0) > 0;
  const priceDisplay =
    pkg.priceLabel ??
    (pkg.pricePerPax != null ? `₹${pkg.pricePerPax.toLocaleString("en-IN")}` : null);

  return (
    <div
      style={{
        background: bg,
        color: fg,
        borderRadius: 28,
        padding: "32px 36px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 24,
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: FONTS.serif,
              fontSize: 44,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.05,
              color: fg,
            }}
          >
            {pkg.name}
          </h3>
          {pkg.minGuests != null && (
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: 14,
                letterSpacing: 1.5,
                color: mutedFg,
                fontWeight: 700,
              }}
            >
              MINIMUM {pkg.minGuests} GUESTS
            </p>
          )}
        </div>
        {priceDisplay && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontFamily: FONTS.serif,
                fontSize: 42,
                fontWeight: 700,
                color: brandFg,
              }}
            >
              {priceDisplay}
            </span>
            {pkg.pricePerPax != null && (
              <span style={{ fontSize: 14, color: mutedFg }}>per pax</span>
            )}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: dividerFg, margin: "18px 0 22px" }} />

      {hasSplit ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              (pkg.vegContents?.length ?? 0) > 0 && (pkg.nonVegContents?.length ?? 0) > 0
                ? "1fr 1fr"
                : "1fr",
            gap: 32,
          }}
        >
          {pkg.vegContents && pkg.vegContents.length > 0 && (
            <div>
              <h4
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: brandFg,
                  margin: "0 0 14px 0",
                  letterSpacing: 1.5,
                }}
              >
                VEG
              </h4>
              <ContentList items={pkg.vegContents} color={fg} />
            </div>
          )}
          {pkg.nonVegContents && pkg.nonVegContents.length > 0 && (
            <div>
              <h4
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: brandFg,
                  margin: "0 0 14px 0",
                  letterSpacing: 1.5,
                }}
              >
                NON-VEG
              </h4>
              <ContentList items={pkg.nonVegContents} color={fg} />
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            columnCount: 2,
            columnGap: BULLET.columnGap,
            columnFill: "balance",
          }}
        >
          <ContentList items={pkg.contents ?? []} color={fg} />
        </div>
      )}

    </div>
  );
}
