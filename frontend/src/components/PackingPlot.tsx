import Plot from "react-plotly.js";

type Caja = {
  nombre: string;
  x: number;
  y: number;
  z: number;
  largo: number;
  ancho: number;
  alto: number;
};

type Camion = {
  largo: number;
  ancho: number;
  alto: number;
};

type Props = {
  cajas: Caja[];
  camion: Camion;
};

function PackingPlot({
  cajas,
  camion,
}: Props) {

  const agregarAristas = (
    vertices: number[][]
  ) => {

    const aristas = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],

      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],

      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];

    aristas.forEach(
      ([inicio, fin]) => {

        data.push({
          type: "scatter3d",

          mode: "lines",

          x: [
            vertices[inicio][0],
            vertices[fin][0],
          ],

          y: [
            vertices[inicio][1],
            vertices[fin][1],
          ],

          z: [
            vertices[inicio][2],
            vertices[fin][2],
          ],

          line: {
            color: "black",
            width: 2,
          },

          showlegend: false,

          hoverinfo: "skip",
        });

      }
    );

  };

  const data: any[] = [];

  // ==========================================
  // CAMIÓN TRANSPARENTE
  // ==========================================

  const camionVertices = [
    [0, 0, 0],
    [camion.largo, 0, 0],
    [camion.largo, camion.ancho, 0],
    [0, camion.ancho, 0],

    [0, 0, camion.alto],
    [camion.largo, 0, camion.alto],
    [camion.largo, camion.ancho, camion.alto],
    [0, camion.ancho, camion.alto],
  ];

  data.push({
    type: "mesh3d",

    x: camionVertices.map((v) => v[0]),
    y: camionVertices.map((v) => v[1]),
    z: camionVertices.map((v) => v[2]),

    i: [0, 0, 4, 4, 0, 0, 1, 1, 2, 2, 3, 3],
    j: [1, 2, 5, 6, 1, 5, 2, 6, 3, 7, 0, 4],
    k: [2, 3, 6, 7, 5, 4, 6, 5, 7, 6, 4, 7],

    color: "lightblue",

    opacity: 0.08,

    name: "Camión",

    hoverinfo: "skip",
  });
  agregarAristas(camionVertices);










  // ==========================================
  // CAJAS
  // ==========================================

  cajas.forEach((caja) => {

    const vertices = [
      [caja.x, caja.y, caja.z],
      [caja.x + caja.largo, caja.y, caja.z],
      [caja.x + caja.largo, caja.y + caja.ancho, caja.z],
      [caja.x, caja.y + caja.ancho, caja.z],

      [caja.x, caja.y, caja.z + caja.alto],
      [caja.x + caja.largo, caja.y, caja.z + caja.alto],
      [
        caja.x + caja.largo,
        caja.y + caja.ancho,
        caja.z + caja.alto,
      ],
      [
        caja.x,
        caja.y + caja.ancho,
        caja.z + caja.alto,
      ],
    ];

    const x = vertices.map((v) => v[0]);
    const y = vertices.map((v) => v[1]);
    const z = vertices.map((v) => v[2]);

    data.push({
      type: "mesh3d",

      x,
      y,
      z,

      i: [0, 0, 4, 4, 0, 0, 1, 1, 2, 2, 3, 3],
      j: [1, 2, 5, 6, 1, 5, 2, 6, 3, 7, 0, 4],
      k: [2, 3, 6, 7, 5, 4, 6, 5, 7, 6, 4, 7],

      opacity: 0.85,

      color: `hsl(${Math.random() * 360},70%,60%)`,

      name: caja.nombre,

      hovertext:
        `<b>${caja.nombre}</b>
         <br>${caja.largo} × ${caja.ancho} × ${caja.alto} cm
         <br>Posición:
         (${caja.x}, ${caja.y}, ${caja.z})`,
      
      hoverinfo: "text",
    });




    agregarAristas(vertices);




  });

  return (
    <Plot
      data={data}
      layout={{
        title: "Visualización 3D de Carga",

        scene: {
          xaxis: {
            title: "Largo (cm)",
          },

          yaxis: {
            title: "Ancho (cm)",
          },

          zaxis: {
            title: "Alto (cm)",
          },

          aspectmode: "data",
        },

        margin: {
          l: 0,
          r: 0,
          b: 0,
          t: 50,
        },
      }}
      style={{
        width: "100%",
        height: "750px",
      }}
    />
  );
}

export default PackingPlot;