import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useT } from "@/lib/i18n";
import { LEGAL_PATHS } from "@/lib/i18n/types";
import { LEGAL_META } from "@/lib/i18n/routes";
import { RESPONSIBLE_NAME, CONTACT_EMAIL } from "@/config/site";
import { trackPageView } from "@/lib/analytics";

const copy = {
  en: {
    title: "Terms of service",
    updated: "Last updated: 24 October 2026.",
    paragraphs: [
      "Calmo is a small side project offered as-is. By using it you agree to these terms.",
      "Not medical advice. Calmo offers reminders, mobility routines, and breathing patterns to accompany your workday. It does not replace medical diagnosis or treatment. For persistent pain, please see a qualified professional.",
      "Your responsibility. You use Calmo under your own responsibility. Stop any routine that causes pain or discomfort.",
      "Account. You're responsible for keeping your password safe. If you want to delete your account, go to Settings → Delete my account inside the app.",
      "No guarantees. The service is provided \"as is\", without any warranty of availability or fitness for a particular purpose.",
      "Changes. If these terms change in a material way, we'll update this page.",
    ],
  },
  es: {
    title: "Términos del servicio",
    updated: "Última actualización: 24 de octubre de 2026.",
    paragraphs: [
      "Calmo es un side project chico ofrecido tal cual. Al usarlo aceptás estos términos.",
      "No es consejo médico. Calmo ofrece recordatorios, rutinas de movilidad y patrones de respiración para acompañar tu día de trabajo. No reemplaza diagnóstico ni tratamiento médico. Ante dolor persistente, consultá a un profesional calificado.",
      "Bajo tu responsabilidad. Usás Calmo bajo tu responsabilidad. Si una rutina te genera dolor o molestia, detenela.",
      "Cuenta. Sos responsable de mantener tu contraseña a salvo. Para eliminar tu cuenta, entrá a Ajustes → Eliminar mi cuenta dentro de la app.",
      "Sin garantías. El servicio se ofrece \"tal cual\", sin garantía de disponibilidad ni de aptitud para un fin particular.",
      "Cambios. Si estos términos cambian de forma significativa, actualizaremos esta página.",
    ],
  },
} as const;

export default function Terms() {
  const { lang } = useT();
  const data = copy[lang];
  const meta = LEGAL_META.terms[lang];
  const path = LEGAL_PATHS.terms[lang];
  const altPath = LEGAL_PATHS.terms[lang === "en" ? "es" : "en"];
  usePageSEO({ title: meta.title, description: meta.description, path, altPath, lang });
  useEffect(() => {
    trackPageView();
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-16 max-w-3xl pt-24">
        <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-2">{data.title}</h1>
        <p className="text-sm text-muted-foreground mb-8">{data.updated}</p>
        <div className="space-y-5">
          {data.paragraphs.map((p, i) => (
            <p key={i} className="text-muted-foreground">
              {p}
            </p>
          ))}
          {CONTACT_EMAIL && (
            <p className="text-muted-foreground">
              {lang === "es" ? "Contacto: " : "Contact: "}
              {RESPONSIBLE_NAME ? `${RESPONSIBLE_NAME} · ` : ""}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline text-foreground">
                {CONTACT_EMAIL}
              </a>
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
