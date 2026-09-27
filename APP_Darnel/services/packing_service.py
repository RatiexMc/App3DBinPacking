
"""Adaptación de py3dbp: rotaciones completas y restricciones durante la colocación."""
from itertools import permutations
from py3dbp import Packer, Bin, Item
from py3dbp.constants import RotationType
from restricciones import validar_caja, hay_colision


def convertir(item):
    dimensiones = item.get_dimension()
    return {
        "id": item.name,
        "codigo": item.codigo,
        "nombre": item.descripcion,
        "x": float(item.position[0]), "y": float(item.position[1]), "z": float(item.position[2]),
        "largo": float(dimensiones[0]), "ancho": float(dimensiones[1]), "alto": float(dimensiones[2]),
        "peso": float(item.weight), "categoria_peso": item.categoria_peso, "apilable": item.apilable,
    }


class CamionConRestricciones(Bin):
    def __init__(self, *args):
        super().__init__(*args)
        self.cajas = []
        self.peso_actual = 0

    def put_item(self, item, pivot):
        anterior = item.position
        rotacion_anterior = item.rotation_type
        if self.peso_actual + item.weight > self.max_weight:
            return False
        probadas = set()
        for rotacion in RotationType.ALL:
            item.position = pivot
            item.rotation_type = rotacion
            dimensiones = item.get_dimension()
            forma = tuple(dimensiones)
            if forma in probadas:
                continue
            probadas.add(forma)
            if any(p < 0 or p + d > limite for p, d, limite in zip(pivot, dimensiones, (self.width, self.height, self.depth))):
                continue
            # Una orientación que colisiona no descarta las demás rotaciones.
            caja = convertir(item)
            if any(hay_colision(otra, caja) for otra in self.cajas):
                continue
            if not all(validar_caja(caja, self.cajas).values()):
                continue
            self.items.append(item)
            self.cajas.append(caja)
            self.peso_actual += item.weight
            return True
        item.position = anterior
        item.rotation_type = rotacion_anterior
        return False


def crear_items(productos):
    items = []
    for indice, producto in enumerate(productos):
        for numero in range(producto["cantidad"]):
            item = Item(str(indice) + "-" + str(numero), producto["largo"], producto["ancho"], producto["alto"], producto["peso"])
            item.codigo = producto["codigo"]
            item.descripcion = producto["descripcion"]
            item.categoria_peso = producto.get("categoria_peso", 1)
            item.apilable = producto.get("apilable", True)
            item.format_numbers(3)
            if any(valor <= 0 for valor in item.get_dimension()):
                raise ValueError("Las medidas deben ser positivas con precisión de tres decimales de centímetro.")
            items.append(item)
    return items


def ejecutar_packing(largo_camion, ancho_camion, alto_camion, peso_maximo, productos):
    """Compara tres órdenes deterministas; no garantiza el óptimo global."""
    volumen_camion = largo_camion * ancho_camion * alto_camion
    if min(largo_camion, ancho_camion, alto_camion, peso_maximo) <= 0:
        raise ValueError("Dimensiones y capacidad del camión deben ser positivas")
    estrategias = [
        ("Mayor volumen primero", lambda i: (-i.categoria_peso, -int(i.apilable), -i.get_volume())),
        ("Menor volumen primero", lambda i: (-i.categoria_peso, -int(i.apilable), i.get_volume())),
        ("Mayor lado primero", lambda i: (-i.categoria_peso, -int(i.apilable), -max(i.get_dimension()), -i.get_volume())),
    ]
    mejor = None
    for nombre, criterio in estrategias:
        camion = CamionConRestricciones("CAMION", largo_camion, ancho_camion, alto_camion, peso_maximo)
        camion.format_numbers(3)
        packer = Packer()
        for item in sorted(crear_items(productos), key=criterio):
            packer.pack_to_bin(camion, item)
        volumen = sum(c["largo"] * c["ancho"] * c["alto"] for c in camion.cajas)
        # Objetivo principal: aprovechar volumen; cantidad resuelve empates.
        puntuacion = (round(volumen, 6), len(camion.items))
        if mejor is None or puntuacion > mejor[0]:
            mejor = (puntuacion, camion, nombre)

    _, camion, estrategia = mejor
    pendientes = {}
    for item in camion.unfitted_items:
        cabe = any(all(float(d) <= limite for d, limite in zip(forma, (largo_camion, ancho_camion, alto_camion))) for forma in permutations((item.width, item.height, item.depth)))
        motivo = "La caja supera las medidas del camión en todas sus orientaciones." if not cabe else "No se encontró una posición con espacio, apoyo completo y reglas de apilado válidas."
        clave = (item.codigo, motivo)
        if clave not in pendientes:
            pendientes[clave] = {"codigo": item.codigo, "descripcion": item.descripcion, "cantidad": 0, "motivo": motivo}
        pendientes[clave]["cantidad"] += 1
    return {
        "camion": camion, "cajas": camion.cajas, "cargadas": len(camion.items),
        "rechazadas": len(camion.unfitted_items),
        "ocupacion": round(mejor[0][0] / volumen_camion * 100, 2),
        "sin_acomodar": list(pendientes.values()),
        "estrategia": estrategia,
        "motor_version": "py3dbp-apoyo-v1",
        "reglas": {"apoyo_base": "100%", "categorias": True, "apilabilidad": True, "rotaciones": 6},
    }

