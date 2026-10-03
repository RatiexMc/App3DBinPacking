"""Sesiones revocables en PostgreSQL; nunca guardamos la contraseña en claro."""
import hashlib
import os
import secrets
from fastapi import HTTPException, Request, Response
from pwdlib import PasswordHash
from services.historial_service import transaccion

PASSWORDS = PasswordHash.recommended()  # Argon2 genera una sal distinta por contraseña.
DUMMY_HASH = PASSWORDS.hash(secrets.token_urlsafe(32))
COOKIE = "darnel_sesion"
DURACION = 8 * 60 * 60


def huella(token):
    return hashlib.sha256(token.encode()).hexdigest()


def proteger_escritura(request: Request):
    # Un formulario de otro sitio no puede enviar este encabezado personalizado.
    # CORS permite el encabezado únicamente al frontend autorizado.
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        if request.headers.get("X-Darnel-Request") != "1":
            raise HTTPException(403, "Abra el sistema y vuelva a intentar esta operación.")


def limitar_intentos(request: Request, accion: str, limite: int = 20):
    ip = request.client.host if request.client else "local"
    clave = huella(accion + ":" + ip)
    with transaccion() as cursor:
        cursor.execute("DELETE FROM intentos_acceso WHERE vence_en < CURRENT_TIMESTAMP")
        cursor.execute("""INSERT INTO intentos_acceso (clave, cantidad, vence_en)
            VALUES (%s, 1, CURRENT_TIMESTAMP + INTERVAL '10 minutes')
            ON CONFLICT (clave) DO UPDATE SET cantidad = intentos_acceso.cantidad + 1
            RETURNING cantidad""", (clave,))
        cantidad = cursor.fetchone()["cantidad"]
    if cantidad > limite:
        raise HTTPException(429, "Hubo demasiados intentos. Espere diez minutos antes de volver a intentar.")


def crear_sesion(cursor, usuario_id, response: Response):
    token = secrets.token_urlsafe(32)
    cursor.execute("DELETE FROM sesiones WHERE vence_en < CURRENT_TIMESTAMP")
    cursor.execute("""INSERT INTO sesiones (token_hash, usuario_id, vence_en)
        VALUES (%s, %s, CURRENT_TIMESTAMP + INTERVAL '8 hours')""", (huella(token), str(usuario_id)))
    response.set_cookie(COOKIE, token, max_age=DURACION, httponly=True,
                        secure=os.environ.get("DARNEL_COOKIE_SECURE") == "1", samesite="lax", path="/")


def usuario_publico(usuario):
    return {k: usuario[k] for k in ("id", "nombre", "email", "rol", "foto_revision")}


def usuario_actual(request: Request):
    proteger_escritura(request)
    token = request.cookies.get(COOKIE, "")
    if not token or len(token) > 200:
        raise HTTPException(401, "Inicie sesión para continuar.")
    with transaccion() as cursor:
        cursor.execute("""SELECT u.id, u.nombre, u.email, u.rol, u.foto_revision
            FROM sesiones s JOIN cuentas_usuario u ON u.id = s.usuario_id
            WHERE s.token_hash = %s AND s.vence_en > CURRENT_TIMESTAMP""", (huella(token),))
        usuario = cursor.fetchone()
    if usuario is None:
        raise HTTPException(401, "Su sesión terminó. Inicie sesión nuevamente.")
    return usuario


def filtro_propietario(usuario):
    """El administrador también puede revisar el historial anterior a las cuentas."""
    if usuario["rol"] == "admin":
        return "TRUE", ()
    return "usuario_id = %s", (str(usuario["id"]),)

