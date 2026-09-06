from database.conexion import conectar

try:
    # 1. Conexión y creación de cursor
    conn = conectar()
    cursor = conn.cursor()

    # 2. Consultar Productos
    cursor.execute("SELECT * FROM productos;")
    productos = cursor.fetchall()

    print("--- Productos encontrados ---")
    for producto in productos:
        print(producto)

    # 3. Consultar Camiones
    cursor.execute("SELECT * FROM camiones;")
    camiones = cursor.fetchall()

    print("\n--- Camiones encontrados ---")
    for camion in camiones:
        print(camion)

    # 4. Cerrar conexiones
    cursor.close()
    conn.close()

except Exception as e:
    print("Error:", repr(e))