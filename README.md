# DateOs

Mapa de reportes comunitarios para Venezuela.

La cuenta se crea con **usuario y contraseña**. No hay Google ni teléfono.

## Variables de entorno

Copia `.env.example` y completa:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Neon **pooled** (`-pooler` en el host). Obligatorio en Vercel |
| `BETTER_AUTH_SECRET` | Secreto aleatorio, mínimo 32 caracteres. Obligatorio en Vercel |
| `BETTER_AUTH_URL` | URL pública exacta, ej. `https://dateos.vercel.app` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Opcional, orígenes extra separados por coma |

Sin esas tres primeras en Vercel la app no arranca a propósito: no hay fallback a PGLite ni a un secreto random.

## Local

```bash
npm install
cp .env.example .env
npm run dev
```

Sin `DATABASE_URL` usa una base embebida (PGLite). En Vercel **sí** hace falta Neon.

## Vercel

1. Importa el repo en [Vercel](https://vercel.com/new).
2. Framework: Vite (Nitro genera la salida de Vercel).
3. Build: `npm run build`
4. Carga las variables de entorno.
5. Deploy.

El build aplica las migraciones SQL a `DATABASE_URL`.
