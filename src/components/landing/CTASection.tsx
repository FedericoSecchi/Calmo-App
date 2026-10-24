import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";

export const CTASection = () => {
  const { t } = useT();
  return (
    <section className="py-24 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 opacity-50" style={{ background: "var(--gradient-calm)" }} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-4">{t.hero.titlePart1}</h2>
          <p className="text-lg text-muted-foreground mb-8">{t.hero.subtitle}</p>
          <Button variant="hero" size="xl" asChild>
            <Link to="/auth?mode=signup">
              {t.hero.primaryCta}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
