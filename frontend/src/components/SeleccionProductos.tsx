import { useState } from "react";
import { useConsulta } from "../hooks/useConsulta";
import { useCampoCarga } from "../context/cargaStore";
import type { Producto } from "../types/Packing";

export type Articulo = { codigo: string; descripcion: string; optimizaciones?: number };
export default function SeleccionProductos({ frecuentes, bloqueado, agregar }: {
  frecuentes: boolean; bloqueado: boolean; agregar: (productos: Producto[]) => void;
}) {
  const consulta = useConsulta<Articulo[]>(frecuentes ? "/productos/frecuentes" : "/productos");
  const [seleccion, setSeleccion] = useCampoCarga("seleccion");
  const [busqueda, setBusqueda] = useCampoCarga("busqueda");
  const [, setMetodo] = useCampoCarga("metodo");
  const [pagina, setPagina] = useState(0);
  const [error, setError] = useState("");
  const filtrados = (consulta.datos || []).filter(p => (p.codigo + " " + p.descripcion).toLocaleLowerCase().includes(busqueda.toLocaleLowerCase()));
  const ultima = Math.max(0, Math.ceil(filtrados.length / 10) - 1);
  const actual = Math.min(pagina, ultima);
  const elegidos = Object.entries(seleccion);
  function confirmar() {
    if (elegidos.some(([, n]) => !Number.isSafeInteger(Number(n)) || Number(n) <= 0)) {
      setError("Indique un número entero de cajas mayor que cero en cada producto seleccionado."); return;
    }
    agregar(elegidos.map(([codigo, n]) => ({ codigo, cantidad: Number(n) })));
  }
  return <section className="method-content" aria-label={frecuentes ? "Mis frecuentes" : "Catálogo"}>
    <div className="opt-panel-heading"><div><h2>{frecuentes ? "Mis frecuentes" : "Catálogo de productos"}</h2><p className="opt-help">{frecuentes ? "Los más usados en sus optimizaciones. Elija cuántas cajas agregar." : "Busque, seleccione e indique las cajas que necesita."}</p></div><span className="opt-badge">{elegidos.length} seleccionados</span></div>
    <label className="opt-label" htmlFor="buscar-productos">Buscar producto</label>
    <input className="opt-input" id="buscar-productos" placeholder="Código o descripción" value={busqueda} disabled={bloqueado} onChange={e => { setBusqueda(e.target.value); setPagina(0); }} />
    {consulta.cargando && <p role="status" className="opt-help">Cargando productos…</p>}
    {consulta.error && <p role="alert" className="opt-alert">{consulta.error} <button className="opt-text-button" onClick={consulta.recargar}>Reintentar</button></p>}
    {!consulta.cargando && !consulta.error && !filtrados.length && <div className="flow-empty"><h3>{frecuentes && !busqueda ? "Sus frecuentes aparecerán aquí" : "Sin coincidencias"}</h3><p>Puede agregar productos desde el catálogo o buscar otro código.</p>{frecuentes && <button className="opt-button opt-secondary" onClick={() => { setBusqueda(""); setMetodo("catalogo"); }}>Abrir catálogo</button>}</div>}
    {!!filtrados.length && <table className="selection-table"><thead><tr><th>Elegir</th><th>Producto</th><th>Cajas a agregar</th></tr></thead><tbody>{filtrados.slice(actual * 10, actual * 10 + 10).map(p => <tr key={p.codigo} className={p.codigo in seleccion ? "selected" : ""}>
      <td><input type="checkbox" aria-label={"Seleccionar " + p.codigo} checked={p.codigo in seleccion} disabled={bloqueado} onChange={e => { const next = { ...seleccion }; if (e.target.checked) next[p.codigo] = "1"; else delete next[p.codigo]; setSeleccion(next); }} /></td>
      <td><strong>{p.codigo}</strong><span>{p.descripcion}</span>{p.optimizaciones !== undefined && <small>{p.optimizaciones} optimizaciones</small>}</td>
      <td><label className="mobile-label" htmlFor={"cajas-" + p.codigo}>Cajas a agregar</label><input id={"cajas-" + p.codigo} aria-label={"Cajas de " + p.codigo} className="opt-input" type="number" min="1" step="1" inputMode="numeric" disabled={bloqueado || !(p.codigo in seleccion)} value={seleccion[p.codigo] ?? ""} onChange={e => setSeleccion({ ...seleccion, [p.codigo]: e.target.value })} /></td>
    </tr>)}</tbody></table>}
    {filtrados.length > 10 && <nav className="flow-actions" aria-label="Páginas del catálogo"><button className="opt-button opt-secondary" disabled={!actual} onClick={() => setPagina(actual - 1)}>Anterior</button><span>{actual + 1} / {ultima + 1}</span><button className="opt-button opt-secondary" disabled={actual === ultima} onClick={() => setPagina(actual + 1)}>Siguiente</button></nav>}
    {error && <p role="alert" className="opt-alert">{error}</p>}
    {!!elegidos.length && <div className="flow-actions"><button className="opt-text-button" disabled={bloqueado} onClick={() => setSeleccion({})}>Limpiar selección</button><button className="opt-button opt-primary" disabled={bloqueado} onClick={confirmar}>Agregar {elegidos.length} al pedido</button></div>}
  </section>;
}
