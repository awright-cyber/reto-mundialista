'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const FLAG_CODES = {
  MEX:'mx',RSA:'za',KOR:'kr',CZE:'cz',CAN:'ca',BIH:'ba',QAT:'qa',SUI:'ch',
  BRA:'br',MAR:'ma',HAI:'ht',SCO:'gb-sct',USA:'us',PAR:'py',AUS:'au',TUR:'tr',
  GER:'de',CUW:'cw',CIV:'ci',ECU:'ec',NED:'nl',JPN:'jp',SWE:'se',TUN:'tn',
  BEL:'be',EGY:'eg',IRN:'ir',NZL:'nz',ESP:'es',CPV:'cv',KSA:'sa',URU:'uy',
  FRA:'fr',SEN:'sn',IRQ:'iq',NOR:'no',ARG:'ar',ALG:'dz',AUT:'at',JOR:'jo',
  POR:'pt',COD:'cd',UZB:'uz',COL:'co',ENG:'gb-eng',CRO:'hr',GHA:'gh',PAN:'pa'
};

function FlagImg({code,name}) {
  const iso = FLAG_CODES[code];
  if (!iso) return <span style={{fontSize:'16px'}}>🏳️</span>;
  return <img src={`https://flagcdn.com/24x18/${iso}.png`} alt={name} width="24" height="18" style={{borderRadius:'2px',objectFit:'cover',flexShrink:0}} />;
}

const PHASE_LABELS = {
  grupos:'Grupos',round_of_32:'Ronda de 32',round_of_16:'Octavos',
  quarterfinals:'Cuartos',semifinals:'Semifinales',third_place:'Tercer lugar',final:'Final'
};
const PHASE_COLORS = {
  grupos:'rgba(245,197,24,0.15)',round_of_32:'rgba(59,130,246,0.15)',
  round_of_16:'rgba(249,115,22,0.15)',quarterfinals:'rgba(168,85,247,0.15)',
  semifinals:'rgba(236,72,153,0.15)',third_place:'rgba(34,197,94,0.15)',final:'rgba(245,197,24,0.25)'
};
const PHASE_TEXT = {
  grupos:'#F5C518',round_of_32:'#93C5FD',round_of_16:'#FCA44A',
  quarterfinals:'#C084FC',semifinals:'#F472B6',third_place:'#4ADE80',final:'#F5C518'
};

const DEFAULT_CONTENT = {
  landing_badge:'⚽ FIFA World Cup 2026',
  landing_title:'RETO',
  landing_subtitle:'MUNDIALISTA',
  landing_tagline:'Plaza Las Américas',
  landing_description:'Predice todos los partidos del Mundial 2026, acumula puntos en tiempo real y gana premios exclusivos de Plaza Las Américas.',
  landing_btn_primary:'🏆 Participar Gratis',
  landing_btn_secondary:'Ver Partidos',
  stat_matches:'104',stat_teams:'48',stat_free:'100%',stat_start:'Jun 11',
  stat_matches_label:'Partidos',stat_teams_label:'Selecciones',stat_free_label:'Gratuito',stat_start_label:'Inicio',
  prize_amount:'$500',prize_description:'Gift Card para el ganador del Reto Mundialista',
  predictions_lock_notice:'⚠️ Predicciones se bloquean el 10 de junio a las 23:59 hora Ecuador',
  event_title:'ZONA MUNDIAL · Plaza Las Américas',
  event_description:'Pantallas gigantes · Activaciones · Sorteos en vivo',
  event_schedule:'📅 Todos los días del Mundial · 16h00 - 22h00',
  color_primary:'#F5C518',color_background:'#0A0E1A',color_text:'#F0F4FF',
  link_terms:'#',link_instagram:'#',link_whatsapp:'#',link_website:'https://www.plazalasamericas.ec',
  footer_link_website_label:'🌐 Plaza Las Américas',
  footer_link_instagram_label:'📸 Instagram',
  footer_link_whatsapp_label:'💬 WhatsApp',
  footer_link_terms_label:'📄 Términos y Condiciones',
  footer_copyright:'© 2026 Reto Mundialista · Plaza Las Américas · Participación 100% gratuita',
};

