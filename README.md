#  Sistema Inteligente de Optimización de Carga de Camiones mediante 3D Bin Packing
 
## Descripción
 
Proyecto de tesis de Ingeniería Informática enfocado en la optimización de la carga de camiones utilizando algoritmos de 3D Bin Packing.
 
La solución busca mejorar el aprovechamiento del espacio disponible en los vehículos de transporte mediante la distribución inteligente de productos considerando restricciones físicas y operativas reales.
 
Además, el sistema permite visualizar gráficamente el resultado de la optimización mediante modelos tridimensionales interactivos.
 
---
 
## Problema
 
Las operaciones logísticas suelen depender de la experiencia del personal para distribuir la carga dentro de los camiones, lo que puede generar:
 
- Espacios desaprovechados.
- Incremento de viajes necesarios.
- Costos logísticos elevados.
- Distribuciones inestables de la carga.
- Dificultad para planificar el transporte.
 
---
 
## Objetivo General
 
Desarrollar un sistema inteligente que optimice la distribución de productos dentro de camiones mediante algoritmos de 3D Bin Packing, mejorando el aprovechamiento del espacio y apoyando la toma de decisiones logísticas.
 
---
 
## Objetivos Específicos
 
- Gestionar productos y camiones desde una interfaz amigable.
- Obtener datos desde una base de datos PostgreSQL.
- Aplicar algoritmos de optimización de carga.
- Implementar restricciones de negocio para mejorar la estabilidad de la carga.
- Generar visualizaciones tridimensionales de los resultados.
- Facilitar la planificación logística mediante reportes e información visual.
 
---
 
## Tecnologías Utilizadas
 
### Backend
 
- Python
- PostgreSQL
- Py3DBP
- Plotly
 
### Frontend
 
- React
- TypeScript
- Vite
 
### Herramientas
 
- Visual Studio Code
- Git
- GitHub
- Figma
 
---
 
## Estructura Actual del Proyecto
 
```text
Tesis/
│
├── APP_Darnel/
│ ├── database/
│ ├── models/
│ ├── services/
│ ├── PRUEBAS/
│ ├── config.py
│ ├── dbpy3dbp.py
│ ├── main.py
│ ├── restricciones.py
│ └── visualizacion_plotly.py
│
├── frontend/
│ ├── public/
│ ├── src/
│ ├── package.json
│ └── vite.config.ts
│
└── README.md
```
 
---
 
## Funcionalidades Implementadas
 
- Gestión de productos.
- Gestión de camiones.
- Conexión con PostgreSQL.
- Obtención de datos desde la base de datos.
- Optimización mediante algoritmo 3D Bin Packing.
- Restricciones de carga personalizadas.
- Visualización 3D interactiva mediante Plotly.
- Desarrollo inicial de la interfaz web.
 
---
 
## Funcionalidades Futuras
 
- Historial de optimizaciones.
- Generación automática de Picking List.
- Exportación de reportes.
- Dashboard de indicadores.
- Visualización avanzada mediante Three.js.
- Autenticación y gestión de usuarios.
- Implementación de reglas logísticas adicionales.
 
---
 
## Estado del Proyecto
 
🚧 En desarrollo
 
Actualmente se encuentra en fase de desarrollo y pruebas como parte del trabajo de tesis de Ingeniería Informática.
 
---
 
## Autor
 
**Junior Osvaldo Velaustegui Sanchez**
 
Ingeniería Informática
 
Paraguay
 
---
 
## Licencia
 
Proyecto académico desarrollado con fines educativos y de investigación.