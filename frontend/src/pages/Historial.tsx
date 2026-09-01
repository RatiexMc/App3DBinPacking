import { useState } from "react";

import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import DataTable from "../components/DataTable";

function Historial() {
  const [busqueda, setBusqueda] = useState("");

  const rows = [
    [
      "31/08/2026",
      "Junior",
      "87%",
      1,
    ],

    [
      "30/08/2026",
      "Walter",
      "91%",
      2,
    ],
  ];

  return (
    <div>
      <PageHeader title="Historial" />

      <div style={{ marginBottom: "30px" }}>
        <SearchBar
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <DataTable
        headers={[
          "Fecha",
          "Usuario",
          "Ocupación",
          "Camiones",
        ]}
        rows={rows}
      />
    </div>
  );
}

export default Historial;