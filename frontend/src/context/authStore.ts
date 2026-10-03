import { useSyncExternalStore } from "react";
import { apiJson, jsonBody } from "../services/api";
import { cambiarUsuarioCarga } from "./cargaStore";
import { cambiarUsuarioPicking } from "./pickingStore";

export type Usuario = { id: string; nombre: string; email: string; rol: "admin" | "operador"; foto_revision: string | null };
type Sesion = { usuario: Usuario | null; cargando: boolean; error: string };
let estado: Sesion = { usuario: null, cargando: true, error: "" };
const listeners = new Set<() => void>();
let comprobacion: Promise<void> | null = null;
function suscribir(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
function publicar(cambios: Partial<Sesion>) { estado = { ...estado, ...cambios }; listeners.forEach(fn => fn()); }

export function guardarUsuario(usuario: Usuario | null) {
  cambiarUsuarioCarga(usuario?.id ?? null);
  cambiarUsuarioPicking(usuario?.id ?? null);
  publicar({ usuario, cargando: false, error: "" });
}

export function comprobarSesion() {
  // StrictMode puede montar dos veces; compartimos la misma consulta.
  if (comprobacion) return comprobacion;
  publicar({ cargando: true });
  comprobacion = (async () => {
    try { guardarUsuario(await apiJson<Usuario>("/auth/me")); }
    catch (error) {
      guardarUsuario(null);
      publicar({ error: error instanceof Error ? error.message : "No pudimos comprobar la sesión." });
    } finally { comprobacion = null; }
  })();
  return comprobacion;
}

export async function acceder(registro: boolean, datos: { email: string; password: string; nombre?: string }) {
  guardarUsuario(await apiJson<Usuario>(registro ? "/auth/registro" : "/auth/login", { method: "POST", ...jsonBody(datos) }));
}
export async function cerrarSesion() {
  await apiJson("/auth/logout", { method: "POST" });
  guardarUsuario(null);
}
window.addEventListener("darnel:sesion-vencida", () => guardarUsuario(null));
export function useSesion() { return useSyncExternalStore(suscribir, () => estado); }
