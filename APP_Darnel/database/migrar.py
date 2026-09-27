"""Aplicar la migración aditiva del historial: python -m database.migrar."""
from pathlib import Path
from database.conexion import conectar


def migrar():
    conn = conectar()
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(Path(__file__).with_name("migrations").joinpath("001_historial_optimizaciones.sql").read_text(encoding="utf-8-sig"))
        print("Tabla de historial preparada. Productos y camiones no se modificaron.")
    finally:
        conn.close()


if __name__ == "__main__":
    migrar()
