'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PHASE_LABELS = {
  grupos: 'Grupos', round_of_32: 'Ronda de 32', round_of_16: 'Octavos',
  quarterfinals: 'Cuartos', semifinals: 'Semifinales',
  third_place: 'Tercer lugar', final: 'Final'
};
const PHASE_COLORS = {
  grupos: 'rgba(245,197,24,0.15)', round_of_32: 'rgba(59,130,246,0.15)',
  round_of_16: 'rgba(249,115,22,0.15)', quarterfinals: 'rgba(168,85,247,0.15)',
  semifinals: 'rgba(236,72,153,0.15)', third_place: 'rgba(34,197,94,0.15)',
  final: 'rgba(245,197,24,0.25)'
};

// Códigos ISO2 para banderas via flagcdn.com
const FLAG_CODES = {
  MEX:'mx',RSA:'za',KOR:'kr',CZE:'cz',CAN:'ca',BIH:'ba',QAT:'qa',SUI:'ch',
  BRA:'br',MAR:'ma',HAI:'ht',SCO:'gb-sct',USA:'us',PAR:'py',AUS:'au',TUR:'tr',
  GER:'de',CUW:'cw',CIV:'ci',ECU:'ec',NED:'nl',JPN:'jp',SWE:'se',TUN:'tn',
  BEL:'be',EGY:'eg',IRN:'ir',NZL:'nz',ESP:'es',CPV:'cv',KSA:'sa',URU:'uy',
  FRA:'fr',SEN:'sn',IRQ:'iq',NOR:'no',ARG:'ar',ALG:'dz',AUT:'at',JOR:'jo',
  POR:'pt',COD:'cd',UZB:'uz',COL:'co',ENG:'gb-eng',CRO:'hr',GHA:'gh',PAN:'pa'
};
function FlagImg({code, name}) {
  const iso = FLAG_CODES[code];
  if (!iso) return <span style={{fontSize:'16px'}}>🏳️</span>;
  return <img src={`https://flagcdn.com/24x18/${iso}.png`} alt={name} width="24" height="18" style={{borderRadius:'2px',objectFit:'cover',flexShrink:0}} />;
}


// ============================================================
// HOOK: Cargar contenido editable desde Supabase
// ============================================================
const DEFAULT_CONTENT = {
  landing_badge: c('landing_badge'),
  landing_title: 'RETO',
  landing_subtitle: c('landing_subtitle'),
  landing_tagline: c('landing_tagline'),
  landing_description: '{c('landing_description')}',
  landing_btn_primary: '{c('landing_btn_primary')}',
  landing_btn_secondary: '{c('landing_btn_secondary')}',
  stat_matches: '104', stat_teams: '48', stat_free: '100%', stat_start: 'Jun 11',
  stat_matches_label: 'Partidos', stat_teams_label: 'Selecciones', stat_free_label: 'Gratuito', stat_start_label: 'Inicio',
  prize_amount: '$500', prize_description: 'Gift Card para el ganador del Reto Mundialista',
  predictions_lock_notice: c('predictions_lock_notice'),
  event_title: c('event_title'),
  event_description: c('event_description'),
  event_schedule: c('event_schedule'),
  color_primary: '#F5C518', color_background: '#0A0E1A', color_text: '#F0F4FF',
  link_terms: '#', link_instagram: '#', link_whatsapp: '#', link_website: 'https://www.plazalasamericas.ec',
};

function useContent() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  useEffect(() => {
    supabase.from('app_content').select('key,value')
      .then(({ data }) => {
        if (data?.length) {
          const obj = {};
          data.forEach(r => { obj[r.key] = r.value; });
          setContent(prev => ({ ...prev, ...obj }));
        }
      });
  }, []);
  return content;
}

const PHASE_TEXT = {
  grupos: '#F5C518', round_of_32: '#93C5FD', round_of_16: '#FCA44A',
  quarterfinals: '#C084FC', semifinals: '#F472B6',
  third_place: '#4ADE80', final: '#F5C518'
};

