import PageHeader from "../components/PageHeader";
import ActionButton from "../components/ActionButton";

import { useNavigate } from "react-router-dom";

function FotoPicking() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="Foto Picking" />

      <div
        className="card"
        style={{
          maxWidth: "700px",
        }}
      >
        <h2>Captura de Imagen</h2>

        <p
          style={{
            marginTop: "15px",
            marginBottom: "20px",
          }}
        >
          Seleccione o capture una fotografía para identificar productos.
        </p>

        <input type="file" />

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <ActionButton
            text="Procesar Imagen"
          />

          <ActionButton
            text="Ver Resultado"
            onClick={() =>
              navigate("/optimizacion")
            }
          />
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: "#f3f4f6",
          }}
        >
          Estado actual: Esperando imagen
        </div>

        <div
          style={{
            marginTop: "25px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span>① Cargar Imagen</span>
          <span>→</span>
          <span>② Procesar OCR</span>
          <span>→</span>
          <span>③ Optimizar Carga</span>
          <span>→</span>
          <span>④ Ver Resultado</span>
        </div>

        <div
          style={{
            marginTop: "30px",
            height: "250px",
            border: "2px dashed #ccc",
            borderRadius: "10px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Vista Previa
        </div>
      </div>
    </div>
  );
}

export default FotoPicking;