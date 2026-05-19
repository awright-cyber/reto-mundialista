# 📋 GUÍA DE SETUP COMPLETO
## Reto Mundialista — Plaza Las Américas 2026

Tiempo estimado: **2-3 horas** (sin experiencia previa) | **30 minutos** (desarrollador)

---

## PASO 1: Crear cuenta en Supabase (base de datos) — GRATIS

1. Ir a **https://supabase.com** → "Start your project"
2. Registrarse con GitHub o email
3. Click en **"New Project"**
   - Organization: Plaza Las Américas (crear nueva)
   - Name: `reto-mundialista`
   - Database Password: generar uno fuerte y guardarlo
   - Region: **US East (N. Virginia)** — más cercano a Ecuador
4. Esperar ~2 minutos mientras se crea el proyecto
5. Ir a **Settings → API** y copiar:
   - `Project URL` → esto es tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → esto es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → esto es tu `SUPABASE_SERVICE_KEY` (¡nunca exponer!)

### Crear las tablas (base de datos)

6. En Supabase, ir a **SQL Editor** (ícono de base de datos)
7. Click en **"New Query"**
8. Copiar y pegar TODO el contenido de `/backend/prisma/schema.sql`
9. Click en **"Run"** (botón verde)
10. Deberías ver: "Success. No rows returned" — ✅

### Importar los 104 partidos

11. Ir a **Table Editor → matches**
12. Click en **"Insert → Import data from CSV"**
13. Subir el archivo `/backend/data/matches_104.csv`
14. Mapear columnas automáticamente
15. Click **"Import data"**

> ⚠️ Nota: Los equipos en partidos eliminatorios están como "TBD" (por definir).
> Actualizarlos manualmente en el panel admin cuando avance el torneo,
> o el sync automático los completará.

---

## PASO 2: Configurar API-Football (resultados automáticos)

### Opción A: Actualización automática (recomendado para producción)

1. Ir a **https://rapidapi.com/api-sports/api/api-football**
2. Registrarse y seleccionar plan:
   - **Free**: 100 requests/día — solo para desarrollo
   - **Basic ($9.99/mes)**: 7,500 req/día — suficiente para el Mundial
   - El Mundial 2026 dura ~32 días. Con sync cada 5 min durante partidos: ~3,000 req/día máx
3. Copiar tu **API Key** → esto es `API_FOOTBALL_KEY`
4. Ir a la documentación y buscar el `league ID` del Mundial 2026
   - Típicamente es el `1` para FIFA World Cup
   - Confirmar en: https://v3.football.api-sports.io/leagues?name=World+Cup&type=Cup

### Opción B: Actualización manual (gratis, más trabajo)
Si no quieres pagar la API, el panel admin permite cargar resultados manualmente.
El cálculo de puntos y ranking se ejecuta igual al guardar.

---

## PASO 3: Crear proyecto en Vercel (hosting) — GRATIS

1. Ir a **https://vercel.com** → Sign Up con GitHub
2. Click en **"New Project"**
3. Importar desde GitHub: subir el código de `/frontend` a un repo nuevo
   - O usar: `npx create-next-app@latest --example https://github.com/tu-repo`
4. En el paso de configuración, agregar las variables de entorno:
   ```
   NEXT_PUBLIC_SUPABASE_URL = (de paso 1)
   NEXT_PUBLIC_SUPABASE_ANON_KEY = (de paso 1)
   SUPABASE_SERVICE_KEY = (de paso 1)
   API_FOOTBALL_KEY = (de paso 2)
   CRON_SECRET = (generar con openssl rand -hex 32)
   ADMIN_SECRET = (tu contraseña de admin)
   PREDICTIONS_LOCK_DATE = 2026-06-11T04:59:00Z
   NEXT_PUBLIC_SITE_URL = https://reto.plazalasamericas.ec
   ```
5. Click **"Deploy"**
6. El sitio estará en: `https://reto-mundialista.vercel.app`

### Configurar dominio personalizado

7. En Vercel → Settings → Domains
8. Agregar: `reto.plazalasamericas.ec`
9. En el panel DNS de Plaza Las Américas, agregar:
   ```
   Tipo: CNAME
   Host: reto
   Valor: cname.vercel-dns.com
   TTL: 3600
   ```
10. Esperar 5-30 minutos para propagación DNS

---

## PASO 4: Configurar los Cron Jobs (sincronización automática)

Los cron jobs se configuran automáticamente con el archivo `vercel.json`.

El archivo configura:
- **Cada 5 minutos**: `/api/cron/sync-results` — sync con API-Football
- **Diariamente 00:59 Ecuador**: `/api/cron/daily-ranking` — ranking diario
- **Cada 15 minutos**: `/api/cron/check-achievements` — verificar logros

