import { useState } from 'react';
import { api, type ResultadoLiquidacion, type TipoExtincion } from '../api/liquidaciones';
import { Input } from '@/componentes/ui/input';
import { Button } from '@/componentes/ui/button';
import { ErrorBanner } from '@/componentes/ErrorBanner';

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';

const FORMATO_MONTO = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

const ETIQUETAS_TIPO_EXTINCION: Record<TipoExtincion, string> = {
  despido_sin_causa: 'Despido sin causa',
  despido_con_causa: 'Despido con causa',
  despido_indirecto: 'Despido indirecto',
  renuncia: 'Renuncia',
  mutuo_acuerdo: 'Mutuo acuerdo',
  vencimiento_periodo_prueba: 'Vencimiento de período de prueba',
  fallecimiento_trabajador: 'Fallecimiento del trabajador',
  fallecimiento_empleador: 'Fallecimiento del empleador',
  jubilacion: 'Jubilación',
  incapacidad_permanente: 'Incapacidad permanente',
};

const CONCEPTOS: { clave: keyof ResultadoLiquidacion; etiqueta: string }[] = [
  { clave: 'indemnizacionAntiguedad', etiqueta: 'Indemnización por antigüedad' },
  { clave: 'indemnizacionSustitutivaPreaviso', etiqueta: 'Indemnización sustitutiva de preaviso' },
  { clave: 'integracionMesDespido', etiqueta: 'Integración del mes de despido' },
  { clave: 'sacProporcional', etiqueta: 'SAC proporcional' },
  { clave: 'vacacionesNoGozadas', etiqueta: 'Vacaciones no gozadas' },
  { clave: 'indemnizacionEspecialMaternidadOMatrimonio', etiqueta: 'Indemnización especial (maternidad/matrimonio)' },
];

