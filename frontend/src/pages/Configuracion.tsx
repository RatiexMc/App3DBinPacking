
import { useState } from "react";
import { Link } from "react-router-dom";
import OperationsPage from "../components/OperationsPage";
import { guardarPreferencias, usePreferencias } from "../context/preferenciasStore";
import { useCampoCarga } from "../context/cargaStore";

export default function Configuracion() {
  const preferencias = usePreferencias();
  const [manualVisible, setManualVisible] = useCampoCarga("manualVisible");
  const [calculando] = useCampoCarga("calculando");
  const [mensaje, setMensaje] = useState("");
  function guardar(cambios: Parameters<typeof guardarPreferencias>[0]) {
    const ok = guardarPreferencias(cambios);
    setMensaje(ok ? "Preferencias guardadas en este navegador." : "Los cambios se aplicaron, pero el navegador no permitió guardarlos para la próxima visita.");
  }
  return <OperationsPage>
    <header className="opt-header"><div><span className="opt-eyebrow">PREFERENCIAS DEL SISTEMA</span><h1>Configuración</h1><p>Personalice la interfaz y la forma de revisar sus cargas.</p></div><Link className="opt-button opt-secondary" to="/optimizacion">Ir a Optimización</Link></header>
    {mensaje && <p className="opt-result-note" role="status">{mensaje}</p>}
    <div className="settings-grid">
      <section className="opt-panel"><div className="opt-panel-heading"><h2>Apariencia</h2></div>
        <label className="opt-label" htmlFor="tema-sitio">Tema de la interfaz</label>
        <select id="tema-sitio" className="opt-input" value={preferencias.oscuro ? "oscuro" : "claro"} onChange={e => guardar({ oscuro: e.target.value === "oscuro" })}><option value="claro">Claro</option><option value="oscuro">Oscuro</option></select>
        <p className="opt-help">Se aplica a todas las pantallas y se conserva al recargar.</p>
      </section>
      <section className="opt-panel"><div className="opt-panel-heading"><h2>Ingreso del pedido</h2></div>
        <label className="settings-check"><input type="checkbox" checked={manualVisible} disabled={calculando} onChange={e => { setManualVisible(e.target.checked); guardar({ manualVisible: e.target.checked }); }} /> Mostrar el formulario de ingreso manual</label>
        <p className="opt-help">Ocultarlo conserva los productos y resultados. Puede volver a abrirlo desde Optimización.</p>
      </section>
      <section className="opt-panel"><div className="opt-panel-heading"><h2>Visualización 3D</h2></div>
        <label className="settings-check"><input type="checkbox" checked={preferencias.bordes} onChange={e => guardar({ bordes: e.target.checked })} /> Mostrar bordes de las cajas</label>
        <label className="opt-label" htmlFor="opacidad-cajas">Opacidad de las cajas: {Math.round(preferencias.opacidad * 100)}%</label>
        <input id="opacidad-cajas" className="settings-range" type="range" min="20" max="100" step="1" value={Math.round(preferencias.opacidad * 100)} onChange={e => guardar({ opacidad: Number(e.target.value) / 100 })} />
        <p className="opt-help">Una menor opacidad ayuda a inspeccionar el interior. Solo cambia el dibujo; no modifica la ocupación calculada.</p>
      </section>
      <section className="opt-panel"><div className="opt-panel-heading"><h2>Reglas del cálculo</h2><span className="opt-badge">Aplicadas en el servidor</span></div>
        <ul className="settings-rules"><li>Medidas de cajas y camiones en centímetros.</li><li>Sin superposición ni cajas fuera del camión.</li><li>Base de cada caja apoyada completamente en el piso u otras cajas.</li><li>No colocar una categoría más pesada sobre una más liviana.</li><li>No apoyar cajas sobre productos marcados como no apilables.</li></ul>
        <p className="opt-help">Estas comprobaciones geométricas no calculan resistencia del embalaje ni peso real cuando solo hay categorías. Los resultados antiguos conservan las reglas con las que fueron generados.</p>
      </section>
    </div>
    <section className="opt-panel settings-next"><div className="opt-panel-heading"><h2>Próximas integraciones</h2></div>
      <p className="opt-help">Lectura OCR del picking, inicio de sesión, registro y perfil de usuario todavía no están habilitados. Primero definiremos sus datos, permisos y pruebas.</p>
      <p className="opt-help">El historial se guarda en PostgreSQL. Las preferencias de esta pantalla son locales a este navegador.</p>
    </section>
  </OperationsPage>;
}
