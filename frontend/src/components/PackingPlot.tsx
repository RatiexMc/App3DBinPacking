
import { useMemo } from "react";
import Plot from "react-plotly.js";
import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";
import { usePreferencias, guardarPreferencias } from "../context/preferenciasStore";

type Caja = { nombre: string; x: number; y: number; z: number; largo: number; ancho: number; alto: number };
type Props = { cajas: Caja[]; camion: { largo: number; ancho: number; alto: number } };
const aristas = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
const paleta = ["#3b82b8", "#44a69b", "#dba04d", "#9172b5", "#d67970", "#6696a6"];
function colorProducto(nombre: string) {
  let hash = 0;
  for (const caracter of nombre) hash = (hash * 31 + caracter.charCodeAt(0)) >>> 0;
  return paleta[hash % paleta.length];
}
function PackingPlot({ cajas, camion }: Props) {
  const { darkMode } = useThemeContext();
  const tema = darkMode ? colors.dark : colors.light;
  const { bordes, opacidad } = usePreferencias();
  const data = useMemo(() => {
    const trazas: Record<string, unknown>[] = [];
    function dibujar(caja: Caja, contenedor = false) {
      const { x, y, z, largo: l, ancho: a, alto: h } = caja;
      const vertices = [[x,y,z],[x+l,y,z],[x+l,y+a,z],[x,y+a,z],[x,y,z+h],[x+l,y,z+h],[x+l,y+a,z+h],[x,y+a,z+h]];
      trazas.push({
        type: "mesh3d", x: vertices.map(v => v[0]), y: vertices.map(v => v[1]), z: vertices.map(v => v[2]),
        i: [0,0,4,4,0,0,1,1,2,2,3,3], j: [1,2,5,6,1,5,2,6,3,7,0,4], k: [2,3,6,7,5,4,6,5,7,6,4,7],
        color: contenedor ? "#82b7d0" : colorProducto(caja.nombre),
        opacity: contenedor ? 0.03 : opacidad, name: caja.nombre, showlegend: false,
        hoverinfo: contenedor ? "skip" : "text",
        hovertext: caja.nombre + "<br>" + l + " × " + a + " × " + h + " cm<br>Posición: (" + x + ", " + y + ", " + z + ")",
        flatshading: true,
      });
      // Una sola traza para las doce aristas de cada caja.
      if (!contenedor && !bordes) return;
      const coordenadas = [0,1,2].map(eje => aristas.flatMap(([inicio, fin]) => [vertices[inicio][eje], vertices[fin][eje], null]));
      trazas.push({
        type: "scatter3d", mode: "lines", x: coordenadas[0], y: coordenadas[1], z: coordenadas[2],
        line: { color: contenedor ? tema.textSecondary : "#294659", width: contenedor ? 3 : 1.5 },
        showlegend: false, hoverinfo: "skip",
      });
    }
    dibujar({ ...camion, nombre: "Camión", x: 0, y: 0, z: 0 }, true);
    cajas.forEach(caja => dibujar(caja));
    return trazas;
  }, [cajas, camion, tema.textSecondary, bordes, opacidad]);
  return <><details className="plot-options"><summary>Opciones de visualización</summary><label className="settings-check"><input type="checkbox" checked={bordes} onChange={e => guardarPreferencias({ bordes: e.target.checked })} /> Mostrar bordes</label><label className="opt-label">Opacidad: {Math.round(opacidad * 100)}%<input className="settings-range" type="range" min="20" max="100" value={Math.round(opacidad * 100)} onChange={e => guardarPreferencias({ opacidad: Number(e.target.value) / 100 })} /></label></details><Plot data={data} useResizeHandler config={{ responsive: true, displaylogo: false, scrollZoom: false }}
    layout={{
      autosize: true, paper_bgcolor: tema.card, font: { color: tema.textPrimary },
      uirevision: "vista-carga",
      scene: {
        bgcolor: tema.card,
        xaxis: { title: { text: "Largo (cm)" }, gridcolor: tema.border },
        yaxis: { title: { text: "Ancho (cm)" }, gridcolor: tema.border },
        zaxis: { title: { text: "Alto (cm)" }, gridcolor: tema.border },
        aspectmode: "data",
      },
      margin: { l: 0, r: 0, b: 0, t: 10 },
    }}
    style={{ width: "100%", height: "460px" }} /></>;
}
export default PackingPlot;

