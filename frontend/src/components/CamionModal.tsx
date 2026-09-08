import {
  useState,
  useEffect,
  type CSSProperties,
} from "react";

import Notification from "./Notification";
import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";
interface CamionModalProps {
  open: boolean;
  camion?: any;
  onClose: () => void;
  onSuccess: () => void;
}

function CamionModal({
  open,
  camion,
  onClose,
  onSuccess,
}: CamionModalProps) {

  const { darkMode } = useThemeContext();

  const currentColors =
    darkMode
      ? colors.dark
      : colors.light;








  const [placa, setPlaca] = useState("");
  const [nombreChofer, setNombreChofer] = useState("");
  const [apellidoChofer, setApellidoChofer] = useState("");
  const [largo, setLargo] = useState("");
  const [ancho, setAncho] = useState("");
  const [alto, setAlto] = useState("");
  const [pesoMaximo, setPesoMaximo] = useState("");

  const [showNotification, setShowNotification] =
    useState(false);

  const [notificationMessage, setNotificationMessage] =
    useState("");

  const [notificationType, setNotificationType] =
    useState<"success" | "error">("success");


  useEffect(() => {

    if (camion) {

      setPlaca(camion.placa || "");

      setNombreChofer(
        camion.nombre_chofer || ""
      );

      setApellidoChofer(
        camion.apellido_chofer || ""
      );

      setLargo(
        camion.largo?.toString() || ""
      );

      setAncho(
        camion.ancho?.toString() || ""
      );

      setAlto(
        camion.alto?.toString() || ""
      );

      setPesoMaximo(
        camion.peso_maximo?.toString() || ""
      );

    } else {

      setPlaca("");
      setNombreChofer("");
      setApellidoChofer("");
      setLargo("");
      setAncho("");
      setAlto("");
      setPesoMaximo("");

    }

  }, [camion]);


  const guardarCamion = async () => {

    if (!placa.trim()) {

      setNotificationType("error");

      setNotificationMessage(
        "Debe ingresar una placa."
      );

      setShowNotification(true);

      return;
    }

    try {

      const url = camion
        ? `http://127.0.0.1:8000/camiones/${camion.id_camion}`
        : "http://127.0.0.1:8000/camiones";

      const metodo = camion
        ? "PUT"
        : "POST";

      const respuesta = await fetch(
        url,
        {
          method: metodo,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            placa,
            nombre_chofer: nombreChofer,
            apellido_chofer: apellidoChofer,
            largo: Number(largo),
            ancho: Number(ancho),
            alto: Number(alto),
            peso_maximo: Number(pesoMaximo),
          }),
        }
      );

      const datos = await respuesta.json();

      if (datos.error) {

        setNotificationType("error");

        setNotificationMessage(
          datos.error
        );

        setShowNotification(true);

        return;
      }

      setNotificationType("success");

      setNotificationMessage(
        camion
          ? "Camión actualizado correctamente."
          : "Camión creado correctamente."
      );

      setShowNotification(true);

      onSuccess();

      setTimeout(() => {

        onClose();

        setShowNotification(false);

      }, 1000);

    } catch (error) {

      console.error(error);

    }

  };



  const inputStyle: CSSProperties = {
    opacity: 1,
    padding: "10px",
    borderRadius: "8px",
    border: `1px solid ${currentColors.border}`,
    backgroundColor: currentColors.card,
    color: currentColors.textPrimary,
    width: "100%",
    boxSizing: "border-box",
  };


  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: currentColors.card,
          width: "650px",
          maxWidth: "90vw",
          padding: "25px",
          borderRadius: "12px",
          border: `1px solid ${currentColors.border}`,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: currentColors.textPrimary,
          }}
        >
          {camion
            ? "Editar Camión"
            : "Nuevo Camión"}
        </h2>

        <p
          style={{
            marginTop: "-5px",
            marginBottom: "20px",
            color: currentColors.textSecondary,
          }}
        >
          {camion
            ? "Modifique los datos del camión."
            : "Complete los datos del camión."}
        </p>


        <div
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          <input
            placeholder="Placa"
            value={placa}
            onChange={(e) =>
              setPlaca(e.target.value)
            }
            style={inputStyle}
          />

          <input
            placeholder="Nombre del chofer"
            value={nombreChofer}
            onChange={(e) =>
              setNombreChofer(
                e.target.value
              )
            }
            style={inputStyle}
          />

          <input
            placeholder="Apellido del chofer"
            value={apellidoChofer}
            onChange={(e) =>
              setApellidoChofer(
                e.target.value
              )
            }
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="Largo"
            value={largo}
            onChange={(e) =>
              setLargo(e.target.value)
            }
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="Ancho"
            value={ancho}
            onChange={(e) =>
              setAncho(e.target.value)
            }
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="Alto"
            value={alto}
            onChange={(e) =>
              setAlto(e.target.value)
            }
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="Peso Máximo"
            value={pesoMaximo}
            onChange={(e) =>
              setPesoMaximo(
                e.target.value
              )
            }
            style={inputStyle}
          />
        </div>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            onClick={guardarCamion}
            style={{
              backgroundColor:
                currentColors.primary,
              color: "#FFFFFF",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {camion ? "Actualizar" : "Guardar"}
          </button>


        </div>
      </div>



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

export default CamionModal;