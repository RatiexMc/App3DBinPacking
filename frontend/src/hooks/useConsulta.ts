import { useEffect, useState } from "react";

import { apiFetch } from "../services/api";
export { API_URL } from "../services/api";

export function useConsulta<T>(ruta: string | null) {
  const [revision, setRevision] = useState(0);
  const [respuesta, setRespuesta] = useState<{ clave: string; datos: T | null; error: string } | null>(null);
  const clave = ruta + ":" + revision;
  useEffect(() => {
    if (!ruta) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    let vigente = true;
    async function consultar() {
      try {
        const res = await apiFetch(ruta!, { signal: controller.signal });
        const datos = await res.json();
        if (!res.ok) throw new Error(typeof datos?.detail === "string" ? datos.detail : "No pudimos cargar esta información. Vuelva a intentar.");
        if (vigente) setRespuesta({ clave, datos, error: "" });
      } catch (error) {
        if (vigente) setRespuesta({ clave, datos: null, error: error instanceof TypeError
          ? "No pudimos conectar con el servicio. Compruebe que la API esté iniciada y vuelva a intentar."
          : error instanceof Error && error.name === "AbortError" ? "La consulta está tardando demasiado. Vuelva a intentar."
          : error instanceof Error && !(error instanceof SyntaxError) ? error.message : "El servicio devolvió una respuesta que no pudimos leer. Vuelva a intentar." });
      } finally { window.clearTimeout(timeout); }
    }
    void consultar();
    return () => { vigente = false; window.clearTimeout(timeout); controller.abort(); };
  }, [ruta, clave]);
  return {
    datos: respuesta?.clave === clave ? respuesta.datos : null,
    error: respuesta?.clave === clave ? respuesta.error : "",
    cargando: ruta !== null && respuesta?.clave !== clave,
    recargar: () => setRevision(valor => valor + 1),
  };
}
