import { useSyncExternalStore } from "react";

export type FilaOCR = {
  codigo: string; descripcion_leida: string; texto_original: string;
  unidad_principal: string; cj: string; cantidad_ambigua: string;
  confianza: number; existe: boolean; descripcion_catalogo: string;
  cj_identificada?: boolean; ubicacion?: { x: number; y: number; ancho: number; alto: number }; cajas_sugeridas?: number | null;
  sugerencias: string[]; posible_servicio: boolean;
};
export type LecturaOCR = { filas: FilaOCR[]; texto: string; imagen: string; pasos: string[]; aviso: string };
export type FilaRevision = FilaOCR & { id: string; cajas: string; incluir: boolean; revisada: boolean };
type Estado = { etapa: number; filtro: string; lectura: LecturaOCR | null; filas: FilaRevision[]; chofer: string; nombreArchivo: string; procesando: boolean; error: string; aviso: string; confirmado: boolean };
const vacio: Estado = { etapa: 1, filtro: "todas", lectura: null, filas: [], chofer: "", nombreArchivo: "", procesando: false, error: "", aviso: "", confirmado: false };
let propietario: string | null = null;
let estado = { ...vacio };
const listeners = new Set<() => void>();
function suscribir(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export function cambiarUsuarioPicking(id: string | null) {
  if (id === propietario) return;
  propietario = id; estado = { ...vacio };
  if (id) {
    try {
      const datos = JSON.parse(sessionStorage.getItem("darnel.picking.v1." + id) || "null");
      if (datos && Array.isArray(datos.filas) && datos.lectura && typeof datos.lectura.imagen === "string") {
        estado = { ...vacio, ...datos, procesando: false, confirmado: false, error: "" };
      }
    } catch { /* Un borrador dañado no impide abrir la pantalla. */ }
  }
  listeners.forEach(fn => fn());
}
export function usePicking() {
  const actual = useSyncExternalStore(suscribir, () => estado);
  const cuenta = propietario;
  function actualizar(cambios: Partial<Estado>) {
    if (!cuenta || cuenta !== propietario) return;
    estado = { ...estado, ...cambios };
    try { sessionStorage.setItem("darnel.picking.v1." + cuenta, JSON.stringify({ ...estado, procesando: false, confirmado: false })); }
    catch { estado.aviso = "La revisión se conserva al navegar, pero no pudo guardarse para recargar esta pestaña."; }
    listeners.forEach(fn => fn());
  }
  return [actual, actualizar] as const;
}
