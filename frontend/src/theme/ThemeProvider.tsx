import { useEffect, type ReactNode } from "react";
import { ThemeContext } from "./ThemeContext";
import { guardarPreferencias, usePreferencias } from "../context/preferenciasStore";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { oscuro } = usePreferencias();
  useEffect(() => { document.documentElement.dataset.theme = oscuro ? "dark" : "light"; }, [oscuro]);
  return <ThemeContext.Provider value={{ darkMode: oscuro, toggleTheme: () => { guardarPreferencias({ oscuro: !oscuro }); } }}>{children}</ThemeContext.Provider>;
}
