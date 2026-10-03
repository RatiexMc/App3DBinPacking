from fastapi import APIRouter, Depends, HTTPException
from services.auth_service import usuario_actual
from services.historial_service import transaccion
from database.conexion import conectar
from pydantic import BaseModel

router = APIRouter()

@router.get("/productos/frecuentes")
def frecuentes(usuario=Depends(usuario_actual)):
    """Frecuencia de planes propios, incluso para administradores; no despachos."""
    try:
        with transaccion() as cursor:
            cursor.execute("""
                WITH usos AS (
                    SELECT DISTINCT o.id, o.creado_en, item->>'codigo' AS codigo
                    FROM optimizaciones o
                    CROSS JOIN LATERAL jsonb_array_elements(o.productos) item
                    WHERE o.usuario_id = %s
                )
                SELECT p.codigo, p.descripcion, COUNT(*) AS optimizaciones
                FROM usos JOIN productos p ON p.codigo = usos.codigo
                GROUP BY p.codigo, p.descripcion
                ORDER BY COUNT(*) DESC, MAX(usos.creado_en) DESC, p.codigo
                LIMIT 20
            """, (str(usuario["id"]),))
            return cursor.fetchall()
    except Exception:
        raise HTTPException(503, "No pudimos consultar sus frecuentes. Puede usar el catálogo.") from None

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
        SELECT 1
        FROM productos
        WHERE codigo = %s
        """,
        (producto.codigo,)
    )

    existe = cursor.fetchone()

    if existe:

        cursor.close()
        conn.close()

        return {
            "error": "El código ya existe"
        }

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
        ORDER BY codigo;
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

@router.put("/productos/{id_producto}")
def actualizar_producto(
    id_producto: int,
    producto: ProductoCreate
):
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT 1
        FROM productos
        WHERE codigo = %s
        AND id_producto <> %s
        """,
        (
            producto.codigo,
            id_producto
        )
    )

    print("================================")
    print("ID recibido:", id_producto)
    print("Codigo recibido:", producto.codigo)

    existe = cursor.fetchone()

    print("Resultado SELECT:", existe)
    print("================================")

    if existe:
        cursor.close()
        conn.close()

        return {
            "error": "El código ya existe"
        }

    cursor.execute(
        """
        UPDATE productos
        SET
            codigo = %s,
            descripcion = %s,
            largo = %s,
            ancho = %s,
            alto = %s,
            peso = %s,
            apilable = %s,
            categoria_peso = %s
        WHERE id_producto = %s
        """,
        (
            producto.codigo,
            producto.descripcion,
            producto.largo,
            producto.ancho,
            producto.alto,
            producto.peso,
            producto.apilable,
            producto.categoria_peso,
            id_producto
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "mensaje": "Producto actualizado correctamente"
    }
