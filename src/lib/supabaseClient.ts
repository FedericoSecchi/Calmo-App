import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (import.meta.env.DEV && !isSupabaseConfigured) {
  console.warn(
    "Supabase not configured — authentication features disabled. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env."
  );
}

const isAutomated =
  typeof navigator !== "undefined" &&
  (navigator.webdriver ||
    /HeadlessChrome|Playwright|puppeteer|Chrome-Lighthouse/i.test(navigator.userAgent || ""));

const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: !isAutomated,
        autoRefreshToken: !isAutomated,
        detectSessionInUrl: !isAutomated,
      },
    })
  : createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

export { supabase };
