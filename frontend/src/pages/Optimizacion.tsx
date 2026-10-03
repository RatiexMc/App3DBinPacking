
import { useRef, type CSSProperties, type FormEvent } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SeleccionProductos, { type Articulo } from "../components/SeleccionProductos";
import { useConsulta } from "../hooks/useConsulta";
import type { Producto } from "../types/Packing";
import "../styles/flow.css";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { esResultado, registro } from "../types/Packing";
import { useCampoCarga, enCurso } from "../context/cargaStore";
import PackingPlot from "../components/PackingPlot";
import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";
import { apiFetch } from "../services/api";
import { Link } from "react-router-dom";
import { guardarPreferencias } from "../context/preferenciasStore";
import "../styles/optimizacion.css";

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
  const [chofer, setChofer] = useCampoCarga("chofer");
  const [solicitudId, setSolicitudId] = useCampoCarga("solicitudId");
  const [codigo, setCodigo] = useCampoCarga("codigo");
  const [cantidad, setCantidad] = useCampoCarga("cantidad");
  const [productos, setProductos] = useCampoCarga("productos");
  const [resultado, setResultado] = useCampoCarga("resultado");
  const [error, setError] = useCampoCarga("error");
  const [faltantes, setFaltantes] = useCampoCarga("faltantes");
  const [calculando, setCalculando] = useCampoCarga("calculando");
  const [editando, setEditando] = useCampoCarga("editando");
  const [aviso, setAviso] = useCampoCarga("aviso");
  const codigoInput = useRef<HTMLInputElement>(null);
  const [, cambiarManualVisible] = useCampoCarga("manualVisible");
  function setManualVisible(visible: boolean) {
    cambiarManualVisible(visible);
    guardarPreferencias({ manualVisible: visible });
  }
  const [etapa, setEtapa] = useCampoCarga("etapa");
  const [metodo, setMetodo] = useCampoCarga("metodo");
  const [seleccion, setSeleccion] = useCampoCarga("seleccion");
  const [, setBusqueda] = useCampoCarga("busqueda");
  const catalogo = useConsulta<Articulo[]>("/productos");
  const camiones = useConsulta<{ id_camion: number; placa: string; nombre_chofer: string; apellido_chofer: string }[]>("/camiones");
  function sumar(nuevos: Producto[]) {
    if (enCurso.current) return;
    const cantidades = new Map(productos.map(p => [p.codigo, p.cantidad]));
    for (const p of nuevos) {
      const n = (cantidades.get(p.codigo) || 0) + p.cantidad;
      if (!Number.isSafeInteger(n) || n <= 0) { setError("La cantidad total no es válida."); return; }
      cantidades.set(p.codigo, n);
    }
    invalidar();
    setProductos([...cantidades].map(([codigo, cantidad]) => ({ codigo, cantidad })));
    setSeleccion({});
    setAviso("Se agregaron " + nuevos.reduce((s,p) => s + p.cantidad, 0) + " cajas al pedido. Los códigos repetidos se sumaron.");
  }
  function elegirMetodo(valor: string) {
    setMetodo(valor); setManualVisible(valor === "manual");
  }
  const [avisoPersistencia] = useCampoCarga("avisoPersistencia");
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
    setSolicitudId(crypto.randomUUID());
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
    const producto = catalogo.datos?.find(p => p.codigo.toUpperCase() === limpio.toUpperCase());
    if (!producto) { setError(catalogo.error || "El código no está en el catálogo. Busque un producto registrado."); return; }
    if (editando) {
      if (producto.codigo !== editando && productos.some(p => p.codigo === producto.codigo)) { setError("Ese producto ya está en el pedido. Edite su cantidad directamente."); return; }
      invalidar();
      setProductos(productos.map(p => p.codigo === editando ? { codigo: producto.codigo, cantidad: cajas } : p));
      setAviso("Cantidad actualizada: " + cajas + " cajas.");
    } else sumar([{ codigo: producto.codigo, cantidad: cajas }]);
    setEditando(null); setCodigo(""); setCantidad("1"); codigoInput.current?.focus();
  }
  async function optimizar() {
    if (enCurso.current) return;
    if (!chofer.trim()) { setError("Ingrese el nombre del chofer antes de optimizar."); return; }
    if (!productos.length) { setError("Agregue al menos un producto a la lista."); return; }
    if (editando || codigo.trim() || Object.keys(seleccion).length) { setEtapa(1); elegirMetodo(editando || codigo.trim() ? "manual" : "catalogo"); setError("Guarde el producto que está ingresando o cancele su edición antes de optimizar."); return; }
    const idCalculo = resultado?.historial_guardado ? crypto.randomUUID() : solicitudId;
    setSolicitudId(idCalculo);
    setResultado(null); setError(""); setFaltantes([]); setAviso(""); enCurso.current = true; setCalculando(true);
    enCurso.id = idCalculo;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 120_000);
    try {
      const respuesta = await apiFetch("/optimizar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solicitud_id: idCalculo, nombre_chofer: chofer.trim(), productos }),
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
      setResultado(datos); setEtapa(3); setAviso("Cálculo terminado. El resultado está disponible en la visualización.");
    } catch (causa) {
      setError(causa instanceof Error && causa.name === "AbortError"
        ? "El cálculo está tardando demasiado. Su lista se conservó; espere unos momentos antes de volver a intentar."
        : "No pudimos conectar con el servicio de optimización. Compruebe que la API esté iniciada y vuelva a intentar. Su lista se conservó.");
    } finally {
      window.clearTimeout(timeout);
      if (enCurso.id === idCalculo) { enCurso.current = false; enCurso.id = null; setCalculando(false); }
    }
  }
  function nuevaCarga() {
    if (enCurso.current || ((productos.length || codigo || chofer || Object.keys(seleccion).length) && !window.confirm("¿Descartar el pedido actual y empezar una nueva carga?"))) return;
    setEtapa(1); setMetodo(""); setSeleccion({}); setBusqueda("");
    invalidar(); setProductos([]); setCodigo(""); setCantidad("1"); setChofer(""); setEditando(null);
  }
  return (
    <div className="opt-page" style={variables} aria-busy={calculando}>
      <header className="opt-header">
        <div><span className="opt-eyebrow">PLANIFICACIÓN DE DESPACHOS</span><h1>Optimización de carga</h1><p>Prepare su pedido y explore cómo distribuir las cajas en el camión.</p></div>
        <button className="opt-button opt-secondary" disabled={calculando} onClick={nuevaCarga}><RestartAltIcon fontSize="small" /> Nueva carga</button>
      </header>
      <nav className="flow-steps" aria-label="Etapas de planificación">{["Agregar productos", "Revisar pedido", "Ver resultado"].map((titulo, i) => <button key={titulo} aria-current={etapa === i + 1 ? "step" : undefined} disabled={calculando || (i === 1 && !productos.length) || (i === 2 && !resultado)} onClick={() => setEtapa(i + 1)}><b>{i + 1}</b><span>{titulo}</span></button>)}</nav>
      {error && <div className="opt-alert" role="alert"><strong>No pudimos continuar</strong><p>{error}</p></div>}
      {avisoPersistencia && <div className="opt-alert" role="status">{avisoPersistencia}</div>}
      {resultado?.historial_guardado === false && <div className="opt-alert" role="status">{resultado.aviso_historial}</div>}
      {aviso && <p className="flow-notice" role="status">{aviso}</p>}
      {etapa === 1 && <section className="opt-panel">
        <div className="opt-panel-heading"><div><span className="opt-eyebrow">SU PRÓXIMA CARGA</span><h2>¿Cómo quiere agregar productos?</h2></div><span className="opt-badge">{total} cajas en el pedido</span></div>
        <div className="method-grid">{[
          ["catalogo", "Catálogo", "Busque y seleccione productos", "▦"],
          ["frecuentes", "Mis frecuentes", "Vuelva a usar sus habituales", "☆"],
          ["manual", "Ingreso manual", "Ingrese un código y las cajas", "+"],
          ["foto", "Fotopicking", "Prepare el pedido desde una foto", "▧"],
        ].map(([valor, titulo, detalle, icono]) => valor === "foto" ? <Link key={valor} className="method-card" to="/fotopicking" aria-disabled={calculando} onClick={e => { if (calculando) e.preventDefault(); }}><span className="method-icon">{icono}</span><strong>{titulo}</strong><small>{detalle}</small></Link> : <button key={valor} className="method-card" aria-pressed={metodo === valor} disabled={calculando} onClick={() => elegirMetodo(valor)}><span className="method-icon">{icono}</span><strong>{titulo}</strong><small>{detalle}</small></button>)}</div>
        {(metodo === "catalogo" || metodo === "frecuentes") && <SeleccionProductos key={metodo} frecuentes={metodo === "frecuentes"} bloqueado={calculando} agregar={sumar} />}
        {metodo === "manual" && <section className="method-content"><h2>{editando ? "Editar producto" : "Ingreso manual"}</h2>
          <form id="opt-manual" onSubmit={agregar} noValidate>
            <div className="opt-form-grid">
              <div><label className="opt-label" htmlFor="opt-codigo">Código del producto</label><input ref={codigoInput} id="opt-codigo" className="opt-input" value={codigo} disabled={calculando} placeholder="Ej.: RPN202122" autoComplete="off" onChange={evento => setCodigo(evento.target.value)} /></div>
              <div><label className="opt-label" htmlFor="opt-cantidad">Cajas</label><input id="opt-cantidad" className="opt-input" type="number" inputMode="numeric" min="1" step="1" value={cantidad} disabled={calculando} onChange={evento => setCantidad(evento.target.value)} /></div>
            </div>
            <p className="opt-help">Ingrese la cantidad de cajas completas que se van a cargar.</p>
            <div className="opt-form-actions"><button className="opt-button opt-secondary" disabled={calculando} type="submit"><AddIcon fontSize="small" />{editando ? "Guardar cambios" : "Agregar al pedido"}</button>
              {(editando || codigo) && <button className="opt-text-button" type="button" disabled={calculando} onClick={() => { setEditando(null); setCodigo(""); setCantidad("1"); setError(""); }}>Cancelar</button>}</div>
          </form>
          {catalogo.error && <p role="alert" className="opt-help">{catalogo.error} <button className="opt-text-button" onClick={catalogo.recargar}>Reintentar catálogo</button></p>}
          </section>}
          <div className="flow-actions"><span>{productos.length} productos · {total} cajas</span><button className="opt-button opt-primary" disabled={calculando || !productos.length} onClick={() => setEtapa(2)}>Revisar pedido <ArrowForwardIcon fontSize="small" /></button></div>
        </section>}
        {etapa === 2 && <section className="opt-panel">
          <div className="opt-panel-heading"><div><span className="opt-eyebrow">ANTES DE CALCULAR</span><h2>Revise su pedido</h2></div><button className="opt-button opt-secondary" disabled={calculando} onClick={() => setEtapa(1)}>Agregar productos</button></div>
          <label className="opt-label" htmlFor="opt-chofer">Camión y chofer</label>
          <select className="opt-input" id="opt-chofer" value={chofer} disabled={calculando} onChange={e => { invalidar(); setChofer(e.target.value); }}><option value="">Seleccione un camión</option>{chofer && !camiones.datos?.some(c => c.nombre_chofer === chofer) && <option value={chofer}>{chofer} · guardado</option>}{camiones.datos?.map(c => <option key={c.id_camion} value={c.nombre_chofer}>{c.placa} · {c.nombre_chofer} {c.apellido_chofer}</option>)}</select>
          {camiones.error && <p role="alert">{camiones.error} <button className="opt-text-button" onClick={camiones.recargar}>Reintentar</button></p>}
          <div className="opt-list-heading"><h3>Productos del pedido</h3><span>{productos.length} códigos · {total} cajas</span></div>
          {productos.length === 0 ? <div className="opt-list-empty"><ViewInArOutlinedIcon /><strong>Su pedido empieza aquí</strong><p>Agregue un código y su cantidad de cajas.</p></div> :
            <ul className="opt-product-list">{productos.map(producto => <li key={producto.codigo} className={faltantes.includes(producto.codigo) ? "opt-product-missing" : ""}>
              <div className="opt-product-code"><strong>{producto.codigo}</strong><span>{catalogo.datos?.find(p => p.codigo === producto.codigo)?.descripcion}</span><span>{faltantes.includes(producto.codigo) ? "Código no encontrado" : producto.cantidad + (producto.cantidad === 1 ? " caja" : " cajas")}</span></div>
              <div className="opt-row-actions"><button className="opt-icon-button" aria-label={"Editar " + producto.codigo} disabled={calculando} onClick={() => { setEtapa(1); elegirMetodo("manual"); setEditando(producto.codigo); setCodigo(producto.codigo); setCantidad(String(producto.cantidad)); setError(""); requestAnimationFrame(() => codigoInput.current?.focus()); }}><EditOutlinedIcon fontSize="small" /></button>
              <button className="opt-icon-button" aria-label={"Quitar " + producto.codigo} disabled={calculando} onClick={() => { invalidar(); setProductos(productos.filter(item => item.codigo !== producto.codigo)); if (editando === producto.codigo) { setEditando(null); setCodigo(""); setCantidad("1"); } }}><DeleteOutlineIcon fontSize="small" /></button></div>
            </li>)}</ul>}
          <div className="opt-order-footer"><div><span>Cajas a distribuir</span><strong>{total}</strong></div>
            <button className="opt-button opt-primary" disabled={calculando || !productos.length} onClick={optimizar}>{calculando ? <><span className="opt-spinner" /> Calculando…</> : <>Optimizar carga <ArrowForwardIcon fontSize="small" /></>}</button>
          </div>
        </section>}
        {etapa === 3 && resultado && <section className="opt-results" aria-label="Resultado de la optimización">
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
          {resultado?.sin_acomodar && resultado.sin_acomodar.length > 0 && <section className="opt-panel"><h3>Cajas pendientes</h3><ul className="opt-product-list">{resultado.sin_acomodar.map(p => <li key={p.codigo}><div className="opt-product-code"><strong>{p.codigo} · {p.cantidad} cajas</strong><span>{p.descripcion}</span><span>{p.motivo}</span></div></li>)}</ul></section>}
          <details className="opt-panel flow-details"><summary>Cómo interpretar el resultado</summary><p className="opt-footnote">La ocupación mide volumen. El espacio libre puede estar repartido en huecos donde no cabe otra caja. La búsqueda compara varias distribuciones y no garantiza la mejor solución posible.</p>
          {resultado && <p className="opt-footnote">{resultado.motor_version === "py3dbp-apoyo-v1" ? "Cálculo con apoyo completo, categorías de peso y apilabilidad. No representa una validación de resistencia del embalaje ni de peso real por categorías." : "Este resultado corresponde al motor anterior. Vuelva a calcular para aplicar las reglas de apoyo y apilado."}</p>}
          </details>
        </section>}
    </div>
  );
}
export default Optimizacion;


