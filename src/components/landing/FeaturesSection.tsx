import { Bell, Activity, Dumbbell, TrendingUp, Timer, Wind } from "lucide-react";
import { useT } from "@/lib/i18n";

const ICONS = [Bell, Dumbbell, Activity, TrendingUp, Timer, Wind];

export const FeaturesSection = () => {
  const { t } = useT();
  return (
    <section id="features" className="py-24 bg-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl text-foreground">
            {t.features.title} <span className="text-primary">{t.features.titleHighlight}</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t.features.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.items.map((feature, index) => {
            const Icon = ICONS[index] ?? Bell;
            return (
              <div
                key={feature.title}
                className="group bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/20 hover:shadow-medium transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <h3 className="font-heading text-lg text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
