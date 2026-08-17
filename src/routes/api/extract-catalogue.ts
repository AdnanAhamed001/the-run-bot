import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You convert one or more catering vendor documents (extracted text and/or menu images) into a strict Hostd catalogue JSON.

The input may span MULTIPLE files that all belong to the SAME vendor. Merge everything into a single catalogue. When two files describe the same package, category, dish, add-on or note, MERGE them and DEDUPE — never emit the same item twice.

COMPLETENESS IS THE HIGHEST PRIORITY. The uploaded documents are the complete source of truth.
Read every file, from the first line to the last line, including every page, every column,
every table cell, and every continuation list. Never stop after the first package or category.

CRITICAL RULES:
1. Extract EVERY dish across all files, verbatim, as an individual item string. Never summarize
   ("Various Veg Starters"), never truncate a list, never write "etc.", never emit representative
   samples, never merge two dishes into one string. A 60-dish category must return 60 items.
   Before answering, re-scan every file and confirm that each dish you saw appears in the output.
2. Extract ONLY BUFFET packages. IGNORE Chaat, Beverage, Breakfast, High Tea, Snack, Cocktail, Live Counter, Add-on, standalone Station, or event-specific packages. Preserve buffet package COUNT exactly (max 4). Return buffet packages in ASCENDING price order (cheapest first → most expensive last). Use the vendor's original buffet package name in "name" — Hostd display-name mapping (Bronze→Signature, Silver→Premium, Gold→Luxe, 4th→Royale) happens downstream by position.
3. Package cards contain QUANTITIES ONLY ("4 Starters", "1 Dessert", "1 Live Counter", "Rice / Bread", "3 Main Course (1 Dal + 2 Gravies)"), never dish names. COPY vendor package inclusions EXACTLY — do NOT infer, add, remove, simplify, or copy from other packages. If a package offers alternate menus (e.g. "OR" between two full inclusion blocks), preserve BOTH option blocks verbatim as separate lines.
4. If a package splits Veg / Non-Veg, fill vegContents AND nonVegContents (leave contents empty). Otherwise fill contents only.
5. Build Your Menu categories hold actual dish names. Use the vendor's category names verbatim — Hostd category mapping happens downstream. Do NOT merge categories.
6. If the vendor explicitly separates Veg and Non-Veg dishes, keep them as separate categories. If a single mixed list is provided, classify each dish as veg or non-veg by its ingredients.
7. Selection rules: leave categories[].selectionRules as an EMPTY ARRAY []. Rules are derived downstream from package inclusions.
8. Sub-grouped items go in subgroups[] (leave items[] empty for that category).
9. Extract add-ons, service notes, and terms verbatim. Dedupe across files.
9b. Include EVERY category, even one with a single item: soups, salads, chaat, mocktails/beverages,
   dals, rice, breads, accompaniments, desserts, ice creams, toppings, live stations, and any other
   section present. Small categories must never be dropped or merged away.
9c. Deduplicate only exact same-dish repetitions. If a dish appears under different packages or
   sections with different context, keep it where it carries distinct information.
10. INR pricing; pricePerPax numeric without symbols. Price-on-request -> priceLabel.

Return ONLY a single JSON object matching:
{ vendor:{name,tagline?,about,instagram?,website?,cuisine,formats[],specialities[]},
  packages:[{name,pricePerPax?,priceLabel?,minGuests?,vegContents[],nonVegContents[],contents[]}],
  categories:[{name,selectionRules:[],items[],subgroups:[{heading,items[]}]}],
  addOns:[{name,price,description}], serviceNotes[], terms[] }`;

interface Body {
  text?: string;
  images?: string[]; // data URLs
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; image: string };

export const Route = createFileRoute("/api/extract-catalogue")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            return Response.json({ error: "LOVABLE_API_KEY not configured" }, { status: 500 });
          }

          const body = (await request.json()) as Body;
          const pdfText = (body.text ?? "").trim();
          const images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
          if (!pdfText && images.length === 0) {
            return Response.json({ error: "No content provided" }, { status: 400 });
          }

          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");

          const content: ContentBlock[] = [
            {
              type: "text",
              text:
                "Extract the full Hostd catalogue from the following vendor documents. All belong to the same vendor — merge and dedupe. Output JSON only.\n\n" +
                (pdfText ? `---MENU TEXT---\n${pdfText}` : "(no text extracted; use the images)"),
            },
          ];
          for (const url of images) {
            content.push({ type: "image", image: url });
          }

          const { text } = await generateText({
            model,
            system: SYSTEM_PROMPT,
            maxOutputTokens: 32000,
            messages: [{ role: "user", content: content as unknown as never }],
          });

          return Response.json({ text });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("extract-catalogue failed:", e);
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