> Vercel Cron está incluido en el plan gratuito (hasta 2 cron jobs).
> Para los 3 necesarios, usar el plan Pro ($20/mes) o usar GitHub Actions (gratis).

### Alternativa con GitHub Actions (gratis):

Crear `.github/workflows/sync-results.yml`:
```yaml
name: Sync World Cup Results
on:
  schedule:
    - cron: '*/5 * * * *'  # cada 5 minutos
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Call sync endpoint
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://reto.plazalasamericas.ec/api/cron/sync-results
```

---

## PASO 5: Integrar en www.plazalasamericas.ec

### Opción A: Subdominio independiente (RECOMENDADO)
El reto ya está en `reto.plazalasamericas.ec`. Solo necesitas:
1. Agregar un botón/banner en la web principal que enlace ahí
2. Usar el código HTML del archivo `docs/embed-plazalasamericas.html`

### Opción B: Iframe embebido
Agregar en la página de Plaza (sección "Entretenimiento" o "Eventos"):
```html
<iframe
  src="https://reto.plazalasamericas.ec"
  width="100%"
  height="900px"
  frameborder="0"
  title="Reto Mundialista Plaza Las Américas"
  style="border-radius: 12px; max-width: 1200px;"
></iframe>
```

### Opción C: WordPress (si usan WP)
Instalar plugin **"WPForms"** o usar bloque HTML y pegar el iframe de arriba.

---

## PASO 6: Panel de administración

Acceder en: **https://reto.plazalasamericas.ec/admin**

Requiere ingresar la contraseña configurada en `ADMIN_SECRET`.

Funciones disponibles:
- 📊 Ver métricas en tiempo real
- 📥 Descargar CSV de usuarios y predicciones
- ⚽ Cargar resultados manualmente
- 🏆 Gestionar predicciones especiales (goleador, campeón)
- 📢 Publicar ganadores y activar banners

---

## PASO 7: Mapear partidos con API-Football

Para que el sync automático funcione, cada partido en tu BD necesita el `external_id` de API-Football.

Ejecutar este script una vez cuando el Mundial se acerque:

```javascript
// scripts/map-external-ids.js
// Llamar con: node scripts/map-external-ids.js

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function mapExternalIds() {
  // Obtener todos los partidos del Mundial del API
  const response = await fetch(
    'https://v3.football.api-sports.io/fixtures?league=1&season=2026',
    { headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY } }
  );
  const { response: fixtures } = await response.json();

  for (const fixture of fixtures) {
    const homeTeam = fixture.teams.home.code;
    const awayTeam = fixture.teams.away.code;
    const scheduledAt = new Date(fixture.fixture.date).toISOString();

    // Buscar el partido en nuestra BD por equipos y fecha aproximada
    const { data: match } = await supabase
      .from('matches')
      .select('id')
      .eq('team_a_code', homeTeam)
      .eq('team_b_code', awayTeam)
      .gte('scheduled_at', new Date(scheduledAt - 3600000).toISOString())
      .lte('scheduled_at', new Date(scheduledAt + 3600000).toISOString())
      .single();

    if (match) {
      await supabase
        .from('matches')
        .update({ external_id: String(fixture.fixture.id) })
        .eq('id', match.id);
      console.log(`✅ Mapeado: ${homeTeam} vs ${awayTeam} → ${fixture.fixture.id}`);
    }
  }
}

mapExternalIds();
```

---

## Estructura de costos mensual

| Servicio | Plan | Costo |
|---------|------|-------|
| Supabase | Free (hasta 500MB) | $0 |
| Vercel | Hobby/Pro | $0-$20 |
| API-Football | Basic | $10 |
| Dominio (subdominio) | Ya incluido | $0 |
| **TOTAL** | | **$10-$30/mes** |

---

## Checklist pre-lanzamiento

- [ ] Supabase creado y tablas importadas
- [ ] 104 partidos importados desde CSV
- [ ] Variables de entorno configuradas en Vercel
- [ ] Dominio `reto.plazalasamericas.ec` configurado
- [ ] Cron jobs activos (verificar en Vercel → Settings → Crons)
- [ ] API-Football key funcionando (test manual)
- [ ] Panel admin accesible
- [ ] Probar registro de usuario de prueba
- [ ] Probar predicciones y cálculo de puntos
- [ ] Probar descarga de CSV
- [ ] Banner/botón en www.plazalasamericas.ec apuntando al reto
- [ ] QR generado e impreso para activaciones en la plaza
- [ ] Test en mobile (iPhone + Android)

---

## Soporte técnico

Para dudas sobre la integración, contactar al equipo de desarrollo con:
1. URL del error en Vercel Logs
2. Screenshot del mensaje de error
3. Paso del setup donde ocurrió

Vercel Logs: https://vercel.com/[tu-usuario]/reto-mundialista/logs
Supabase Logs: https://supabase.com/dashboard/project/[tu-id]/logs/edge-logs
