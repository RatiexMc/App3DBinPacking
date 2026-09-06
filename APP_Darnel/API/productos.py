from fastapi import APIRouter
from database.conexion import conectar

router = APIRouter()


@router.get("/productos")
def obtener_productos():

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            id_producto,
            codigo,
            descripcion,
            largo,
            ancho,
            alto,
            apilable,
            categoria_peso
        FROM productos
        ORDER BY id_producto;
    """)

    productos = cursor.fetchall()

    datos = []

    for producto in productos:

        datos.append({
            "id_producto": producto[0],
            "codigo": producto[1],
            "descripcion": producto[2],
            "largo": float(producto[3]),
            "ancho": float(producto[4]),
            "alto": float(producto[5]),
            "apilable": producto[6],
            "categoria": producto[7]
        })

    cursor.close()
    conn.close()

    return datos