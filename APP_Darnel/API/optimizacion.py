from fastapi import APIRouter
from pydantic import BaseModel

from database.conexion import conectar
from services.packing_service import ejecutar_packing

# ==================================================
# ROUTER
# ==================================================
#
# Router encargado de recibir solicitudes
# de optimización desde el Frontend.
#
# ==================================================

router = APIRouter()


# ==================================================
# PRODUCTO RECIBIDO DESDE EL PICKING
# ==================================================
#
# El usuario solamente envía:
#
# - código
# - cantidad
#
# Las dimensiones reales del producto
# serán obtenidas desde PostgreSQL.
#
# ==================================================

class ProductoOptimizar(BaseModel):
    codigo: str
    cantidad: int


# ==================================================
# SOLICITUD DE OPTIMIZACIÓN
# ==================================================
#
# El usuario envía:
#
# - nombre del chofer
# - lista de productos
#
# El sistema obtiene automáticamente:
#
# - dimensiones del camión
# - dimensiones de productos
#
# ==================================================

class SolicitudOptimizacion(BaseModel):
    nombre_chofer: str
    productos: list[ProductoOptimizar]


# ==================================================
# ENDPOINT PRINCIPAL DE OPTIMIZACIÓN
# ==================================================

@router.post("/optimizar")
def optimizar(
    solicitud: SolicitudOptimizacion
):

    # ==============================================
    # CONEXIÓN A POSTGRESQL
    # ==============================================

    conn = conectar()
    cursor = conn.cursor()

    # ==============================================
    # OBTENER CAMIÓN A PARTIR DEL CHOFER
    # ==============================================
    #
    # Cada chofer tiene asociado un camión.
    #
    # A partir del nombre del chofer buscamos:
    #
    # - largo
    # - ancho
    # - alto
    # - peso máximo
    #
    # ==============================================

    cursor.execute(
        """
        SELECT
            largo,
            ancho,
            alto,
            peso_maximo
        FROM camiones
        WHERE LOWER(nombre_chofer) = LOWER(%s)
        LIMIT 1
        """,
        (solicitud.nombre_chofer,)
    )

    camion_bd = cursor.fetchone()

    # ==============================================
    # VALIDAR EXISTENCIA DEL CHOFER
    # ==============================================

    if camion_bd is None:

        cursor.close()
        conn.close()

        return {
            "error": "Chofer no encontrado"
        }

    # ==============================================
    # EXTRAER DATOS DEL CAMIÓN
    # ==============================================

    largo_camion = float(camion_bd[0])
    ancho_camion = float(camion_bd[1])
    alto_camion = float(camion_bd[2])
    peso_maximo = float(camion_bd[3])

    # ==============================================
    # LISTA DE PRODUCTOS PARA PY3DBP
    # ==============================================

    productos = []

    # ==============================================
    # RECORRER PRODUCTOS DEL PICKING
    # ==============================================

    for producto in solicitud.productos:

        # ==========================================
        # BUSCAR PRODUCTO EN POSTGRESQL
        # ==========================================

        cursor.execute(
            """
            SELECT
                codigo,
                descripcion,
                largo,
                ancho,
                alto,
                peso
            FROM productos
            WHERE codigo = %s
            """,
            (producto.codigo,)
        )

        producto_bd = cursor.fetchone()

        # ==========================================
        # SI EL PRODUCTO NO EXISTE
        # ==========================================

        if producto_bd is None:
            continue

        # ==========================================
        # ARMAR ESTRUCTURA PARA PY3DBP
        # ==========================================

        productos.append(
            {
                "codigo": producto_bd[0],
                "descripcion": producto_bd[1],
                "largo": float(producto_bd[2]),
                "ancho": float(producto_bd[3]),
                "alto": float(producto_bd[4]),
                "peso": float(producto_bd[5]),
                "cantidad": producto.cantidad
            }
        )

    # ==============================================
    # CERRAR CONEXIÓN A POSTGRESQL
    # ==============================================

    cursor.close()
    conn.close()

    # ==============================================
    # EJECUTAR ALGORITMO 3D BIN PACKING
    # ==============================================
    #
    # El servicio:
    #
    # - genera cajas físicas según cantidad
    # - ejecuta py3dbp
    # - calcula ocupación
    # - devuelve posiciones
    #
    # ==============================================

    resultado = ejecutar_packing(
        largo_camion,
        ancho_camion,
        alto_camion,
        peso_maximo,
        productos
    )

    # ==============================================
    # RESPUESTA FINAL HACIA REACT
    # ==============================================

    return {
        "cargadas": resultado["cargadas"],
        "rechazadas": resultado["rechazadas"],
        "ocupacion": resultado["ocupacion"],
        "cajas": resultado["cajas"]
    }