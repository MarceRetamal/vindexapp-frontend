import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api as expedientesApi, type Expediente } from '../api/expedientes';
import { api as presupuestosApi, type Presupuesto } from '../api/presupuestos';

const FORMATO_MONTO = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

/**
 * Lo que hay que saber de un cliente antes de abrir nada: cuántas causas tiene, si hay algo sin revisar del portal y
 * cómo van los honorarios. Todo sale de lo ya cargado.
 */
export function SituacionCliente({ clienteId }: { clienteId: string }) {
  const [expedientes, setExpedientes] = useState<Expediente[] | null>(null);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[] | null>(null);

  useEffect(() => {
    expedientesApi.listarDeCliente(clienteId).then(setExpedientes).catch(() => setExpedientes(null));
    presupuestosApi
      .listarPresupuestos()
      .then((todos) => setPresupuestos(todos.filter((p) => p.cliente_id === clienteId)))
      .catch(() => setPresupuestos(null));
  }, [clienteId]);

  const vigentes = expedientes?.filter((e) => e.estado !== 'Archivado') ?? [];
  const pendientes = vigentes.reduce((total, e) => total + (e.novedades_pendientes ?? 0), 0);
  const vinculadas = vigentes.reduce((total, e) => total + (e.causas_portal ?? 0), 0);
  const firmado = (presupuestos ?? []).filter((p) => p.estado === 'firmado').reduce((t, p) => t + p.monto, 0);
  const enCurso = (presupuestos ?? []).filter((p) => p.estado === 'borrador' || p.estado === 'enviado').reduce((t, p) => t + p.monto, 0);

  return (
    <section aria-label="Situación del cliente" className="mb-8 grid gap-3 md:grid-cols-3">
      <div className="superficie p-5">
        <p className="eyebrow">Expedientes</p>
        {expedientes === null ? (
          <p className="mt-3 text-sm text-text-gray-light">Sin datos.</p>
        ) : (
          <div className="mt-3">
            <div className="text-[26px] font-light leading-none tabular-nums text-white">{vigentes.length}</div>
            <div className="mt-2 text-xs text-text-gray-light">
              {vigentes.length === 1 ? 'vigente' : 'vigentes'}
              {expedientes.length > vigentes.length ? ` · ${expedientes.length - vigentes.length} archivados` : ''}
            </div>
          </div>
        )}
      </div>

      <div className="superficie p-5">
        <p className="eyebrow">Portal de notificaciones</p>
        {expedientes === null ? (
          <p className="mt-3 text-sm text-text-gray-light">Sin datos.</p>
        ) : vinculadas === 0 ? (
          <div className="mt-3">
            <div className="text-[15px] font-bold text-white">Sin causas vinculadas</div>
            <div className="mt-1 text-xs text-text-gray-light">Más abajo vemos si el portal tiene causas de este cliente.</div>
          </div>
        ) : (
          <div className="mt-3">
            <div className={`text-[15px] font-bold ${pendientes > 0 ? 'text-warning' : 'text-white'}`}>
              {pendientes > 0 ? `${pendientes} ${pendientes === 1 ? 'novedad sin revisar' : 'novedades sin revisar'}` : 'Al día'}
            </div>
            <div className="mt-1 text-xs text-silver-deep">
              {vinculadas} {vinculadas === 1 ? 'causa vinculada' : 'causas vinculadas'}
              {pendientes > 0 && (
                <>
                  {' · '}
                  <Link to="/novedades" className="text-silver underline-offset-4 hover:text-white hover:underline">Ver novedades</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="superficie p-5">
        <p className="eyebrow">Honorarios</p>
        {presupuestos === null ? (
          <p className="mt-3 text-sm text-text-gray-light">Sin datos.</p>
        ) : presupuestos.length === 0 ? (
          <div className="mt-3">
            <div className="text-[15px] font-bold text-white">Sin presupuestos</div>
            <Link to="/presupuestos" className="mt-1 inline-block text-xs text-silver underline-offset-4 hover:text-white hover:underline">
              Cargar un presupuesto
            </Link>
          </div>
        ) : (
          <div className="mt-3">
            <div className="text-[26px] font-light leading-none tabular-nums text-white">{FORMATO_MONTO.format(firmado / 100)}</div>
            <div className="mt-2 text-xs text-text-gray-light">
              firmado{enCurso > 0 ? ` · ${FORMATO_MONTO.format(enCurso / 100)} en curso` : ''}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
