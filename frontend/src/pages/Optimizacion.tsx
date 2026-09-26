
import { useRef, useState, type CSSProperties, type FormEvent } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import PackingPlot from "../components/PackingPlot";
import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";
import "../styles/optimizacion.css";

type Producto = { codigo: string; cantidad: number };
type Caja = { nombre: string; x: number; y: number; z: number; largo: number; ancho: number; alto: number };
type Resultado = {
  cargadas: number; rechazadas: number; ocupacion: number;
  camion: { largo: number; ancho: number; alto: number };
  cajas: Caja[];
};
const registro = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === "object" && valor !== null;
const numero = (valor: unknown): valor is number =>
  typeof valor === "number" && Number.isFinite(valor);

// Antes de dibujar, comprobamos que la respuesta tenga un resultado completo.
function esResultado(valor: unknown): valor is Resultado {
  if (!registro(valor) || !registro(valor.camion) || !Array.isArray(valor.cajas)) return false;
  const camion = valor.camion;
  return numero(valor.cargadas) && Number.isInteger(valor.cargadas) && valor.cargadas >= 0
    && numero(valor.rechazadas) && Number.isInteger(valor.rechazadas) && valor.rechazadas >= 0
    && numero(valor.ocupacion) && valor.ocupacion >= 0 && valor.ocupacion <= 100
    && ["largo", "ancho", "alto"].every(campo => numero(camion[campo]) && camion[campo] > 0)
    && valor.cajas.length === valor.cargadas
    && valor.cajas.every(caja => registro(caja) && typeof caja.nombre === "string"
      && ["x", "y", "z"].every(campo => numero(caja[campo]) && caja[campo] >= 0)
      && ["largo", "ancho", "alto"].every(campo => numero(caja[campo]) && caja[campo] > 0));
}

function errorSolicitud(datos: unknown, estado: number): string {
  if (registro(datos)) {
    if (typeof datos.error === "string") return datos.error;
    if (typeof datos.detail === "string") return datos.detail;
    if (registro(datos.detail) && typeof datos.detail.mensaje === "string") return datos.detail.mensaje;
    if (Array.isArray(datos.detail)) {
      const campos = datos.detail.flatMap(item => registro(item) && Array.isArray(item.loc) ? item.loc : []);
      if (campos.includes("cantidad")) return "Revise las cantidades: cada producto debe tener un número entero de cajas mayor que cero.";
      if (campos.includes("codigo")) return "Hay un producto sin código. Complete su código antes de continuar.";
      if (campos.includes("nombre_chofer")) return "Ingrese el nombre del chofer para identificar su camión.";
      return "Revise el pedido: agregue al menos un producto con su código y cantidad de cajas.";
    }
  }
  return estado >= 500
    ? "El servicio no pudo completar el cálculo. Su lista sigue disponible; vuelva a intentar en unos momentos."
    : "No pudimos procesar el pedido. Revise el chofer y los productos e intente nuevamente.";
}
const formato = new Intl.NumberFormat("es-PY", { maximumFractionDigits: 2 });

