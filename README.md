# 🏆 Reto Mundialista — Plaza Las Américas

Sistema completo de predicciones del Mundial 2026.

## Stack Tecnológico

| Capa | Tecnología | Costo |
|------|-----------|-------|
| Frontend | Next.js 14 + TailwindCSS | Gratis |
| Backend API | Next.js API Routes | Gratis |
| Base de datos | Supabase (PostgreSQL) | Gratis hasta 500MB |
| Autenticación | Supabase Auth | Gratis |
| Hosting | Vercel | Gratis |
| Resultados automáticos | API-Football (RapidAPI) | ~$10/mes |
| Cron jobs | Vercel Cron / GitHub Actions | Gratis |

## Estructura del Proyecto

```
reto-mundialista/
├── frontend/           # Next.js app
│   └── src/
│       ├── app/        # App Router pages
│       ├── components/ # UI components
│       ├── hooks/      # Custom hooks
│       └── lib/        # Supabase client, utils
├── backend/
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── services/   # Business logic
│   │   └── jobs/       # Cron jobs (resultados automáticos)
│   └── prisma/         # Schema DB
└── docs/               # Guías de integración
```

## Setup Rápido (30 minutos)

1. `cd frontend && npm install`
2. Crear proyecto en [supabase.com](https://supabase.com)
3. Copiar `.env.example` → `.env.local` y llenar variables
4. Correr SQL de `/backend/prisma/schema.sql` en Supabase
5. `npm run dev` — corre en localhost:3000
6. Deploy en Vercel con un click

Ver `docs/SETUP_COMPLETO.md` para instrucciones detalladas.
