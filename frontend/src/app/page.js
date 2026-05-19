'use client';
import { useState } from 'react';


export default function Home() {
  const [currentPage, setCurrentPage] = useState('landing');

  return (
    <main style={{ minHeight: '100vh', background: 'var(--dark)', color: 'var(--text)' }}>
      <Nav currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {currentPage === 'landing' && <LandingPage setCurrentPage={setCurrentPage} />}
      {currentPage === 'registro' && <RegistroPage setCurrentPage={setCurrentPage} />}
      {currentPage === 'predicciones' && <PrediccionesPage />}
      {currentPage === 'dashboard' && <DashboardPage />}
      {currentPage === 'ranking' && <RankingPage />}
      {currentPage === 'promos' && <PromosPage />}
    </main>
  );
}

function Nav({ currentPage, setCurrentPage }) {
  const tabs = [
    { id: 'landing', label: 'Inicio' },
    { id: 'predicciones', label: 'Predicciones' },
    { id: 'dashboard', label: 'Mi Reto' },
    { id: 'ranking', label: 'Ranking' },
    { id: 'promos', label: 'Plaza' },
  ];
  return (
    <nav style={{
      background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(12px)',
      padding: '0 16px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: '56px',
      borderBottom: '1px solid rgba(245,197,24,0.15)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      <div style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 900, fontSize: '18px', letterSpacing: '1px', color: 'var(--gold)', textTransform: 'uppercase' }}>
        Reto <span style={{ color: 'var(--text)' }}>Mundial</span>
      </div>
      <div style={{ display: 'flex', gap: '2px', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setCurrentPage(t.id)} style={{
            background: currentPage === t.id ? 'rgba(245,197,24,0.12)' : 'none',
            border: 'none', color: currentPage === t.id ? 'var(--gold)' : 'var(--muted)',
            fontFamily: 'var(--font-body,sans-serif)', fontSize: '12px', fontWeight: 500,
            padding: '6px 10px', borderRadius: '6px', cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap'
          }}>{t.label}</button>
        ))}
      </div>
    </nav>
  );
}

