import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OperationsPage from "../components/OperationsPage";
import { apiJson, jsonBody } from "../services/api";
import { useConsulta } from "../hooks/useConsulta";
import { importarPicking, useCampoCarga } from "../context/cargaStore";
import { usePicking, type LecturaOCR, type FilaRevision } from "../context/pickingStore";
import type { Producto } from "../types/Packing";
import "../styles/picking.css";
import "../styles/flow.css";

type Camion = { id_camion: number; placa: string; nombre_chofer: string; apellido_chofer: string };
type Catalogo = { codigo: string; descripcion: string };
const cajasValidas = (n: string) => Number.isSafeInteger(Number(n)) && Number(n) > 0;

export default function FotoPicking() {
  const navigate = useNavigate();
  const [estado, actualizar] = usePicking();
  const { lectura, filas, chofer, procesando, error, aviso, confirmado, etapa, filtro } = estado;
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [mejorar, setMejorar] = useState(true);
  const [giro, setGiro] = useState("auto");
  const [enviando, setEnviando] = useState(false);
  const [reemplazar, setReemplazar] = useState(false);
  const [verDocumento, setVerDocumento] = useState(false);
  const [productosActuales] = useCampoCarga("productos");
  const [choferActual] = useCampoCarga("chofer");
  const [codigoPendiente] = useCampoCarga("codigo");
  const [seleccionPendiente] = useCampoCarga("seleccion");
  const [calculando] = useCampoCarga("calculando");
  const bloqueado = procesando || enviando || calculando;
  const tienePedido = productosActuales.length > 0 || !!codigoPendiente || Object.keys(seleccionPendiente).length > 0;
  const camiones = useConsulta<Camion[]>("/camiones");
  const catalogo = useConsulta<Catalogo[]>("/productos");
  const elegidas = filas.filter(f => f.incluir);
  const existe = (codigo: string) => catalogo.datos?.some(p => p.codigo === codigo.trim());
  const listas = elegidas.filter(f => f.revisada && existe(f.codigo) && cajasValidas(f.cajas));
  const total = listas.reduce((s, f) => s + Number(f.cajas), 0);
  const choferDestino = !reemplazar && choferActual ? choferActual : chofer;
  const visibles = filas.filter(f => filtro === "excluidas" ? !f.incluir : filtro === "pendientes" ? f.incluir && !listas.some(l => l.id === f.id) : true);
  const resumen = new Map<string, number>();
  for (const f of listas) resumen.set(f.codigo.trim(), (resumen.get(f.codigo.trim()) || 0) + Number(f.cajas));
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function elegirArchivo(file: File | null) {
    setArchivo(file); setPreview(file ? URL.createObjectURL(file) : "");
  }
  function cambiarFila(id: string, cambio: Partial<FilaRevision>) {
    actualizar({ filas: filas.map(f => f.id === id ? { ...f, ...cambio, revisada: cambio.revisada ?? false } : f), confirmado: false, error: "" });
  }
  async function leer() {
    if (!archivo || bloqueado) return;
    if (archivo.size > 10 * 1024 * 1024) { actualizar({ error: "La imagen debe pesar como máximo 10 MB." }); return; }
    if (lectura && !window.confirm("¿Reemplazar la revisión con una nueva lectura? Si falla, conservaremos la anterior.")) return;
    const datos = new FormData();
    datos.set("archivo", archivo); datos.set("mejorar", String(mejorar)); datos.set("giro", giro);
    actualizar({ procesando: true, error: "", aviso: "" });
    try {
      const resultado = await apiJson<LecturaOCR>("/ocr/leer", { method: "POST", body: datos });
      if (!Array.isArray(resultado.filas) || typeof resultado.imagen !== "string") throw new Error("El OCR devolvió una respuesta incompleta.");
      actualizar({ lectura: resultado, nombreArchivo: archivo.name, confirmado: false, etapa: 2, filtro: "todas",
        filas: resultado.filas.map(f => ({ ...f, id: crypto.randomUUID(), cajas: f.cj_identificada && f.cajas_sugeridas ? String(f.cajas_sugeridas) : "", incluir: !f.posible_servicio, revisada: false })) });
    } catch (causa) { actualizar({ error: causa instanceof Error ? causa.message : "No pudimos leer la imagen." }); }
    finally { actualizar({ procesando: false }); }
  }
  async function continuar() {
    if (bloqueado) return;
    if (!choferDestino) { actualizar({ error: "Seleccione el camión para este pedido." }); return; }
    if (!elegidas.length || listas.length !== elegidas.length || !confirmado) { actualizar({ error: "Revise los productos incluidos y confirme el documento." }); return; }
    if (reemplazar && tienePedido && !window.confirm("¿Reemplazar el pedido y sus borradores con este picking?")) return;
    setEnviando(true); actualizar({ error: "" });
    try {
      const resultado = await apiJson<{ productos: Producto[] }>("/ocr/validar", { method: "POST", ...jsonBody({ productos: listas.map(f => ({ codigo: f.codigo.trim(), cantidad: Number(f.cajas) })) }) });
      importarPicking(resultado.productos, choferDestino, reemplazar);
      navigate("/optimizacion");
    } catch (causa) { actualizar({ error: causa instanceof Error ? causa.message : "No pudimos preparar el pedido." }); }
    finally { setEnviando(false); }
  }
  function agregarFila() {
    actualizar({ filtro: "pendientes", filas: [...filas, { id: crypto.randomUUID(), codigo: "", descripcion_leida: "", texto_original: "Fila agregada manualmente", unidad_principal: "", cj: "", cantidad_ambigua: "", confianza: 0, existe: false, descripcion_catalogo: "", sugerencias: [], posible_servicio: false, incluir: true, revisada: false, cajas: "" }], confirmado: false });
  }
  return <OperationsPage>
    <header className="opt-header"><div><span className="opt-eyebrow">DEL PAPEL AL PEDIDO</span><h1>Fotopicking</h1><p>Una foto, una revisión y su pedido listo.</p></div><Link className="opt-button opt-secondary" to="/optimizacion">Volver al pedido</Link></header>
    <nav className="flow-steps" aria-label="Etapas de Fotopicking">{["Fotografía", "Revisión", "Incorporación"].map((nombre, i) => <button key={nombre} aria-current={etapa === i + 1 ? "step" : undefined} disabled={bloqueado || (i > 0 && !lectura) || (i === 2 && (!elegidas.length || listas.length !== elegidas.length))} onClick={() => actualizar({ etapa: i + 1, error: "" })}><b>{i + 1}</b><span>{nombre}</span></button>)}</nav>
    {error && <div className="opt-alert" role="alert">{error}</div>}
    {aviso && <p className="flow-notice" role="status">{aviso}</p>}
    {etapa === 1 && <section className="opt-panel picking-upload">
      <h2>Fotografíe el picking completo</h2><p className="opt-help">Apoye el papel en una superficie plana, con buena luz.</p>
      <fieldset disabled={bloqueado}>
        <div className="photo-drop"><span className="method-icon">▧</span><label className="opt-label">Elegir fotografía<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => elegirArchivo(e.target.files?.[0] ?? null)} /></label><label className="opt-label camera-input">Usar cámara<input type="file" accept="image/*" capture="environment" onChange={e => elegirArchivo(e.target.files?.[0] ?? null)} /></label><small>JPG, PNG o WebP · Hasta 10 MB</small></div>
        {archivo && preview && <img className="photo-preview" src={preview} alt="Fotografía seleccionada para leer" />}
        <details className="flow-details"><summary>Ajustes de lectura</summary><label className="opt-label">Orientación<select className="opt-input" value={giro} onChange={e => setGiro(e.target.value)}><option value="auto">Automática</option><option value="0">Conservar</option><option value="90">Girar 90°</option><option value="180">Girar 180°</option><option value="270">Girar 270°</option></select></label><label className="flow-check"><input type="checkbox" checked={mejorar} onChange={e => setMejorar(e.target.checked)} /> Corregir sombras e inclinación</label></details>
        <div className="flow-actions"><span>{archivo?.name || "Seleccione una fotografía para empezar"}</span><button className="opt-button opt-primary" disabled={!archivo || bloqueado} onClick={() => void leer()}>{procesando ? "Leyendo fotografía…" : "Leer fotografía"}</button></div>
      </fieldset>{procesando && <p role="status">Leyendo códigos y columnas. Puede tardar alrededor de un minuto.</p>}
    </section>}
    {etapa === 2 && lectura && <>
      <div className="flow-actions"><p>{listas.length} de {elegidas.length} productos revisados</p><button className="opt-button opt-secondary mobile-document" onClick={() => setVerDocumento(!verDocumento)} aria-expanded={verDocumento}>{verDocumento ? "Ocultar documento" : "Ver documento"}</button></div>
      <div className="picking-review">
        <aside className={"opt-panel picking-paper " + (verDocumento ? "document-open" : "")}><h2>Documento original</h2><a href={lectura.imagen} target="_blank" rel="noreferrer" aria-label="Abrir documento ampliado"><img className="photo-preview" src={lectura.imagen} alt="Picking original para comparar los códigos y las cajas" /></a><p className="opt-help">Toque la imagen para ampliarla.</p><details className="flow-details"><summary>Detalles de lectura</summary><pre>{lectura.texto}</pre><p className="opt-help">{lectura.pasos.join(" · ")}</p></details></aside>
        <section className="opt-panel picking-rows"><h2>Revise códigos y cajas</h2><p className="opt-help">Compare con el papel. Las cajas sugeridas todavía necesitan su revisión.</p>
          {catalogo.error && <p role="alert" className="opt-alert">{catalogo.error} <button className="opt-text-button" onClick={catalogo.recargar}>Reintentar catálogo</button></p>}
          <div className="flow-filters" aria-label="Filtrar filas">{[["todas", "Todas"], ["pendientes", "Pendientes"], ["excluidas", "Excluidas"]].map(([id, label]) => <button key={id} className="opt-button opt-secondary" aria-pressed={filtro === id} onClick={() => actualizar({ filtro: id })}>{label}</button>)}</div>
          {!filas.length && <p className="opt-alert">No se encontraron productos. Pruebe otra foto o agregue las filas omitidas.</p>}
          {!!filas.length && !visibles.length && <p className="flow-empty">No hay filas en este filtro.</p>}
          <fieldset disabled={bloqueado}>
            <datalist id="catalogo-ocr">{catalogo.datos?.map(p => <option key={p.codigo} value={p.codigo}>{p.descripcion}</option>)}</datalist>
            <div className="review-cards">{visibles.map(fila => <article key={fila.id} className={"review-card " + (!fila.incluir ? "picking-excluded" : fila.revisada ? "reviewed" : "")}>
              <div className="review-heading"><label className="flow-check"><input type="checkbox" checked={fila.incluir} onChange={e => cambiarFila(fila.id, { incluir: e.target.checked })} /> Incluir producto</label><span className="opt-badge">{!fila.incluir ? "Excluido" : fila.revisada ? "Revisado" : "Por revisar"}</span></div>
              <div className="review-fields"><label className="opt-label">Código<input className="opt-input" list="catalogo-ocr" value={fila.codigo} disabled={!fila.incluir} onChange={e => cambiarFila(fila.id, { codigo: e.target.value })} /></label><label className="opt-label">Cajas<input className="opt-input" type="number" min="1" step="1" inputMode="numeric" value={fila.cajas} disabled={!fila.incluir} placeholder="Confirmar" onChange={e => cambiarFila(fila.id, { cajas: e.target.value })} /></label></div>
              <p className="opt-help">{catalogo.datos?.find(p => p.codigo === fila.codigo.trim())?.descripcion || fila.descripcion_leida}</p>
              {fila.incluir && !existe(fila.codigo) && <p className="picking-warning">Busque el código correcto en el catálogo.</p>}
              {fila.incluir && !!fila.sugerencias.length && <div className="flow-filters"><span className="opt-help">Posibles códigos:</span>{fila.sugerencias.map(c => <button key={c} className="opt-button opt-secondary" onClick={() => cambiarFila(fila.id, { codigo: c })}>{c}</button>)}</div>}
              <details className="flow-details"><summary>Comparar lectura original</summary><p>{fila.texto_original}</p><p>U. Principal: {fila.unidad_principal || "—"} · CJ: {fila.cj || "—"}</p>{fila.cantidad_ambigua && <p>Cifra sin columna: {fila.cantidad_ambigua}</p>}<small>Confianza del texto: {fila.confianza}%. No garantiza que el código sea correcto.</small>{fila.posible_servicio && <p>Posible servicio, excluido inicialmente.</p>}</details>
              {fila.incluir && <label className="flow-check"><input type="checkbox" checked={fila.revisada} disabled={!existe(fila.codigo) || !cajasValidas(fila.cajas)} onChange={e => cambiarFila(fila.id, { revisada: e.target.checked })} /> Código y cajas comprobados</label>}
            </article>)}</div>
            <button className="opt-button opt-secondary" onClick={agregarFila}>Agregar fila omitida</button>
          </fieldset>
        </section>
      </div>
      <div className="flow-actions"><span>{total} cajas revisadas</span><button className="opt-button opt-primary" disabled={bloqueado || !elegidas.length || listas.length !== elegidas.length} onClick={() => actualizar({ etapa: 3 })}>Revisar incorporación</button></div>
    </>}
    {etapa === 3 && lectura && <section className="opt-panel"><h2>Incorporar al pedido</h2><fieldset disabled={bloqueado}>
      {tienePedido && <div className="flow-filters"><button className="opt-button opt-secondary" aria-pressed={!reemplazar} onClick={() => setReemplazar(false)}>Añadir al pedido</button><button className="opt-button opt-secondary" aria-pressed={reemplazar} onClick={() => setReemplazar(true)}>Reemplazar pedido</button></div>}
      {!reemplazar && choferActual ? <p className="flow-notice">Se conserva el chofer: {choferActual}</p> : <label className="opt-label">Camión y chofer<select className="opt-input" value={chofer} onChange={e => actualizar({ chofer: e.target.value })}><option value="">Seleccione un camión</option>{camiones.datos?.map(c => <option key={c.id_camion} value={c.nombre_chofer}>{c.placa} · {c.nombre_chofer} {c.apellido_chofer}</option>)}</select></label>}
      {camiones.error && <p role="alert">{camiones.error} <button className="opt-text-button" onClick={camiones.recargar}>Reintentar</button></p>}
      <ul className="opt-product-list">{[...resumen].map(([codigo, cajas]) => { const anterior = reemplazar ? 0 : productosActuales.find(p => p.codigo === codigo)?.cantidad || 0; return <li key={codigo}><strong>{codigo}</strong><span>{anterior ? anterior + " + " + cajas + " = " : ""}{anterior + cajas} cajas</span></li>; })}</ul>
      <p className="opt-help">{total} cajas {reemplazar ? "en el nuevo pedido" : "para agregar"} · {filas.filter(f => !f.incluir).length} filas excluidas{!reemplazar ? " · Total del pedido: " + (total + productosActuales.reduce((s,p) => s + p.cantidad, 0)) + " cajas" : ""}</p>
      <label className="flow-check"><input type="checkbox" checked={confirmado} onChange={e => actualizar({ confirmado: e.target.checked })} /> Comparé el documento completo y agregué las filas omitidas.</label>
      <div className="flow-actions"><button className="opt-button opt-secondary" onClick={() => actualizar({ etapa: 2 })}>Volver a revisión</button><button className="opt-button opt-primary" onClick={() => void continuar()} disabled={bloqueado || !choferDestino || !confirmado || !elegidas.length || listas.length !== elegidas.length}>{enviando ? "Comprobando…" : reemplazar ? "Reemplazar pedido" : "Añadir al pedido"}</button></div>
    </fieldset></section>}
  </OperationsPage>;
}
