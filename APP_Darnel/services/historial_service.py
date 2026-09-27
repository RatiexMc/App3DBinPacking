from contextlib import contextmanager
from psycopg2.extras import Json, RealDictCursor
from database.conexion import conectar


@contextmanager
def transaccion():
    conn = conectar()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                yield cursor
    finally:
        conn.close()


def buscar_resultado(identificador):
    with transaccion() as cursor:
        cursor.execute("SELECT entrada, resultado FROM optimizaciones WHERE id = %s", (str(identificador),))
        return cursor.fetchone()


def guardar_resultado(identificador, entrada, productos, resultado, tiempo_ms):
    with transaccion() as cursor:
        cursor.execute(
            """INSERT INTO optimizaciones
               (id, chofer, placa, productos_distintos, cajas_solicitadas, cargadas,
                rechazadas, ocupacion, tiempo_calculo_ms, entrada, productos, resultado)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
               ON CONFLICT (id) DO NOTHING""",
            (str(identificador), resultado["camion"]["chofer"], resultado["camion"]["placa"],
             len({p["codigo"] for p in productos}), sum(p["cantidad"] for p in productos),
             resultado["cargadas"], resultado["rechazadas"], resultado["ocupacion"], tiempo_ms,
             Json(entrada), Json(productos), Json(resultado)),
        )
        # La misma solicitud no crea filas duplicadas, incluso ante reintentos simultáneos.
        cursor.execute("SELECT entrada, resultado FROM optimizaciones WHERE id = %s", (str(identificador),))
        guardado = cursor.fetchone()
        if guardado["entrada"] != entrada:
            raise ValueError("La solicitud ya existe con otro pedido")
        return guardado["resultado"]
