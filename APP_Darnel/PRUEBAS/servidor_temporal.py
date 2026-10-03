"""Servidor de pruebas de interfaz: cuentas y sesiones solo en tablas temporales.

No usar como servidor de trabajo. Escucha exclusivamente en 127.0.0.1:8001.
"""
import os
from contextlib import contextmanager
from threading import RLock
from unittest.mock import patch
import uvicorn
from main import app
from PRUEBAS.test_cuentas_ocr import CuentasHTTPTests


def main():
    if os.environ.get("DARNEL_TEST_POSTGRES") != "1":
        raise SystemExit("Active DARNEL_TEST_POSTGRES=1 para usar tablas temporales.")
    prueba = CuentasHTTPTests()
    prueba.setUp()
    from services.auth_service import transaccion
    bloqueo = RLock()

    @contextmanager
    def serializada():
        with bloqueo, transaccion() as cursor:
            yield cursor

    parches = [patch(modulo + ".transaccion", serializada) for modulo in ("services.historial_service", "services.auth_service", "API.auth", "API.historial", "API.ocr")]
    try:
        for parche in parches:
            parche.start()
        uvicorn.run(app, host="127.0.0.1", port=8001, log_level="warning")
    finally:
        for parche in reversed(parches):
            parche.stop()
        prueba.doCleanups()


if __name__ == "__main__":
    main()
