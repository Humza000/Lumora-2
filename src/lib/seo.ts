// Structured data (schema.org JSON-LD) shared by public pages. Helps search engines and
// AI answer engines (GEO) understand who Lumora is, what it offers and where.
import { services } from "./content";
import { appUrl, site } from "./site";

export const ORG_ID = appUrl("/#organization");
export const WEBSITE_ID = appUrl("/#website");

/** Search phrases the site targets. Also used in metadata keywords. */
export const keywords = [
  "web design",
  "web design agency",
  "website design UK",
  "web development",
  "Next.js developer",
  "e-commerce website design",
  "small business website",
  "landing page design",
  "website hosting and maintenance",
  "boutique web design studio",
];

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": ORG_ID,
        name: site.name,
        url: site.url,
        logo: appUrl("/icon-512.png"),
        image: appUrl("/opengraph-image"),
        description: site.description,
        slogan: site.tagline,
        email: site.email,
        areaServed: { "@type": "Country", name: "United Kingdom" },
        currenciesAccepted: "GBP",
        knowsAbout: ["Web design", "Web development", "E-commerce", "Next.js", "React", "Search engine optimisation", "Website hosting"],
        sameAs: [site.instagram.url],
        contactPoint: { "@type": "ContactPoint", contactType: "sales", email: site.email, availableLanguage: "English" },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: site.url,
        name: site.name,
        description: site.description,
        inLanguage: "en-GB",
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

export function servicesJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${site.name} services`,
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.title,
        description: s.description,
        serviceType: s.title,
        provider: { "@id": ORG_ID },
        areaServed: { "@type": "Country", name: "United Kingdom" },
      },
    })),
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: appUrl(c.path) })),
  };
}

export const defaultTitle = `${site.name}: Web Design & Development Studio`;
/** The generated share image (src/app/opengraph-image.tsx). Listed explicitly because a page's own `openGraph` drops the inherited one. */
const shareImage = { url: "/opengraph-image", width: 1200, height: 630, alt: `${site.name}: web design & development studio` };
export const baseOpenGraph = { siteName: site.name, type: "website" as const, locale: "en_GB", images: [shareImage] };

/**
 * Metadata for an indexable public page: canonical URL plus Open Graph / Twitter tags with the
 * page's own title and description (Next merges `openGraph` shallowly, so pages set it in full).
 */
export function pageMetadata({ title, description, path, ogType = "website" }: { title?: string; description: string; path: string; ogType?: "website" | "article" }) {
  const shareTitle = title ? `${title} | ${site.name}` : defaultTitle;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: { ...baseOpenGraph, type: ogType, url: path, title: shareTitle, description },
    twitter: { card: "summary_large_image" as const, title: shareTitle, description, images: [shareImage.url] },
  };
}
