import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api/plazos';
import { api as expedientesApi } from '../api/expedientes';
import { api as tareasApi } from '../api/tareas';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { PageHeader } from '../componentes/PageHeader';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const selectClases = `${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`;
const etiquetaClases = 'text-xs text-text-gray-light';
const botonClases = 'rounded-sharp border border-line text-text-gray-light hover:text-white';
const botonPrincipal = 'rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60';
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function formatear(fecha) {
    const [a, m, d] = fecha.split('-');
    const dia = new Date(`${fecha}T12:00:00Z`).getUTCDay();
    return `${DIAS_SEMANA[dia]} ${d}/${m}/${a}`;
}
function hoy() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
}
function mensaje(e) {
    return e instanceof Error ? e.message : 'No se pudo completar la operación.';
}
export function Plazos() {
    const [params] = useSearchParams();
    const [calendario, setCalendario] = useState(null);
    const [error, setError] = useState(null);
    function cargarCalendario() {
        api
            .calendario()
            .then(setCalendario)
            .catch((e) => setError(mensaje(e)));
    }
    useEffect(cargarCalendario, []);
    return (_jsxs("div", { children: [_jsx(PageHeader, { eyebrow: "Causas", title: "Plazos", descripcion: "Calcul\u00E1 un vencimiento con la norma que lo sostiene, d\u00EDa por d\u00EDa, con el calendario judicial del estudio." }), error && _jsx(ErrorBanner, { message: error }), _jsx(Calculadora, { calendario: calendario, fechaInicial: params.get('fecha') ?? '', expedienteInicial: params.get('expediente_id') ?? '', tituloInicial: params.get('titulo') ?? '', inicial: {
                    regimen: params.get('regimen') === 'cpp' ? 'cpp' : 'cpcc',
                    dias: params.get('dias'),
                    vista: params.get('vista') === '1',
                    localidad: params.get('localidad'),
                    calcular: params.get('calcular') === '1',
                } }), _jsx(SeccionCalendario, { calendario: calendario, onCambio: cargarCalendario })] }));
}
function Calculadora({ calendario, fechaInicial, expedienteInicial, tituloInicial, inicial, }) {
    const [regimen, setRegimen] = useState(inicial.regimen);
    const [tipoInicio, setTipoInicio] = useState('notificacion');
    const [fecha, setFecha] = useState(fechaInicial);
    const [dias, setDias] = useState(inicial.dias ?? (inicial.regimen === 'cpp' ? '3' : '5'));
    const [localidad, setLocalidad] = useState(inicial.localidad ?? 'LA PLATA');
    const [distancia, setDistancia] = useState('');
    const [vista, setVista] = useState(inicial.vista);
    const [suspende, setSuspende] = useState(false);
    const [flagrancia, setFlagrancia] = useState(false);
    const [recurso, setRecurso] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState(null);
    const [calculando, setCalculando] = useState(false);
    // Si el calendario no tiene la localidad por defecto, se usa solo el provincial.
    useEffect(() => {
        if (calendario && !calendario.localidades.includes(localidad))
            setLocalidad('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [calendario]);
    function cambiarRegimen(r) {
        setRegimen(r);
        setResultado(null);
        if (r === 'cpp') {
            setTipoInicio('notificacion');
            setDias('3');
        }
        else {
            setDias('5');
        }
    }
    function calcular(e) {
        e.preventDefault();
        void ejecutar(localidad);
    }
    // Abierta desde una propuesta de plazo: calcula sola apenas está el calendario, para mostrar el cómputo ya hecho.
    const calculadaSola = useRef(false);
    useEffect(() => {
        if (!inicial.calcular || calculadaSola.current || !calendario || !fecha)
            return;
        calculadaSola.current = true;
        void ejecutar(calendario.localidades.includes(localidad) ? localidad : '');
        // Solo cuando llega el calendario.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [calendario]);
    async function ejecutar(localidadEfectiva) {
        setCalculando(true);
        setError(null);
        setResultado(null);
        try {
            const r = await api.calcular({
                regimen,
                inicio: { tipo: tipoInicio, fecha },
                dias: Number(dias),
                localidad: localidadEfectiva || null,
                distancia_km: regimen === 'cpcc' && distancia ? Number(distancia) : undefined,
                vista: regimen === 'cpp' && vista,
                suspende_en_feria: regimen === 'cpp' && suspende,
                flagrancia: regimen === 'cpp' && flagrancia,
                recurso: regimen === 'cpp' && recurso,
            });
            setResultado(r);
        }
        catch (err) {
            setError(mensaje(err));
        }
        finally {
            setCalculando(false);
        }
    }
    return (_jsxs("section", { className: "mb-10", children: [_jsxs("form", { onSubmit: calcular, className: "superficie p-5 grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "plazo-regimen", className: etiquetaClases, children: "R\u00E9gimen" }), _jsxs("select", { id: "plazo-regimen", value: regimen, onChange: (e) => cambiarRegimen(e.target.value), className: selectClases, children: [_jsx("option", { value: "cpcc", className: "bg-graphite", children: "Civil y Comercial, Familia, Paz (CPCC PBA): d\u00EDas h\u00E1biles" }), _jsx("option", { value: "cpp", className: "bg-graphite", children: "Penal (CPP PBA, Ley 11.922): d\u00EDas corridos" })] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "plazo-inicio", className: etiquetaClases, children: "Desde" }), _jsxs("select", { id: "plazo-inicio", value: tipoInicio, onChange: (e) => setTipoInicio(e.target.value), className: selectClases, children: [_jsx("option", { value: "notificacion", className: "bg-graphite", children: "Fecha de notificaci\u00F3n (la del prove\u00EDdo o el portal)" }), regimen === 'cpcc' && _jsx("option", { value: "ministerio_legis", className: "bg-graphite", children: "Fecha de la resoluci\u00F3n, notificaci\u00F3n autom\u00E1tica (art. 133)" }), regimen === 'cpcc' && _jsx("option", { value: "correo_electronico", className: "bg-graphite", children: "Env\u00EDo de la notificaci\u00F3n por correo electr\u00F3nico (art. 143)" })] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "plazo-fecha", className: etiquetaClases, children: tipoInicio === 'notificacion' ? 'Fecha de notificación' : tipoInicio === 'ministerio_legis' ? 'Fecha de la resolución' : 'Fecha del envío' }), _jsx(Input, { id: "plazo-fecha", type: "date", required: true, value: fecha, max: "2100-12-31", onChange: (e) => setFecha(e.target.value), className: campoClases })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("label", { htmlFor: "plazo-dias", className: etiquetaClases, children: ["D\u00EDas del plazo ", regimen === 'cpcc' ? '(traslados y vistas sin plazo: 5, art. 150)' : '(sin plazo fijado y vistas: 3, arts. 135 y 138)'] }), _jsx(Input, { id: "plazo-dias", type: "number", min: 1, max: 365, required: true, value: dias, onChange: (e) => setDias(e.target.value), className: campoClases })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "plazo-localidad", className: etiquetaClases, children: "Localidad del organismo (feriados locales)" }), _jsxs("select", { id: "plazo-localidad", value: localidad, onChange: (e) => setLocalidad(e.target.value), className: selectClases, children: [_jsx("option", { value: "", className: "bg-graphite", children: "Solo feriados de toda la provincia" }), (calendario?.localidades ?? []).map((l) => (_jsx("option", { value: l, className: "bg-graphite", children: l }, l)))] })] }), regimen === 'cpcc' ? (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "plazo-distancia", className: etiquetaClases, children: "Distancia en km para la ampliaci\u00F3n (art. 158, opcional)" }), _jsx(Input, { id: "plazo-distancia", type: "number", min: 0, value: distancia, onChange: (e) => setDistancia(e.target.value), className: campoClases })] })) : (_jsxs("div", { className: "flex flex-col gap-2 text-sm text-silver sm:row-span-2", children: [_jsxs("label", { className: "flex items-start gap-2", children: [_jsx("input", { type: "checkbox", checked: vista, onChange: (e) => setVista(e.target.checked), className: "accent-silver mt-1" }), "Es una vista: corre desde el d\u00EDa h\u00E1bil siguiente (art. 135)"] }), _jsxs("label", { className: "flex items-start gap-2", children: [_jsx("input", { type: "checkbox", checked: suspende, onChange: (e) => setSuspende(e.target.checked), className: "accent-silver mt-1" }), "La feria lo suspende: oposici\u00F3n del art. 336, impugnaci\u00F3n del auto de elevaci\u00F3n o de la sentencia (art. 139)"] }), suspende && _jsxs("label", { className: "flex items-start gap-2 pl-5", children: [_jsx("input", { type: "checkbox", checked: flagrancia, onChange: (e) => setFlagrancia(e.target.checked), className: "accent-silver mt-1" }), "Procedimiento de flagrancia: la feria no suspende"] }), _jsxs("label", { className: "flex items-start gap-2", children: [_jsx("input", { type: "checkbox", checked: recurso, onChange: (e) => setRecurso(e.target.checked), className: "accent-silver mt-1" }), "Es un recurso (arts. 479 y siguientes)"] })] })), error && _jsx("div", { className: "sm:col-span-2", children: _jsx(ErrorBanner, { message: error }) }), _jsx("div", { className: "sm:col-span-2", children: _jsx(Button, { type: "submit", disabled: calculando || !fecha, className: botonPrincipal, children: calculando ? 'Calculando…' : 'Calcular vencimiento' }) })] }), resultado && _jsx(Resultado, { resultado: resultado, expedienteInicial: expedienteInicial, tituloInicial: tituloInicial })] }));
}
function Resultado({ resultado: r, expedienteInicial, tituloInicial }) {
    const [verDetalle, setVerDetalle] = useState(false);
    return (_jsxs("div", { className: "mt-4 border border-line rounded-sharp p-4 sm:p-5 flex flex-col gap-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-[0.16em] text-silver-deep", children: "Vence" }), _jsx("div", { className: "text-2xl sm:text-3xl font-light text-white", children: formatear(r.vencimiento) }), _jsxs("div", { className: "text-sm text-text-gray-light mt-1", children: ["Notificaci\u00F3n: ", formatear(r.fecha_notificacion), " \u00B7 ", r.dias_totales, " d\u00EDas", r.localidad ? ` · feriados locales de ${r.localidad}` : ' · solo feriados provinciales'] }), r.plazo_de_gracia && (_jsxs("div", { className: "text-sm text-silver mt-1", children: ["Plazo de gracia: hasta las 4 primeras horas del ", formatear(r.plazo_de_gracia), " (art. 139 CPP)."] }))] }), r.advertencias.length > 0 && (_jsx("ul", { className: "border-l-2 border-warning bg-graphite px-4 py-3 rounded-sharp text-sm text-warning flex flex-col gap-1", children: r.advertencias.map((a) => _jsx("li", { children: a }, a)) })), _jsxs("div", { className: "text-xs text-text-gray-light flex flex-col gap-1", children: [_jsx("div", { className: "text-silver font-bold uppercase tracking-[0.16em]", children: "Normas aplicadas" }), r.normas.map((n) => _jsx("div", { children: n }, n)), _jsx("div", { className: "text-silver font-bold uppercase tracking-[0.16em] mt-2", children: "Supuestos" }), r.supuestos.map((s) => _jsx("div", { children: s }, s))] }), _jsxs("div", { children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => setVerDetalle((v) => !v), className: botonClases, children: verDetalle ? 'Ocultar el cómputo día por día' : 'Ver el cómputo día por día' }), verDetalle && (_jsx("ol", { className: "mt-3 text-sm flex flex-col", children: r.detalle.map((d, i) => (_jsxs("li", { className: "flex gap-3 py-1 border-b border-line", children: [_jsx("span", { className: "font-mono text-silver-deep w-8 shrink-0 text-right", children: d.numero ?? '—' }), _jsx("span", { className: `w-40 shrink-0 ${d.numero ? 'text-white' : 'text-text-gray-light'}`, children: formatear(d.fecha) }), _jsx("span", { className: "text-text-gray-light min-w-0 break-words", children: d.motivo })] }, `${d.fecha}-${i}`))) }))] }), _jsx(CrearTarea, { vencimiento: r.vencimiento, expedienteInicial: expedienteInicial, tituloInicial: tituloInicial })] }));
}
function CrearTarea({ vencimiento, expedienteInicial, tituloInicial }) {
    const [expedientes, setExpedientes] = useState([]);
    const [expedienteId, setExpedienteId] = useState(expedienteInicial);
    const [titulo, setTitulo] = useState(tituloInicial ? `Vence: ${tituloInicial}` : 'Vencimiento de plazo');
    const [enviando, setEnviando] = useState(false);
    const [creada, setCreada] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        expedientesApi.listarExpedientes().then(setExpedientes).catch(() => setExpedientes([]));
    }, []);
    useEffect(() => setCreada(false), [vencimiento]);
    async function crear() {
        setEnviando(true);
        setError(null);
        try {
            await tareasApi.crearTareaConVencimiento({ titulo, fecha_limite: vencimiento, expediente_id: expedienteId || undefined, tipo: expedienteId ? undefined : 'Plazo' });
            setCreada(true);
        }
        catch (e) {
            setError(mensaje(e));
        }
        finally {
            setEnviando(false);
        }
    }
    if (creada) {
        return (_jsxs("div", { className: "border-l-2 border-success text-success bg-graphite px-4 py-3 rounded-sharp text-sm", children: ["Tarea creada con vencimiento ", formatear(vencimiento), ". Aparece en ", _jsx(Link, { to: "/tareas", className: "underline", children: "Tareas" }), " y en el resumen diario por WhatsApp."] }));
    }
    return (_jsxs("div", { className: "border-t border-line pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "plazo-tarea-titulo", className: etiquetaClases, children: "Tarea" }), _jsx(Input, { id: "plazo-tarea-titulo", value: titulo, onChange: (e) => setTitulo(e.target.value), className: campoClases })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "plazo-tarea-expediente", className: etiquetaClases, children: "Expediente (opcional)" }), _jsxs("select", { id: "plazo-tarea-expediente", value: expedienteId, onChange: (e) => setExpedienteId(e.target.value), className: selectClases, children: [_jsx("option", { value: "", className: "bg-graphite", children: "Sin expediente" }), expedientes.map((x) => _jsx("option", { value: x.id, className: "bg-graphite", children: x.caratula }, x.id))] })] }), error && _jsx("div", { className: "sm:col-span-2", children: _jsx(ErrorBanner, { message: error }) }), _jsx("div", { className: "sm:col-span-2", children: _jsx(Button, { onClick: crear, disabled: enviando || !titulo.trim(), className: botonPrincipal, children: enviando ? 'Creando…' : 'Crear tarea con este vencimiento' }) })] }));
}
const TIPOS = [
    { valor: 'feriado', etiqueta: 'Feriado (nacional, provincial o local)' },
    { valor: 'feria', etiqueta: 'Feria judicial' },
    { valor: 'asueto', etiqueta: 'Asueto de la Suprema Corte' },
    { valor: 'suspension', etiqueta: 'Suspensión de términos' },
];
function SeccionCalendario({ calendario, onCambio }) {
    const [abierto, setAbierto] = useState(false);
    const [fecha, setFecha] = useState('');
    const [tipo, setTipo] = useState('feriado');
    const [alcance, setAlcance] = useState('');
    const [motivo, setMotivo] = useState('');
    const [fuente, setFuente] = useState('');
    const [verificado, setVerificado] = useState('');
    const [error, setError] = useState(null);
    const [procesando, setProcesando] = useState(false);
    const proximos = (calendario?.dias ?? []).filter((d) => d.fecha >= hoy()).slice(0, 40);
    async function ejecutar(fn) {
        setProcesando(true);
        setError(null);
        try {
            await fn();
            onCambio();
        }
        catch (e) {
            setError(mensaje(e));
        }
        finally {
            setProcesando(false);
        }
    }
    return (_jsxs("section", { children: [_jsxs("h2", { className: "mb-3 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-silver", children: ["Calendario judicial", _jsx("span", { className: "h-px flex-1 bg-line", "aria-hidden": "true" })] }), _jsxs("p", { className: "text-sm text-text-gray-light mb-2", children: [calendario?.verificado_hasta
                        ? `Verificado hasta el ${formatear(calendario.verificado_hasta)}. Después de esa fecha no se calcula: cargá los feriados, asuetos y la feria cuando la SCBA los publique.`
                        : 'Todavía no hay calendario cargado: sin él no se puede calcular.', calendario?.fuente ? ` Fuente: ${calendario.fuente}` : ''] }), _jsx("a", { href: "https://www.scba.gob.ar/guia/suspensiones.asp", target: "_blank", rel: "noopener noreferrer", className: "text-xs text-text-gray-light underline-offset-4 hover:underline hover:text-white", children: "Ver las suspensiones de t\u00E9rminos en la SCBA" }), error && _jsx("div", { className: "mt-3", children: _jsx(ErrorBanner, { message: error }) }), _jsxs("div", { className: "mt-4", children: [_jsx("div", { className: "text-xs uppercase tracking-[0.16em] text-silver-deep mb-2", children: "Pr\u00F3ximos d\u00EDas inh\u00E1biles" }), proximos.length === 0 ? (_jsx("p", { className: "text-sm text-text-gray-light", children: "No hay d\u00EDas inh\u00E1biles cargados desde hoy." })) : (_jsx("ul", { className: "flex flex-col", children: proximos.map((d) => (_jsxs("li", { className: "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 border-b border-line text-sm", children: [_jsx("span", { className: "text-white sm:w-48 shrink-0", children: formatear(d.fecha) }), _jsxs("span", { className: "text-text-gray-light flex-1 min-w-0 break-words", children: [d.motivo, d.alcance !== 'PROVINCIA' ? ` · solo ${d.alcance}` : ''] }), _jsx("button", { type: "button", disabled: procesando, onClick: () => window.confirm(`Se quita el ${formatear(d.fecha)} del calendario. ¿Seguimos?`) && ejecutar(() => api.eliminarDia(d.id)), className: "text-xs text-text-gray-light hover:text-warning self-start sm:self-auto", children: "Quitar" })] }, d.id))) }))] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setAbierto((v) => !v), className: `${botonClases} mt-4`, children: abierto ? 'Cerrar' : 'Agregar un día o actualizar la verificación' }), abierto && (_jsxs("div", { className: "superficie mt-3 p-5 flex flex-col gap-4", children: [_jsxs("form", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", onSubmit: (e) => {
                            e.preventDefault();
                            void ejecutar(async () => {
                                await api.agregarDia({ fecha, tipo, motivo, alcance: alcance || undefined, fuente: fuente || undefined });
                                setFecha('');
                                setMotivo('');
                            });
                        }, children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "cal-fecha", className: etiquetaClases, children: "Fecha" }), _jsx(Input, { id: "cal-fecha", type: "date", required: true, value: fecha, onChange: (e) => setFecha(e.target.value), className: campoClases })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "cal-tipo", className: etiquetaClases, children: "Tipo" }), _jsx("select", { id: "cal-tipo", value: tipo, onChange: (e) => setTipo(e.target.value), className: selectClases, children: TIPOS.map((t) => _jsx("option", { value: t.valor, className: "bg-graphite", children: t.etiqueta }, t.valor)) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "cal-alcance", className: etiquetaClases, children: "Localidad (vac\u00EDo = toda la provincia)" }), _jsx(Input, { id: "cal-alcance", value: alcance, onChange: (e) => setAlcance(e.target.value), placeholder: "Ej.: LA PLATA", className: campoClases })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "cal-motivo", className: etiquetaClases, children: "Motivo" }), _jsx(Input, { id: "cal-motivo", required: true, value: motivo, onChange: (e) => setMotivo(e.target.value), placeholder: "Ej.: Feria judicial de enero (Res. \u2026)", className: campoClases })] }), _jsxs("div", { className: "flex flex-col gap-1 sm:col-span-2", children: [_jsx("label", { htmlFor: "cal-fuente", className: etiquetaClases, children: "Fuente (resoluci\u00F3n o p\u00E1gina oficial)" }), _jsx(Input, { id: "cal-fuente", value: fuente, onChange: (e) => setFuente(e.target.value), className: campoClases })] }), _jsx("div", { className: "sm:col-span-2", children: _jsx(Button, { type: "submit", disabled: procesando, className: botonPrincipal, children: "Agregar d\u00EDa inh\u00E1bil" }) })] }), _jsxs("form", { className: "flex flex-col sm:flex-row sm:items-end gap-3 border-t border-line pt-4", onSubmit: (e) => {
                            e.preventDefault();
                            void ejecutar(() => api.fijarVerificacion(verificado, 'SCBA, Suspensiones de Términos (scba.gob.ar/guia/suspensiones.asp)'));
                        }, children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "cal-verificado", className: etiquetaClases, children: "Calendario verificado con la SCBA hasta" }), _jsx(Input, { id: "cal-verificado", type: "date", required: true, value: verificado, onChange: (e) => setVerificado(e.target.value), className: campoClases })] }), _jsx(Button, { type: "submit", disabled: procesando, className: botonClases, children: "Guardar verificaci\u00F3n" })] })] }))] }));
}
