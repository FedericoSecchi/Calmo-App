import { useCallback, useEffect, useState } from "react";
import type { GardenTheme } from "@/lib/garden/engine";

const THEME_KEY = "calmo_garden_theme";

const normalize = (value: string | null): GardenTheme => {
  if (value === "zen" || value === "sky" || value === "companion") return value;
  return "zen";
};

export function useGardenTheme() {
  const [theme, setThemeState] = useState<GardenTheme>(() => {
    if (typeof window === "undefined") return "zen";
    try {
      return normalize(window.localStorage.getItem(THEME_KEY));
    } catch {
      return "zen";
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((next: GardenTheme) => {
    setThemeState(normalize(next));
  }, []);

  return { theme, setTheme };
}
