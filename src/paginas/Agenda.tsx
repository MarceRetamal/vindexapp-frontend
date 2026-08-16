import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api, type Audiencia } from '../api/audiencias';
import { api as expedientesApi, type Expediente } from '../api/expedientes';
import { PageHeader } from '../componentes/PageHeader';
import { Row } from '../componentes/Row';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';

const MODALIDADES = ['Presencial', 'Videoconferencia', 'Telefónica'] as const;

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';

export function Agenda() {
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  function cargar() {
    setCargando(true);
    setError(null);
    Promise.all([api.listarAudiencias(), expedientesApi.listarExpedientes()])
      .then(([a, e]) => {
        setAudiencias(a);
        setExpedientes(e);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  const expedientesPorId = new Map(expedientes.map((e) => [e.id, e]));

  return (
    <div>
      <PageHeader
        title="Agenda"
        count={audiencias.length}
        ctaLabel={mostrarFormulario ? 'Cancelar' : '+ Nueva audiencia'}
        onCta={() => setMostrarFormulario((v) => !v)}
      />

      {mostrarFormulario && (
        <FormularioNuevaAudiencia
          expedientes={expedientes}
          onCreado={() => {
            setMostrarFormulario(false);
            cargar();
          }}
        />
      )}

      {error && <ErrorBanner message={`No se pudo cargar el listado: ${error}`} />}

      {cargando ? (
        <ListSkeleton rows={6} />
      ) : audiencias.length === 0 ? (
        <EmptyState message='Todavía no hay audiencias cargadas. Usá "Nueva audiencia" para agregar la primera.' />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {audiencias.map((a, i) => (
            <FilaAudiencia
              key={a.id}
              audiencia={a}
              index={i + 1}
              expediente={expedientesPorId.get(a.expediente_id)}
              onCambiado={cargar}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function FilaAudiencia({
  audiencia,
  index,
  expediente,
  onCambiado,
}: {
  audiencia: Audiencia;
  index: number;
  expediente?: Expediente;
  onCambiado: () => void;
}) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function transicionar(estado: 'Realizada' | 'Suspendida' | 'Cancelada') {
    setProcesando(true);
    setError(null);
    try {
      await api.cambiarEstado(audiencia.id, estado);
      onCambiado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div>
      <Row
        index={index}
        to={expediente ? `/expedientes/${expediente.id}` : '/agenda'}
        actions={
          <>
            {audiencia.estado === 'Programada' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={procesando}
                  onClick={(e) => {
                    e.preventDefault();
                    transicionar('Realizada');
                  }}
                  className="rounded-sharp border border-line text-text-gray-light hover:text-white"
                >
                  Realizada
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={procesando}
                  onClick={(e) => {
                    e.preventDefault();
                    transicionar('Suspendida');
                  }}
                  className="rounded-sharp border border-line text-text-gray-light hover:text-white"
                >
                  Suspender
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={procesando}
                  onClick={(e) => {
                    e.preventDefault();
                    transicionar('Cancelada');
                  }}
                  className="rounded-sharp border border-line text-text-gray-light hover:text-white"
                >
                  Cancelar
                </Button>
              </>
            )}
            <EstadoBadge
              estado={audiencia.estado}
              colorMap={{
                Programada: 'warning',
                Realizada: 'success',
                Suspendida: 'warning',
                Cancelada: 'neutral',
              }}
            />
          </>
        }
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs text-text-gray-light font-mono whitespace-nowrap">
            {audiencia.fecha}
            {audiencia.hora ? ` ${audiencia.hora}` : ''}
          </span>
          <div className="min-w-0">
            <div className="font-bold text-white truncate">{audiencia.tipo}</div>
            <div className="text-xs text-text-gray-light truncate">
              {expediente ? expediente.caratula : 'Expediente no encontrado'}
              {audiencia.modalidad ? ` · ${audiencia.modalidad}` : ''}
              {audiencia.lugar ? ` · ${audiencia.lugar}` : ''}
            </div>
          </div>
        </div>
      </Row>

      {error && <div className="text-warning text-xs pb-3">{error}</div>}
    </div>
  );
}

function FormularioNuevaAudiencia({
  expedientes,
  onCreado,
}: {
  expedientes: Expediente[];
  onCreado: () => void;
}) {
  const [expedienteId, setExpedienteId] = useState('');
  const [tipo, setTipo] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [modalidad, setModalidad] = useState<(typeof MODALIDADES)[number] | ''>('');
  const [lugar, setLugar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.crearAudiencia({
        expediente_id: expedienteId,
        tipo,
        fecha,
        hora: hora || undefined,
        modalidad: modalidad || undefined,
        lugar: lugar || undefined,
      });
      onCreado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la audiencia.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="border border-line rounded-sharp p-5 mb-6 bg-graphite grid grid-cols-2 gap-3"
    >
      {expedientes.length === 0 && (
        <div className="col-span-2">
          <ErrorBanner message="Todavía no hay expedientes cargados. Creá uno primero en la sección Expedientes." />
        </div>
      )}

      <div className="flex flex-col gap-1 col-span-2">
        <label htmlFor="nueva-audiencia-expediente" className={etiquetaClases}>Expediente</label>
        <select
          id="nueva-audiencia-expediente"
          value={expedienteId}
          onChange={(e) => setExpedienteId(e.target.value)}
          required
          className={`${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`}
        >
          <option value="" disabled>Elegí un expediente</option>
          {expedientes.map((e) => (
            <option key={e.id} value={e.id} className="bg-graphite text-white">
              {e.caratula}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="nueva-audiencia-tipo" className={etiquetaClases}>Tipo</label>
        <Input
          id="nueva-audiencia-tipo"
          className={campoClases}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          placeholder="Audiencia de conciliación"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nueva-audiencia-modalidad" className={etiquetaClases}>Modalidad</label>
        <select
          id="nueva-audiencia-modalidad"
          value={modalidad}
          onChange={(e) => setModalidad(e.target.value as (typeof MODALIDADES)[number] | '')}
          className={`${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`}
        >
          <option value="">Sin especificar</option>
          {MODALIDADES.map((m) => (
            <option key={m} value={m} className="bg-graphite text-white">{m}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nueva-audiencia-fecha" className={etiquetaClases}>Fecha</label>
        <Input id="nueva-audiencia-fecha" type="date" className={campoClases} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nueva-audiencia-hora" className={etiquetaClases}>Hora</label>
        <Input id="nueva-audiencia-hora" type="time" className={campoClases} value={hora} onChange={(e) => setHora(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1 col-span-2">
        <label htmlFor="nueva-audiencia-lugar" className={etiquetaClases}>Lugar</label>
        <Input id="nueva-audiencia-lugar" className={campoClases} value={lugar} onChange={(e) => setLugar(e.target.value)} />
      </div>

      {error && <div className="col-span-2 text-warning text-sm">{error}</div>}

      <div className="col-span-2">
        <Button
          type="submit"
          disabled={enviando || expedientes.length === 0}
          className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : 'Guardar audiencia'}
        </Button>
      </div>
    </form>
  );
}
