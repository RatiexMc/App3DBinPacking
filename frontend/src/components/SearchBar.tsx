import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";

interface Props {
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
}

function SearchBar({ value, onChange }: Props) {
  const { darkMode } = useThemeContext();

  const currentColors = darkMode
    ? colors.dark
    : colors.light;

  return (
    <input
      type="text"
      placeholder="Buscar..."
      value={value}
      onChange={onChange}
      style={{
        padding: "10px 14px",

        minWidth: "260px",

        borderRadius: "8px",

        border: `1px solid ${currentColors.border}`,

        backgroundColor: currentColors.card,

        color: currentColors.textPrimary,

        outline: "none",

        fontSize: "14px",
      }}
    />
  );
}

export default SearchBar;