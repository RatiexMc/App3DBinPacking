import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";

// Definimos las propiedades que recibirá cada tarjeta
interface DashboardCardProps {
  title: string;
  value: string;
}

// Componente reutilizable para mostrar métricas del dashboard
function DashboardCard({
  title,
  value,
}: DashboardCardProps) {
  // Obtenemos el estado actual del tema
  const { darkMode } = useThemeContext();

  // Seleccionamos la paleta de colores adecuada
  const currentColors = darkMode
    ? colors.dark
    : colors.light;

  return (
    <div
      style={{
        backgroundColor: currentColors.card,

        border: `1px solid ${currentColors.border}`,

        borderRadius: "10px",

        padding: "24px",

        minWidth: "280px",

        minHeight: "130px",

        color: currentColors.textPrimary,

        // Eliminamos la sombra en modo oscuro
        boxShadow: darkMode
          ? "none"
          : "0px 2px 5px rgba(0,0,0,0.05)",
      }}
    >
      {/* Título de la tarjeta */}
      <h3
        style={{
          margin: 0,

          marginBottom: "20px",

          fontSize: "18px",

          color: currentColors.textPrimary,
        }}
      >
        {title}
      </h3>

      {/* Valor principal */}
      <p
        style={{
          margin: 0,

          fontSize: "48px",

          fontWeight: "bold",

          color: currentColors.primary,
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default DashboardCard;