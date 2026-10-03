import logging
import math
from time import perf_counter
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Depends
from services.auth_service import usuario_actual
from pydantic import BaseModel, Field, field_validator

from database.conexion import conectar
from services.packing_service import ejecutar_packing
from services.historial_service import buscar_resultado, guardar_resultado

router = APIRouter()
logger = logging.getLogger(__name__)


class ProductoOptimizar(BaseModel):
    codigo: str = Field(min_length=1)
    cantidad: int = Field(gt=0, strict=True)

    @field_validator("codigo")
    @classmethod
    def limpiar_codigo(cls, valor):
        if not valor.strip():
            raise ValueError("Ingrese el código del producto.")
        return valor.strip()


class SolicitudOptimizacion(BaseModel):
    solicitud_id: UUID = Field(default_factory=uuid4)
    nombre_chofer: str = Field(min_length=1)
    productos: list[ProductoOptimizar] = Field(min_length=1)

    @field_validator("nombre_chofer")
    @classmethod
    def limpiar_chofer(cls, valor):
        if not valor.strip():
            raise ValueError("Ingrese el nombre del chofer.")
        return valor.strip()


def dimensiones_validas(valores):
    return all(math.isfinite(float(valor)) and float(valor) > 0 for valor in valores)


@router.post("/optimizar")
def optimizar(solicitud: SolicitudOptimizacion, usuario=Depends(usuario_actual)):
    entrada = solicitud.model_dump(mode="json", exclude={"solicitud_id"})
    try:
        anterior = buscar_resultado(solicitud.solicitud_id, usuario["id"])
        if anterior:
            if anterior["entrada"] != entrada:
                raise HTTPException(409, "Esta solicitud corresponde a otro pedido. Inicie una nueva carga antes de continuar.")
            return anterior["resultado"]
    except HTTPException:
        raise
    except Exception:
        logger.exception("No se pudo comprobar el historial")
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT largo, ancho, alto, peso_maximo, placa, nombre_chofer, apellido_chofer
               FROM camiones WHERE LOWER(nombre_chofer) = LOWER(%s)""",
            (solicitud.nombre_chofer,),
        )
        camiones = cursor.fetchall()
        if not camiones:
            raise HTTPException(404, "No encontramos un camión para ese chofer. Revise el nombre o registre el vehículo en Camiones.")
        if len(camiones) > 1:
            raise HTTPException(409, "Hay varios camiones con ese nombre de chofer. Revise los registros en Camiones para identificar el vehículo correcto.")

        largo, ancho, alto, peso_maximo = map(float, camiones[0][:4])
        placa = camiones[0][4]
        chofer = " ".join(str(parte) for parte in camiones[0][5:7] if parte)
        if not dimensiones_validas((largo, ancho, alto, peso_maximo)):
            raise HTTPException(422, "El camión tiene medidas o capacidad de peso inválidas. Corrija sus datos en Camiones.")

        productos = []
        faltantes = []
        for producto in solicitud.productos:
            cursor.execute(
                """SELECT codigo, descripcion, largo, ancho, alto, peso, apilable, categoria_peso
                   FROM productos WHERE codigo = %s""",
                (producto.codigo,),
            )
            fila = cursor.fetchone()
            if fila is None:
                faltantes.append(producto.codigo)
                continue
            if not dimensiones_validas(fila[2:5]) or not math.isfinite(float(fila[5])) or float(fila[5]) < 0:
                raise HTTPException(422, f"El producto {producto.codigo} tiene medidas o peso inválidos. Revise su ficha en Productos.")
            if fila[7] not in (1, 2, 3) or not isinstance(fila[6], bool):
                raise HTTPException(422, f"Complete la categoría de peso y la opción apilable del producto {producto.codigo} antes de optimizar.")
            productos.append({
                "codigo": fila[0], "descripcion": fila[1],
                "largo": float(fila[2]), "ancho": float(fila[3]),
                "alto": float(fila[4]), "peso": float(fila[5]),
                "cantidad": producto.cantidad,
                "apilable": fila[6], "categoria_peso": fila[7],
            })

        # Nunca calcular una carga parcial por códigos que no se encontraron.
        if faltantes:
            raise HTTPException(422, {
                "mensaje": "No encontramos estos códigos: " + ", ".join(dict.fromkeys(faltantes)) + ". Corríjalos o regístrelos en Productos antes de optimizar.",
                "codigos_no_encontrados": list(dict.fromkeys(faltantes)),
            })
    except HTTPException:
        raise
    except Exception:
        logger.exception("No se pudieron consultar los datos de la carga")
        raise HTTPException(503, "No pudimos consultar los datos de productos y camiones. Compruebe que la base de datos esté disponible y vuelva a intentar.") from None
    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()

    try:
        inicio = perf_counter()
        resultado = ejecutar_packing(largo, ancho, alto, peso_maximo, productos)
        tiempo_ms = round((perf_counter() - inicio) * 1000)
    except Exception:
        logger.exception("Falló el cálculo de carga")
        raise HTTPException(500, "No pudimos calcular la distribución. Sus productos siguen en la lista; vuelva a intentar.") from None

    respuesta = {
        "historial_id": str(solicitud.solicitud_id),
        "historial_guardado": True,
        "cargadas": resultado["cargadas"],
        "rechazadas": resultado["rechazadas"],
        "ocupacion": resultado["ocupacion"],
        "camion": {"largo": largo, "ancho": ancho, "alto": alto, "peso_maximo": peso_maximo, "placa": placa, "chofer": chofer},
        "cajas": resultado["cajas"],
        "sin_acomodar": resultado["sin_acomodar"],
        "estrategia": resultado["estrategia"],
        "motor_version": resultado["motor_version"],
        "reglas": resultado["reglas"],
    }
    try:
        return guardar_resultado(solicitud.solicitud_id, entrada, productos, respuesta, tiempo_ms, usuario["id"])
    except Exception:
        logger.exception("Se calculó la carga, pero no se pudo guardar el historial")
        respuesta["historial_guardado"] = False
        respuesta["aviso_historial"] = "La distribución se calculó, pero no se pudo guardar en el historial. Vuelva a pulsar Optimizar carga para reintentar el guardado."
        return respuesta

