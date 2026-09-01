import DashboardCard from "../components/DashboardCard";

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
  return (
    <div>
      {/* Título de la página */}
      <h1>Inicio</h1>

      {/* Saludo principal */}
      <div style={{ marginTop: "30px" }}>
        <h1
          style={{
            fontSize: "48px",
            marginBottom: "10px",
          }}
        >
          Hola {dashboardData.nombreUsuario} !
        </h1>

        <p
          style={{
            color: "#666",
            fontSize: "20px",
          }}
        >
          {dashboardData.mensaje}
        </p>
      </div>

      {/* Contenedor de tarjetas */}
      <div
        style={{
          display: "flex",
          gap: "30px",
          marginTop: "50px",
          flexWrap: "wrap",
        }}
      >
        {/* Tarjeta 1 */}
        <DashboardCard
          title="Productos Cargados"
          value={dashboardData.productosCargados}
        />

        {/* Tarjeta 2 */}
        <DashboardCard
          title="Optimizaciones Realizadas"
          value={dashboardData.optimizacionesRealizadas}
        />

        {/* Tarjeta 3 */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d9d9d9",
            borderRadius: "10px",
            padding: "24px",
            minWidth: "280px",
            minHeight: "130px",
            boxShadow: "0px 2px 5px rgba(0,0,0,0.05)",
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