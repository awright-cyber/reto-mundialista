'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const DEFAULT_CONTENT = {
  landing_badge:'⚽ FIFA World Cup 2026',landing_title:'RETO',landing_subtitle:'MUNDIALISTA',
  landing_tagline:'Plaza Las Américas',landing_description:'Predice todos los partidos del Mundial 2026, acumula puntos en tiempo real y gana premios exclusivos de Plaza Las Américas.',
  landing_btn_primary:'🏆 Participar Gratis',landing_btn_secondary:'Ver Partidos',
  stat_matches:'104',stat_teams:'48',stat_free:'100%',stat_start:'Jun 11',
  stat_matches_label:'Partidos',stat_teams_label:'Selecciones',stat_free_label:'Gratuito',stat_start_label:'Inicio',
  prize_amount:'$500',prize_description:'Gift Card para el ganador del Reto Mundialista',
  predictions_lock_notice:'⚠️ Predicciones se bloquean el 10 de junio a las 23:59 hora Ecuador',
  event_badge:'🎉 Evento especial',
  promos_title:'Plaza Las Américas',
  promos_subtitle:'Promociones mundialistas exclusivas para participantes',
  event_badge:'🎉 Evento especial',
  event_title:'ZONA MUNDIAL · Plaza Las Américas',event_description:'Pantallas gigantes · Activaciones · Sorteos en vivo',
  event_schedule:'📅 Todos los días del Mundial · 16h00 - 22h00',
  color_primary:'#F5C518',color_background:'#0A0E1A',color_text:'#F0F4FF',
  background_type:'solid',background_value:'',background_overlay:'50',
  nav_logo_word1:'Reto',nav_logo_word2:'Mundial',
  nav_tab_inicio:'Inicio',nav_tab_predicciones:'Predicciones',nav_tab_dashboard:'Mi Reto',nav_tab_ranking:'Ranking',nav_tab_promos:'Plaza',
  link_terms:'',link_instagram:'',link_whatsapp:'',link_website:'https://www.plazalasamericas.ec',
  logo_url:'',
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

