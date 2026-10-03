from typing import Literal
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from services.auth_service import usuario_actual
from services.historial_service import transaccion
from services.ocr_service import reconocer
from API.optimizacion import ProductoOptimizar

router = APIRouter(prefix="/ocr", tags=["Picking"], dependencies=[Depends(usuario_actual)])


@router.post("/leer")
def leer(archivo: UploadFile = File(...), mejorar: bool = Form(True), giro: Literal["auto", "0", "90", "180", "270"] = Form("auto")):
    datos = archivo.file.read(10 * 1024 * 1024 + 1)
    if len(datos) > 10 * 1024 * 1024:
        raise HTTPException(413, "La foto debe pesar como máximo 10 MB.")
    with transaccion() as cursor:
        cursor.execute("SELECT codigo, descripcion FROM productos ORDER BY codigo")
        catalogo = cursor.fetchall()
    return reconocer(datos, catalogo, mejorar, giro)


class Revision(BaseModel):
    productos: list[ProductoOptimizar] = Field(min_length=1, max_length=1000)


@router.post("/validar")
def validar(revision: Revision):
    """Reconsulta el catálogo: editar un código en el navegador no lo hace válido."""
    with transaccion() as cursor:
        codigos = list(dict.fromkeys(p.codigo for p in revision.productos))
        cursor.execute("SELECT codigo, descripcion FROM productos WHERE codigo = ANY(%s)", (codigos,))
        encontrados = {p["codigo"]: p for p in cursor.fetchall()}
    faltantes = [codigo for codigo in codigos if codigo not in encontrados]
    if faltantes:
        raise HTTPException(422, {"mensaje": "No existen estos códigos en Productos: " + ", ".join(faltantes) + ". Corríjalos, regístrelos o excluya esas filas.", "codigos_no_encontrados": faltantes})
    # Si el documento repite un artículo, la revisión suma únicamente las cajas
    # ya confirmadas. Las dos columnas originales nunca se suman entre sí.
    cantidades = {}
    for p in revision.productos:
        cantidades[p.codigo] = cantidades.get(p.codigo, 0) + p.cantidad
    return {"productos": [{"codigo": c, "cantidad": n} for c, n in cantidades.items()]}
