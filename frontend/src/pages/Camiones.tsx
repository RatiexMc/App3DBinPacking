import { useState } from "react";

import PageHeader from "../components/PageHeader";
import PageActions from "../components/PageActions";
import DataTable from "../components/DataTable";

function Camiones() {
  const [busqueda, setBusqueda] = useState("");

  const rows = [
    [
      "CAM-001",
      "Mercedes",
      1360,
      245,
      260,
      10000,
    ],

    [
      "CAM-002",
      "Scania",
      1400,
      250,
      270,
      12000,
    ],
  ];

  return (
    <div>
      <PageHeader title="Camiones" />

      <PageActions
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <DataTable
        headers={[
          "Código",
          "Modelo",
          "Largo",
          "Ancho",
          "Alto",
          "Peso Máximo",
        ]}
        rows={rows}
      />
    </div>
  );
}

export default Camiones;