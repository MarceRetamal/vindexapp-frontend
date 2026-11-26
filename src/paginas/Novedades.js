import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { api, avisarCambioNovedades, } from '../api/novedades';
import { api as apiAlertas, mensajeDeError } from '../api/alertas';
import { api as apiPortal } from '../api/portal';
import { EmptyState } from '../componentes/EmptyState';
import { EnlacePlazo } from '../componentes/EnlacePlazo';
import { PropuestaPlazo } from '../componentes/PropuestaPlazo';
import { usePlazosSugeridos } from '../lib/usePlazosSugeridos';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { enlaceSeguro } from '../lib/texto';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Filete } from '../componentes/Filete';
const POR_PAGINA = 50;
const PESTANAS = [
    { valor: 'pendientes', etiqueta: 'Pendientes' },
    { valor: 'revisadas', etiqueta: 'Revisadas' },
    { valor: 'todas', etiqueta: 'Todas' },
];
const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const botonClases = 'rounded-sharp border border-line text-text-gray-light hover:text-white';
function formatearFecha(fechaISO) {
    const [anio, mes, dia] = fechaISO.slice(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
}
function formatearFechaHora(fechaISO) {
    const hora = fechaISO.length >= 16 ? ` ${fechaISO.slice(11, 16)}` : '';
    return `${formatearFecha(fechaISO)}${hora}`;
}
function formatearMarca(ms) {
    return new Intl.DateTimeFormat('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(ms));
}
export function Novedades() {
    const [estado, setEstado] = useState('pendientes');
    const [busqueda, setBusqueda] = useState('');
    const [q, setQ] = useState('');
    const [lista, setLista] = useState([]);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [error, setError] = useState(null);
    const [aviso, setAviso] = useState(null);
    const [marcandoTodas, setMarcandoTodas] = useState(false);
    const pedidoActual = useRef(0);
    const sugerencias = usePlazosSugeridos(lista.filter((n) => n.revisada_en === null));
    // La búsqueda espera un instante después de tipear para no pedir en cada letra.
    useEffect(() => {
        const espera = window.setTimeout(() => setQ(busqueda.trim()), 350);
        return () => window.clearTimeout(espera);
    }, [busqueda]);
    const cargar = useCallback(() => {
        const numero = ++pedidoActual.current;
        setCargando(true);
        setError(null);
        api
            .listarNovedades({ estado, q: q || undefined, limit: POR_PAGINA })
            .then((r) => {
            if (numero !== pedidoActual.current)
                return;
            setLista(r.novedades);
            setTotal(r.total);
        })
            .catch((e) => {
            if (numero === pedidoActual.current)
                setError(e.message);
        })
            .finally(() => {
            if (numero === pedidoActual.current)
                setCargando(false);
        });
    }, [estado, q]);
    useEffect(cargar, [cargar]);
    function cargarMas() {
        const numero = pedidoActual.current;
        setCargandoMas(true);
        api
            .listarNovedades({ estado, q: q || undefined, limit: POR_PAGINA, offset: lista.length })
            .then((r) => {
            if (numero !== pedidoActual.current)
                return;
            setLista((actual) => [...actual, ...r.novedades.filter((n) => !actual.some((a) => a.id === n.id))]);
            setTotal(r.total);
        })
            .catch((e) => setError(e.message))
            .finally(() => setCargandoMas(false));
    }
    function alCambiarRevision(id, revisadaEn) {
        avisarCambioNovedades();
        if (estado === 'todas') {
            setLista((actual) => actual.map((n) => (n.id === id ? { ...n, revisada_en: revisadaEn } : n)));
            return;
        }
        // En "pendientes" o "revisadas", la novedad deja de pertenecer a la lista actual.
        setLista((actual) => actual.filter((n) => n.id !== id));
        setTotal((t) => Math.max(0, t - 1));
    }
    function alMarcarEnBloque(marcadas) {
        setAviso(marcadas === 1 ? 'Se marcó 1 novedad como revisada.' : `Se marcaron ${marcadas} novedades como revisadas.`);
        avisarCambioNovedades();
        cargar();
    }
    async function marcarTodasRevisadas() {
        if (!window.confirm(`Se marcarán como revisadas las ${total} novedades pendientes (no solo las que se ven en la lista). ¿Seguimos?`))
            return;
        setMarcandoTodas(true);
        setError(null);
        try {
            const r = await api.marcarRevisadas({ todas: true });
            alMarcarEnBloque(r.marcadas);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudieron marcar las novedades.');
        }
        finally {
            setMarcandoTodas(false);
        }
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-x-4 gap-y-3", children: [_jsxs("h1", { className: "text-xl sm:text-2xl font-black uppercase tracking-[0.08em] sm:tracking-[0.1em] text-white", children: ["Novedades", ' ', _jsxs("span", { className: "text-text-gray-light font-light normal-case tracking-normal tabular-nums", children: ["(", total, " ", estado === 'pendientes' ? 'pendientes' : estado === 'revisadas' ? 'revisadas' : 'en total', ")"] })] }), estado === 'pendientes' && total > 0 && !q && (_jsx(Button, { onClick: marcarTodasRevisadas, disabled: marcandoTodas, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver", children: marcandoTodas ? 'Marcando…' : 'Marcar todas como revisadas' }))] }), _jsx(Filete, { className: "mt-5 mb-7" }), _jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-6", children: [_jsx("div", { className: "flex gap-1", role: "tablist", "aria-label": "Estado de las novedades", children: PESTANAS.map((p) => (_jsx(Button, { role: "tab", "aria-selected": estado === p.valor, variant: "ghost", size: "sm", onClick: () => setEstado(p.valor), className: `rounded-sharp border ${estado === p.valor ? 'border-silver text-white font-bold' : 'border-line text-text-gray-light hover:text-white'}`, children: p.etiqueta }, p.valor))) }), _jsx(Input, { value: busqueda, onChange: (e) => setBusqueda(e.target.value), placeholder: "Buscar por car\u00E1tula, n\u00FAmero, tr\u00E1mite o texto", "aria-label": "Buscar novedades", className: `${campoClases} w-full sm:max-w-sm` })] }), _jsx(LecturaPortal, { onError: setError, onAviso: setAviso, onLeido: () => { avisarCambioNovedades(); cargar(); } }), _jsx(AvisosWhatsApp, { onError: setError, onAviso: setAviso }), _jsx(AccionesEnBloque, { pendientes: estado === 'pendientes' ? lista : [], onMarcadas: alMarcarEnBloque, onError: setError }), aviso && (_jsx("div", { className: "border-l-2 border-success text-success bg-graphite px-4 py-3 rounded-sharp text-sm mb-4", children: aviso })), error && _jsx(ErrorBanner, { message: `No se pudo completar la operación: ${error}` }), cargando ? (_jsx(ListSkeleton, { rows: 6 })) : lista.length === 0 ? (_jsx(EmptyState, { message: q
                    ? 'Ninguna novedad coincide con la búsqueda.'
                    : estado === 'pendientes'
                        ? 'No hay novedades pendientes de revisar.'
                        : estado === 'revisadas'
                            ? 'Todavía no marcaste novedades como revisadas.'
                            : 'Todavía no llegaron novedades del portal.' })) : (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: "hidden", animate: "show", variants: { hidden: {}, show: { transition: { staggerChildren: 0.03 } } }, children: lista.map((n) => (_jsx(FilaNovedad, { novedad: n, sugerencia: sugerencias[n.id], onRevision: alCambiarRevision, onError: setError }, n.id))) }), lista.length < total && (_jsx("div", { className: "flex justify-center mt-6", children: _jsx(Button, { variant: "ghost", onClick: cargarMas, disabled: cargandoMas, className: botonClases, children: cargandoMas ? 'Cargando…' : `Cargar más (${lista.length} de ${total})` }) }))] }))] }));
}
function FilaNovedad({ novedad, sugerencia, onRevision, onError, }) {
    const [abierta, setAbierta] = useState(false);
    const [detalle, setDetalle] = useState(null);
    const [cargandoTexto, setCargandoTexto] = useState(false);
    const [errorTexto, setErrorTexto] = useState(null);
    const [procesando, setProcesando] = useState(false);
    const revisada = novedad.revisada_en !== null;
    function alternarTexto() {
        const abrir = !abierta;
        setAbierta(abrir);
        if (!abrir || detalle || cargandoTexto)
            return;
        setCargandoTexto(true);
        setErrorTexto(null);
        api
            .obtenerNovedad(novedad.id)
            .then(setDetalle)
            .catch((e) => setErrorTexto(e.message))
            .finally(() => setCargandoTexto(false));
    }
    async function alternarRevision() {
        setProcesando(true);
        onError(null);
        try {
            const r = await api.marcarRevisada(novedad.id, !revisada);
            onRevision(novedad.id, r.revisada_en);
        }
        catch (e) {
            onError(e instanceof Error ? e.message : 'No se pudo actualizar la novedad.');
        }
        finally {
            setProcesando(false);
        }
    }
    return (_jsxs(motion.article, { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 }, className: `superficie mb-3 p-4 sm:p-5 ${revisada ? 'opacity-70' : ''}`, children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0 flex flex-col gap-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "font-mono text-xs text-silver-deep border border-line rounded-sharp px-2 py-0.5", children: novedad.numero_causa }), _jsx(EstadoBadge, { estado: revisada ? 'Revisada' : 'Pendiente', colorMap: { Revisada: 'success', Pendiente: 'warning' } })] }), _jsx("div", { className: "text-[15px] font-bold text-white", children: novedad.tipo ?? 'Notificación sin trámite informado' }), novedad.caratula && _jsx("div", { className: "text-xs text-text-gray-light", children: novedad.caratula }), novedad.organismo && _jsx("div", { className: "text-xs text-text-gray-light", children: novedad.organismo }), _jsxs("div", { className: "text-xs font-mono text-text-gray-light", children: [novedad.fecha_notificacion && _jsxs(_Fragment, { children: ["Notificada ", formatearFecha(novedad.fecha_notificacion)] }), novedad.fecha_notificacion && novedad.fecha_alta && ' · ', novedad.fecha_alta && _jsxs(_Fragment, { children: ["Alta ", formatearFechaHora(novedad.fecha_alta)] }), revisada && novedad.revisada_en !== null && _jsxs(_Fragment, { children: [" \u00B7 Revisada ", formatearMarca(novedad.revisada_en)] })] }), !abierta && novedad.texto_extracto && (_jsx("p", { className: "text-sm text-silver mt-1 line-clamp-2", children: novedad.texto_extracto.replace(/\s+/g, ' ').trim() }))] }), _jsxs("div", { className: "flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:shrink-0", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: alternarRevision, disabled: procesando, className: botonClases, children: revisada ? 'Volver a pendiente' : 'Marcar revisada' }), novedad.tiene_texto === 1 && (_jsx(Button, { variant: "ghost", size: "sm", onClick: alternarTexto, className: botonClases, children: abierta ? 'Ocultar texto' : 'Ver texto' })), enlaceSeguro(novedad.enlace) && (_jsx("a", { href: enlaceSeguro(novedad.enlace) ?? undefined, target: "_blank", rel: "noopener noreferrer", className: "text-xs text-text-gray-light hover:text-white underline-offset-4 hover:underline", children: "Abrir en el portal" })), _jsx(EnlacePlazo, { novedad: novedad })] })] }), !revisada && sugerencia?.propuesta && _jsx(PropuestaPlazo, { novedad: novedad, propuesta: sugerencia.propuesta }), !revisada && sugerencia && !sugerencia.propuesta && sugerencia.motivo && (_jsxs("p", { className: "mt-3 text-xs text-text-gray-light", children: ["Sin plazo propuesto: ", sugerencia.motivo] })), abierta && (_jsxs("div", { className: "mt-3 border border-line rounded-sharp bg-graphite p-4", children: [cargandoTexto && _jsx("p", { className: "text-sm text-text-gray-light", children: "Cargando el texto\u2026" }), errorTexto && _jsx(ErrorBanner, { message: `No se pudo cargar el texto: ${errorTexto}` }), detalle && (_jsxs(_Fragment, { children: [detalle.destinatario && (_jsxs("p", { className: "text-xs text-text-gray-light mb-3", children: ["Destinatario: ", detalle.destinatario] })), _jsx("pre", { className: "whitespace-pre-wrap font-sans text-sm text-silver leading-relaxed", children: detalle.texto ?? 'Esta notificación no tiene texto guardado.' })] }))] }))] }));
}
/** "24/11 12:29" a partir de AAAA-MM-DDTHH:MM:SS. */
function fechaYHora(iso) {
    const [fecha, hora] = iso.split('T');
    const [, mes, dia] = (fecha ?? '').split('-');
    return `${dia}/${mes}${hora ? ` ${hora.slice(0, 5)}` : ''}`;
}
/** Qué filtro "Procesada" usó el sistema en el portal, para poder compararlo con lo que ve la persona. */
function filtroUsado(d) {
    return d.filtro_procesada ? ` Filtro del portal: "${d.filtro_procesada}".` : '';
}
function hace(ms) {
    const minutos = Math.max(0, Math.round((Date.now() - ms) / 60_000));
    if (minutos < 1)
        return 'hace instantes';
    if (minutos < 60)
        return `hace ${minutos} min`;
    const horas = Math.round(minutos / 60);
    return horas < 48 ? `hace ${horas} h` : `hace ${Math.round(horas / 24)} días`;
}
/**
 * Estado de la lectura automática del Portal de Notificaciones (la hace el servidor, sin la computadora del
 * abogado) y botón para leerlo ahora.
 */
