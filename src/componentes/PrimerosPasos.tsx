import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { api as alertasApi } from '../api/alertas';
import { api as clientesApi } from '../api/cliente';
import { api as expedientesApi } from '../api/expedientes';
import { api as portalApi } from '../api/portal';

interface Paso {
  titulo: string;
  detalle: string;
  hecho: boolean;
  /** Dónde se hace. Sin destino, el paso lo resuelve quien configuró el sistema. */
  a?: string;
}

/**
 * Qué hacer primero en un estudio vacío. Cada paso se marca solo cuando ya está hecho: no hay nada que tildar a mano.
 * Los dos últimos (portal y avisos por WhatsApp) los carga el propio titular en Configuración.
 */
export function PrimerosPasos() {
  const [pasos, setPasos] = useState<Paso[] | null>(null);

  useEffect(() => {
    Promise.allSettled([clientesApi.listarClientes(), expedientesApi.listarExpedientes(), portalApi.obtenerEstado(), alertasApi.obtenerEstado()]).then(([c, e, p, w]) => {
      const clientes = c.status === 'fulfilled' ? c.value.length : 0;
      const expedientes = e.status === 'fulfilled' ? e.value.length : 0;
      const portal = p.status === 'fulfilled' && p.value.configurado;
      const whatsapp = w.status === 'fulfilled' && w.value.whatsapp.configurado && w.value.whatsapp.estudio_correcto;
      setPasos([
        { titulo: 'Cargá tu primer cliente', detalle: 'Con su teléfono y mail, para tener a mano WhatsApp, llamada y mail desde su ficha.', hecho: clientes > 0, a: '/clientes' },
        { titulo: 'Cargá un expediente', detalle: 'Carátula, número y juzgado. Si el portal ya lo leyó, lo vinculás desde la ficha del cliente.', hecho: expedientes > 0, a: '/expedientes' },
        { titulo: 'Conectá el portal de la SCBA', detalle: 'Cargás tu domicilio electrónico y tu contraseña una sola vez; el sistema lee las notificaciones solo y te propone el plazo de cada una.', hecho: portal, a: '/configuracion' },
        { titulo: 'Activá los avisos por WhatsApp', detalle: 'Cargás tu número y lo confirmás con un código. Un resumen a la mañana, un recordatorio antes de cada audiencia y lo que vence hoy a la tarde.', hecho: whatsapp, a: '/configuracion' },
      ]);
    });
  }, []);

  if (!pasos) return null;
  const hechos = pasos.filter((p) => p.hecho).length;

  return (
    <section aria-label="Primeros pasos" className="superficie p-6 sm:p-8">
      <p className="eyebrow">Primeros pasos</p>
      <h2 className="mt-2 text-xl font-black text-white">Dejá el estudio andando en cuatro pasos</h2>
      <p className="mt-1 text-sm text-silver-deep">{hechos} de {pasos.length} listos. Se tildan solos a medida que los hacés.</p>

      <ol className="mt-6 flex flex-col gap-3">
        {pasos.map((p, i) => (
          <li key={p.titulo} className="flex items-start gap-4 rounded-md border border-line p-4">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${p.hecho ? 'border-success text-success' : 'border-silver-deep/60 text-silver'}`}
              aria-hidden="true"
            >
              {p.hecho ? <CheckIcon className="h-4 w-4" strokeWidth={2} /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className={`text-[15px] font-bold ${p.hecho ? 'text-text-gray-light line-through' : 'text-white'}`}>{p.titulo}</div>
              <p className="mt-0.5 text-xs leading-relaxed text-text-gray-light">{p.detalle}</p>
            </div>
            {!p.hecho && p.a && (
              <Link to={p.a} className="inline-flex shrink-0 items-center gap-1.5 text-xs text-silver transition-colors hover:text-white">
                Empezar <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={1.6} />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
