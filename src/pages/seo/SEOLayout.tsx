import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";

interface SEOLayoutProps {
  children: React.ReactNode;
}

export function SEOLayout({ children }: SEOLayoutProps) {
  const { t, lang } = useT();
  const cta = lang === "es" ? "Probar Calmo" : "Try Calmo";
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-16 max-w-3xl pt-24">
        {children}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">{t.footer.tagline}</p>
          <Button asChild variant="hero" size="lg">
            <Link to="/auth?mode=signup">
              {cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
