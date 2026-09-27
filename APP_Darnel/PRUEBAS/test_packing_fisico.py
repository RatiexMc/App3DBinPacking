import random
import unittest
from py3dbp import Item
from restricciones import validar_apoyo_minimo, validar_caja
from services.packing_service import CamionConRestricciones, ejecutar_packing


def producto(codigo="A", largo=2, ancho=2, alto=2, cantidad=1, categoria=1, apilable=True):
    return dict(codigo=codigo, descripcion=codigo, largo=largo, ancho=ancho, alto=alto,
                cantidad=cantidad, categoria_peso=categoria, apilable=apilable, peso=0)


def item(largo, ancho, alto):
    caja = Item("TEST", largo, ancho, alto, 0)
    caja.codigo = caja.descripcion = "TEST"
    caja.categoria_peso = 1
    caja.apilable = True
    caja.format_numbers(3)
    return caja


class PackingFisicoTests(unittest.TestCase):
    def test_prueba_otra_rotacion_despues_de_colision(self):
        camion = CamionConRestricciones("T", 4, 4, 2, 100)
        camion.format_numbers(3)
        self.assertTrue(camion.put_item(item(2, 2, 2), [2, 0, 0]))
        segunda = item(3, 2, 2)
        self.assertTrue(camion.put_item(segunda, [0, 0, 0]))
        self.assertEqual(list(map(float, segunda.get_dimension())), [2, 3, 2])

    def test_caja_lejana_no_cuenta_como_apoyo(self):
        superior = dict(x=0, y=0, z=2, largo=2, ancho=2, alto=2)
        lejos = dict(x=10, y=10, z=0, largo=2, ancho=2, alto=2)
        self.assertFalse(validar_apoyo_minimo(superior, [lejos]))

    def test_apoyo_completo_puede_repartirse_entre_cajas(self):
        superior = dict(x=0, y=0, z=2, largo=4, ancho=2, alto=2)
        inferiores = [dict(x=x, y=0, z=0, largo=2, ancho=2, alto=2) for x in [0, 2]]
        self.assertTrue(validar_apoyo_minimo(superior, inferiores))
        self.assertFalse(validar_apoyo_minimo(superior, inferiores[:1]))

    def test_no_apilar_sobre_no_apilable(self):
        resultado = ejecutar_packing(2, 2, 4, 100, [producto(cantidad=2, apilable=False)])
        self.assertEqual(resultado["cargadas"], 1)
        self.assertEqual(resultado["rechazadas"], 1)

    def test_pesado_debajo_de_liviano(self):
        resultado = ejecutar_packing(2, 2, 4, 100, [producto("liviano"), producto("pesado", categoria=3)])
        self.assertEqual(resultado["cargadas"], 2)
        self.assertEqual(resultado["cajas"][0]["codigo"], "pesado")
        self.assertEqual(resultado["cajas"][0]["z"], 0)

    def test_ocupacion_y_caja_demasiado_grande(self):
        resultado = ejecutar_packing(4, 4, 4, 100, [producto(cantidad=8), producto("GRANDE", 8, 8, 8)])
        self.assertEqual(resultado["ocupacion"], 100)
        self.assertEqual(resultado["cargadas"], 8)
        self.assertIn("supera", resultado["sin_acomodar"][0]["motivo"])

    def test_cargas_variadas_sin_colisiones_y_con_apoyo(self):
        azar = random.Random(27)
        for caso in range(12):
            productos = [producto(str(i), azar.randint(2, 7), azar.randint(2, 7), azar.randint(2, 7), azar.randint(1, 4), azar.randint(1, 3)) for i in range(6)]
            resultado = ejecutar_packing(12, 10, 10, 1000, productos)
            cajas = resultado["cajas"]
            self.assertEqual(resultado["cargadas"] + resultado["rechazadas"], sum(p["cantidad"] for p in productos))
            self.assertEqual(len({c["id"] for c in cajas}), len(cajas))
            for i, caja in enumerate(cajas):
                self.assertTrue(all(validar_caja(caja, cajas).values()), (caso, caja))
                for eje, medida, limite in [("x", "largo", 12), ("y", "ancho", 10), ("z", "alto", 10)]:
                    self.assertGreaterEqual(caja[eje], 0)
                    self.assertLessEqual(caja[eje] + caja[medida], limite + 1e-6)
                for otra in cajas[i+1:]:
                    solapa = all(min(caja[e]+caja[d], otra[e]+otra[d])-max(caja[e], otra[e]) > 1e-6 for e,d in [("x","largo"),("y","ancho"),("z","alto")])
                    self.assertFalse(solapa, (caso, caja, otra))
            volumen = sum(c["largo"]*c["ancho"]*c["alto"] for c in cajas)
            self.assertEqual(resultado["ocupacion"], round(volumen/1200*100, 2))


if __name__ == "__main__":
    unittest.main()
