"""Comparación de solo lectura: python -m PRUEBAS.diagnosticar_carga UUID."""
import json
import sys
from time import perf_counter
from uuid import UUID
from API.historial import detalle
from services.historial_service import transaccion
from services.packing_service import ejecutar_packing
from restricciones import validar_apoyo_minimo


def diagnosticar(identificador):
    carga = detalle(UUID(identificador))
    anterior = carga["resultado"]
    productos = carga["productos"]
    with transaccion() as cursor:
        for producto in productos:
            cursor.execute("SELECT apilable, categoria_peso FROM productos WHERE codigo = %s", (producto["codigo"],))
            reglas = cursor.fetchone()
            if reglas is None:
                raise ValueError("No se encontró la ficha de " + producto["codigo"])
            producto.update(reglas)
    camion = anterior["camion"]
    inicio = perf_counter()
    nuevo = ejecutar_packing(camion["largo"], camion["ancho"], camion["alto"], camion["peso_maximo"], productos)
    print(json.dumps({
        "placa": carga["placa"],
        "camion_cm": [camion[k] for k in ("largo", "ancho", "alto")],
        "productos": productos,
        "anterior": {"cargadas": anterior["cargadas"], "rechazadas": anterior["rechazadas"], "ocupacion": anterior["ocupacion"],
            "sin_apoyo_completo": sum(not validar_apoyo_minimo(c, anterior["cajas"]) for c in anterior["cajas"])},
        "nuevo": {"cargadas": nuevo["cargadas"], "rechazadas": nuevo["rechazadas"], "ocupacion": nuevo["ocupacion"],
            "sin_apoyo_completo": sum(not validar_apoyo_minimo(c, nuevo["cajas"]) for c in nuevo["cajas"]),
            "estrategia": nuevo["estrategia"], "segundos": round(perf_counter()-inicio, 3), "pendientes": nuevo["sin_acomodar"]},
    }, ensure_ascii=False, default=str, indent=2))


if __name__ == "__main__":
    diagnosticar(sys.argv[1])
