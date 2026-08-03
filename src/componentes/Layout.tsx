import { NavLink, Outlet } from 'react-router-dom';

const SECCIONES = [
  { ruta: '/clientes', etiqueta: 'Clientes' },
  { ruta: '/expedientes', etiqueta: 'Expedientes' },
  { ruta: '/presupuestos', etiqueta: 'Presupuestos' },
  { ruta: '/agenda', etiqueta: 'Agenda' },
];

export function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 220,
          borderRight: '1px solid var(--linea)',
          padding: '28px 20px',
          background: 'var(--papel-elevado)',
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--fuente-titulo)', fontSize: 20, fontWeight: 600 }}>
            VINDEX <span style={{ color: 'var(--acento)' }}>LEGAL</span>
          </div>
          <div
            style={{
              fontFamily: 'var(--fuente-dato)',
              fontSize: 11,
              color: 'var(--tinta-suave)',
              marginTop: 2,
              letterSpacing: '0.04em',
            }}
          >
            GESTIÓN INTERNA
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SECCIONES.map((s) => (
            <NavLink
              key={s.ruta}
              to={s.ruta}
              style={({ isActive }) => ({
                padding: '9px 12px',
                borderRadius: 'var(--radio)',
                textDecoration: 'none',
                color: isActive ? 'var(--acento)' : 'var(--tinta)',
                background: isActive ? 'var(--acento-suave)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: 14,
              })}
            >
              {s.etiqueta}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '32px 40px', maxWidth: 1100 }}>
        <Outlet />
      </main>
    </div>
  );
}
