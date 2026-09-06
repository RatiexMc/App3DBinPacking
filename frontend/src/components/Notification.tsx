interface NotificationProps {
  open: boolean;
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

function Notification({
  open,
  message,
  type,
  onClose,
}: NotificationProps) {

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 99999,
        minWidth: "320px",
        padding: "16px",
        borderRadius: "12px",
        backgroundColor:
          type === "success"
            ? "#16A34A"
            : "#DC2626",
        color: "#FFFFFF",
        boxShadow:
          "0px 6px 20px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <span>{message}</span>

        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#FFFFFF",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default Notification;