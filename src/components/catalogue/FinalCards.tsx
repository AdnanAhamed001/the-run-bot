import type { AddOn } from "@/lib/catalogue-types";
import { HOSTD, FONTS } from "./tokens";
import { BulletList } from "./Bullets";

export function AddOnsBlock({ addOns }: { addOns: AddOn[] }) {
  return (
    <div
      style={{
        background: HOSTD.cardBg,
        borderRadius: 24,
        padding: "32px 36px",
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          fontFamily: FONTS.sans,
          fontSize: 32,
          fontWeight: 700,
          margin: "0 0 20px 0",
        }}
      >
        Add-Ons
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {addOns.map((a, i) => (
          <div
            key={i}
            style={{
              borderRadius: 18,
              background: "#F1E7D4",
              padding: "18px 22px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 6,
                alignItems: "baseline",
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 700 }}>{a.name}</span>
              <span
                style={{ fontSize: 13, color: HOSTD.gold, fontWeight: 700, whiteSpace: "nowrap" }}
              >
                {a.price}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: HOSTD.muted, lineHeight: 1.4 }}>
              {a.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Permanent icon spec: a fixed 28px circle with the tick optically centred by
// flex alignment only — no manual offsets, no baseline dependence.
const CHECK_SIZE = 28;

function CheckIcon() {
  return (
    <span
      aria-hidden
      style={{
        width: CHECK_SIZE,
        height: CHECK_SIZE,
        flex: `0 0 ${CHECK_SIZE}px`,
        borderRadius: "50%",
        border: `2px solid ${HOSTD.ink}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: 0,
        lineHeight: 0,
        overflow: "hidden",
      }}
    >
      <svg
        width={CHECK_SIZE - 12}
        height={CHECK_SIZE - 12}
        viewBox="0 0 24 24"
        style={{ display: "block", flex: "0 0 auto" }}
      >
        <path
          d="M4 12.5L9.5 18L20 6.5"
          fill="none"
          stroke={HOSTD.ink}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function ServiceNotesCard({ notes }: { notes: string[] }) {
  return (
    <div
      style={{
        background: HOSTD.cardBg,
        borderRadius: 24,
        padding: "32px 36px",
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          fontFamily: FONTS.sans,
          fontSize: 32,
          fontWeight: 700,
          margin: "0 0 18px 0",
        }}
      >
        Other Notes
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px 44px",
          fontSize: 18,
          alignItems: "start",
        }}
      >
        {notes.map((n, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
          >
            <CheckIcon />
            <span style={{ lineHeight: `${CHECK_SIZE}px`, display: "block" }}>
              {n}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}



export function ReadyToBookCard({
  vendorName,
  customText,
}: {
  vendorName: string;
  customText?: string | null;
}) {
  return (
    <div
      style={{
        borderRadius: 28,
        background: HOSTD.brand,
        color: "white",
        padding: "44px 48px",
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontFamily: FONTS.serif,
          fontSize: 44,
          fontWeight: 700,
          margin: "0 0 22px 0",
          fontStyle: "italic",
        }}
      >
        Ready to book {vendorName}?
      </h2>
      <p style={{ fontSize: 20, lineHeight: 1.55, margin: "0 auto", maxWidth: 820 }}>
        {customText && customText.trim().length > 0
          ? customText
          : "Select your preferred package and menu options. For any customizations, dietary requirements or special event requests, please connect with your Hostd Event Steward. They will assist you with vendor finalization, coordination, menu planning and ensuring the catering experience is tailored to your event requirements."}
      </p>
    </div>
  );
}

export function TermsCard({ terms }: { terms: string[] }) {
  return (
    <div
      style={{
        background: HOSTD.cardBg,
        borderRadius: 24,
        padding: "32px 36px",
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: HOSTD.brand,
          margin: "0 0 14px 0",
        }}
      >
        Terms and Conditions
      </h3>
      <BulletList
        items={terms}
        color={HOSTD.muted}
        weight={500}
        fontSize={15}
        lineHeight={1.7}
        rowGap={6}
      />
    </div>
  );
}
