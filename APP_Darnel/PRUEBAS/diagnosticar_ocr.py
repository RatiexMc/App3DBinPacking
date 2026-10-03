"""Probar una fotografía real sin guardar una optimización ni modificar el catálogo.

python -m PRUEBAS.diagnosticar_ocr foto.jpg --salida resultado.json
El JSON contiene el documento: guárdelo fuera del repositorio si usa datos reales.
"""
import argparse
import json
from pathlib import Path
from services.historial_service import transaccion
from services.ocr_service import reconocer


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("foto", type=Path)
    parser.add_argument("--salida", type=Path)
    args = parser.parse_args()
    with transaccion() as cursor:
        cursor.execute("SELECT codigo, descripcion FROM productos")
        catalogo = cursor.fetchall()
    resultado = reconocer(args.foto.read_bytes(), catalogo)
    print(json.dumps({"filas": len(resultado["filas"]), "en_catalogo": sum(f["existe"] for f in resultado["filas"]), "pasos": resultado["pasos"]}, ensure_ascii=False))
    if args.salida:
        args.salida.write_text(json.dumps(resultado, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
