"""Aplicar la migración aditiva del historial: python -m database.migrar."""
from pathlib import Path
from database.conexion import conectar


def migrar():
    conn = conectar()
    try:
        with conn:
            with conn.cursor() as cursor:
                # Las migraciones son idempotentes: repetirlas no borra información.
                for archivo in sorted(Path(__file__).with_name("migrations").glob("*.sql")):
                    cursor.execute(archivo.read_text(encoding="utf-8-sig"))
        print("Historial y cuentas preparados. Productos y camiones no se modificaron.")
    finally:
        conn.close()


if __name__ == "__main__":
    migrar()
