-- Migración aditiva: conserva los productos, camiones y planes existentes.
CREATE TABLE IF NOT EXISTS cuentas_usuario (
    id UUID PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'operador' CHECK (rol IN ('operador', 'admin')),
    foto BYTEA,
    foto_revision UUID,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sesiones (
    token_hash TEXT PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES cuentas_usuario(id) ON DELETE CASCADE,
    vence_en TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sesiones_usuario_idx ON sesiones(usuario_id);
CREATE TABLE IF NOT EXISTS intentos_acceso (
    clave TEXT PRIMARY KEY,
    cantidad INTEGER NOT NULL,
    vence_en TIMESTAMPTZ NOT NULL
);
ALTER TABLE optimizaciones ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES cuentas_usuario(id);
CREATE INDEX IF NOT EXISTS optimizaciones_usuario_idx ON optimizaciones(usuario_id, creado_en DESC);

