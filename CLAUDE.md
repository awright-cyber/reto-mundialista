# CLAUDE.md — Reto Mundialista · Plaza Las Américas 2026

## Project Overview
A web app for **Plaza Las Américas** (shopping mall in Guayaquil, Ecuador) where users predict FIFA World Cup 2026 match scores to win prizes. Free to participate, no gambling.

**Live URL:** https://reto.plazalasamericas.ec
**Admin panel:** https://reto.plazalasamericas.ec/admin
**GitHub repo:** https://github.com/awright-cyber/reto-mundialista

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14 (App Router) | Single `page.js` SPA-style |
| Styling | Inline styles + CSS vars | No Tailwind — pure inline React styles |
| Database | Supabase (PostgreSQL) | All tables created, RLS enabled |
| Hosting | Render.com (Starter plan $7/mo) | Auto-deploy from GitHub main branch |
| Results sync | API-Football (api-sports.io, PRO $19/mo) | Cron job every 5 min |
| Cron jobs | Render Cron Job (separate service) | sync-mundial-results |
| Domain | reto.plazalasamericas.ec | CNAME → Render, SSL active |

---

## Repository Structure

```
reto-mundialista/
├── frontend/
│   └── src/
│       └── app/
│           ├── page.js          ← Main app (all pages in one file, SPA)
│           ├── layout.js        ← Next.js layout
│           ├── globals.css      ← CSS variables (:root)
│           └── admin/
│               └── page.js      ← Admin panel
│           └── api/
│               └── cron/
│                   └── sync-results/
│                       └── route.js  ← Cron endpoint
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── vercel.json
├── backend/
│   ├── prisma/schema.sql        ← Full DB schema (run in Supabase SQL Editor)
│   └── data/matches_104.csv     ← All 104 matches (already imported)
└── docs/
    ├── SETUP_COMPLETO.md
    └── embed-plazalasamericas.html
```

---

## Supabase Database Tables

All tables created and populated. Key tables:

- **`matches`** — 104 World Cup matches with teams, flags, schedules (UTC), phase
- **`users`** — registered participants (full_name, cedula, phone, email, city, birth_date)
- **`predictions`** — user predictions per match (predicted_score_a, predicted_score_b, points_earned)
- **`special_predictions`** — champion, top scorer, revelation team, Ecuador predictions
- **`leaderboard`** — computed ranking (total_points, global_rank, rank_change)
- **`app_content`** — CMS key-value store for editable content (texts, colors, links, logo)
- **`promotions`** — Plaza Las Américas promo cards (emoji, store_name, title, image_url)
- **`achievements`** — badges/logros
- **`user_achievements`** — earned badges per user
- **`notifications`** — real-time notifications per user

### Key Supabase SQL Functions
- `calculate_match_points(p_match_id UUID)` — calculates points for all predictions of a match
- `recalculate_leaderboard()` — rebuilds full ranking
- View `v_leaderboard` — joined leaderboard with user names and cities

### RLS Policies
All tables have RLS enabled. Public read on matches, leaderboard, promotions, app_content. Public insert on users, predictions, leaderboard.

---

## Scoring System

| Result | Points |
|--------|--------|
| Exact score | 5 pts (max) |
| Correct winner/draw | 3 pts |
| Correct goal difference | 2 pts |
| Correct goals for one team | 1 pt each |

**Bonus points:**
- Champion: 20 pts
- Runner-up: 15 pts
- Third place: 10 pts
- Top scorer: 10 pts
- Revelation team: 5 pts
- Ecuador advancing each round: 5 pts each

---

## Match Data Status

- ✅ All 72 group stage matches: real teams, flags, correct Ecuador time (UTC-5)
- ✅ All 32 knockout matches (R32 through Final): correct times
- ✅ Ecuador in **Group E**: vs Costa de Marfil (Jun 14 6PM), vs Curazao (Jun 20 7PM), vs Alemania (Jun 25 3PM)
- ✅ Times stored as UTC in DB, displayed as America/Guayaquil in frontend
- ✅ Phase labels in Spanish (Ronda de 32, Octavos, Cuartos, Semifinales, etc.)
- ✅ Flags via flagcdn.com CDN (not emojis — emoji rendering was broken on Render)

### Match Phases (DB values)
`grupos` | `round_of_32` | `round_of_16` | `quarterfinals` | `semifinals` | `third_place` | `final`

---

## Frontend Architecture (page.js)

Single-file SPA with internal routing via `useState`. Pages:
- `landing` — Hero, stats bar, scoring system
- `registro` — Registration form → saves to Supabase `users` table
- `predicciones` — All 104 matches with score inputs → saves to `predictions`
- `dashboard` — Personal stats, points, ranking position
- `ranking` — Global leaderboard from `v_leaderboard`
- `promos` — Plaza Las Américas promotions from `promotions` table

### Content Management
The app reads from `app_content` table on load via `useContent()` hook. ALL user-facing text, stats, colors, and links are editable from admin panel without code changes.

