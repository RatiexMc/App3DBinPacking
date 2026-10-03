"""Validación compartida para foto de perfil y fotografías del picking."""
from io import BytesIO
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import HTTPException
import warnings


def abrir_imagen(datos: bytes):
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(datos)) as origen:
                if origen.format not in ("JPEG", "PNG", "WEBP"):
                    raise HTTPException(422, "Use una imagen JPG, PNG o WebP.")
                if origen.width * origen.height > 20_000_000:
                    raise HTTPException(422, "La imagen es demasiado grande. Redúzcala a menos de 20 megapíxeles.")
                # Corrige orientación de cámara y elimina metadatos al generar la copia.
                return ImageOps.exif_transpose(origen).convert("RGB")
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(422, "No pudimos abrir la imagen. Elija una foto JPG, PNG o WebP válida.") from None
