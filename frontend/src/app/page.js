'use client';
import { useState, useEffect, useMemo } from 'react';
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
  promos_title:'Plaza Las Américas',
  promos_subtitle:'Promociones mundialistas exclusivas para participantes',
  event_badge:'🎉 Evento especial',
  event_title:'ZONA MUNDIAL · Plaza Las Américas',
  event_description:'Pantallas gigantes · Activaciones · Sorteos en vivo',
  event_schedule:'📅 Todos los días del Mundial · 16h00 - 22h00',
  color_primary:'#F5C518',color_background:'#0A0E1A',color_text:'#F0F4FF',
  color_card:'#1E2535',color_muted:'#8899BB',
  background_type:'solid',background_value:'',background_overlay:'50',
  nav_logo_word1:'Reto',nav_logo_word2:'Mundial',
  nav_tab_inicio:'Inicio',nav_tab_predicciones:'Predicciones',nav_tab_dashboard:'Mi Reto',nav_tab_ranking:'Ranking',nav_tab_promos:'Plaza',
  link_terms:'#',link_instagram:'#',link_whatsapp:'#',link_website:'https://www.plazalasamericas.ec',
  footer_link_website_label:'🌐 Plaza Las Américas',
  footer_link_instagram_label:'📸 Instagram',
  footer_link_whatsapp_label:'💬 WhatsApp',
  footer_link_terms_label:'📄 Términos y Condiciones',
  footer_copyright:'© 2026 Reto Mundialista · Plaza Las Américas · Participación 100% gratuita',
  register_check_terms:'Acepto los <a href="#" style="color:var(--gold)">términos y condiciones</a> del Reto Mundialista Plaza Las Américas',
  register_check_marketing:'Acepto recibir comunicaciones comerciales y promociones de Plaza Las Américas',
  register_title:'Registro',
  register_title_highlight:'Gratuito',
  register_subtitle:'Únete al Reto Mundialista Plaza Las Américas 2026',
  register_btn_submit:'Registrarme y hacer mis predicciones →',
  register_btn_loading:'Registrando...',
  register_login_prompt:'¿Ya tienes cuenta?',
  register_login_link:'Iniciar sesión',
};

function hexToRgb(hex) {
  const h = hex.replace('#','');
  return `${parseInt(h.substring(0,2),16)},${parseInt(h.substring(2,4),16)},${parseInt(h.substring(4,6),16)}`;
}

