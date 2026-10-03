"""Integración HTTP + PostgreSQL usando tablas TEMPORALES y rollback final.

Nunca registra cuentas ni cargas de prueba en las tablas reales de la empresa.
Activar con DARNEL_TEST_POSTGRES=1, igual que las pruebas del historial.
"""
from contextlib import contextmanager
from io import BytesIO
import os
import unittest
from unittest.mock import patch
from uuid import uuid4
from fastapi.testclient import TestClient
from PIL import Image
from psycopg2.extras import RealDictCursor
from database.conexion import conectar
from main import app
from services.historial_service import guardar_resultado, buscar_resultado
from services.ocr_service import filas_desde_datos


@unittest.skipUnless(os.environ.get("DARNEL_TEST_POSTGRES") == "1", "Requiere PostgreSQL local")
class CuentasHTTPTests(unittest.TestCase):
    def setUp(self):
        self.conn = conectar()
        self.addCleanup(self.conn.close)
        self.addCleanup(self.conn.rollback)
        with self.conn.cursor() as cursor:
            for tabla in ("cuentas_usuario", "sesiones", "intentos_acceso", "optimizaciones"):
                cursor.execute(f"CREATE TEMP TABLE {tabla} (LIKE public.{tabla} INCLUDING ALL) ON COMMIT DROP")
            cursor.execute("CREATE TEMP TABLE productos (codigo TEXT, descripcion TEXT) ON COMMIT DROP")
            cursor.execute("CREATE TEMP TABLE camiones (placa TEXT) ON COMMIT DROP")
            cursor.execute("INSERT INTO productos VALUES ('ABC123', 'Caja de prueba')")

        @contextmanager
        def temporal():
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SAVEPOINT prueba")
                try:
                    yield cursor
                except Exception:
                    cursor.execute("ROLLBACK TO SAVEPOINT prueba")
                    raise
                finally:
                    cursor.execute("RELEASE SAVEPOINT prueba")

        for modulo in ("services.historial_service", "services.auth_service", "API.auth", "API.historial", "API.ocr"):
            parche = patch(modulo + ".transaccion", temporal)
            parche.start()
            self.addCleanup(parche.stop)
        self.client = TestClient(app, headers={"X-Darnel-Request": "1"})
        self.addCleanup(self.client.close)

    def registro(self, email="operador@example.test"):
        response = self.client.post("/auth/registro", json={"nombre": "Operador de prueba", "email": email, "password": "Clave de prueba 123"})
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_registro_login_logout_hash_y_csrf(self):
        usuario = self.registro()
        self.assertEqual(usuario["rol"], "operador")
        self.assertNotIn("password_hash", usuario)
        self.assertEqual(self.client.get("/auth/me").json()["id"], usuario["id"])
        with self.conn.cursor() as c:
            c.execute("SELECT password_hash FROM cuentas_usuario")
            self.assertTrue(c.fetchone()[0].startswith("$argon2id$"))
            c.execute("SELECT token_hash FROM sesiones")
            self.assertNotEqual(c.fetchone()[0], self.client.cookies.get("darnel_sesion"))
        self.assertEqual(self.client.patch("/auth/perfil", json={"nombre": "Otro nombre"}, headers={"X-Darnel-Request": ""}).status_code, 403)
        self.client.post("/auth/logout")
        self.assertEqual(self.client.get("/dashboard").status_code, 401)
        self.assertEqual(self.client.post("/auth/login", json={"email": usuario["email"], "password": "incorrecta"}).status_code, 401)
        response = self.client.post("/auth/login", json={"email": usuario["email"].upper(), "password": "Clave de prueba 123"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("HttpOnly", response.headers["set-cookie"])
        self.assertIn("SameSite=lax", response.headers["set-cookie"])

    def test_validacion_duplicados_y_no_filtrar_password(self):
        self.registro()
        respuesta = self.client.post("/auth/registro", json={"nombre": "Otra persona", "email": "OPERADOR@example.test", "password": "Clave de prueba 123"})
        self.assertEqual(respuesta.status_code, 409)
        respuesta = self.client.post("/auth/registro", json={"nombre": "Nombre", "email": "a@b.test", "password": "secret"})
        self.assertEqual(respuesta.status_code, 422)
        self.assertNotIn("secret", respuesta.text)

    def test_cambio_password_revoca_otras_sesiones(self):
        self.registro()
        cookie_anterior = self.client.cookies.get("darnel_sesion")
        self.assertEqual(self.client.post("/auth/password", json={"actual": "mal", "nueva": "Nueva clave 456"}).status_code, 400)
        self.assertEqual(self.client.post("/auth/password", json={"actual": "Clave de prueba 123", "nueva": "Nueva clave 456"}).status_code, 200)
        self.assertEqual(self.client.get("/auth/me").status_code, 200)
        otra = TestClient(app, cookies={"darnel_sesion": cookie_anterior})
        self.addCleanup(otra.close)
        self.assertEqual(otra.get("/auth/me").status_code, 401)
        self.assertEqual(self.client.post("/auth/login", json={"email": "operador@example.test", "password": "Clave de prueba 123"}).status_code, 401)

    def test_perfil_y_foto_validada(self):
        self.registro()
        self.assertEqual(self.client.patch("/auth/perfil", json={"nombre": "  Nombre   actualizado  "}).json()["nombre"], "Nombre actualizado")
        self.assertEqual(self.client.post("/auth/foto", files={"archivo": ("falso.jpg", b"no es imagen", "image/jpeg")}).status_code, 422)
        imagen = BytesIO()
        Image.new("RGB", (700, 600), "blue").save(imagen, "PNG")
        self.assertEqual(self.client.post("/auth/foto", files={"archivo": ("perfil.png", imagen.getvalue(), "image/png")}).status_code, 200)
        response = self.client.get("/auth/foto")
        self.assertEqual(response.headers["content-type"], "image/jpeg")
        self.assertLessEqual(max(Image.open(BytesIO(response.content)).size), 512)
        self.assertIsNone(self.client.delete("/auth/foto").json()["foto_revision"])
        self.assertEqual(self.client.get("/auth/foto").status_code, 404)

    def test_aislamiento_historial_dashboard_e_idempotencia(self):
        usuario = self.registro()
        identificador = uuid4()
        entrada = {"productos": [{"codigo": "ABC123", "cantidad": 2}]}
        resultado = {"camion": {"chofer": "Prueba", "placa": "TEST"}, "cargadas": 2, "rechazadas": 0, "ocupacion": 20}
        guardar_resultado(identificador, entrada, entrada["productos"], resultado, 10, usuario["id"])
        self.assertEqual(self.client.get("/historial").json()["total"], 1)
        otra = self.registro("otra@example.test")
        self.assertEqual(self.client.get("/historial").json()["total"], 0)
        self.assertEqual(self.client.get("/dashboard").json()["optimizaciones"], 0)
        self.assertEqual(self.client.get("/historial/" + str(identificador)).status_code, 404)
        self.assertIsNone(buscar_resultado(identificador, otra["id"]))
        with self.assertRaises(ValueError):
            guardar_resultado(identificador, entrada, entrada["productos"], resultado, 10, otra["id"])
        with self.conn.cursor() as c:
            c.execute("UPDATE cuentas_usuario SET rol='admin' WHERE id=%s", (otra["id"],))
        self.assertEqual(self.client.get("/historial").json()["total"], 1)
        self.assertEqual(self.client.get("/historial/" + str(identificador)).status_code, 200)

    def test_ocr_requiere_sesion_cantidades_y_catalogo(self):
        self.assertEqual(self.client.post("/ocr/validar", json={"productos": [{"codigo": "ABC123", "cantidad": 1}]}).status_code, 401)
        self.registro()
        for cantidad in (0, -1, 1.5, True):
            self.assertEqual(self.client.post("/ocr/validar", json={"productos": [{"codigo": "ABC123", "cantidad": cantidad}]}).status_code, 422)
        self.assertEqual(self.client.post("/ocr/validar", json={"productos": [{"codigo": "NOEXISTE", "cantidad": 1}]}).status_code, 422)
        self.assertEqual(self.client.post("/ocr/validar", json={"productos": [{"codigo": "ABC123", "cantidad": 2}, {"codigo": "ABC123", "cantidad": 3}]}).json(), {"productos": [{"codigo": "ABC123", "cantidad": 5}]})
        self.assertEqual(self.client.post("/ocr/leer", files={"archivo": ("falso.jpg", b"invalido", "image/jpeg")}).status_code, 422)


class OCRParserTests(unittest.TestCase):
    def test_columnas_separadas_servicios_y_desconocidos(self):
        textos = ["ABC123 Caja de 12 rollos 24.00 2.00", "SERVIETIQ SERVICIO DE ETIQUETADO 1.00 0.00", "ZZZ999 Producto desconocido 5.00 0.00", "Total Elemento 30.00 2.00", "ET70 Chofer 1.00 0.00"]
        datos = {k: [] for k in ("text", "conf", "block_num", "par_num", "line_num", "left")}
        for linea, texto in enumerate(textos):
            for x, palabra in enumerate(texto.split()):
                for k, valor in {"text": palabra, "conf": 80, "block_num": 1, "par_num": 1, "line_num": linea, "left": x * 60}.items():
                    datos[k].append(valor)
        filas, _ = filas_desde_datos(datos, [{"codigo": "ABC123", "descripcion": "Caja real"}])
        self.assertEqual(len(filas), 3)
        self.assertEqual(filas[0]["unidad_principal"], "24.00")
        self.assertEqual(filas[0]["cj"], "2.00")
        self.assertNotIn("cantidad", filas[0])
        self.assertTrue(filas[1]["posible_servicio"])
        self.assertFalse(filas[2]["existe"])
