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
  event_title:'ZONA MUNDIAL · Plaza Las Américas',event_description:'Pantallas gigantes · Activaciones · Sorteos en vivo',
  event_schedule:'📅 Todos los días del Mundial · 16h00 - 22h00',
  color_primary:'#F5C518',color_background:'#0A0E1A',color_text:'#F0F4FF',
  link_terms:'#',link_instagram:'#',link_whatsapp:'#',link_website:'https://www.plazalasamericas.ec',
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
  const [msg,setMsg] = useState('');
  const [editResult,setEditResult] = useState(null);
  const [editPromo,setEditPromo] = useState(null);

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
    if (promo.id) {
      await supabase.from('promotions').update({
        emoji:promo.emoji,store_name:promo.store_name,title:promo.title,
        description:promo.description,image_url:promo.image_url,is_active:promo.is_active,sort_order:promo.sort_order
      }).eq('id',promo.id);
    } else {
      await supabase.from('promotions').insert([{
        emoji:promo.emoji,store_name:promo.store_name,title:promo.title,
        description:promo.description,image_url:promo.image_url,is_active:true,sort_order:promos.length+1
      }]);
    }
    setEditPromo(null);load();showMsg('✅ Promoción guardada');
  };

  const updateResult = async (m) => {
    await supabase.from('matches').update({score_a:parseInt(m.score_a),score_b:parseInt(m.score_b),status:'finished',updated_at:new Date().toISOString()}).eq('id',m.id);
    await supabase.rpc('calculate_match_points',{p_match_id:m.id});
    await supabase.rpc('recalculate_leaderboard');
    setEditResult(null);load();showMsg('✅ Resultado guardado y puntos calculados');
  };

  const showMsg = (m) => {setMsg(m);setTimeout(()=>setMsg(''),3000);};
  const s = (k) => content[k]||DEFAULT_CONTENT[k]||'';
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

      {msg&&<div style={{background:msg.includes('✅')?'rgba(34,197,94,0.1)':'rgba(230,57,70,0.1)',border:`1px solid ${msg.includes('✅')?'rgba(34,197,94,0.3)':'rgba(230,57,70,0.3)'}`,padding:'10px 20px',fontSize:'13px',textAlign:'center',color:msg.includes('✅')?'#4ADE80':'#FF6B7A'}}>{msg}</div>}

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
            <Sec title="🎉 Zona Mundial">
              <F label="Título del evento" val={s('event_title')} set={v=>set('event_title',v)} />
              <F label="Descripción" val={s('event_description')} set={v=>set('event_description',v)} />
              <F label="Horario" val={s('event_schedule')} set={v=>set('event_schedule',v)} />
            </Sec>
            <Sec title="⚠️ Avisos">
              <F label="Aviso cierre predicciones" val={s('predictions_lock_notice')} set={v=>set('predictions_lock_notice',v)} />
            </Sec>
            <Sec title="🔗 Links">
              <F label="Web principal Plaza" val={s('link_website')} set={v=>set('link_website',v)} />
              <F label="Instagram" val={s('link_instagram')} set={v=>set('link_instagram',v)} />
              <F label="WhatsApp / Contacto" val={s('link_whatsapp')} set={v=>set('link_whatsapp',v)} />
              <F label="Términos y Condiciones" val={s('link_terms')} set={v=>set('link_terms',v)} />
            </Sec>
            <Sec title="🎨 Colores de la app">
              <p style={{fontSize:'12px',color:'#8899BB',marginBottom:'12px'}}>El color anaranjado de Plaza Las Américas es <strong style={{color:'#E8611A'}}>#E8611A</strong>. Haz clic en el cuadro de color o escribe el código hexadecimal.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
                <CF label="Color primario (dorado/anaranjado)" val={s('color_primary')} set={v=>set('color_primary',v)} />
                <CF label="Color de fondo" val={s('color_background')} set={v=>set('color_background',v)} />
                <CF label="Color de texto" val={s('color_text')} set={v=>set('color_text',v)} />
              </div>
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
            {['grupos','round_of_32','round_of_16','quarterfinals','semifinals','third_place','final'].map(phase=>{
              const pm=matches.filter(m=>m.phase===phase);
              if (!pm.length) return null;
              return (
                <div key={phase} style={{marginBottom:'20px'}}>
                  <div style={{fontSize:'12px',fontWeight:600,color:'#F5C518',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'8px',paddingBottom:'6px',borderBottom:'1px solid rgba(245,197,24,0.15)'}}>{phaseLabels[phase]}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {pm.map(m=>(
                      <div key={m.id} style={{background:'#1E2535',border:`1px solid ${m.status==='finished'?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.07)'}`,borderRadius:'8px',padding:'10px 14px',display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                        <div style={{flex:1,minWidth:'160px'}}>
                          <span style={{fontSize:'13px',fontWeight:500}}>{m.team_a} vs {m.team_b}</span>
                          <div style={{fontSize:'11px',color:'#8899BB',marginTop:'2px'}}>
                            {new Date(m.scheduled_at).toLocaleDateString('es-EC',{day:'numeric',month:'short',timeZone:'America/Guayaquil'})} · {new Date(m.scheduled_at).toLocaleTimeString('es-EC',{hour:'2-digit',minute:'2-digit',timeZone:'America/Guayaquil',hour12:true})}
                          </div>
                        </div>
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
                            <button onClick={()=>updateResult(editResult)} style={{background:'#F5C518',color:'#0A0E1A',fontWeight:700,fontSize:'12px',border:'none',padding:'6px 12px',borderRadius:'6px',cursor:'pointer'}}>Guardar</button>
                            <button onClick={()=>setEditResult(null)} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'#8899BB',fontSize:'12px',padding:'6px 10px',borderRadius:'6px',cursor:'pointer'}}>✕</button>
                          </div>
                        ):(
                          <button onClick={()=>setEditResult({...m,score_a:'',score_b:''})} style={{background:'rgba(245,197,24,0.1)',border:'1px solid rgba(245,197,24,0.2)',color:'#F5C518',fontWeight:600,fontSize:'12px',padding:'6px 14px',borderRadius:'6px',cursor:'pointer'}}>
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
