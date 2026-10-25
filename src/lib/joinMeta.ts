import type { Lang } from "./i18n/types";

// Kept out of the main i18n routes bundle so the extra copy doesn't ride
// along into the landing page. Only Join.tsx (lazy chunk) imports this.
export const JOIN_META: Record<Lang, { title: string; description: string }> = {
  en: {
    title: "You've been invited to focus together | Calmo",
    description: "Open the shared focus room on Calmo. The timer stays in sync for everyone who joins the link.",
  },
  es: {
    title: "Te invitaron a enfocarte en equipo | Calmo",
    description: "Abre la sala compartida de foco en Calmo. El temporizador queda sincronizado para quienes abran el link.",
  },
};
