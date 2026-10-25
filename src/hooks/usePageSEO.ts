import { useEffect } from "react";
import { SITE_URL } from "@/config/site";
import type { Lang } from "@/lib/i18n/types";

interface Options {
  title: string;
  description: string;
  path: string;
  altPath?: string;
  lang: Lang;
  /** When true, sets a `robots` meta of `noindex, nofollow`. Used by /join/. */
  noindex?: boolean;
  /** Overrides the default og image path (e.g. /og-image-join-en.png). */
  ogImagePath?: string;
}

function setMeta(name: string, content: string, isProperty = false) {
  if (typeof document === "undefined") return;
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string, hreflang?: string) {
  if (typeof document === "undefined") return;
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let link = document.querySelector(selector) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    if (hreflang) link.setAttribute("hreflang", hreflang);
    document.head.appendChild(link);
  }
  link.href = href;
}

function removeAlternates() {
  if (typeof document === "undefined") return;
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((n) => n.parentNode?.removeChild(n));
}

export function usePageSEO({ title, description, path, altPath, lang, noindex, ogImagePath }: Options) {
  useEffect(() => {
    document.title = title;
    setMeta("description", description);
    const canonical = `${SITE_URL}${path}`;
    setLink("canonical", canonical);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", canonical, true);
    setMeta("og:type", "article", true);
    setMeta("og:locale", lang === "es" ? "es_ES" : "en_US", true);
    if (ogImagePath) {
      setMeta("og:image", `${SITE_URL}${ogImagePath}`, true);
      setMeta("twitter:image", `${SITE_URL}${ogImagePath}`);
    }
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("robots", noindex ? "noindex, nofollow" : "index, follow");
    document.documentElement.lang = lang;

    removeAlternates();
    const enHref = lang === "en" ? canonical : `${SITE_URL}${altPath ?? ""}`;
    const esHref = lang === "es" ? canonical : `${SITE_URL}${altPath ?? ""}`;
    setLink("alternate", enHref, "en");
    setLink("alternate", esHref, "es");
    setLink("alternate", enHref, "x-default");
  }, [title, description, path, altPath, lang, noindex, ogImagePath]);
}
