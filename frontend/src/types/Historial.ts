import type { Producto, Resultado } from "./Packing";
export type ResumenCarga = {
  id: string; creado_en: string; chofer: string; placa: string;
  productos_distintos: number; cajas_solicitadas: number; cargadas: number;
  rechazadas: number; ocupacion: number; tiempo_calculo_ms: number;
};
export type DetalleCarga = ResumenCarga & {
  productos: (Producto & { descripcion: string; largo: number; ancho: number; alto: number })[];
  resultado: Resultado;
};
export type Indicadores = {
  optimizaciones: number; cajas_acomodadas: number; cajas_sin_acomodar: number;
  ocupacion_promedio: number; productos_registrados: number; camiones_registrados: number;
  recientes: ResumenCarga[];
};
export const formatoNumero = new Intl.NumberFormat("es-PY", { maximumFractionDigits: 2 });
export function fechaCarga(fecha: string) {
  return new Date(fecha).toLocaleString("es-PY", { dateStyle: "medium", timeStyle: "short" });
}
