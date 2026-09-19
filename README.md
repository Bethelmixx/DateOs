# DateOs

Mapa de reportes comunitarios para Venezuela.

La cuenta se crea con **usuario y contraseña**. No hay Google ni teléfono.

## Variables de entorno

Copia `.env.example` y completa:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Postgres (Neon en Vercel) |
| `BETTER_AUTH_SECRET` | Secreto aleatorio, mínimo 32 caracteres |
| `BETTER_AUTH_URL` | URL pública, ej. `https://dateos.vercel.app` |

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
