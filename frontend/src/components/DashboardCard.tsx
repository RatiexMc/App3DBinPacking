// Definimos las propiedades que recibirá cada tarjeta
interface DashboardCardProps {
  title: string;
  value: string;
}

// Componente reutilizable para mostrar métricas del dashboard
function DashboardCard({ title, value }: DashboardCardProps) {
  return (
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
      {/* Título de la tarjeta */}
      <h3
        style={{
          margin: 0,
          marginBottom: "20px",
          fontSize: "18px",
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
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default DashboardCard;