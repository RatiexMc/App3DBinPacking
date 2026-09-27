
"""Integración opcional: DARNEL_TEST_POSTGRES=1. Solo usa tablas temporales y rollback."""
import os
import unittest
from contextlib import contextmanager
from unittest.mock import patch
from uuid import uuid4

from psycopg2.extras import RealDictCursor
from database.conexion import conectar
from services import historial_service
from API.historial import historial, detalle, dashboard


@unittest.skipUnless(os.environ.get("DARNEL_TEST_POSTGRES") == "1", "Requiere PostgreSQL local y activación explícita")
class HistorialPostgresTests(unittest.TestCase):
    def setUp(self):
        self.conn = conectar()
        self.addCleanup(self.conn.close)
        self.addCleanup(self.conn.rollback)
        with self.conn.cursor() as cursor:
            cursor.execute("CREATE TEMP TABLE optimizaciones (LIKE public.optimizaciones INCLUDING ALL) ON COMMIT DROP")
            cursor.execute("CREATE TEMP TABLE productos (codigo TEXT) ON COMMIT DROP")
            cursor.execute("CREATE TEMP TABLE camiones (placa TEXT) ON COMMIT DROP")
            cursor.execute("INSERT INTO productos VALUES ('FICTICIO')")
            cursor.execute("INSERT INTO camiones VALUES ('TEST')")
        @contextmanager
        def transaccion_temporal():
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                yield cursor
        for nombre in ["services.historial_service.transaccion", "API.historial.transaccion"]:
            parche = patch(nombre, transaccion_temporal)
            parche.start()
            self.addCleanup(parche.stop)
        self.id = uuid4()
        self.entrada = {"nombre_chofer": "Prueba", "productos": [{"codigo": "FICTICIO", "cantidad": 2}]}
        self.productos = [{"codigo": "FICTICIO", "descripcion": "Caja de prueba", "cantidad": 2, "largo": 10, "ancho": 20, "alto": 30}]
        self.resultado = {"cargadas": 2, "rechazadas": 0, "ocupacion": 1.2, "camion": {"chofer": "Prueba", "placa": "TEST"}, "cajas": []}

    def guardar(self):
        return historial_service.guardar_resultado(self.id, self.entrada, self.productos, self.resultado, 12)

    def test_guardado_idempotente_y_detalle(self):
        self.guardar()
        self.guardar()
        lista = historial("", 20, 0)
        self.assertEqual(lista["total"], 1)
        self.assertEqual(len(lista["items"]), 1)
        carga = detalle(self.id)
        self.assertEqual(carga["productos"], self.productos)
        self.assertEqual(carga["resultado"], self.resultado)
        self.assertEqual(historial_service.buscar_resultado(self.id)["entrada"], self.entrada)

    def test_indicadores_y_busqueda(self):
        self.guardar()
        datos = dashboard()
        self.assertEqual(datos["optimizaciones"], 1)
        self.assertEqual(datos["cajas_acomodadas"], 2)
        self.assertEqual(datos["cajas_sin_acomodar"], 0)
        self.assertEqual(datos["productos_registrados"], 1)
        self.assertEqual(datos["camiones_registrados"], 1)
        self.assertAlmostEqual(datos["ocupacion_promedio"], 1.2)
        self.assertEqual(historial("prueba", 20, 0)["total"], 1)
        self.assertEqual(historial("TEST", 20, 0)["total"], 1)
        self.assertEqual(historial("%", 20, 0)["total"], 0)
        self.assertEqual(historial("", 20, 20)["items"], [])

    def test_historial_vacio(self):
        datos = dashboard()
        self.assertEqual(datos["optimizaciones"], 0)
        self.assertEqual(datos["recientes"], [])
        self.assertEqual(historial("", 20, 0)["total"], 0)


if __name__ == "__main__":
    unittest.main()

