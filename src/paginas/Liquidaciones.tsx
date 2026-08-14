import { useState } from 'react';
import { api, type ResultadoLiquidacion, type TipoExtincion } from '../api/liquidaciones';

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

  const campo: React.CSSProperties = {
    border: '1px solid var(--linea)',
    borderRadius: 'var(--radio)',
    padding: '9px 12px',
    fontSize: 14,
    background: 'var(--papel-elevado)',
  };

  const etiquetaCampo: React.CSSProperties = { fontSize: 12, color: 'var(--tinta-suave)' };

  return (
    <div>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26 }}>Liquidaciones</h1>
        <p style={{ color: 'var(--tinta-suave)', margin: '4px 0 0', fontSize: 13 }}>
          Casas particulares (Ley 26.844) — despido sin causa o indirecto.
          Los regímenes de LCT y Construcción todavía no están disponibles.
        </p>
      </header>

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
          <label htmlFor="liq-fecha-ingreso" style={etiquetaCampo}>
            Fecha de ingreso
          </label>
          <input
            id="liq-fecha-ingreso"
            type="date"
            style={campo}
            value={fechaIngreso}
            onChange={(e) => setFechaIngreso(e.target.value)}
            required
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="liq-fecha-egreso" style={etiquetaCampo}>
            Fecha de egreso
          </label>
          <input
            id="liq-fecha-egreso"
            type="date"
            style={campo}
            value={fechaEgreso}
            onChange={(e) => setFechaEgreso(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="liq-remuneracion" style={etiquetaCampo}>
            Mejor remuneración mensual ($)
          </label>
          <input
            id="liq-remuneracion"
            type="number"
            min="0"
            step="0.01"
            style={campo}
            value={mejorRemuneracion}
            onChange={(e) => setMejorRemuneracion(e.target.value)}
            required
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="liq-tipo-extincion" style={etiquetaCampo}>
            Tipo de extinción
          </label>
          <select
            id="liq-tipo-extincion"
            style={campo}
            value={tipoExtincion}
            onChange={(e) => setTipoExtincion(e.target.value as TipoExtincion)}
          >
            {Object.entries(ETIQUETAS_TIPO_EXTINCION).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="liq-dias-trabajados" style={etiquetaCampo}>
            Días trabajados en el año en curso
          </label>
          <input
            id="liq-dias-trabajados"
            type="number"
            min="0"
            step="1"
            style={campo}
            value={diasTrabajadosAnioEnCurso}
            onChange={(e) => setDiasTrabajadosAnioEnCurso(e.target.value)}
            required
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'flex-end' }}>
          <label htmlFor="liq-preaviso-otorgado" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input
              id="liq-preaviso-otorgado"
              type="checkbox"
              checked={preavisoOtorgado}
              onChange={(e) => setPreavisoOtorgado(e.target.checked)}
            />
            Se otorgó preaviso
          </label>
        </div>

        {preavisoOtorgado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="liq-dias-preaviso" style={etiquetaCampo}>
              Días de preaviso otorgados
            </label>
            <input
              id="liq-dias-preaviso"
              type="number"
              min="0"
              step="1"
              style={campo}
              value={diasPreavisoOtorgados}
              onChange={(e) => setDiasPreavisoOtorgados(e.target.value)}
            />
          </div>
        )}

        {error && (
          <div style={{ gridColumn: '1 / -1', color: 'var(--alerta)', fontSize: 13 }}>{error}</div>
        )}

        <div style={{ gridColumn: '1 / -1' }}>
          <button
            type="submit"
            disabled={calculando}
            style={{
              background: 'var(--acento)',
              color: 'var(--papel)',
              border: 'none',
              borderRadius: 'var(--radio)',
              padding: '9px 18px',
              fontSize: 14,
              fontWeight: 600,
              opacity: calculando ? 0.6 : 1,
            }}
          >
            {calculando ? 'Calculando…' : 'Calcular liquidación'}
          </button>
        </div>
      </form>

      {resultado && <ResultadoLiquidacionCard resultado={resultado} />}
    </div>
  );
}

function ResultadoLiquidacionCard({ resultado }: { resultado: ResultadoLiquidacion }) {
  return (
    <div
      style={{
        border: '1px solid var(--linea)',
        borderRadius: 'var(--radio)',
        padding: 20,
        background: 'var(--papel-elevado)',
      }}
    >
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--tinta-suave)' }}>
        Antigüedad: {resultado.antiguedad.aniosCompletos} años, {resultado.antiguedad.mesesRestantes} meses
        ({resultado.antiguedad.diasTotales} días totales)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {CONCEPTOS.map(({ clave, etiqueta }) => (
          <div
            key={clave}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid var(--linea)',
              fontSize: 13,
            }}
          >
            <span>{etiqueta}</span>
            <span style={{ fontFamily: 'var(--fuente-dato)' }}>
              {FORMATO_MONTO.format(resultado[clave] as number)}
            </span>
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 0 0',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          <span>Total bruto</span>
          <span style={{ fontFamily: 'var(--fuente-dato)' }}>{FORMATO_MONTO.format(resultado.totalBruto)}</span>
        </div>
      </div>

      {resultado.advertencias.length > 0 && (
        <div
          style={{
            marginTop: 20,
            background: '#fdf1ef',
            border: '1px solid var(--alerta)',
            borderRadius: 'var(--radio)',
            padding: '12px 16px',
          }}
        >
          {resultado.advertencias.map((advertencia, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : '8px 0 0', color: 'var(--alerta)', fontSize: 12 }}>
              {advertencia}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
