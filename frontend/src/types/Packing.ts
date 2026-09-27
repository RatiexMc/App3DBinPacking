export type Producto = { codigo: string; cantidad: number };
export type Caja = { nombre: string; x: number; y: number; z: number; largo: number; ancho: number; alto: number };
export type Resultado = {
  motor_version?: string; estrategia?: string;
  sin_acomodar?: { codigo: string; descripcion: string; cantidad: number; motivo: string }[];
  historial_id?: string; historial_guardado?: boolean; aviso_historial?: string;
  cargadas: number; rechazadas: number; ocupacion: number;
  camion: { largo: number; ancho: number; alto: number; placa?: string; chofer?: string };
  cajas: Caja[];
};
export const registro = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === "object" && valor !== null;
const numero = (valor: unknown): valor is number =>
  typeof valor === "number" && Number.isFinite(valor);

// Antes de dibujar, comprobamos que la respuesta tenga un resultado completo.
export function esResultado(valor: unknown): valor is Resultado {
  if (!registro(valor) || !registro(valor.camion) || !Array.isArray(valor.cajas)) return false;
  const camion = valor.camion;
  return numero(valor.cargadas) && Number.isInteger(valor.cargadas) && valor.cargadas >= 0
    && numero(valor.rechazadas) && Number.isInteger(valor.rechazadas) && valor.rechazadas >= 0
    && numero(valor.ocupacion) && valor.ocupacion >= 0 && valor.ocupacion <= 100
    && ["largo", "ancho", "alto"].every(campo => numero(camion[campo]) && camion[campo] > 0)
    && valor.cajas.length === valor.cargadas
    && valor.cajas.every(caja => registro(caja) && typeof caja.nombre === "string"
      && ["x", "y", "z"].every(campo => numero(caja[campo]) && caja[campo] >= 0)
      && ["largo", "ancho", "alto"].every(campo => numero(caja[campo]) && caja[campo] > 0));
}


