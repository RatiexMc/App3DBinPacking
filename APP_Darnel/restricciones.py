# ============================================================
# RESTRICCIONES LOGÍSTICAS
# VERSIÓN 3
#
# Autor: Junior Velaustegui
# Proyecto:
# Optimización de carga de camiones mediante Bin Packing 3D
#
# ============================================================


# ============================================================
# VALIDAR GRAVEDAD
# ============================================================
#
# Ninguna caja puede quedar por debajo del piso.
#
# z = altura
#
# ============================================================

def validar_gravedad(caja):

    z = caja["z"]

    if z < 0:
        return False

    return True


# ============================================================
# VALIDAR APOYO MÍNIMO
# ============================================================
#
# Regla actual:
#
# Si una caja está en el suelo (z=0),
# automáticamente tiene apoyo.
#
# Si está elevada,
# debe existir una caja debajo.
#
# NOTA:
# Más adelante calcularemos porcentaje real
# de apoyo.
#
# ============================================================

def validar_apoyo_minimo(caja, cajas_generadas):

    if caja["z"] == 0:
        return True

    for otra_caja in cajas_generadas:

        if otra_caja == caja:
            continue

        altura_superior = (
            otra_caja["z"]
            + otra_caja["alto"]
        )

        if altura_superior == caja["z"]:
            return True

    return False


# ============================================================
# VALIDAR CATEGORÍA DE PESO
# ============================================================
#
# Categorías:
#
# 1 = Liviano
# 2 = Medio
# 3 = Pesado
#
# Regla:
#
# Pesado jamás encima de liviano.
#
# ============================================================

def validar_categoria_peso(
        categoria_superior,
        categoria_inferior):

    if categoria_superior > categoria_inferior:
        return False

    return True


# ============================================================
# VALIDAR ESTABILIDAD
# ============================================================
#
# Esta primera versión es básica.
#
# Más adelante:
#
# - centro de masa
# - apoyo mínimo
# - porcentaje de superficie soportada
#
# ============================================================

def validar_estabilidad(caja):

    if caja["z"] < 0:
        return False

    return True


# ============================================================
# VALIDACIÓN GENERAL
# ============================================================
#
# Ejecuta todas las restricciones.
#
# ============================================================

def validar_caja(caja, cajas_generadas):

    resultados = {

        "gravedad":
            validar_gravedad(caja),

        "apoyo":
            validar_apoyo_minimo(
                caja,
                cajas_generadas
            ),

        "estabilidad":
            validar_estabilidad(caja)

    }

    return resultados