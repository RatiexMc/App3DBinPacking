import { useState } from "react";
import PageHeader from "../components/PageHeader";
import DashboardCard from "../components/DashboardCard";
import Card from "../components/Card";

import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";

function Optimizacion() {
  // =========================
  // TEMA ACTUAL
  // =========================
  const { darkMode } = useThemeContext();

  const currentColors = darkMode
    ? colors.dark
    : colors.light;

  const [chofer, setChofer] = useState("Junior");

  const [codigo, setCodigo] = useState("");

  const [cantidad, setCantidad] = useState(1);
  const [productos, setProductos] = useState<any[]>([]);

  const [resultadoReal, setResultadoReal] =
    useState<any>(null);

  const camionReal =
    resultadoReal ? chofer : "-";

  const productosReales =
    resultadoReal
      ? productos.length
      : 0;

  const cajasReales =
    resultadoReal
      ? resultadoReal.cajas.length
      : 0;


  const ocupacionReal =
    resultadoReal
      ? `${resultadoReal.ocupacion}%`
      : "0%";


  const ejecutarOptimizacion = async () => {
    try {
      const respuesta = await fetch(
        "http://127.0.0.1:8000/optimizar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },



          body: JSON.stringify({
            nombre_chofer: chofer,
            productos: productos,
          }),


        }
      );

      const datos = await respuesta.json();

      console.log("Resultado:", datos);
      setResultadoReal(datos);



    } catch (error) {
      console.error(error);
    }
  };


  const agregarProducto = () => {





    if (!codigo.trim()) return;

    setProductos([
      ...productos,
      {
        codigo,
        cantidad
      }
    ]);

    setCodigo("");
    setCantidad(1);
  };



  const eliminarProducto = (
    indexEliminar: number
  ) => {

    setProductos(

      productos.filter(
        (_, index) =>
          index !== indexEliminar
      )

    );

  };




  const nuevaCarga = () => {

    setProductos([]);

    setResultadoReal(null);

    setCodigo("");

    setCantidad(1);

  };





  // =========================
  // DATOS SIMULADOS
  // =========================
  const resultado = {
    camion: "ABC-123",
    productos: 34,
    cajas: 220,
    ocupacion: "87%",

    volumenTotal: "999 m³",
    volumenUtilizado: "290 m³",

    cargados: 34,
    rechazados: 0,

    usuario: "Junior",
    fecha: "02/09/2026",
  };

  return (
    <div>
      {/* ========================= */}
      {/* TÍTULO */}
      {/* ========================= */}
      <PageHeader title="Optimización de Carga" />
      <Card>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <h3>Ingreso Manual</h3>


          <input
            type="text"
            value={chofer}
            onChange={(e) => setChofer(e.target.value)}
            disabled={productos.length > 0}
          />






          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código del producto"
          />

          <input
            type="number"
            value={cantidad}
            onChange={(e) =>
              setCantidad(Number(e.target.value))
            }
            placeholder="Cantidad"
          />
          <button onClick={agregarProducto}>
            Agregar Producto
          </button>
          <button onClick={ejecutarOptimizacion}>
            Optimizar
          </button>

          <button onClick={nuevaCarga}>
            Nueva Carga
          </button>
          <div style={{ marginTop: "20px" }}>




            {productos.map((producto, index) => (

              <div
                key={index}
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #ddd",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >

                <span>
                  {producto.codigo}
                  {" - "}
                  {producto.cantidad}
                </span>

                <button
                  onClick={() => eliminarProducto(index)}
                >
                  X
                </button>

              </div>

            ))}



          </div>
        </div>
      </Card>
      {
        resultadoReal && (
          <Card>
            <div
              style={{
                padding: "20px"
              }}
            >
              <h3>Resultado Real</h3>

              <p>
                Cargadas:
                {" "}
                {resultadoReal.cargadas}
              </p>

              <p>
                Rechazadas:
                {" "}
                {resultadoReal.rechazadas}
              </p>

              <p>
                Total cajas:
                {" "}
                {resultadoReal.cajas.length}
              </p>
            </div>
          </Card>
        )
      }


      {/* ========================= */}
      {/* TARJETAS SUPERIORES */}
      {/* ========================= */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        <DashboardCard
          title="Camión"
          value={camionReal}
        />

        <DashboardCard
          title="Productos"
          value={String(productosReales)}
        />

        <DashboardCard
          title="Cajas"
          value={String(cajasReales)}
        />

        <DashboardCard
          title="Ocupación"
          value={ocupacionReal}
        />
      </div>

      {/* ========================= */}
      {/* VISUALIZACIÓN 3D */}
      {/* ========================= */}
      <Card>
        <div
          style={{
            minHeight: "450px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: currentColors.textSecondary,
          }}
        >
          <h2
            style={{
              color: currentColors.textPrimary,
              marginBottom: "15px",
            }}
          >
            Visualización 3D
          </h2>

          <p>
            El resultado de la optimización se mostrará aquí.
          </p>

          <p>
            (Preparado para integrar Three.js)
          </p>
        </div>
      </Card>

      {/* ========================= */}
      {/* INFORMACIÓN DETALLADA */}
      {/* ========================= */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "30px",
        }}
      >
        {/* ========================= */}
        {/* RESUMEN */}
        {/* ========================= */}

        <div
          style={{
            flex: 2,
            backgroundColor: currentColors.card,
            border: `1px solid ${currentColors.border}`,
            borderRadius: "10px",
            padding: "24px",
            color: currentColors.textPrimary,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "16px",
              color: currentColors.textPrimary,
            }}
          >
            Resumen de Optimización
          </h3>

          <p>
            Capacidad Total: {resultado.volumenTotal}
          </p>

          <p>
            Volumen Utilizado:{" "}
            {resultado.volumenUtilizado}
          </p>

          <p>
            Productos Cargados:{" "}
            {resultado.cargados}
          </p>

          <p>
            Productos Rechazados:{" "}
            {resultado.rechazados}
          </p>
        </div>

        {/* ========================= */}
        {/* INFORMACIÓN GENERAL */}
        {/* ========================= */}

        <div
          style={{
            flex: 1,
            backgroundColor: currentColors.card,
            border: `1px solid ${currentColors.border}`,
            borderRadius: "10px",
            padding: "24px",
            color: currentColors.textPrimary,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "16px",
              color: currentColors.textPrimary,
            }}
          >
            Información General
          </h3>

          <p>
            <strong>Usuario:</strong>{" "}
            {resultado.usuario}
          </p>

          <p>
            <strong>Fecha:</strong>{" "}
            {resultado.fecha}
          </p>

          <p>
            <strong>Camión:</strong>{" "}
            {camionReal}
          </p>

          <p>
            <strong>Estado:</strong>{" "}
            Optimizado
          </p>
        </div>
      </div>
    </div>
  );
}

export default Optimizacion;