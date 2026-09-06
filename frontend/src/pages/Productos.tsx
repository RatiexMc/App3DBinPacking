import { useEffect, useState } from "react";

import PageHeader from "../components/PageHeader";
import PageActions from "../components/PageActions";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import ProductoModal from "../components/ProductoModal";

function Productos() {

  // ==========================================
  // BÚSQUEDA
  // ==========================================
  const [busqueda, setBusqueda] = useState("");

  // ==========================================
  // MODALES
  // ==========================================
  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  const [showProductoModal, setShowProductoModal] =
    useState(false);

  // ==========================================
  // DATOS DE TABLA
  // ==========================================
  const [rows, setRows] = useState<any[]>([]);

  // Productos completos provenientes de la API
  const [productos, setProductos] = useState<any[]>([]);

  // ==========================================
  // SELECCIÓN
  // ==========================================
  const [selectedRow, setSelectedRow] =
    useState<number | null>(null);

  const [selectedProductId, setSelectedProductId] =
    useState<number | null>(null);

  // ==========================================
  // CARGAR PRODUCTOS AL INICIAR
  // ==========================================
  useEffect(() => {
    cargarProductos();
  }, []);

  // ==========================================
  // CONSULTAR PRODUCTOS DESDE FASTAPI
  // ==========================================
  const cargarProductos = async () => {

    try {

      const respuesta = await fetch(
        "http://127.0.0.1:8000/productos"
      );

      const datos = await respuesta.json();

      // Guardamos la lista completa
      setProductos(datos);

      // Adaptamos al formato de DataTable
      const filas = datos.map((producto: any) => [

        producto.codigo,

        producto.descripcion,

        producto.largo,

        producto.ancho,

        producto.alto,

        producto.apilable
          ? (
            <span className="badge-success">
              Sí
            </span>
          )
          : (
            <span className="badge-danger">
              No
            </span>
          ),

        producto.categoria,

      ]);

      setRows(filas);

    } catch (error) {

      console.error(
        "Error al cargar productos:",
        error
      );
    }
  };

  // ==========================================
  // SELECCIONAR PRODUCTO
  // ==========================================
  const seleccionarProducto = (
    rowIndex: number
  ) => {

    setSelectedRow(rowIndex);

    const productoSeleccionado =
      productos[rowIndex];

    setSelectedProductId(
      productoSeleccionado.id_producto
    );

    console.log(
      "Producto seleccionado:",
      productoSeleccionado
    );
  };

  // ==========================================
  // ABRIR MODAL DE ALTA
  // ==========================================
  const abrirModalProducto = () => {

    setShowProductoModal(true);
  };

  // ==========================================
  // ABRIR MODAL DE ELIMINACIÓN
  // ==========================================
  const borrarProducto = () => {

    if (!selectedProductId) {

      alert(
        "Seleccione un producto primero"
      );

      return;
    }

    setShowDeleteDialog(true);
  };

  // ==========================================
  // ELIMINAR PRODUCTO
  // ==========================================
  const confirmarEliminarProducto =
    async () => {

      try {

        await fetch(
          `http://127.0.0.1:8000/productos/${selectedProductId}`,
          {
            method: "DELETE",
          }
        );

        // Limpiar selección
        setSelectedRow(null);
        setSelectedProductId(null);

        // Cerrar modal
        setShowDeleteDialog(false);

        // Recargar tabla
        cargarProductos();

      } catch (error) {

        console.error(
          "Error eliminando producto:",
          error
        );
      }
    };

  // ==========================================
  // INTERFAZ
  // ==========================================
  return (
    <div>

      <PageHeader title="Productos" />


      <PageActions
        value={busqueda}
        onChange={(e) =>
          setBusqueda(
            e.target.value
          )
        }
        onAdd={abrirModalProducto}
        onDelete={borrarProducto}
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
        selectedRow={selectedRow}
        onRowSelect={seleccionarProducto}
      />

      {/* Modal Confirmar Eliminación */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Confirmar eliminación"
        message="¿Desea eliminar el producto seleccionado?"
        onConfirm={
          confirmarEliminarProducto
        }
        onCancel={() =>
          setShowDeleteDialog(false)
        }
      />

      {/* Modal Nuevo Producto */}
      <ProductoModal
        open={showProductoModal}
        onClose={() =>
          setShowProductoModal(false)
        }
        onSuccess={() => {
          cargarProductos();
        }}
      />

    </div>
  );
}

export default Productos;