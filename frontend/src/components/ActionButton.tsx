import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";

interface Props {
  text: string;

  // Función opcional que se ejecutará al hacer click
  onClick?: () => void;
}

function ActionButton({
  text,
  onClick,
}: Props) {
  const { darkMode } = useThemeContext();

  const currentColors = darkMode
    ? colors.dark
    : colors.light;

  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: currentColors.primary,

        color: "#ffffff",

        border: "none",

        borderRadius: "8px",

        padding: "10px 18px",

        cursor: "pointer",

        fontWeight: 600,

        transition: "all 0.2s ease",
      }}
    >
      {text}
    </button>
  );
}

export default ActionButton;