export function Liquidaciones() {
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [fechaEgreso, setFechaEgreso] = useState('');
  const [mejorRemuneracion, setMejorRemuneracion] = useState('');
  const [tipoExtincion, setTipoExtincion] = useState<TipoExtincion>('despido_sin_causa');
  const [preavisoOtorgado, setPreavisoOtorgado] = useState(false);
  const [diasPreavisoOtorgados, setDiasPreavisoOtorgados] = useState('');
  const [diasTrabajadosAnioEnCurso, setDiasTrabajadosAnioEnCurso] = useState('');
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoLiquidacion | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCalculando(true);
    setError(null);
    setResultado(null);
    try {
      const remuneracion = Number(mejorRemuneracion.replace(',', '.'));
      const dias = Number(diasTrabajadosAnioEnCurso);
      if (!Number.isFinite(remuneracion) || remuneracion <= 0) {
        throw new Error('La mejor remuneración debe ser un número mayor a cero.');
      }
      if (!Number.isFinite(dias) || dias < 0) {
        throw new Error('Los días trabajados en el año en curso deben ser un número mayor o igual a cero.');
      }

      const calculado = await api.calcularCasasParticulares({
        fechaIngreso,
        fechaEgreso,
        mejorRemuneracion: remuneracion,
        tipoExtincion,
        preavisoOtorgado,
        diasPreavisoOtorgados: preavisoOtorgado && diasPreavisoOtorgados ? Number(diasPreavisoOtorgados) : undefined,
        diasTrabajadosAnioEnCurso: dias,
      });
      setResultado(calculado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo calcular la liquidación.');
    } finally {
      setCalculando(false);
    }
  }

  return (
    <div>
      <header className="mb-7">
        <h1 className="text-2xl font-black uppercase tracking-wide text-white">Liquidaciones</h1>
        <p className="text-text-gray-light text-sm mt-1">
          Casas particulares (Ley 26.844) — despido sin causa o indirecto.
          Los regímenes de LCT y Construcción todavía no están disponibles.
        </p>
      </header>

      <form
        onSubmit={enviar}
        className="border border-line rounded-sharp p-5 mb-6 bg-graphite grid grid-cols-2 gap-3"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="liq-fecha-ingreso" className={etiquetaClases}>
            Fecha de ingreso
          </label>
          <Input
            id="liq-fecha-ingreso"
            type="date"
            className={campoClases}
            value={fechaIngreso}
            onChange={(e) => setFechaIngreso(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="liq-fecha-egreso" className={etiquetaClases}>
            Fecha de egreso
          </label>
          <Input
            id="liq-fecha-egreso"
            type="date"
            className={campoClases}
            value={fechaEgreso}
            onChange={(e) => setFechaEgreso(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="liq-remuneracion" className={etiquetaClases}>
            Mejor remuneración mensual ($)
          </label>
          <Input
            id="liq-remuneracion"
            type="number"
            min="0"
            step="0.01"
            className={campoClases}
            value={mejorRemuneracion}
            onChange={(e) => setMejorRemuneracion(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="liq-tipo-extincion" className={etiquetaClases}>
            Tipo de extinción
          </label>
          <select
            id="liq-tipo-extincion"
            className={`${campoClases} h-8 w-full px-2.5 text-sm text-white outline-none border`}
            value={tipoExtincion}
            onChange={(e) => setTipoExtincion(e.target.value as TipoExtincion)}
          >
            {Object.entries(ETIQUETAS_TIPO_EXTINCION).map(([valor, etiqueta]) => (
              <option key={valor} value={valor} className="bg-graphite text-white">
                {etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="liq-dias-trabajados" className={etiquetaClases}>
            Días trabajados en el año en curso
          </label>
          <Input
            id="liq-dias-trabajados"
            type="number"
            min="0"
            step="1"
            className={campoClases}
            value={diasTrabajadosAnioEnCurso}
            onChange={(e) => setDiasTrabajadosAnioEnCurso(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1 justify-end">
          <label htmlFor="liq-preaviso-otorgado" className="flex items-center gap-2 text-sm text-white">
            <input
              id="liq-preaviso-otorgado"
              type="checkbox"
              checked={preavisoOtorgado}
              onChange={(e) => setPreavisoOtorgado(e.target.checked)}
              className="accent-silver"
            />
            Se otorgó preaviso
          </label>
        </div>

        {preavisoOtorgado && (
          <div className="flex flex-col gap-1">
            <label htmlFor="liq-dias-preaviso" className={etiquetaClases}>
              Días de preaviso otorgados
            </label>
            <Input
              id="liq-dias-preaviso"
              type="number"
              min="0"
              step="1"
              className={campoClases}
              value={diasPreavisoOtorgados}
              onChange={(e) => setDiasPreavisoOtorgados(e.target.value)}
            />
          </div>
        )}

        {error && (
          <div className="col-span-2">
            <ErrorBanner message={error} />
          </div>
        )}

        <div className="col-span-2">
          <Button
            type="submit"
            disabled={calculando}
            className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60"
          >
            {calculando ? 'Calculando…' : 'Calcular liquidación'}
          </Button>
        </div>
      </form>

      {resultado && <ResultadoLiquidacionCard resultado={resultado} />}
    </div>
  );
}

function ResultadoLiquidacionCard({ resultado }: { resultado: ResultadoLiquidacion }) {
  return (
    <div className="border border-line rounded-sharp p-5 bg-graphite">
      <div className="mb-4 text-sm text-text-gray-light">
        Antigüedad: {resultado.antiguedad.aniosCompletos} años, {resultado.antiguedad.mesesRestantes} meses
        ({resultado.antiguedad.diasTotales} días totales)
      </div>

      <div className="flex flex-col">
        {CONCEPTOS.map(({ clave, etiqueta }) => (
          <div
            key={clave}
            className="flex justify-between py-2 border-b border-line text-sm text-white"
          >
            <span>{etiqueta}</span>
            <span className="font-mono">
              {FORMATO_MONTO.format(resultado[clave] as number)}
            </span>
          </div>
        ))}
        <div className="flex justify-between pt-3 text-base font-bold text-white">
          <span>Total bruto</span>
          <span className="font-mono">{FORMATO_MONTO.format(resultado.totalBruto)}</span>
        </div>
      </div>

      {resultado.advertencias.length > 0 && (
        <div className="mt-5">
          {resultado.advertencias.map((advertencia, i) => (
            <div key={i} className={i > 0 ? 'mt-2' : ''}>
              <ErrorBanner message={advertencia} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
