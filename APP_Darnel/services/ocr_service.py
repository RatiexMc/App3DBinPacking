"""OCR local: preparar la foto, reconocer palabras y proponer filas para revisión.

Las cantidades reconocidas se conservan como texto. Este módulo NO decide cuántas
cajas cargar: esa decisión corresponde al operador, después de revisar el picking.
"""
import base64
from collections import defaultdict
from difflib import get_close_matches
from io import BytesIO
import os
from pathlib import Path
import re
import shutil
import time
from decimal import Decimal, InvalidOperation
from threading import BoundedSemaphore

import cv2
import numpy as np
from PIL import Image
import pytesseract
from fastapi import HTTPException
from services.imagenes import abrir_imagen

MOTOR_LOCAL = Path(__file__).resolve().parents[2] / ".tools" / "tesseract" / "tesseract.exe"
pytesseract.pytesseract.tesseract_cmd = os.environ.get("TESSERACT_CMD") or (str(MOTOR_LOCAL) if MOTOR_LOCAL.exists() else shutil.which("tesseract") or "tesseract")
# Un trabajo por proceso evita que varias fotos consuman toda la CPU de la PC.
TURNO = BoundedSemaphore(1)
NUMERO = re.compile(r"^\d+(?:[.,]\d+)*$")
CODIGO = re.compile(r"^[A-Z0-9][A-Z0-9_\-/]{2,39}$", re.I)


def _filas_legacy(datos, catalogo):
    lineas = defaultdict(list)
    for i, texto in enumerate(datos["text"]):
        if texto.strip() and float(datos["conf"][i]) >= 0:
            clave = (datos["block_num"][i], datos["par_num"][i], datos["line_num"][i])
            lineas[clave].append((datos["left"][i], texto.strip(), float(datos["conf"][i])))
    filas, textos = [], []
    codigos = {p["codigo"].upper(): p for p in catalogo}
    for palabras in lineas.values():
        palabras.sort()
        texto = " ".join(p[1] for p in palabras)
        textos.append(texto)
        tokens = texto.split()
        # Las marcas a lápiz o viñetas suelen aparecer antes del código.
        while tokens and not any(c.isalnum() for c in tokens[0]):
            tokens.pop(0)
        if not tokens:
            continue
        # Una marca manuscrita puede reconocerse como «e», «y» o «4».
        # Buscamos el primer código plausible entre las primeras cuatro palabras;
        # no sustituimos letras por números ni corregimos códigos silenciosamente.
        inicio = next((i for i, token in enumerate(tokens[:4])
                       if CODIGO.fullmatch(token.strip("*•.,:;|“”‘’¢%»+()[]").upper())
                       and ((any(c.isdigit() for c in token) and any(c.isalpha() for c in token))
                            or token.upper() in codigos or token.upper().startswith("SERVI"))), None)
        if inicio is None:
            continue
        tokens = tokens[inicio:]
        codigo = tokens[0].strip("*•.,:;|“”‘’¢%»+()[]").upper()
        if codigo.startswith("ET") and re.fullmatch(r"ET\d{1,4}", codigo):
            continue  # Encabezado de transporte, no un artículo.
        if not CODIGO.fullmatch(codigo) or not (any(c.isdigit() for c in codigo) or codigo in codigos or codigo.startswith("SERVI")):
            continue
        cantidades = []
        while len(tokens) > 1 and not any(c.isalnum() for c in tokens[-1]):
            tokens.pop()
        # Solo las dos cifras finales: los números de la descripción no se
        # interpretan como cantidades ni como unidades por caja.
        while len(tokens) > 1 and len(cantidades) < 2 and NUMERO.fullmatch(tokens[-1]):
            cantidades.insert(0, tokens.pop())
        descripcion = " ".join(tokens[1:])
        producto = codigos.get(codigo)
        sugerencias = [] if producto else get_close_matches(codigo, list(codigos), n=3, cutoff=.68)
        filas.append({
            "codigo": producto["codigo"] if producto else codigo,
            "descripcion_leida": descripcion, "texto_original": texto,
            "unidad_principal": cantidades[0] if len(cantidades) == 2 else "",
            "cj": cantidades[1] if len(cantidades) == 2 else "",
            "cantidad_ambigua": cantidades[0] if len(cantidades) == 1 else "",
            "confianza": round(sum(p[2] for p in palabras) / len(palabras)),
            "existe": producto is not None,
            "descripcion_catalogo": producto["descripcion"] if producto else "",
            "sugerencias": [codigos[c]["codigo"] for c in sugerencias],
            "posible_servicio": codigo.startswith("SERVI") or "SERVICIO" in descripcion.upper(),
        })
    return filas, "\n".join(textos)


