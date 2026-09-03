import PageHeader from "../components/PageHeader";
import DashboardCard from "../components/DashboardCard";
import Card from "../components/Card";

import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";

function Optimizacion() {
  // =========================
  // TEMA ACTUAL
  // =========================
  const { darkMode } = useThemeContext();

  const currentColors = darkMode
    ? colors.dark
    : colors.light;

  // =========================
  // DATOS SIMULADOS
  // =========================
  const resultado = {
    camion: "ABC-123",
    productos: 34,
    cajas: 220,
    ocupacion: "87%",

    volumenTotal: "999 m³",
    volumenUtilizado: "290 m³",

    cargados: 34,
    rechazados: 0,

    usuario: "Junior",
    fecha: "02/09/2026",
  };

  return (
    <div>
      {/* ========================= */}
      {/* TÍTULO */}
      {/* ========================= */}
      <PageHeader title="Optimización de Carga" />

      {/* ========================= */}
      {/* TARJETAS SUPERIORES */}
      {/* ========================= */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        <DashboardCard
          title="Camión"
          value={resultado.camion}
        />

        <DashboardCard
          title="Productos"
          value={String(resultado.productos)}
        />

        <DashboardCard
          title="Cajas"
          value={String(resultado.cajas)}
        />

        <DashboardCard
          title="Ocupación"
          value={resultado.ocupacion}
        />
      </div>

      {/* ========================= */}
      {/* VISUALIZACIÓN 3D */}
      {/* ========================= */}
      <Card>
        <div
          style={{
            minHeight: "450px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: currentColors.textSecondary,
          }}
        >
          <h2
            style={{
              color: currentColors.textPrimary,
              marginBottom: "15px",
            }}
          >
            Visualización 3D
          </h2>

          <p>
            El resultado de la optimización se mostrará aquí.
          </p>

          <p>
            (Preparado para integrar Three.js)
          </p>
        </div>
      </Card>

      {/* ========================= */}
      {/* INFORMACIÓN DETALLADA */}
      {/* ========================= */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "30px",
        }}
      >
        {/* ========================= */}
        {/* RESUMEN */}
        {/* ========================= */}

        <div
          style={{
            flex: 2,
            backgroundColor: currentColors.card,
            border: `1px solid ${currentColors.border}`,
            borderRadius: "10px",
            padding: "24px",
            color: currentColors.textPrimary,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "16px",
              color: currentColors.textPrimary,
            }}
          >
            Resumen de Optimización
          </h3>

          <p>
            Capacidad Total: {resultado.volumenTotal}
          </p>

          <p>
            Volumen Utilizado:{" "}
            {resultado.volumenUtilizado}
          </p>

          <p>
            Productos Cargados:{" "}
            {resultado.cargados}
          </p>

          <p>
            Productos Rechazados:{" "}
            {resultado.rechazados}
          </p>
        </div>

        {/* ========================= */}
        {/* INFORMACIÓN GENERAL */}
        {/* ========================= */}

        <div
          style={{
            flex: 1,
            backgroundColor: currentColors.card,
            border: `1px solid ${currentColors.border}`,
            borderRadius: "10px",
            padding: "24px",
            color: currentColors.textPrimary,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "16px",
              color: currentColors.textPrimary,
            }}
          >
            Información General
          </h3>

          <p>
            <strong>Usuario:</strong>{" "}
            {resultado.usuario}
          </p>

          <p>
            <strong>Fecha:</strong>{" "}
            {resultado.fecha}
          </p>

          <p>
            <strong>Camión:</strong>{" "}
            {resultado.camion}
          </p>

          <p>
            <strong>Estado:</strong>{" "}
            Optimizado
          </p>
        </div>
      </div>
    </div>
  );
}

export default Optimizacion;