export default function Home() {
  const [page, setPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const content = useContent();

  const showToast = (msg, color = 'var(--gold)') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', color: 'var(--text)', fontFamily: 'var(--font-body,sans-serif)' }}>
      <Nav page={page} setPage={setPage} user={user} />
      {toast && (
        <div style={{ position: 'fixed', top: '65px', right: '16px', zIndex: 999, background: 'var(--card2,#242B3D)', border: `1px solid ${toast.color}`, borderRadius: '10px', padding: '12px 16px', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', maxWidth: '280px', animation: 'slideIn .3s ease' }}>
          <span style={{ color: toast.color, fontSize: '18px' }}>✓</span>
          <span>{toast.msg}</span>
        </div>
      )}
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(40px) } to { opacity:1; transform:translateX(0) } }
        input:focus { border-color: var(--gold) !important; outline: none; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(245,197,24,0.3); border-radius:2px; }
      `}</style>
      {page === 'landing'       && <LandingPage setPage={setPage} content={content} />}
      {page === 'registro'      && <RegistroPage setPage={setPage} setUser={setUser} showToast={showToast} />}
      {page === 'predicciones'  && <PrediccionesPage user={user} showToast={showToast} content={content} />}
      {page === 'dashboard'     && <DashboardPage user={user} />}
      {page === 'ranking'       && <RankingPage />}
      {page === 'promos'        && <PromosPage content={content} />}
    </div>
  );
}

function Nav({ page, setPage, user }) {
  const tabs = [
    { id:'landing', label:'Inicio' }, { id:'predicciones', label:'Predicciones' },
    { id:'dashboard', label:'Mi Reto' }, { id:'ranking', label:'Ranking' }, { id:'promos', label:'Plaza' }
  ];
  return (
    <nav style={{ background:'rgba(10,14,26,0.97)', backdropFilter:'blur(12px)', padding:'0 16px', display:'flex', alignItems:'center', justifyContent:'space-between', height:'56px', borderBottom:'1px solid rgba(245,197,24,0.15)', position:'sticky', top:0, zIndex:100 }}>
      <div style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:900, fontSize:'18px', letterSpacing:'1px', color:'var(--gold)', textTransform:'uppercase', cursor:'pointer' }} onClick={() => setPage('landing')}>
        Reto <span style={{ color:'var(--text)' }}>Mundial</span>
      </div>
      <div style={{ display:'flex', gap:'2px', overflowX:'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setPage(t.id)} style={{ background: page===t.id ? 'rgba(245,197,24,0.12)':'none', border:'none', color: page===t.id ? 'var(--gold)':'var(--muted)', fontFamily:'var(--font-body,sans-serif)', fontSize:'12px', fontWeight:500, padding:'6px 10px', borderRadius:'6px', cursor:'pointer', textTransform:'uppercase', letterSpacing:'.5px', whiteSpace:'nowrap' }}>{t.label}</button>
        ))}
      </div>
      {user && <div style={{ fontSize:'12px', color:'var(--muted)', display:'flex', alignItems:'center', gap:'6px' }}><div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,var(--gold),var(--orange,#F97316))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'11px', color:'var(--dark,#0A0E1A)' }}>{user.full_name?.charAt(0)}</div><span style={{ display:'none' }}>{user.full_name?.split(' ')[0]}</span></div>}
    </nav>
  );
}

function LandingPage({ setPage, content = DEFAULT_CONTENT }) {
  const c = (key) => content[key] || DEFAULT_CONTENT[key] || '';
  return (
    <div>
      <div style={{ background:'linear-gradient(160deg,#0A0E1A 0%,#1a1025 40%,#0d1a0a 100%)', padding:'48px 20px 64px', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(245,197,24,0.15)', border:'1px solid rgba(245,197,24,0.3)', borderRadius:'20px', padding:'4px 14px', fontSize:'11px', fontWeight:600, color:'var(--gold)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'20px' }}>⚽ FIFA World Cup 2026</div>
        <h1 style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:900, fontSize:'clamp(40px,8vw,68px)', lineHeight:.95, letterSpacing:'-1px', textTransform:'uppercase', marginBottom:'12px' }}>
          {c('landing_title')}<br /><span style={{ color:'var(--gold)' }}>MUNDIALISTA</span><br />
          <span style={{ fontSize:'clamp(18px,4vw,28px)', fontWeight:600, color:'var(--muted,#8899BB)', letterSpacing:'2px' }}>Plaza Las Américas</span>
        </h1>
        <p style={{ fontSize:'15px', color:'var(--muted,#8899BB)', maxWidth:'480px', margin:'0 auto 32px', lineHeight:1.6 }}>Predice todos los partidos del Mundial 2026, acumula puntos en tiempo real y gana premios exclusivos de Plaza Las Américas.</p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => setPage('registro')} style={{ background:'var(--gold)', color:'var(--dark,#0A0E1A)', fontFamily:'var(--font-head,sans-serif)', fontWeight:800, fontSize:'16px', letterSpacing:'1px', textTransform:'uppercase', border:'none', padding:'14px 36px', borderRadius:'8px', cursor:'pointer' }}>🏆 Participar Gratis</button>
          <button onClick={() => setPage('predicciones')} style={{ background:'transparent', color:'var(--text)', fontFamily:'var(--font-head,sans-serif)', fontWeight:700, fontSize:'14px', letterSpacing:'1px', textTransform:'uppercase', border:'1px solid rgba(255,255,255,0.2)', padding:'12px 24px', borderRadius:'8px', cursor:'pointer' }}>Ver Partidos</button>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'center', gap:'32px', padding:'24px 20px', background:'rgba(255,255,255,0.02)', borderTop:'1px solid rgba(255,255,255,0.06)', flexWrap:'wrap' }}>
        {[[c('stat_matches'),c('stat_matches_label')],[c('stat_teams'),c('stat_teams_label')],[c('stat_free'),c('stat_free_label')],[c('stat_start'),c('stat_start_label')]].map(([n,l]) => (
          <div key={l} style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:800, fontSize:'28px', color:'var(--gold)', lineHeight:1 }}>{n}</div>
            <div style={{ fontSize:'11px', color:'var(--muted,#8899BB)', textTransform:'uppercase', letterSpacing:'.5px', marginTop:'2px' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ padding:'32px 20px' }}>
        <h2 style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:800, fontSize:'22px', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'4px' }}>Sistema de <span style={{ color:'var(--gold)' }}>Puntos</span></h2>
        <p style={{ fontSize:'13px', color:'var(--muted,#8899BB)', marginBottom:'16px' }}>Máximo 5 puntos por partido</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {[['⚡ Marcador exacto','5 pts','var(--gold)'],['✅ Ganador o empate','3 pts','var(--blue,#3B82F6)'],['📊 Diferencia de goles','2 pts','var(--orange,#F97316)'],['🎯 Goles de un equipo','1 pt','var(--muted,#8899BB)']].map(([label,pts,color]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--card,#1E2535)', borderRadius:'8px', padding:'12px 16px', border:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize:'14px' }}>{label}</span>
              <span style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:800, fontSize:'20px', color }}>{pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegistroPage({ setPage, setUser, showToast }) {
  const [form, setForm] = useState({ full_name:'', cedula:'', phone:'', email:'', city:'', birth_date:'', accepts_terms:false, accepts_marketing:false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!form.accepts_terms) { setError('Debes aceptar los términos y condiciones'); return; }
    if (!form.full_name || !form.cedula || !form.email || !form.phone || !form.city || !form.birth_date) { setError('Por favor llena todos los campos'); return; }
    setLoading(true);
    try {
      const { data: existing } = await supabase.from('users').select('id').eq('cedula', form.cedula).single();
      if (existing) { setError('Esta cédula ya está registrada'); setLoading(false); return; }
      const { data, error: err } = await supabase.from('users').insert([{
        full_name: form.full_name, cedula: form.cedula, phone: form.phone,
        email: form.email, city: form.city, birth_date: form.birth_date,
        accepts_terms: true, accepts_marketing: form.accepts_marketing
      }]).select().single();
      if (err) { setError(err.message); setLoading(false); return; }
      await supabase.from('leaderboard').insert([{ user_id: data.id }]);
      setUser(data);
      showToast('¡Registro exitoso! Ahora haz tus predicciones', 'var(--green,#22C55E)');
      setPage('predicciones');
    } catch(e) { setError('Error al registrar. Intenta de nuevo.'); }
    setLoading(false);
  };

  return (
    <div style={{ padding:'24px 20px' }}>
      <h2 style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:800, fontSize:'22px', textTransform:'uppercase', marginBottom:'4px' }}>Registro <span style={{ color:'var(--gold)' }}>Gratuito</span></h2>
      <p style={{ fontSize:'13px', color:'var(--muted,#8899BB)', marginBottom:'20px' }}>Únete al Reto Mundialista Plaza Las Américas 2026</p>
      <div style={{ background:'var(--card,#1E2535)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          {[['Nombre completo','full_name','text','Tu nombre completo'],['Cédula / Pasaporte','cedula','text','0123456789'],['Celular','phone','tel','0991234567'],['Email','email','email','correo@ejemplo.com'],['Ciudad','city','text','Guayaquil'],['Fecha de nacimiento','birth_date','date','']].map(([label,key,type,ph]) => (
            <div key={key}>
              <label style={{ fontSize:'11px', fontWeight:600, color:'var(--muted,#8899BB)', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:'5px' }}>{label}</label>
              <input type={type} placeholder={ph} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})}
                style={{ width:'100%', background:'var(--dark3,#1C2333)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 12px', color:'var(--text)', fontSize:'14px' }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop:'14px', display:'flex', flexDirection:'column', gap:'10px' }}>
          {[['accepts_terms','Acepto los términos y condiciones del Reto Mundialista Plaza Las Américas'],['accepts_marketing','Acepto recibir comunicaciones comerciales y promociones de Plaza Las Américas']].map(([key,label]) => (
            <label key={key} style={{ display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer' }}>
              <input type="checkbox" checked={form[key]} onChange={e => setForm({...form,[key]:e.target.checked})} style={{ marginTop:'2px', accentColor:'var(--gold)', width:'16px', height:'16px', flexShrink:0 }} />
              <span style={{ fontSize:'12px', color:'var(--muted,#8899BB)', lineHeight:1.5 }}>{label}</span>
            </label>
          ))}
        </div>
        {error && <div style={{ marginTop:'12px', background:'rgba(230,57,70,0.1)', border:'1px solid rgba(230,57,70,0.3)', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', color:'#FF6B7A' }}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{ width:'100%', marginTop:'18px', background: loading ? 'var(--muted,#8899BB)':'var(--gold)', color:'var(--dark,#0A0E1A)', fontFamily:'var(--font-head,sans-serif)', fontWeight:800, fontSize:'16px', letterSpacing:'1px', textTransform:'uppercase', border:'none', padding:'14px', borderRadius:'8px', cursor: loading ? 'not-allowed':'pointer' }}>
          {loading ? 'Registrando...' : 'Registrarme y hacer mis predicciones →'}
        </button>
      </div>
    </div>
  );
}

function PrediccionesPage({ user, showToast, content = DEFAULT_CONTENT }) {
  const c = (key) => content[key] || DEFAULT_CONTENT[key] || '';
  const [matches, setMatches] = useState([]);
  const [scores, setScores] = useState({});
  const [phase, setPhase] = useState('grupos');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('matches').select('*').order('match_number', { ascending:true })
      .then(({ data }) => { setMatches(data || []); setLoading(false); });
  }, []);

  const phases = ['grupos','round_of_32','round_of_16','quarterfinals','semifinals','third_place','final'];
  const filtered = matches.filter(m => m.phase === phase);

  const savePredictions = async () => {
    if (!user) { showToast('Regístrate primero para guardar tus predicciones', '#FF6B7A'); return; }
    setSaving(true);
    const rows = Object.entries(scores)
      .filter(([k]) => k.endsWith('_a'))
      .map(([k]) => {
        const matchId = k.replace('_a','');
        return { user_id: user.id, match_id: matchId, predicted_score_a: parseInt(scores[k]||0), predicted_score_b: parseInt(scores[matchId+'_b']||0) };
      }).filter(r => r.match_id);
    if (rows.length === 0) { showToast('Ingresa al menos una predicción', '#FF6B7A'); setSaving(false); return; }
    const { error } = await supabase.from('predictions').upsert(rows, { onConflict:'user_id,match_id' });
    if (error) { showToast('Error al guardar: ' + error.message, '#FF6B7A'); }
    else { showToast(`✅ ${rows.length} predicciones guardadas`, 'var(--green,#22C55E)'); }
    setSaving(false);
  };

  return (
    <div style={{ padding:'20px' }}>
      <h2 style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:800, fontSize:'22px', textTransform:'uppercase', marginBottom:'4px' }}>Mis <span style={{ color:'var(--gold)' }}>Predicciones</span></h2>
      <p style={{ fontSize:'13px', color:'var(--muted,#8899BB)', marginBottom:'14px' }}>Ingresa el marcador que crees que tendrá cada partido</p>

      <div style={{ display:'flex', gap:'6px', overflowX:'auto', paddingBottom:'4px', marginBottom:'16px' }}>
        {phases.map(p => (
          <button key={p} onClick={() => setPhase(p)} style={{ background: phase===p ? 'rgba(245,197,24,0.15)':'var(--dark3,#1C2333)', border:`1px solid ${phase===p ? 'rgba(245,197,24,0.3)':'rgba(255,255,255,0.08)'}`, borderRadius:'6px', padding:'6px 12px', fontSize:'11px', fontWeight:600, color: phase===p ? 'var(--gold)':'var(--muted,#8899BB)', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, textTransform:'uppercase', letterSpacing:'.5px' }}>
            {PHASE_LABELS[p]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'var(--muted,#8899BB)' }}>Cargando partidos...</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {filtered.map(m => (
            <div key={m.id} style={{ background:'var(--card,#1E2535)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
              <span style={{ background: PHASE_COLORS[m.phase]||'rgba(245,197,24,0.1)', border:`1px solid ${PHASE_TEXT[m.phase]||'var(--gold)'}40`, borderRadius:'4px', padding:'2px 7px', fontSize:'10px', fontWeight:600, color: PHASE_TEXT[m.phase]||'var(--gold)', whiteSpace:'nowrap' }}>
                {m.group_name || PHASE_LABELS[m.phase]}
              </span>
              <div style={{ flex:1, display:'flex', alignItems:'center', gap:'6px', minWidth:'140px' }}>
                <span style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:700, fontSize:'13px' }}><FlagImg code={m.team_a_code} name={m.team_a} /> {m.team_a}</span>
                <span style={{ color:'var(--muted,#8899BB)', fontSize:'11px' }}>vs</span>
                <span style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:700, fontSize:'13px' }}><FlagImg code={m.team_b_code} name={m.team_b} /> {m.team_b}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                <input type="number" min="0" max="20" placeholder="0" value={scores[m.id+'_a']||''} onChange={e => setScores({...scores,[m.id+'_a']:e.target.value})}
                  style={{ width:'36px', height:'36px', background:'var(--dark3,#1C2333)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'6px', color:'var(--text)', fontWeight:700, fontSize:'16px', textAlign:'center' }} />
                <span style={{ color:'var(--muted,#8899BB)', fontWeight:700 }}>-</span>
                <input type="number" min="0" max="20" placeholder="0" value={scores[m.id+'_b']||''} onChange={e => setScores({...scores,[m.id+'_b']:e.target.value})}
                  style={{ width:'36px', height:'36px', background:'var(--dark3,#1C2333)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'6px', color:'var(--text)', fontWeight:700, fontSize:'16px', textAlign:'center' }} />
              </div>
              <div style={{ fontSize:'11px', color:'var(--muted,#8899BB)', textAlign:'right', minWidth:'65px' }}>
                <div>{new Date(new Date(m.scheduled_at).getTime() - 0).toLocaleDateString('es-EC',{month:'short',day:'numeric',timeZone:'America/Guayaquil'})}</div>
                <div>{new Date(m.scheduled_at).toLocaleTimeString('es-EC',{hour:'2-digit',minute:'2-digit',timeZone:'America/Guayaquil',hour12:true})}</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign:'center', padding:'40px', color:'var(--muted,#8899BB)' }}>No hay partidos en esta fase aún</div>}
        </div>
      )}

      <button onClick={savePredictions} disabled={saving} style={{ width:'100%', marginTop:'16px', background: saving ? 'var(--muted,#8899BB)':'var(--gold)', color:'var(--dark,#0A0E1A)', fontFamily:'var(--font-head,sans-serif)', fontWeight:800, fontSize:'16px', letterSpacing:'1px', textTransform:'uppercase', border:'none', padding:'14px', borderRadius:'8px', cursor: saving?'not-allowed':'pointer' }}>
        {saving ? 'Guardando...' : '💾 Guardar Predicciones'}
      </button>
      <p style={{ textAlign:'center', fontSize:'11px', color:'var(--muted,#8899BB)', marginTop:'8px' }}>⚠️ Predicciones se bloquean el 10 de junio a las 23:59 hora Ecuador</p>
    </div>
  );
}

function DashboardPage({ user }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('leaderboard').select('*').eq('user_id', user.id).single()
      .then(({ data }) => setStats(data));
  }, [user]);

  if (!user) return (
    <div style={{ padding:'60px 20px', textAlign:'center' }}>
      <div style={{ fontSize:'48px', marginBottom:'16px' }}>👤</div>
      <h2 style={{ fontFamily:'var(--font-head,sans-serif)', fontSize:'24px', fontWeight:800, color:'var(--gold)', marginBottom:'8px' }}>REGÍSTRATE PRIMERO</h2>
      <p style={{ color:'var(--muted,#8899BB)' }}>Necesitas una cuenta para ver tu dashboard</p>
    </div>
  );

  return (
    <div style={{ padding:'24px 20px' }}>
      <h2 style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:800, fontSize:'22px', textTransform:'uppercase', marginBottom:'16px' }}>Mi <span style={{ color:'var(--gold)' }}>Dashboard</span></h2>
      <div style={{ background:'var(--dark3,#1C2333)', border:'1px solid rgba(245,197,24,0.15)', borderRadius:'14px', padding:'20px', marginBottom:'16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:'12px', color:'var(--muted,#8899BB)', textTransform:'uppercase', letterSpacing:'.5px' }}>Posición Global</div>
            <div style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:900, fontSize:'42px', color:'var(--gold)', lineHeight:1 }}>#{stats?.global_rank || '—'}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'12px', color:'var(--muted,#8899BB)' }}>Puntos</div>
            <div style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:900, fontSize:'52px', color:'var(--text)', lineHeight:1 }}>{stats?.total_points || 0}</div>
          </div>
        </div>
        <div style={{ marginTop:'12px', fontSize:'13px', color:'var(--muted,#8899BB)' }}>Bienvenido, <strong style={{ color:'var(--gold)' }}>{user.full_name}</strong></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
        {[['Exactos','exact_scores','var(--gold)'],['Acertados','correct_results','var(--green,#22C55E)'],['Predicciones','total_predictions','var(--blue,#3B82F6)'],['% Aciertos','accuracy_pct','var(--orange,#F97316)']].map(([l,k,c]) => (
          <div key={k} style={{ background:'var(--dark,#0A0E1A)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'8px', padding:'12px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-head,sans-serif)', fontSize:'24px', fontWeight:800, color:c }}>{stats?.[k] ?? '0'}{k==='accuracy_pct'?'%':''}</div>
            <div style={{ fontSize:'11px', color:'var(--muted,#8899BB)', marginTop:'2px' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('v_leaderboard').select('*').limit(50)
      .then(({ data }) => { setRanking(data || []); setLoading(false); });
  }, []);

  return (
    <div style={{ padding:'24px 20px' }}>
      <h2 style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:800, fontSize:'22px', textTransform:'uppercase', marginBottom:'16px' }}>Ranking <span style={{ color:'var(--gold)' }}>Global</span></h2>
      {loading ? <div style={{ textAlign:'center', padding:'40px', color:'var(--muted,#8899BB)' }}>Cargando ranking...</div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
          {ranking.length === 0 && <div style={{ textAlign:'center', padding:'40px', color:'var(--muted,#8899BB)' }}>El ranking se activará cuando comiencen los partidos</div>}
          {ranking.map((r, i) => (
            <div key={r.user_id} style={{ display:'flex', alignItems:'center', gap:'12px', background:'var(--card,#1E2535)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'8px', padding:'10px 14px' }}>
              <span style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:800, fontSize:'20px', color: i<3 ? 'var(--gold)':'var(--muted,#8899BB)', width:'28px', textAlign:'center', flexShrink:0 }}>{r.global_rank}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'14px', fontWeight:500 }}>{r.full_name}</div>
                <div style={{ fontSize:'11px', color:'var(--muted,#8899BB)' }}>{r.city}</div>
              </div>
              <span style={{ fontSize:'11px', fontWeight:600, color: r.rank_change>0 ? 'var(--green,#22C55E)': r.rank_change<0 ? 'var(--red,#E63946)':'var(--muted,#8899BB)' }}>
                {r.rank_change>0?`▲${r.rank_change}`:r.rank_change<0?`▼${Math.abs(r.rank_change)}`:'—'}
              </span>
              <span style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:700, fontSize:'18px', color:'var(--gold)' }}>{r.total_points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PromosPage({ content = DEFAULT_CONTENT }) {
  const c = (key) => content[key] || DEFAULT_CONTENT[key] || '';
  const promos = [
    { emoji:'🍔', store:'Food Court', nombre:'Combo Mundial', desc:'2x1 en combo burger durante los partidos' },
    { emoji:'👕', store:'Deportes', nombre:'20% OFF camisetas', desc:'Camisetas oficiales selecciones' },
    { emoji:'🎁', store:'Premio Especial', nombre:'Gift Card $500', desc:'Para el ganador del reto mundialista' },
    { emoji:'☕', store:'Cafeterías', nombre:'Café & Partido', desc:'Café + snack por $3.99' },
    { emoji:'🎮', store:'Entretenimiento', nombre:'Zona Gaming', desc:'FIFA 26 gratis para top 100' },
    { emoji:'🍕', store:'Restaurantes', nombre:'Pizza Party', desc:'Paquete familiar especial' },
  ];
  return (
    <div style={{ padding:'24px 20px' }}>
      <h2 style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:800, fontSize:'22px', textTransform:'uppercase', marginBottom:'4px' }}>Plaza Las <span style={{ color:'var(--gold)' }}>Américas</span></h2>
      <p style={{ fontSize:'13px', color:'var(--muted,#8899BB)', marginBottom:'16px' }}>Promociones mundialistas exclusivas para participantes</p>
      <div style={{ background:'linear-gradient(135deg,rgba(245,197,24,0.08),rgba(249,115,22,0.05))', border:'1px solid rgba(245,197,24,0.2)', borderRadius:'12px', padding:'16px', marginBottom:'16px', textAlign:'center' }}>
        <div style={{ fontSize:'11px', color:'var(--gold)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'4px' }}>🎉 Evento especial</div>
        <div style={{ fontFamily:'var(--font-head,sans-serif)', fontWeight:800, fontSize:'18px', marginBottom:'4px' }}>ZONA MUNDIAL · Plaza Las Américas</div>
        <div style={{ fontSize:'12px', color:'var(--muted,#8899BB)' }}>Pantallas gigantes · Activaciones · Sorteos en vivo</div>
        <div style={{ marginTop:'8px', display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(34,197,94,0.12)', borderRadius:'6px', padding:'4px 12px', fontSize:'12px', color:'var(--green,#22C55E)', fontWeight:600 }}>📅 Todos los días del Mundial · 16h00 - 22h00</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'10px' }}>
        {promos.map((p, i) => (
          <div key={i} style={{ background:'var(--card,#1E2535)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', overflow:'hidden', cursor:'pointer' }}>
            <div style={{ height:'72px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px', background:'rgba(255,255,255,0.03)' }}>{p.emoji}</div>
            <div style={{ padding:'10px' }}>
              <div style={{ fontSize:'10px', color:'var(--gold)', fontWeight:600, textTransform:'uppercase' }}>{p.store}</div>
              <div style={{ fontSize:'13px', fontWeight:600, marginTop:'2px' }}>{p.nombre}</div>
              <div style={{ fontSize:'11px', color:'var(--muted,#8899BB)', marginTop:'3px' }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