function LecturaPortal({ onError, onAviso, onLeido, }) {
    const [estado, setEstado] = useState(null);
    const [fallo, setFallo] = useState(false);
    const [leyendo, setLeyendo] = useState(false);
    const consultar = useCallback(() => {
        apiPortal
            .obtenerEstado()
            .then(setEstado)
            .catch(() => setFallo(true));
    }, []);
    useEffect(consultar, [consultar]);
    async function leerAhora() {
        setLeyendo(true);
        onError(null);
        onAviso(null);
        try {
            const r = await apiPortal.sincronizar();
            const yaGuardadas = Math.max(0, r.leidas - r.nuevas);
            const reciente = r.detalle.alta_mas_reciente ? ` La más reciente es del ${fechaYHora(r.detalle.alta_mas_reciente)}.` : '';
            onAviso(r.leidas === 0
                ? `Se leyó el portal, pero no devolvió ninguna notificación en los últimos 30 días${filtroUsado(r.detalle)}. Si esperabas ver alguna, avisame.`
                : `Se leyó el portal: ${r.leidas} notificaciones (${r.nuevas} nuevas, ${yaGuardadas} que ya estaban guardadas).${reciente}${filtroUsado(r.detalle)}${r.detalle.linea_de_base && r.nuevas > 0 ? ' Es una lectura de puesta al día: lo nuevo queda en la bandeja sin aviso por WhatsApp.' : ''}`);
            onLeido();
        }
        catch (e) {
            onError(mensajeDeError(e));
        }
        finally {
            setLeyendo(false);
            consultar();
        }
    }
    const listo = estado !== null && estado.configurado && estado.estudio_correcto;
    const texto = fallo
        ? 'No se pudo consultar el estado de la lectura automática del portal.'
        : estado === null
            ? 'Consultando la lectura automática del portal…'
            : !estado.configurado
                ? 'Todavía no conectaste el portal de la SCBA: sin eso no llegan las novedades solas.'
                : estado.pausada
                    ? 'Lectura automática del portal PAUSADA: el portal rechazó la contraseña guardada. Actualizala y tocá "Leer el portal ahora".'
                    : estado.errores_consecutivos > 0
                        ? `Lectura automática del portal con problemas (${estado.errores_consecutivos} intentos fallidos)${estado.ultimo_error ? `: ${estado.ultimo_error}` : ''}${estado.ultimo_ok ? ` Última lectura buena ${hace(estado.ultimo_ok)}.` : ''}`
                        : estado.ultimo_ok
                            ? `Lectura automática del portal activa: última lectura ${hace(estado.ultimo_ok)} (${estado.ultimas_vistas} leídas, ${estado.ultimas_nuevas} nuevas).${estado.detalle?.alta_mas_reciente ? ` La novedad más reciente que vio es del ${fechaYHora(estado.detalle.alta_mas_reciente)}.` : ''}${estado.detalle ? filtroUsado(estado.detalle) : ''}`
                            : 'Lectura automática del portal lista: todavía no hizo su primera lectura.';
    return (_jsxs("div", { className: "mb-3 flex flex-wrap items-center gap-3 text-xs text-text-gray-light", children: [_jsx("span", { children: texto }), estado !== null && !estado.configurado && (_jsx(Link, { to: "/configuracion", className: "text-silver transition-colors hover:text-white", children: "Conectarlo en Configuraci\u00F3n" })), estado?.pausada && (_jsx(Link, { to: "/configuracion", className: "text-silver transition-colors hover:text-white", children: "Actualizar la contrase\u00F1a" })), listo && (_jsx(Button, { variant: "ghost", size: "sm", onClick: leerAhora, disabled: leyendo, className: botonClases, children: leyendo ? 'Leyendo el portal…' : 'Leer el portal ahora' }))] }));
}
function AvisosWhatsApp({ onError, onAviso, }) {
    const [estado, setEstado] = useState(null);
    const [fallo, setFallo] = useState(false);
    const [enviando, setEnviando] = useState(false);
    useEffect(() => {
        apiAlertas
            .obtenerEstado()
            .then((r) => setEstado(r.whatsapp))
            .catch(() => setFallo(true));
    }, []);
    async function probar() {
        if (!window.confirm('Se enviará un WhatsApp de prueba al número configurado, con la cantidad actual de novedades pendientes. ¿Seguimos?'))
            return;
        setEnviando(true);
        onError(null);
        onAviso(null);
        try {
            const r = await apiAlertas.enviarPrueba();
            onAviso(`Aviso de prueba enviado (${r.pendientes} pendientes). Revisá tu WhatsApp.`);
        }
        catch (e) {
            onError(mensajeDeError(e));
        }
        finally {
            setEnviando(false);
        }
    }
    const listo = estado !== null && estado.configurado && estado.estudio_correcto;
    const texto = fallo
        ? 'No se pudo consultar el estado de los avisos por WhatsApp.'
        : estado === null
            ? 'Consultando los avisos por WhatsApp…'
            : listo
                ? 'Avisos por WhatsApp activos: te avisamos cuando llegan novedades nuevas, de 8 a 22 hs.'
                : estado.configurado
                    ? 'Todavía no cargaste tu número de WhatsApp: sin eso no te avisamos las novedades.'
                    : `Avisos por WhatsApp sin configurar. Falta: ${estado.faltan.join(', ')}.`;
    return (_jsxs("div", { className: "mb-4 flex flex-wrap items-center gap-3 text-xs text-text-gray-light", children: [_jsx("span", { children: texto }), estado !== null && !listo && (_jsx(Link, { to: "/configuracion", className: "text-silver transition-colors hover:text-white", children: "Cargar mi n\u00FAmero" })), listo && (_jsx(Button, { variant: "ghost", size: "sm", onClick: probar, disabled: enviando, className: botonClases, children: enviando ? 'Enviando…' : 'Enviar aviso de prueba' }))] }));
}
function AccionesEnBloque({ pendientes, onMarcadas, onError, }) {
    const [abierto, setAbierto] = useState(false);
    const [fecha, setFecha] = useState('');
    const [procesando, setProcesando] = useState(false);
    async function ejecutar(cuerpo, confirmacion) {
        if (!window.confirm(confirmacion))
            return;
        setProcesando(true);
        onError(null);
        try {
            const r = await api.marcarRevisadas(cuerpo);
            onMarcadas(r.marcadas);
        }
        catch (e) {
            onError(e instanceof Error ? e.message : 'No se pudieron marcar las novedades.');
        }
        finally {
            setProcesando(false);
        }
    }
    return (_jsxs("div", { className: "mb-6", children: [_jsx("button", { type: "button", onClick: () => setAbierto((v) => !v), "aria-expanded": abierto, className: "text-xs text-text-gray-light hover:text-white underline-offset-4 hover:underline", children: abierto ? 'Ocultar más opciones' : 'Más opciones: marcar hasta una fecha o solo las de la lista' }), abierto && (_jsxs("div", { className: "mt-3 border border-line rounded-sharp bg-graphite p-4 flex flex-col gap-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("span", { className: "text-sm text-silver", children: "Dar por revisado todo lo notificado hasta:" }), _jsx(Input, { type: "date", value: fecha, onChange: (e) => setFecha(e.target.value), "aria-label": "Fecha de notificaci\u00F3n l\u00EDmite", className: `${campoClases} w-44` }), _jsx(Button, { variant: "ghost", size: "sm", disabled: !fecha || procesando, onClick: () => ejecutar({ hasta_fecha_notificacion: fecha }, `Se marcarán como revisadas todas las novedades pendientes con fecha de notificación hasta el ${formatearFecha(fecha)} inclusive. ¿Seguimos?`), className: botonClases, children: "Marcar como revisadas" })] }), _jsx("div", { children: _jsx(Button, { variant: "ghost", size: "sm", disabled: pendientes.length === 0 || procesando, onClick: () => ejecutar({ ids: pendientes.map((n) => n.id) }, `Se marcarán como revisadas las ${pendientes.length} novedades pendientes que se ven en la lista. ¿Seguimos?`), className: botonClases, children: pendientes.length > 0
                                ? `Marcar como revisadas las ${pendientes.length} de la lista`
                                : 'Marcar como revisadas las de la lista (solo en la pestaña Pendientes)' }) })] }))] }));
}
