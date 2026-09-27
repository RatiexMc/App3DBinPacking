import type { CSSProperties, ReactNode } from "react";
import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";
import "../styles/optimizacion.css";
import "../styles/operaciones.css";

export default function OperationsPage({ children }: { children: ReactNode }) {
  const { darkMode } = useThemeContext();
  const c = darkMode ? colors.dark : colors.light;
  return <div className="opt-page ops-page" style={{
    "--opt-card": c.card, "--opt-text": c.textPrimary, "--opt-muted": c.textSecondary,
    "--opt-border": c.border, "--opt-soft": c.background,
    "--opt-accent": darkMode ? "#7dc5ff" : "#005b96", "--opt-tint": c.primaryLight,
  } as CSSProperties}>{children}</div>;
}