function useContent() {
  const [content,setContent] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('reto_cms');
        if (cached) return {...DEFAULT_CONTENT, ...JSON.parse(cached)};
      } catch(e) {}
    }
    return DEFAULT_CONTENT;
  });
  useEffect(() => {
    supabase.from('app_content').select('key,value')
      .then(({data}) => {
        if (data?.length) {
          const obj={};
          data.forEach(r=>{obj[r.key]=r.value;});
          setContent(prev=>({...prev,...obj}));
          try { localStorage.setItem('reto_cms', JSON.stringify(obj)); } catch(e) {}
          const root = document.documentElement;
          const cm = obj;
          if (cm.color_primary) {
            root.style.setProperty('--gold', cm.color_primary);
            root.style.setProperty('--gold2', cm.color_primary);
            root.style.setProperty('--gold-rgb', hexToRgb(cm.color_primary));
          }
          if (cm.color_background) {
            root.style.setProperty('--dark', cm.color_background);
            root.style.setProperty('--dark2', cm.color_background);
            root.style.setProperty('--dark-rgb', hexToRgb(cm.color_background));
          }
          if (cm.color_card) {
            root.style.setProperty('--card', cm.color_card);
            root.style.setProperty('--dark3', cm.color_card);
          }
          if (cm.color_text) root.style.setProperty('--text', cm.color_text);
          if (cm.color_muted) root.style.setProperty('--muted', cm.color_muted);
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

  useEffect(()=>{
    supabase.auth.getSession().then(async ({data:{session}})=>{
      if (session) {
        const {data} = await supabase.from('users').select('*').eq('id',session.user.id).single();
        if (data) setUser(data);
      }
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((event)=>{
      if (event==='SIGNED_OUT') setUser(null);
    });
    return ()=>subscription.unsubscribe();
  },[]);

  const showToast = (msg,color='var(--gold)') => {
    setToast({msg,color});
    setTimeout(()=>setToast(null),3000);
  };

  const c = (key) => content[key] ?? DEFAULT_CONTENT[key] ?? '';

  const bgType = content.background_type || 'solid';
  const bgValue = content.background_value || '';
  const bgOverlay = Math.min(90, Math.max(0, parseInt(content.background_overlay || '50')));

  const mainBgStyle = bgType === 'gradient' && bgValue
    ? { background: bgValue }
    : bgType === 'image' && bgValue
      ? { background: 'transparent' }
      : { background: 'var(--dark)' };

  return (
    <div style={{minHeight:'100vh',color:'var(--text)',fontFamily:'sans-serif',position:'relative',...mainBgStyle}}>
      {bgType === 'image' && bgValue && <>
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundImage:`url(${bgValue})`,backgroundSize:'cover',backgroundPosition:'center',zIndex:-2}} />
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:`rgba(var(--dark-rgb,10,14,26),${bgOverlay/100})`,zIndex:-1}} />
      </>}
      <Nav page={page} setPage={setPage} user={user} setUser={setUser} c={c} />
      {toast && (
        <div style={{position:'fixed',top:'65px',right:'16px',zIndex:999,background:'var(--card2)',border:`1px solid ${toast.color}`,borderRadius:'10px',padding:'12px 16px',fontSize:'13px',fontWeight:500,display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 20px rgba(0,0,0,0.4)',maxWidth:'280px'}}>
          <span style={{color:toast.color,fontSize:'18px'}}>✓</span><span>{toast.msg}</span>
        </div>
      )}
      <style>{`
  :root {
    --gold: #F5C518;
    --gold2: #E8A800;
    --gold-rgb: 245,197,24;
    --dark: #0A0E1A;
    --dark-rgb: 10,14,26;
    --dark2: #111827;
    --dark3: #1C2333;
    --text: #F0F4FF;
    --muted: #8899BB;
    --green: #22C55E;
    --blue: #3B82F6;
    --orange: #F97316;
    --card: #1E2535;
    --card2: #242B3D;
    --red: #E63946;
    --red-light: #FF6B7A;
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
      {page==='landing' && <LandingPage setPage={setPage} c={c} bgType={bgType} user={user} />}
      {page==='login' && <LoginPage setPage={setPage} setUser={setUser} showToast={showToast} c={c} />}
      {page==='registro' && <RegistroPage setPage={setPage} setUser={setUser} showToast={showToast} c={c} />}
      {page==='predicciones' && <PrediccionesPage user={user} showToast={showToast} c={c} />}
      {page==='dashboard' && <DashboardPage user={user} setPage={setPage} c={c} />}
      {page==='ranking' && <RankingPage c={c} />}
      {page==='promos' && <PromosPage c={c} />}
      <Footer c={c} />
    </div>
  );
}

function Nav({page,setPage,user,setUser,c}) {
  const tabs=[{id:'landing',label:c('nav_tab_inicio')},{id:'predicciones',label:c('nav_tab_predicciones')},{id:'dashboard',label:c('nav_tab_dashboard')},{id:'ranking',label:c('nav_tab_ranking')},{id:'promos',label:c('nav_tab_promos')}];
  const logoUrl = c('logo_url');
  const websiteLink = c('link_website') || 'https://www.plazalasamericas.ec';
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage('landing');
  };
  return (
    <nav style={{background:'rgba(var(--dark-rgb,10,14,26),0.97)',backdropFilter:'blur(12px)',padding:'0 12px',display:'flex',alignItems:'center',justifyContent:'space-between',height:'56px',borderBottom:'1px solid rgba(var(--gold-rgb,245,197,24),0.2)',position:'sticky',top:0,zIndex:100}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',flexShrink:0}} onClick={()=>setPage('landing')}>
        <span style={{fontWeight:900,fontSize:'18px',color:'var(--gold)',textTransform:'uppercase',letterSpacing:'1px'}}>
          {c('nav_logo_word1')} <span style={{color:'var(--text)'}}>{c('nav_logo_word2')}</span>
        </span>
      </div>
      <div style={{display:'flex',gap:'2px',overflowX:'auto',flex:1,justifyContent:'center',padding:'0 8px'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setPage(t.id)} style={{background:page===t.id?'rgba(var(--gold-rgb,245,197,24),0.12)':'none',border:'none',color:page===t.id?'var(--gold)':'var(--muted)',fontSize:'12px',fontWeight:500,padding:'6px 10px',borderRadius:'6px',cursor:'pointer',textTransform:'uppercase',letterSpacing:'.5px',whiteSpace:'nowrap'}}>{t.label}</button>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
        {user ? (
          <>
            <span style={{fontSize:'12px',fontWeight:600,color:'var(--gold)',maxWidth:'80px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer'}} onClick={()=>setPage('dashboard')}>{user.full_name.split(' ')[0]}</span>
            <button onClick={handleLogout} style={{background:'none',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'6px',padding:'4px 8px',fontSize:'11px',color:'var(--muted)',cursor:'pointer',whiteSpace:'nowrap'}}>Salir</button>
          </>
        ) : (
          <button onClick={()=>setPage('login')} style={{background:'rgba(var(--gold-rgb,245,197,24),0.1)',border:'1px solid rgba(var(--gold-rgb,245,197,24),0.3)',borderRadius:'6px',padding:'5px 10px',fontSize:'11px',fontWeight:600,color:'var(--gold)',cursor:'pointer',whiteSpace:'nowrap'}}>🔑 Entrar</button>
        )}
        <a href={websiteLink} target="_blank" rel="noopener" style={{display:'flex',alignItems:'center',background:'rgba(var(--gold-rgb,245,197,24),0.1)',border:'1px solid rgba(var(--gold-rgb,245,197,24),0.2)',borderRadius:'6px',padding:'5px 8px',textDecoration:'none'}}>
          {logoUrl ? (
            <img src={logoUrl} alt="Plaza" style={{height:'26px',objectFit:'contain'}} />
          ) : (
            <span style={{fontSize:'11px',fontWeight:600,color:'var(--gold)'}}>🏬</span>
          )}
        </a>
      </div>
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
    <footer style={{background:'rgba(var(--dark-rgb,10,14,26),0.97)',borderTop:'1px solid rgba(255,255,255,0.06)',padding:'24px 20px',marginTop:'40px',textAlign:'center'}}>
      {logoUrl && (
        <div style={{marginBottom:'16px'}}>
          <img src={logoUrl} alt="Plaza Las Américas" style={{height:'40px',objectFit:'contain'}} />
        </div>
      )}
      {links.length > 0 && (
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:'16px',flexWrap:'wrap',marginBottom:'12px'}}>
          {links.map(l=>(
            <a key={l.label} href={l.url} target="_blank" rel="noopener"
              style={{color: l.bold ? 'var(--gold)' : 'var(--muted)',textDecoration:'none',fontSize:'13px',fontWeight: l.bold ? 600 : 400}}>
              {l.label}
            </a>
          ))}
        </div>
      )}
      <p style={{fontSize:'11px',color:'var(--muted)'}}>{c('footer_copyright')}</p>
    </footer>
  );
}

function WelcomePanel({user,setPage}) {
  const [stats,setStats] = useState(null);
  useEffect(()=>{
    const fetchStats = () => {
      supabase.from('leaderboard').select('total_points,global_rank').eq('user_id',user.id).single()
        .then(({data})=>setStats(data));
    };
    fetchStats();
    const channel = supabase.channel(`welcome-${user.id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'leaderboard',filter:`user_id=eq.${user.id}`},fetchStats)
      .subscribe();
    return ()=>{ supabase.removeChannel(channel); };
  },[user.id]);
  const firstName = user.full_name.split(' ')[0];
  return (
    <div style={{padding:'32px 20px 40px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{background:'linear-gradient(135deg,var(--card) 0%,var(--dark3) 100%)',border:'1px solid rgba(var(--gold-rgb,245,197,24),0.25)',borderRadius:'16px',padding:'28px 24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
          <div style={{width:'42px',height:'42px',borderRadius:'50%',background:'rgba(var(--gold-rgb,245,197,24),0.15)',border:'1px solid rgba(var(--gold-rgb,245,197,24),0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',flexShrink:0}}>⚽</div>
          <div>
            <div style={{fontSize:'13px',color:'var(--muted)'}}>Bienvenido de vuelta</div>
            <div style={{fontWeight:800,fontSize:'20px',color:'var(--gold)',textTransform:'uppercase',letterSpacing:'1px'}}>{firstName}</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'20px'}}>
          <div style={{background:'rgba(var(--dark-rgb,10,14,26),0.5)',borderRadius:'10px',padding:'14px',textAlign:'center'}}>
            <div style={{fontSize:'11px',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'4px'}}>Posición global</div>
            <div style={{fontWeight:900,fontSize:'32px',color:'var(--gold)',lineHeight:1}}>#{stats?.global_rank||'—'}</div>
          </div>
          <div style={{background:'rgba(var(--dark-rgb,10,14,26),0.5)',borderRadius:'10px',padding:'14px',textAlign:'center'}}>
            <div style={{fontSize:'11px',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'4px'}}>Puntos</div>
            <div style={{fontWeight:900,fontSize:'32px',color:'var(--text)',lineHeight:1}}>{stats?.total_points||0}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={()=>setPage('predicciones')} style={{flex:1,background:'var(--gold)',color:'var(--dark)',fontWeight:800,fontSize:'14px',letterSpacing:'1px',textTransform:'uppercase',border:'none',padding:'13px',borderRadius:'8px',cursor:'pointer'}}>Mis Predicciones</button>
          <button onClick={()=>setPage('dashboard')} style={{flex:1,background:'transparent',color:'var(--text)',fontWeight:700,fontSize:'14px',letterSpacing:'1px',textTransform:'uppercase',border:'1px solid rgba(255,255,255,0.2)',padding:'11px',borderRadius:'8px',cursor:'pointer'}}>Mi Reto</button>
        </div>
      </div>
    </div>
  );
}

function LandingPage({setPage,c,bgType,user}) {
  const heroBg = bgType === 'image'
    ? 'rgba(var(--dark-rgb,10,14,26),0.55)'
    : bgType === 'gradient'
      ? 'transparent'
      : 'linear-gradient(160deg,var(--dark) 0%,var(--dark3) 40%,var(--dark) 100%)';
  return (
    <div>
      {user ? (
        <WelcomePanel user={user} setPage={setPage} />
      ) : (
      <div style={{background:heroBg,padding:'48px 20px 64px',textAlign:'center'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(var(--gold-rgb,245,197,24),0.15)',border:'1px solid rgba(var(--gold-rgb,245,197,24),0.3)',borderRadius:'20px',padding:'4px 14px',fontSize:'11px',fontWeight:600,color:'var(--gold)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'20px'}}>{c('landing_badge')}</div>
        <h1 style={{fontWeight:900,fontSize:'clamp(40px,8vw,68px)',lineHeight:.95,letterSpacing:'-1px',textTransform:'uppercase',marginBottom:'12px'}}>
          {c('landing_title')}<br/>
          <span style={{color:'var(--gold)'}}>{c('landing_subtitle')}</span><br/>
          <span style={{fontSize:'clamp(18px,4vw,28px)',fontWeight:600,color:'var(--muted)',letterSpacing:'2px'}}>{c('landing_tagline')}</span>
        </h1>
        <p style={{fontSize:'15px',color:'var(--muted)',maxWidth:'480px',margin:'0 auto 32px',lineHeight:1.6}}>{c('landing_description')}</p>
        <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={()=>setPage('registro')} style={{background:'var(--gold)',color:'var(--dark)',fontWeight:800,fontSize:'16px',letterSpacing:'1px',textTransform:'uppercase',border:'none',padding:'14px 36px',borderRadius:'8px',cursor:'pointer'}}>{c('landing_btn_primary')}</button>
          <button onClick={()=>setPage('predicciones')} style={{background:'transparent',color:'var(--text)',fontWeight:700,fontSize:'14px',letterSpacing:'1px',textTransform:'uppercase',border:'1px solid rgba(255,255,255,0.2)',padding:'12px 24px',borderRadius:'8px',cursor:'pointer'}}>{c('landing_btn_secondary')}</button>
        </div>
      </div>
      )}
      <div style={{display:'flex',justifyContent:'center',gap:'32px',padding:'24px 20px',background:'rgba(255,255,255,0.02)',borderTop:'1px solid rgba(255,255,255,0.06)',flexWrap:'wrap'}}>
        {[[c('stat_matches'),c('stat_matches_label')],[c('stat_teams'),c('stat_teams_label')],[c('stat_free'),c('stat_free_label')],[c('stat_start'),c('stat_start_label')]].map(([n,l])=>(
          <div key={l} style={{textAlign:'center'}}>
            <div style={{fontWeight:800,fontSize:'28px',color:'var(--gold)',lineHeight:1}}>{n}</div>
            <div style={{fontSize:'11px',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',marginTop:'2px'}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{padding:'32px 20px'}}>
        <h2 style={{fontWeight:800,fontSize:'22px',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'4px'}}>Sistema de <span style={{color:'var(--gold)'}}>Puntos</span></h2>
        <p style={{fontSize:'13px',color:'var(--muted)',marginBottom:'16px'}}>Máximo 5 puntos por partido</p>
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {[['⚡ Marcador exacto','5 pts','var(--gold)'],['✅ Ganador o empate','3 pts','var(--blue)'],['📊 Diferencia de goles','2 pts','var(--orange)'],['🎯 Goles de un equipo','1 pt','var(--muted)']].map(([label,pts,color])=>(
            <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--card)',borderRadius:'8px',padding:'12px 16px',border:'1px solid rgba(255,255,255,0.06)'}}>
              <span style={{fontSize:'14px'}}>{label}</span>
              <span style={{fontWeight:800,fontSize:'20px',color}}>{pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginPage({setPage,setUser,showToast,c}) {
  const [form,setForm] = useState({email:'',password:''});
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!form.email||!form.password){setError('Por favor ingresa email y contraseña');return;}
    setLoading(true);
    const {error:authErr} = await supabase.auth.signInWithPassword({email:form.email,password:form.password});
    if (authErr){setError('Email o contraseña incorrectos');setLoading(false);return;}
    const {data:{session}} = await supabase.auth.getSession();
    if (session) {
      const {data} = await supabase.from('users').select('*').eq('id',session.user.id).single();
      if (data){setUser(data);showToast(`¡Bienvenido, ${data.full_name.split(' ')[0]}!`,'var(--green)');setPage('dashboard');}
      else {setError('No se encontró tu perfil. Contáctanos.');}
    }
    setLoading(false);
  };

  return (
    <div style={{padding:'24px 20px',maxWidth:'460px',margin:'0 auto'}}>
      <h2 style={{fontWeight:800,fontSize:'22px',textTransform:'uppercase',marginBottom:'4px'}}>Iniciar <span style={{color:'var(--gold)'}}>Sesión</span></h2>
      <p style={{fontSize:'13px',color:'var(--muted)',marginBottom:'20px'}}>Accede a tus predicciones y resultados</p>
      <div style={{background:'var(--card)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'20px'}}>
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          {[['Email','email','email','correo@ejemplo.com'],['Contraseña','password','password','Tu contraseña']].map(([label,key,type,ph])=>(
            <div key={key}>
              <label style={{fontSize:'11px',fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',display:'block',marginBottom:'5px'}}>{label}</label>
              <input type={type} placeholder={ph} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}
                onKeyDown={e=>e.key==='Enter'&&handleLogin()}
                style={{width:'100%',background:'var(--dark)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'10px 12px',color:'var(--text)',fontSize:'14px'}} />
            </div>
          ))}
        </div>
        {error && <div style={{marginTop:'12px',background:'rgba(230,57,70,0.1)',border:'1px solid rgba(230,57,70,0.3)',borderRadius:'8px',padding:'10px 12px',fontSize:'13px',color:'var(--red-light)'}}>{error}</div>}
        <button onClick={handleLogin} disabled={loading} style={{width:'100%',marginTop:'18px',background:loading?'var(--muted)':'var(--gold)',color:'var(--dark)',fontWeight:800,fontSize:'16px',letterSpacing:'1px',textTransform:'uppercase',border:'none',padding:'14px',borderRadius:'8px',cursor:loading?'not-allowed':'pointer'}}>
          {loading?'Ingresando...':'Entrar →'}
        </button>
        <p style={{textAlign:'center',marginTop:'16px',fontSize:'13px',color:'var(--muted)'}}>
          ¿No tienes cuenta?{' '}
          <button onClick={()=>setPage('registro')} style={{background:'none',border:'none',color:'var(--gold)',fontWeight:600,cursor:'pointer',fontSize:'13px'}}>Regístrate gratis</button>
        </p>
      </div>
    </div>
  );
}

function RegistroPage({setPage,setUser,showToast,c}) {
  const [form,setForm] = useState({full_name:'',cedula:'',phone:'',email:'',city:'',birth_date:'',password:'',confirmPassword:'',accepts_terms:false,accepts_marketing:false});
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!form.full_name||!form.cedula||!form.email||!form.phone||!form.city||!form.birth_date){setError('Por favor llena todos los campos');return;}
    if (!form.password||form.password.length<6){setError('La contraseña debe tener al menos 6 caracteres');return;}
    if (form.password!==form.confirmPassword){setError('Las contraseñas no coinciden');return;}
    if (c('register_check_terms')&&c('register_check_terms').trim()&&!form.accepts_terms){setError('Debes aceptar los términos y condiciones');return;}
    setLoading(true);
    try {
      const {data:authData,error:authErr} = await supabase.auth.signUp({email:form.email,password:form.password});
      if (authErr){
        setError(authErr.message.includes('already')?'Este email ya tiene una cuenta registrada':authErr.message);
        setLoading(false);return;
      }
      const {password,confirmPassword,...profileData} = form;
      const {data,error:err} = await supabase.from('users').insert([{id:authData.user.id,...profileData,accepts_terms:true}]).select().single();
      if (err){
        await supabase.auth.signOut();
        if (err.code==='23505'&&err.details?.includes('cedula')) setError('Esta cédula ya está registrada');
        else if (err.code==='23505'&&err.details?.includes('email')) setError('Este email ya está registrado');
        else setError(err.message);
        setLoading(false);return;
      }
      await supabase.from('leaderboard').insert([{user_id:data.id}]);
      setUser(data);
      showToast('¡Registro exitoso! Ahora haz tus predicciones','var(--green)');
      setPage('predicciones');
    } catch(e){setError('Error al registrar. Intenta de nuevo.');}
    setLoading(false);
  };

  return (
    <div style={{padding:'24px 20px',maxWidth:'600px',margin:'0 auto'}}>
      <h2 style={{fontWeight:800,fontSize:'22px',textTransform:'uppercase',marginBottom:'4px'}}>{c('register_title')} <span style={{color:'var(--gold)'}}>{c('register_title_highlight')}</span></h2>
      <p style={{fontSize:'13px',color:'var(--muted)',marginBottom:'20px'}}>{c('register_subtitle')}</p>
      <div style={{background:'var(--card)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'20px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          {[['Nombre completo','full_name','text','Tu nombre completo'],['Cédula / Pasaporte','cedula','text','0123456789'],['Celular','phone','tel','0991234567'],['Email','email','email','correo@ejemplo.com'],['Ciudad','city','text','Quito'],['Fecha de nacimiento','birth_date','date',''],['Contraseña','password','password','Mínimo 6 caracteres'],['Confirmar contraseña','confirmPassword','password','Repite tu contraseña']].map(([label,key,type,ph])=>(
            <div key={key}>
              <label style={{fontSize:'11px',fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',display:'block',marginBottom:'5px'}}>{label}</label>
              <input type={type} placeholder={ph} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}
                style={{width:'100%',background:'var(--dark)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'10px 12px',color:'var(--text)',fontSize:'14px'}} />
            </div>
          ))}
        </div>
        <div style={{marginTop:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
          {[['accepts_terms',c('register_check_terms')],['accepts_marketing',c('register_check_marketing')]].filter(([,label])=>label&&label.trim()).map(([key,label])=>(
            <label key={key} style={{display:'flex',alignItems:'flex-start',gap:'10px',cursor:'pointer'}}>
              <input type="checkbox" checked={form[key]} onChange={e=>setForm({...form,[key]:e.target.checked})} style={{marginTop:'2px',accentColor:'var(--gold)',width:'16px',height:'16px',flexShrink:0}} />
              <span style={{fontSize:'12px',color:'var(--muted)',lineHeight:1.5}} dangerouslySetInnerHTML={{__html:label}} />
            </label>
          ))}
        </div>
        {error && <div style={{marginTop:'12px',background:'rgba(230,57,70,0.1)',border:'1px solid rgba(230,57,70,0.3)',borderRadius:'8px',padding:'10px 12px',fontSize:'13px',color:'var(--red-light)'}}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{width:'100%',marginTop:'18px',background:loading?'var(--muted)':'var(--gold)',color:'var(--dark)',fontWeight:800,fontSize:'16px',letterSpacing:'1px',textTransform:'uppercase',border:'none',padding:'14px',borderRadius:'8px',cursor:loading?'not-allowed':'pointer'}}>
          {loading?c('register_btn_loading'):c('register_btn_submit')}
        </button>
        <p style={{textAlign:'center',marginTop:'16px',fontSize:'13px',color:'var(--muted)'}}>
          {c('register_login_prompt')}{' '}
          <button onClick={()=>setPage('login')} style={{background:'none',border:'none',color:'var(--gold)',fontWeight:600,cursor:'pointer',fontSize:'13px'}}>{c('register_login_link')}</button>
        </p>
      </div>
    </div>
  );
}

function computeBracket(matches, scores, tiebreakers) {
  const standings = {};
  matches.filter(m => m.phase === 'grupos').forEach(m => {
    const rawA = scores[m.id+'_a'], rawB = scores[m.id+'_b'];
    if (rawA === undefined || rawA === '' || rawB === undefined || rawB === '') return;
    const g = m.group_name;
    if (!standings[g]) standings[g] = {};
    if (!standings[g][m.team_a]) standings[g][m.team_a] = {name:m.team_a, code:m.team_a_code, pts:0, gf:0, ga:0, gd:0};
    if (!standings[g][m.team_b]) standings[g][m.team_b] = {name:m.team_b, code:m.team_b_code, pts:0, gf:0, ga:0, gd:0};
    const sa = parseInt(rawA), sb = parseInt(rawB);
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
      const tb=tiebreakers?.[m.id];
      let winner, loser;
      if (sa>sb){winner=tA;loser=tB;}
      else if (sb>sa){winner=tB;loser=tA;}
      else if (tb==='a'){winner=tA;loser=tB;}
      else if (tb==='b'){winner=tB;loser=tA;}
      else {winner=`Ganador partido ${m.match_number}`;loser=`Perdedor partido ${m.match_number}`;}
      b[`${prefix}W${i+1}`]=winner;
      b[`${prefix}L${i+1}`]=loser;
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

const PREDICTIONS_LOCK_DATE = new Date('2026-06-11T04:59:00Z');

function PrediccionesPage({user,showToast,c}) {
  const [matches,setMatches] = useState([]);
  const [scores,setScores] = useState({});
  const [tiebreakers,setTiebreakers] = useState({});
  const [originalBracket,setOriginalBracket] = useState(null);
  const [phase,setPhase] = useState('grupos');
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const isLocked = new Date() > PREDICTIONS_LOCK_DATE;

  useEffect(()=>{
    const load = async () => {
      const {data:matchData} = await supabase.from('matches').select('*').order('match_number',{ascending:true});
      setMatches(matchData||[]);
      if (user) {
        const {data:predData} = await supabase.from('predictions').select('*').eq('user_id',user.id);
        if (predData?.length) {
          const loadedScores={}, loadedTb={};
          predData.forEach(p => {
            loadedScores[p.match_id+'_a'] = String(p.predicted_score_a);
            loadedScores[p.match_id+'_b'] = String(p.predicted_score_b);
            if (p.tiebreaker) loadedTb[p.match_id] = p.tiebreaker;
          });
          setScores(loadedScores);
          setTiebreakers(loadedTb);
          setOriginalBracket(computeBracket(matchData||[], loadedScores, loadedTb));
        }
      }
      setLoading(false);
    };
    load();
    // Actualizar lista de partidos en tiempo real (scores, nombres de equipos TBD)
    const channel = supabase.channel('matches-updates')
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'matches'},(payload)=>{
        setMatches(prev=>prev.map(m=>m.id===payload.new.id?{...m,...payload.new}:m));
      })
      .subscribe();
    return ()=>{ supabase.removeChannel(channel); };
  },[user]);

  const phases=['grupos','round_of_32','round_of_16','quarterfinals','semifinals','third_place','final'];
  const filtered=matches.filter(m=>m.phase===phase);
  const bracket=computeBracket(matches,scores,tiebreakers);
  const getTeam=name=>bracket[name]||name;

  const knockoutPhases=['round_of_32','round_of_16','quarterfinals','semifinals','third_place','final'];
  const affectedPhases=useMemo(()=>{
    if (!originalBracket) return [];
    return knockoutPhases.filter(p=>{
      return matches.filter(m=>m.phase===p).some(m=>{
        const prevA=originalBracket[m.team_a]||m.team_a, nowA=bracket[m.team_a]||m.team_a;
        const prevB=originalBracket[m.team_b]||m.team_b, nowB=bracket[m.team_b]||m.team_b;
        return prevA!==nowA || prevB!==nowB;
      });
    }).map(p=>PHASE_LABELS[p]);
  },[bracket,originalBracket,matches]);

  const savePredictions = async () => {
    if (isLocked){showToast('⛔ El plazo de predicciones está cerrado','var(--red-light)');return;}
    if (!user){showToast('Regístrate primero para guardar tus predicciones','var(--red-light)');return;}
    const missing=filtered.filter(m=>scores[m.id+'_a']===undefined||scores[m.id+'_a']===''||scores[m.id+'_b']===undefined||scores[m.id+'_b']==='');
    if (missing.length>0){showToast(`❌ Faltan ${missing.length} partido(s) sin predicción en esta fase. Completa todos antes de guardar.`,'var(--red-light)');return;}
    if (phase!=='grupos') {
      const sinDesempate=filtered.filter(m=>{
        const sa=scores[m.id+'_a'], sb=scores[m.id+'_b'];
        return sa!==undefined&&sa!==''&&sb!==undefined&&sb!==''&&sa===sb&&!tiebreakers[m.id];
      });
      if (sinDesempate.length>0){showToast(`❌ Hay ${sinDesempate.length} partido(s) empatado(s) sin definir ganador en penales.`,'var(--red-light)');return;}
    }
    setSaving(true);
    const rows=filtered.map(m=>({
      user_id:user.id,match_id:m.id,
      predicted_score_a:parseInt(scores[m.id+'_a']??0),
      predicted_score_b:parseInt(scores[m.id+'_b']??0),
      tiebreaker:tiebreakers[m.id]||null,
      predicted_team_a: phase!=='grupos' ? getTeam(m.team_a) : null,
      predicted_team_b: phase!=='grupos' ? getTeam(m.team_b) : null,
    }));
    const {error}=await supabase.from('predictions').upsert(rows,{onConflict:'user_id,match_id'});
    if (error){showToast('No se pudieron guardar. Intenta de nuevo.','var(--red-light)');setSaving(false);return;}
    const faltantes=phases.filter(p=>{
      const pm=matches.filter(m=>m.phase===p);
      if(!pm.length)return false;
      return pm.some(m=>scores[m.id+'_a']===undefined||scores[m.id+'_a']==='');
    }).filter(p=>p!==phase).map(p=>PHASE_LABELS[p]);
    setOriginalBracket(computeBracket(matches, scores, tiebreakers));
    if(faltantes.length>0){
      showToast(`✅ ${PHASE_LABELS[phase]} guardada. Faltan por completar: ${faltantes.join(', ')}`, 'var(--gold)');
    } else {
      showToast(`✅ ¡Todas las fases completas! ${rows.length} predicciones guardadas.`,'var(--green)');
    }
    setSaving(false);
  };

  return (
    <div style={{padding:'20px',maxWidth:'900px',margin:'0 auto'}}>
      <h2 style={{fontWeight:800,fontSize:'22px',textTransform:'uppercase',marginBottom:'4px'}}>Mis <span style={{color:'var(--gold)'}}>{c('nav_tab_predicciones')}</span></h2>
      <p style={{fontSize:'13px',color:'var(--muted)',marginBottom:'14px'}}>Llena todas las fases antes del 10 de junio · Los equipos de eliminatorias se calculan según tus predicciones de grupos</p>
      {isLocked && (
        <div style={{background:'rgba(230,57,70,0.12)',border:'1px solid rgba(230,57,70,0.4)',borderRadius:'8px',padding:'12px 16px',marginBottom:'14px',fontSize:'13px',color:'var(--red-light)',fontWeight:600}}>
          ⛔ El período de predicciones está cerrado. Los resultados se actualizan en tiempo real.
        </div>
      )}
      {affectedPhases.length>0&&!isLocked&&(
        <div style={{background:'rgba(249,115,22,0.1)',border:'1px solid rgba(249,115,22,0.35)',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px',fontSize:'12px',color:'var(--orange)'}}>
          ⚠️ Modificaste predicciones que cambian los equipos clasificados. Las siguientes fases tienen partidos afectados y deben revisarse: <strong>{affectedPhases.join(', ')}</strong>. Guarda cada fase afectada para confirmar los cambios.
        </div>
      )}
      <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px',marginBottom:'16px'}}>
        {phases.map(p=>{
          const pm=matches.filter(m=>m.phase===p);
          const filled=pm.filter(m=>scores[m.id+'_a']!==undefined&&scores[m.id+'_a']!=='').length;
          const complete=pm.length>0&&filled===pm.length;
          return (
            <button key={p} onClick={()=>setPhase(p)} style={{background:phase===p?'rgba(var(--gold-rgb,245,197,24),0.15)':'var(--dark3)',border:`1px solid ${phase===p?'rgba(var(--gold-rgb,245,197,24),0.3)':'rgba(255,255,255,0.08)'}`,borderRadius:'6px',padding:'6px 12px',fontSize:'11px',fontWeight:600,color:phase===p?'var(--gold)':complete?'var(--green)':'var(--muted)',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,textTransform:'uppercase',letterSpacing:'.5px'}}>
              {complete?'✅ ':''}{PHASE_LABELS[p]}
            </button>
          );
        })}
      </div>
      {phase !== 'grupos' && (
        <div style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.25)',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px',fontSize:'12px',color:'var(--blue)'}}>
          ℹ️ Los equipos de esta fase se calculan automáticamente según tus predicciones de la <strong>{PHASE_PREV[phase]}</strong>. Completa las fases en orden y guarda cada una.
        </div>
      )}
      {loading?(
        <div style={{textAlign:'center',padding:'40px',color:'var(--muted)'}}>Cargando partidos...</div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {filtered.map(m=>{
            const teamA=getTeam(m.team_a), teamB=getTeam(m.team_b);
            const hasA=scores[m.id+'_a']!==undefined&&scores[m.id+'_a']!=='';
            const hasB=scores[m.id+'_b']!==undefined&&scores[m.id+'_b']!=='';
            const isKnockout=phase!=='grupos';
            const isDraw=hasA&&hasB&&scores[m.id+'_a']===scores[m.id+'_b'];
            const tb=tiebreakers[m.id];
            const needsTb=isKnockout&&isDraw&&!tb;
            return (
              <div key={m.id} style={{background:'var(--card)',border:`1px solid ${(!hasA||!hasB||needsTb)?'rgba(255,107,122,0.35)':'rgba(255,255,255,0.07)'}`,borderRadius:'10px',padding:'12px 14px',display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                <span style={{background:PHASE_COLORS[m.phase]||'rgba(245,197,24,0.1)',border:`1px solid ${PHASE_TEXT[m.phase]||'var(--gold)'}40`,borderRadius:'4px',padding:'2px 7px',fontSize:'10px',fontWeight:600,color:PHASE_TEXT[m.phase]||'var(--gold)',whiteSpace:'nowrap'}}>
                  {m.group_name||PHASE_LABELS[m.phase]}
                </span>
                <div style={{flex:1,display:'flex',alignItems:'center',gap:'6px',minWidth:'140px'}}>
                  <FlagImg code={m.team_a_code} name={teamA} />
                  <span style={{fontWeight:700,fontSize:'13px'}}>{teamA}</span>
                  <span style={{color:'var(--muted)',fontSize:'11px'}}>vs</span>
                  <FlagImg code={m.team_b_code} name={teamB} />
                  <span style={{fontWeight:700,fontSize:'13px'}}>{teamB}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                  <input type="number" min="0" max="20" placeholder="?" value={scores[m.id+'_a']??''} onChange={e=>!isLocked&&setScores(prev=>({...prev,[m.id+'_a']:e.target.value}))}
                    disabled={isLocked}
                    style={{width:'36px',height:'36px',background:isLocked?'var(--dark)':'var(--dark3)',border:`1px solid ${isLocked?'rgba(255,255,255,0.06)':hasA?'rgba(255,255,255,0.12)':'rgba(255,107,122,0.5)'}`,borderRadius:'6px',color:isLocked?'var(--muted)':'var(--text)',fontWeight:700,fontSize:'16px',textAlign:'center',cursor:isLocked?'not-allowed':'text'}} />
                  <span style={{color:'var(--muted)',fontWeight:700}}>-</span>
                  <input type="number" min="0" max="20" placeholder="?" value={scores[m.id+'_b']??''} onChange={e=>!isLocked&&setScores(prev=>({...prev,[m.id+'_b']:e.target.value}))}
                    disabled={isLocked}
                    style={{width:'36px',height:'36px',background:isLocked?'var(--dark)':'var(--dark3)',border:`1px solid ${isLocked?'rgba(255,255,255,0.06)':hasB?'rgba(255,255,255,0.12)':'rgba(255,107,122,0.5)'}`,borderRadius:'6px',color:isLocked?'var(--muted)':'var(--text)',fontWeight:700,fontSize:'16px',textAlign:'center',cursor:isLocked?'not-allowed':'text'}} />
                </div>
                <div style={{fontSize:'11px',color:'var(--muted)',textAlign:'right',minWidth:'65px'}}>
                  <div>{new Date(m.scheduled_at).toLocaleDateString('es-EC',{month:'short',day:'numeric',timeZone:'America/Guayaquil'})}</div>
                  <div>{new Date(m.scheduled_at).toLocaleTimeString('es-EC',{hour:'2-digit',minute:'2-digit',timeZone:'America/Guayaquil',hour12:true})}</div>
                </div>
                {isKnockout&&isDraw&&(
                  <div style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',marginTop:'4px',paddingTop:'8px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                    <span style={{fontSize:'11px',color:'var(--orange)',whiteSpace:'nowrap'}}>⚽ Empate — ganador en penales:</span>
                    <button onClick={()=>setTiebreakers(prev=>({...prev,[m.id]:'a'}))}
                      style={{flex:1,padding:'5px 8px',borderRadius:'6px',border:`1px solid ${tb==='a'?'var(--green)':'rgba(255,255,255,0.1)'}`,background:tb==='a'?'rgba(34,197,94,0.15)':'var(--dark3)',color:tb==='a'?'var(--green)':'var(--muted)',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
                      {teamA}
                    </button>
                    <button onClick={()=>setTiebreakers(prev=>({...prev,[m.id]:'b'}))}
                      style={{flex:1,padding:'5px 8px',borderRadius:'6px',border:`1px solid ${tb==='b'?'var(--green)':'rgba(255,255,255,0.1)'}`,background:tb==='b'?'rgba(34,197,94,0.15)':'var(--dark3)',color:tb==='b'?'var(--green)':'var(--muted)',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
                      {teamB}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length===0&&<div style={{textAlign:'center',padding:'40px',color:'var(--muted)'}}>No hay partidos en esta fase aún</div>}
        </div>
      )}
      {!isLocked && (
        <button onClick={savePredictions} disabled={saving} style={{width:'100%',marginTop:'16px',background:saving?'var(--muted)':'var(--gold)',color:'var(--dark)',fontWeight:800,fontSize:'16px',letterSpacing:'1px',textTransform:'uppercase',border:'none',padding:'14px',borderRadius:'8px',cursor:saving?'not-allowed':'pointer'}}>
          {saving?'Guardando...':`💾 Guardar ${c('nav_tab_predicciones')}`}
        </button>
      )}
      <p style={{textAlign:'center',fontSize:'11px',color:'var(--muted)',marginTop:'8px'}}>{c('predictions_lock_notice')}</p>
    </div>
  );
}

function DashboardPage({user,setPage,c}) {
  const [stats,setStats] = useState(null);
  useEffect(()=>{
    if (!user) return;
    const fetchStats = () => {
      supabase.from('leaderboard').select('*').eq('user_id',user.id).single()
        .then(({data})=>setStats(data));
    };
    fetchStats();
    // Actualizar mis puntos/ranking en tiempo real cuando el cron recalcula
    const channel = supabase.channel(`dashboard-${user.id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'leaderboard',filter:`user_id=eq.${user.id}`},fetchStats)
      .subscribe();
    return ()=>{ supabase.removeChannel(channel); };
  },[user]);

  if (!user) return (
    <div style={{padding:'60px 20px',textAlign:'center'}}>
      <div style={{fontSize:'48px',marginBottom:'16px'}}>🔑</div>
      <h2 style={{fontWeight:800,fontSize:'24px',color:'var(--gold)',marginBottom:'8px',textTransform:'uppercase'}}>Inicia Sesión</h2>
      <p style={{color:'var(--muted)',marginBottom:'24px'}}>Accede a tus predicciones y puntos</p>
      <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
        <button onClick={()=>setPage('login')} style={{background:'var(--gold)',color:'var(--dark)',fontWeight:800,fontSize:'15px',letterSpacing:'1px',textTransform:'uppercase',border:'none',padding:'12px 28px',borderRadius:'8px',cursor:'pointer'}}>Iniciar sesión</button>
        <button onClick={()=>setPage('registro')} style={{background:'transparent',color:'var(--text)',fontWeight:700,fontSize:'14px',border:'1px solid rgba(255,255,255,0.2)',padding:'10px 20px',borderRadius:'8px',cursor:'pointer'}}>Registrarme</button>
      </div>
    </div>
  );

  return (
    <div style={{padding:'24px 20px',maxWidth:'600px',margin:'0 auto'}}>
      <h2 style={{fontWeight:800,fontSize:'22px',textTransform:'uppercase',marginBottom:'16px'}}><span style={{color:'var(--gold)'}}>{c('nav_tab_dashboard')}</span></h2>
      <div style={{background:'var(--dark3)',border:'1px solid rgba(var(--gold-rgb,245,197,24),0.15)',borderRadius:'14px',padding:'20px',marginBottom:'16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:'12px',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px'}}>Posición Global</div>
            <div style={{fontWeight:900,fontSize:'42px',color:'var(--gold)',lineHeight:1}}>#{stats?.global_rank||'—'}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'12px',color:'var(--muted)'}}>Puntos</div>
            <div style={{fontWeight:900,fontSize:'52px',color:'var(--text)',lineHeight:1}}>{stats?.total_points||0}</div>
          </div>
        </div>
        <div style={{marginTop:'12px',fontSize:'13px',color:'var(--muted)'}}>Bienvenido, <strong style={{color:'var(--gold)'}}>{user.full_name}</strong></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
        {[['Exactos','exact_scores','var(--gold)'],['Acertados','correct_results','var(--green)'],['Predicciones','total_predictions','var(--blue)'],['% Aciertos','accuracy_pct','var(--orange)']].map(([l,k,col])=>(
          <div key={k} style={{background:'var(--dark)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px',padding:'12px',textAlign:'center'}}>
            <div style={{fontWeight:800,fontSize:'24px',color:col}}>{stats?.[k]??'0'}{k==='accuracy_pct'?'%':''}</div>
            <div style={{fontSize:'11px',color:'var(--muted)',marginTop:'2px'}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingPage({c}) {
  const [ranking,setRanking] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    const fetchRanking = () => {
      supabase.from('v_leaderboard').select('*').limit(50)
        .then(({data})=>{setRanking(data||[]);setLoading(false);});
    };
    fetchRanking();
    // Actualizar ranking cuando cambia la tabla leaderboard (puntos nuevos)
    const channel = supabase.channel('ranking-updates')
      .on('postgres_changes',{event:'*',schema:'public',table:'leaderboard'},fetchRanking)
      .subscribe();
    return ()=>{ supabase.removeChannel(channel); };
  },[]);

  return (
    <div style={{padding:'24px 20px',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontWeight:800,fontSize:'22px',textTransform:'uppercase',marginBottom:'16px'}}>{c('nav_tab_ranking')} <span style={{color:'var(--gold)'}}>Global</span></h2>
      {loading?<div style={{textAlign:'center',padding:'40px',color:'var(--muted)'}}>Cargando ranking...</div>:(
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {ranking.length===0&&<div style={{textAlign:'center',padding:'40px',color:'var(--muted)'}}>El ranking se activará cuando comiencen los partidos</div>}
          {ranking.map((r,i)=>(
            <div key={r.user_id} style={{display:'flex',alignItems:'center',gap:'12px',background:'var(--card)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px',padding:'10px 14px'}}>
              <span style={{fontWeight:800,fontSize:'20px',color:i<3?'var(--gold)':'var(--muted)',width:'28px',textAlign:'center',flexShrink:0}}>{r.global_rank}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:'14px',fontWeight:500}}>{r.full_name}</div>
                <div style={{fontSize:'11px',color:'var(--muted)'}}>{r.city}</div>
              </div>
              <span style={{fontSize:'11px',fontWeight:600,color:r.rank_change>0?'var(--green)':r.rank_change<0?'var(--red)':'var(--muted)'}}>
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
  const promoTitle = c('promos_title') || 'Plaza Las Américas';
  const lastSpace = promoTitle.lastIndexOf(' ');
  const promoTitleStart = lastSpace > 0 ? promoTitle.substring(0, lastSpace) : promoTitle;
  const promoTitleEnd = lastSpace > 0 ? promoTitle.substring(lastSpace + 1) : '';

  useEffect(()=>{
    supabase.from('promotions').select('*').eq('is_active',true).order('sort_order',{ascending:true})
      .then(({data})=>{setPromos(data||[]);setLoading(false);});
  },[]);

  return (
    <div style={{padding:'24px 20px',maxWidth:'900px',margin:'0 auto'}}>
      <h2 style={{fontWeight:800,fontSize:'22px',textTransform:'uppercase',marginBottom:'4px'}}>
        {promoTitleEnd ? <>{promoTitleStart} <span style={{color:'var(--gold)'}}>{promoTitleEnd}</span></> : promoTitleStart}
      </h2>
      {c('promos_subtitle') && <p style={{fontSize:'13px',color:'var(--muted)',marginBottom:'16px'}}>{c('promos_subtitle')}</p>}
      <div style={{background:'linear-gradient(135deg,rgba(var(--gold-rgb,245,197,24),0.08),rgba(249,115,22,0.05))',border:'1px solid rgba(var(--gold-rgb,245,197,24),0.2)',borderRadius:'12px',padding:'16px',marginBottom:'16px',textAlign:'center'}}>
        {c('event_badge') && <div style={{fontSize:'11px',color:'var(--gold)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'4px'}}>{c('event_badge')}</div>}
        <div style={{fontWeight:800,fontSize:'18px',marginBottom:'4px'}}>{c('event_title')}</div>
        <div style={{fontSize:'12px',color:'var(--muted)'}}>{c('event_description')}</div>
        <div style={{marginTop:'8px',display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(34,197,94,0.12)',borderRadius:'6px',padding:'4px 12px',fontSize:'12px',color:'var(--green)',fontWeight:600}}>{c('event_schedule')}</div>
      </div>
      {loading?<div style={{textAlign:'center',padding:'20px',color:'var(--muted)'}}>Cargando promociones...</div>:(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'10px'}}>
          {promos.map(p=>(
            <div key={p.id} style={{background:'var(--card)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'10px',overflow:'hidden',cursor:'pointer',transition:'transform .2s'}}
              onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.title} style={{width:'100%',height:'80px',objectFit:'cover'}}
                  onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}} />
              ) : null}
              <div style={{height:'80px',display:p.image_url?'none':'flex',alignItems:'center',justifyContent:'center',fontSize:'36px',background:'rgba(255,255,255,0.03)'}}>{p.emoji||'🏆'}</div>
              <div style={{padding:'10px'}}>
                <div style={{fontSize:'10px',color:'var(--gold)',fontWeight:600,textTransform:'uppercase'}}>{p.store_name}</div>
                <div style={{fontSize:'13px',fontWeight:600,marginTop:'2px'}}>{p.title}</div>
                <div style={{fontSize:'11px',color:'var(--muted)',marginTop:'3px'}}>{p.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
