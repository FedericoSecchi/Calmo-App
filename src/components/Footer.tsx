import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useT } from "@/lib/i18n";
import { LEGAL_PATHS } from "@/lib/i18n/types";

const SomoskosmosCredit = ({ label }: { label: string }) => (
  <span className="text-muted-foreground">
    {label}{" "}
    <a
      href="https://somoskosmos.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-foreground/80 hover:text-foreground underline underline-offset-2 transition-colors"
    >
      Somos Kosmos
    </a>
  </span>
);

interface FooterProps {
  variant?: "full" | "minimal";
}

export const Footer = ({ variant = "full" }: FooterProps) => {
  const { t, lang } = useT();
  const privacy = LEGAL_PATHS.privacy[lang];
  const terms = LEGAL_PATHS.terms[lang];

  if (variant === "minimal") {
    return (
      <footer className="bg-card border-t border-border py-4" role="contentinfo">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground">© {new Date().getFullYear()} Calmo</span>
          <span className="hidden sm:inline text-muted-foreground">·</span>
          <SomoskosmosCredit label={t.footer.designedBy} />
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-card border-t border-border" role="contentinfo">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Logo size="lg" />
            <p className="mt-4 text-muted-foreground max-w-sm">{t.footer.tagline}</p>
          </div>

          <div>
            <h3 className="font-heading text-sm uppercase tracking-wider text-foreground mb-4">{t.footer.product}</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t.nav.features}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t.nav.pricing}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t.nav.howItWorks}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm uppercase tracking-wider text-foreground mb-4">{t.footer.legal}</h3>
            <ul className="space-y-3">
              <li>
                <Link to={privacy} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link to={terms} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.terms}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Calmo</p>
            <p className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">{t.footer.disclaimer}</p>
          </div>
          <p className="mt-4 text-center text-xs">
            <SomoskosmosCredit label={t.footer.designedBy} />
          </p>
        </div>
      </div>
    </footer>
  );
};
