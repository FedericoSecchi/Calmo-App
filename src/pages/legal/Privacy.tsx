import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useT } from "@/lib/i18n";
import { LEGAL_PATHS } from "@/lib/i18n/types";
import { RESPONSIBLE_NAME, CONTACT_EMAIL } from "@/config/site";
import { LEGAL_META } from "@/lib/i18n/routes";
import { trackPageView } from "@/lib/analytics";

const copy = {
  en: {
    title: "Privacy policy",
    updated: "Last updated: 24 October 2026.",
    paragraphs: [
      "Calmo was built with the opposite of surveillance in mind. This page describes what we collect, where it lives, and how to delete it.",
      "Account. If you create an account, we store your email and an encrypted password at Supabase. That's enough to let you sign in. There is no profile data beyond this.",
      "App data on the server (only if you sign in). Breaks you've taken, glasses of water logged, manual break adjustments, exercises you completed, and your reminder settings. All of this lives in Supabase (European Union, Ireland), is linked to your account, and is covered by row-level security policies that only allow you to read and write your own rows.",
      "Pain log stays on your device. Pain entries are saved in your browser's localStorage. They never leave this device. If you clear your browser data, they go with it.",
      "Anonymous analytics. We record a small set of events (page views, sign-ups, start of a focus block, waitlist signups and similar) with no user id, no IP address, no cookie and no device identifier. A random session id lives in memory for the current tab only.",
      "No ads, no third-party trackers, no cookie banner because we don't use cookies that need one. We use GitHub Pages to serve the site and Supabase to store the account data. That's the entire list of providers.",
      "Delete your account. Settings → Delete my account. That calls a server function that removes your Supabase user and cascades to every piece of data linked to it. The action is immediate and cannot be undone.",
      "Delete local data. Settings → Clear local data wipes anything Calmo stored in your browser (including the pain log).",
    ],
  },
  es: {
    title: "Política de privacidad",
    updated: "Última actualización: 24 de octubre de 2026.",
    paragraphs: [
      "Calmo se construyó con lo opuesto a la vigilancia en mente. Esta página describe qué recopila, dónde vive y cómo borrarlo.",
      "Cuenta. Si creas una cuenta, guardamos tu email y una contraseña encriptada en Supabase. Alcanza para iniciar sesión. No hay más datos de perfil que eso.",
      "Datos de la app en el servidor (solo si inicias sesión). Pausas realizadas, vasos de agua registrados, ajustes manuales de pausas, ejercicios completados y tus ajustes de recordatorios. Todo esto vive en Supabase (Unión Europea, Irlanda), está asociado a tu cuenta y protegido por políticas de row-level security que solo te permiten leer y escribir tus propias filas.",
      "El registro de dolor queda en tu dispositivo. Se guarda en el localStorage del navegador. Nunca sale de este dispositivo. Si borras los datos del navegador, se van con él.",
      "Analítica anónima. Registramos un conjunto reducido de eventos (vistas de página, altas, inicio de un bloque de foco, altas a la lista de espera y similares) sin user_id, sin dirección IP, sin cookies y sin identificador de dispositivo. Un session id aleatorio vive en memoria solo mientras la pestaña está abierta.",
      "Sin anuncios, sin rastreadores de terceros, sin banner de cookies porque no usamos cookies que requieran uno. Usamos GitHub Pages para servir el sitio y Supabase para guardar los datos de cuenta. Esa es la lista completa de proveedores.",
      "Eliminar tu cuenta. Ajustes → Eliminar mi cuenta. Eso llama a una función del servidor que borra tu usuario en Supabase y arrastra en cascada todos los datos asociados. Es inmediato y no se puede deshacer.",
      "Borrar los datos locales. Ajustes → Borrar mis datos locales elimina todo lo que Calmo guardó en tu navegador (incluido el registro de dolor).",
    ],
  },
} as const;

export default function Privacy() {
  const { lang } = useT();
  const data = copy[lang];
  const meta = LEGAL_META.privacy[lang];
  const path = LEGAL_PATHS.privacy[lang];
  const altPath = LEGAL_PATHS.privacy[lang === "en" ? "es" : "en"];
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
