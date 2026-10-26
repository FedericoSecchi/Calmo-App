import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useSessionHint } from "@/lib/sessionHint";

export const HeroSection = () => {
  const { t } = useT();
  const hasSession = useSessionHint();
  const primaryHref = hasSession ? "/app" : "/auth?mode=signup";
  const primaryLabel = hasSession ? t.nav.openApp : t.hero.primaryCta;
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="hero-bg" aria-hidden />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            {t.hero.badge}
          </span>

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight">
            {t.hero.titlePart1} <span className="text-primary">{t.hero.titleHighlight}</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to={primaryHref} data-testid="hero-primary-cta">
                {primaryLabel}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <a href="#how-it-works">{t.hero.secondaryCta}</a>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">{t.hero.microproof}</p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