function Optimizacion() {
  const { darkMode } = useThemeContext();
  const paleta = darkMode ? colors.dark : colors.light;
  const [chofer, setChofer] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState("");
  const [faltantes, setFaltantes] = useState<string[]>([]);
  const [calculando, setCalculando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const codigoInput = useRef<HTMLInputElement>(null);
  const enCurso = useRef(false);
  const total = productos.reduce((suma, producto) => suma + producto.cantidad, 0);
  const volumen = resultado ? resultado.camion.largo * resultado.camion.ancho * resultado.camion.alto / 1_000_000 : 0;
  const ocupado = resultado ? resultado.cajas.reduce((suma, caja) => suma + caja.largo * caja.ancho * caja.alto / 1_000_000, 0) : 0;
  const variables = {
    "--opt-card": paleta.card, "--opt-text": paleta.textPrimary,
    "--opt-muted": paleta.textSecondary, "--opt-border": paleta.border,
    "--opt-soft": paleta.background, "--opt-accent": darkMode ? "#7dc5ff" : "#005b96",
    "--opt-tint": paleta.primaryLight,
  } as CSSProperties;

  function invalidar() {
    setResultado(null); setError(""); setFaltantes([]); setAviso("");
  }
  function agregar(evento: FormEvent) {
    evento.preventDefault();
    if (enCurso.current) return;
    const limpio = codigo.trim();
    const cajas = Number(cantidad);
    if (!limpio) { setError("Ingrese el código del producto que quiere agregar."); codigoInput.current?.focus(); return; }
    if (!Number.isSafeInteger(cajas) || cajas <= 0) {
      setError("La cantidad debe ser un número entero mayor que cero. Por ejemplo: 1, 2 o 12 cajas."); return;
    }
    if (productos.some(producto => producto.codigo === limpio && producto.codigo !== editando)) {
      setError("Ese código ya está en la lista. Use el botón Editar de su fila para cambiar la cantidad."); return;
    }
    invalidar();
    setProductos(editando
      ? productos.map(producto => producto.codigo === editando ? { codigo: limpio, cantidad: cajas } : producto)
      : [...productos, { codigo: limpio, cantidad: cajas }]);
    setAviso(editando ? "Producto actualizado." : "Producto agregado al pedido.");
    setEditando(null); setCodigo(""); setCantidad("1"); codigoInput.current?.focus();
  }
  async function optimizar() {
    if (enCurso.current) return;
    if (!chofer.trim()) { setError("Ingrese el nombre del chofer antes de optimizar."); return; }
    if (!productos.length) { setError("Agregue al menos un producto a la lista."); return; }
    if (editando || codigo.trim()) { setError("Guarde el producto que está ingresando o cancele su edición antes de optimizar."); return; }
    invalidar(); enCurso.current = true; setCalculando(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 120_000);
    try {
      const respuesta = await fetch("http://127.0.0.1:8000/optimizar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_chofer: chofer.trim(), productos }),
        signal: controller.signal,
      });
      const datos: unknown = await respuesta.json().catch(() => null);
      if (!respuesta.ok || (registro(datos) && ("error" in datos || "detail" in datos))) {
        if (registro(datos) && registro(datos.detail) && Array.isArray(datos.detail.codigos_no_encontrados)) {
          setFaltantes(datos.detail.codigos_no_encontrados.filter((valor): valor is string => typeof valor === "string"));
        }
        setError(errorSolicitud(datos, respuesta.status)); return;
      }
      if (!esResultado(datos) || datos.cargadas + datos.rechazadas !== total) {
        setError("El servicio devolvió un resultado incompleto. No se mostrará una carga que pueda ser incorrecta. Vuelva a intentar."); return;
      }
      setResultado(datos); setAviso("Cálculo terminado. El resultado está disponible en la visualización.");
    } catch (causa) {
      setError(causa instanceof Error && causa.name === "AbortError"
        ? "El cálculo está tardando demasiado. Su lista se conservó; espere unos momentos antes de volver a intentar."
        : "No pudimos conectar con el servicio de optimización. Compruebe que la API esté iniciada y vuelva a intentar. Su lista se conservó.");
    } finally {
      window.clearTimeout(timeout); enCurso.current = false; setCalculando(false);
    }
  }
  function nuevaCarga() {
    invalidar(); setProductos([]); setCodigo(""); setCantidad("1"); setChofer(""); setEditando(null);
  }
  return (
    <div className="opt-page" style={variables} aria-busy={calculando}>
      <header className="opt-header">
        <div><span className="opt-eyebrow">PLANIFICACIÓN DE DESPACHOS</span><h1>Optimización de carga</h1><p>Prepare su pedido y explore cómo distribuir las cajas en el camión.</p></div>
        <button className="opt-button opt-secondary" disabled={calculando} onClick={nuevaCarga}><RestartAltIcon fontSize="small" /> Nueva carga</button>
      </header>
      <div className="opt-steps" aria-label="Etapas de planificación">
        <span className="opt-step-active"><b>1</b> Preparar pedido</span><span><b>2</b> Calcular distribución</span><span className={resultado ? "opt-step-active" : ""}><b>3</b> Revisar resultado</span>
      </div>
      {error && <div className="opt-alert" role="alert"><strong>No pudimos continuar</strong><p>{error}</p></div>}
      <span className="opt-sr-only" role="status">{aviso}</span>
      <div className="opt-workspace">
        <section className="opt-panel opt-order" aria-labelledby="pedido-titulo">
          <div className="opt-panel-heading"><div><span className="opt-eyebrow">INGRESO MANUAL</span><h2 id="pedido-titulo">Prepare el pedido</h2></div><LocalShippingOutlinedIcon className="opt-section-icon" /></div>
          <label className="opt-label" htmlFor="opt-chofer">Nombre del chofer</label>
          <input id="opt-chofer" className="opt-input" value={chofer} disabled={calculando} placeholder="Como figura en Camiones" onChange={evento => { invalidar(); setChofer(evento.target.value); }} />
          <p className="opt-help">Usaremos las medidas del camión registrado para ese chofer.</p>
          <div className="opt-divider" />
          <form onSubmit={agregar} noValidate>
            <div className="opt-form-grid">
              <div><label className="opt-label" htmlFor="opt-codigo">Código del producto</label><input ref={codigoInput} id="opt-codigo" className="opt-input" value={codigo} disabled={calculando} placeholder="Ej.: RPN202122" autoComplete="off" onChange={evento => setCodigo(evento.target.value)} /></div>
              <div><label className="opt-label" htmlFor="opt-cantidad">Cajas</label><input id="opt-cantidad" className="opt-input" type="number" inputMode="numeric" min="1" step="1" value={cantidad} disabled={calculando} onChange={evento => setCantidad(evento.target.value)} /></div>
            </div>
            <p className="opt-help">Ingrese la cantidad de cajas completas que se van a cargar.</p>
            <div className="opt-form-actions"><button className="opt-button opt-secondary" disabled={calculando} type="submit"><AddIcon fontSize="small" />{editando ? "Guardar cambios" : "Agregar al pedido"}</button>
              {(editando || codigo) && <button className="opt-text-button" type="button" disabled={calculando} onClick={() => { setEditando(null); setCodigo(""); setCantidad("1"); setError(""); }}>Cancelar</button>}</div>
          </form>
          <div className="opt-list-heading"><h3>Productos del pedido</h3><span>{productos.length} códigos · {total} cajas</span></div>
          {productos.length === 0 ? <div className="opt-list-empty"><ViewInArOutlinedIcon /><strong>Su pedido empieza aquí</strong><p>Agregue un código y su cantidad de cajas.</p></div> :
            <ul className="opt-product-list">{productos.map(producto => <li key={producto.codigo} className={faltantes.includes(producto.codigo) ? "opt-product-missing" : ""}>
              <div className="opt-product-code"><strong>{producto.codigo}</strong><span>{faltantes.includes(producto.codigo) ? "Código no encontrado" : producto.cantidad + (producto.cantidad === 1 ? " caja" : " cajas")}</span></div>
              <div className="opt-row-actions"><button className="opt-icon-button" aria-label={"Editar " + producto.codigo} disabled={calculando} onClick={() => { setEditando(producto.codigo); setCodigo(producto.codigo); setCantidad(String(producto.cantidad)); setError(""); codigoInput.current?.focus(); }}><EditOutlinedIcon fontSize="small" /></button>
              <button className="opt-icon-button" aria-label={"Quitar " + producto.codigo} disabled={calculando} onClick={() => { invalidar(); setProductos(productos.filter(item => item.codigo !== producto.codigo)); if (editando === producto.codigo) { setEditando(null); setCodigo(""); setCantidad("1"); } }}><DeleteOutlineIcon fontSize="small" /></button></div>
            </li>)}</ul>}
          <div className="opt-order-footer"><div><span>Cajas a distribuir</span><strong>{total}</strong></div>
            <button className="opt-button opt-primary" disabled={calculando || !productos.length} onClick={optimizar}>{calculando ? <><span className="opt-spinner" /> Calculando…</> : <>Optimizar carga <ArrowForwardIcon fontSize="small" /></>}</button>
          </div>
        </section>
        <section className="opt-results" aria-label="Resultado de la optimización">
          <div className="opt-metrics">
            <div className="opt-metric"><span>Ocupación del espacio</span><strong>{resultado ? formato.format(resultado.ocupacion) + "%" : "—"}</strong><small>Volumen utilizado</small></div>
            <div className="opt-metric"><span>Cajas acomodadas</span><strong>{resultado ? resultado.cargadas : "—"}</strong><small>{resultado ? "de " + total + " solicitadas" : "Pendiente de cálculo"}</small></div>
            <div className="opt-metric"><span>Sin acomodar</span><strong>{resultado ? resultado.rechazadas : "—"}</strong><small>{resultado ? (resultado.rechazadas ? "Requieren revisar la carga" : "Todas acomodadas") : "Pendiente de cálculo"}</small></div>
          </div>
          <div className="opt-panel opt-viewer">
            <div className="opt-panel-heading"><div><span className="opt-eyebrow">DISTRIBUCIÓN ESPACIAL</span><h2>Vista de la carga</h2></div><span className="opt-badge">{calculando ? "Calculando" : resultado ? "Resultado disponible" : "Sin calcular"}</span></div>
            {resultado ? <><PackingPlot cajas={resultado.cajas} camion={resultado.camion} />
              <div className="opt-volume"><span>Capacidad <strong>{formato.format(volumen)} m³</strong></span><span>Utilizado <strong>{formato.format(ocupado)} m³</strong></span><span>Libre <strong>{formato.format(Math.max(0, volumen - ocupado))} m³</strong></span></div>
              <p className="opt-help">Camión: {resultado.camion.largo} × {resultado.camion.ancho} × {resultado.camion.alto} cm. Arrastre para girar y use el zoom para acercarse.</p>
            </> : <div className="opt-preview-empty"><div className="opt-preview-icon"><ViewInArOutlinedIcon /></div><h3>{calculando ? "Buscando una distribución…" : "Visualice su próxima carga"}</h3><p>{calculando ? "Estamos calculando las posiciones de las cajas. Esto puede tardar según el tamaño del pedido." : "Agregue los productos y calcule la distribución para explorar el camión en 3D."}</p><span className="opt-empty-caption">Medidas reales · Cantidades confirmadas</span></div>}
          </div>
          {resultado && <div className="opt-result-note" role="status">{resultado.rechazadas > 0 ? resultado.rechazadas + " cajas quedaron sin acomodar en esta distribución. Revise las cantidades o la capacidad del camión." : "Todas las cajas del pedido se acomodaron en esta distribución."}</div>}
          <p className="opt-footnote">La ocupación representa espacio utilizado. Las reglas por categoría de peso y apoyo todavía están pendientes de integración.</p>
        </section>
      </div>
    </div>
  );
}
export default Optimizacion;

