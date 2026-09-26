
"""Pruebas de optimización con una base simulada; no consultan datos empresariales."""
import unittest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from pydantic import ValidationError
from API.optimizacion import SolicitudOptimizacion, optimizar


class OptimizacionTests(unittest.TestCase):
    def solicitud(self, productos=None):
        return SolicitudOptimizacion(nombre_chofer=" Chofer ", productos=productos or [{"codigo": " A ", "cantidad": 2}])

    def conexion(self, filas=None):
        conn = MagicMock()
        cursor = conn.cursor.return_value
        cursor.fetchall.return_value = [(100, 100, 100, 1000)]
        cursor.fetchone.side_effect = filas or [("A", "Caja", 10, 20, 30, 0)]
        return conn, cursor

    def test_cantidades_invalidas(self):
        for cantidad in [0, -1, 1.5, True, "2"]:
            with self.subTest(cantidad=cantidad), self.assertRaises(ValidationError):
                self.solicitud([{"codigo": "A", "cantidad": cantidad}])

    def test_pedido_vacio_y_campos_en_blanco(self):
        for valores in [
            {"nombre_chofer": "Chofer", "productos": []},
            {"nombre_chofer": " ", "productos": [{"codigo": "A", "cantidad": 1}]},
            {"nombre_chofer": "Chofer", "productos": [{"codigo": " ", "cantidad": 1}]},
        ]:
            with self.subTest(valores=valores), self.assertRaises(ValidationError):
                SolicitudOptimizacion(**valores)

    def test_codigos_faltantes_impiden_carga_parcial(self):
        conn, cursor = self.conexion([("A", "Caja", 10, 20, 30, 0), None, None])
        pedido = self.solicitud([{"codigo": codigo, "cantidad": 1} for codigo in ["A", "NO1", "NO2"]])
        with patch("API.optimizacion.conectar", return_value=conn), patch("API.optimizacion.ejecutar_packing") as motor:
            with self.assertRaises(HTTPException) as error:
                optimizar(pedido)
            self.assertEqual(error.exception.detail["codigos_no_encontrados"], ["NO1", "NO2"])
            motor.assert_not_called()
        cursor.close.assert_called_once()
        conn.close.assert_called_once()

    def test_chofer_inexistente_o_ambiguo(self):
        for camiones, estado in [([], 404), ([(100,100,100,1000)] * 2, 409)]:
            conn, cursor = self.conexion()
            cursor.fetchall.return_value = camiones
            with patch("API.optimizacion.conectar", return_value=conn):
                with self.assertRaises(HTTPException) as error:
                    optimizar(self.solicitud())
                self.assertEqual(error.exception.status_code, estado)
            conn.close.assert_called_once()

    def test_error_base_no_expone_detalles(self):
        with patch("API.optimizacion.conectar", side_effect=RuntimeError("secreto")), patch("API.optimizacion.logger"):
            with self.assertRaises(HTTPException) as error:
                optimizar(self.solicitud())
            self.assertEqual(error.exception.status_code, 503)
            self.assertNotIn("secreto", error.exception.detail)

    def test_cierra_conexion_ante_error_de_consulta(self):
        conn, cursor = self.conexion()
        cursor.execute.side_effect = RuntimeError("consulta fallida")
        with patch("API.optimizacion.conectar", return_value=conn), patch("API.optimizacion.logger"):
            with self.assertRaises(HTTPException):
                optimizar(self.solicitud())
        cursor.close.assert_called_once()
        conn.close.assert_called_once()

    def test_dimensiones_invalidas(self):
        conn, cursor = self.conexion([("A", "Caja", 0, 20, 30, 0)])
        with patch("API.optimizacion.conectar", return_value=conn), patch("API.optimizacion.ejecutar_packing") as motor:
            with self.assertRaises(HTTPException) as error:
                optimizar(self.solicitud())
            self.assertEqual(error.exception.status_code, 422)
            motor.assert_not_called()

    def test_error_motor_es_comprensible(self):
        conn, _ = self.conexion()
        with patch("API.optimizacion.conectar", return_value=conn), patch("API.optimizacion.ejecutar_packing", side_effect=RuntimeError("interno")), patch("API.optimizacion.logger"):
            with self.assertRaises(HTTPException) as error:
                optimizar(self.solicitud())
            self.assertEqual(error.exception.status_code, 500)
            self.assertIn("vuelva a intentar", error.exception.detail)

    def test_resultado_real_con_datos_ficticios(self):
        conn, cursor = self.conexion()
        with patch("API.optimizacion.conectar", return_value=conn):
            resultado = optimizar(self.solicitud())
        self.assertEqual(resultado["cargadas"], 2)
        self.assertEqual(resultado["rechazadas"], 0)
        self.assertEqual(len(resultado["cajas"]), 2)
        self.assertEqual(resultado["ocupacion"], 1.2)
        self.assertEqual(cursor.execute.call_args.args[1], ("A",))


if __name__ == "__main__":
    unittest.main()

