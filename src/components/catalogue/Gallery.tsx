import { HOSTD } from "./tokens";
import { PageHeading } from "./CataloguePage";

export function Gallery({
  vendorName,
  imageUrls = [],
}: {
  vendorName: string;
  imageUrls?: string[];
}) {
  const images = imageUrls.filter(Boolean).slice(0, 8);
  return (
    <>
      <PageHeading>Event Gallery</PageHeading>
      <p style={{ fontSize: 20, color: HOSTD.muted, margin: 0 }}>
        A glimpse into previous catering experiences and event setups by {vendorName}.
      </p>
      {images.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridAutoRows: "340px",
            gap: 24,
            marginTop: 8,
          }}
        >
          {images.map((src, i) => (
            <div
              key={i}
              style={{
                borderRadius: 18,
                background: `url(${src}) center/cover`,
                width: "100%",
                height: 340,
              }}
            />
          ))}
        </div>
      ) : (
        <p style={{ color: HOSTD.muted, fontSize: 18 }}>
          Gallery images will appear here once added in the Vendor Information Form.
        </p>
      )}
    </>
  );
}
