export const en = {
  meta: {
    siteName: "Calmo",
    tagline: "Healthy habits for computer work, without the pain.",
    homeTitle: "Calmo — Healthy habits for computer work",
    homeDescription:
      "A gentle companion for your workday: focus timer, screen breaks, mobility exercises, breathing and daily streaks. No ads, no cookies.",
    switchLanguage: "Español",
  },
  nav: {
    features: "Features",
    howItWorks: "How it works",
    pricing: "Pricing",
    signIn: "Sign in",
    getStarted: "Get started",
    openApp: "Open app",
  },
  hero: {
    badge: "For people who work at a computer",
    titlePart1: "Healthy habits for computer work,",
    titleHighlight: "without the pain",
    subtitle:
      "A quiet companion for your workday: focus timer, screen breaks, mobility and breathing. No cookies, no ads, no tracking.",
    primaryCta: "Start free",
    secondaryCta: "See how it works",
    microproof: "No credit card · Installable as an app",
  },
  features: {
    title: "Everything you need to",
    titleHighlight: "work better",
    subtitle: "Small, powerful tools to look after your body while you work.",
    items: [
      {
        title: "Gentle reminders",
        description: "Breaks that match your flow, with a snooze if you're in the middle of something.",
      },
      {
        title: "Mobility exercises",
        description: "Short routines for neck, back and wrists. 2–5 minutes, guided and silent.",
      },
      {
        title: "Pain log on your device",
        description: "Track how your body feels over time. Your pain data never leaves your browser.",
      },
      {
        title: "Daily streaks",
        description: "Build the habit day by day. Simple progress, nothing to grind.",
      },
      {
        title: "Focus timer",
        description: "Work in focused blocks and get a nudge to look away from the screen.",
      },
      {
        title: "Guided breathing",
        description: "A few quiet patterns (4-7-8, box breathing) to downshift between tasks.",
      },
    ],
  },
  how: {
    title: "Start in",
    titleHighlight: "three simple steps",
    subtitle: "No complicated setup. No forms. Just well-being.",
    steps: [
      {
        number: "01",
        title: "Create your account",
        description: "Email and password only. Or try it as a guest with no account.",
      },
      {
        number: "02",
        title: "Set your rhythm",
        description: "Pick how often you'd like breaks. You can change it any time.",
      },
      {
        number: "03",
        title: "Build the habit",
        description: "Follow the small nudges, do a short routine, keep your streak alive.",
      },
    ],
  },
  pricing: {
    title: "Simple plans,",
    titleHighlight: "no surprises",
    subtitle: "Start free. Pro is on the way.",
    free: {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Everything you need to get started.",
      features: [
        "Focus timer and screen breaks",
        "Mobility exercises library",
        "Guided breathing patterns",
        "Pain log (saved on your device)",
        "Water and daily streaks",
      ],
      cta: "Start free",
    },
    pro: {
      badge: "In development",
      name: "Pro",
      price: "$4.99",
      period: "/month",
      description: "Planned features — join the waitlist and we'll let you know.",
      features: [
        "Unlimited custom reminders",
        "Expanded exercise library",
        "Progress statistics",
      ],
      waitlistTitle: "Join the Pro waitlist",
      waitlistSubtitle: "One email. We'll write when it's ready.",
      emailPlaceholder: "you@example.com",
      submit: "Notify me",
      submitting: "Saving…",
      success: "You're on the list — thanks!",
      invalid: "Please enter a valid email.",
    },
  },
  footer: {
    tagline: "Healthy habits for computer work, without the pain.",
    privacy: "Privacy",
    terms: "Terms",
    disclaimer: "Calmo is not a substitute for medical diagnosis or treatment.",
    designedBy: "Designed by",
  },
  auth: {
    titleSignIn: "Welcome back",
    titleSignUp: "Create your account",
    subtitleSignIn: "Enter your details to continue.",
    subtitleSignUp: "Start taking better care of your body at the keyboard.",
    email: "Email",
    password: "Password",
    passwordHint: "At least 6 characters.",
    submitSignIn: "Sign in",
    submitSignUp: "Create account",
    tryGuest: "Try without signing up",
    showPassword: "Show password",
    hidePassword: "Hide password",
    switchToSignUp: "Don't have an account?",
    switchToSignUpAction: "Sign up",
    switchToSignIn: "Already have an account?",
    switchToSignInAction: "Sign in",
    legalIntro: "By continuing you agree to our",
    legalAnd: "and",
    errors: {
      emailInUse: "This email is already registered. Try signing in.",
      invalidCredentials: "Email or password is incorrect.",
      weakPassword: "Password must be at least 6 characters.",
      invalidEmail: "That doesn't look like a valid email.",
      unknown: "Something went wrong. Please try again.",
    },
    toasts: {
      welcomeBack: "Welcome back.",
      accountCreated: "Account created. Welcome!",
      guestMode: "You're in guest mode. Your data stays on this device.",
    },
  },
  app: {
    nav: {
      dashboard: "Today",
      exercises: "Exercises",
      reminders: "Reminders",
      pain: "Pain",
      settings: "Settings",
    },
    settings: {
      title: "Settings",
      guestMode: "Guest mode",
      sound: "Timer sounds",
      sounds: {
        on: "On",
        off: "Off",
      },
      darkMode: "Dark mode",
      language: "Language",
      languageOptions: {
        en: "English",
        es: "Spanish",
      },
      disclaimer:
        "Calmo is not a substitute for medical diagnosis or treatment. Please see a professional for persistent problems.",
      signOut: "Sign out",
      deleteLocal: "Clear local data",
      deleteLocalConfirm: "Clear all Calmo data stored on this device? This cannot be undone.",
      deleteLocalDone: "Local data cleared.",
      deleteAccount: "Delete my account",
      deleteAccountConfirm:
        "Delete your account and every piece of data linked to it on the server? This cannot be undone.",
      deleteAccountDone: "Account deleted.",
    },
    pain: {
      localNote: "Your pain log is saved only on this device.",
    },
  },
  waitlist: {
    sources: {
      pricing: "pricing",
    },
  },
} as const;

export type Dict = typeof en;
