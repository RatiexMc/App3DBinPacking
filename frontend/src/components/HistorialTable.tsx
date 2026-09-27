import { Link } from "react-router-dom";
import { fechaCarga, formatoNumero, type ResumenCarga } from "../types/Historial";

export default function HistorialTable({ items }: { items: ResumenCarga[] }) {
  return <div className="ops-table-scroll"><table className="ops-table"><thead><tr>
    <th>Fecha del cálculo</th><th>Camión / chofer</th><th>Cajas</th><th>Ocupación</th><th>Resultado</th><th><span className="opt-sr-only">Acciones</span></th>
  </tr></thead><tbody>{items.map(item => <tr key={item.id}>
    <td>{fechaCarga(item.creado_en)}</td><td><strong>{item.placa}</strong><small>{item.chofer}</small></td>
    <td>{item.cargadas} / {item.cajas_solicitadas}<small>acomodadas</small></td>
    <td><strong>{formatoNumero.format(item.ocupacion)}%</strong><div className="ops-bar"><span style={{ width: Math.max(0, Math.min(100, item.ocupacion)) + "%" }} /></div></td>
    <td><span className="opt-badge">{item.rechazadas ? item.rechazadas + " sin acomodar" : "Pedido completo"}</span></td>
    <td><Link className="opt-text-button" aria-label={"Ver carga de " + item.chofer + " del " + fechaCarga(item.creado_en)} to={"/historial?carga=" + item.id}>Ver detalle →</Link></td>
  </tr>)}</tbody></table></div>;
}
