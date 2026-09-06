from fastapi import APIRouter
from database.conexion import conectar
from pydantic import BaseModel

router = APIRouter()
class ProductoCreate(BaseModel):
    codigo: str
    descripcion: str
    largo: float
    ancho: float
    alto: float
    peso: float
    apilable: bool
    categoria_peso: int

@router.post("/productos")
def crear_producto(producto: ProductoCreate):

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO productos
        (
            codigo,
            descripcion,
            largo,
            ancho,
            alto,
            peso,
            apilable,
            categoria_peso
        )
        VALUES
        (
            %s,%s,%s,%s,
            %s,%s,%s,%s
        )
        """,
        (
            producto.codigo,
            producto.descripcion,
            producto.largo,
            producto.ancho,
            producto.alto,
            producto.peso,
            producto.apilable,
            producto.categoria_peso
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "mensaje": "Producto creado correctamente"
    }

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

@router.delete("/productos/{id_producto}")
def eliminar_producto(id_producto: int):

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM productos
        WHERE id_producto = %s
        """,
        (id_producto,)
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "mensaje": "Producto eliminado correctamente"
    }