export default function AdminPage() {
  const [auth,setAuth] = useState(false);
  const [pw,setPw] = useState('');
  const [err,setErr] = useState('');
  const [tab,setTab] = useState('contenido');
  const [content,setContent] = useState(DEFAULT_CONTENT);
  const [promos,setPromos] = useState([]);
  const [users,setUsers] = useState([]);
  const [matches,setMatches] = useState([]);
  const [stats,setStats] = useState({users:0,predictions:0,finished:0});
  const [saving,setSaving] = useState(false);
  const [syncing,setSyncing] = useState(false);
  const [syncResult,setSyncResult] = useState(null);
  const [mapping,setMapping] = useState(false);
  const [mapResult,setMapResult] = useState(null);
  const [msg,setMsg] = useState('');
  const [msgType,setMsgType] = useState('ok');
  const [editResult,setEditResult] = useState(null);
  const [editPromo,setEditPromo] = useState(null);
  const [editTeams,setEditTeams] = useState(null);

  const PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD||'plaza2026admin';

  const login = () => {
    if (pw===PASS){setAuth(true);load();}
    else setErr('Contraseña incorrecta');
  };

  const load = async () => {
    const [{data:cd},{data:ud},{data:md},{count:uc},{count:pc},{count:fc},{data:pd}] = await Promise.all([
      supabase.from('app_content').select('key,value'),
      supabase.from('users').select('id,full_name,email,city,cedula,created_at,total_points,global_rank').order('created_at',{ascending:false}).limit(200),
      supabase.from('matches').select('id,match_number,phase,group_name,team_a,team_b,team_a_flag,team_b_flag,score_a,score_b,status,scheduled_at').order('match_number',{ascending:true}),
      supabase.from('users').select('id',{count:'exact'}),
      supabase.from('predictions').select('id',{count:'exact'}),
      supabase.from('matches').select('id',{count:'exact'}).eq('status','finished'),
      supabase.from('promotions').select('*').order('sort_order',{ascending:true}),
    ]);
    if (cd?.length){const o={};cd.forEach(r=>{o[r.key]=r.value;});setContent(p=>({...p,...o}));}
    setUsers(ud||[]);setMatches(md||[]);setStats({users:uc||0,predictions:pc||0,finished:fc||0});setPromos(pd||[]);
  };

  const saveContent = async () => {
    setSaving(true);
    const rows=Object.entries(content).map(([key,value])=>({key,value}));
    await supabase.from('app_content').upsert(rows,{onConflict:'key'});
    showMsg('✅ Contenido guardado correctamente');setSaving(false);
  };

  const savePromo = async (promo) => {
    let error;
    if (promo.id) {
      ({error} = await supabase.from('promotions').update({
        emoji:promo.emoji,store_name:promo.store_name,title:promo.title,
        description:promo.description,image_url:promo.image_url,is_active:promo.is_active,sort_order:promo.sort_order
      }).eq('id',promo.id));
    } else {
      ({error} = await supabase.from('promotions').insert([{
        emoji:promo.emoji,store_name:promo.store_name,title:promo.title,
        description:promo.description,image_url:promo.image_url,is_active:true,sort_order:promos.length+1
      }]));
    }
    if (error){showMsg(`❌ Error al guardar: ${error.message}`);return;}
    setEditPromo(null);load();showMsg('✅ Promoción guardada');
  };

  const updateResult = async (m) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/save-result', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({secret:PASS, match_id:m.id, score_a:m.score_a, score_b:m.score_b}),
      });
      const json = await res.json();
      if (!res.ok) { showMsg(`❌ ${json.error}`); setEditResult(null); load(); return; }
      setEditResult(null); load(); showMsg('✅ Resultado guardado y puntos calculados');
    } catch(e) {
      showMsg(`❌ Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateTeams = async (m) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/update-teams', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({secret:PASS, match_id:m.id, team_a:m.team_a, team_b:m.team_b, team_a_flag:m.team_a_flag, team_b_flag:m.team_b_flag}),
      });
      const json = await res.json();
      if (!res.ok) { showMsg(`❌ ${json.error}`,'error'); } else { showMsg('✅ Equipos actualizados'); }
      setEditTeams(null); load();
    } catch(e) {
      showMsg(`❌ Error: ${e.message}`,'error');
    } finally {
      setSaving(false);
    }
  };

  const showMsg = (m,type='ok') => {
    setMsg(m); setMsgType(type);
    setTimeout(()=>setMsg(''),(type==='ok')?3000:8000);
  };

  const runMap = async () => {
    setMapping(true); setMapResult(null);
    try {
      const res = await fetch('/api/admin/map-fixtures',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:PASS})});
      const json = await res.json();
      setMapResult(json);
      if (res.ok && json.success) {
        const s = json.summary || {};
        showMsg(`✅ Mapeo OK: ${s.mapped||0} mapeados, ${s.alreadyMapped||0} ya tenían ID, ${s.notFound||0} sin encontrar`,'ok');
        load();
      } else showMsg(`⚠️ Mapeo: ${json.error||'ver detalles abajo'}`,'error');
    } catch(e) { setMapResult({error:e.message}); showMsg(`❌ ${e.message}`,'error'); }
    finally { setMapping(false); }
  };

  const runSync = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const res = await fetch('/api/admin/run-sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:PASS})});
      const json = await res.json();
      setSyncResult(json);
      if (res.ok && json.success) { showMsg(`✅ Sync OK: ${json.updated||0} actualizados, ${json.pointsCalc||0} puntos calc., ${json.notFound||0} no encontrados`,'ok'); load(); }
      else showMsg(`⚠️ Sync: ${json.error||'ver detalles en panel de abajo'}`,'error');
    } catch(e) { setSyncResult({error:e.message}); showMsg(`❌ ${e.message}`,'error'); }
    finally { setSyncing(false); }
  };
  const s = (k) => content[k] ?? DEFAULT_CONTENT[k] ?? '';
  const set = (k,v) => setContent(p=>({...p,[k]:v}));

  const downloadCSV = (data,filename) => {
    if (!data.length) return;
    const h=Object.keys(data[0]);
    const csv=[h.join(','),...data.map(r=>h.map(k=>`"${r[k]||''}"`).join(','))].join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=filename;a.click();
  };

  if (!auth) return (
    <div style={{minHeight:'100vh',background:'#0A0E1A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{background:'#1E2535',border:'1px solid rgba(245,197,24,0.2)',borderRadius:'14px',padding:'40px',width:'100%',maxWidth:'380px',textAlign:'center'}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>🔐</div>
        <h1 style={{fontWeight:900,fontSize:'24px',color:'#F5C518',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'6px'}}>Panel Admin</h1>
        <p style={{color:'#8899BB',fontSize:'13px',marginBottom:'24px'}}>Reto Mundialista · Plaza Las Américas</p>
        <input type="password" placeholder="Contraseña de administrador" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}
          style={{width:'100%',background:'#0A0E1A',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'12px 14px',color:'#F0F4FF',fontSize:'14px',outline:'none',marginBottom:'12px'}} />
        {err&&<p style={{color:'#FF6B7A',fontSize:'13px',marginBottom:'12px'}}>{err}</p>}
        <button onClick={login} style={{width:'100%',background:'#F5C518',color:'#0A0E1A',fontWeight:800,fontSize:'15px',textTransform:'uppercase',letterSpacing:'1px',border:'none',padding:'13px',borderRadius:'8px',cursor:'pointer'}}>Entrar</button>
      </div>
    </div>
  );

  const TABS=[{id:'contenido',label:'✏️ Contenido'},{id:'promociones',label:'🏬 Promociones'},{id:'resultados',label:'⚽ Resultados'},{id:'usuarios',label:'👥 Usuarios'},{id:'metricas',label:'📊 Métricas'}];
  const phaseLabels={grupos:'Grupos',round_of_32:'Ronda de 32',round_of_16:'Octavos',quarterfinals:'Cuartos',semifinals:'Semifinales',third_place:'Tercer Lugar',final:'Final'};

  return (
    <div style={{minHeight:'100vh',background:'#0A0E1A',fontFamily:'sans-serif',color:'#F0F4FF'}}>
      <nav style={{background:'rgba(10,14,26,0.97)',borderBottom:'1px solid rgba(245,197,24,0.15)',padding:'0 16px',height:'56px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontWeight:900,fontSize:'16px',color:'#F5C518',textTransform:'uppercase',letterSpacing:'1px'}}>🔐 Admin <span style={{color:'#F0F4FF'}}>Panel</span></div>
        <div style={{display:'flex',gap:'2px',overflowX:'auto'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?'rgba(245,197,24,0.12)':'none',border:'none',color:tab===t.id?'#F5C518':'#8899BB',fontSize:'11px',fontWeight:500,padding:'6px 10px',borderRadius:'6px',cursor:'pointer',whiteSpace:'nowrap'}}>{t.label}</button>
          ))}
        </div>
        <button onClick={()=>setAuth(false)} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'#8899BB',fontSize:'12px',padding:'5px 10px',borderRadius:'6px',cursor:'pointer'}}>Salir</button>
      </nav>

      {msg&&<div style={{background:msgType==='ok'?'rgba(34,197,94,0.1)':'rgba(230,57,70,0.1)',border:`1px solid ${msgType==='ok'?'rgba(34,197,94,0.3)':'rgba(230,57,70,0.3)'}`,padding:'10px 20px',fontSize:'13px',textAlign:'center',color:msgType==='ok'?'#4ADE80':'#FF6B7A',fontWeight:msgType!=='ok'?600:400}}>{msg}</div>}

      <div style={{padding:'20px',maxWidth:'900px',margin:'0 auto'}}>

        {/* CONTENIDO */}
        {tab==='contenido'&&(
          <div>
            <h2 style={{fontWeight:800,fontSize:'20px',textTransform:'uppercase',marginBottom:'4px'}}>Editor de <span style={{color:'#F5C518'}}>Contenido</span></h2>
            <p style={{fontSize:'13px',color:'#8899BB',marginBottom:'20px'}}>Edita textos, números y links. Los cambios se aplican inmediatamente al guardar.</p>
            <Sec title="🏠 Landing Page">
              <F label="Badge superior" val={s('landing_badge')} set={v=>set('landing_badge',v)} />
              <F label="Título línea 1" val={s('landing_title')} set={v=>set('landing_title',v)} />
              <F label="Título línea 2 (en dorado)" val={s('landing_subtitle')} set={v=>set('landing_subtitle',v)} />
              <F label="Subtítulo" val={s('landing_tagline')} set={v=>set('landing_tagline',v)} />
              <F label="Descripción" val={s('landing_description')} set={v=>set('landing_description',v)} ta />
              <F label="Botón principal" val={s('landing_btn_primary')} set={v=>set('landing_btn_primary',v)} />
              <F label="Botón secundario" val={s('landing_btn_secondary')} set={v=>set('landing_btn_secondary',v)} />
            </Sec>
            <Sec title="📊 Estadísticas">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <F label="Número 1" val={s('stat_matches')} set={v=>set('stat_matches',v)} />
                <F label="Etiqueta 1" val={s('stat_matches_label')} set={v=>set('stat_matches_label',v)} />
                <F label="Número 2 (equipos)" val={s('stat_teams')} set={v=>set('stat_teams',v)} />
                <F label="Etiqueta 2" val={s('stat_teams_label')} set={v=>set('stat_teams_label',v)} />
                <F label="Número 3" val={s('stat_free')} set={v=>set('stat_free',v)} />
                <F label="Etiqueta 3" val={s('stat_free_label')} set={v=>set('stat_free_label',v)} />
                <F label="Número 4" val={s('stat_start')} set={v=>set('stat_start',v)} />
                <F label="Etiqueta 4" val={s('stat_start_label')} set={v=>set('stat_start_label',v)} />
              </div>
            </Sec>
            <Sec title="🏬 Pestaña Locales">
              <p style={{fontSize:'12px',color:'#8899BB',marginBottom:'10px'}}>Textos del encabezado de la sección de promociones. La última palabra del título se resalta en dorado automáticamente.</p>
              <F label="Título (ej: Plaza Las Américas)" val={s('promos_title')} set={v=>set('promos_title',v)} />
              <F label="Subtítulo (dejar vacío para ocultar)" val={s('promos_subtitle')} set={v=>set('promos_subtitle',v)} />
            </Sec>
            <Sec title="🎉 Zona Mundial">
              <F label="Badge superior (dejar vacío para ocultar)" val={s('event_badge')} set={v=>set('event_badge',v)} />
              <F label="Título del evento" val={s('event_title')} set={v=>set('event_title',v)} />
              <F label="Descripción" val={s('event_description')} set={v=>set('event_description',v)} />
              <F label="Horario" val={s('event_schedule')} set={v=>set('event_schedule',v)} />
            </Sec>
            <Sec title="⚠️ Avisos">
              <F label="Aviso cierre predicciones" val={s('predictions_lock_notice')} set={v=>set('predictions_lock_notice',v)} />
            </Sec>
            <Sec title="🧭 Navegación (pestañas del menú)">
              <p style={{fontSize:'12px',color:'#8899BB',marginBottom:'12px'}}>
                Estos son los títulos que aparecen en el menú superior. Los títulos de sección dentro de cada página se actualizan automáticamente al cambiar estos valores.
              </p>
              <div style={{marginBottom:'14px'}}>
                <p style={{fontSize:'11px',fontWeight:600,color:'#8899BB',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'8px'}}>Nombre del logo (esquina superior izquierda)</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                  <F label="Primera palabra (en dorado)" val={s('nav_logo_word1')} set={v=>set('nav_logo_word1',v)} />
                  <F label="Segunda palabra (en blanco)" val={s('nav_logo_word2')} set={v=>set('nav_logo_word2',v)} />
                </div>
                <div style={{background:'#0A0E1A',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'10px 16px',display:'inline-flex',alignItems:'center',gap:'6px'}}>
                  <span style={{fontWeight:900,fontSize:'18px',color:'#F5C518',textTransform:'uppercase',letterSpacing:'1px'}}>
                    {s('nav_logo_word1')} <span style={{color:'#F0F4FF'}}>{s('nav_logo_word2')}</span>
                  </span>
                </div>
                <p style={{fontSize:'11px',color:'#8899BB',marginTop:'6px'}}>Vista previa del logo en el menú.</p>
              </div>
              <div style={{borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:'14px',marginBottom:'8px'}}>
                <p style={{fontSize:'11px',fontWeight:600,color:'#8899BB',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'10px'}}>Pestañas de navegación</p>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <F label="Pestaña Inicio" val={s('nav_tab_inicio')} set={v=>set('nav_tab_inicio',v)} />
                <F label="Pestaña Predicciones" val={s('nav_tab_predicciones')} set={v=>set('nav_tab_predicciones',v)} />
                <F label="Pestaña Mi Reto (dashboard)" val={s('nav_tab_dashboard')} set={v=>set('nav_tab_dashboard',v)} />
                <F label="Pestaña Ranking" val={s('nav_tab_ranking')} set={v=>set('nav_tab_ranking',v)} />
                <F label="Pestaña Plaza (promociones)" val={s('nav_tab_promos')} set={v=>set('nav_tab_promos',v)} />
              </div>
              <div style={{marginTop:'12px',background:'#0A0E1A',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'10px 14px',display:'flex',gap:'4px',alignItems:'center',overflowX:'auto'}}>
                {['nav_tab_inicio','nav_tab_predicciones','nav_tab_dashboard','nav_tab_ranking','nav_tab_promos'].map(k=>(
                  <span key={k} style={{background:'rgba(245,197,24,0.1)',border:'1px solid rgba(245,197,24,0.2)',borderRadius:'5px',padding:'4px 10px',fontSize:'12px',fontWeight:500,color:'#F5C518',whiteSpace:'nowrap'}}>{s(k)}</span>
                ))}
              </div>
              <p style={{fontSize:'11px',color:'#8899BB',marginTop:'6px'}}>Vista previa del menú de navegación.</p>
            </Sec>
            <Sec title="🖼️ Logo de Plaza Las Américas">
              <p style={{fontSize:'12px',color:'#8899BB',marginBottom:'10px'}}>
                Sube tu logo a <a href="https://imgur.com/upload" target="_blank" rel="noopener" style={{color:'var(--gold,#F5C518)'}}>imgur.com</a>, haz clic derecho en la imagen → "Copiar dirección de la imagen" y pégala aquí.
              </p>
              <F label="URL del logo (header y footer)" val={s('logo_url')} set={v=>set('logo_url',v)} />
              {s('logo_url') && (
                <div style={{marginTop:'8px',background:'#0A0E1A',padding:'10px',borderRadius:'6px',display:'inline-block'}}>
                  <p style={{fontSize:'11px',color:'#8899BB',marginBottom:'6px'}}>Vista previa:</p>
                  <img src={s('logo_url')} alt="Logo preview" style={{height:'40px',objectFit:'contain'}}
                    onError={e=>{e.target.style.display='none';}} />
                </div>
              )}
            </Sec>
            <Sec title="🔗 Links (dejar vacío para ocultar)">
              <p style={{fontSize:'12px',color:'#8899BB',marginBottom:'10px'}}>Si dejas un campo vacío, ese link no aparecerá en la app.</p>
              <F label="Web principal Plaza" val={s('link_website')} set={v=>set('link_website',v)} />
              <F label="Instagram (dejar vacío para ocultar)" val={s('link_instagram')} set={v=>set('link_instagram',v)} />
              <F label="WhatsApp / Contacto (dejar vacío para ocultar)" val={s('link_whatsapp')} set={v=>set('link_whatsapp',v)} />
              <F label="Términos y Condiciones (dejar vacío para ocultar)" val={s('link_terms')} set={v=>set('link_terms',v)} />
            </Sec>
            <Sec title="📝 Registro">
              <F label="Título (ej: Registro)" val={s('register_title')} set={v=>set('register_title',v)} />
              <F label="Palabra resaltada en dorado (ej: Gratuito)" val={s('register_title_highlight')} set={v=>set('register_title_highlight',v)} />
              <F label="Subtítulo" val={s('register_subtitle')} set={v=>set('register_subtitle',v)} />
              <F label="Texto del botón de registro" val={s('register_btn_submit')} set={v=>set('register_btn_submit',v)} />
              <F label="Texto del botón mientras carga" val={s('register_btn_loading')} set={v=>set('register_btn_loading',v)} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <F label="Texto '¿Ya tienes cuenta?'" val={s('register_login_prompt')} set={v=>set('register_login_prompt',v)} />
                <F label="Texto link 'Iniciar sesión'" val={s('register_login_link')} set={v=>set('register_login_link',v)} />
              </div>
              <p style={{fontSize:'11px',fontWeight:600,color:'#8899BB',textTransform:'uppercase',letterSpacing:'.5px',marginTop:'14px',marginBottom:'8px'}}>Checkboxes (acepta HTML para hipervínculos)</p>
              <F label='Checkbox 1 — Términos (obligatorio · usa <a href="URL">texto</a> para el link)' val={s('register_check_terms')} set={v=>set('register_check_terms',v)} ta />
              <F label='Checkbox 2 — Marketing / Comunicaciones (opcional)' val={s('register_check_marketing')} set={v=>set('register_check_marketing',v)} ta />
              <div style={{fontSize:'11px',color:'#8899BB',marginTop:'4px',padding:'8px',background:'rgba(245,197,24,0.05)',borderRadius:'6px',border:'1px solid rgba(245,197,24,0.1)'}}>
                💡 Puedes usar HTML en los checkboxes: <code style={{color:'#F5C518',fontSize:'11px'}}>{'<a href="https://..." style="color:var(--gold)">texto del link</a>'}</code>
              </div>
            </Sec>
            <Sec title="🦶 Footer — Textos">
              <F label="Texto link Plaza Las Américas" val={s('footer_link_website_label')} set={v=>set('footer_link_website_label',v)} />
              <F label="Texto link Instagram" val={s('footer_link_instagram_label')} set={v=>set('footer_link_instagram_label',v)} />
              <F label="Texto link WhatsApp" val={s('footer_link_whatsapp_label')} set={v=>set('footer_link_whatsapp_label',v)} />
              <F label="Texto link Términos y Condiciones" val={s('footer_link_terms_label')} set={v=>set('footer_link_terms_label',v)} />
              <F label="Texto copyright (línea inferior)" val={s('footer_copyright')} set={v=>set('footer_copyright',v)} />
            </Sec>
            <Sec title="🎨 Colores de la app">
              <p style={{fontSize:'12px',color:'#8899BB',marginBottom:'12px'}}>El color anaranjado de Plaza Las Américas es <strong style={{color:'#E8611A'}}>#E8611A</strong>. Haz clic en el cuadro de color o escribe el código hexadecimal.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
                <CF label="Color primario (dorado/anaranjado)" val={s('color_primary')} set={v=>set('color_primary',v)} />
                <CF label="Color de fondo (base sólida)" val={s('color_background')} set={v=>set('color_background',v)} />
                <CF label="Color de texto" val={s('color_text')} set={v=>set('color_text',v)} />
              </div>
            </Sec>
            <Sec title="🖼️ Fondo de la App">
              <p style={{fontSize:'12px',color:'#8899BB',marginBottom:'12px'}}>
                Elige cómo se ve el fondo de toda la aplicación. <strong style={{color:'#F0F4FF'}}>Sólido</strong> usa el color de fondo de arriba. <strong style={{color:'#F0F4FF'}}>Degradé</strong> acepta cualquier CSS gradient. <strong style={{color:'#F0F4FF'}}>Imagen</strong> pone una foto de fondo con overlay.
              </p>
              <div style={{display:'flex',gap:'6px',marginBottom:'14px'}}>
                {[['solid','🎨 Sólido'],['gradient','🌈 Degradé'],['image','🖼️ Imagen']].map(([val,label])=>(
                  <button key={val} onClick={()=>set('background_type',val)}
                    style={{flex:1,padding:'8px',borderRadius:'6px',border:`1px solid ${s('background_type')===val?'rgba(245,197,24,0.5)':'rgba(255,255,255,0.1)'}`,background:s('background_type')===val?'rgba(245,197,24,0.12)':'#0A0E1A',color:s('background_type')===val?'#F5C518':'#8899BB',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>
                    {label}
                  </button>
                ))}
              </div>
              {s('background_type')==='solid' && (
                <p style={{fontSize:'12px',color:'#8899BB'}}>
                  El fondo usa el <strong style={{color:'#F0F4FF'}}>"Color de fondo (base sólida)"</strong> definido en la sección de Colores arriba.
                </p>
              )}
              {s('background_type')==='gradient' && (
                <div>
                  <F label="CSS del degradé (ej: linear-gradient(135deg, #0A0E1A, #1a0d25))" val={s('background_value')} set={v=>set('background_value',v)} />
                  <p style={{fontSize:'11px',color:'#8899BB',marginBottom:'8px'}}>Presets:</p>
                  <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'12px'}}>
                    {[
                      ['Oscuro clásico','linear-gradient(160deg, #0A0E1A 0%, #1C2333 40%, #0A0E1A 100%)'],
                      ['Azul medianoche','linear-gradient(135deg, #0A0E1A 0%, #0d1b2a 100%)'],
                      ['Verde fútbol','linear-gradient(160deg, #0a1a0a 0%, #0d2010 50%, #0A0E1A 100%)'],
                      ['Púrpura','linear-gradient(160deg, #0A0E1A 0%, #1a0d25 50%, #0A0E1A 100%)'],
                      ['Plaza naranja','linear-gradient(160deg, #1a0d05 0%, #0A0E1A 50%, #1a0d05 100%)'],
                    ].map(([name,val])=>(
                      <button key={name} onClick={()=>set('background_value',val)}
                        style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#8899BB',fontSize:'11px',padding:'5px 10px',borderRadius:'4px',cursor:'pointer'}}>
                        {name}
                      </button>
                    ))}
                  </div>
                  {s('background_value') && (
                    <div>
                      <p style={{fontSize:'11px',color:'#8899BB',marginBottom:'4px'}}>Vista previa:</p>
                      <div style={{height:'60px',borderRadius:'8px',background:s('background_value'),border:'1px solid rgba(255,255,255,0.1)'}} />
                    </div>
                  )}
                </div>
              )}
              {s('background_type')==='image' && (
                <div>
                  <F label="URL de la imagen de fondo" val={s('background_value')} set={v=>set('background_value',v)} />
                  <p style={{fontSize:'11px',color:'#8899BB',marginBottom:'12px'}}>
                    💡 Sube tu imagen a <a href="https://imgur.com/upload" target="_blank" rel="noopener" style={{color:'#F5C518'}}>imgur.com</a> y pega el link directo. Recomendado: 1920×1080px o más.
                  </p>
                  <div style={{marginBottom:'12px'}}>
                    <label style={{fontSize:'11px',fontWeight:600,color:'#8899BB',textTransform:'uppercase',letterSpacing:'.5px',display:'block',marginBottom:'6px'}}>
                      Oscuridad del overlay: {s('background_overlay')||'50'}%
                    </label>
                    <input type="range" min="0" max="90" value={parseInt(s('background_overlay')||'50')} onChange={e=>set('background_overlay',e.target.value)}
                      style={{width:'100%',accentColor:'#F5C518'}} />
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',color:'#8899BB',marginTop:'2px'}}>
                      <span>Transparente (0%)</span><span>Muy oscuro (90%)</span>
                    </div>
                  </div>
                  {s('background_value') && (
                    <div>
                      <p style={{fontSize:'11px',color:'#8899BB',marginBottom:'4px'}}>Vista previa:</p>
                      <div style={{height:'90px',borderRadius:'8px',overflow:'hidden',position:'relative',border:'1px solid rgba(255,255,255,0.1)'}}>
                        <div style={{position:'absolute',inset:0,backgroundImage:`url(${s('background_value')})`,backgroundSize:'cover',backgroundPosition:'center'}}
                          onError={()=>{}} />
                        <div style={{position:'absolute',inset:0,background:`rgba(10,14,26,${(parseInt(s('background_overlay')||'50'))/100})`}} />
                        <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#F0F4FF',fontSize:'13px',fontWeight:600,textShadow:'0 1px 4px rgba(0,0,0,0.8)'}}>
                          Vista previa con overlay {s('background_overlay')||'50'}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Sec>
            <button onClick={saveContent} disabled={saving} style={{width:'100%',background:saving?'#8899BB':'#F5C518',color:'#0A0E1A',fontWeight:800,fontSize:'16px',textTransform:'uppercase',letterSpacing:'1px',border:'none',padding:'14px',borderRadius:'8px',cursor:saving?'not-allowed':'pointer',marginTop:'8px'}}>
              {saving?'Guardando...':'💾 Guardar todos los cambios'}
            </button>
          </div>
        )}

        {/* PROMOCIONES */}
        {tab==='promociones'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <div>
                <h2 style={{fontWeight:800,fontSize:'20px',textTransform:'uppercase',marginBottom:'2px'}}>Editor de <span style={{color:'#F5C518'}}>Promociones</span></h2>
                <p style={{fontSize:'13px',color:'#8899BB'}}>Edita las cards de la sección Plaza. Puedes poner imagen URL o emoji.</p>
              </div>
              <button onClick={()=>setEditPromo({emoji:'🏆',store_name:'',title:'',description:'',image_url:'',is_active:true,sort_order:promos.length+1})}
                style={{background:'#F5C518',color:'#0A0E1A',fontWeight:700,fontSize:'13px',border:'none',padding:'8px 14px',borderRadius:'6px',cursor:'pointer'}}>
                + Nueva promo
              </button>
            </div>

            {editPromo&&(
              <div style={{background:'#1E2535',border:'2px solid rgba(245,197,24,0.3)',borderRadius:'12px',padding:'20px',marginBottom:'16px'}}>
                <h3 style={{fontWeight:700,fontSize:'15px',color:'#F5C518',marginBottom:'14px'}}>{editPromo.id?'Editar':'Nueva'} Promoción</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  <F label="Emoji (si no hay imagen)" val={editPromo.emoji} set={v=>setEditPromo(p=>({...p,emoji:v}))} />
                  <F label="Nombre del local" val={editPromo.store_name} set={v=>setEditPromo(p=>({...p,store_name:v}))} />
                  <F label="Título de la promo" val={editPromo.title} set={v=>setEditPromo(p=>({...p,title:v}))} />
                  <F label="Descripción corta" val={editPromo.description} set={v=>setEditPromo(p=>({...p,description:v}))} />
                  <F label="URL de imagen (opcional)" val={editPromo.image_url||''} set={v=>setEditPromo(p=>({...p,image_url:v}))} />
                  <F label="Orden (número)" val={String(editPromo.sort_order||'')} set={v=>setEditPromo(p=>({...p,sort_order:parseInt(v)||0}))} />
                </div>
                <label style={{display:'flex',alignItems:'center',gap:'8px',margin:'10px 0',cursor:'pointer'}}>
                  <input type="checkbox" checked={editPromo.is_active} onChange={e=>setEditPromo(p=>({...p,is_active:e.target.checked}))} style={{accentColor:'#F5C518',width:'16px',height:'16px'}} />
                  <span style={{fontSize:'13px',color:'#8899BB'}}>Promoción activa (visible en la app)</span>
                </label>
                {editPromo.image_url&&(
                  <div style={{marginBottom:'10px'}}>
                    <p style={{fontSize:'11px',color:'#8899BB',marginBottom:'4px'}}>Vista previa:</p>
                    <img src={editPromo.image_url} alt="preview" style={{height:'60px',borderRadius:'6px',objectFit:'cover'}} onError={e=>e.target.style.display='none'} />
                  </div>
                )}
                <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                  <button onClick={()=>savePromo(editPromo)} style={{background:'#F5C518',color:'#0A0E1A',fontWeight:700,fontSize:'13px',border:'none',padding:'8px 20px',borderRadius:'6px',cursor:'pointer'}}>Guardar</button>
                  <button onClick={()=>setEditPromo(null)} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'#8899BB',fontSize:'13px',padding:'8px 16px',borderRadius:'6px',cursor:'pointer'}}>Cancelar</button>
                </div>
              </div>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {promos.map(p=>(
                <div key={p.id} style={{background:'#1E2535',border:`1px solid ${p.is_active?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.03)'}`,borderRadius:'10px',padding:'12px 14px',display:'flex',alignItems:'center',gap:'12px',opacity:p.is_active?1:0.5}}>
                  {p.image_url?(
                    <img src={p.image_url} alt={p.title} style={{width:'50px',height:'40px',objectFit:'cover',borderRadius:'6px',flexShrink:0}} onError={e=>{e.target.style.display='none';}} />
                  ):(
                    <div style={{width:'50px',height:'40px',background:'rgba(255,255,255,0.05)',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>{p.emoji}</div>
                  )}
                  <div style={{flex:1}}>
                    <div style={{fontSize:'11px',color:'#F5C518',fontWeight:600,textTransform:'uppercase'}}>{p.store_name}</div>
                    <div style={{fontSize:'13px',fontWeight:600}}>{p.title}</div>
                    <div style={{fontSize:'11px',color:'#8899BB'}}>{p.description}</div>
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button onClick={()=>setEditPromo({...p})} style={{background:'rgba(245,197,24,0.1)',border:'1px solid rgba(245,197,24,0.2)',color:'#F5C518',fontSize:'12px',padding:'5px 10px',borderRadius:'5px',cursor:'pointer'}}>✏️ Editar</button>
                    <button onClick={async()=>{await supabase.from('promotions').update({is_active:!p.is_active}).eq('id',p.id);load();}} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#8899BB',fontSize:'12px',padding:'5px 10px',borderRadius:'5px',cursor:'pointer'}}>
                      {p.is_active?'Ocultar':'Mostrar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p style={{fontSize:'11px',color:'#8899BB',marginTop:'12px'}}>💡 Para imágenes: sube tu foto a <a href="https://imgur.com" target="_blank" rel="noopener" style={{color:'#F5C518'}}>imgur.com</a> o <a href="https://cloudinary.com" target="_blank" rel="noopener" style={{color:'#F5C518'}}>cloudinary.com</a> y pega el link directo aquí.</p>
          </div>
        )}

        {/* RESULTADOS */}
        {tab==='resultados'&&(
          <div>
            <h2 style={{fontWeight:800,fontSize:'20px',textTransform:'uppercase',marginBottom:'4px'}}>Cargar <span style={{color:'#F5C518'}}>Resultados</span></h2>
            <p style={{fontSize:'13px',color:'#8899BB',marginBottom:'16px'}}>Ingresa el resultado oficial. Los puntos se calculan automáticamente.</p>
            <div style={{background:'rgba(245,197,24,0.06)',border:'1px solid rgba(245,197,24,0.2)',borderRadius:'10px',padding:'14px 16px',marginBottom:'20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',flexWrap:'wrap'}}>
              <div>
                <div style={{fontWeight:700,fontSize:'13px',color:'#F5C518',marginBottom:'2px'}}>🔄 Recalcular todos los puntos</div>
                <div style={{fontSize:'12px',color:'#8899BB'}}>Úsalo si el cron falló en algún partido o el ranking muestra puntos incorrectos.</div>
              </div>
              <button onClick={async()=>{
                setSaving(true);
                try {
                  const res = await fetch('/api/admin/recalculate-all',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:PASS})});
                  const json = await res.json();
                  load();
                  if (!res.ok) showMsg(`❌ Error: ${json.error}`,'error');
                  else if (json.errors?.length) showMsg(`⚠️ ${json.message} | Error: ${json.errors[0]}`,'error');
                  else showMsg(`✅ ${json.message}`,'ok');
                } catch(e) { showMsg(`❌ ${e.message}`,'error'); }
                finally { setSaving(false); }
              }} disabled={saving} style={{background:saving?'#8899BB':'#F5C518',color:'#0A0E1A',fontWeight:700,fontSize:'13px',border:'none',padding:'8px 20px',borderRadius:'6px',cursor:saving?'wait':'pointer',whiteSpace:'nowrap'}}>
                {saving?'Recalculando...':'Recalcular puntos'}
              </button>
            </div>
            {['grupos','round_of_32','round_of_16','quarterfinals','semifinals','third_place','final'].map(phase=>{
              const pm=matches.filter(m=>m.phase===phase);
              if (!pm.length) return null;
              return (
                <div key={phase} style={{marginBottom:'20px'}}>
                  <div style={{fontSize:'12px',fontWeight:600,color:'#F5C518',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'8px',paddingBottom:'6px',borderBottom:'1px solid rgba(245,197,24,0.15)'}}>{phaseLabels[phase]}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {pm.map(m=>{
                      const isTBD = m.team_a?.startsWith('TBD') || m.team_b?.startsWith('TBD');
                      const isEditingTeams = editTeams?.id===m.id;
                      return (
                        <div key={m.id} style={{background:'#1E2535',border:`1px solid ${m.status==='finished'?'rgba(34,197,94,0.2)':isTBD?'rgba(251,191,36,0.25)':'rgba(255,255,255,0.07)'}`,borderRadius:'8px',padding:'10px 14px',display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                          <div style={{flex:1,minWidth:'160px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                              {m.team_a_flag&&<img src={m.team_a_flag} style={{height:'14px',borderRadius:'2px'}} />}
                              <span style={{fontSize:'13px',fontWeight:500,color:isTBD?'#FBB724':'#F0F4FF'}}>{m.team_a}</span>
                              <span style={{fontSize:'11px',color:'#8899BB'}}>vs</span>
                              {m.team_b_flag&&<img src={m.team_b_flag} style={{height:'14px',borderRadius:'2px'}} />}
                              <span style={{fontSize:'13px',fontWeight:500,color:isTBD?'#FBB724':'#F0F4FF'}}>{m.team_b}</span>
                              {isTBD&&<span style={{fontSize:'9px',background:'rgba(251,191,36,0.15)',color:'#FBB724',border:'1px solid rgba(251,191,36,0.3)',padding:'1px 5px',borderRadius:'3px',fontWeight:600}}>POR DEFINIR</span>}
                            </div>
                            <div style={{fontSize:'11px',color:'#8899BB',marginTop:'2px'}}>
                              {new Date(m.scheduled_at).toLocaleDateString('es-EC',{day:'numeric',month:'short',timeZone:'America/Guayaquil'})} · {new Date(m.scheduled_at).toLocaleTimeString('es-EC',{hour:'2-digit',minute:'2-digit',timeZone:'America/Guayaquil',hour12:true})}
                            </div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                            {m.status!=='finished'&&!isEditingTeams&&(
                              <button onClick={()=>{setEditTeams({...m});setEditResult(null);}} style={{background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.25)',color:'#FBB724',fontSize:'11px',fontWeight:600,padding:'4px 10px',borderRadius:'5px',cursor:'pointer'}}>
                                ✏️ Equipos
                              </button>
                            )}
                            {m.status==='finished'?(
                              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                <span style={{fontWeight:800,fontSize:'18px',color:'#22C55E'}}>{m.score_a} - {m.score_b}</span>
                                <span style={{fontSize:'10px',color:'#22C55E',background:'rgba(34,197,94,0.1)',padding:'2px 6px',borderRadius:'4px'}}>✓ Final</span>
                                <button onClick={()=>setEditResult({...m})} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'#8899BB',fontSize:'11px',padding:'3px 8px',borderRadius:'4px',cursor:'pointer'}}>Editar</button>
                              </div>
                            ):editResult?.id===m.id?(
                              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                                <input type="number" min="0" max="20" value={editResult.score_a??''} onChange={e=>setEditResult(p=>({...p,score_a:e.target.value}))}
                                  style={{width:'44px',height:'36px',background:'#0A0E1A',border:'1px solid #F5C518',borderRadius:'6px',color:'#F0F4FF',fontWeight:700,fontSize:'16px',textAlign:'center',outline:'none'}} />
                                <span style={{color:'#8899BB',fontWeight:700}}>-</span>
                                <input type="number" min="0" max="20" value={editResult.score_b??''} onChange={e=>setEditResult(p=>({...p,score_b:e.target.value}))}
                                  style={{width:'44px',height:'36px',background:'#0A0E1A',border:'1px solid #F5C518',borderRadius:'6px',color:'#F0F4FF',fontWeight:700,fontSize:'16px',textAlign:'center',outline:'none'}} />
                                <button onClick={()=>updateResult(editResult)} disabled={saving} style={{background:saving?'#888':'#F5C518',color:'#0A0E1A',fontWeight:700,fontSize:'12px',border:'none',padding:'6px 12px',borderRadius:'6px',cursor:saving?'wait':'pointer'}}>{saving?'Guardando...':'Guardar'}</button>
                                <button onClick={()=>setEditResult(null)} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'#8899BB',fontSize:'12px',padding:'6px 10px',borderRadius:'6px',cursor:'pointer'}}>✕</button>
                              </div>
                            ):!isEditingTeams?(
                              <button onClick={()=>{setEditResult({...m,score_a:'',score_b:''});setEditTeams(null);}} style={{background:'rgba(245,197,24,0.1)',border:'1px solid rgba(245,197,24,0.2)',color:'#F5C518',fontWeight:600,fontSize:'12px',padding:'6px 14px',borderRadius:'6px',cursor:'pointer'}}>
                                + Cargar resultado
                              </button>
                            ):null}
                          </div>
                          {isEditingTeams&&(
                            <div style={{width:'100%',marginTop:'10px',paddingTop:'10px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
                              <div style={{fontSize:'11px',fontWeight:600,color:'#FBB724',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'8px'}}>Editar equipos</div>
                              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                                <div>
                                  <label style={{fontSize:'10px',color:'#8899BB',display:'block',marginBottom:'3px'}}>Equipo A (local)</label>
                                  <input value={editTeams.team_a||''} onChange={e=>setEditTeams(p=>({...p,team_a:e.target.value}))} placeholder="Ej: Argentina"
                                    style={{width:'100%',background:'#0A0E1A',border:'1px solid #FBB724',borderRadius:'5px',padding:'6px 8px',color:'#F0F4FF',fontSize:'13px',outline:'none',boxSizing:'border-box'}} />
                                </div>
                                <div>
                                  <label style={{fontSize:'10px',color:'#8899BB',display:'block',marginBottom:'3px'}}>Equipo B (visitante)</label>
                                  <input value={editTeams.team_b||''} onChange={e=>setEditTeams(p=>({...p,team_b:e.target.value}))} placeholder="Ej: Francia"
                                    style={{width:'100%',background:'#0A0E1A',border:'1px solid #FBB724',borderRadius:'5px',padding:'6px 8px',color:'#F0F4FF',fontSize:'13px',outline:'none',boxSizing:'border-box'}} />
                                </div>
                                <div>
                                  <label style={{fontSize:'10px',color:'#8899BB',display:'block',marginBottom:'3px'}}>URL bandera A (flagcdn.com/w40/XX.png)</label>
                                  <input value={editTeams.team_a_flag||''} onChange={e=>setEditTeams(p=>({...p,team_a_flag:e.target.value}))} placeholder="https://flagcdn.com/w40/ar.png"
                                    style={{width:'100%',background:'#0A0E1A',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'5px',padding:'6px 8px',color:'#F0F4FF',fontSize:'12px',outline:'none',boxSizing:'border-box'}} />
                                </div>
                                <div>
                                  <label style={{fontSize:'10px',color:'#8899BB',display:'block',marginBottom:'3px'}}>URL bandera B (flagcdn.com/w40/XX.png)</label>
                                  <input value={editTeams.team_b_flag||''} onChange={e=>setEditTeams(p=>({...p,team_b_flag:e.target.value}))} placeholder="https://flagcdn.com/w40/fr.png"
                                    style={{width:'100%',background:'#0A0E1A',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'5px',padding:'6px 8px',color:'#F0F4FF',fontSize:'12px',outline:'none',boxSizing:'border-box'}} />
                                </div>
                              </div>
                              <div style={{fontSize:'10px',color:'#8899BB',marginBottom:'8px'}}>
                                💡 Códigos de 2 letras ISO: ar=Argentina, fr=Francia, br=Brasil, de=Alemania, es=España, pt=Portugal, ec=Ecuador, us=USA, mx=México, co=Colombia, uy=Uruguay, nl=Países Bajos, hr=Croacia, ma=Marruecos, sn=Senegal, jp=Japón, kr=Corea, au=Australia, eg=Egipto, ng=Nigeria, gh=Ghana, cm=Camerún
                              </div>
                              <div style={{display:'flex',gap:'8px'}}>
                                <button onClick={()=>updateTeams(editTeams)} disabled={saving} style={{background:saving?'#888':'#FBB724',color:'#0A0E1A',fontWeight:700,fontSize:'12px',border:'none',padding:'7px 18px',borderRadius:'6px',cursor:saving?'wait':'pointer'}}>{saving?'Guardando...':'Guardar equipos'}</button>
                                <button onClick={()=>setEditTeams(null)} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'#8899BB',fontSize:'12px',padding:'7px 12px',borderRadius:'6px',cursor:'pointer'}}>Cancelar</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* USUARIOS */}
        {tab==='usuarios'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <div>
                <h2 style={{fontWeight:800,fontSize:'20px',textTransform:'uppercase',marginBottom:'2px'}}>Usuarios <span style={{color:'#F5C518'}}>Registrados</span></h2>
                <p style={{fontSize:'13px',color:'#8899BB'}}>{stats.users} participantes en total</p>
              </div>
              <button onClick={()=>downloadCSV(users,'usuarios_reto_mundial.csv')} style={{background:'#F5C518',color:'#0A0E1A',fontWeight:700,fontSize:'13px',border:'none',padding:'8px 16px',borderRadius:'6px',cursor:'pointer'}}>↓ CSV</button>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                <thead>
                  <tr style={{background:'#1C2333'}}>
                    {['Nombre','Email','Ciudad','Cédula','Puntos','Ranking','Registro'].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:'10px',fontWeight:600,color:'#8899BB',textTransform:'uppercase',letterSpacing:'.5px',whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u=>(
                    <tr key={u.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                      <td style={{padding:'8px 10px',fontWeight:500}}>{u.full_name}</td>
                      <td style={{padding:'8px 10px',color:'#8899BB'}}>{u.email}</td>
                      <td style={{padding:'8px 10px',color:'#8899BB'}}>{u.city}</td>
                      <td style={{padding:'8px 10px',color:'#8899BB'}}>{u.cedula}</td>
                      <td style={{padding:'8px 10px',color:'#F5C518',fontWeight:700}}>{u.total_points||0}</td>
                      <td style={{padding:'8px 10px',color:'#8899BB'}}>#{u.global_rank||'—'}</td>
                      <td style={{padding:'8px 10px',color:'#8899BB'}}>{new Date(u.created_at).toLocaleDateString('es-EC')}</td>
                    </tr>
                  ))}
                  {!users.length&&<tr><td colSpan={7} style={{padding:'24px',textAlign:'center',color:'#8899BB'}}>No hay usuarios aún</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MÉTRICAS */}
        {tab==='metricas'&&(
          <div>
            <h2 style={{fontWeight:800,fontSize:'20px',textTransform:'uppercase',marginBottom:'16px'}}>Métricas <span style={{color:'#F5C518'}}>en tiempo real</span></h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'12px',marginBottom:'24px'}}>
              {[['👥',stats.users,'Usuarios','#F5C518'],['📋',stats.predictions,'Predicciones','#3B82F6'],['✅',stats.finished,'Partidos finalizados','#22C55E'],['⚽','104','Total partidos','#F97316']].map(([icon,num,label,color])=>(
                <div key={label} style={{background:'#1E2535',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'10px',padding:'16px',textAlign:'center'}}>
                  <div style={{fontSize:'28px',marginBottom:'6px'}}>{icon}</div>
                  <div style={{fontWeight:900,fontSize:'32px',color,lineHeight:1}}>{num}</div>
                  <div style={{fontSize:'11px',color:'#8899BB',marginTop:'4px'}}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{background:'rgba(245,197,24,0.06)',border:'1px solid rgba(245,197,24,0.2)',borderRadius:'10px',padding:'16px',marginBottom:'16px'}}>
              <div style={{fontWeight:700,fontSize:'14px',marginBottom:'6px',color:'#F5C518'}}>🔄 Recalcular puntos y ranking</div>
              <p style={{fontSize:'12px',color:'#8899BB',marginBottom:'12px'}}>
                Recalcula los puntos de todos los partidos finalizados y reconstruye el ranking completo.
                Úsalo si el ranking muestra puntos incorrectos o si el cron falló en algún partido.
              </p>
              <button onClick={async()=>{
                setSaving(true);
                try {
                  const res = await fetch('/api/admin/recalculate-all',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:PASS})});
                  const json = await res.json();
                  load();
                  if (!res.ok) showMsg(`❌ Error: ${json.error}`,'error');
                  else if (json.errors?.length) showMsg(`⚠️ ${json.message} | Error: ${json.errors[0]}`,'error');
                  else showMsg(`✅ ${json.message}`,'ok');
                } catch(e) { showMsg(`❌ ${e.message}`,'error'); }
                finally { setSaving(false); }
              }} disabled={saving||syncing} style={{background:saving?'#8899BB':'#F5C518',color:'#0A0E1A',fontWeight:700,fontSize:'13px',border:'none',padding:'8px 20px',borderRadius:'6px',cursor:saving?'wait':'pointer'}}>
                {saving?'Recalculando...':'Recalcular todos los puntos'}
              </button>
            </div>

            <div style={{background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.25)',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
              <div style={{fontWeight:700,fontSize:'14px',marginBottom:'6px',color:'#34D399'}}>🗺️ Mapear Fixtures (usa cuando hay notFound &gt; 0)</div>
              <p style={{fontSize:'12px',color:'#8899BB',marginBottom:'12px'}}>
                Descarga todos los partidos de API-Football y los vincula con la DB por nombre de equipo y estadio. Corre esto si el sync automático no encuentra algún partido.
              </p>
              <button onClick={runMap} disabled={mapping||syncing||saving} style={{background:mapping?'#8899BB':'#10B981',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',padding:'8px 20px',borderRadius:'6px',cursor:mapping?'wait':'pointer',marginBottom:'12px'}}>
                {mapping?'⏳ Mapeando...':'🗺️ Mapear Fixtures'}
              </button>
              {mapResult&&(
                <div>
                  <div style={{fontSize:'11px',fontWeight:600,color:'#8899BB',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'4px'}}>Resultado del mapeo</div>
                  {mapResult.summary&&(
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'8px'}}>
                      {[['Mapeados',mapResult.summary.mapped,'#34D399'],['Ya tenían ID',mapResult.summary.alreadyMapped,'#60A5FA'],['Sin encontrar',mapResult.summary.notFound,'#F59E0B'],['Total API',mapResult.summary.total_api,'#8899BB']].map(([k,v,c])=>(
                        <div key={k} style={{background:'#0A0E1A',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'6px',padding:'6px 12px',fontSize:'12px'}}>
                          <span style={{color:c,fontWeight:700}}>{v}</span> <span style={{color:'#8899BB'}}>{k}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {mapResult.summary?.notFound>0&&(
                    <div style={{marginTop:'4px',padding:'8px 12px',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:'6px',fontSize:'12px',color:'#FBB724',marginBottom:'8px'}}>
                      ⚠️ {mapResult.summary.notFound} partido(s) no encontrados. Revisa el JSON de detalles abajo — verás qué partido de la API no tiene equivalente en DB y el estadio que reporta.
                    </div>
                  )}
                  <pre style={{background:'#0A0E1A',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'12px',fontSize:'10px',fontFamily:'monospace',whiteSpace:'pre-wrap',overflowX:'auto',color:'#8899BB',maxHeight:'220px',overflowY:'auto',margin:0}}>
                    {JSON.stringify(mapResult,null,2)}
                  </pre>
                </div>
              )}
            </div>

            <div style={{background:'rgba(59,130,246,0.06)',border:'1px solid rgba(59,130,246,0.25)',borderRadius:'10px',padding:'16px',marginBottom:'16px'}}>
              <div style={{fontWeight:700,fontSize:'14px',marginBottom:'6px',color:'#60A5FA'}}>⚡ Sincronización con API-Football</div>
              <p style={{fontSize:'12px',color:'#8899BB',marginBottom:'12px'}}>
                Conecta con la API y actualiza resultados ahora mismo. El output muestra exactamente qué pasa — útil para diagnosticar por qué el cron automático no funciona.
              </p>
              <button onClick={runSync} disabled={syncing||saving} style={{background:syncing?'#8899BB':'#3B82F6',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',padding:'8px 20px',borderRadius:'6px',cursor:syncing?'wait':'pointer',marginBottom:'12px'}}>
                {syncing?'⏳ Sincronizando...':'⚡ Forzar sincronización API'}
              </button>
              {syncResult&&(
                <div>
                  <div style={{fontSize:'11px',fontWeight:600,color:'#8899BB',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'4px'}}>
                    Resultado ({syncResult.cron_http_status ? `HTTP ${syncResult.cron_http_status}` : 'error local'})
                  </div>
                  <pre style={{background:'#0A0E1A',border:`1px solid ${syncResult.success===false||syncResult.error?'rgba(230,57,70,0.3)':'rgba(34,197,94,0.3)'}`,borderRadius:'8px',padding:'12px',fontSize:'11px',fontFamily:'monospace',whiteSpace:'pre-wrap',overflowX:'auto',color:syncResult.error?'#FF6B7A':'#8899BB',maxHeight:'280px',overflowY:'auto',margin:0}}>
                    {JSON.stringify(syncResult,null,2)}
                  </pre>
                  {syncResult.notFound>0&&(
                    <div style={{marginTop:'8px',padding:'8px 12px',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:'6px',fontSize:'12px',color:'#FBB724'}}>
                      ⚠️ {syncResult.notFound} partido(s) no se pudieron emparejar con la DB. Presiona <strong>"🗺️ Mapear Fixtures"</strong> arriba para vincularlos y luego sincroniza de nuevo.
                    </div>
                  )}
                  {syncResult.cron_http_status===401&&(
                    <div style={{marginTop:'8px',padding:'8px 12px',background:'rgba(230,57,70,0.08)',border:'1px solid rgba(230,57,70,0.2)',borderRadius:'6px',fontSize:'12px',color:'#FF6B7A'}}>
                      ❌ Error 401: el CRON_SECRET no coincide. Verifica la variable en Render → Environment.
                    </div>
                  )}
                  {syncResult.total===0&&!syncResult.error&&(
                    <div style={{marginTop:'8px',padding:'8px 12px',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:'6px',fontSize:'12px',color:'#FBB724'}}>
                      ⚠️ La API devolvió 0 partidos hoy. Posibles causas: ID de liga incorrecto (actual: 1), la API no tiene datos del Mundial 2026 aún, o la API Key está sin créditos. Revisa en <a href="https://dashboard.api-football.com" target="_blank" rel="noopener" style={{color:'#60A5FA'}}>dashboard.api-football.com</a>.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{background:'#1E2535',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'10px',padding:'16px'}}>
              <div style={{fontWeight:700,fontSize:'14px',marginBottom:'12px',color:'#F5C518'}}>🔗 Links rápidos</div>
              {[['🌐 Ver la app','https://reto.plazalasamericas.ec'],['🗄️ Base de datos (Supabase)','https://supabase.com/dashboard'],['🚀 Hosting (Render)','https://dashboard.render.com'],['⚽ API Football','https://dashboard.api-football.com']].map(([label,url])=>(
                <a key={label} href={url} target="_blank" rel="noopener" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',color:'#F0F4FF',textDecoration:'none',fontSize:'13px'}}>
                  <span>{label}</span><span style={{color:'#8899BB',fontSize:'11px'}}>↗ Abrir</span>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function Sec({title,children}) {
  return (
    <div style={{background:'#1E2535',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
      <div style={{fontSize:'13px',fontWeight:600,color:'#F5C518',marginBottom:'12px',textTransform:'uppercase',letterSpacing:'.5px'}}>{title}</div>
      {children}
    </div>
  );
}

function CF({label,val,set}) {
  return (
    <div style={{marginBottom:'10px'}}>
      <label style={{fontSize:'11px',fontWeight:600,color:'#8899BB',textTransform:'uppercase',letterSpacing:'.5px',display:'block',marginBottom:'4px'}}>{label}</label>
      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
        <input type="color" value={val||'#F5C518'} onChange={e=>set(e.target.value)}
          style={{width:'44px',height:'36px',border:'none',borderRadius:'6px',cursor:'pointer',background:'none',padding:'2px'}} />
        <input type="text" value={val||''} onChange={e=>set(e.target.value)} placeholder="#F5C518"
          style={{flex:1,background:'#0A0E1A',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'6px',padding:'8px 10px',color:'#F0F4FF',fontSize:'13px',outline:'none'}} />
      </div>
    </div>
  );
}

function F({label,val,set,ta}) {
  return (
    <div style={{marginBottom:'10px'}}>
      <label style={{fontSize:'11px',fontWeight:600,color:'#8899BB',textTransform:'uppercase',letterSpacing:'.5px',display:'block',marginBottom:'4px'}}>{label}</label>
      {ta?(
        <textarea value={val} onChange={e=>set(e.target.value)} rows={3}
          style={{width:'100%',background:'#0A0E1A',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'6px',padding:'8px 10px',color:'#F0F4FF',fontSize:'13px',outline:'none',resize:'vertical',fontFamily:'sans-serif'}} />
      ):(
        <input type="text" value={val} onChange={e=>set(e.target.value)}
          style={{width:'100%',background:'#0A0E1A',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'6px',padding:'8px 10px',color:'#F0F4FF',fontSize:'13px',outline:'none'}} />
      )}
    </div>
  );
}