function useContent() {
  const [content,setContent] = useState(DEFAULT_CONTENT);
  useEffect(() => {
    supabase.from('app_content').select('key,value')
      .then(({data}) => {
        if (data?.length) {
          const obj={};
          data.forEach(r=>{obj[r.key]=r.value;});
          setContent(prev=>({...prev,...obj}));
          // Aplicar colores dinámicos como variables CSS globales
          const root = document.documentElement;
          const colorMap = obj;
          if (colorMap.color_primary) {
            root.style.setProperty('--gold', colorMap.color_primary);
            root.style.setProperty('--gold2', colorMap.color_primary);
            // También actualizar rgba para transparencias
            const hex = colorMap.color_primary.replace('#','');
            const r2 = parseInt(hex.substring(0,2),16);
            const g2 = parseInt(hex.substring(2,4),16);
            const b2 = parseInt(hex.substring(4,6),16);
            root.style.setProperty('--gold-rgb', `${r2},${g2},${b2}`);
          }
          if (colorMap.color_background) {
            root.style.setProperty('--dark', colorMap.color_background);
            root.style.setProperty('--dark2', colorMap.color_background);
          }
          if (colorMap.color_text) root.style.setProperty('--text', colorMap.color_text);
        }
      });
  },[]);
  return content;
}

export default function Home() {
  const [page,setPage] = useState('landing');
  const [user,setUser] = useState(null);
  const [toast,setToast] = useState(null);
  const content = useContent();

  const showToast = (msg,color='var(--gold)') => {
    setToast({msg,color});
    setTimeout(()=>setToast(null),3000);
  };

  const c = (key) => content[key] || DEFAULT_CONTENT[key] || '';

  return (
    <div style={{minHeight:'100vh',background:'#0A0E1A',color:'#F0F4FF',fontFamily:'sans-serif'}}>
      <Nav page={page} setPage={setPage} user={user} c={c} />
      {toast && (
        <div style={{position:'fixed',top:'65px',right:'16px',zIndex:999,background:'#242B3D',border:`1px solid ${toast.color}`,borderRadius:'10px',padding:'12px 16px',fontSize:'13px',fontWeight:500,display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 20px rgba(0,0,0,0.4)',maxWidth:'280px'}}>
          <span style={{color:toast.color,fontSize:'18px'}}>✓</span><span>{toast.msg}</span>
        </div>
      )}
      <style>{`
  :root {
    --gold: #F5C518;
    --gold2: #E8A800;
    --gold-rgb: 245,197,24;
    --dark: #0A0E1A;
    --dark2: #111827;
    --dark3: #1C2333;
    --text: #F0F4FF;
    --muted: #8899BB;
    --green: #22C55E;
    --blue: #3B82F6;
    --orange: #F97316;
    --card: #1E2535;
    --red: #E63946;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--dark); color: var(--text); }
  input:focus { border-color: var(--gold) !important; outline: none; }
  button:hover { opacity: 0.9; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(var(--gold-rgb),0.3); border-radius: 2px; }
  .btn-primary { background: var(--gold) !important; }
  .nav-logo-gold { color: var(--gold) !important; }
  .stat-num { color: var(--gold) !important; }
  .accent-gold { color: var(--gold) !important; }
  .border-gold { border-color: rgba(var(--gold-rgb),0.3) !important; }
`}</style>
      {page==='landing' && <LandingPage setPage={setPage} c={c} />}
      {page==='registro' && <RegistroPage setPage={setPage} setUser={setUser} showToast={showToast} c={c} />}
      {page==='predicciones' && <PrediccionesPage user={user} showToast={showToast} c={c} />}
      {page==='dashboard' && <DashboardPage user={user} />}
      {page==='ranking' && <RankingPage />}
      {page==='promos' && <PromosPage c={c} />}
      <Footer c={c} />
    </div>
  );
}

function Nav({page,setPage,user,c}) {
  const tabs=[{id:'landing',label:'Inicio'},{id:'predicciones',label:'Predicciones'},{id:'dashboard',label:'Mi Reto'},{id:'ranking',label:'Ranking'},{id:'promos',label:'Plaza'}];
  const logoUrl = c('logo_url');
  const websiteLink = c('link_website') || 'https://www.plazalasamericas.ec';
  return (
    <nav style={{background:'rgba(10,14,26,0.97)',backdropFilter:'blur(12px)',padding:'0 12px',display:'flex',alignItems:'center',justifyContent:'space-between',height:'56px',borderBottom:'1px solid rgba(var(--gold-rgb,245,197,24),0.2)',position:'sticky',top:0,zIndex:100}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}} onClick={()=>setPage('landing')}>
        <span style={{fontWeight:900,fontSize:'18px',color:'var(--gold)',textTransform:'uppercase',letterSpacing:'1px'}}>
          Reto <span style={{color:'var(--text)'}}>Mundial</span>
        </span>
      </div>
      <div style={{display:'flex',gap:'2px',overflowX:'auto'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setPage(t.id)} style={{background:page===t.id?'rgba(var(--gold-rgb,245,197,24),0.12)':'none',border:'none',color:page===t.id?'var(--gold)':'var(--muted,#8899BB)',fontSize:'12px',fontWeight:500,padding:'6px 10px',borderRadius:'6px',cursor:'pointer',textTransform:'uppercase',letterSpacing:'.5px',whiteSpace:'nowrap'}}>{t.label}</button>
        ))}
      </div>
      <a href={websiteLink} target="_blank" rel="noopener" style={{display:'flex',alignItems:'center',gap:'5px',background:'rgba(var(--gold-rgb,245,197,24),0.1)',border:'1px solid rgba(var(--gold-rgb,245,197,24),0.2)',borderRadius:'6px',padding:'5px 10px',fontSize:'11px',fontWeight:600,color:'var(--gold)',textDecoration:'none',whiteSpace:'nowrap'}}>
        {logoUrl ? (
          <img src={logoUrl} alt="Plaza Las Américas" style={{height:'28px',objectFit:'contain'}} />
        ) : (
          '🏬 Plaza'
        )}
      </a>
    </nav>
  );
}

