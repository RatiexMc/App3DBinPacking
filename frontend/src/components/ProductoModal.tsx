import {
  useState,
  type CSSProperties,
} from "react";

import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";

import Notification from "./Notification";

interface ProductoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function ProductoModal({
  open,
  onClose,
  onSuccess,
}: ProductoModalProps) {

  const { darkMode } = useThemeContext();

  const currentColors =
    darkMode
      ? colors.dark
      : colors.light;

  // ==================================
  // CAMPOS DEL FORMULARIO
  // ==================================

  const [codigo, setCodigo] =
    useState("");

  const [descripcion,
    setDescripcion] =
    useState("");

  const [largo, setLargo] =
    useState("");

  const [ancho, setAncho] =
    useState("");

  const [alto, setAlto] =
    useState("");

  const [peso, setPeso] =
    useState("");

  const [apilable,
    setApilable] =
    useState(true);

  const [categoriaPeso,
    setCategoriaPeso] =
    useState("1");

  // ==================================
  // NOTIFICACIONES
  // ==================================

  const [showNotification,
    setShowNotification] =
    useState(false);

  const [notificationMessage,
    setNotificationMessage] =
    useState("");

  const [notificationType,
    setNotificationType] =
    useState<"success" | "error">(
      "success"
    );

  // ==================================
  // SI EL MODAL ESTÁ CERRADO
  // ==================================

  if (!open) return null;

  // ==================================
  // GUARDAR PRODUCTO
  // ==================================

  const guardarProducto = async () => {

    setShowNotification(false);

    if (!codigo.trim()) {

      setNotificationType("error");

      setNotificationMessage(
        "Debe ingresar un código."
      );

      setShowNotification(true);

      return;
    }

    if (!descripcion.trim()) {

      setNotificationType("error");

      setNotificationMessage(
        "Debe ingresar una descripción."
      );

      setShowNotification(true);

      return;
    }

    if (Number(largo) <= 0) {

      setNotificationType("error");

      setNotificationMessage(
        "Largo inválido."
      );

      setShowNotification(true);

      return;
    }

    if (Number(ancho) <= 0) {

      setNotificationType("error");

      setNotificationMessage(
        "Ancho inválido."
      );

      setShowNotification(true);

      return;
    }

    if (Number(alto) <= 0) {

      setNotificationType("error");

      setNotificationMessage(
        "Alto inválido."
      );

      setShowNotification(true);

      return;
    }

    if (Number(peso) <= 0) {

      setNotificationType("error");

      setNotificationMessage(
        "Peso inválido."
      );

      setShowNotification(true);

      return;
    }

    try {

      const respuesta =
        await fetch(
          "http://127.0.0.1:8000/productos",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              codigo,
              descripcion,

              largo:
                Number(largo),

              ancho:
                Number(ancho),

              alto:
                Number(alto),

              peso:
                Number(peso),

              apilable,

              categoria_peso:
                Number(
                  categoriaPeso
                ),
            }),
          }
        );

      if (!respuesta.ok) {

        setNotificationType(
          "error"
        );

        setNotificationMessage(
          "No se pudo guardar el producto. Verifique si el código ya existe."
        );

        setShowNotification(true);

        return;
      }

      setNotificationType(
        "success"
      );

      setNotificationMessage(
        "Producto creado correctamente."
      );

      setShowNotification(true);

      // Limpiar formulario

      setCodigo("");
      setDescripcion("");

      setLargo("");
      setAncho("");
      setAlto("");

      setPeso("");

      setApilable(true);

      setCategoriaPeso("1");

      // Actualizar tabla principal

      onSuccess();

      // Cerrar modal

      setTimeout(() => {

        onClose();

        setShowNotification(false);

      }, 1000);

    } catch (error) {

      console.error(error);

      setNotificationType(
        "error"
      );

      setNotificationMessage(
        "Error de conexión con la API."
      );

      setShowNotification(true);
    }
  };

  // ==================================
  // ESTILO DE INPUTS
  // ==================================

  const inputStyle: CSSProperties = {
    padding: "10px",

    borderRadius: "8px",

    border:
      `1px solid ${currentColors.border}`,

    backgroundColor:
      currentColors.card,

    color:
      currentColors.textPrimary,

    width: "100%",

    boxSizing: "border-box",
  };

  // ==================================
  // UI
  // ==================================

  return (
    <div
      style={{
        position: "fixed",

        inset: 0,

        backgroundColor:
          "rgba(0,0,0,0.5)",

        display: "flex",

        justifyContent:
          "center",

        alignItems:
          "center",

        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "650px",

          maxWidth: "90vw",

          backgroundColor:
            currentColors.card,

          border:
            `1px solid ${currentColors.border}`,

          borderRadius:
            "12px",

          padding: "25px",
        }}
      >
        <h2
          style={{
            marginTop: 0,

            color:
              currentColors.textPrimary,
          }}
        >
          Nuevo Producto
        </h2>

        <p
          style={{
            marginTop: "-5px",

            marginBottom: "20px",

            color:
              currentColors.textSecondary,
          }}
        >
          Complete los datos del producto.
        </p>

        <div
          style={{
            display: "grid",

            gap: "12px",
          }}
        >
          {/* Código */}

          <input
            placeholder="Código"
            value={codigo}
            onChange={(e) =>
              setCodigo(
                e.target.value
              )
            }
            style={inputStyle}
          />

          {/* Descripción */}

          <input
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) =>
              setDescripcion(
                e.target.value
              )
            }
            style={inputStyle}
          />

          {/* Dimensiones */}

          <div>
            <label
              style={{
                color:
                  currentColors.textPrimary,

                fontWeight: 600,

                display: "block",

                marginBottom:
                  "8px",
              }}
            >
              Dimensiones (cm)
            </label>

            <div
              style={{
                display: "grid",

                gridTemplateColumns:
                  "repeat(3, 1fr)",

                gap: "10px",
              }}
            >
              <input
                type="number"
                placeholder="Largo"
                value={largo}
                onChange={(e) =>
                  setLargo(
                    e.target.value
                  )
                }
                style={inputStyle}
              />

              <input
                type="number"
                placeholder="Ancho"
                value={ancho}
                onChange={(e) =>
                  setAncho(
                    e.target.value
                  )
                }
                style={inputStyle}
              />

              <input
                type="number"
                placeholder="Alto"
                value={alto}
                onChange={(e) =>
                  setAlto(
                    e.target.value
                  )
                }
                style={inputStyle}
              />
            </div>
          </div>

          {/* Peso */}

          <input
            type="number"
            placeholder="Peso"
            value={peso}
            onChange={(e) =>
              setPeso(
                e.target.value
              )
            }
            style={inputStyle}
          />

          {/* Apilable */}

          <label
            style={{
              color:
                currentColors.textPrimary,
            }}
          >
            <input
              type="checkbox"
              checked={apilable}
              onChange={(e) =>
                setApilable(
                  e.target.checked
                )
              }
            />
            {" "}
            Apilable
          </label>

          {/* Categoría */}

          <select
            value={categoriaPeso}
            onChange={(e) =>
              setCategoriaPeso(
                e.target.value
              )
            }
            style={inputStyle}
          >
            <option value="1">
              Categoría 1 - Ligero
            </option>

            <option value="2">
              Categoría 2 - Medio
            </option>

            <option value="3">
              Categoría 3 - Pesado
            </option>
          </select>
        </div>

        {/* Botones */}

        <div
          style={{
            marginTop: "25px",

            display: "flex",

            justifyContent:
              "flex-end",

            gap: "10px",
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
            onClick={
              guardarProducto
            }
            style={{
              backgroundColor:
                currentColors.primary,

              color: "#FFFFFF",

              border: "none",

              padding:
                "10px 18px",

              borderRadius:
                "8px",

              cursor: "pointer",
            }}
          >
            Guardar
          </button>
        </div>
      </div>

      <Notification
        open={showNotification}
        message={
          notificationMessage
        }
        type={
          notificationType
        }
        onClose={() =>
          setShowNotification(false)
        }
      />
    </div>
  );
}

export default ProductoModal;