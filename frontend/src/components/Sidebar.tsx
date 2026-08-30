import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div
      style={{
        width: "250px",
        height: "100vh",
        backgroundColor: "#1f2937",
        color: "white",
        padding: "20px",
      }}
    >
      <h2>DARNEL PACKING</h2>

      <nav>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li><Link to="/" style={{ color: "white" }}>Inicio</Link></li>

          <li><Link to="/productos" style={{ color: "white" }}>Productos</Link></li>

          <li><Link to="/camiones" style={{ color: "white" }}>Camiones</Link></li>

          <li><Link to="/fotopicking" style={{ color: "white" }}>Foto Picking</Link></li>

          <li><Link to="/historial" style={{ color: "white" }}>Historial</Link></li>

          <li><Link to="/configuracion" style={{ color: "white" }}>Configuración</Link></li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;