function Footer({c}) {
  const logoUrl = c('logo_url');
  const links = [
    {url: c('link_website'), label: c('footer_link_website_label'), bold: true},
    {url: c('link_instagram'), label: c('footer_link_instagram_label')},
    {url: c('link_whatsapp'), label: c('footer_link_whatsapp_label')},
    {url: c('link_terms'), label: c('footer_link_terms_label')},
  ].filter(l => l.url && l.url !== '#' && l.url.trim() !== '');

  return (
    <footer style={{background:'rgba(10,14,26,0.97)',borderTop:'1px solid rgba(255,255,255,0.06)',padding:'24px 20px',marginTop:'40px',textAlign:'center'}}>
      {logoUrl && (
        <div style={{marginBottom:'16px'}}>
          <img src={logoUrl} alt="Plaza Las Américas" style={{height:'40px',objectFit:'contain'}} />
        </div>
      )}
      {links.length > 0 && (
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:'16px',flexWrap:'wrap',marginBottom:'12px'}}>
          {links.map(l=>(
            <a key={l.label} href={l.url} target="_blank" rel="noopener"
              style={{color: l.bold ? 'var(--gold)' : '#8899BB',textDecoration:'none',fontSize:'13px',fontWeight: l.bold ? 600 : 400}}>
              {l.label}
            </a>
          ))}
        </div>
      )}
      <p style={{fontSize:'11px',color:'#8899BB'}}>{c('footer_copyright')}</p>
    </footer>
  );
}

