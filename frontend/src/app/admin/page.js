'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// CONTENIDO EDITABLE — valores por defecto
// ============================================================
const DEFAULT_CONTENT = {
  // Landing page
  landing_badge: '⚽ FIFA World Cup 2026',
  landing_title: 'RETO',
  landing_subtitle: 'MUNDIALISTA',
  landing_tagline: 'Plaza Las Américas',
  landing_description: 'Predice todos los partidos del Mundial 2026, acumula puntos en tiempo real y gana premios exclusivos de Plaza Las Américas.',
  landing_btn_primary: '🏆 Participar Gratis',
  landing_btn_secondary: 'Ver Partidos',
  // Estadísticas
  stat_matches: '104',
  stat_teams: '48',
  stat_free: '100%',
  stat_start: 'Jun 11',
  stat_matches_label: 'Partidos',
  stat_teams_label: 'Selecciones',
  stat_free_label: 'Gratuito',
  stat_start_label: 'Inicio',
  // Premio
  prize_amount: '$500',
  prize_description: 'Gift Card para el ganador del Reto Mundialista',
  // Aviso predicciones
  predictions_lock_notice: '⚠️ Predicciones se bloquean el 10 de junio a las 23:59 hora Ecuador',
  // Zona Mundial
  event_title: 'ZONA MUNDIAL · Plaza Las Américas',
  event_description: 'Pantallas gigantes · Activaciones · Sorteos en vivo',
  event_schedule: '📅 Todos los días del Mundial · 16h00 - 22h00',
  // Colores
  color_primary: '#F5C518',
  color_background: '#0A0E1A',
  color_text: '#F0F4FF',
  // Links
  link_terms: '#',
  link_instagram: '#',
  link_whatsapp: '#',
  link_website: 'https://www.plazalasamericas.ec',
};

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('contenido');
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({ users: 0, predictions: 0, finished: 0 });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [editingResult, setEditingResult] = useState(null);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'plaza2026admin';

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      loadData();
    } else {
      setError('Contraseña incorrecta');
    }
  };

  const loadData = async () => {
    // Cargar contenido guardado
    const { data: contentData } = await supabase
      .from('app_content')
      .select('*');
    if (contentData?.length) {
      const obj = {};
      contentData.forEach(r => { obj[r.key] = r.value; });
      setContent({ ...DEFAULT_CONTENT, ...obj });
    }

    // Estadísticas
    const { count: userCount } = await supabase.from('users').select('id', { count: 'exact' });
    const { count: predCount } = await supabase.from('predictions').select('id', { count: 'exact' });
    const { count: finCount } = await supabase.from('matches').select('id', { count: 'exact' }).eq('status', 'finished');
    setStats({ users: userCount || 0, predictions: predCount || 0, finished: finCount || 0 });

    // Usuarios
    const { data: usersData } = await supabase.from('users')
      .select('id,full_name,email,city,cedula,created_at,total_points,global_rank')
      .order('created_at', { ascending: false }).limit(100);
    setUsers(usersData || []);

    // Partidos
    const { data: matchesData } = await supabase.from('matches')
      .select('id,match_number,phase,group_name,team_a,team_b,team_a_flag,team_b_flag,score_a,score_b,status,scheduled_at')
      .order('match_number', { ascending: true });
    setMatches(matchesData || []);
  };

  const saveContent = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const rows = Object.entries(content).map(([key, value]) => ({ key, value }));
      await supabase.from('app_content').upsert(rows, { onConflict: 'key' });
      setSaveMsg('✅ Contenido guardado correctamente');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      setSaveMsg('❌ Error al guardar');
    }
    setSaving(false);
  };

  const updateMatchResult = async (match) => {
    if (match.score_a === '' || match.score_b === '') return;
    await supabase.from('matches').update({
      score_a: parseInt(match.score_a),
      score_b: parseInt(match.score_b),
      status: 'finished',
      updated_at: new Date().toISOString()
    }).eq('id', match.id);
    await supabase.rpc('calculate_match_points', { p_match_id: match.id });
    await supabase.rpc('recalculate_leaderboard');
    setEditingResult(null);
    loadData();
    setSaveMsg('✅ Resultado guardado y puntos calculados');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const downloadCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row =>
      headers.map(h => `"${row[h] || ''}"`).join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
  };

  const s = (key) => content[key] || DEFAULT_CONTENT[key] || '';
  const set = (key, val) => setContent(prev => ({ ...prev, [key]: val }));

  // ── PANTALLA DE LOGIN ────────────────────────────────────
  if (!authenticated) return (
    <div style={{ minHeight:'100vh', background:'#0A0E1A', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif' }}>
      <div style={{ background:'#1E2535', border:'1px solid rgba(245,197,24,0.2)', borderRadius:'14px', padding:'40px', width:'100%', maxWidth:'380px', textAlign:'center' }}>
        <div style={{ fontSize:'48px', marginBottom:'16px' }}>🔐</div>
        <h1 style={{ fontFamily:'sans-serif', fontWeight:900, fontSize:'24px', color:'#F5C518', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px' }}>Panel Admin</h1>
        <p style={{ color:'#8899BB', fontSize:'13px', marginBottom:'24px' }}>Reto Mundialista · Plaza Las Américas</p>
        <input
          type="password" placeholder="Contraseña de administrador"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ width:'100%', background:'#0A0E1A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'12px 14px', color:'#F0F4FF', fontSize:'14px', outline:'none', marginBottom:'12px' }}
        />
        {error && <p style={{ color:'#FF6B7A', fontSize:'13px', marginBottom:'12px' }}>{error}</p>}
        <button onClick={handleLogin} style={{ width:'100%', background:'#F5C518', color:'#0A0E1A', fontWeight:800, fontSize:'15px', textTransform:'uppercase', letterSpacing:'1px', border:'none', padding:'13px', borderRadius:'8px', cursor:'pointer' }}>
          Entrar
        </button>
      </div>
    </div>
  );

  const TABS = [
    { id:'contenido', label:'✏️ Contenido' },
    { id:'resultados', label:'⚽ Resultados' },
    { id:'usuarios', label:'👥 Usuarios' },
    { id:'metricas', label:'📊 Métricas' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#0A0E1A', fontFamily:'sans-serif', color:'#F0F4FF' }}>
      {/* Header */}
      <div style={{ background:'rgba(10,14,26,0.97)', borderBottom:'1px solid rgba(245,197,24,0.15)', padding:'0 20px', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontWeight:900, fontSize:'18px', color:'#F5C518', textTransform:'uppercase', letterSpacing:'1px' }}>
          🔐 Admin <span style={{ color:'#F0F4FF' }}>Panel</span>
        </div>
        <div style={{ display:'flex', gap:'4px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: activeTab===t.id ? 'rgba(245,197,24,0.12)':'none', border:'none', color: activeTab===t.id ? '#F5C518':'#8899BB', fontSize:'12px', fontWeight:500, padding:'6px 10px', borderRadius:'6px', cursor:'pointer', whiteSpace:'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setAuthenticated(false)} style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#8899BB', fontSize:'12px', padding:'5px 10px', borderRadius:'6px', cursor:'pointer' }}>
          Cerrar sesión
        </button>
      </div>

      {saveMsg && (
        <div style={{ background: saveMsg.includes('✅') ? 'rgba(34,197,94,0.1)':'rgba(230,57,70,0.1)', border:`1px solid ${saveMsg.includes('✅') ? 'rgba(34,197,94,0.3)':'rgba(230,57,70,0.3)'}`, padding:'10px 20px', fontSize:'13px', textAlign:'center', color: saveMsg.includes('✅') ? '#4ADE80':'#FF6B7A' }}>
          {saveMsg}
        </div>
      )}

      <div style={{ padding:'20px', maxWidth:'900px', margin:'0 auto' }}>

        {/* ── TAB: CONTENIDO ── */}
        {activeTab === 'contenido' && (
          <div>
            <h2 style={{ fontWeight:800, fontSize:'20px', textTransform:'uppercase', marginBottom:'4px' }}>Editor de <span style={{ color:'#F5C518' }}>Contenido</span></h2>
            <p style={{ fontSize:'13px', color:'#8899BB', marginBottom:'20px' }}>Edita textos, estadísticas y links sin tocar código. Los cambios se aplican inmediatamente.</p>

            {/* Landing */}
            <Section title="🏠 Landing Page">
              <Field label="Texto del badge superior" value={s('landing_badge')} onChange={v => set('landing_badge', v)} />
              <Field label="Título principal (línea 1)" value={s('landing_title')} onChange={v => set('landing_title', v)} />
              <Field label="Título principal (línea 2 — en dorado)" value={s('landing_subtitle')} onChange={v => set('landing_subtitle', v)} />
              <Field label="Subtítulo" value={s('landing_tagline')} onChange={v => set('landing_tagline', v)} />
              <Field label="Descripción principal" value={s('landing_description')} onChange={v => set('landing_description', v)} textarea />
              <Field label="Botón principal" value={s('landing_btn_primary')} onChange={v => set('landing_btn_primary', v)} />
              <Field label="Botón secundario" value={s('landing_btn_secondary')} onChange={v => set('landing_btn_secondary', v)} />
            </Section>

            {/* Estadísticas */}
            <Section title="📊 Estadísticas (barra de números)">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <Field label="Número 1" value={s('stat_matches')} onChange={v => set('stat_matches', v)} />
                <Field label="Etiqueta 1" value={s('stat_matches_label')} onChange={v => set('stat_matches_label', v)} />
                <Field label="Número 2 (equipos)" value={s('stat_teams')} onChange={v => set('stat_teams', v)} />
                <Field label="Etiqueta 2" value={s('stat_teams_label')} onChange={v => set('stat_teams_label', v)} />
                <Field label="Número 3" value={s('stat_free')} onChange={v => set('stat_free', v)} />
                <Field label="Etiqueta 3" value={s('stat_free_label')} onChange={v => set('stat_free_label', v)} />
                <Field label="Número 4 (fecha inicio)" value={s('stat_start')} onChange={v => set('stat_start', v)} />
                <Field label="Etiqueta 4" value={s('stat_start_label')} onChange={v => set('stat_start_label', v)} />
              </div>
            </Section>

            {/* Premio */}
            <Section title="🏆 Premio">
              <Field label="Monto del premio" value={s('prize_amount')} onChange={v => set('prize_amount', v)} />
              <Field label="Descripción del premio" value={s('prize_description')} onChange={v => set('prize_description', v)} />
            </Section>

            {/* Evento */}
            <Section title="🎉 Zona Mundial (Plaza)">
              <Field label="Título del evento" value={s('event_title')} onChange={v => set('event_title', v)} />
              <Field label="Descripción del evento" value={s('event_description')} onChange={v => set('event_description', v)} />
              <Field label="Horario del evento" value={s('event_schedule')} onChange={v => set('event_schedule', v)} />
            </Section>

            {/* Aviso predicciones */}
            <Section title="⚠️ Avisos">
              <Field label="Aviso de cierre de predicciones" value={s('predictions_lock_notice')} onChange={v => set('predictions_lock_notice', v)} />
            </Section>

            {/* Links */}
            <Section title="🔗 Links importantes">
              <Field label="Link Términos y Condiciones" value={s('link_terms')} onChange={v => set('link_terms', v)} />
              <Field label="Link Instagram Plaza" value={s('link_instagram')} onChange={v => set('link_instagram', v)} />
              <Field label="Link WhatsApp / Contacto" value={s('link_whatsapp')} onChange={v => set('link_whatsapp', v)} />
              <Field label="Link web principal Plaza" value={s('link_website')} onChange={v => set('link_website', v)} />
            </Section>

            {/* Colores */}
            <Section title="🎨 Colores de la app">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
                <ColorField label="Color dorado (primario)" value={s('color_primary')} onChange={v => set('color_primary', v)} />
                <ColorField label="Color fondo" value={s('color_background')} onChange={v => set('color_background', v)} />
                <ColorField label="Color texto" value={s('color_text')} onChange={v => set('color_text', v)} />
              </div>
            </Section>

            <button onClick={saveContent} disabled={saving} style={{ width:'100%', background: saving ? '#8899BB':'#F5C518', color:'#0A0E1A', fontWeight:800, fontSize:'16px', textTransform:'uppercase', letterSpacing:'1px', border:'none', padding:'14px', borderRadius:'8px', cursor: saving ? 'not-allowed':'pointer', marginTop:'8px' }}>
              {saving ? 'Guardando...' : '💾 Guardar todos los cambios'}
            </button>
          </div>
        )}

        {/* ── TAB: RESULTADOS ── */}
        {activeTab === 'resultados' && (
          <div>
            <h2 style={{ fontWeight:800, fontSize:'20px', textTransform:'uppercase', marginBottom:'4px' }}>Cargar <span style={{ color:'#F5C518' }}>Resultados</span></h2>
            <p style={{ fontSize:'13px', color:'#8899BB', marginBottom:'16px' }}>Ingresa el resultado oficial de cada partido. Los puntos se calculan automáticamente.</p>

            {['grupos','round_of_32','round_of_16','quarterfinals','semifinals','third_place','final'].map(phase => {
              const phaseMatches = matches.filter(m => m.phase === phase);
              if (!phaseMatches.length) return null;
              const phaseLabels = { grupos:'Fase de Grupos', round_of_32:'Ronda de 32', round_of_16:'Octavos', quarterfinals:'Cuartos', semifinals:'Semifinales', third_place:'Tercer Lugar', final:'Final' };
              return (
                <div key={phase} style={{ marginBottom:'20px' }}>
                  <div style={{ fontSize:'12px', fontWeight:600, color:'#F5C518', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'8px', paddingBottom:'6px', borderBottom:'1px solid rgba(245,197,24,0.15)' }}>
                    {phaseLabels[phase]}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    {phaseMatches.map(m => (
                      <div key={m.id} style={{ background:'#1E2535', border:`1px solid ${m.status==='finished' ? 'rgba(34,197,94,0.2)':'rgba(255,255,255,0.07)'}`, borderRadius:'8px', padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                        <div style={{ flex:1, minWidth:'160px' }}>
                          <span style={{ fontSize:'13px', fontWeight:500 }}>{m.team_a_flag} {m.team_a} vs {m.team_b_flag} {m.team_b}</span>
                          <div style={{ fontSize:'11px', color:'#8899BB', marginTop:'2px' }}>
                            {new Date(m.scheduled_at).toLocaleDateString('es-EC',{day:'numeric',month:'short',timeZone:'America/Guayaquil'})} · 
                            {new Date(m.scheduled_at).toLocaleTimeString('es-EC',{hour:'2-digit',minute:'2-digit',timeZone:'America/Guayaquil',hour12:true})}
                          </div>
                        </div>
                        {m.status === 'finished' ? (
                          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <span style={{ fontWeight:800, fontSize:'18px', color:'#22C55E' }}>{m.score_a} - {m.score_b}</span>
                            <span style={{ fontSize:'10px', color:'#22C55E', background:'rgba(34,197,94,0.1)', padding:'2px 6px', borderRadius:'4px' }}>✓ Finalizado</span>
                            <button onClick={() => setEditingResult({...m})} style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#8899BB', fontSize:'11px', padding:'3px 8px', borderRadius:'4px', cursor:'pointer' }}>Editar</button>
                          </div>
                        ) : editingResult?.id === m.id ? (
                          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                            <input type="number" min="0" max="20" value={editingResult.score_a ?? ''} onChange={e => setEditingResult(p => ({...p, score_a: e.target.value}))}
                              style={{ width:'44px', height:'36px', background:'#0A0E1A', border:'1px solid #F5C518', borderRadius:'6px', color:'#F0F4FF', fontWeight:700, fontSize:'16px', textAlign:'center', outline:'none' }} />
                            <span style={{ color:'#8899BB', fontWeight:700 }}>-</span>
                            <input type="number" min="0" max="20" value={editingResult.score_b ?? ''} onChange={e => setEditingResult(p => ({...p, score_b: e.target.value}))}
                              style={{ width:'44px', height:'36px', background:'#0A0E1A', border:'1px solid #F5C518', borderRadius:'6px', color:'#F0F4FF', fontWeight:700, fontSize:'16px', textAlign:'center', outline:'none' }} />
                            <button onClick={() => updateMatchResult(editingResult)} style={{ background:'#F5C518', color:'#0A0E1A', fontWeight:700, fontSize:'12px', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer' }}>Guardar</button>
                            <button onClick={() => setEditingResult(null)} style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#8899BB', fontSize:'12px', padding:'6px 10px', borderRadius:'6px', cursor:'pointer' }}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingResult({...m, score_a:'', score_b:''})} style={{ background:'rgba(245,197,24,0.1)', border:'1px solid rgba(245,197,24,0.2)', color:'#F5C518', fontWeight:600, fontSize:'12px', padding:'6px 14px', borderRadius:'6px', cursor:'pointer' }}>
                            + Cargar resultado
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB: USUARIOS ── */}
        {activeTab === 'usuarios' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <div>
                <h2 style={{ fontWeight:800, fontSize:'20px', textTransform:'uppercase', marginBottom:'2px' }}>Usuarios <span style={{ color:'#F5C518' }}>Registrados</span></h2>
                <p style={{ fontSize:'13px', color:'#8899BB' }}>{stats.users} participantes en total</p>
              </div>
              <button onClick={() => downloadCSV(users, 'usuarios_reto_mundial.csv')} style={{ background:'#F5C518', color:'#0A0E1A', fontWeight:700, fontSize:'13px', border:'none', padding:'8px 16px', borderRadius:'6px', cursor:'pointer' }}>
                ↓ Descargar CSV
              </button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                <thead>
                  <tr style={{ background:'#1C2333' }}>
                    {['Nombre','Email','Ciudad','Cédula','Puntos','Ranking','Registro'].map(h => (
                      <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'#8899BB', textTransform:'uppercase', letterSpacing:'.5px', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding:'8px 10px', fontWeight:500 }}>{u.full_name}</td>
                      <td style={{ padding:'8px 10px', color:'#8899BB' }}>{u.email}</td>
                      <td style={{ padding:'8px 10px', color:'#8899BB' }}>{u.city}</td>
                      <td style={{ padding:'8px 10px', color:'#8899BB' }}>{u.cedula}</td>
                      <td style={{ padding:'8px 10px', color:'#F5C518', fontWeight:700 }}>{u.total_points || 0}</td>
                      <td style={{ padding:'8px 10px', color:'#8899BB' }}>#{u.global_rank || '—'}</td>
                      <td style={{ padding:'8px 10px', color:'#8899BB' }}>{new Date(u.created_at).toLocaleDateString('es-EC')}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={7} style={{ padding:'24px', textAlign:'center', color:'#8899BB' }}>No hay usuarios registrados aún</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: MÉTRICAS ── */}
        {activeTab === 'metricas' && (
          <div>
            <h2 style={{ fontWeight:800, fontSize:'20px', textTransform:'uppercase', marginBottom:'16px' }}>Métricas <span style={{ color:'#F5C518' }}>en tiempo real</span></h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'12px', marginBottom:'24px' }}>
              {[
                ['👥', stats.users, 'Usuarios registrados', '#F5C518'],
                ['📋', stats.predictions, 'Predicciones enviadas', '#3B82F6'],
                ['✅', stats.finished, 'Partidos finalizados', '#22C55E'],
                ['⚽', '104', 'Total partidos', '#F97316'],
              ].map(([icon, num, label, color]) => (
                <div key={label} style={{ background:'#1E2535', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', padding:'16px', textAlign:'center' }}>
                  <div style={{ fontSize:'28px', marginBottom:'6px' }}>{icon}</div>
                  <div style={{ fontWeight:900, fontSize:'32px', color, lineHeight:1 }}>{num}</div>
                  <div style={{ fontSize:'11px', color:'#8899BB', marginTop:'4px' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'#1E2535', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', padding:'16px' }}>
              <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'12px', color:'#F5C518' }}>🔗 Links rápidos</div>
              {[
                ['Ver la app', 'https://reto.plazalasamericas.ec'],
                ['Base de datos (Supabase)', 'https://supabase.com/dashboard'],
                ['Hosting (Render)', 'https://dashboard.render.com'],
                ['API Football', 'https://dashboard.api-football.com'],
              ].map(([label, url]) => (
                <a key={label} href={url} target="_blank" rel="noopener" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', color:'#F0F4FF', textDecoration:'none', fontSize:'13px' }}>
                  <span>{label}</span>
                  <span style={{ color:'#8899BB', fontSize:'11px' }}>↗ Abrir</span>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Componentes auxiliares ───────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ background:'#1E2535', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', padding:'16px', marginBottom:'12px' }}>
      <div style={{ fontSize:'13px', fontWeight:600, color:'#F5C518', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'.5px' }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  return (
    <div style={{ marginBottom:'10px' }}>
      <label style={{ fontSize:'11px', fontWeight:600, color:'#8899BB', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:'4px' }}>{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
          style={{ width:'100%', background:'#0A0E1A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', padding:'8px 10px', color:'#F0F4FF', fontSize:'13px', outline:'none', resize:'vertical', fontFamily:'sans-serif' }} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          style={{ width:'100%', background:'#0A0E1A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', padding:'8px 10px', color:'#F0F4FF', fontSize:'13px', outline:'none' }} />
      )}
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div style={{ marginBottom:'10px' }}>
      <label style={{ fontSize:'11px', fontWeight:600, color:'#8899BB', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:'4px' }}>{label}</label>
      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width:'40px', height:'36px', border:'none', borderRadius:'6px', cursor:'pointer', background:'none' }} />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          style={{ flex:1, background:'#0A0E1A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', padding:'8px 10px', color:'#F0F4FF', fontSize:'13px', outline:'none' }} />
      </div>
    </div>
  );
}
