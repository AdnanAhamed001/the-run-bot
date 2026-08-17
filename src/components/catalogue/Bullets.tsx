import type { ReactNode } from "react";
import { HOSTD } from "./tokens";

// Single source of truth for bullet typography across the whole catalogue.
// Every bullet in every card uses these exact metrics so alignment, indentation
// and spacing are identical on every page. Do not fork these values.
export const BULLET = {
  fontSize: 26,
  lineHeight: 1.45,
  rowGap: 14, // vertical space between bullet rows
  indent: "1.6em", // hanging indent: wrapped lines align with first-line text
  columnGap: 44, // equal spacing between columns everywhere
} as const;

export function BulletItem({
  children,
  color = HOSTD.ink,
  weight = 600,
}: {
  children: ReactNode;
  color?: string;
  weight?: number;
}) {
  return (
    <li
      style={
        {
          fontSize: BULLET.fontSize,
          fontWeight: weight,
          lineHeight: BULLET.lineHeight,
          color,
          marginBottom: BULLET.rowGap,
          breakInside: "avoid",
          // Hanging indent — first line is pulled back by the bullet width,
          // wrapped lines start exactly under the first line's text.
          paddingLeft: BULLET.indent,
          textIndent: `-${BULLET.indent}`,
          overflowWrap: "break-word",
          textWrap: "pretty",
        } as React.CSSProperties
      }
    >
      <span
        style={{
          display: "inline-block",
          width: BULLET.indent,
          textIndent: 0,
        }}
      >
        •
      </span>
      {children}
    </li>
  );
}

export function BulletList({
  items,
  color,
  weight,
  fontSize,
  lineHeight,
  rowGap,
}: {
  items: string[];
  color?: string;
  weight?: number;
  fontSize?: number;
  lineHeight?: number;
  rowGap?: number;
}) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {items.map((it, i) => (
        <li
          key={i}
          style={{
            fontSize: fontSize ?? BULLET.fontSize,
            fontWeight: weight ?? 600,
            lineHeight: lineHeight ?? BULLET.lineHeight,
            color: color ?? HOSTD.ink,
            marginBottom: rowGap ?? BULLET.rowGap,
            breakInside: "avoid",
            paddingLeft: BULLET.indent,
            textIndent: `-${BULLET.indent}`,
            overflowWrap: "break-word",
            textWrap: "pretty",
          }}
        >
          <span
            aria-hidden
            style={{ display: "inline-block", width: BULLET.indent, textIndent: 0 }}
          >
            •
          </span>
          {it}
        </li>
      ))}
    </ul>
  );
}
