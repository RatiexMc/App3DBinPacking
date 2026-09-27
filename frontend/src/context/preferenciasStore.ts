import { useSyncExternalStore } from "react";
type Preferencias = { oscuro: boolean; bordes: boolean; opacidad: number; manualVisible: boolean };
const defecto: Preferencias = { oscuro: false, bordes: true, opacidad: 0.92, manualVisible: true };
const clave = "darnel.preferencias.v1";
function leer(): Preferencias {
  try {
    const datos = JSON.parse(localStorage.getItem(clave) || "null");
    return {
      oscuro: typeof datos?.oscuro === "boolean" ? datos.oscuro : defecto.oscuro,
      bordes: typeof datos?.bordes === "boolean" ? datos.bordes : defecto.bordes,
      opacidad: typeof datos?.opacidad === "number" && datos.opacidad >= 0.2 && datos.opacidad <= 1 ? datos.opacidad : defecto.opacidad,
      manualVisible: typeof datos?.manualVisible === "boolean" ? datos.manualVisible : defecto.manualVisible,
    };
  } catch { return defecto; }
}
let preferencias = leer();
const listeners = new Set<() => void>();
export function obtenerPreferencias() { return preferencias; }
export function guardarPreferencias(cambios: Partial<Preferencias>): boolean {
  preferencias = { ...preferencias, ...cambios };
  let guardado = true;
  try { localStorage.setItem(clave, JSON.stringify(preferencias)); } catch { guardado = false; }
  listeners.forEach(listener => listener());
  return guardado;
}
export function usePreferencias() {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, obtenerPreferencias);
}
