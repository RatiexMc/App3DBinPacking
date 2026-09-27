import { createContext, useContext } from "react";
export const ThemeContext = createContext<{ darkMode: boolean; toggleTheme: () => void } | null>(null);
export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useThemeContext debe usarse dentro de ThemeProvider");
  return context;
}
