import { useState } from "react";

import PageHeader from "../components/PageHeader";
import PageActions from "../components/PageActions";
import DataTable from "../components/DataTable";

function Productos() {
  const [busqueda, setBusqueda] = useState("");

  const rows = [
    [
      "FIG-123",
      "Tortera",
      10,
      10,
      10,
      <span className="badge-success">Sí</span>,
      "4",
    ],
    [
      "FIG-124",
      "Vaso 500ml",
      12,
      12,
      18,
      <span className="badge-success">Sí</span>,
      "2",
    ],
  ];

  return (
    <div>
      <PageHeader title="Productos" />

      <PageActions
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <DataTable
        headers={[
          "Código",
          "Descripción",
          "Largo (cm)",
          "Ancho (cm)",
          "Alto (cm)",
          "Apilable",
          "Categoría",
        ]}
        rows={rows}
      />
    </div>
  );
}

export default Productos;