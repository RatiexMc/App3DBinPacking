from fastapi import APIRouter
from database.conexion import conectar
from pydantic import BaseModel
router = APIRouter()

class CamionCreate(BaseModel):
    placa: str
    nombre_chofer: str
    apellido_chofer: str
    largo: float
    ancho: float
    alto: float
    peso_maximo: float


@router.get("/camiones")
def obtener_camiones():

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            id_camion,
            placa,
            nombre_chofer,
            apellido_chofer,
            largo,
            ancho,
            alto,
            peso_maximo
        FROM camiones
        ORDER BY id_camion;
    """)

    camiones = cursor.fetchall()

    datos = []

    for camion in camiones:

        datos.append({
            "id_camion": camion[0],
            "placa": camion[1],
            "nombre_chofer": camion[2],
            "apellido_chofer": camion[3],
            "largo": float(camion[4]),
            "ancho": float(camion[5]),
            "alto": float(camion[6]),
            "peso_maximo": float(camion[7])
        })

    cursor.close()
    conn.close()

    return datos



@router.post("/camiones")
def crear_camion(camion: CamionCreate):

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT 1
        FROM camiones
        WHERE placa = %s
        """,
        (camion.placa,)
    )

    existe = cursor.fetchone()

    if existe:

        cursor.close()
        conn.close()

        return {
            "error": "La placa ya existe"
        }

    cursor.execute(
        """
        INSERT INTO camiones
        (
            placa,
            nombre_chofer,
            apellido_chofer,
            largo,
            ancho,
            alto,
            peso_maximo
        )
        VALUES
        (
            %s,%s,%s,
            %s,%s,%s,%s
        )
        """,
        (
            camion.placa,
            camion.nombre_chofer,
            camion.apellido_chofer,
            camion.largo,
            camion.ancho,
            camion.alto,
            camion.peso_maximo
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "mensaje": "Camión creado correctamente"
    }

@router.put("/camiones/{id_camion}")
def actualizar_camion(
    id_camion: int,
    camion: CamionCreate
):

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT 1
        FROM camiones
        WHERE placa = %s
        AND id_camion <> %s
        """,
        (
            camion.placa,
            id_camion
        )
    )

    existe = cursor.fetchone()

    if existe:

        cursor.close()
        conn.close()

        return {
            "error": "La placa ya existe"
        }

    cursor.execute(
        """
        UPDATE camiones
        SET
            placa = %s,
            nombre_chofer = %s,
            apellido_chofer = %s,
            largo = %s,
            ancho = %s,
            alto = %s,
            peso_maximo = %s
        WHERE id_camion = %s
        """,
        (
            camion.placa,
            camion.nombre_chofer,
            camion.apellido_chofer,
            camion.largo,
            camion.ancho,
            camion.alto,
            camion.peso_maximo,
            id_camion
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "mensaje": "Camión actualizado correctamente"
    }

@router.delete("/camiones/{id_camion}")
def eliminar_camion(id_camion: int):

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM camiones
        WHERE id_camion = %s
        """,
        (id_camion,)
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "mensaje": "Camión eliminado correctamente"
    }