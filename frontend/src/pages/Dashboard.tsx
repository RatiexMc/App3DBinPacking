import DashboardCard from "../components/DashboardCard";

import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";

// Datos simulados (Mock Data)
// Más adelante estos valores vendrán desde PostgreSQL
const dashboardData = {
  nombreUsuario: "Junior",
  mensaje: "Bienvenido al sistema de optimización de carga",

  productosCargados: "34",
  optimizacionesRealizadas: "103",

  ultimaCarga: {
    fecha: "31/08/2026",
    usuario: "Walter Araujo",
    ocupacion: "87%",
  },
};

function Dashboard() {
  // Obtenemos el estado actual del tema
  const { darkMode } = useThemeContext();

  // Seleccionamos la paleta de colores adecuada
  const currentColors = darkMode
    ? colors.dark
    : colors.light;

  return (
    <div>
      {/* Título principal de la página */}
      <h1
        style={{
          color: currentColors.textPrimary,
        }}
      >
        Inicio
      </h1>

      {/* Saludo de bienvenida */}
      <div
        style={{
          marginTop: "30px",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            marginBottom: "10px",
            color: currentColors.textPrimary,
          }}
        >
          Hola {dashboardData.nombreUsuario} !
        </h1>

        <p
          style={{
            color: currentColors.textSecondary,
            fontSize: "20px",
          }}
        >
          {dashboardData.mensaje}
        </p>
      </div>

      {/* Contenedor general de tarjetas */}
      <div
        style={{
          display: "flex",
          gap: "30px",
          marginTop: "50px",
          flexWrap: "wrap",
        }}
      >
        {/* Tarjeta: Productos cargados */}
        <DashboardCard
          title="Productos Cargados"
          value={dashboardData.productosCargados}
        />

        {/* Tarjeta: Optimizaciones realizadas */}
        <DashboardCard
          title="Optimizaciones Realizadas"
          value={dashboardData.optimizacionesRealizadas}
        />

        {/* Tarjeta: Última carga realizada */}
        <div
          style={{
            backgroundColor: currentColors.card,

            border: `1px solid ${currentColors.border}`,

            color: currentColors.textPrimary,

            borderRadius: "10px",

            padding: "24px",

            minWidth: "280px",

            minHeight: "130px",

            // En modo oscuro eliminamos la sombra
            // para evitar contrastes extraños
            boxShadow: darkMode
              ? "none"
              : "0px 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          <h3>Última carga</h3>

          <p>
            {dashboardData.ultimaCarga.fecha}
          </p>

          <p>
            {dashboardData.ultimaCarga.usuario}
          </p>

          <p>
            {dashboardData.ultimaCarga.ocupacion}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;