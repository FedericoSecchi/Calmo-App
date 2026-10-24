import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useWaitlist } from "@/hooks/useWaitlist";
import { track } from "@/lib/analytics";

function resolveSource(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    const q = new URLSearchParams(window.location.search).get("source");
    if (q === "e2e") return "e2e";
  } catch {
    /* ignore */
  }
  return fallback;
}

export const PricingSection = () => {
  const { t } = useT();
  const { status, error, submit } = useWaitlist(resolveSource(t.waitlist.sources.pricing));
  const [email, setEmail] = useState("");

  useEffect(() => {
    track("pricing_view");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit(email);
  };

  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl text-foreground">
            {t.pricing.title} <span className="text-primary">{t.pricing.titleHighlight}</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t.pricing.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative bg-card rounded-2xl p-8 border border-border/50 shadow-soft"
          >
            <div className="text-center mb-6">
              <h3 className="font-heading text-xl text-foreground mb-2">{t.pricing.free.name}</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-heading text-4xl text-foreground">{t.pricing.free.price}</span>
                <span className="text-muted-foreground">{t.pricing.free.period}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.pricing.free.description}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {t.pricing.free.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button variant="outline" size="lg" className="w-full" asChild>
              <Link to="/auth?mode=signup">{t.pricing.free.cta}</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative bg-card rounded-2xl p-8 border border-primary shadow-glow"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                <Sparkles className="h-3 w-3" />
                {t.pricing.pro.badge}
              </span>
            </div>

            <div className="text-center mb-6">
              <h3 className="font-heading text-xl text-foreground mb-2">{t.pricing.pro.name}</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-heading text-4xl text-foreground">{t.pricing.pro.price}</span>
                <span className="text-muted-foreground">{t.pricing.pro.period}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.pricing.pro.description}</p>
            </div>

            <ul className="space-y-3 mb-6">
              {t.pricing.pro.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-border pt-6">
              <h4 className="font-heading text-sm text-foreground mb-1">{t.pricing.pro.waitlistTitle}</h4>
              <p className="text-xs text-muted-foreground mb-3">{t.pricing.pro.waitlistSubtitle}</p>
              {status === "success" ? (
                <p className="text-sm text-success font-medium" role="status">
                  {t.pricing.pro.success}
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="email"
                    required
                    placeholder={t.pricing.pro.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label={t.pricing.pro.waitlistTitle}
                  />
                  <Button type="submit" variant="hero" disabled={status === "submitting"}>
                    {status === "submitting" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t.pricing.pro.submit
                    )}
                  </Button>
                </form>
              )}
              {status === "error" && error && (
                <p className="text-xs text-destructive mt-2" role="alert">
                  {error}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