def entero_cj(texto):
    # Solo decimal simple: separadores de miles o marcas manuscritas son ambiguos.
    if not re.fullmatch(r"\d+(?:[.,]0{1,2})?", texto):
        return None
    try:
        valor = Decimal(texto.replace(",", "."))
        return int(valor) if 0 < valor <= 9007199254740991 else None
    except InvalidOperation:
        return None


def _palabras(datos):
    return [dict(texto=t.strip(), x=int(datos["left"][i]), y=int(datos["top"][i]),
                 w=int(datos["width"][i]), h=int(datos["height"][i]), conf=float(datos["conf"][i]),
                 linea=(datos["block_num"][i], datos["par_num"][i], datos["line_num"][i]))
            for i, t in enumerate(datos["text"]) if t.strip() and float(datos["conf"][i]) >= 0]


def _agrupar(palabras):
    # Una línea de tabla puede estar dividida entre bloques de Tesseract.
    alturas = [p["h"] for p in palabras if len(p["texto"]) > 2 and p["h"] > 0]
    alto = float(np.median(alturas)) if alturas else 16
    pendientes = []
    lineas = defaultdict(list)
    for p in palabras:
        lineas[p["linea"]].append(p)
    for grupo in lineas.values():
        grupo.sort(key=lambda p: p["x"])
        if len(grupo) >= 4 and grupo[-1]["x"] - grupo[0]["x"] > 200:
            izq, der = grupo[0], grupo[-1]
            pendiente = (der["y"] + der["h"] / 2 - izq["y"] - izq["h"] / 2) / (der["x"] - izq["x"])
            if abs(pendiente) < .2:
                pendientes.append(pendiente)
    pendiente = float(np.median(pendientes)) if pendientes else 0
    grupos = []
    for p in sorted(palabras, key=lambda p: p["y"] + p["h"] / 2 - pendiente * p["x"]):
        centro = p["y"] + p["h"] / 2 - pendiente * p["x"]
        if grupos and abs(centro - np.median([v[0] for v in grupos[-1]])) <= alto * .6:
            grupos[-1].append((centro, p))
        else:
            grupos.append([(centro, p)])
    return [sorted([p for _, p in g], key=lambda p: p["x"]) for g in grupos]


def _datos_fila(palabras):
    return {"text": [p["texto"] for p in palabras], "conf": [p["conf"] for p in palabras],
            "left": [p["x"] for p in palabras], "block_num": [1] * len(palabras),
            "par_num": [1] * len(palabras), "line_num": [1] * len(palabras)}


