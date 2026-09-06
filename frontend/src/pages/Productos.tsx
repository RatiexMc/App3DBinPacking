import { useEffect, useState } from "react";

import PageHeader from "../components/PageHeader";
import PageActions from "../components/PageActions";
import DataTable from "../components/DataTable";

function Productos() {
  // Estado para el texto de búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Estado donde guardaremos las filas provenientes de la API
  const [rows, setRows] = useState<any[]>([]);

  // Se ejecuta una sola vez al abrir la página
  useEffect(() => {
    cargarProductos();
  }, []);

  // Función que consulta nuestra API FastAPI
  const cargarProductos = async () => {
    try {
      // Llamada al endpoint que ya creamos
      const respuesta = await fetch(
        "http://127.0.0.1:8000/productos"
      );

      // Convertir la respuesta JSON a objeto JavaScript
      const datos = await respuesta.json();

      // Adaptamos los datos al formato que usa DataTable
      const filas = datos.map((producto: any) => [
        producto.codigo,
        producto.descripcion,
        producto.largo,
        producto.ancho,
        producto.alto,

        producto.apilable ? (
          <span className="badge-success">Sí</span>
        ) : (
          <span className="badge-danger">No</span>
        ),

        producto.categoria,
      ]);

      // Guardamos las filas en el estado
      setRows(filas);
    } catch (error) {
      console.error(
        "Error al cargar productos:",
        error
      );
    }
  };

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