import { useState, useEffect } from "react";

type Query = "sm" | "md" | "lg" | "xl" | "2xl" | "dark" | "light" | "motion" | "no-motion" | "(prefers-reduced-motion: reduce)";

const breakpointMap: Record<string, string> = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
  dark: "(prefers-color-scheme: dark)",
  light: "(prefers-color-scheme: light)",
  motion: "(prefers-reduced-motion: no-preference)",
  "no-motion": "(prefers-reduced-motion: reduce)",
};

export function useMediaQuery(query: Query | string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQueryString = breakpointMap[query] || query;
    const mediaQuery = window.matchMedia(mediaQueryString);

    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return !useMediaQuery("md");
}

export function useIsTablet(): boolean {
  const isMd = useMediaQuery("md");
  const isLg = useMediaQuery("lg");
  return isMd && !isLg;
}

export function useIsDesktop(): boolean {
  return useMediaQuery("lg");
}

export function usePrefersDarkMode(): boolean {
  return useMediaQuery("dark");
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("no-motion");
}
