import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import OperationsPage from "../components/OperationsPage";
import { acceder, useSesion } from "../context/authStore";
import "../styles/cuenta.css";

export default function Acceso({ registro = false }: { registro?: boolean }) {
  const { usuario, cargando } = useSesion();
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [visible, setVisible] = useState(false);
  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado) return;
    const form = new FormData(evento.currentTarget);
    const password = String(form.get("password"));
    if (registro && password !== form.get("confirmacion")) { setError("Las contraseñas no coinciden."); return; }
    setOcupado(true); setError("");
    try { await acceder(registro, { email: String(form.get("email")), password, ...(registro ? { nombre: String(form.get("nombre")) } : {}) }); }
    catch (causa) { setError(causa instanceof Error ? causa.message : "No pudimos iniciar sesión."); }
    finally { setOcupado(false); }
  }
  if (cargando) return <p className="session-loading" role="status">Comprobando sesión…</p>;
  if (usuario) return <Navigate to="/" replace />;
  return <OperationsPage>
    <div className="account-entry">
      <header className="account-brand"><strong>Darnel<span>Paraguay</span></strong><p>Planificación de carga</p></header>
      <section className="opt-panel account-form">
        <h1>{registro ? "Crear una cuenta" : "Iniciar sesión"}</h1>
        <p className="opt-help">{registro ? "Sus pedidos quedarán asociados a su cuenta." : "Ingrese para continuar con la planificación."}</p>
        {error && <div className="opt-alert" role="alert">{error}</div>}
        <form key={registro ? "registro" : "login"} onSubmit={enviar}>
          <fieldset disabled={ocupado}>
            {registro && <label className="opt-label">Nombre completo<input className="opt-input" name="nombre" autoComplete="name" required minLength={2} maxLength={100} /></label>}
            <label className="opt-label">Correo electrónico<input className="opt-input" name="email" type="email" autoComplete="email" required maxLength={254} /></label>
            <label className="opt-label">Contraseña<input className="opt-input" name="password" type={visible ? "text" : "password"} autoComplete={registro ? "new-password" : "current-password"} required minLength={registro ? 10 : 1} maxLength={128} /></label>
            {registro && <><p className="opt-help">Use entre 10 y 128 caracteres. Puede utilizar una frase que recuerde.</p><label className="opt-label">Repetir contraseña<input className="opt-input" name="confirmacion" type={visible ? "text" : "password"} autoComplete="new-password" required minLength={10} maxLength={128} /></label></>}
            <label className="settings-check"><input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} /> Mostrar contraseña</label>
            <button className="opt-button opt-primary account-submit" type="submit">{ocupado ? "Espere un momento…" : registro ? "Crear cuenta" : "Entrar"}</button>
          </fieldset>
        </form>
        <p className="opt-help">{registro ? "¿Ya tiene cuenta? " : "¿Primera vez? "}<Link to={registro ? "/login" : "/registro"} onClick={() => setError("")}>{registro ? "Iniciar sesión" : "Crear una cuenta"}</Link></p>
      </section>
      <footer className="account-footer">Sistema de optimización de carga · Darnel Paraguay</footer>
    </div>
  </OperationsPage>;
}