def filas_desde_datos(datos, catalogo):
    if not all(k in datos for k in ("top", "height", "width")):
        return _filas_legacy(datos, catalogo)
    palabras = _palabras(datos)
    grupos = _agrupar(palabras)
    codigos = {p["codigo"].upper(): p for p in catalogo}
    filas = []
    # El encabezado ubica la columna; una cifra final por sí sola no prueba que sea CJ.
    principal = [p for p in palabras if "PRINCIPAL" in p["texto"].upper()]
    encabezado = next((p for p in palabras if p["texto"].upper().strip(".:") == "CJ"
                      and any(abs(p["y"] - u["y"]) < max(p["h"], u["h"]) * 3
                              and p["x"] > u["x"] for u in principal)), None)
    candidatos = []
    for grupo in grupos:
        lectura, _ = _filas_legacy(_datos_fila(grupo), catalogo)
        if lectura:
            candidatos.append((grupo, lectura[0]))
    # Evita interpretar números alfanuméricos de la descripción como nuevas filas.
    inicios = [g[0]["x"] for g, _ in candidatos]
    izquierda = float(np.median(inicios)) if inicios else 0
    for grupo, fila in candidatos:
        if grupo[0]["x"] > izquierda + 150:
            continue
        if encabezado and max(p["y"] + p["h"] for p in grupo) <= encabezado["y"]:
            continue
        originales = " ".join(p["texto"] for p in grupo)
        # Fragmentos adyacentes solo se unen si forman exactamente un código real.
        for i in range(min(3, len(grupo))):
            for largo in (2, 3):
                parte = grupo[i:i+largo]
                unido = "".join(p["texto"].strip("*•.,:;|“”‘’¢%»+()[]") for p in parte).upper()
                if len(parte) == largo and unido in codigos and all(
                    b["x"] - a["x"] - a["w"] <= max(a["h"], b["h"]) for a,b in zip(parte,parte[1:])):
                    fila["codigo"] = codigos[unido]["codigo"]
                    fila["existe"] = True
                    fila["descripcion_catalogo"] = codigos[unido]["descripcion"]
                    fila["sugerencias"] = []
        fila["texto_original"] = originales
        x, y = min(p["x"] for p in grupo), min(p["y"] for p in grupo)
        fila["ubicacion"] = {"x": x, "y": y, "ancho": max(p["x"] + p["w"] for p in grupo) - x,
                            "alto": max(p["y"] + p["h"] for p in grupo) - y}
        fila["cj_identificada"] = False
        fila["cajas_sugeridas"] = None
        if encabezado:
            derecha = encabezado["x"] + encabezado["w"]
            margen = max(35, encabezado["h"] * 3)
            columna = [p for p in grupo if abs(p["x"] + p["w"] - derecha) <= margen and NUMERO.fullmatch(p["texto"])]
            if len(columna) == 1:
                fila["cj"] = columna[0]["texto"]
                fila["cj_identificada"] = True
                fila["cajas_sugeridas"] = entero_cj(fila["cj"])
        filas.append(fila)
    return filas, "\n".join(" ".join(p["texto"] for p in grupo) for grupo in grupos)


def releer_codigos(gris, palabras, catalogo, limite):
    """Relee la columna de códigos, conservando coordenadas y sin corregir por similitud."""
    tokens = _palabras(palabras)
    filas, _ = filas_desde_datos(palabras, catalogo)
    if len(filas) < 2 or time.monotonic() >= limite:
        return palabras
    # Los códigos se concentran en el borde izquierdo de la tabla.
    starts = [f["ubicacion"]["x"] for f in filas]
    x0 = max(0, int(np.median(starts)) - 8)
    grupos = _agrupar(tokens)
    limites = []
    for g in grupos:
        for izq, der in zip(g, g[1:]):
            if x0 <= izq["x"] < x0 + gris.shape[1] * .2 and der["x"] - izq["x"] - izq["w"] > izq["h"] * 1.5:
                limites.append(der["x"])
                break
    if not limites:
        return palabras
    x1 = int(np.median(limites)) - 5
    if x1 <= x0 + 60 or x1 > x0 + gris.shape[1] * .3:
        return palabras
    y0 = max(0, min(f["ubicacion"]["y"] for f in filas) - 25)
    y1 = min(gris.shape[0], max(f["ubicacion"]["y"] + f["ubicacion"]["alto"] for f in filas) + 10)
    recorte = gris[y0:y1, x0:x1]
    nueva = pytesseract.image_to_data(recorte, lang="eng", config="--psm 6 -c preserve_interword_spaces=1",
                                     output_type=pytesseract.Output.DICT, timeout=max(1, min(12, int(limite-time.monotonic()))))
    # Sustituye solo esta región por su nueva lectura; el catálogo nunca decide el texto.
    conservar = [i for i,t in enumerate(palabras["text"]) if t.strip() and
                 not (x0 <= palabras["left"][i] < x1 and y0 <= palabras["top"][i] < y1)]
    salida = {k: [v[i] for i in conservar] for k,v in palabras.items()}
    for i,t in enumerate(nueva["text"]):
        if not t.strip():
            continue
        for k in salida:
            valor = nueva[k][i]
            if k == "left": valor += x0
            if k == "top": valor += y0
            if k == "block_num": valor += 10000
            salida[k].append(valor)
    return salida


