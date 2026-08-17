import type { Catalogue } from "@/lib/catalogue-types";
import { STANDARD_ADDONS, STANDARD_NOTES, STANDARD_TERMS } from "@/lib/catalogue-standard";
import { applyHostdMapping } from "@/lib/hostd-mapping";
import { paginateCategories, paginatePackages } from "@/lib/menu-pagination";
import { CataloguePage, PageHeading } from "./CataloguePage";
import { VendorProfile } from "./VendorProfile";
import { Gallery } from "./Gallery";
import { PackageCard } from "./PackageCard";
import { MenuCard } from "./MenuCard";
import {
  AddOnsBlock,
  ReadyToBookCard,
  ServiceNotesCard,
  TermsCard,
} from "./FinalCards";

export function CatalogueDocument({ data }: { data: Catalogue }) {
  const mapped = applyHostdMapping(data);
  const vendor = mapped.vendor;
  const packages = Array.isArray(mapped.packages) ? mapped.packages : [];
  const categories = Array.isArray(mapped.categories) ? mapped.categories : [];

  // Prefer full user-edited lists when present; fall back to standards + legacy extras.
  const mergedAddOns =
    mapped.addOns ?? [...STANDARD_ADDONS, ...(mapped.additionalAddOns ?? [])];
  const mergedNotes =
    mapped.notes ?? [...STANDARD_NOTES, ...(mapped.additionalNotes ?? [])];
  const mergedTerms =
    mapped.terms ?? [...STANDARD_TERMS, ...(mapped.additionalTerms ?? [])];

  const hasGallery = (mapped.galleryImageUrls?.filter(Boolean).length ?? 0) > 0;

  const menuPages = categories.length > 0 ? paginateCategories(categories) : [];
  const pkgPages = packages.length > 0 ? paginatePackages(packages) : [];

  const totalPages =
    1 +
    (hasGallery ? 1 : 0) +
    pkgPages.length +
    menuPages.length +
    2;

  let pageNo = 0;
  const next = () => ++pageNo;

  return (
    <div className="hostd-doc">
      {/* Page 1 — Vendor profile */}
      <CataloguePage
        pageNumber={next()}
        totalPages={totalPages}
        vendorName={vendor.name}
        logoUrl={vendor.logoUrl ?? undefined}
        showVendorCatalogueLabel
      >
        <VendorProfile vendor={vendor} heroImageUrl={mapped.heroImageUrl ?? null} />
      </CataloguePage>

      {/* Gallery */}
      {hasGallery && (
        <CataloguePage
          pageNumber={next()}
          totalPages={totalPages}
          vendorName={vendor.name}
          logoUrl={vendor.logoUrl ?? undefined}
        >
          <Gallery
            vendorName={vendor.name}
            imageUrls={mapped.galleryImageUrls?.filter(Boolean)}
          />
        </CataloguePage>
      )}

      {/* Packages — paginated so no card is ever split across pages */}
      {pkgPages.map((page, pIdx) => (
        <CataloguePage
          key={`pkg-${pIdx}`}
          pageNumber={next()}
          totalPages={totalPages}
          vendorName={vendor.name}
          logoUrl={vendor.logoUrl ?? undefined}
        >
          {pIdx === 0 && <PageHeading>Choose Your Package</PageHeading>}
          {page.map((p, i) => (
            <PackageCard key={i} pkg={p} />
          ))}
        </CataloguePage>
      ))}

      {/* Build Your Menu — one PDF page per bin, fixed height */}
      {menuPages.map((page, pIdx) => (
        <CataloguePage
          key={`menu-${pIdx}`}
          pageNumber={next()}
          totalPages={totalPages}
          vendorName={vendor.name}
          logoUrl={vendor.logoUrl ?? undefined}
        >
          {pIdx === 0 && <PageHeading>Build Your Menu</PageHeading>}
          {page.map((c, idx) => (
            <MenuCard key={idx} category={c} />
          ))}
        </CataloguePage>
      ))}


      {/* Standard content is deliberately split across two fixed pages so
          editable defaults cannot clip the mobile canvas. */}
      <CataloguePage
        pageNumber={next()}
        totalPages={totalPages}
        vendorName={vendor.name}
        logoUrl={vendor.logoUrl ?? undefined}
      >
        <AddOnsBlock addOns={mergedAddOns} />
        <ServiceNotesCard notes={mergedNotes} />
      </CataloguePage>

      <CataloguePage
        pageNumber={next()}
        totalPages={totalPages}
        vendorName={vendor.name}
        logoUrl={vendor.logoUrl ?? undefined}
      >
        <ReadyToBookCard
          vendorName={vendor.name}
          customText={mapped.readyToBookCustomText}
        />
        <TermsCard terms={mergedTerms} />
      </CataloguePage>
    </div>
  );
}
