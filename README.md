# Hablando Nggigua — Backend

API REST en Node.js/Express para la plataforma Hablando Nggigua. Autenticación con JWT + bcrypt, base de datos PostgreSQL (Neon en producción), envío de correo con Nodemailer.

## Cómo ejecutar este proyecto en una computadora nueva

### Requisitos

- **Node.js 20 o superior** (se desarrolló con Node 22). Descargar de [nodejs.org](https://nodejs.org).
- **PostgreSQL 16 o superior** instalado localmente (incluye `psql` y `pg_dump`/`pg_restore`), o acceso a una instancia en la nube (ej. Neon). Descargar de [postgresql.org/download](https://www.postgresql.org/download/).
- **Git**.
- El repositorio del frontend: [nggigua-frontend](https://github.com/LeonardoGlezz/nggigua-frontend) (se ejecuta aparte, ver su propio README).

### 1. Clonar y instalar

```bash
git clone https://github.com/LeonardoGlezz/nggigua-backend.git
cd nggigua-backend
npm install
```

### 2. Preparar la base de datos

Este proyecto se entrega junto con un respaldo completo (`nggigua_backup.sql`) de la base de datos real que corre en Neon — estructura **y** datos. Es la forma más rápida de tener el proyecto funcionando exactamente como en producción, incluyendo cuentas de prueba ya creadas (una de ellas con rol `ADMIN` para ver el panel de administrador).

```bash
# Crear una base de datos vacía llamada nggigua_db
createdb nggigua_db

# Restaurar el respaldo completo dentro de ella
psql -d nggigua_db -f nggigua_backup.sql
```

Si en vez de eso se prefiere partir de una base de datos vacía (sin las cuentas de prueba), se puede usar lo que ya trae este repositorio:

```bash
createdb nggigua_db
psql -d nggigua_db -f schema.sql            # estructura de tablas
psql -d nggigua_db -f datos_iniciales.sql   # niveles, actividades e insignias base
npm run seed                                 # vocabulario Nggigua (idempotente)
npm run seed:insignias                       # set de insignias (idempotente)
```

Con esta segunda opción no habrá ninguna cuenta creada todavía — hay que registrarse desde la app normalmente, y si se quiere ver el panel de administrador, promover esa cuenta a mano:

```sql
UPDATE cuenta SET rol = 'ADMIN' WHERE correo = 'tu-correo@ejemplo.com';
```

### 3. Configurar las variables de entorno

```bash
cp .env.example .env
```

Editar `.env` y llenar, como mínimo:

- `DB_HOST=localhost`, `DB_PORT=5432`, `DB_NAME=nggigua_db`, `DB_USER` y `DB_PASSWORD` con los datos del Postgres local (dejar `DATABASE_URL` vacío — esa variable es solo para cuando se conecta a Neon en vez de a una base local).
- `JWT_SECRET`: cualquier cadena larga y aleatoria, por ejemplo generada con `openssl rand -hex 32` (o en PowerShell: `[System.Convert]::ToHexString((1..32|%{Get-Random -Max 256}))`).
- `FRONTEND_URL=http://localhost:5173` (puerto por defecto del frontend en desarrollo).
- `EMAIL_USER` / `EMAIL_PASS`: **opcionales.** Solo son necesarias para probar el flujo de "olvidé mi contraseña" con envío real de correo. Si se dejan vacías, el resto del sistema (login, registro, minijuegos, panel de administrador) funciona sin ningún problema; solo ese correo específico no se enviará.

### 4. Levantar el servidor

```bash
npm run dev
```

Debe quedar escuchando en `http://localhost:3000`. Probar que la base de datos responde entrando a `http://localhost:3000/test-db` desde el navegador.

Con esto el backend ya está listo para que el frontend (ver [nggigua-frontend](https://github.com/LeonardoGlezz/nggigua-frontend)) se conecte a él.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión de PostgreSQL (Neon) |
| `JWT_SECRET` | Secreto para firmar tokens JWT |
| `FRONTEND_URL` | Origen(es) permitido(s) para CORS (separados por coma) |
| `EMAIL_USER` | Cuenta de Gmail usada para enviar correos de recuperación |
| `EMAIL_PASS` | Contraseña de aplicación de Gmail (16 caracteres, no la contraseña normal) |

## Limitaciones conocidas

### Envío de correo de recuperación de contraseña (Render plan gratuito)

Desde el 26 de septiembre de 2025, Render bloquea el tráfico saliente hacia los puertos SMTP (25, 465, 587) en los servicios de su **plan gratuito**, como medida contra el uso indebido de spam. Esto afecta directamente el flujo de "recuperar contraseña" (`/api/auth/olvide-password`), que usa Nodemailer + Gmail SMTP para mandar el enlace de restablecimiento.

**Efecto en el plan gratuito:** el usuario puede solicitar la recuperación con normalidad (la API responde correctamente y no hay errores de código), pero el correo nunca llega — la conexión al servidor SMTP de Gmail se queda esperando y termina en `Connection timeout`. El resto del sistema (login, registro, minijuegos, panel de administrador, etc.) no se ve afectado; el bloqueo es específico a los puertos SMTP.

**Solución:** subir el servicio de Render a cualquier plan de pago (desde ~$7 USD/mes) elimina el bloqueo sin necesidad de cambiar nada en el código. Esta decisión se deja para cuando se decida sacar el proyecto a producción real.

**Alternativa sin costo mensual:** migrar el envío de correo de SMTP a un servicio con API sobre HTTPS (ej. Resend, SendGrid), que sí funciona en el plan gratuito de Render. Requiere comprar y verificar un dominio propio, ya que sin dominio verificado estos servicios solo permiten enviar correos a la cuenta dueña de la API key, no a usuarios arbitrarios.

## Scripts

```bash
npm run dev    # servidor con recarga automática (nodemon)
npm start      # servidor en producción
```
