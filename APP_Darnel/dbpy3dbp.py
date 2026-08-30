# ============================================================
# PRUEBA BD + PY3DBP
# VERSIÓN 2
#
# OBJETIVO:
# Leer productos y camión desde PostgreSQL,
# cargarlos en py3dbp y calcular ocupación.
# ============================================================


# ============================================================
# IMPORTACIONES
# ============================================================
import visualizacion_plotly
# Función creada por nosotros para conectarnos a PostgreSQL
from database.conexion import conectar

# Clases de la librería py3dbp
from py3dbp import Packer, Bin, Item

#Llamar a restricciones
from restricciones import validar_gravedad
from restricciones import validar_apoyo_minimo
from restricciones import validar_estabilidad
from restricciones import validar_caja

# ============================================================
# CONEXIÓN A POSTGRESQL
# ============================================================

print("Conectando a PostgreSQL...")

# Crear conexión
conn = conectar()

# Crear cursor
cursor = conn.cursor()

print("Conexión exitosa.")


# ============================================================
# CREAR PACKER
# ============================================================
#
# El packer es quien coordina el algoritmo.
# Aquí agregaremos:
#
# - Camiones (Bin)
# - Productos (Item)
#
# ============================================================

packer = Packer()


# ============================================================
# LEER CAMIÓN
# ============================================================

cursor.execute("""
SELECT *
FROM camiones
LIMIT 1;
""")

# Obtener un solo registro
camion_bd = cursor.fetchone()


# ============================================================
# VALIDAR EXISTENCIA DEL CAMIÓN
# ============================================================

if camion_bd is None:

    print("No existe ningún camión registrado.")

    exit()


print("Camión encontrado.")

print(camion_bd)


# ============================================================
# EXTRAER DATOS DEL CAMIÓN
# ============================================================

id_camion = int(camion_bd[0])

placa_camion = str(camion_bd[1])

nombre_chofer = str(camion_bd[2])

apellido_chofer = str(camion_bd[3])

largo_camion = float(camion_bd[4])

ancho_camion = float(camion_bd[5])

alto_camion = float(camion_bd[6])

peso_maximo = float(camion_bd[7])


# ============================================================
# CREAR OBJETO BIN
# ============================================================
#
# Bin representa el camión.
#
# Estructura:
#
# Bin(
#     nombre,
#     largo,
#     ancho,
#     alto,
#     peso_maximo
# )
#
# ============================================================

camion = Bin(

    placa_camion,

    largo_camion,

    ancho_camion,

    alto_camion,

    peso_maximo
)


# ============================================================
# AGREGAR CAMIÓN AL PACKER
# ============================================================

packer.add_bin(camion)

print("Camión agregado al packer.")


# ============================================================
# LEER PRODUCTOS
# ============================================================

cursor.execute("""
SELECT *
FROM productos;
""")

# Obtener todos los productos
productos_bd = cursor.fetchall()


# ============================================================
# VALIDAR EXISTENCIA DE PRODUCTOS
# ============================================================

if len(productos_bd) == 0:

    print("No existen productos.")

    exit()


print()

print(f"Productos encontrados: {len(productos_bd)}")

print()


# ============================================================
# RECORRER PRODUCTOS
# ============================================================

for producto_bd in productos_bd:


    # ========================================================
    # MOSTRAR PRODUCTO
    # ========================================================

    print(producto_bd)


    # ========================================================
    # EXTRAER CAMPOS
    # ========================================================

    id_producto = int(producto_bd[0])

    codigo = str(producto_bd[1])

    descripcion = str(producto_bd[2])

    largo_producto = float(producto_bd[3])

    ancho_producto = float(producto_bd[4])

    alto_producto = float(producto_bd[5])

    peso_producto = float(producto_bd[6])


    # ========================================================
    # CREAR ITEM
    # ========================================================
    #
    # Item representa una caja/producto
    #
    # Item(
    #     nombre,
    #     largo,
    #     ancho,
    #     alto,
    #     peso
    # )
    #
    # ========================================================

    item = Item(

        descripcion,

        largo_producto,

        ancho_producto,

        alto_producto,

        peso_producto
    )


    # ========================================================
    # AGREGAR AL PACKER
    # ========================================================

    packer.add_item(item)


