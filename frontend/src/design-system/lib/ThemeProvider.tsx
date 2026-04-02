import type { ReactNode } from "react";
import { createContext, useContext, useState, useEffect } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: "dark" | "light";
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

interface DesignSystemProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function DesignSystemProvider({
  children,
  defaultTheme = "dark",
}: DesignSystemProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<"dark" | "light">(getSystemTheme());

  useEffect(() => {
    const systemTheme = getSystemTheme();
    const effective = theme === "system" ? systemTheme : theme;
    setEffectiveTheme(effective);

    document.documentElement.style.colorScheme = effective;
    document.documentElement.setAttribute("data-theme", effective);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        const newTheme = getSystemTheme();
        setEffectiveTheme(newTheme);
        document.documentElement.style.colorScheme = newTheme;
      }
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a DesignSystemProvider");
  }
  return context;
}
