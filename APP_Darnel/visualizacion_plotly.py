# ============================================================
# VISUALIZACION 3D
#
# OBJETIVO:
#
# Recibir los resultados generados por py3dbp
# y mostrar:
#
# - Camión
# - Productos acomodados
# - Bordes negros
# - Hover con información
# - Colores automáticos
#
# ============================================================

# ============================================================
# IMPORTACIONES
# ============================================================

import plotly.graph_objects as go
import random


# ============================================================
# FUNCIÓN PARA AGREGAR CUBOS
# ============================================================

def agregar_cubo(
    fig,
    x,
    y,
    z,
    largo,
    ancho,
    alto,
    color,
    opacidad,
    nombre
):

    # ========================================================
    # CREAR VÉRTICES
    # ========================================================

    vertices = [

        [x, y, z],
        [x + largo, y, z],
        [x + largo, y + ancho, z],
        [x, y + ancho, z],

        [x, y, z + alto],
        [x + largo, y, z + alto],
        [x + largo, y + ancho, z + alto],
        [x, y + ancho, z + alto]

    ]

    # ========================================================
    # EXTRAER COORDENADAS
    # ========================================================

    x_coords = [v[0] for v in vertices]
    y_coords = [v[1] for v in vertices]
    z_coords = [v[2] for v in vertices]

    # ========================================================
    # TRIÁNGULOS DEL PRISMA
    # ========================================================

    i = [0,0,4,4,0,0,1,1,2,2,3,3]

    j = [1,2,5,6,1,5,2,6,3,7,0,4]

    k = [2,3,6,7,5,4,6,5,7,6,4,7]

    # ========================================================
    # DIBUJAR CUERPO DEL CUBO
    # ========================================================

    fig.add_trace(

        go.Mesh3d(

            x=x_coords,
            y=y_coords,
            z=z_coords,

            i=i,
            j=j,
            k=k,

            color=color,

            opacity=opacidad,

            name=nombre,

            hovertext=
            (
                f"Producto: {nombre}<br>"
                f"Largo: {largo} cm<br>"
                f"Ancho: {ancho} cm<br>"
                f"Alto: {alto} cm<br>"
                f"X: {x}<br>"
                f"Y: {y}<br>"
                f"Z: {z}"
            ),

            hoverinfo="text"
        )
    )

    # ========================================================
    # BORDES NEGROS
    # ========================================================

    aristas = [

        (0,1), (1,2), (2,3), (3,0),

        (4,5), (5,6), (6,7), (7,4),

        (0,4), (1,5), (2,6), (3,7)

    ]

    for inicio, fin in aristas:

        fig.add_trace(

            go.Scatter3d(

                x=[
                    vertices[inicio][0],
                    vertices[fin][0]
                ],

                y=[
                    vertices[inicio][1],
                    vertices[fin][1]
                ],

                z=[
                    vertices[inicio][2],
                    vertices[fin][2]
                ],

                mode="lines",

                line=dict(
                    color="black",
                    width=3
                ),

                showlegend=False,

                hoverinfo="skip"
            )
        )


# ============================================================
# FUNCIÓN PRINCIPAL
# ============================================================

def visualizar_carga(

    cajas_generadas,

    largo_camion,

    ancho_camion,

    alto_camion

):

    # ========================================================
    # CREAR FIGURA
    # ========================================================

    fig = go.Figure()

    # ========================================================
    # DIBUJAR CAMIÓN
    # ========================================================

    agregar_cubo(

        fig,

        x=0,
        y=0,
        z=0,

        largo=largo_camion,
        ancho=ancho_camion,
        alto=alto_camion,

        color="lightblue",

        opacidad=0.05,

        nombre="Camión"

    )

    # ========================================================
    # RECORRER CAJAS GENERADAS
    # ========================================================

    for caja in cajas_generadas:

        # ----------------------------------------------------
        # COLOR ALEATORIO
        # ----------------------------------------------------

        color = (

            random.randint(50,255),
            random.randint(50,255),
            random.randint(50,255)

        )

        color_rgb = f"rgb{color}"

        # ----------------------------------------------------
        # DIBUJAR PRODUCTO
        # ----------------------------------------------------

        agregar_cubo(

            fig,

            x=caja["x"],
            y=caja["y"],
            z=caja["z"],

            largo=caja["largo"],
            ancho=caja["ancho"],
            alto=caja["alto"],

            color=color_rgb,

            opacidad=0.90,

            nombre=caja["nombre"]

        )

    # ========================================================
    # CONFIGURAR ESCENA
    # ========================================================

    fig.update_layout(

        title=
        (
            f"Optimización 3D "
            f"({len(cajas_generadas)} productos)"
        ),

        scene=dict(

            xaxis_title="Largo (cm)",

            yaxis_title="Ancho (cm)",

            zaxis_title="Alto (cm)",

            aspectmode="data"

        ),

        margin=dict(
            l=0,
            r=0,
            t=50,
            b=0
        )

    )

    # ========================================================
    # MOSTRAR
    # ========================================================

    fig.show()