import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  resolvedTheme: "light",
});

const STORAGE_KEY = "app_theme";

function normalizeTheme(stored) {
  return stored === "dark" ? "dark" : "light";
}

export function applyThemeToDocument(theme) {
  const resolved = normalizeTheme(theme);
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() =>
    normalizeTheme(localStorage.getItem(STORAGE_KEY))
  );
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    normalizeTheme(localStorage.getItem(STORAGE_KEY))
  );

  const setTheme = (next) => {
    const value = next === "dark" ? "dark" : "light";
    setThemeState(value);
    localStorage.setItem(STORAGE_KEY, value);
    setResolvedTheme(applyThemeToDocument(value));
  };

  useEffect(() => {
    setResolvedTheme(applyThemeToDocument(theme));
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
