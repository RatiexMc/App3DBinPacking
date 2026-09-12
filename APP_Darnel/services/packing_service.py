from py3dbp import Packer, Bin, Item


def ejecutar_packing(
    largo_camion,
    ancho_camion,
    alto_camion,
    peso_maximo,
    productos
):
    """
    productos:
    [
        {
            "codigo": "...",
            "descripcion": "...",
            "largo": 10,
            "ancho": 20,
            "alto": 30,
            "peso": 4,
            "cantidad": 5
        }
    ]
    """

    # ==========================================
    # CREAR PACKER
    # ==========================================

    packer = Packer()

    # ==========================================
    # CREAR CAMIÓN
    # ==========================================
    #
    # El camión representa el contenedor
    # donde py3dbp intentará acomodar
    # todas las cajas.
    #
    # ==========================================

    camion = Bin(
        "CAMION",
        largo_camion,
        ancho_camion,
        alto_camion,
        peso_maximo
    )

    packer.add_bin(camion)

    # ==========================================
    # GENERAR CAJAS SEGÚN CANTIDAD
    # ==========================================
    #
    # Si un producto tiene:
    #
    # cantidad = 10
    #
    # entonces se crean 10 cajas físicas.
    #
    # ==========================================

    for producto in productos:

        cantidad = producto["cantidad"]

        for i in range(cantidad):

            item = Item(
                producto["descripcion"],
                producto["largo"],
                producto["ancho"],
                producto["alto"],
                producto["peso"]
            )

            packer.add_item(item)

    # ==========================================
    # EJECUTAR PY3DBP
    # ==========================================

    packer.pack()

    # ==========================================
    # CONVERTIR RESULTADO A ESTRUCTURA PROPIA
    # ==========================================

    cajas_generadas = []

    for item in camion.items:

        posicion = item.position

        dimensiones = item.get_dimension()

        caja = {
            "nombre": item.name,
            "x": float(posicion[0]),
            "y": float(posicion[1]),
            "z": float(posicion[2]),
            "largo": float(dimensiones[0]),
            "ancho": float(dimensiones[1]),
            "alto": float(dimensiones[2]),
            "peso": float(item.weight)
        }

        cajas_generadas.append(caja)

    # ==========================================
    # CALCULAR VOLUMEN TOTAL DEL CAMIÓN
    # ==========================================

    volumen_camion = (
        largo_camion
        * ancho_camion
        * alto_camion
    )

    # ==========================================
    # CALCULAR VOLUMEN OCUPADO
    # ==========================================

    volumen_ocupado = 0

    for caja in cajas_generadas:

        volumen_ocupado += (
            caja["largo"]
            * caja["ancho"]
            * caja["alto"]
        )

    # ==========================================
    # CALCULAR PORCENTAJE DE OCUPACIÓN
    # ==========================================

    ocupacion = 0

    if volumen_camion > 0:

        ocupacion = round(
            (
                volumen_ocupado
                / volumen_camion
            ) * 100,
            2
        )

    # ==========================================
    # DEVOLVER RESULTADO FINAL
    # ==========================================

    return {
        "camion": camion,
        "cajas": cajas_generadas,
        "cargadas": len(camion.items),
        "rechazadas": len(camion.unfitted_items),
        "ocupacion": ocupacion
    }


# ==========================================
# PRUEBA LOCAL
# ==========================================

if __name__ == "__main__":

    productos = [
        {
            "codigo": "TEST001",
            "descripcion": "Caja Test",
            "largo": 20,
            "ancho": 20,
            "alto": 20,
            "peso": 1,
            "cantidad": 10
        }
    ]

    resultado = ejecutar_packing(
        largo_camion=200,
        ancho_camion=200,
        alto_camion=200,
        peso_maximo=1000,
        productos=productos
    )

    print("Cargadas:", resultado["cargadas"])
    print("Rechazadas:", resultado["rechazadas"])
    print("Ocupacion:", resultado["ocupacion"], "%")

    