Key content keys:
```
landing_badge, landing_title, landing_subtitle, landing_tagline
landing_description, landing_btn_primary, landing_btn_secondary
stat_matches, stat_teams (should be 48), stat_free, stat_start
event_title, event_description, event_schedule
predictions_lock_notice
color_primary, color_background, color_text
link_website, link_instagram, link_whatsapp, link_terms
logo_url  ← Plaza logo (Imgur URL)
```

### Dynamic Colors
Colors from `app_content` are applied as CSS custom properties on `document.documentElement`:
- `--gold` ← color_primary (Plaza orange = #E8611A)
- `--dark` ← color_background
- `--text` ← color_text

---

## Admin Panel (admin/page.js)

Access: `reto.plazalasamericas.ec/admin`
Password: stored in Render env var `NEXT_PUBLIC_ADMIN_PASSWORD`

Tabs:
1. **✏️ Contenido** — Edit all texts, stats, event info, links, logo URL, colors
2. **🏬 Promociones** — Edit promo cards (emoji, store name, title, description, image URL, show/hide)
3. **⚽ Resultados** — Load match results manually → auto-calculates points
4. **👥 Usuarios** — View all registered users, download CSV
5. **📊 Métricas** — Live stats (user count, predictions, finished matches)

---

## Environment Variables (Render)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...  (service role, backend only)
API_FOOTBALL_KEY=xxxx        (api-sports.io PRO plan)
ADMIN_SECRET=xxxx            (for cron auth header)
CRON_SECRET=xxxx             (same value used in cron job service)
NEXT_PUBLIC_ADMIN_PASSWORD=xxxx
PREDICTIONS_LOCK_DATE=2026-06-11T04:59:00Z
```

---

## Cron Job (Auto-sync results)

- **Service name on Render:** `sync-mundial-results`
- **Schedule:** `*/5 * * * *` (every 5 minutes)
- **What it does:** Calls `GET /api/cron/sync-results` with Bearer token
- **Endpoint file:** `frontend/src/app/api/cron/sync-results/route.js`
- **Flow:** Fetch live/today matches from API-Football → update `matches` table → if finished, call `calculate_match_points` → `recalculate_leaderboard`
- **API-Football league ID:** `1` (FIFA World Cup — confirm when tournament starts)

---

## Key Decisions Made

1. **No Vercel** — phone verification blocked. Using Render instead.
2. **No Netlify** — 503 errors from Ecuador. Using Render.
3. **No emoji flags** — Unicode rendering broken on Render server. Using flagcdn.com image CDN.
4. **No Tailwind in production** — using inline React styles throughout for portability.
5. **Single page.js** — all routes handled in one file with useState for simplicity.
6. **Supabase Realtime** — leaderboard and match updates propagate in real-time to all connected clients.
7. **Imgur/Cloudinary for images** — no file upload in app, admin pastes image URLs.
8. **Predictions lock:** June 10, 2026 at 23:59 Ecuador time (= June 11 04:59 UTC).

---

## Immediate Next Steps (pick up here)

### 1. ✅ DONE — Latest files deployed
- `page-final-v8.js` → `frontend/src/app/page.js` ✅
- `admin-v3.js` → `frontend/src/app/admin/page.js` ✅

These are live on Render. Fixes included:
- Colors applying globally via CSS vars throughout entire app
- Logo URL field in admin (header + footer)
- Conditional links (empty = hidden)
- Nav receives full `c` prop

### 2. Upload Plaza logo
User has logo file on computer. Steps:
1. Upload to imgur.com → get direct image URL
2. Paste in Admin → Contenido → "URL del logo" field
3. Logo will appear in header and footer

### 3. Set Plaza orange color
In Admin → Contenido → Colores: set `color_primary` to `#E8611A`

### 4. Test full user flow
- Register a test user
- Submit predictions for group stage
- Verify predictions saved in Supabase
- Test admin result entry → verify points calculated

### 5. Verify predictions lock date
Confirm `PREDICTIONS_LOCK_DATE=2026-06-11T04:59:00Z` is set in Render env vars.

### 6. Map API-Football external IDs
Before the tournament starts, run the mapping script to connect `matches.external_id` to API-Football fixture IDs so auto-sync works correctly.

### 7. WordPress banner on plazalasamericas.ec
Add HTML banner block in WordPress pointing to reto.plazalasamericas.ec. Code provided in `docs/embed-plazalasamericas.html`.

### 8. Test the cron job
After June 11, verify first match result syncs automatically. Check Render cron logs.

---

## Known Issues / Bugs

- Colors only partially applied before v8 update — fixed in `page-final-v8.js`
- `DEFAULT_CONTENT` in admin had `c()` calls instead of string literals — fixed in v6+
- `page.module.css` import error — removed in v2
- `output: standalone` warning in Render logs — cosmetic only, does not affect functionality

---

## Costs (monthly during World Cup)

| Service | Cost |
|---------|------|
| Render Web Service (Starter) | $7/mo |
| Render Cron Job (Starter) | ~$1/mo |
| API-Football PRO | $19/mo |
| Supabase | Free |
| **Total** | **~$27/mo** |

---

## Contact / Accounts

- GitHub: `awright-cyber`
- Render: linked to GitHub
- Supabase: project `reto-mundialista`
- API-Football: dashboard.api-football.com
