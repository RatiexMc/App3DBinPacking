# Optimización, historial y configuración — 27/09/2026

## Recorrido del pedido

1. El usuario confirma códigos y cantidades de cajas en Optimización.
2. El estado compartido `cargaStore.ts` conserva el pedido al navegar. `sessionStorage` permite recuperarlo al recargar la misma pestaña.
3. `POST /optimizar` valida cantidades, chofer, medidas, categorías y códigos. Si falta un código, no calcula una carga parcial.
4. El servicio adapta `py3dbp` sin modificar la librería instalada. Compara tres órdenes de cajas y selecciona el mayor volumen ocupado; la cantidad resuelve empates.
5. PostgreSQL guarda automáticamente una copia del pedido, productos, medidas del vehículo y resultado. Un UUID impide duplicar una solicitud por reintentos.
6. Historial consulta las copias originales; Dashboard agrega esos cálculos. Consultar un resultado histórico no reemplaza el pedido en curso.

Una optimización guardada es un plan, no una confirmación de despacho. Volver a calcular deliberadamente un resultado ya guardado crea otro plan; reintentar un guardado fallido reutiliza la solicitud.

## Reglas aplicadas

- X = largo, Y = ancho, Z = alto, en centímetros.
- Se prueban las seis orientaciones, incluidas las restantes cuando una orientación colisiona.
- No se admiten superposiciones ni posiciones fuera del camión.
- Se exige apoyo del 100 % de la base; puede repartirse entre varias cajas contiguas.
- No se permite una categoría más pesada sobre otra más liviana.
- Una caja marcada como no apilable no puede soportar otras cajas.

Son restricciones geométricas y por categoría. No modelan resistencia del embalaje, deformaciones, cargas por eje, maniobras de carga ni orden de descarga. Los pesos desconocidos o de prueba no validan la capacidad real en kg. La heurística no garantiza el óptimo global.

## Caso AAXO 544

Comparación de solo lectura del registro `af255837-23fe-423a-9eef-0389bea51d2b`, usando las dimensiones y cantidades guardadas y las categorías/apilabilidad actuales de las fichas:

| Medida | Motor anterior | Motor con restricciones |
|---|---:|---:|
| Cajas solicitadas | 115 | 115 |
| Cajas acomodadas | 100 | 108 |
| Sin acomodar | 15 | 7 |
| Ocupación volumétrica | 58,62 % | 65,93 % |
| Cajas sin apoyo completo | 10 | 0 |

El resultado original se conserva. Volumen libre no equivale a espacio utilizable: los huecos pueden no admitir las dimensiones de las cajas pendientes. La comparación no es todavía una medición de mejora operativa en depósito.

## Configuración

Tema claro/oscuro, formulario manual visible/oculto, bordes y opacidad del gráfico. Las preferencias se guardan en `localStorage` del navegador; el historial se guarda en PostgreSQL. OCR, registro, inicio de sesión y perfil todavía no están implementados.

## Puesta en marcha

Desde `APP_Darnel`, con su entorno Python:

```powershell
.\venv\Scripts\python.exe -m database.migrar
.\venv\Scripts\python.exe -m uvicorn main:app --reload
```

La migración es aditiva e idempotente y ya fue aplicada en la base local. No altera productos ni camiones.

Desde `FRONTEND`, ejecutar `npm run dev`. Si la API usa otra dirección, configurar `VITE_API_URL`. La conexión desde un móvil también requiere configurar la red y los orígenes CORS; no basta con abrir la URL local del PC.

## Verificación

```powershell
# Desde APP_Darnel: pruebas unitarias sin datos empresariales
.\venv\Scripts\python.exe -B -m unittest discover -s PRUEBAS -p 'test_*.py' -v

# Opcional: integración PostgreSQL con tablas temporales y rollback
$env:DARNEL_TEST_POSTGRES='1'
.\venv\Scripts\python.exe -B -m unittest discover -s PRUEBAS -p 'test_*.py' -v

# Diagnóstico de solo lectura de una carga guardada
.\venv\Scripts\python.exe -B -m PRUEBAS.diagnosticar_carga af255837-23fe-423a-9eef-0389bea51d2b
```

En el frontend: `npm run build`. Las comprobaciones de navegador incluyen navegación y recarga, cálculo que termina fuera de Optimización, apertura del historial, nueva carga sin borrar historial, errores de conexión y vista móvil.
