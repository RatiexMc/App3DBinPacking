import { useEffect, useState } from "react";

import PageHeader from "../components/PageHeader";
import PageActions from "../components/PageActions";
import DataTable from "../components/DataTable";

function Camiones() {
  // Texto del buscador
  const [busqueda, setBusqueda] = useState("");

  // Filas de la tabla
  const [rows, setRows] = useState<any[]>([]);

  // Cargar datos al abrir la pantalla
  useEffect(() => {
    cargarCamiones();
  }, []);

  // Consulta a FastAPI
  const cargarCamiones = async () => {
    try {
      const respuesta = await fetch(
        "http://127.0.0.1:8000/camiones"
      );

      const datos = await respuesta.json();

      const filas = datos.map((camion: any) => [
        camion.placa,
        `${camion.nombre_chofer} ${camion.apellido_chofer}`,
        camion.largo,
        camion.ancho,
        camion.alto,
        camion.peso_maximo,
      ]);

      setRows(filas);

    } catch (error) {
      console.error(
        "Error al cargar camiones:",
        error
      );
    }
  };

  return (
    <div>
      <PageHeader title="Camiones" />

      <PageActions
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <DataTable
        headers={[
          "Placa",
          "Chofer",
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