def preparar(imagen, mejorar, giro):
    pasos = []
    if giro != "auto":
        imagen = imagen.rotate(-int(giro), expand=True, fillcolor="white")
        pasos.append("Giro manual: " + giro + "°")
    else:
        try:
            orientacion = pytesseract.image_to_osd(imagen, output_type=pytesseract.Output.DICT, timeout=15)
            if orientacion["rotate"] and orientacion["orientation_conf"] >= 2:
                imagen = imagen.rotate(-orientacion["rotate"], expand=True, fillcolor="white")
                pasos.append("Orientación corregida automáticamente")
        except (pytesseract.TesseractError, RuntimeError):
            pasos.append("No se pudo determinar la orientación; revise la vista previa")
    # Acota el trabajo y amplía fotos pequeñas para facilitar la lectura impresa.
    escala = min(2, 2400 / max(imagen.size))
    imagen = imagen.resize((round(imagen.width * escala), round(imagen.height * escala)))
    gris = cv2.cvtColor(np.array(imagen), cv2.COLOR_RGB2GRAY)
    if mejorar:
        # Estima una inclinación pequeña usando los bordes horizontales del papel/texto.
        bordes = cv2.Canny(gris, 60, 160)
        lineas = cv2.HoughLinesP(bordes, 1, np.pi / 180, 100, minLineLength=gris.shape[1] // 5, maxLineGap=25)
        angulos = []
        if lineas is not None:
            # OpenCV 4 y 5 devuelven formas distintas; normalizamos a N × 4.
            for x1, y1, x2, y2 in np.asarray(lineas).reshape(-1, 4):
                angulo = np.degrees(np.arctan2(y2 - y1, x2 - x1))
                if abs(angulo) < 12:
                    angulos.append(angulo)
        if angulos:
            angulo = float(np.median(angulos))
            if abs(angulo) > .3:
                imagen = imagen.rotate(angulo, expand=True, fillcolor="white")
                gris = cv2.cvtColor(np.array(imagen), cv2.COLOR_RGB2GRAY)
                pasos.append("Inclinación corregida con OpenCV")
        # División por el fondo suavizado reduce sombras sin borrar las letras.
        fondo = cv2.GaussianBlur(gris, (0, 0), 25)
        gris = cv2.divide(gris, fondo, scale=255)
        gris = cv2.normalize(gris, None, 0, 255, cv2.NORM_MINMAX)
        pasos.append("Sombras y contraste ajustados con OpenCV")
    return imagen, gris, pasos


def reconocer(datos, catalogo, mejorar=True, giro="auto"):
    if not TURNO.acquire(blocking=False):
        raise HTTPException(429, "Ya se está leyendo otra imagen. Espere unos momentos y vuelva a intentar.")
    try:
        limite = time.monotonic() + 55
        imagen = abrir_imagen(datos)
        imagen, gris, pasos = preparar(imagen, mejorar, giro)
        palabras = pytesseract.image_to_data(gris, lang="spa+eng", config="--psm 6", output_type=pytesseract.Output.DICT, timeout=30)
        filas, texto = filas_desde_datos(palabras, catalogo)
        # Conservamos una copia reducida para comparar el resultado con el papel.
        ancho, alto = imagen.size
        imagen.thumbnail((1600, 1600))
        for fila in filas:
            if "ubicacion" in fila:
                u = fila["ubicacion"]
                fila["ubicacion"] = {"x": u["x"] / ancho, "y": u["y"] / alto,
                                     "ancho": u["ancho"] / ancho, "alto": u["alto"] / alto}
        salida = BytesIO()
        imagen.save(salida, format="JPEG", quality=80)
        return {"filas": filas, "texto": texto, "pasos": pasos,
                "imagen": "data:image/jpeg;base64," + base64.b64encode(salida.getvalue()).decode(),
                "aviso": "Revise el picking completo: el OCR puede omitir filas o confundir códigos y cifras. Confirme las cajas reales; no sumamos U. Principal y CJ."}
    except pytesseract.TesseractNotFoundError:
        raise HTTPException(503, "El motor OCR local no está instalado. Configure Tesseract y el idioma español en esta computadora.") from None
    except pytesseract.TesseractError:
        raise HTTPException(503, "El motor OCR no pudo leer la foto. Compruebe los idiomas spa y eng, o pruebe otra imagen.") from None
    except RuntimeError:
        raise HTTPException(504, "La lectura tardó demasiado. Recorte el picking o use una foto más pequeña y nítida.") from None
    finally:
        TURNO.release()
