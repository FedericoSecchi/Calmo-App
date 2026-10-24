import { HOME_PATHS, LEGAL_PATHS, SEO_PATHS, type Lang, type SeoPageKey } from "./types";
import { en } from "./en";
import { es } from "./es";

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

const dicts = { en, es };

const SEO_META: Record<SeoPageKey, { en: { title: string; description: string }; es: { title: string; description: string } }> = {
  twentyTwenty: {
    en: {
      title: "20-20-20 rule for eye strain | Calmo",
      description: "What the 20-20-20 rule is, why it reduces eye strain, and how Calmo helps you follow it with gentle reminders while you work.",
    },
    es: {
      title: "Regla 20-20-20 para la vista | Calmo",
      description: "Qué es la regla 20-20-20, por qué reduce la fatiga visual y cómo Calmo te ayuda a aplicarla con recordatorios suaves mientras trabajás.",
    },
  },
  deskStretch: {
    en: {
      title: "Simple desk stretches you can do every day | Calmo",
      description: "A short set of desk stretches for neck, back, and wrists you can do without leaving your chair. Guided by Calmo in 2–5 minute routines.",
    },
    es: {
      title: "Estiramientos simples para hacer en el escritorio | Calmo",
      description: "Un set corto de estiramientos para cuello, espalda y muñecas que podés hacer sin salir de tu silla. Guiados por Calmo en rutinas de 2 a 5 minutos.",
    },
  },
  eyeStrain: {
    en: {
      title: "Computer eye strain: causes and how to prevent it | Calmo",
      description: "Why screens tire your eyes, the signs of digital eye strain, and small habits that help. Calmo turns them into gentle reminders.",
    },
    es: {
      title: "Fatiga visual por computadora: causas y cómo prevenirla | Calmo",
      description: "Por qué las pantallas cansan la vista, señales de fatiga visual digital y hábitos simples que ayudan. Calmo los convierte en recordatorios suaves.",
    },
  },
  computerBreaks: {
    en: {
      title: "How often should you take breaks from the computer? | Calmo",
      description: "A practical guide to break frequency, duration, and quality for computer work. Calmo gives you gentle nudges and a 2-minute routine.",
    },
    es: {
      title: "¿Cada cuánto conviene tomar pausas de la computadora? | Calmo",
      description: "Guía práctica de frecuencia, duración y calidad de las pausas para trabajar con la computadora. Calmo te da empujones suaves y rutinas de 2 minutos.",
    },
  },
  neckPain: {
    en: {
      title: "Neck pain from computer work: what helps | Calmo",
      description: "Why neck pain shows up during long sessions at the computer, how to adjust your setup, and short mobility routines that help.",
    },
    es: {
      title: "Dolor de cuello por la computadora: qué ayuda | Calmo",
      description: "Por qué aparece el dolor de cuello en sesiones largas frente a la computadora, cómo ajustar tu puesto y rutinas de movilidad que ayudan.",
    },
  },
  backPain: {
    en: {
      title: "Office back pain: posture and small habits | Calmo",
      description: "A clear look at office back pain: posture, chair setup, break frequency, and the small habits that compound over weeks.",
    },
    es: {
      title: "Dolor de espalda en la oficina: postura y hábitos simples | Calmo",
      description: "Una mirada clara al dolor de espalda en la oficina: postura, ajuste de la silla, frecuencia de pausas y hábitos simples que suman con las semanas.",
    },
  },
  pomodoroBreaks: {
    en: {
      title: "Pomodoro breaks: the body side of focus | Calmo",
      description: "Pomodoro is great for focus, but what you do during the break matters as much. A practical guide to body-friendly pomodoro breaks.",
    },
    es: {
      title: "Pausas pomodoro: el lado corporal del foco | Calmo",
      description: "Pomodoro ayuda con el foco, pero lo que hacés en la pausa importa igual. Guía práctica para pausas pomodoro amigables con el cuerpo.",
    },
  },
  focusCycles: {
    en: {
      title: "Focus cycles that respect your body | Calmo",
      description: "How to design focus cycles that match your energy, protect your eyes, and keep your neck and back happy during long days.",
    },
    es: {
      title: "Ciclos de foco que respetan tu cuerpo | Calmo",
      description: "Cómo diseñar ciclos de foco que acompañen tu energía, cuiden tus ojos y mantengan tu cuello y espalda a gusto en días largos.",
    },
  },
};

const LEGAL_META = {
  privacy: {
    en: {
      title: "Privacy policy | Calmo",
      description: "What Calmo collects, where it lives, and how to delete it. Short, clear, and honest.",
    },
    es: {
      title: "Política de privacidad | Calmo",
      description: "Qué recopila Calmo, dónde vive y cómo borrarlo. Corto, claro y honesto.",
    },
  },
  terms: {
    en: {
      title: "Terms of service | Calmo",
      description: "The terms for using Calmo. Not medical advice; use at your own responsibility.",
    },
    es: {
      title: "Términos del servicio | Calmo",
      description: "Términos para usar Calmo. No es consejo médico; el uso corre bajo tu responsabilidad.",
    },
  },
};

export function buildPublicRoutes(): PublicRoute[] {
  const list: PublicRoute[] = [];

  (["en", "es"] as Lang[]).forEach((lang) => {
    const d = dicts[lang];
    list.push({
      key: `home-${lang}`,
      lang,
      path: HOME_PATHS[lang],
      altPath: HOME_PATHS[lang === "en" ? "es" : "en"],
      title: d.meta.homeTitle,
      description: d.meta.homeDescription,
      priority: lang === "en" ? "1.0" : "0.9",
      changefreq: "weekly",
    });
  });

  (Object.keys(SEO_PATHS) as SeoPageKey[]).forEach((key) => {
    (["en", "es"] as Lang[]).forEach((lang) => {
      list.push({
        key: `${key}-${lang}`,
        lang,
        path: SEO_PATHS[key][lang],
        altPath: SEO_PATHS[key][lang === "en" ? "es" : "en"],
        title: SEO_META[key][lang].title,
        description: SEO_META[key][lang].description,
        priority: "0.8",
        changefreq: "monthly",
      });
    });
  });

  (["privacy", "terms"] as const).forEach((legalKey) => {
    (["en", "es"] as Lang[]).forEach((lang) => {
      list.push({
        key: `${legalKey}-${lang}`,
        lang,
        path: LEGAL_PATHS[legalKey][lang],
        altPath: LEGAL_PATHS[legalKey][lang === "en" ? "es" : "en"],
        title: LEGAL_META[legalKey][lang].title,
        description: LEGAL_META[legalKey][lang].description,
        priority: "0.3",
        changefreq: "yearly",
      });
    });
  });

  return list;
}

export { SEO_META, LEGAL_META };
