/**
 * Sets document title and meta tags for SEO (description, canonical, Open Graph).
 * Call once per page in SEO landing pages.
 */
import { useEffect } from "react";

const BASE_URL = "https://calmo.fit";
const SITE_NAME = "Calmo";

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageSEO(
  title: string,
  description: string,
  path: string
) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;
    setMeta("description", description);
    const canonical = path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:url", canonical, true);
    setMeta("og:type", "article", true);
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
  }, [title, description, path]);
}
