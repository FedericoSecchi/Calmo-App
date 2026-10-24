import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

interface AuthResult {
  data: { user: User | null; session: Session | null } | null;
  error: AuthError | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  signInAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const GUEST_FLAG_KEY = "calmo_guest_mode";

function readGuestFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(GUEST_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

function writeGuestFlag(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (enabled) window.localStorage.setItem(GUEST_FLAG_KEY, "1");
    else window.localStorage.removeItem(GUEST_FLAG_KEY);
  } catch {
    /* ignore */
  }
}

const guestUserSingleton: User = {
  id: "guest",
  email: "guest@demo.local",
  aud: "authenticated",
  role: "authenticated",
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const initialGuest = readGuestFlag();
  const [user, setUser] = useState<User | null>(initialGuest ? guestUserSingleton : null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(initialGuest);

  const ensureProfile = async (userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data: existing, error: selectError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();
      if (selectError && selectError.code !== "PGRST116") return;
      if (!existing) {
        await supabase.from("profiles").insert({ id: userId });
      }
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;

    supabase.auth
      .getSession()
      .then(({ data: { session: current } }) => {
        if (current) {
          writeGuestFlag(false);
          setSession(current);
          setUser(current.user);
          setIsGuest(false);
        } else {
          setSession(null);
          setUser((prev) => (prev?.id === "guest" ? prev : null));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
        if (nextSession) {
          writeGuestFlag(false);
          setSession(nextSession);
          setUser(nextSession.user);
          setIsGuest(false);
          setLoading(false);
          if (event === "SIGNED_IN") {
            await ensureProfile(nextSession.user.id);
          }
        } else if (event === "SIGNED_OUT") {
          writeGuestFlag(false);
          setSession(null);
          setUser(null);
          setIsGuest(false);
          setLoading(false);
        } else {
          setLoading(false);
        }
      });
      subscription = sub;
    } catch {
      setLoading(false);
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { data: null, error: { message: "Supabase is not configured", name: "ConfigurationError" } as AuthError };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data?.session && !error) {
      writeGuestFlag(false);
      setSession(data.session);
      setUser(data.session.user);
      setIsGuest(false);
      setLoading(false);
    }
    return { data, error };
  };

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { data: null, error: { message: "Supabase is not configured", name: "ConfigurationError" } as AuthError };
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (data?.session && !error) {
      writeGuestFlag(false);
      setSession(data.session);
      setUser(data.session.user);
      setIsGuest(false);
      setLoading(false);
      await ensureProfile(data.session.user.id);
    }
    return { data, error };
  };

  const signOut = async () => {
    if (isGuest) {
      writeGuestFlag(false);
      setUser(null);
      setSession(null);
      setIsGuest(false);
      setLoading(false);
      return;
    }
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        /* best-effort — the session will expire on its own */
      }
    }
    setSession(null);
    setUser(null);
    setIsGuest(false);
    setLoading(false);
  };

  const signInAsGuest = () => {
    writeGuestFlag(true);
    setUser(guestUserSingleton);
    setSession(null);
    setIsGuest(true);
    setLoading(false);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isGuest,
    signIn,
    signUp,
    signOut,
    signInAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
