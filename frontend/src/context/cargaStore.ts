import { useSyncExternalStore } from "react";
import { esResultado, registro, type Producto, type Resultado } from "../types/Packing";

type EstadoCarga = {
  solicitudId: string;
  chofer: string; codigo: string; cantidad: string; productos: Producto[];
  resultado: Resultado | null; editando: string | null; manualVisible: boolean;
  error: string; faltantes: string[]; calculando: boolean; aviso: string; avisoPersistencia: string;
};
const clave = "darnel.carga-en-curso.v1";
const inicial: EstadoCarga = {
  solicitudId: crypto.randomUUID(),
  chofer: "", codigo: "", cantidad: "1", productos: [], resultado: null,
  editando: null, manualVisible: true, error: "", faltantes: [], calculando: false,
  aviso: "", avisoPersistencia: "",
};
function recuperar(): EstadoCarga {
  try {
    const guardado: unknown = JSON.parse(sessionStorage.getItem(clave) || "null");
    if (!registro(guardado)) return inicial;
    const productos: Producto[] = Array.isArray(guardado.productos)
      ? guardado.productos.filter((p): p is Producto => registro(p) && typeof p.codigo === "string" && typeof p.cantidad === "number" && Number.isSafeInteger(p.cantidad) && p.cantidad > 0) : [];
    const resultado = esResultado(guardado.resultado) ? guardado.resultado : null;
    return {
      ...inicial, productos,
      solicitudId: typeof guardado.solicitudId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guardado.solicitudId) ? guardado.solicitudId : inicial.solicitudId,
      resultado: resultado && resultado.cargadas + resultado.rechazadas === productos.reduce((s, p) => s + p.cantidad, 0) ? resultado : null,
      chofer: typeof guardado.chofer === "string" ? guardado.chofer : "",
      codigo: typeof guardado.codigo === "string" ? guardado.codigo : "",
      cantidad: typeof guardado.cantidad === "string" ? guardado.cantidad : "1",
      editando: typeof guardado.editando === "string" ? guardado.editando : null,
      manualVisible: typeof guardado.manualVisible === "boolean" ? guardado.manualVisible : true,
    };
  } catch { return inicial; }
}

// Vive fuera de la pantalla: navegar no destruye el pedido ni una solicitud en curso.
let estado = recuperar();
const listeners = new Set<() => void>();
export const enCurso = { current: false };
function suscribir(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function actualizar<K extends keyof EstadoCarga>(campo: K, valor: EstadoCarga[K]) {
  estado = { ...estado, [campo]: valor };
  try {
    sessionStorage.setItem(clave, JSON.stringify({
      solicitudId: estado.solicitudId,
      chofer: estado.chofer, codigo: estado.codigo, cantidad: estado.cantidad,
      productos: estado.productos, resultado: estado.resultado,
      editando: estado.editando, manualVisible: estado.manualVisible,
    }));
    estado.avisoPersistencia = "";
  } catch {
    estado.avisoPersistencia = "Su pedido se conserva al navegar, pero el navegador no pudo guardar una copia para recargar la página. No cierre esta pestaña antes de terminar.";
  }
  listeners.forEach(listener => listener());
}
export function useCampoCarga<K extends keyof EstadoCarga>(campo: K): [EstadoCarga[K], (valor: EstadoCarga[K]) => void] {
  const actual = useSyncExternalStore(suscribir, () => estado);
  return [actual[campo], valor => actualizar(campo, valor)];
}
