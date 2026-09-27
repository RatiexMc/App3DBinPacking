import logging
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query
from services.historial_service import transaccion

router = APIRouter()
logger = logging.getLogger(__name__)
RESUMEN = "id, creado_en, chofer, placa, productos_distintos, cajas_solicitadas, cargadas, rechazadas, ocupacion, tiempo_calculo_ms"


@router.get("/historial")
def historial(busqueda: str = "", limite: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    try:
        with transaccion() as cursor:
            filtro = "%" + busqueda.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
            condiciones = "WHERE chofer ILIKE %s OR placa ILIKE %s"
            cursor.execute("SELECT COUNT(*) AS total FROM optimizaciones " + condiciones, (filtro, filtro))
            total = cursor.fetchone()["total"]
            cursor.execute("SELECT " + RESUMEN + " FROM optimizaciones " + condiciones + " ORDER BY creado_en DESC, id LIMIT %s OFFSET %s", (filtro, filtro, limite, offset))
            return {"total": total, "items": cursor.fetchall()}
    except Exception:
        logger.exception("No se pudo leer el historial")
        raise HTTPException(503, "No pudimos consultar el historial. Compruebe la conexión con la base de datos e intente nuevamente.") from None


@router.get("/historial/{identificador}")
def detalle(identificador: UUID):
    try:
        with transaccion() as cursor:
            cursor.execute("SELECT " + RESUMEN + ", productos, resultado FROM optimizaciones WHERE id = %s", (str(identificador),))
            registro = cursor.fetchone()
            if registro is None:
                raise HTTPException(404, "No encontramos esa optimización en el historial.")
            return registro
    except HTTPException:
        raise
    except Exception:
        logger.exception("No se pudo leer la optimización")
        raise HTTPException(503, "No pudimos abrir esa optimización. Vuelva a intentar.") from None


@router.get("/dashboard")
def dashboard():
    try:
        with transaccion() as cursor:
            cursor.execute("""SELECT COUNT(*) AS optimizaciones, COALESCE(SUM(cargadas),0) AS cajas_acomodadas,
                COALESCE(SUM(rechazadas),0) AS cajas_sin_acomodar,
                COALESCE(AVG(ocupacion),0) AS ocupacion_promedio FROM optimizaciones""")
            resumen = dict(cursor.fetchone())
            cursor.execute("SELECT COUNT(*) AS total FROM productos")
            resumen["productos_registrados"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) AS total FROM camiones")
            resumen["camiones_registrados"] = cursor.fetchone()["total"]
            cursor.execute("SELECT " + RESUMEN + " FROM optimizaciones ORDER BY creado_en DESC, id LIMIT 5")
            resumen["recientes"] = cursor.fetchall()
            return resumen
    except Exception:
        logger.exception("No se pudo leer el dashboard")
        raise HTTPException(503, "No pudimos cargar los indicadores. Compruebe la conexión con la base de datos y vuelva a intentar.") from None
