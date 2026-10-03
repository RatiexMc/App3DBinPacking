from fastapi.middleware.cors import CORSMiddleware
import logging
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from psycopg2 import Error as DatabaseError
from API.auth import router as auth_router
from API.ocr import router as ocr_router
from services.auth_service import usuario_actual

from API.productos import router as productos_router
from API.camiones import router as camiones_router
from API.optimizacion import router as optimizacion_router
from API.historial import router as historial_router

app = FastAPI(
    title="API App 3D Bin Packing",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ocr_router)
app.include_router(productos_router, dependencies=[Depends(usuario_actual)])
app.include_router(camiones_router, dependencies=[Depends(usuario_actual)])
app.include_router(optimizacion_router)
app.include_router(historial_router)


@app.exception_handler(DatabaseError)
async def error_base_datos(request: Request, error: DatabaseError):
    logging.getLogger(__name__).error("No se pudo completar la operación en PostgreSQL", exc_info=error)
    return JSONResponse(status_code=503, content={"detail": "No pudimos conectar con los datos del sistema. Compruebe PostgreSQL y las migraciones e intente nuevamente."})


@app.exception_handler(RequestValidationError)
async def error_validacion(request: Request, error: RequestValidationError):
    # No devolvemos el cuerpo recibido: podría contener una contraseña.
    campos = {str(e["loc"][-1]) for e in error.errors()}
    mensaje = "Revise los campos del formulario. Hay datos vacíos o inválidos."
    if campos & {"password", "nueva"}:
        mensaje = "La contraseña debe tener entre 10 y 128 caracteres (para iniciar sesión, ingrese su contraseña actual)."
    elif "cantidad" in campos:
        mensaje = "Cada cantidad debe ser un número entero de cajas mayor que cero."
    elif "email" in campos:
        mensaje = "Ingrese un correo electrónico válido."
    elif "nombre" in campos:
        mensaje = "Ingrese un nombre de entre 2 y 100 caracteres."
    return JSONResponse(status_code=422, content={"detail": mensaje})


@app.middleware("http")
async def no_cache_privado(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.get("/")
def inicio():
    return {
        "mensaje": "API funcionando correctamente"
    }