function LandingPage({ setCurrentPage }) {
  return (
    <div>
      {/* HERO */}
      <div style={{ background: 'linear-gradient(160deg,#0A0E1A 0%,#1a1025 40%,#0d1a0a 100%)', padding: '48px 20px 64px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245,197,24,0.15)', border: '1px solid rgba(245,197,24,0.3)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: 600, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
          ⚽ FIFA World Cup 2026
        </div>
        <h1 style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 900, fontSize: 'clamp(40px,8vw,68px)', lineHeight: .95, letterSpacing: '-1px', textTransform: 'uppercase', marginBottom: '12px' }}>
          RETO<br />
          <span style={{ color: 'var(--gold)' }}>MUNDIALISTA</span><br />
          <span style={{ fontSize: 'clamp(18px,4vw,28px)', fontWeight: 600, color: 'var(--muted)', letterSpacing: '2px' }}>Plaza Las Américas</span>
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--muted)', maxWidth: '480px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          Predice todos los partidos del Mundial 2026, acumula puntos en tiempo real y gana premios exclusivos de Plaza Las Américas.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setCurrentPage('registro')} style={{ background: 'var(--gold)', color: 'var(--dark)', fontFamily: 'var(--font-head,sans-serif)', fontWeight: 800, fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', border: 'none', padding: '14px 36px', borderRadius: '8px', cursor: 'pointer' }}>
            🏆 Participar Gratis
          </button>
          <button onClick={() => setCurrentPage('predicciones')} style={{ background: 'transparent', color: 'var(--text)', fontFamily: 'var(--font-head,sans-serif)', fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' }}>
            Ver Partidos
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', padding: '24px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
        {[['104','Partidos'],['32','Selecciones'],['100%','Gratuito'],['Jun 11','Inicio']].map(([n,l]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 800, fontSize: '28px', color: 'var(--gold)', lineHeight: 1 }}>{n}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: '2px' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* PUNTOS */}
      <div style={{ padding: '32px 20px' }}>
        <h2 style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 800, fontSize: '22px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
          Sistema de <span style={{ color: 'var(--gold)' }}>Puntos</span>
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>Máximo 5 puntos por partido</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[['⚡ Marcador exacto','5 pts','var(--gold)'],['✅ Ganador o empate','3 pts','var(--blue)'],['📊 Diferencia de goles','2 pts','var(--orange)'],['🎯 Goles de un equipo','1 pt','var(--muted)']].map(([label,pts,color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card)', borderRadius: '8px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '14px' }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 800, fontSize: '20px', color }}>{pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegistroPage({ setCurrentPage }) {
  const [form, setForm] = useState({ nombre:'', cedula:'', celular:'', email:'', ciudad:'', nacimiento:'', terminos:false, marketing:false });
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = () => {
    if (!form.terminos) { alert('Debes aceptar los términos y condiciones'); return; }
    if (!form.nombre || !form.cedula || !form.email) { alert('Por favor llena todos los campos obligatorios'); return; }
    setEnviado(true);
    setTimeout(() => setCurrentPage('predicciones'), 2000);
  };

  if (enviado) return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
      <h2 style={{ fontFamily: 'var(--font-head,sans-serif)', fontSize: '28px', fontWeight: 800, color: 'var(--gold)', marginBottom: '8px' }}>¡REGISTRO EXITOSO!</h2>
      <p style={{ color: 'var(--muted)' }}>Redirigiendo a tus predicciones...</p>
    </div>
  );

  return (
    <div style={{ padding: '24px 20px' }}>
      <h2 style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 800, fontSize: '22px', textTransform: 'uppercase', marginBottom: '4px' }}>Registro <span style={{ color: 'var(--gold)' }}>Gratuito</span></h2>
      <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>Únete al Reto Mundialista Plaza Las Américas 2026</p>
      <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[['Nombre completo','nombre','text','Tu nombre completo'],['Cédula / Pasaporte','cedula','text','0123456789'],['Celular','celular','tel','0991234567'],['Email','email','email','correo@ejemplo.com'],['Ciudad','ciudad','text','Guayaquil'],['Fecha de nacimiento','nacimiento','date','']].map(([label,key,type,placeholder]) => (
            <div key={key}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '5px' }}>{label}</label>
              <input type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})}
                style={{ width: '100%', background: 'var(--dark3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px', outline: 'none' }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[['terminos','Acepto los términos y condiciones del Reto Mundialista Plaza Las Américas'],['marketing','Acepto recibir comunicaciones comerciales y promociones de Plaza Las Américas']].map(([key,label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form[key]} onChange={e => setForm({...form,[key]:e.target.checked})} style={{ marginTop: '2px', accentColor: 'var(--gold)', width: '16px', height: '16px', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>{label}</span>
            </label>
          ))}
        </div>
        <button onClick={handleSubmit} style={{ width: '100%', marginTop: '18px', background: 'var(--gold)', color: 'var(--dark)', fontFamily: 'var(--font-head,sans-serif)', fontWeight: 800, fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', border: 'none', padding: '14px', borderRadius: '8px', cursor: 'pointer' }}>
          Registrarme y hacer mis predicciones →
        </button>
      </div>
    </div>
  );
}

function PrediccionesPage() {
  const partidos = [
    { fase:'Grupo A', a:'🇲🇽 México', b:'TBD', fecha:'Jun 11', hora:'18:00', estado:'pendiente' },
    { fase:'Grupo B', a:'🇺🇸 USA', b:'TBD', fecha:'Jun 12', hora:'19:00', estado:'pendiente' },
    { fase:'Grupo C', a:'🇨🇦 Canadá', b:'TBD', fecha:'Jun 12', hora:'15:00', estado:'pendiente' },
    { fase:'Grupo D', a:'🇪🇨 Ecuador', b:'TBD', fecha:'Jun 13', hora:'21:00', estado:'pendiente' },
    { fase:'Grupo E', a:'TBD', b:'TBD', fecha:'Jun 14', hora:'15:00', estado:'pendiente' },
    { fase:'Grupo F', a:'TBD', b:'TBD', fecha:'Jun 14', hora:'18:00', estado:'pendiente' },
  ];
  const [scores, setScores] = useState({});

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 800, fontSize: '22px', textTransform: 'uppercase', marginBottom: '4px' }}>Mis <span style={{ color: 'var(--gold)' }}>Predicciones</span></h2>
      <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>Ingresa el marcador que crees que tendrá cada partido</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {partidos.map((p, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: 'rgba(245,197,24,0.12)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontWeight: 600, color: 'var(--gold)', whiteSpace: 'nowrap' }}>{p.fase}</span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <span style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 700, fontSize: '13px' }}>{p.a}</span>
              <span style={{ color: 'var(--muted)', fontSize: '11px' }}>vs</span>
              <span style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 700, fontSize: '13px' }}>{p.b}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="number" min="0" max="20" placeholder="0" value={scores[`${i}a`]||''} onChange={e => setScores({...scores,[`${i}a`]:e.target.value})}
                style={{ width: '36px', height: '36px', background: 'var(--dark3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: 'var(--text)', fontWeight: 700, fontSize: '16px', textAlign: 'center', outline: 'none' }} />
              <span style={{ color: 'var(--muted)', fontWeight: 700 }}>-</span>
              <input type="number" min="0" max="20" placeholder="0" value={scores[`${i}b`]||''} onChange={e => setScores({...scores,[`${i}b`]:e.target.value})}
                style={{ width: '36px', height: '36px', background: 'var(--dark3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: 'var(--text)', fontWeight: 700, fontSize: '16px', textAlign: 'center', outline: 'none' }} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'right', minWidth: '60px' }}>
              <div>{p.fecha}</div>
              <div>{p.hora}</div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', marginTop: '12px' }}>⚠️ Predicciones se bloquean el 10 de junio a las 23:59 hora Ecuador</p>
    </div>
  );
}

function DashboardPage() {
  return (
    <div style={{ padding: '24px 20px' }}>
      <h2 style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 800, fontSize: '22px', textTransform: 'uppercase', marginBottom: '16px' }}>Mi <span style={{ color: 'var(--gold)' }}>Dashboard</span></h2>
      <div style={{ background: 'var(--card3,var(--dark3))', border: '1px solid rgba(245,197,24,0.15)', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Posición Global</div>
            <div style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 900, fontSize: '42px', color: 'var(--gold)', lineHeight: 1 }}>#47</div>
            <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '2px' }}>▲ Subiste 12 posiciones hoy</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Puntos</div>
            <div style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 900, fontSize: '52px', color: 'var(--text)', lineHeight: 1 }}>387</div>
          </div>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', margin: '12px 0 6px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '38%', background: 'var(--gold)', borderRadius: '3px' }}></div>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Te faltan 63 pts para alcanzar el #30</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[['28','Partidos acertados','var(--text)'],['7','Marcadores exactos','var(--gold)'],['63%','% de aciertos','var(--green)'],['🔥 4','Racha actual','var(--orange)']].map(([n,l,c]) => (
          <div key={l} style={{ background: 'var(--dark)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-head,sans-serif)', fontSize: '24px', fontWeight: 800, color: c }}>{n}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingPage() {
  const ranking = [
    { pos:1, nombre:'Carlos Mendoza', ciudad:'Guayaquil', pts:624, trend:'+2' },
    { pos:2, nombre:'María Zambrano', ciudad:'Quito', pts:598, trend:'+5' },
    { pos:3, nombre:'Andrés López', ciudad:'Cuenca', pts:581, trend:'-1' },
    { pos:4, nombre:'Sofía Torres', ciudad:'Quito', pts:562, trend:'+8' },
    { pos:5, nombre:'Pedro Gómez', ciudad:'Guayaquil', pts:547, trend:'-2' },
    { pos:47, nombre:'Juan Rodríguez (Tú)', ciudad:'Quito', pts:387, trend:'+12', mine:true },
  ];
  return (
    <div style={{ padding: '24px 20px' }}>
      <h2 style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 800, fontSize: '22px', textTransform: 'uppercase', marginBottom: '16px' }}>Ranking <span style={{ color: 'var(--gold)' }}>Global</span></h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {ranking.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: r.mine ? 'rgba(245,197,24,0.04)' : 'var(--card)', border: `1px solid ${r.mine ? 'rgba(245,197,24,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px', padding: '10px 14px' }}>
            <span style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 800, fontSize: '20px', color: r.pos <= 3 ? 'var(--gold)' : 'var(--muted)', width: '28px', textAlign: 'center', flexShrink: 0 }}>{r.pos}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{r.nombre}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.ciudad}</div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: r.trend.startsWith('+') ? 'var(--green)' : 'var(--red)' }}>{r.trend}</span>
            <span style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 700, fontSize: '18px', color: 'var(--gold)' }}>{r.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromosPage() {
  const promos = [
    { emoji:'🍔', store:'Food Court', nombre:'Combo Mundial', desc:'2x1 en combo burger durante los partidos' },
    { emoji:'👕', store:'Deportes', nombre:'20% OFF camisetas', desc:'Camisetas oficiales selecciones' },
    { emoji:'🎁', store:'Premio Especial', nombre:'Gift Card $500', desc:'Para el ganador del reto mundialista' },
    { emoji:'☕', store:'Cafeterías', nombre:'Café & Partido', desc:'Café + snack por $3.99' },
    { emoji:'🎮', store:'Entretenimiento', nombre:'Zona Gaming', desc:'FIFA 26 gratis para top 100' },
    { emoji:'🍕', store:'Restaurantes', nombre:'Pizza Party', desc:'Paquete familiar especial' },
  ];
  return (
    <div style={{ padding: '24px 20px' }}>
      <h2 style={{ fontFamily: 'var(--font-head,sans-serif)', fontWeight: 800, fontSize: '22px', textTransform: 'uppercase', marginBottom: '4px' }}>Plaza Las <span style={{ color: 'var(--gold)' }}>Américas</span></h2>
      <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>Promociones mundialistas exclusivas para participantes</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '10px' }}>
        {promos.map((p, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', background: 'rgba(255,255,255,0.03)' }}>{p.emoji}</div>
            <div style={{ padding: '10px' }}>
              <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase' }}>{p.store}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{p.nombre}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
