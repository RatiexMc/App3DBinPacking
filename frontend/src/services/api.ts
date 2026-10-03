export const API_URL = import.meta.env.VITE_API_URL || "/api";

// La cookie HttpOnly la administra el navegador; nunca guardamos contraseñas o
// tokens de acceso en localStorage. El encabezado protege las escrituras de CSRF.
export async function apiFetch(ruta: string, opciones: RequestInit = {}) {
  const headers = new Headers(opciones.headers);
  headers.set("X-Darnel-Request", "1");
  const respuesta = await fetch(ruta.startsWith(API_URL) ? ruta : API_URL + ruta, {
    ...opciones, headers, credentials: "include",
  });
  if (respuesta.status === 401 && !ruta.includes("/auth/")) {
    window.dispatchEvent(new Event("darnel:sesion-vencida"));
  }
  return respuesta;
}

export async function apiJson<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await apiFetch(ruta, { signal: AbortSignal.timeout(120_000), ...opciones });
  } catch (error) {
    throw new Error(error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")
      ? "La operación tardó demasiado. Vuelva a intentar."
      : "No pudimos conectar con el servicio. Compruebe que la API esté iniciada.", { cause: error });
  }
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(typeof datos?.detail === "string" ? datos.detail
      : typeof datos?.detail?.mensaje === "string" ? datos.detail.mensaje
      : "No pudimos completar la operación. Revise los datos e intente nuevamente.");
  }
  if (datos === null) throw new Error("El servicio devolvió una respuesta que no pudimos leer.");
  return datos as T;
}

export function jsonBody(datos: unknown): RequestInit {
  return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) };
}
