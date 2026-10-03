"""Después de registrarse: python -m database.administrador correo@ejemplo.com.

Solo el responsable con acceso a la computadora y PostgreSQL puede otorgar este rol;
el formulario público de registro nunca permite elegirlo.
"""
import argparse
from services.historial_service import transaccion


def main():
    parser = argparse.ArgumentParser(description="Asignar administrador a una cuenta existente")
    parser.add_argument("email")
    args = parser.parse_args()
    with transaccion() as cursor:
        cursor.execute("UPDATE cuentas_usuario SET rol = 'admin' WHERE email = %s RETURNING nombre", (args.email.strip().lower(),))
        usuario = cursor.fetchone()
        if not usuario:
            parser.exit(1, "No existe esa cuenta. Regístrese primero en la aplicación.\n")
        print("Rol administrador asignado a", usuario["nombre"])


if __name__ == "__main__":
    main()

