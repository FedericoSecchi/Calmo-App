import { useEffect } from "react";
import { SEOLayout } from "./SEOLayout";
import { SEO_CONTENT } from "./content";
import { SEO_PATHS, type Lang, type SeoPageKey } from "@/lib/i18n/types";
import { trackPageView } from "@/lib/analytics";
import { usePageSEO } from "@/hooks/usePageSEO";

interface Props {
  pageKey: SeoPageKey;
  lang: Lang;
  title: string;
  description: string;
}

export default function SeoPage({ pageKey, lang, title, description }: Props) {
  const body = SEO_CONTENT[pageKey][lang];
  const path = SEO_PATHS[pageKey][lang];
  const altPath = SEO_PATHS[pageKey][lang === "en" ? "es" : "en"];
  usePageSEO({ title, description, path, altPath, lang });
  useEffect(() => {
    trackPageView();
  }, []);
  return (
    <SEOLayout>
      <article>
        <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-6">{body.h1}</h1>
        <p className="text-lg text-muted-foreground mb-8">{body.intro}</p>
        {body.sections.map((section) => (
          <section key={section.h2} className="mb-8">
            <h2 className="font-heading text-xl text-foreground mb-3">{section.h2}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="text-muted-foreground mb-4 last:mb-0">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>
    </SEOLayout>
  );
}
