# ============================================================
# PRUEBA DEL NÚCLEO DEL PROYECTO DE TESIS
#
# Objetivo:
# Verificar que el algoritmo py3dbp pueda acomodar
# productos dentro de un camión.
#
# Todavía NO usamos:
# - PostgreSQL
# - OCR
# - OpenCV
# - Flutter
# - Visualización 3D
#
# Solamente probamos el motor de carga.
# ============================================================
# Importamos las clases principales de py3dbp
from py3dbp import Packer, Bin, Item
# ============================================================
# PASO 1 - CREAR EL EMPAQUETADOR
# ============================================================
#
# Packer es el "director" del algoritmo.
# Aquí registraremos:
# - Camiones
# - Productos
#
# Luego él intentará acomodarlos.
# ============================================================
packer = Packer()
# ============================================================
# PASO 2 - CREAR EL CAMIÓN
# ============================================================
#
# Bin representa un contenedor.
#
# En nuestro proyecto:
# Bin = Camión
#
# Parámetros:
# nombre
# largo
# ancho
# alto
# peso máximo
# ============================================================
camion = Bin(
    "Camion Prueba",
    368,      # largo en cm
    158,      # ancho en cm
    148,      # alto en cm
    999999    # peso máximo (gigante para pruebas)
)
# Agregamos el camión al algoritmo
packer.add_bin(camion)
# ============================================================
# PASO 3 - CREAR PRODUCTOS
# ============================================================
#
# Simulamos productos reales.
#
# Cada Item representa una caja.
#
# Queremos crear muchas cajas para obligar al
# algoritmo a decidir cuáles entran y cuáles no.
# ============================================================
for i in range(400):
    producto = Item(
        f"Caja {i+1}",
        20,   # largo
        16,   # ancho
        23,   # alto
        1     # peso
    )
    # Guardamos el producto dentro del packer
    packer.add_item(producto)
# ============================================================
# PASO 4 - VERIFICACIÓN
# ============================================================
print("\n======================================")
print("PRODUCTOS CARGADOS")
print("======================================")
print(f"Items cargados: {len(packer.items)}")
# ============================================================
# PASO 5 - EJECUTAR EL ALGORITMO
# ============================================================
#
# Aquí ocurre la magia.
#
# py3dbp analiza:
#
# - Dimensiones del camión
# - Dimensiones de cada caja
#
# Después intenta acomodarlas.
#
# Las que no encuentren espacio quedarán
# en unfitted_items.
# ============================================================
packer.pack()
# ============================================================
# PASO 6 - RESULTADOS GENERALES
# ============================================================
print("\n======================================")
print("RESUMEN GENERAL")
print("======================================")
print(f"Entraron: {len(camion.items)}")
print(f"No entraron: {len(camion.unfitted_items)}")
print(
    f"Total analizado: "
    f"{len(camion.items) + len(camion.unfitted_items)}"
)
# ============================================================
# PASO 7 - MOSTRAR ALGUNAS CAJAS CARGADAS
# ============================================================
#
# position indica:
#
# X
# Y
# Z
#
# donde py3dbp decidió colocar la caja.
# ============================================================
print("\n======================================")
print("PRIMERAS 10 CAJAS CARGADAS")
print("======================================")
for item in camion.items[:10]:
    print(
        f"{item.name} "
        f"| Posición: {item.position}"
    )
# ============================================================
# PASO 8 - MOSTRAR ALGUNAS CAJAS RECHAZADAS
# ============================================================
print("\n======================================")
print("PRIMERAS 10 CAJAS NO CARGADAS")
print("======================================")
for item in camion.unfitted_items[:10]:
    print(item.name)
# ============================================================
# PASO 9 - CALCULAR VOLUMEN DEL CAMIÓN
# ============================================================
volumen_camion = 368 * 158 * 148
# ============================================================
# PASO 10 - CALCULAR VOLUMEN OCUPADO
# ============================================================
#
# Recorremos únicamente las cajas que sí
# entraron en el camión.
# ============================================================
volumen_ocupado = 0
for item in camion.items:

    volumen_item = (
        float(item.width)
        * float(item.height)
        * float(item.depth)
    )

    volumen_ocupado += volumen_item
# ============================================================
# PASO 11 - ESPACIO LIBRE
# ============================================================
volumen_desperdiciado = (
    volumen_camion - volumen_ocupado
)
# ============================================================
# PASO 12 - PORCENTAJE DE OCUPACIÓN
# ============================================================
porcentaje_ocupacion = (
    volumen_ocupado /
    volumen_camion
) * 100
# ============================================================
# PASO 13 - RESULTADOS FINALES
# ============================================================
print("\n======================================")
print("ESTADÍSTICAS")
print("======================================")
print(
    f"Volumen camión: "
    f"{volumen_camion:,.0f} cm³"
)
print(
    f"Volumen ocupado: "
    f"{volumen_ocupado:,.0f} cm³"
)
print(
    f"Volumen desperdiciado: "
    f"{volumen_desperdiciado:,.0f} cm³"
)
print(
    f"Ocupación: "
    f"{porcentaje_ocupacion:.2f}%"
)