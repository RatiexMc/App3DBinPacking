import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";

interface Props {
  title: string;
}

function PageHeader({ title }: Props) {
  const { darkMode } = useThemeContext();

  const currentColors = darkMode
    ? colors.dark
    : colors.light;

  return (
    <h1
      style={{
        color: currentColors.textPrimary,

        fontSize: "32px",

        fontWeight: 700,

        marginBottom: "24px",

        letterSpacing: "-0.5px",
      }}
    >
      {title}
    </h1>
  );
}

export default PageHeader;