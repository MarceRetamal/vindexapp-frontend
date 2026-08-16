import { useState } from 'react';
import { api, type Cliente, type DatosCliente } from '../api/cliente';
import { Input } from '@/componentes/ui/input';
import { Textarea } from '@/componentes/ui/textarea';
import { Button } from '@/componentes/ui/button';

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';

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
      className="border border-line rounded-sharp p-5 mb-6 bg-graphite grid grid-cols-2 gap-3"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="cliente-nombre" className={etiquetaClases}>Nombre</label>
        <Input id="cliente-nombre" className={campoClases} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="cliente-apellido" className={etiquetaClases}>Apellido</label>
        <Input id="cliente-apellido" className={campoClases} value={apellido} onChange={(e) => setApellido(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="cliente-dni" className={etiquetaClases}>DNI</label>
        <Input id="cliente-dni" className={campoClases} value={dni} onChange={(e) => setDni(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="cliente-email" className={etiquetaClases}>Email</label>
        <Input id="cliente-email" type="email" className={campoClases} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="cliente-whatsapp" className={etiquetaClases}>WhatsApp</label>
        <Input id="cliente-whatsapp" className={campoClases} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="cliente-telefono" className={etiquetaClases}>Teléfono fijo</label>
        <Input id="cliente-telefono" className={campoClases} value={telefonoFijo} onChange={(e) => setTelefonoFijo(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="cliente-domicilio" className={etiquetaClases}>Domicilio</label>
        <Input id="cliente-domicilio" className={campoClases} value={domicilio} onChange={(e) => setDomicilio(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="cliente-localidad" className={etiquetaClases}>Localidad</label>
        <Input id="cliente-localidad" className={campoClases} value={localidad} onChange={(e) => setLocalidad(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1 col-span-2">
        <label htmlFor="cliente-notas" className={etiquetaClases}>Notas</label>
        <Textarea
          id="cliente-notas"
          className={`${campoClases} resize-y min-h-[60px]`}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      {error && <div className="col-span-2 text-warning text-sm">{error}</div>}

      <div className="col-span-2 flex gap-2">
        <Button
          type="submit"
          disabled={enviando}
          className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : cliente ? 'Guardar cambios' : 'Guardar cliente'}
        </Button>
        {onCancelar && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelar}
            disabled={enviando}
            className="rounded-sharp border border-line text-text-gray-light hover:text-white"
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
