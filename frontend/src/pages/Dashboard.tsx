
import { Link } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import OperationsPage from "../components/OperationsPage";
import HistorialTable from "../components/HistorialTable";
import { useConsulta } from "../hooks/useConsulta";
import { formatoNumero, type Indicadores } from "../types/Historial";

export default function Dashboard() {
  const { datos, cargando, error, recargar } = useConsulta<Indicadores>("/dashboard");
  return <OperationsPage>
    <header className="opt-header"><div><span className="opt-eyebrow">OPERACIÓN LOGÍSTICA</span><h1>Resumen de planificación</h1><p>Indicadores de las distribuciones calculadas y guardadas en el sistema.</p></div>
      <Link className="opt-button opt-primary" style={{ width: "auto" }} to="/optimizacion">Ir a Optimización <ArrowForwardIcon fontSize="small" /></Link>
    </header>
    {error && <div className="opt-alert" role="alert"><p>{error}</p><button className="opt-text-button" onClick={recargar}>Volver a intentar</button></div>}
    {cargando && <p className="ops-loading" role="status">Consultando indicadores…</p>}
    {datos && <>
      <div className="opt-metrics ops-dashboard-metrics">
        <div className="opt-metric"><span>Optimizaciones guardadas</span><strong>{formatoNumero.format(datos.optimizaciones)}</strong><small>Desde el inicio del historial</small></div>
        <div className="opt-metric"><span>Ocupación promedio</span><strong>{datos.optimizaciones ? formatoNumero.format(datos.ocupacion_promedio) + "%" : "—"}</strong><small>Promedio por optimización</small></div>
        <div className="opt-metric"><span>Cajas acomodadas</span><strong>{formatoNumero.format(datos.cajas_acomodadas)}</strong><small>Suma de los cálculos guardados</small></div>
        <div className="opt-metric"><span>Cajas sin acomodar</span><strong>{formatoNumero.format(datos.cajas_sin_acomodar)}</strong><small>En las distribuciones calculadas</small></div>
      </div>
      <div className="ops-context"><Link to="/productos">{datos.productos_registrados} productos registrados →</Link><Link to="/camiones">{datos.camiones_registrados} camiones registrados →</Link></div>
      <section className="opt-panel"><div className="opt-panel-heading"><div><span className="opt-eyebrow">ACTIVIDAD RECIENTE</span><h2>Últimas optimizaciones</h2></div><Link className="opt-text-button" to="/historial">Ver historial →</Link></div>
        {datos.recientes.length ? <HistorialTable items={datos.recientes} /> : <div className="opt-list-empty"><strong>Todavía no hay optimizaciones guardadas</strong><p>Complete una carga en Optimización para ver aquí sus resultados.</p><Link className="opt-text-button" to="/optimizacion">Preparar un pedido →</Link></div>}
      </section>
      <p className="opt-footnote">Estos indicadores describen planes de carga calculados, no despachos confirmados ni viajes realizados. Los cálculos anteriores a la incorporación del historial no están registrados.</p>
    </>}
  </OperationsPage>;
}

