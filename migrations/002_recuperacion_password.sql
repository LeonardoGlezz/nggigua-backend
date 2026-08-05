-- Migración: recuperación de contraseña por correo real.
-- Ejecutar una sola vez contra la base de datos de Neon (o local) antes de
-- desplegar el backend con los endpoints /auth/olvide-password y
-- /auth/restablecer-password.
--
-- token_recuperacion: token aleatorio (hex) que se manda por correo dentro
-- del link de restablecimiento. NULL cuando no hay una solicitud pendiente.
-- token_expira: momento en que ese token deja de ser válido (1 hora desde
-- que se generó). Evita que un link viejo/filtrado funcione para siempre.

ALTER TABLE cuenta
    ADD COLUMN IF NOT EXISTS token_recuperacion character varying(255),
    ADD COLUMN IF NOT EXISTS token_expira timestamp without time zone;
