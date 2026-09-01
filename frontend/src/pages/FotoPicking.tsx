import PageHeader from "../components/PageHeader";
import ActionButton from "../components/ActionButton";

function FotoPicking() {
  return (
    <div>
      <PageHeader title="Foto Picking" />

      <div
        className="card"
        style={{
          maxWidth: "600px",
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
          }}
        >
          <ActionButton text="Procesar Imagen" />
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