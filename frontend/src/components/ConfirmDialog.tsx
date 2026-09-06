import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {

  const { darkMode } = useThemeContext();

  const currentColors = darkMode
    ? colors.dark
    : colors.light;

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

          border: `1px solid ${currentColors.border}`,

          borderRadius: "12px",

          width: "420px",

          padding: "24px",

          color: currentColors.textPrimary,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "20px",
          }}
        >
          ⚠️ {title}
        </h2>

        <p
          style={{
            marginBottom: "25px",
          }}
        >
          {message}
        </p>

        <p
          style={{
            fontSize: "14px",
            opacity: 0.8,
            marginBottom: "25px",
          }}
        >
          Esta acción no se puede deshacer.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "10px 18px",

              borderRadius: "8px",

              border: `1px solid ${currentColors.border}`,

              backgroundColor: "transparent",

              color: currentColors.textPrimary,

              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            style={{
              padding: "10px 18px",

              borderRadius: "8px",

              border: "none",

              backgroundColor: "#DC2626",

              color: "#FFFFFF",

              cursor: "pointer",

              fontWeight: 600,
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;