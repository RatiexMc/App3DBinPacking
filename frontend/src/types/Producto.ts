// Estructura de un producto
// Posteriormente será exactamente igual
// a lo que recibiremos desde PostgreSQL

export interface Producto {
  codigo: string;
  descripcion: string;

  largo: number;
  ancho: number;
  alto: number;

  apilable: boolean;

  categoria: string;
}