import type { MenuCategory } from "@/lib/catalogue-types";
import { HOSTD, FONTS, tierColor, tierTextColor } from "./tokens";
import { BULLET, BulletList } from "./Bullets";

function RulePill({ tier, rule }: { tier: string; rule: string }) {
  return (
    <span
      style={{
        padding: "8px 18px",
        borderRadius: 999,
        background: tierColor(tier),
        color: tierTextColor(tier),
        fontSize: 18,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        lineHeight: 1.2,
        fontFamily: FONTS.sans,
      }}
    >
      {tier.toUpperCase()} : {rule}
    </span>
  );
}

// 8–12 → 1, 13–24 → 2, 25+ → 3.
function columnsFor(total: number): number {
  if (total <= 12) return 1;
  if (total <= 24) return 2;
  return 3;
}



function VegIcon() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        border: "2px solid #1E7A32",
        marginRight: 10,
        flex: "0 0 auto",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#1E7A32",
          display: "block",
        }}
      />
    </span>
  );
}

function NonVegIcon() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        border: "2px solid #B4232C",
        marginRight: 10,
        flex: "0 0 auto",
      }}
    >
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderBottom: "10px solid #B4232C",
        }}
      />
    </span>
  );
}

function SubgroupBlock({ heading, items }: { heading: string; items: string[] }) {
  const isVeg = /^veg(etarian)?$/i.test(heading.trim());
  const isNonVeg = /non[\s-]?veg/i.test(heading);
  return (
    <div style={{ marginBottom: 22 }}>
      <h4
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: HOSTD.brand,
          margin: "0 0 14px 0",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
        }}
      >
        {isVeg && <VegIcon />}
        {isNonVeg && <NonVegIcon />}
        {heading}
      </h4>
      <BulletList items={items} />

    </div>
  );
}

export function MenuCard({ category }: { category: MenuCategory }) {
  const hasSubgroups = !!(category.subgroups && category.subgroups.length > 0);
  const totalItems = hasSubgroups
    ? (category.subgroups ?? []).reduce((n, sg) => n + sg.items.length, 0)
    : category.items.length;

  const cols = columnsFor(totalItems);
  const isContinuation = /\(continued\)/i.test(category.name);
  const isLive = /live/i.test(category.name) && !isContinuation;

  return (
    <div
      style={{
        background: HOSTD.cardBg,
        borderRadius: 24,
        padding: isContinuation ? "20px 36px 28px" : "32px 36px",
        boxSizing: "border-box",
        marginTop: isLive ? 32 : 0,
        border: isLive ? `2px solid ${HOSTD.brand}` : "none",
      }}
    >
      {/* Header — continuation cards omit selection pills & decorative spacing */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
          marginBottom: isContinuation ? 14 : 22,
        }}
      >
        <div>
          {isLive && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: HOSTD.brand,
                letterSpacing: 2,
                marginBottom: 6,
              }}
            >
              PREMIUM EXPERIENCE
            </div>
          )}
          <h3
            style={{
              fontFamily: FONTS.sans,
              fontSize: isContinuation ? 32 : 40,
              fontWeight: 700,
              margin: 0,
              color: isContinuation ? HOSTD.muted : HOSTD.ink,
              lineHeight: 1.1,
              fontStyle: isContinuation ? "italic" : "normal",
            }}
          >
            {category.name}
          </h3>
        </div>
        {!isContinuation && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "flex-end",
              maxWidth: 720,
            }}
          >
            {category.selectionRules.map((r, i) => (
              <RulePill key={i} tier={r.tier} rule={r.rule} />
            ))}
          </div>
        )}
      </div>


      {/* Body — CSS multi-column keeps subgroups intact and balances column heights */}
      {hasSubgroups ? (
        <div
          style={{
            columnCount: cols,
            columnGap: BULLET.columnGap,
            columnFill: "balance",
          }}
        >
          {category.subgroups!.map((sg, i) => (
            <SubgroupBlock key={i} heading={sg.heading} items={sg.items} />
          ))}
        </div>
      ) : (
        <div
          style={{
            columnCount: cols,
            columnGap: BULLET.columnGap,
            columnFill: "balance",
          }}
        >
          <BulletList items={category.items} />
        </div>
      )}

    </div>
  );
}
