"""Registro, acceso y configuración de la cuenta autenticada."""
from io import BytesIO
import re
from uuid import uuid4
from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from pydantic import BaseModel, Field, field_validator
from psycopg2.errors import UniqueViolation
from services.auth_service import (COOKIE, PASSWORDS, DUMMY_HASH, crear_sesion, huella,
    limitar_intentos, proteger_escritura, usuario_actual, usuario_publico)
from services.historial_service import transaccion
from services.imagenes import abrir_imagen

router = APIRouter(prefix="/auth", tags=["Cuenta"], dependencies=[Depends(proteger_escritura)])


class Acceso(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def email_valido(cls, valor):
        valor = valor.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", valor):
            raise ValueError("Ingrese un correo válido.")
        return valor


class Nombre(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)

    @field_validator("nombre")
    @classmethod
    def nombre_valido(cls, valor):
        valor = " ".join(valor.split())
        if len(valor) < 2:
            raise ValueError("Ingrese su nombre (al menos dos caracteres).")
        return valor


class Registro(Acceso, Nombre):
    password: str = Field(min_length=10, max_length=128)


class CambioPassword(BaseModel):
    actual: str = Field(min_length=1, max_length=128)
    nueva: str = Field(min_length=10, max_length=128)


@router.post("/registro", status_code=201)
def registrar(datos: Registro, request: Request, response: Response):
    limitar_intentos(request, "registro", 10)
    password_hash = PASSWORDS.hash(datos.password)
    try:
        with transaccion() as cursor:
            # Registrarse nunca concede privilegios de administrador.
            cursor.execute("""INSERT INTO cuentas_usuario (id, nombre, email, password_hash)
                VALUES (%s,%s,%s,%s) RETURNING id, nombre, email, rol, foto_revision""",
                (str(uuid4()), datos.nombre, datos.email, password_hash))
            usuario = cursor.fetchone()
            crear_sesion(cursor, usuario["id"], response)
            return usuario_publico(usuario)
    except UniqueViolation:
        raise HTTPException(409, "Ese correo ya tiene una cuenta. Inicie sesión.") from None


@router.post("/login")
def login(datos: Acceso, request: Request, response: Response):
    limitar_intentos(request, "login")
    with transaccion() as cursor:
        cursor.execute("SELECT * FROM cuentas_usuario WHERE email = %s FOR UPDATE", (datos.email,))
        usuario = cursor.fetchone()
        # Verificar también cuando no existe el correo evita una respuesta inmediata distinta.
        valido = PASSWORDS.verify(datos.password, usuario["password_hash"] if usuario else DUMMY_HASH)
        if not usuario or not valido:
            raise HTTPException(401, "Correo o contraseña incorrectos.")
        crear_sesion(cursor, usuario["id"], response)
        return usuario_publico(usuario)


@router.get("/me")
def me(usuario=Depends(usuario_actual)):
    return usuario_publico(usuario)


@router.post("/logout")
def logout(request: Request, response: Response):
    with transaccion() as cursor:
        cursor.execute("DELETE FROM sesiones WHERE token_hash = %s", (huella(request.cookies.get(COOKIE, "")),))
    response.delete_cookie(COOKIE, path="/")
    return {"mensaje": "Sesión cerrada."}


@router.patch("/perfil")
def perfil(datos: Nombre, usuario=Depends(usuario_actual)):
    with transaccion() as cursor:
        cursor.execute("UPDATE cuentas_usuario SET nombre = %s WHERE id = %s RETURNING id, nombre, email, rol, foto_revision",
                       (datos.nombre, str(usuario["id"])))
        return usuario_publico(cursor.fetchone())


@router.post("/password")
def password(datos: CambioPassword, request: Request, response: Response, usuario=Depends(usuario_actual)):
    limitar_intentos(request, "password")
    with transaccion() as cursor:
        cursor.execute("SELECT password_hash FROM cuentas_usuario WHERE id = %s FOR UPDATE", (str(usuario["id"]),))
        if not PASSWORDS.verify(datos.actual, cursor.fetchone()["password_hash"]):
            raise HTTPException(400, "La contraseña actual no es correcta.")
        if datos.actual == datos.nueva:
            raise HTTPException(422, "Elija una contraseña diferente de la actual.")
        cursor.execute("UPDATE cuentas_usuario SET password_hash = %s WHERE id = %s",
                       (PASSWORDS.hash(datos.nueva), str(usuario["id"])))
        # Revoca también las sesiones abiertas en otros dispositivos.
        cursor.execute("DELETE FROM sesiones WHERE usuario_id = %s", (str(usuario["id"]),))
        crear_sesion(cursor, usuario["id"], response)
    return {"mensaje": "Contraseña actualizada. Se cerraron las otras sesiones."}


@router.post("/foto")
def foto(archivo: UploadFile = File(...), usuario=Depends(usuario_actual)):
    datos = archivo.file.read(5 * 1024 * 1024 + 1)
    if len(datos) > 5 * 1024 * 1024:
        raise HTTPException(413, "La foto de perfil debe pesar como máximo 5 MB.")
    imagen = abrir_imagen(datos)
    imagen.thumbnail((512, 512))
    salida = BytesIO()
    imagen.save(salida, format="JPEG", quality=85)
    with transaccion() as cursor:
        cursor.execute("UPDATE cuentas_usuario SET foto = %s, foto_revision = %s WHERE id = %s RETURNING id, nombre, email, rol, foto_revision",
                       (salida.getvalue(), str(uuid4()), str(usuario["id"])))
        return usuario_publico(cursor.fetchone())


@router.get("/foto")
def ver_foto(usuario=Depends(usuario_actual)):
    with transaccion() as cursor:
        cursor.execute("SELECT foto FROM cuentas_usuario WHERE id = %s", (str(usuario["id"]),))
        foto = cursor.fetchone()["foto"]
    if foto is None:
        raise HTTPException(404, "Todavía no tiene foto de perfil.")
    return Response(bytes(foto), media_type="image/jpeg", headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})


@router.delete("/foto")
def quitar_foto(usuario=Depends(usuario_actual)):
    with transaccion() as cursor:
        cursor.execute("UPDATE cuentas_usuario SET foto = NULL, foto_revision = NULL WHERE id = %s RETURNING id, nombre, email, rol, foto_revision", (str(usuario["id"]),))
        return usuario_publico(cursor.fetchone())

