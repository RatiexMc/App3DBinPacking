import type { ReactNode } from "react";

import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";

interface Props {
  children: ReactNode;
}

function Card({ children }: Props) {
  const { darkMode } = useThemeContext();

  const currentColors = darkMode
    ? colors.dark
    : colors.light;

  return (
    <div
      style={{
        backgroundColor: currentColors.card,
        border: `1px solid ${currentColors.border}`,
        borderRadius: "12px",
        padding: "20px",
        color: currentColors.textPrimary,
      }}
    >
      {children}
    </div>
  );
}

export default Card;