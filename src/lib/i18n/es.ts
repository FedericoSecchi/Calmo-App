import type { Dict } from "./en";

export const es: Dict = {
  meta: {
    siteName: "Calmo",
    tagline: "Hábitos saludables para trabajar con la computadora, sin dolor.",
    homeTitle: "Calmo — Hábitos saludables para trabajar con la computadora",
    homeDescription:
      "Un acompañante tranquilo para tu día de trabajo: temporizador de foco, pausas de pantalla, movilidad, respiración y rachas. Sin anuncios ni cookies.",
    switchLanguage: "English",
  },
  nav: {
    features: "Funciones",
    howItWorks: "Cómo funciona",
    pricing: "Precios",
    signIn: "Entrar",
    getStarted: "Empezar",
    openApp: "Abrir app",
  },
  hero: {
    badge: "Para quienes trabajan en la computadora",
    titlePart1: "Hábitos saludables para trabajar con la computadora,",
    titleHighlight: "sin dolor",
    subtitle:
      "Un acompañante tranquilo para tu día de trabajo: temporizador de foco, pausas de pantalla, movilidad y respiración. Sin cookies, sin anuncios, sin rastreo.",
    primaryCta: "Empezar gratis",
    secondaryCta: "Ver cómo funciona",
    microproof: "Sin tarjeta de crédito · Instalable como app",
  },
  features: {
    title: "Todo lo que necesitás para",
    titleHighlight: "trabajar mejor",
    subtitle: "Herramientas simples y potentes para cuidar tu cuerpo mientras trabajás.",
    items: [
      {
        title: "Recordatorios suaves",
        description: "Pausas que se adaptan a tu ritmo, con posponer si estás en medio de algo.",
      },
      {
        title: "Ejercicios de movilidad",
        description: "Rutinas cortas para cuello, espalda y muñecas. 2–5 minutos, guiadas y en silencio.",
      },
      {
        title: "Registro de dolor en tu dispositivo",
        description: "Seguí cómo se siente tu cuerpo en el tiempo. Esos datos nunca salen de tu navegador.",
      },
      {
        title: "Rachas diarias",
        description: "Construí el hábito día a día. Progreso simple, sin presión.",
      },
      {
        title: "Temporizador de foco",
        description: "Trabajá en bloques y recibí un empujón para despegar la vista de la pantalla.",
      },
      {
        title: "Respiración guiada",
        description: "Patrones breves (4-7-8, respiración cuadrada) para bajar un cambio entre tareas.",
      },
    ],
  },
  how: {
    title: "Empezá en",
    titleHighlight: "tres pasos simples",
    subtitle: "Sin configuraciones. Sin formularios. Solo bienestar.",
    steps: [
      {
        number: "01",
        title: "Creá tu cuenta",
        description: "Email y contraseña, nada más. O probala como invitado sin cuenta.",
      },
      {
        number: "02",
        title: "Elegí tu ritmo",
        description: "Decidí cada cuánto querés pausas. Lo podés cambiar cuando quieras.",
      },
      {
        number: "03",
        title: "Construí el hábito",
        description: "Seguí los recordatorios, hacé una rutina corta y mantené tu racha.",
      },
    ],
  },
  pricing: {
    title: "Planes simples,",
    titleHighlight: "sin sorpresas",
    subtitle: "Empezá gratis. Pro está en camino.",
    free: {
      name: "Gratis",
      price: "US$ 0",
      period: "para siempre",
      description: "Todo lo necesario para empezar.",
      features: [
        "Temporizador de foco y pausas de pantalla",
        "Biblioteca de ejercicios de movilidad",
        "Patrones de respiración guiada",
        "Registro de dolor (en tu dispositivo)",
        "Agua y rachas diarias",
      ],
      cta: "Empezar gratis",
    },
    pro: {
      badge: "En desarrollo",
      name: "Pro",
      price: "US$ 4,99",
      period: "/mes",
      description: "Features planeadas: anotate en la lista y te avisamos.",
      features: [
        "Recordatorios personalizados ilimitados",
        "Biblioteca de ejercicios ampliada",
        "Estadísticas de progreso",
      ],
      waitlistTitle: "Sumate a la lista de espera Pro",
      waitlistSubtitle: "Un email. Te escribimos cuando esté listo.",
      emailPlaceholder: "vos@ejemplo.com",
      submit: "Avisame",
      submitting: "Guardando…",
      success: "Estás en la lista, gracias.",
      invalid: "Ingresá un email válido.",
    },
  },
  footer: {
    tagline: "Hábitos saludables para trabajar con la computadora, sin dolor.",
    privacy: "Privacidad",
    terms: "Términos",
    disclaimer: "Calmo no reemplaza diagnóstico ni tratamiento médico.",
    designedBy: "Diseñado por",
  },
  auth: {
    titleSignIn: "Bienvenido de vuelta",
    titleSignUp: "Creá tu cuenta",
    subtitleSignIn: "Ingresá tus datos para continuar.",
    subtitleSignUp: "Empezá a cuidar tu cuerpo frente al teclado.",
    email: "Email",
    password: "Contraseña",
    passwordHint: "Al menos 6 caracteres.",
    submitSignIn: "Entrar",
    submitSignUp: "Crear cuenta",
    tryGuest: "Probar sin registrarse",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    switchToSignUp: "¿No tenés cuenta?",
    switchToSignUpAction: "Registrate",
    switchToSignIn: "¿Ya tenés cuenta?",
    switchToSignInAction: "Entrar",
    legalIntro: "Al continuar aceptás nuestros",
    legalAnd: "y",
    errors: {
      emailInUse: "Este email ya está registrado. Probá entrar en lugar de registrarte.",
      invalidCredentials: "El email o la contraseña no son correctos.",
      weakPassword: "La contraseña debe tener al menos 6 caracteres.",
      invalidEmail: "Ese no parece un email válido.",
      unknown: "Algo salió mal. Probá de nuevo.",
    },
    toasts: {
      welcomeBack: "Bienvenido de vuelta.",
      accountCreated: "Cuenta creada. ¡Bienvenido!",
      guestMode: "Estás en modo invitado. Los datos quedan en este dispositivo.",
    },
  },
  app: {
    nav: {
      dashboard: "Hoy",
      exercises: "Ejercicios",
      reminders: "Recordatorios",
      pain: "Dolor",
      settings: "Ajustes",
    },
    settings: {
      title: "Ajustes",
      guestMode: "Modo invitado",
      sound: "Sonidos del timer",
      sounds: {
        on: "Activado",
        off: "Desactivado",
      },
      darkMode: "Modo oscuro",
      language: "Idioma",
      languageOptions: {
        en: "Inglés",
        es: "Español",
      },
      disclaimer:
        "Calmo no reemplaza diagnóstico ni tratamiento médico. Consultá a un profesional ante problemas persistentes.",
      signOut: "Cerrar sesión",
      deleteLocal: "Borrar mis datos locales",
      deleteLocalConfirm: "¿Borrar todos los datos de Calmo guardados en este dispositivo? No se puede deshacer.",
      deleteLocalDone: "Datos locales borrados.",
      deleteAccount: "Eliminar mi cuenta",
      deleteAccountConfirm:
        "¿Eliminar tu cuenta y todos los datos asociados en el servidor? No se puede deshacer.",
      deleteAccountDone: "Cuenta eliminada.",
    },
    pain: {
      localNote: "El registro de dolor queda solo en este dispositivo.",
    },
  },
  waitlist: {
    sources: {
      pricing: "pricing",
    },
  },
};
