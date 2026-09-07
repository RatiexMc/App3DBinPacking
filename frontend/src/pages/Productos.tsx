import { useEffect, useState } from "react";

import PageHeader from "../components/PageHeader";
import PageActions from "../components/PageActions";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import ProductoModal from "../components/ProductoModal";
import Notification from "../components/Notification";

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

  const [showNotification, setShowNotification] =
    useState(false);

  const [notificationMessage, setNotificationMessage] =
    useState("");

  const [notificationType, setNotificationType] =
    useState<"success" | "error">(
      "error"
    );






  // ==========================================
  // DATOS DE TABLA
  // ==========================================
  const [rows, setRows] = useState<any[]>([]);

  // Productos completos provenientes de la API
  const [productos, setProductos] = useState<any[]>([]);


  const [productosFiltrados, setProductosFiltrados] =
    useState<any[]>([]);

  // ==========================================
  // SELECCIÓN
  // ==========================================
  const [selectedRow, setSelectedRow] =
    useState<number | null>(null);

  const [selectedProductId, setSelectedProductId] =
    useState<number | null>(null);

  const [productoEditar, setProductoEditar] =
    useState<any | null>(null);

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
      setProductosFiltrados(datos);
      console.log(datos);
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







  useEffect(() => {
    const filtrados =
      productos.filter((producto) =>
        producto.codigo
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          ) ||
        producto.descripcion
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          )
      );

    setProductosFiltrados(filtrados);

    const filas = filtrados.map(
      (producto: any) => [
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
      ]
    );

    setRows(filas);
  }, [busqueda, productos]);





  // ==========================================
  // SELECCIONAR PRODUCTO
  // ==========================================
  const seleccionarProducto = (
    rowIndex: number
  ) => {

    setSelectedRow(rowIndex);

    const productoSeleccionado =
      productosFiltrados[rowIndex];
      
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




  const editarProducto = () => {

    if (selectedRow === null) {

      setNotificationType("error");

      setNotificationMessage(
        "Seleccione un producto primero"
      );

      setShowNotification(true);

      return;
    }

    setProductoEditar(
      productosFiltrados[selectedRow]
    );

    setShowProductoModal(true);
  };









  // ==========================================
  // ABRIR MODAL DE ELIMINACIÓN
  // ==========================================

  const borrarProducto = () => {

    if (selectedProductId === null) {

      setNotificationType("error");

      setNotificationMessage(
        "Seleccione un producto primero"
      );

      setShowNotification(true);

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
        onEdit={editarProducto}
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
        producto={productoEditar}
        onClose={() => {
          setProductoEditar(null);
          setShowProductoModal(false);
        }}
        onSuccess={() => {
          cargarProductos();
        }}
      />
      <Notification
        open={showNotification}
        message={notificationMessage}
        type={notificationType}
        onClose={() =>
          setShowNotification(false)
        }
      />
    </div>
  );
}

export default Productos;