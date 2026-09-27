
"""Reglas geométricas de carga. Ejes del proyecto: X=largo, Y=ancho, Z=alto."""
EPSILON = 1e-6


def validar_gravedad(caja):
    return caja["z"] >= -EPSILON


def area_contacto(superior, inferior):
    """Superficie compartida en XY si ambas cajas se tocan en altura."""
    if abs(inferior["z"] + inferior["alto"] - superior["z"]) > EPSILON:
        return 0.0
    largo = min(superior["x"] + superior["largo"], inferior["x"] + inferior["largo"]) - max(superior["x"], inferior["x"])
    ancho = min(superior["y"] + superior["ancho"], inferior["y"] + inferior["ancho"]) - max(superior["y"], inferior["y"])
    return max(0.0, largo) * max(0.0, ancho)


def soportes(caja, cajas_generadas):
    encontrados = []
    for otra in cajas_generadas:
        if otra is caja:
            continue
        area = area_contacto(caja, otra)
        if area > EPSILON:
            encontrados.append((otra, area))
    return encontrados


def hay_colision(a, b):
    return (min(a["x"] + a["largo"], b["x"] + b["largo"]) - max(a["x"], b["x"]) > EPSILON
            and min(a["y"] + a["ancho"], b["y"] + b["ancho"]) - max(a["y"], b["y"]) > EPSILON
            and min(a["z"] + a["alto"], b["z"] + b["alto"]) - max(a["z"], b["z"]) > EPSILON)


def validar_apoyo_minimo(caja, cajas_generadas):
    if not validar_gravedad(caja):
        return False
    if abs(caja["z"]) <= EPSILON:
        return True
    base = caja["largo"] * caja["ancho"]
    # Las cajas de apoyo no pueden solaparse: el motor comprueba colisiones.
    area = sum(contacto for _, contacto in soportes(caja, cajas_generadas))
    return base > 0 and area + EPSILON >= base


def validar_categoria_peso(categoria_superior, categoria_inferior):
    return categoria_superior <= categoria_inferior


def validar_estabilidad(caja, cajas_generadas=None):
    # Apoyo completo es una aproximación geométrica; no modela deformación ni resistencia.
    return validar_apoyo_minimo(caja, cajas_generadas or [])


def validar_caja(caja, cajas_generadas):
    debajo = soportes(caja, cajas_generadas)
    area = sum(contacto for _, contacto in debajo)
    base = caja["largo"] * caja["ancho"]
    apoyo = validar_gravedad(caja) and base > 0 and (abs(caja["z"]) <= EPSILON or area + EPSILON >= base)
    return {
        "gravedad": validar_gravedad(caja),
        "apoyo": apoyo,
        "estabilidad": apoyo,
        "categoria": all(validar_categoria_peso(caja.get("categoria_peso", 1), otra.get("categoria_peso", 1)) for otra, _ in debajo),
        "apilable": all(otra.get("apilable", True) for otra, _ in debajo),
    }
