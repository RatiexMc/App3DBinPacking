import { useSyncExternalStore } from "react";
import { esResultado, registro, type Producto, type Resultado } from "../types/Packing";
import { obtenerPreferencias } from "./preferenciasStore";

type EstadoCarga = {
  etapa: number; metodo: string; seleccion: Record<string, string>; busqueda: string;
  solicitudId: string;
  chofer: string; codigo: string; cantidad: string; productos: Producto[];
  resultado: Resultado | null; editando: string | null; manualVisible: boolean;
  error: string; faltantes: string[]; calculando: boolean; aviso: string; avisoPersistencia: string;
};
let clave = "";
let usuarioCarga: string | null = null;
const inicial: EstadoCarga = {
  etapa: 1, metodo: "", seleccion: {}, busqueda: "",
  solicitudId: crypto.randomUUID(),
  chofer: "", codigo: "", cantidad: "1", productos: [], resultado: null,
  editando: null, manualVisible: obtenerPreferencias().manualVisible, error: "", faltantes: [], calculando: false,
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
      etapa: guardado.etapa === 3 && resultado ? 3 : guardado.etapa === 2 ? 2 : 1,
      metodo: typeof guardado.metodo === "string" ? guardado.metodo : guardado.manualVisible ? "manual" : "",
      seleccion: registro(guardado.seleccion) ? Object.fromEntries(Object.entries(guardado.seleccion).filter(([,v]) => typeof v === "string")) as Record<string, string> : {},
      busqueda: typeof guardado.busqueda === "string" ? guardado.busqueda : "",
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
let estado = { ...inicial };
const listeners = new Set<() => void>();
export const enCurso: { current: boolean; id: string | null } = { current: false, id: null };
function suscribir(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function actualizar<K extends keyof EstadoCarga>(campo: K, valor: EstadoCarga[K]) {
  estado = { ...estado, [campo]: valor };
  try {
    if (!clave) return;
    sessionStorage.setItem(clave, JSON.stringify({
      solicitudId: estado.solicitudId,
      etapa: estado.etapa, metodo: estado.metodo, seleccion: estado.seleccion, busqueda: estado.busqueda,
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
  const propietario = usuarioCarga;
  // Una respuesta tardía de la cuenta anterior no debe modificar el nuevo pedido.
  return [actual[campo], valor => { if (propietario === usuarioCarga) actualizar(campo, valor); }];
}

export function cambiarUsuarioCarga(id: string | null) {
  if (id === usuarioCarga) return;
  usuarioCarga = id;
  clave = id ? "darnel.carga-en-curso.v2." + id : "";
  estado = id ? recuperar() : { ...inicial, solicitudId: crypto.randomUUID() };
  enCurso.current = false;
  enCurso.id = null;
  listeners.forEach(fn => fn());
}

export function importarPicking(productos: Producto[], chofer: string, reemplazar = false) {
  if (!usuarioCarga || enCurso.current) throw new Error("Espere a que termine el cálculo antes de importar.");
  const cantidades = new Map((reemplazar ? [] : estado.productos).map(p => [p.codigo, p.cantidad]));
  for (const p of productos) {
    const cantidad = (cantidades.get(p.codigo) || 0) + p.cantidad;
    if (!Number.isSafeInteger(cantidad) || cantidad <= 0) throw new Error("La cantidad total de cajas no es válida.");
    cantidades.set(p.codigo, cantidad);
  }
  estado = { ...(reemplazar ? inicial : estado), solicitudId: crypto.randomUUID(),
    productos: [...cantidades].map(([codigo, cantidad]) => ({ codigo, cantidad })),
    chofer: !reemplazar && estado.chofer ? estado.chofer : chofer,
    resultado: null, error: "", faltantes: [], etapa: 2, manualVisible: false };
  actualizar("aviso", "Picking revisado y listo para optimizar.");
}
