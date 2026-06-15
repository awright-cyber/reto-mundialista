// POST /api/admin/run-sync
// Fuerza una sincronización manual con la API-Football desde el admin panel.
// Internamente llama al endpoint cron usando CRON_SECRET server-side.
// El admin panel muestra el resultado raw para diagnóstico.

import { headers } from 'next/headers';

export async function POST(request) {
  try {
    const { secret } = await request.json();
    if (secret !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return Response.json({ error: 'CRON_SECRET no está configurado en Render. Verifica las env vars.' }, { status: 500 });
    }

    const headersList = headers();
    const host = headersList.get('host') || 'reto.plazalasamericas.ec';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const cronUrl = `${proto}://${host}/api/cron/sync-results`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55000);

    let res, data;
    try {
      res = await fetch(cronUrl, {
        headers: { 'Authorization': `Bearer ${cronSecret}` },
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);
      data = await res.json();
    } catch (fetchErr) {
      clearTimeout(timer);
      if (fetchErr.name === 'AbortError') {
        return Response.json({ error: 'La sincronización tardó más de 55s. Revisa los logs de Render.' }, { status: 504 });
      }
      return Response.json({ error: `Error de red al llamar el cron: ${fetchErr.message}` }, { status: 502 });
    }

    return Response.json({
      cron_url: cronUrl,
      cron_http_status: res.status,
      ...data,
    }, { status: res.ok ? 200 : res.status });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
