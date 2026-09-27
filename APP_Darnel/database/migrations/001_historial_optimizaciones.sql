CREATE TABLE IF NOT EXISTS optimizaciones (
    id UUID PRIMARY KEY,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    chofer TEXT NOT NULL,
    placa TEXT NOT NULL,
    productos_distintos INTEGER NOT NULL CHECK (productos_distintos > 0),
    cajas_solicitadas INTEGER NOT NULL CHECK (cajas_solicitadas > 0),
    cargadas INTEGER NOT NULL CHECK (cargadas >= 0),
    rechazadas INTEGER NOT NULL CHECK (rechazadas >= 0),
    ocupacion DOUBLE PRECISION NOT NULL CHECK (ocupacion BETWEEN 0 AND 100),
    tiempo_calculo_ms INTEGER NOT NULL CHECK (tiempo_calculo_ms >= 0),
    entrada JSONB NOT NULL,
    productos JSONB NOT NULL,
    resultado JSONB NOT NULL,
    CHECK (cargadas + rechazadas = cajas_solicitadas)
);
CREATE INDEX IF NOT EXISTS optimizaciones_fecha_idx ON optimizaciones (creado_en DESC, id);