# ============================================================
# RESUMEN PREVIO
# ============================================================

print()

print("===================================")
print("DATOS CARGADOS")
print("===================================")

print(f"Camiones cargados: {len(packer.bins)}")

print(f"Productos cargados: {len(packer.items)}")
print()

print("Ejecutando py3dbp...")

packer.pack()

print("py3dbp terminó.")

print()

print("Entraron:", len(camion.items))

print("No entraron:", len(camion.unfitted_items))

# ==========================
# ============================================================
# CONVERTIR RESULTADO PY3DBP A ESTRUCTURA PROPIA
# ============================================================
#
# py3dbp utiliza objetos internos.
#
# Para nuestras restricciones, visualización
# y futuras mejoras, conviene convertir los datos
# a diccionarios propios.
#
# Cada caja quedará así:
#
# {
#     "nombre": "...",
#     "x": 0,
#     "y": 0,
#     "z": 0,
#     "largo": 20,
#     "ancho": 16,
#     "alto": 23,
#     "peso": 1
# }
#
# ============================================================

cajas_generadas = []

print()
print("===================================")
print("PRODUCTOS ACOMODADOS")
print("===================================")

for item in camion.items:

    # Obtener posición asignada por py3dbp
    posicion = item.position

    # Obtener dimensiones finales
    dimensiones = item.get_dimension()

    # Crear estructura propia
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

    # Guardar en lista
    cajas_generadas.append(caja)

    # Mostrar información
    print()
    print("Producto:", caja["nombre"])
    print("Posición:", (caja["x"], caja["y"], caja["z"]))
    print(
        "Dimensiones:",
        (
            caja["largo"],
            caja["ancho"],
            caja["alto"]
        )
    )
    print("Peso:", caja["peso"])

# ============================================================
# MOSTRAR ESTRUCTURA GENERADA
# ============================================================

print()
print("===================================")
print("LISTA FINAL DE CAJAS")
print("===================================")

for caja in cajas_generadas:

    print(caja)


# ============================================================
# PROBAR RESTRICCIONES
# ============================================================

print()
print("===================================")
print("VALIDANDO GRAVEDAD")
print("===================================")

for caja in cajas_generadas:

    resultado = validar_gravedad(caja)

    print()

    print("Caja:", caja["nombre"])

    if resultado:
        print("Gravedad: OK")
    else:
        print("Gravedad: ERROR")

print()
print("===================================")
print("VALIDANDO RESTRICCIONES")
print("===================================")

for caja in cajas_generadas:

    gravedad_ok = validar_gravedad(caja)

    apoyo_ok = validar_apoyo_minimo(
        caja,
        cajas_generadas
    )

    estabilidad_ok = validar_estabilidad(caja)

    print()
    print("Caja:", caja["nombre"])

    print("Gravedad:", gravedad_ok)

    print("Apoyo:", apoyo_ok)

    print("Estabilidad:", estabilidad_ok)
print()
print("===================================")
print("VALIDANDO RESTRICCIONES")
print("===================================")

for caja in cajas_generadas:

    resultado = validar_caja(
        caja,
        cajas_generadas
    )

    print()

    print("Caja:", caja["nombre"])

    print("Gravedad:",
          resultado["gravedad"])

    print("Apoyo:",
          resultado["apoyo"])

    print("Estabilidad:",
          resultado["estabilidad"])
    # ============================================================
# VISUALIZACIÓN 3D
# ============================================================

from visualizacion_plotly import visualizar_carga


visualizar_carga(

    cajas_generadas,

    largo_camion,

    ancho_camion,

    alto_camion

)