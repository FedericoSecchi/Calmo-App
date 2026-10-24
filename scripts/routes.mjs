// Routes config shared by generate-sitemap, prerender, verify-dist.
// Must mirror src/lib/i18n/routes.ts. Kept in sync by hand (small list).

export const SITE_URL = "https://calmo.fit";

export const HOME = {
  en: "/",
  es: "/es/",
};

export const SEO = {
  twentyTwenty: { en: "/20-20-20-rule/", es: "/es/regla-20-20-20/" },
  deskStretch: { en: "/desk-stretch/", es: "/es/estiramientos-escritorio/" },
  eyeStrain: { en: "/eye-strain/", es: "/es/fatiga-visual/" },
  computerBreaks: { en: "/computer-breaks/", es: "/es/pausas-computadora/" },
  neckPain: { en: "/neck-pain-computer/", es: "/es/dolor-de-cuello-computadora/" },
  backPain: { en: "/back-pain-office/", es: "/es/dolor-de-espalda-oficina/" },
  pomodoroBreaks: { en: "/pomodoro-breaks/", es: "/es/pausas-pomodoro/" },
  focusCycles: { en: "/focus-cycles/", es: "/es/ciclos-de-foco/" },
};

export const LEGAL = {
  privacy: { en: "/privacy/", es: "/es/privacidad/" },
  terms: { en: "/terms/", es: "/es/terminos/" },
};

export function allPublicRoutes() {
  const out = [];
  (["en", "es"]).forEach((lang) => {
    out.push({
      path: HOME[lang],
      lang,
      alt: HOME[lang === "en" ? "es" : "en"],
      priority: lang === "en" ? "1.0" : "0.9",
      changefreq: "weekly",
    });
  });
  Object.values(SEO).forEach((pair) => {
    (["en", "es"]).forEach((lang) => {
      out.push({
        path: pair[lang],
        lang,
        alt: pair[lang === "en" ? "es" : "en"],
        priority: "0.8",
        changefreq: "monthly",
      });
    });
  });
  Object.values(LEGAL).forEach((pair) => {
    (["en", "es"]).forEach((lang) => {
      out.push({
        path: pair[lang],
        lang,
        alt: pair[lang === "en" ? "es" : "en"],
        priority: "0.3",
        changefreq: "yearly",
      });
    });
  });
  return out;
}
