import { useState } from 'react';
import { api, type Cliente, type DatosCliente } from '../api/cliente';

const campo: React.CSSProperties = {
  border: '1px solid var(--linea)',
  borderRadius: 'var(--radio)',
  padding: '9px 12px',
  fontSize: 14,
  background: 'var(--papel-elevado)',
};

const etiqueta: React.CSSProperties = { fontSize: 12, color: 'var(--tinta-suave)' };

export function FormularioCliente({
  cliente,
  onGuardado,
  onCancelar,
}: {
  cliente?: Cliente;
  onGuardado: () => void;
  onCancelar?: () => void;
}) {
  const [nombre, setNombre] = useState(cliente?.nombre ?? '');
  const [apellido, setApellido] = useState(cliente?.apellido ?? '');
  const [dni, setDni] = useState(cliente?.dni ?? '');
  const [domicilio, setDomicilio] = useState(cliente?.domicilio ?? '');
  const [localidad, setLocalidad] = useState(cliente?.localidad ?? '');
  const [telefonoFijo, setTelefonoFijo] = useState(cliente?.telefono_fijo ?? '');
  const [whatsapp, setWhatsapp] = useState(cliente?.whatsapp ?? '');
  const [email, setEmail] = useState(cliente?.email ?? '');
  const [notas, setNotas] = useState(cliente?.notas ?? '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const datos: DatosCliente = {
      nombre,
      apellido,
      dni: dni || undefined,
      domicilio: domicilio || undefined,
      localidad: localidad || undefined,
      telefono_fijo: telefonoFijo || undefined,
      whatsapp: whatsapp || undefined,
      email: email || undefined,
      notas: notas || undefined,
    };

    try {
      if (cliente) {
        await api.actualizarCliente(cliente.id, datos);
      } else {
        await api.crearCliente(datos);
      }
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el cliente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      style={{
        border: '1px solid var(--linea)',
        borderRadius: 'var(--radio)',
        padding: 20,
        marginBottom: 24,
        background: 'var(--papel-elevado)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="cliente-nombre" style={etiqueta}>Nombre</label>
        <input id="cliente-nombre" style={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="cliente-apellido" style={etiqueta}>Apellido</label>
        <input id="cliente-apellido" style={campo} value={apellido} onChange={(e) => setApellido(e.target.value)} required />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="cliente-dni" style={etiqueta}>DNI</label>
        <input id="cliente-dni" style={campo} value={dni} onChange={(e) => setDni(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="cliente-email" style={etiqueta}>Email</label>
        <input id="cliente-email" type="email" style={campo} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="cliente-whatsapp" style={etiqueta}>WhatsApp</label>
        <input id="cliente-whatsapp" style={campo} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="cliente-telefono" style={etiqueta}>Teléfono fijo</label>
        <input id="cliente-telefono" style={campo} value={telefonoFijo} onChange={(e) => setTelefonoFijo(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="cliente-domicilio" style={etiqueta}>Domicilio</label>
        <input id="cliente-domicilio" style={campo} value={domicilio} onChange={(e) => setDomicilio(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="cliente-localidad" style={etiqueta}>Localidad</label>
        <input id="cliente-localidad" style={campo} value={localidad} onChange={(e) => setLocalidad(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
        <label htmlFor="cliente-notas" style={etiqueta}>Notas</label>
        <textarea
          id="cliente-notas"
          style={{ ...campo, resize: 'vertical', minHeight: 60 }}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      {error && (
        <div style={{ gridColumn: '1 / -1', color: 'var(--alerta)', fontSize: 13 }}>{error}</div>
      )}

      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
        <button
          type="submit"
          disabled={enviando}
          style={{
            background: 'var(--acento)',
            color: 'var(--papel)',
            border: 'none',
            borderRadius: 'var(--radio)',
            padding: '9px 18px',
            fontSize: 14,
            fontWeight: 600,
            opacity: enviando ? 0.6 : 1,
          }}
        >
          {enviando ? 'Guardando…' : cliente ? 'Guardar cambios' : 'Guardar cliente'}
        </button>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={enviando}
            style={{
              background: 'transparent',
              color: 'var(--tinta-suave)',
              border: '1px solid var(--linea)',
              borderRadius: 'var(--radio)',
              padding: '9px 18px',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
