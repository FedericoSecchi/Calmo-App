import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useT } from "@/lib/i18n";
import { JOIN_PATHS, type Lang } from "@/lib/i18n/types";
import { JOIN_META } from "@/lib/joinMeta";
import { Loader2, Home } from "lucide-react";

const CODE_PATTERN = /^[a-z0-9]{4,32}$/i;

interface JoinProps {
  lang: Lang;
}

export default function Join({ lang }: JoinProps) {
  const { t } = useT();
  const [params] = useSearchParams();
  const rawCode = (params.get("c") || "").trim();
  const code = useMemo(() => (CODE_PATTERN.test(rawCode) ? rawCode : null), [rawCode]);
  const path = JOIN_PATHS[lang];
  const altPath = JOIN_PATHS[lang === "en" ? "es" : "en"];
  const meta = JOIN_META[lang];
  usePageSEO({
    title: meta.title,
    description: meta.description,
    path,
    altPath,
    lang,
    noindex: true,
    ogImagePath: `/og-image-join-${lang}.png`,
  });

  useEffect(() => {
    if (!code) return;
    // Short delay so the preview flash still shows the preview page briefly
    // before the SPA redirect — useful when the server renders the static
    // HTML (vs. direct React navigation).
    const id = window.setTimeout(() => {
      window.location.replace(`/app/room/${encodeURIComponent(code)}`);
    }, 60);
    return () => window.clearTimeout(id);
  }, [code]);

  const j = t.join;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-16 max-w-2xl pt-24 text-center">
        <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-4">{j.title}</h1>
        <p className="text-muted-foreground mb-8">{j.description}</p>
        {code ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{j.joining}</span>
            </div>
            <Button asChild size="lg">
              <a href={`/app/room/${encodeURIComponent(code)}`}>{j.cta}</a>
            </Button>
            <p className="text-xs text-muted-foreground">{j.manualHint}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-destructive">{j.invalid}</p>
            <Button asChild variant="outline">
              <Link to={lang === "es" ? "/es/" : "/"}>
                <Home className="h-4 w-4 mr-2" />
                {j.home}
              </Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
