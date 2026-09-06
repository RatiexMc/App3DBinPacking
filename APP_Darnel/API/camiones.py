from fastapi import APIRouter
from database.conexion import conectar

router = APIRouter()


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