function LandingPage({setPage,c}) {
  return (
    <div>
      <div style={{background:'linear-gradient(160deg,#0A0E1A 0%,#1a1025 40%,#0d1a0a 100%)',padding:'48px 20px 64px',textAlign:'center'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(var(--gold-rgb,245,197,24),0.15)',border:'1px solid rgba(245,197,24,0.3)',borderRadius:'20px',padding:'4px 14px',fontSize:'11px',fontWeight:600,color:'var(--gold)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'20px'}}>{c('landing_badge')}</div>
        <h1 style={{fontWeight:900,fontSize:'clamp(40px,8vw,68px)',lineHeight:.95,letterSpacing:'-1px',textTransform:'uppercase',marginBottom:'12px'}}>
          {c('landing_title')}<br/>
          <span style={{color:'var(--gold)'}}>{c('landing_subtitle')}</span><br/>
          <span style={{fontSize:'clamp(18px,4vw,28px)',fontWeight:600,color:'#8899BB',letterSpacing:'2px'}}>{c('landing_tagline')}</span>
        </h1>
        <p style={{fontSize:'15px',color:'#8899BB',maxWidth:'480px',margin:'0 auto 32px',lineHeight:1.6}}>{c('landing_description')}</p>
        <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={()=>setPage('registro')} style={{background:'var(--gold)',color:'#0A0E1A',fontWeight:800,fontSize:'16px',letterSpacing:'1px',textTransform:'uppercase',border:'none',padding:'14px 36px',borderRadius:'8px',cursor:'pointer'}}>{c('landing_btn_primary')}</button>
          <button onClick={()=>setPage('predicciones')} style={{background:'transparent',color:'#F0F4FF',fontWeight:700,fontSize:'14px',letterSpacing:'1px',textTransform:'uppercase',border:'1px solid rgba(255,255,255,0.2)',padding:'12px 24px',borderRadius:'8px',cursor:'pointer'}}>{c('landing_btn_secondary')}</button>
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'center',gap:'32px',padding:'24px 20px',background:'rgba(255,255,255,0.02)',borderTop:'1px solid rgba(255,255,255,0.06)',flexWrap:'wrap'}}>
        {[[c('stat_matches'),c('stat_matches_label')],[c('stat_teams'),c('stat_teams_label')],[c('stat_free'),c('stat_free_label')],[c('stat_start'),c('stat_start_label')]].map(([n,l])=>(
          <div key={l} style={{textAlign:'center'}}>
            <div style={{fontWeight:800,fontSize:'28px',color:'var(--gold)',lineHeight:1}}>{n}</div>
            <div style={{fontSize:'11px',color:'#8899BB',textTransform:'uppercase',letterSpacing:'.5px',marginTop:'2px'}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{padding:'32px 20px'}}>
        <h2 style={{fontWeight:800,fontSize:'22px',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'4px'}}>Sistema de <span style={{color:'var(--gold)'}}>Puntos</span></h2>
        <p style={{fontSize:'13px',color:'#8899BB',marginBottom:'16px'}}>Máximo 5 puntos por partido</p>
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {[['⚡ Marcador exacto','5 pts','#F5C518'],['✅ Ganador o empate','3 pts','#3B82F6'],['📊 Diferencia de goles','2 pts','#F97316'],['🎯 Goles de un equipo','1 pt','#8899BB']].map(([label,pts,color])=>(
            <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#1E2535',borderRadius:'8px',padding:'12px 16px',border:'1px solid rgba(255,255,255,0.06)'}}>
              <span style={{fontSize:'14px'}}>{label}</span>
              <span style={{fontWeight:800,fontSize:'20px',color}}>{pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegistroPage({setPage,setUser,showToast,c}) {
  const [form,setForm] = useState({full_name:'',cedula:'',phone:'',email:'',city:'',birth_date:'',accepts_terms:false,accepts_marketing:false});
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!form.accepts_terms){setError('Debes aceptar los términos y condiciones');return;}
    if (!form.full_name||!form.cedula||!form.email||!form.phone||!form.city||!form.birth_date){setError('Por favor llena todos los campos');return;}
    setLoading(true);
    try {
      const {data:existing} = await supabase.from('users').select('id').eq('cedula',form.cedula).single();
      if (existing){setError('Esta cédula ya está registrada');setLoading(false);return;}
      const {data,error:err} = await supabase.from('users').insert([{...form,accepts_terms:true}]).select().single();
      if (err){setError(err.message);setLoading(false);return;}
      await supabase.from('leaderboard').insert([{user_id:data.id}]);
      setUser(data);
      showToast('¡Registro exitoso! Ahora haz tus predicciones','#22C55E');
      setPage('predicciones');
    } catch(e){setError('Error al registrar. Intenta de nuevo.');}
    setLoading(false);
  };

  return (
    <div style={{padding:'24px 20px',maxWidth:'600px',margin:'0 auto'}}>
      <h2 style={{fontWeight:800,fontSize:'22px',textTransform:'uppercase',marginBottom:'4px'}}>Registro <span style={{color:'var(--gold)'}}>Gratuito</span></h2>
      <p style={{fontSize:'13px',color:'#8899BB',marginBottom:'20px'}}>Únete al Reto Mundialista Plaza Las Américas 2026</p>
      <div style={{background:'#1E2535',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'20px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          {[['Nombre completo','full_name','text','Tu nombre completo'],['Cédula / Pasaporte','cedula','text','0123456789'],['Celular','phone','tel','0991234567'],['Email','email','email','correo@ejemplo.com'],['Ciudad','city','text','Guayaquil'],['Fecha de nacimiento','birth_date','date','']].map(([label,key,type,ph])=>(
            <div key={key}>
              <label style={{fontSize:'11px',fontWeight:600,color:'#8899BB',textTransform:'uppercase',letterSpacing:'.5px',display:'block',marginBottom:'5px'}}>{label}</label>
              <input type={type} placeholder={ph} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}
                style={{width:'100%',background:'#0A0E1A',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'10px 12px',color:'#F0F4FF',fontSize:'14px'}} />
            </div>
          ))}
        </div>
        <div style={{marginTop:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
          {[['accepts_terms',`Acepto los <a href="${c('link_terms')||'#'}" style="color:#F5C518">términos y condiciones</a> del Reto Mundialista Plaza Las Américas`],['accepts_marketing','Acepto recibir comunicaciones comerciales y promociones de Plaza Las Américas']].map(([key,label])=>(
            <label key={key} style={{display:'flex',alignItems:'flex-start',gap:'10px',cursor:'pointer'}}>
              <input type="checkbox" checked={form[key]} onChange={e=>setForm({...form,[key]:e.target.checked})} style={{marginTop:'2px',accentColor:'#F5C518',width:'16px',height:'16px',flexShrink:0}} />
              <span style={{fontSize:'12px',color:'#8899BB',lineHeight:1.5}} dangerouslySetInnerHTML={{__html:label}} />
            </label>
          ))}
        </div>
        {error && <div style={{marginTop:'12px',background:'rgba(230,57,70,0.1)',border:'1px solid rgba(230,57,70,0.3)',borderRadius:'8px',padding:'10px 12px',fontSize:'13px',color:'#FF6B7A'}}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{width:'100%',marginTop:'18px',background:loading?'#8899BB':'#F5C518',color:'#0A0E1A',fontWeight:800,fontSize:'16px',letterSpacing:'1px',textTransform:'uppercase',border:'none',padding:'14px',borderRadius:'8px',cursor:loading?'not-allowed':'pointer'}}>
          {loading?'Registrando...':'Registrarme y hacer mis predicciones →'}
        </button>
      </div>
    </div>
  );
}

function computeBracket(matches, scores) {
  const standings = {};
  matches.filter(m => m.phase === 'grupos').forEach(m => {
    const g = m.group_name;
    if (!standings[g]) standings[g] = {};
    if (!standings[g][m.team_a]) standings[g][m.team_a] = {name:m.team_a, code:m.team_a_code, pts:0, gf:0, ga:0, gd:0};
    if (!standings[g][m.team_b]) standings[g][m.team_b] = {name:m.team_b, code:m.team_b_code, pts:0, gf:0, ga:0, gd:0};
    const sa = parseInt(scores[m.id+'_a'] ?? 0), sb = parseInt(scores[m.id+'_b'] ?? 0);
    standings[g][m.team_a].gf+=sa; standings[g][m.team_a].ga+=sb; standings[g][m.team_a].gd+=sa-sb;
    standings[g][m.team_b].gf+=sb; standings[g][m.team_b].ga+=sa; standings[g][m.team_b].gd+=sb-sa;
    if (sa>sb) standings[g][m.team_a].pts+=3;
    else if (sa===sb) { standings[g][m.team_a].pts+=1; standings[g][m.team_b].pts+=1; }
    else standings[g][m.team_b].pts+=3;
  });
  const sorted = {};
  Object.entries(standings).forEach(([g,teams]) => {
    sorted[g] = Object.values(teams).sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf || a.name.localeCompare(b.name));
  });
  const b = {};
  const letters = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  letters.forEach(l => {
    const t = sorted[`Grupo ${l}`] || [];
    b[`TBD-1${l}`] = t[0]?.name || `1° Grupo ${l}`;
    b[`TBD-2${l}`] = t[1]?.name || `2° Grupo ${l}`;
  });
  const thirds = letters
    .map(l => sorted[`Grupo ${l}`]?.[2] || {name:`3° Grupo ${l}`, pts:0, gd:0, gf:0})
    .sort((a,bv) => bv.pts-a.pts || bv.gd-a.gd || bv.gf-a.gf);
  thirds.slice(0,8).forEach((t,i) => { b[`TBD-W${i+1}`] = t.name || `Mejor 3° #${i+1}`; });
  const propagate = (phase, prefix) => {
    matches.filter(m => m.phase===phase).sort((a,bv) => a.match_number-bv.match_number).forEach((m,i) => {
      const tA=b[m.team_a]||m.team_a, tB=b[m.team_b]||m.team_b;
      const sa=parseInt(scores[m.id+'_a']??-1), sb=parseInt(scores[m.id+'_b']??-1);
      b[`${prefix}W${i+1}`] = sa>sb?tA : sb>sa?tB : `Ganador partido ${m.match_number}`;
      b[`${prefix}L${i+1}`] = sa>sb?tB : sb>sa?tA : `Perdedor partido ${m.match_number}`;
    });
  };
  propagate('round_of_32','TBD-R32-');
  propagate('round_of_16','TBD-R16-');
  propagate('quarterfinals','TBD-QF-');
  propagate('semifinals','TBD-SF-');
  return b;
}

const PHASE_PREV = {
  round_of_32:'Fase de Grupos', round_of_16:'Ronda de 32',
  quarterfinals:'Octavos de final', semifinals:'Cuartos de final',
  third_place:'Semifinales', final:'Semifinales'
};

function PrediccionesPage({user,showToast,c}) {
  const [matches,setMatches] = useState([]);
  const [scores,setScores] = useState({});
  const [phase,setPhase] = useState('grupos');
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);

  useEffect(()=>{
    const load = async () => {
      const {data:matchData} = await supabase.from('matches').select('*').order('match_number',{ascending:true});
      setMatches(matchData||[]);
      if (user) {
        const {data:predData} = await supabase.from('predictions').select('*').eq('user_id',user.id);
        if (predData?.length) {
          const loaded = {};
          predData.forEach(p => {
            loaded[p.match_id+'_a'] = String(p.predicted_score_a);
            loaded[p.match_id+'_b'] = String(p.predicted_score_b);
          });
          setScores(loaded);
        }
      }
      setLoading(false);
    };
    load();
  },[user]);

  const phases=['grupos','round_of_32','round_of_16','quarterfinals','semifinals','third_place','final'];
  const filtered=matches.filter(m=>m.phase===phase);
  const bracket=computeBracket(matches,scores);
  const getTeam=name=>bracket[name]||name;

  const savePredictions = async () => {
    if (!user){showToast('Regístrate primero para guardar tus predicciones','#FF6B7A');return;}
    const missing=filtered.filter(m=>scores[m.id+'_a']===undefined||scores[m.id+'_a']===''||scores[m.id+'_b']===undefined||scores[m.id+'_b']==='');
    if (missing.length>0){showToast(`❌ Faltan ${missing.length} partido(s) sin predicción en esta fase. Completa todos antes de guardar.`,'#FF6B7A');return;}
    setSaving(true);
    const rows=filtered.map(m=>({
      user_id:user.id,match_id:m.id,
      predicted_score_a:parseInt(scores[m.id+'_a']??0),
      predicted_score_b:parseInt(scores[m.id+'_b']??0)
    }));
    const {error}=await supabase.from('predictions').upsert(rows,{onConflict:'user_id,match_id'});
    if (error){showToast('No se pudieron guardar. Intenta de nuevo.','#FF6B7A');setSaving(false);return;}
    const faltantes=phases.filter(p=>{
      const pm=matches.filter(m=>m.phase===p);
      if(!pm.length)return false;
      return pm.some(m=>scores[m.id+'_a']===undefined||scores[m.id+'_a']==='');
    }).filter(p=>p!==phase).map(p=>PHASE_LABELS[p]);
    if(faltantes.length>0){
      showToast(`✅ ${PHASE_LABELS[phase]} guardada. Faltan por completar: ${faltantes.join(', ')}`, '#F5C518');
    } else {
      showToast(`✅ ¡Todas las fases completas! ${rows.length} predicciones guardadas.`,'#22C55E');
    }
    setSaving(false);
  };

  return (
    <div style={{padding:'20px',maxWidth:'900px',margin:'0 auto'}}>
      <h2 style={{fontWeight:800,fontSize:'22px',textTransform:'uppercase',marginBottom:'4px'}}>Mis <span style={{color:'var(--gold)'}}>Predicciones</span></h2>
      <p style={{fontSize:'13px',color:'#8899BB',marginBottom:'14px'}}>Llena todas las fases antes del 10 de junio · Los equipos de eliminatorias se calculan según tus predicciones de grupos</p>
      <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px',marginBottom:'16px'}}>
        {phases.map(p=>{
          const pm=matches.filter(m=>m.phase===p);
          const filled=pm.filter(m=>scores[m.id+'_a']!==undefined&&scores[m.id+'_a']!=='').length;
          const complete=pm.length>0&&filled===pm.length;
          return (
            <button key={p} onClick={()=>setPhase(p)} style={{background:phase===p?'rgba(245,197,24,0.15)':'#1C2333',border:`1px solid ${phase===p?'rgba(245,197,24,0.3)':'rgba(255,255,255,0.08)'}`,borderRadius:'6px',padding:'6px 12px',fontSize:'11px',fontWeight:600,color:phase===p?'#F5C518':complete?'#22C55E':'#8899BB',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,textTransform:'uppercase',letterSpacing:'.5px'}}>
              {complete?'✅ ':''}{PHASE_LABELS[p]}
            </button>
          );
        })}
      </div>
      {phase !== 'grupos' && (
        <div style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.25)',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px',fontSize:'12px',color:'#93C5FD'}}>
          ℹ️ Los equipos de esta fase se calculan automáticamente según tus predicciones de la <strong>{PHASE_PREV[phase]}</strong>. Completa las fases en orden y guarda cada una.
        </div>
      )}
      {loading?(
        <div style={{textAlign:'center',padding:'40px',color:'#8899BB'}}>Cargando partidos...</div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {filtered.map(m=>{
            const teamA=getTeam(m.team_a), teamB=getTeam(m.team_b);
            const hasA=scores[m.id+'_a']!==undefined&&scores[m.id+'_a']!=='';
            const hasB=scores[m.id+'_b']!==undefined&&scores[m.id+'_b']!=='';
            return (
              <div key={m.id} style={{background:'#1E2535',border:`1px solid ${(!hasA||!hasB)?'rgba(255,107,122,0.35)':'rgba(255,255,255,0.07)'}`,borderRadius:'10px',padding:'12px 14px',display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                <span style={{background:PHASE_COLORS[m.phase]||'rgba(245,197,24,0.1)',border:`1px solid ${PHASE_TEXT[m.phase]||'#F5C518'}40`,borderRadius:'4px',padding:'2px 7px',fontSize:'10px',fontWeight:600,color:PHASE_TEXT[m.phase]||'#F5C518',whiteSpace:'nowrap'}}>
                  {m.group_name||PHASE_LABELS[m.phase]}
                </span>
                <div style={{flex:1,display:'flex',alignItems:'center',gap:'6px',minWidth:'140px'}}>
                  <FlagImg code={m.team_a_code} name={teamA} />
                  <span style={{fontWeight:700,fontSize:'13px'}}>{teamA}</span>
                  <span style={{color:'#8899BB',fontSize:'11px'}}>vs</span>
                  <FlagImg code={m.team_b_code} name={teamB} />
                  <span style={{fontWeight:700,fontSize:'13px'}}>{teamB}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                  <input type="number" min="0" max="20" placeholder="?" value={scores[m.id+'_a']??''} onChange={e=>setScores(prev=>({...prev,[m.id+'_a']:e.target.value}))}
                    style={{width:'36px',height:'36px',background:'#1C2333',border:`1px solid ${hasA?'rgba(255,255,255,0.12)':'rgba(255,107,122,0.5)'}`,borderRadius:'6px',color:'#F0F4FF',fontWeight:700,fontSize:'16px',textAlign:'center'}} />
                  <span style={{color:'#8899BB',fontWeight:700}}>-</span>
                  <input type="number" min="0" max="20" placeholder="?" value={scores[m.id+'_b']??''} onChange={e=>setScores(prev=>({...prev,[m.id+'_b']:e.target.value}))}
                    style={{width:'36px',height:'36px',background:'#1C2333',border:`1px solid ${hasB?'rgba(255,255,255,0.12)':'rgba(255,107,122,0.5)'}`,borderRadius:'6px',color:'#F0F4FF',fontWeight:700,fontSize:'16px',textAlign:'center'}} />
                </div>
                <div style={{fontSize:'11px',color:'#8899BB',textAlign:'right',minWidth:'65px'}}>
                  <div>{new Date(m.scheduled_at).toLocaleDateString('es-EC',{month:'short',day:'numeric',timeZone:'America/Guayaquil'})}</div>
                  <div>{new Date(m.scheduled_at).toLocaleTimeString('es-EC',{hour:'2-digit',minute:'2-digit',timeZone:'America/Guayaquil',hour12:true})}</div>
                </div>
              </div>
            );
          })}
          {filtered.length===0&&<div style={{textAlign:'center',padding:'40px',color:'#8899BB'}}>No hay partidos en esta fase aún</div>}
        </div>
      )}
      <button onClick={savePredictions} disabled={saving} style={{width:'100%',marginTop:'16px',background:saving?'#8899BB':'#F5C518',color:'#0A0E1A',fontWeight:800,fontSize:'16px',letterSpacing:'1px',textTransform:'uppercase',border:'none',padding:'14px',borderRadius:'8px',cursor:saving?'not-allowed':'pointer'}}>
        {saving?'Guardando...':'💾 Guardar Predicciones'}
      </button>
      <p style={{textAlign:'center',fontSize:'11px',color:'#8899BB',marginTop:'8px'}}>{c('predictions_lock_notice')}</p>
    </div>
  );
}

function DashboardPage({user}) {
  const [stats,setStats] = useState(null);
  useEffect(()=>{
    if (!user) return;
    supabase.from('leaderboard').select('*').eq('user_id',user.id).single().then(({data})=>setStats(data));
  },[user]);

  if (!user) return (
    <div style={{padding:'60px 20px',textAlign:'center'}}>
      <div style={{fontSize:'48px',marginBottom:'16px'}}>👤</div>
      <h2 style={{fontWeight:800,fontSize:'24px',color:'var(--gold)',marginBottom:'8px'}}>REGÍSTRATE PRIMERO</h2>
      <p style={{color:'#8899BB'}}>Necesitas una cuenta para ver tu dashboard</p>
    </div>
  );

  return (
    <div style={{padding:'24px 20px',maxWidth:'600px',margin:'0 auto'}}>
      <h2 style={{fontWeight:800,fontSize:'22px',textTransform:'uppercase',marginBottom:'16px'}}>Mi <span style={{color:'var(--gold)'}}>Dashboard</span></h2>
      <div style={{background:'#1C2333',border:'1px solid rgba(245,197,24,0.15)',borderRadius:'14px',padding:'20px',marginBottom:'16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:'12px',color:'#8899BB',textTransform:'uppercase',letterSpacing:'.5px'}}>Posición Global</div>
            <div style={{fontWeight:900,fontSize:'42px',color:'var(--gold)',lineHeight:1}}>#{stats?.global_rank||'—'}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'12px',color:'#8899BB'}}>Puntos</div>
            <div style={{fontWeight:900,fontSize:'52px',color:'#F0F4FF',lineHeight:1}}>{stats?.total_points||0}</div>
          </div>
        </div>
        <div style={{marginTop:'12px',fontSize:'13px',color:'#8899BB'}}>Bienvenido, <strong style={{color:'var(--gold)'}}>{user.full_name}</strong></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
        {[['Exactos','exact_scores','#F5C518'],['Acertados','correct_results','#22C55E'],['Predicciones','total_predictions','#3B82F6'],['% Aciertos','accuracy_pct','#F97316']].map(([l,k,col])=>(
          <div key={k} style={{background:'#0A0E1A',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px',padding:'12px',textAlign:'center'}}>
            <div style={{fontWeight:800,fontSize:'24px',color:col}}>{stats?.[k]??'0'}{k==='accuracy_pct'?'%':''}</div>
            <div style={{fontSize:'11px',color:'#8899BB',marginTop:'2px'}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingPage() {
  const [ranking,setRanking] = useState([]);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{
    supabase.from('v_leaderboard').select('*').limit(50).then(({data})=>{setRanking(data||[]);setLoading(false);});
  },[]);

  return (
    <div style={{padding:'24px 20px',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontWeight:800,fontSize:'22px',textTransform:'uppercase',marginBottom:'16px'}}>Ranking <span style={{color:'var(--gold)'}}>Global</span></h2>
      {loading?<div style={{textAlign:'center',padding:'40px',color:'#8899BB'}}>Cargando ranking...</div>:(
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {ranking.length===0&&<div style={{textAlign:'center',padding:'40px',color:'#8899BB'}}>El ranking se activará cuando comiencen los partidos</div>}
          {ranking.map((r,i)=>(
            <div key={r.user_id} style={{display:'flex',alignItems:'center',gap:'12px',background:'#1E2535',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px',padding:'10px 14px'}}>
              <span style={{fontWeight:800,fontSize:'20px',color:i<3?'#F5C518':'#8899BB',width:'28px',textAlign:'center',flexShrink:0}}>{r.global_rank}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:'14px',fontWeight:500}}>{r.full_name}</div>
                <div style={{fontSize:'11px',color:'#8899BB'}}>{r.city}</div>
              </div>
              <span style={{fontSize:'11px',fontWeight:600,color:r.rank_change>0?'#22C55E':r.rank_change<0?'#E63946':'#8899BB'}}>
                {r.rank_change>0?`▲${r.rank_change}`:r.rank_change<0?`▼${Math.abs(r.rank_change)}`:'—'}
              </span>
              <span style={{fontWeight:700,fontSize:'18px',color:'var(--gold)'}}>{r.total_points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PromosPage({c}) {
  const [promos,setPromos] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    supabase.from('promotions').select('*').eq('is_active',true).order('sort_order',{ascending:true})
      .then(({data})=>{setPromos(data||[]);setLoading(false);});
  },[]);

  return (
    <div style={{padding:'24px 20px',maxWidth:'900px',margin:'0 auto'}}>
      <h2 style={{fontWeight:800,fontSize:'22px',textTransform:'uppercase',marginBottom:'4px'}}>Plaza Las <span style={{color:'var(--gold)'}}>Américas</span></h2>
      <p style={{fontSize:'13px',color:'#8899BB',marginBottom:'16px'}}>Promociones mundialistas exclusivas para participantes</p>
      <div style={{background:'linear-gradient(135deg,rgba(245,197,24,0.08),rgba(249,115,22,0.05))',border:'1px solid rgba(245,197,24,0.2)',borderRadius:'12px',padding:'16px',marginBottom:'16px',textAlign:'center'}}>
        <div style={{fontSize:'11px',color:'var(--gold)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'4px'}}>🎉 Evento especial</div>
        <div style={{fontWeight:800,fontSize:'18px',marginBottom:'4px'}}>{c('event_title')}</div>
        <div style={{fontSize:'12px',color:'#8899BB'}}>{c('event_description')}</div>
        <div style={{marginTop:'8px',display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(34,197,94,0.12)',borderRadius:'6px',padding:'4px 12px',fontSize:'12px',color:'#22C55E',fontWeight:600}}>{c('event_schedule')}</div>
      </div>
      {loading?<div style={{textAlign:'center',padding:'20px',color:'#8899BB'}}>Cargando promociones...</div>:(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'10px'}}>
          {promos.map(p=>(
            <div key={p.id} style={{background:'#1E2535',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'10px',overflow:'hidden',cursor:'pointer',transition:'transform .2s'}}
              onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.title} style={{width:'100%',height:'80px',objectFit:'cover'}} />
              ) : (
                <div style={{height:'80px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'36px',background:'rgba(255,255,255,0.03)'}}>{p.emoji||'🏆'}</div>
              )}
              <div style={{padding:'10px'}}>
                <div style={{fontSize:'10px',color:'var(--gold)',fontWeight:600,textTransform:'uppercase'}}>{p.store_name}</div>
                <div style={{fontSize:'13px',fontWeight:600,marginTop:'2px'}}>{p.title}</div>
                <div style={{fontSize:'11px',color:'#8899BB',marginTop:'3px'}}>{p.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
