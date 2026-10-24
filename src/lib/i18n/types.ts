export type Lang = "en" | "es";

export const LANGS: Lang[] = ["en", "es"];

export const DEFAULT_LANG: Lang = "en";

export type SeoPageKey =
  | "twentyTwenty"
  | "deskStretch"
  | "eyeStrain"
  | "computerBreaks"
  | "neckPain"
  | "backPain"
  | "pomodoroBreaks"
  | "focusCycles";

export interface SeoPagePath {
  en: string;
  es: string;
}

export const SEO_PATHS: Record<SeoPageKey, SeoPagePath> = {
  twentyTwenty: { en: "/20-20-20-rule/", es: "/es/regla-20-20-20/" },
  deskStretch: { en: "/desk-stretch/", es: "/es/estiramientos-escritorio/" },
  eyeStrain: { en: "/eye-strain/", es: "/es/fatiga-visual/" },
  computerBreaks: { en: "/computer-breaks/", es: "/es/pausas-computadora/" },
  neckPain: { en: "/neck-pain-computer/", es: "/es/dolor-de-cuello-computadora/" },
  backPain: { en: "/back-pain-office/", es: "/es/dolor-de-espalda-oficina/" },
  pomodoroBreaks: { en: "/pomodoro-breaks/", es: "/es/pausas-pomodoro/" },
  focusCycles: { en: "/focus-cycles/", es: "/es/ciclos-de-foco/" },
};

export const HOME_PATHS: Record<Lang, string> = {
  en: "/",
  es: "/es/",
};

export const LEGAL_PATHS = {
  privacy: { en: "/privacy/", es: "/es/privacidad/" },
  terms: { en: "/terms/", es: "/es/terminos/" },
};

export interface PublicRoute {
  key: string;
  lang: Lang;
  path: string;
  altPath: string;
  title: string;
  description: string;
  priority: string;
  changefreq: string;
}
