import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import PageActions from "../components/PageActions";
import DataTable from "../components/DataTable";
import CamionModal from "../components/CamionModal";
import Notification from "../components/Notification";
import ConfirmDialog from "../components/ConfirmDialog";
function Camiones() {
  // Texto del buscador
  const [busqueda, setBusqueda] = useState("");
  // Filas de la tabla
  const [rows, setRows] = useState<any[]>([]);
  const [camiones, setCamiones] = useState<any[]>([]);

  const [camionesFiltrados, setCamionesFiltrados] =
    useState<any[]>([]);







  const [selectedRow, setSelectedRow] =
    useState<number | null>(null);
  const [selectedCamion, setSelectedCamion] =
    useState<any>(null);
  const [modalOpen, setModalOpen] =
    useState(false);
  const [camionEditar, setCamionEditar] =
    useState<any>(null);
  const [showNotification, setShowNotification] =
    useState(false);
  const [notificationMessage, setNotificationMessage] =
    useState("");
  const [notificationType, setNotificationType] =
    useState<"success" | "error">("error");
  const [showConfirmDelete, setShowConfirmDelete] =
    useState(false);
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
      setCamiones(datos);
      setCamionesFiltrados(datos);

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


  useEffect(() => {

    const filtrados =
      camiones.filter((camion) =>

        camion.placa
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          )

        ||

        camion.nombre_chofer
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          )

        ||

        camion.apellido_chofer
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          )

      );

    setCamionesFiltrados(filtrados);

    const filas = filtrados.map(
      (camion: any) => [
        camion.placa,
        `${camion.nombre_chofer} ${camion.apellido_chofer}`,
        camion.largo,
        camion.ancho,
        camion.alto,
        camion.peso_maximo,
      ]
    );

    setRows(filas);

  }, [busqueda, camiones]);




  const nuevoCamion = () => {
    setCamionEditar(null);
    setModalOpen(true);
  };
  const editarCamion = () => {
















    if (!selectedCamion) {
      setNotificationType("error");
      setNotificationMessage(
        "Seleccione un camión primero"
      );
      setShowNotification(true);
      return;
    }
    setCamionEditar(selectedCamion);
    setModalOpen(true);
  };


  const eliminarCamion = () => {

    if (!selectedCamion) {

      setNotificationType("error");

      setNotificationMessage(
        "Seleccione un camión primero"
      );

      setShowNotification(true);

      return;
    }

    setShowConfirmDelete(true);

  };


  const seleccionarCamion = (
    rowIndex: number
  ) => {

    setSelectedRow(rowIndex);

    const camionSeleccionado =
      camionesFiltrados[rowIndex];

    setSelectedCamion(
      camionSeleccionado
    );

  };









  const confirmarEliminacion = async () => {

    if (!selectedCamion) return;

    try {

      await fetch(
        `http://127.0.0.1:8000/camiones/${selectedCamion.id_camion}`,
        {
          method: "DELETE",
        }
      );

      setSelectedCamion(null);
      setSelectedRow(null);

      setShowConfirmDelete(false);

      setNotificationType("success");

      setNotificationMessage(
        "Camión eliminado correctamente"
      );

      setShowNotification(true);

      cargarCamiones();

    } catch (error) {

      console.error(error);

    }

  };

  return (
    <div>
      <PageHeader title="Camiones" />
      <PageActions
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        onAdd={nuevoCamion}
        onEdit={editarCamion}
        onDelete={eliminarCamion}
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
        selectedRow={selectedRow}
        onRowSelect={seleccionarCamion}
      />
      <CamionModal
        open={modalOpen}
        camion={camionEditar}
        onClose={() => {
          setCamionEditar(null);
          setModalOpen(false);
        }}
        onSuccess={() => {
          cargarCamiones();
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

      <ConfirmDialog
        open={showConfirmDelete}
        title="Eliminar Camión"
        message={`¿Desea eliminar el camión ${selectedCamion?.placa}?`}
        onConfirm={confirmarEliminacion}
        onCancel={() =>
          setShowConfirmDelete(false)
        }
      />







    </div>
  );
}
export default Camiones;