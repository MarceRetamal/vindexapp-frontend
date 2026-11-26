import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api } from '../api/liquidaciones';
import { Input } from '@/componentes/ui/input';
import { Button } from '@/componentes/ui/button';
import { ErrorBanner } from '@/componentes/ErrorBanner';
import { PageHeader } from '../componentes/PageHeader';
const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';
const FORMATO_MONTO = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const ETIQUETAS_TIPO_EXTINCION = {
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
const CONCEPTOS = [
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
    const [tipoExtincion, setTipoExtincion] = useState('despido_sin_causa');
    const [preavisoOtorgado, setPreavisoOtorgado] = useState(false);
    const [diasPreavisoOtorgados, setDiasPreavisoOtorgados] = useState('');
    const [diasTrabajadosAnioEnCurso, setDiasTrabajadosAnioEnCurso] = useState('');
    const [calculando, setCalculando] = useState(false);
    const [error, setError] = useState(null);
    const [resultado, setResultado] = useState(null);
    async function enviar(e) {
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo calcular la liquidación.');
        }
        finally {
            setCalculando(false);
        }
    }
    return (_jsxs("div", { children: [_jsx(PageHeader, { eyebrow: "Estudio", title: "Liquidaciones", descripcion: "Casas particulares (Ley 26.844): despido sin causa o indirecto. Los reg\u00EDmenes de LCT y Construcci\u00F3n todav\u00EDa no est\u00E1n disponibles." }), _jsxs("form", { onSubmit: enviar, className: "superficie p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "liq-fecha-ingreso", className: etiquetaClases, children: "Fecha de ingreso" }), _jsx(Input, { id: "liq-fecha-ingreso", type: "date", className: campoClases, value: fechaIngreso, onChange: (e) => setFechaIngreso(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "liq-fecha-egreso", className: etiquetaClases, children: "Fecha de egreso" }), _jsx(Input, { id: "liq-fecha-egreso", type: "date", className: campoClases, value: fechaEgreso, onChange: (e) => setFechaEgreso(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "liq-remuneracion", className: etiquetaClases, children: "Mejor remuneraci\u00F3n mensual ($)" }), _jsx(Input, { id: "liq-remuneracion", type: "number", min: "0", step: "0.01", className: campoClases, value: mejorRemuneracion, onChange: (e) => setMejorRemuneracion(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "liq-tipo-extincion", className: etiquetaClases, children: "Tipo de extinci\u00F3n" }), _jsx("select", { id: "liq-tipo-extincion", className: `${campoClases} h-8 w-full px-2.5 text-sm text-white outline-none border`, value: tipoExtincion, onChange: (e) => setTipoExtincion(e.target.value), children: Object.entries(ETIQUETAS_TIPO_EXTINCION).map(([valor, etiqueta]) => (_jsx("option", { value: valor, className: "bg-graphite text-white", children: etiqueta }, valor))) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "liq-dias-trabajados", className: etiquetaClases, children: "D\u00EDas trabajados en el a\u00F1o en curso" }), _jsx(Input, { id: "liq-dias-trabajados", type: "number", min: "0", step: "1", className: campoClases, value: diasTrabajadosAnioEnCurso, onChange: (e) => setDiasTrabajadosAnioEnCurso(e.target.value), required: true })] }), _jsx("div", { className: "flex flex-col gap-1 justify-end", children: _jsxs("label", { htmlFor: "liq-preaviso-otorgado", className: "flex items-center gap-2 text-sm text-white", children: [_jsx("input", { id: "liq-preaviso-otorgado", type: "checkbox", checked: preavisoOtorgado, onChange: (e) => setPreavisoOtorgado(e.target.checked), className: "accent-silver" }), "Se otorg\u00F3 preaviso"] }) }), preavisoOtorgado && (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "liq-dias-preaviso", className: etiquetaClases, children: "D\u00EDas de preaviso otorgados" }), _jsx(Input, { id: "liq-dias-preaviso", type: "number", min: "0", step: "1", className: campoClases, value: diasPreavisoOtorgados, onChange: (e) => setDiasPreavisoOtorgados(e.target.value) })] })), error && (_jsx("div", { className: "sm:col-span-2", children: _jsx(ErrorBanner, { message: error }) })), _jsx("div", { className: "sm:col-span-2", children: _jsx(Button, { type: "submit", disabled: calculando, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60", children: calculando ? 'Calculando…' : 'Calcular liquidación' }) })] }), resultado && _jsx(ResultadoLiquidacionCard, { resultado: resultado })] }));
}
function ResultadoLiquidacionCard({ resultado }) {
    return (_jsxs("div", { className: "superficie p-5", children: [_jsxs("div", { className: "mb-4 text-sm text-text-gray-light", children: ["Antig\u00FCedad: ", resultado.antiguedad.aniosCompletos, " a\u00F1os, ", resultado.antiguedad.mesesRestantes, " meses (", resultado.antiguedad.diasTotales, " d\u00EDas totales)"] }), _jsxs("div", { className: "flex flex-col", children: [CONCEPTOS.map(({ clave, etiqueta }) => (_jsxs("div", { className: "flex justify-between py-2 border-b border-line text-sm text-white", children: [_jsx("span", { children: etiqueta }), _jsx("span", { className: "font-mono", children: FORMATO_MONTO.format(resultado[clave]) })] }, clave))), _jsxs("div", { className: "flex justify-between pt-3 text-base font-bold text-white", children: [_jsx("span", { children: "Total bruto" }), _jsx("span", { className: "font-mono", children: FORMATO_MONTO.format(resultado.totalBruto) })] })] }), resultado.advertencias.length > 0 && (_jsx("div", { className: "mt-5", children: resultado.advertencias.map((advertencia, i) => (_jsx("div", { className: i > 0 ? 'mt-2' : '', children: _jsx(ErrorBanner, { message: advertencia }) }, i))) }))] }));
}
