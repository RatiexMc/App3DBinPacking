import { useState, type FormEvent } from "react";
import OperationsPage from "../components/OperationsPage";
import { API_URL, apiJson, jsonBody } from "../services/api";
import { cerrarSesion, guardarUsuario, useSesion, type Usuario } from "../context/authStore";
import { guardarPreferencias, usePreferencias } from "../context/preferenciasStore";
import "../styles/cuenta.css";

export default function Configuracion() {
  const { usuario } = useSesion();
  const preferencias = usePreferencias();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  async function realizar(accion: () => Promise<void>, exito: string) {
    setOcupado(true); setError(""); setMensaje("");
    try { await accion(); setMensaje(exito); }
    catch (causa) { setError(causa instanceof Error ? causa.message : "No pudimos guardar los cambios."); }
    finally { setOcupado(false); }
  }
  function guardarNombre(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nombre = String(new FormData(evento.currentTarget).get("nombre"));
    void realizar(async () => guardarUsuario(await apiJson<Usuario>("/auth/perfil", { method: "PATCH", ...jsonBody({ nombre }) })), "Nombre actualizado.");
  }
  function cambiarPassword(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const datos = new FormData(form);
    if (datos.get("nueva") !== datos.get("repetir")) { setError("Las contraseñas nuevas no coinciden."); return; }
    void realizar(async () => {
      await apiJson("/auth/password", { method: "POST", ...jsonBody({ actual: datos.get("actual"), nueva: datos.get("nueva") }) });
      form.reset();
    }, "Contraseña actualizada. Se cerraron las sesiones de otros dispositivos.");
  }
  function subirFoto(archivo?: File) {
    if (!archivo) return;
    if (archivo.size > 5 * 1024 * 1024) { setError("La foto debe pesar como máximo 5 MB."); return; }
    const datos = new FormData(); datos.set("archivo", archivo);
    void realizar(async () => guardarUsuario(await apiJson<Usuario>("/auth/foto", { method: "POST", body: datos })), "Foto de perfil actualizada.");
  }
  if (!usuario) return null;
  return <OperationsPage>
    <header className="opt-header"><div><span className="opt-eyebrow">SU CUENTA</span><h1>Configuración</h1><p>Administre su perfil, contraseña y apariencia.</p></div><span className="opt-badge">{usuario.rol === "admin" ? "Administrador" : "Operador"}</span></header>
    {error && <div className="opt-alert" role="alert">{error}</div>}
    {mensaje && <p className="opt-result-note" role="status">{mensaje}</p>}
    <div className="settings-grid">
      <section className="opt-panel"><h2>Perfil</h2><fieldset disabled={ocupado}>
        <div className="profile-picture">{usuario.foto_revision ? <img src={API_URL + "/auth/foto?v=" + usuario.foto_revision} alt="Foto de perfil" /> : <span>{usuario.nombre.slice(0, 1).toUpperCase()}</span>}<div><label className="opt-label">Cambiar foto<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { subirFoto(e.target.files?.[0]); e.target.value = ""; }} /></label><p className="opt-help">JPG, PNG o WebP · Máximo 5 MB</p>{usuario.foto_revision && <button className="opt-button opt-secondary" onClick={() => void realizar(async () => guardarUsuario(await apiJson<Usuario>("/auth/foto", { method: "DELETE" })), "Foto eliminada.")}>Quitar foto</button>}</div></div>
        <form onSubmit={guardarNombre}><label className="opt-label">Nombre completo<input className="opt-input" name="nombre" defaultValue={usuario.nombre} required minLength={2} maxLength={100} /></label><label className="opt-label">Correo de acceso<input className="opt-input" value={usuario.email} readOnly /></label><p className="opt-help">El correo identifica su cuenta.</p><button className="opt-button opt-primary">Guardar perfil</button></form>
      </fieldset></section>
      <section className="opt-panel"><h2>Seguridad</h2><p className="opt-help">Para cambiar su contraseña necesitamos comprobar la actual.</p><form onSubmit={cambiarPassword}><fieldset disabled={ocupado}>
        <label className="opt-label">Contraseña actual<input className="opt-input" type="password" name="actual" required autoComplete="current-password" maxLength={128} /></label>
        <label className="opt-label">Nueva contraseña<input className="opt-input" type="password" name="nueva" required minLength={10} maxLength={128} autoComplete="new-password" /></label>
        <label className="opt-label">Repetir nueva contraseña<input className="opt-input" type="password" name="repetir" required minLength={10} maxLength={128} autoComplete="new-password" /></label>
        <p className="opt-help">Entre 10 y 128 caracteres. Se cerrarán las otras sesiones.</p><button className="opt-button opt-primary">Cambiar contraseña</button>
      </fieldset></form></section>
      <section className="opt-panel"><h2>Apariencia</h2><label className="opt-label">Tema de la interfaz<select className="opt-input" value={preferencias.oscuro ? "oscuro" : "claro"} onChange={e => { const ok = guardarPreferencias({ oscuro: e.target.value === "oscuro" }); setMensaje(ok ? "Apariencia guardada en este navegador." : "Apariencia aplicada; no se pudo guardar en este navegador."); }}><option value="claro">Claro</option><option value="oscuro">Oscuro</option></select></label></section>
      <section className="opt-panel"><h2>Sesión</h2><p className="opt-help">Sus optimizaciones guardadas permanecen en PostgreSQL. El borrador de carga se conserva para su cuenta en esta pestaña.</p><button className="opt-button opt-secondary" disabled={ocupado} onClick={() => void realizar(cerrarSesion, "")}>Cerrar sesión</button></section>
    </div>
  </OperationsPage>;
}

