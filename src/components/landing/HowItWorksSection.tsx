import { motion } from "framer-motion";
import { UserPlus, Settings, Leaf } from "lucide-react";
import { useT } from "@/lib/i18n";

const ICONS = [UserPlus, Settings, Leaf];

export const HowItWorksSection = () => {
  const { t } = useT();
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl text-foreground">
            {t.how.title} <span className="text-secondary">{t.how.titleHighlight}</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t.how.subtitle}</p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
            {t.how.steps.map((step, index) => {
              const Icon = ICONS[index] ?? UserPlus;
              const even = index % 2 === 0;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: even ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className={`relative flex items-center gap-8 mb-12 last:mb-0 ${even ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className={`flex-1 ${even ? "md:text-right" : "md:text-left"}`}>
                    <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-soft">
                      <div className={`flex items-center gap-4 mb-3 ${even ? "md:flex-row-reverse" : ""}`}>
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-secondary" aria-hidden />
                        </div>
                        <span className="font-heading text-2xl text-muted-foreground/50">{step.number}</span>
                      </div>
                      <h3 className="font-heading text-xl text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                  <div className="hidden md:block flex-1" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
