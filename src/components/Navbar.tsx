import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { HOME_PATHS } from "@/lib/i18n/types";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, lang } = useT();
  const location = useLocation();

  const other = lang === "en" ? "es" : "en";
  const switchHref = (() => {
    const path = location.pathname;
    if (lang === "es" && path === "/es/") return HOME_PATHS.en;
    if (lang === "en" && path === "/") return HOME_PATHS.es;
    return HOME_PATHS[other];
  })();

  const authPath = "/auth";
  const home = HOME_PATHS[lang];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to={home} aria-label={t.meta.siteName}>
            <Logo asLink={false} />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t.nav.features}
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t.nav.howItWorks}
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t.nav.pricing}
            </a>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild aria-label={t.meta.switchLanguage}>
              <Link to={switchHref}>
                <Globe className="h-4 w-4" />
                {t.meta.switchLanguage}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={authPath}>{t.nav.signIn}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={`${authPath}?mode=signup`}>{t.nav.getStarted}</Link>
            </Button>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setIsOpen(false)}>
              {t.nav.features}
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setIsOpen(false)}>
              {t.nav.howItWorks}
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setIsOpen(false)}>
              {t.nav.pricing}
            </a>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button variant="ghost" asChild className="w-full">
                <Link to={switchHref}>
                  <Globe className="h-4 w-4" />
                  {t.meta.switchLanguage}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to={authPath}>{t.nav.signIn}</Link>
              </Button>
              <Button asChild className="w-full">
                <Link to={`${authPath}?mode=signup`}>{t.nav.getStarted}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
