import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface SEOLayoutProps {
  children: React.ReactNode;
  ctaText?: string;
}

export function SEOLayout({ children, ctaText = "Abrir Calmo" }: SEOLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        {children}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Calmo te ayuda a mantener hábitos saludables mientras trabajás con la computadora.
          </p>
          <Button asChild variant="hero" size="lg">
            <Link to="/auth?mode=signup">
              {ctaText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
