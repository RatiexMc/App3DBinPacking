
import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OperationsPage from "../components/OperationsPage";
import HistorialTable from "../components/HistorialTable";
import PackingPlot from "../components/PackingPlot";
import { useConsulta } from "../hooks/useConsulta";
import { esResultado } from "../types/Packing";
import { fechaCarga, formatoNumero, type ResumenCarga, type DetalleCarga } from "../types/Historial";

export default function Historial() {
  const [params, setParams] = useSearchParams();
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const detalleRef = useRef<HTMLDivElement>(null);
  const id = params.get("carga");
  const lista = useConsulta<{ total: number; items: ResumenCarga[] }>("/historial?limite=20&offset=" + pagina * 20 + "&busqueda=" + encodeURIComponent(busqueda));
  const detalle = useConsulta<DetalleCarga>(id ? "/historial/" + encodeURIComponent(id) : null);
  const carga = detalle.datos;
  return <OperationsPage>
    <header className="opt-header"><div><span className="opt-eyebrow">TRAZABILIDAD DE CARGAS</span><h1>Historial de optimizaciones</h1><p>Consulte los pedidos y las distribuciones guardadas en PostgreSQL.</p></div><Link className="opt-button opt-secondary" to="/optimizacion">Volver al pedido en curso</Link></header>
    <section className="opt-panel">
      <div className="ops-toolbar"><form className="ops-search" onSubmit={evento => { evento.preventDefault(); setPagina(0); setBusqueda(texto.trim()); }}><div><label className="opt-label" htmlFor="buscar-cargas">Buscar por chofer o placa</label><input id="buscar-cargas" className="opt-input" value={texto} onChange={evento => setTexto(evento.target.value)} placeholder="Nombre del chofer o placa" /></div><button className="opt-button opt-secondary" type="submit">Buscar</button></form>
        <button className="opt-text-button" onClick={lista.recargar}>Actualizar historial</button>
      </div>
      {lista.cargando && <p className="ops-loading" role="status">Consultando historial…</p>}
      {lista.error && <div className="opt-alert" role="alert">{lista.error}<button className="opt-text-button" onClick={lista.recargar}>Volver a intentar</button></div>}
      {lista.datos && <>{lista.datos.items.length ? <HistorialTable items={lista.datos.items} /> : <div className="opt-list-empty"><strong>{busqueda ? "No hay cargas que coincidan con la búsqueda" : "Todavía no hay optimizaciones guardadas"}</strong><p>{busqueda ? "Pruebe con otro nombre o placa." : "Los próximos cálculos se guardarán automáticamente aquí."}</p></div>}
        <div className="ops-pagination"><span>{lista.datos.total} registros</span><button className="opt-button opt-secondary" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</button><span>Página {pagina + 1}</span><button className="opt-button opt-secondary" disabled={(pagina + 1) * 20 >= lista.datos.total} onClick={() => setPagina(pagina + 1)}>Siguiente</button></div></>}
    </section>
    {id && <section className="opt-panel ops-detail" ref={detalleRef} aria-label="Detalle de la carga">
      <div className="opt-panel-heading"><h2>Distribución guardada</h2><button className="opt-text-button" onClick={() => setParams({})}>Cerrar detalle</button></div>
      {detalle.cargando && <p role="status">Abriendo el resultado…</p>}
      {detalle.error && <div className="opt-alert" role="alert">{detalle.error}<button className="opt-text-button" onClick={detalle.recargar}>Volver a intentar</button></div>}
      {carga && <><div className="ops-detail-meta"><span><strong>{carga.placa}</strong> · {carga.chofer}</span><span>{fechaCarga(carga.creado_en)}</span><span>{formatoNumero.format(carga.ocupacion)}% de ocupación</span><span>{carga.cargadas} / {carga.cajas_solicitadas} cajas acomodadas</span></div>
        <p className="opt-help">Esta es una copia del cálculo original. Consultarla no cambia su pedido en curso.</p>
        {esResultado(carga.resultado) ? <PackingPlot cajas={carga.resultado.cajas} camion={carga.resultado.camion} /> : <p role="alert">No pudimos interpretar la distribución guardada.</p>}
        <h3>Productos solicitados</h3><div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Código</th><th>Descripción</th><th>Cajas solicitadas</th><th>Medidas originales (cm)</th></tr></thead><tbody>{carga.productos.map((p, indice) => <tr key={p.codigo + indice}><td>{p.codigo}</td><td>{p.descripcion}</td><td>{p.cantidad}</td><td>{p.largo} × {p.ancho} × {p.alto}</td></tr>)}</tbody></table></div>
        <p className="opt-footnote">Tiempo del cálculo: {formatoNumero.format(carga.tiempo_calculo_ms / 1000)} s. No representa el tiempo de carga física del camión.</p>
      </>}
    </section>}
  </OperationsPage>;
}

