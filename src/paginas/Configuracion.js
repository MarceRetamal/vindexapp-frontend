import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { CheckIcon, KeyRoundIcon, MessageCircleIcon } from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { api } from '../api/configuracion';
import { api as alertasApi, mensajeDeError } from '../api/alertas';
import { api as portalApi } from '../api/portal';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { PageHeader } from '../componentes/PageHeader';
import { haceCuanto } from '../lib/fechas';
const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';
const botonPrincipal = 'rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold uppercase tracking-[0.08em] text-xs hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver';
const botonSecundario = 'rounded-sharp border border-line text-text-gray-light hover:text-white';
/**
 * Lo que cada estudio configura por su cuenta: el número de WhatsApp de los avisos y las credenciales del Portal de
 * Notificaciones. Las carga el titular; nadie más las habilita ni las maneja, y ninguna pantalla las vuelve a mostrar.
 */
export function Configuracion() {
    const [cfg, setCfg] = useState(null);
    const [error, setError] = useState(null);
    const recargar = useCallback(() => {
        api
            .obtener()
            .then((c) => {
            setCfg(c);
            setError(null);
        })
            .catch((e) => setError(e.message));
    }, []);
    useEffect(recargar, [recargar]);
    return (_jsxs("div", { children: [_jsx(PageHeader, { eyebrow: "Estudio", title: "Configuraci\u00F3n", descripcion: "Los avisos por WhatsApp y la lectura del portal de la SCBA son tuyos: los carg\u00E1s vos y solo vos los manej\u00E1s." }), error && _jsx(ErrorBanner, { message: error }), !cfg && !error && _jsx(ListSkeleton, { rows: 2 }), cfg && (_jsxs("div", { className: "flex flex-col gap-8", children: [!cfg.puede_editar && (_jsx("p", { className: "rounded-sharp border border-line px-4 py-3 text-sm text-text-gray-light", children: "Solo el titular del estudio puede cambiar esto. En la demostraci\u00F3n tampoco se puede." })), _jsx(SeccionWhatsApp, { cfg: cfg, recargar: recargar }), _jsx(SeccionPortal, { cfg: cfg, recargar: recargar })] }))] }));
}
function Encabezado({ icono: Icono, titulo, estado, activo }) {
    return (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Icono, { className: "h-5 w-5 text-silver", strokeWidth: 1.5, "aria-hidden": "true" }), _jsx("h2", { className: "text-lg font-black text-white", children: titulo })] }), _jsxs("span", { className: `inline-flex items-center gap-1.5 text-xs ${activo ? 'text-success' : 'text-text-gray-light'}`, children: [activo && _jsx(CheckIcon, { className: "h-3.5 w-3.5", strokeWidth: 2, "aria-hidden": "true" }), estado] })] }));
}
function Mensaje({ texto, tipo }) {
    if (!texto)
        return null;
    return (_jsx("p", { role: tipo === 'error' ? 'alert' : 'status', className: `mt-4 text-sm ${tipo === 'error' ? 'text-warning' : 'text-success'}`, children: texto }));
}
function SeccionWhatsApp({ cfg, recargar }) {
    const { whatsapp: w, puede_editar: puedeEditar } = cfg;
    const [numero, setNumero] = useState('');
    const [codigo, setCodigo] = useState('');
    const [cambiando, setCambiando] = useState(false);
    const [ocupado, setOcupado] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const pidiendoNumero = cambiando || (!w.verificado && !w.pendiente_de_verificar);
    const esperandoCodigo = !cambiando && w.pendiente_de_verificar;
    const bloqueado = !puedeEditar || !w.plataforma_lista || ocupado;
    async function ejecutar(accion) {
        setOcupado(true);
        setMensaje(null);
        try {
            const texto = await accion();
            if (texto)
                setMensaje({ texto, tipo: 'ok' });
        }
        catch (e) {
            setMensaje({ texto: mensajeDeError(e), tipo: 'error' });
        }
        finally {
            setOcupado(false);
            recargar();
        }
    }
    const enviarCodigo = (e) => {
        e.preventDefault();
        void ejecutar(async () => {
            const r = await api.cargarWhatsApp(numero);
            setNumero('');
            setCambiando(false);
            return r.verificado ? 'Ese número ya estaba verificado.' : `Te mandamos un código por WhatsApp al ${r.numero}. Vence en ${r.vence_en_minutos ?? 10} minutos.`;
        });
    };
    const verificar = (e) => {
        e.preventDefault();
        void ejecutar(async () => {
            await api.verificarWhatsApp(codigo);
            setCodigo('');
            return 'Listo: número verificado. Desde ahora te avisamos por WhatsApp.';
        });
    };
    return (_jsxs("section", { className: "superficie p-6 sm:p-8", "aria-labelledby": "cfg-whatsapp", children: [_jsx(Encabezado, { icono: MessageCircleIcon, titulo: "Avisos por WhatsApp", estado: w.verificado ? 'Activos' : w.pendiente_de_verificar ? 'Falta verificar el número' : 'Sin número cargado', activo: w.verificado }), _jsx("h3", { id: "cfg-whatsapp", className: "sr-only", children: "Avisos por WhatsApp" }), _jsx("p", { className: "mt-3 max-w-2xl text-sm leading-relaxed text-silver-deep", children: "Un resumen a la ma\u00F1ana, un recordatorio antes de cada audiencia, lo que vence hoy a la tarde y las novedades del portal apenas llegan. Se mandan al n\u00FAmero que cargues ac\u00E1." }), !w.plataforma_lista && (_jsx("p", { className: "mt-4 rounded-sharp border border-line px-4 py-3 text-sm text-text-gray-light", children: "Los avisos por WhatsApp todav\u00EDa no est\u00E1n habilitados en el sistema. Cuando lo est\u00E9n vas a poder cargar tu n\u00FAmero ac\u00E1." })), w.verificado && !cambiando && (_jsxs("div", { className: "mt-5 flex flex-wrap items-center gap-x-6 gap-y-3", children: [_jsxs("div", { children: [_jsx("div", { className: etiquetaClases, children: "N\u00FAmero de aviso" }), _jsx("div", { className: "mt-0.5 text-[15px] font-bold tabular-nums text-white", children: w.numero }), w.origen === 'entorno' && _jsx("div", { className: "mt-0.5 text-xs text-text-gray-light", children: "Cargado por quien instal\u00F3 el sistema. Carg\u00E1 el tuyo para reemplazarlo." })] }), puedeEditar && (_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", className: botonSecundario, disabled: bloqueado, onClick: () => void ejecutar(async () => {
                                    if (!window.confirm('Se enviará un WhatsApp de prueba a tu número. ¿Seguimos?'))
                                        return null;
                                    const r = await alertasApi.enviarPrueba();
                                    return `Aviso de prueba enviado (${r.pendientes} novedades pendientes). Revisá tu WhatsApp.`;
                                }), children: "Enviar aviso de prueba" }), _jsx(Button, { variant: "ghost", size: "sm", className: botonSecundario, disabled: bloqueado, onClick: () => setCambiando(true), children: "Cambiar n\u00FAmero" }), _jsx(Button, { variant: "ghost", size: "sm", className: botonSecundario, disabled: bloqueado, onClick: () => void ejecutar(async () => {
                                    if (!window.confirm('Vas a dejar de recibir avisos por WhatsApp. ¿Quitamos el número?'))
                                        return null;
                                    await api.quitarWhatsApp();
                                    return 'Número quitado: no vas a recibir más avisos por WhatsApp.';
                                }), children: "Quitar" })] }))] })), pidiendoNumero && puedeEditar && w.plataforma_lista && (_jsxs("form", { onSubmit: enviarCodigo, className: "mt-5 flex max-w-md flex-col gap-3", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "cfg-numero", className: etiquetaClases, children: "Tu n\u00FAmero de WhatsApp (celular, con c\u00F3digo de \u00E1rea y sin el 15)" }), _jsx(Input, { id: "cfg-numero", className: `${campoClases} mt-1`, value: numero, onChange: (e) => setNumero(e.target.value), placeholder: "221 612-3456", inputMode: "tel", autoComplete: "tel", required: true })] }), _jsx("p", { className: "text-xs leading-relaxed text-text-gray-light", children: "Te mandamos un c\u00F3digo a ese n\u00FAmero para confirmar que es tuyo. Hasta que lo confirmes no se usa." }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "submit", className: botonPrincipal, disabled: bloqueado || numero.trim() === '', children: ocupado ? 'Enviando…' : 'Enviarme el código' }), cambiando && (_jsx(Button, { type: "button", variant: "ghost", className: botonSecundario, onClick: () => setCambiando(false), children: "Cancelar" }))] })] })), esperandoCodigo && puedeEditar && (_jsxs("form", { onSubmit: verificar, className: "mt-5 flex max-w-md flex-col gap-3", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "cfg-codigo", className: etiquetaClases, children: ["C\u00F3digo que te lleg\u00F3 por WhatsApp al ", w.numero] }), _jsx(Input, { id: "cfg-codigo", className: `${campoClases} mt-1 text-center text-lg tracking-[0.4em] tabular-nums`, value: codigo, onChange: (e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6)), placeholder: "000000", inputMode: "numeric", autoComplete: "one-time-code", maxLength: 6, required: true })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "submit", className: botonPrincipal, disabled: bloqueado || codigo.length !== 6, children: ocupado ? 'Verificando…' : 'Verificar' }), _jsx(Button, { type: "button", variant: "ghost", className: botonSecundario, onClick: () => setCambiando(true), disabled: ocupado, children: "Cambiar el n\u00FAmero" })] })] })), _jsx(Mensaje, { texto: mensaje?.texto ?? null, tipo: mensaje?.tipo ?? 'ok' })] }));
}
function SeccionPortal({ cfg, recargar }) {
    const { portal: p, puede_editar: puedeEditar } = cfg;
    const [domicilio, setDomicilio] = useState('');
    const [clave, setClave] = useState('');
    const [cambiando, setCambiando] = useState(false);
    const [ocupado, setOcupado] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [estado, setEstado] = useState(null);
    useEffect(() => {
        if (!p.cargado)
            return;
        portalApi.obtenerEstado().then(setEstado).catch(() => setEstado(null));
    }, [p.cargado, p.actualizado_en]);
    const mostrandoFormulario = cambiando || !p.cargado;
    const bloqueado = !puedeEditar || !p.cifrado_listo || ocupado;
    async function guardar(e) {
        e.preventDefault();
        setOcupado(true);
        setMensaje(null);
        try {
            await api.cargarPortal(domicilio.trim(), clave);
            setDomicilio('');
            setCambiando(false);
            setMensaje({ texto: 'Listo: el portal aceptó tus credenciales y quedaron guardadas. En unos minutos empieza a leer tus notificaciones.', tipo: 'ok' });
        }
        catch (err) {
            setMensaje({ texto: mensajeDeError(err), tipo: 'error' });
        }
        finally {
            // La contraseña no queda en pantalla pase lo que pase.
            setClave('');
            setOcupado(false);
            recargar();
        }
    }
    async function quitar() {
        if (!window.confirm('El sistema dejará de leer tu portal y de avisarte las novedades. ¿Quitamos las credenciales?'))
            return;
        setOcupado(true);
        setMensaje(null);
        try {
            await api.quitarPortal();
            setMensaje({ texto: 'Credenciales borradas.', tipo: 'ok' });
        }
        catch (err) {
            setMensaje({ texto: mensajeDeError(err), tipo: 'error' });
        }
        finally {
            setOcupado(false);
            recargar();
        }
    }
    const lectura = !p.cargado || estado === null
        ? null
        : estado.pausada
            ? 'Lectura PAUSADA: el portal rechazó la contraseña. Cargá las credenciales de nuevo.'
            : estado.errores_consecutivos > 0
                ? `La última lectura falló${estado.ultimo_error ? `: ${estado.ultimo_error}` : '.'}`
                : estado.ultimo_ok
                    ? `Última lectura ${haceCuanto(estado.ultimo_ok)}: ${estado.ultimas_nuevas} novedades nuevas.`
                    : 'Todavía no hizo su primera lectura (se hace sola cada 30 minutos, de 7 a 22 hs).';
    return (_jsxs("section", { className: "superficie p-6 sm:p-8", "aria-labelledby": "cfg-portal", children: [_jsx(Encabezado, { icono: KeyRoundIcon, titulo: "Portal de Notificaciones de la SCBA", estado: p.cargado ? 'Conectado' : 'Sin credenciales', activo: p.cargado }), _jsx("h3", { id: "cfg-portal", className: "sr-only", children: "Portal de Notificaciones" }), _jsx("p", { className: "mt-3 max-w-2xl text-sm leading-relaxed text-silver-deep", children: "Con tu domicilio electr\u00F3nico y tu contrase\u00F1a el sistema entra solo al portal, trae tus notificaciones y te propone el plazo de cada una. Son tus credenciales personales: se cargan una sola vez." }), !p.cifrado_listo && (_jsx("p", { className: "mt-4 rounded-sharp border border-line px-4 py-3 text-sm text-text-gray-light", children: "El sistema todav\u00EDa no puede guardar credenciales (falta una clave de seguridad). Avisale al administrador." })), p.cargado && !cambiando && (_jsxs("div", { className: "mt-5 flex flex-wrap items-center gap-x-6 gap-y-3", children: [_jsxs("div", { children: [_jsx("div", { className: etiquetaClases, children: "Domicilio electr\u00F3nico" }), _jsx("div", { className: "mt-0.5 break-all text-[15px] font-bold text-white", children: p.etiqueta ?? 'Cargado por quien instaló el sistema' }), p.propio && p.actualizado_en && _jsxs("div", { className: "mt-0.5 text-xs text-text-gray-light", children: ["Cargado ", haceCuanto(p.actualizado_en), ". La contrase\u00F1a no se vuelve a mostrar."] }), lectura && _jsx("div", { className: "mt-1 text-xs text-text-gray-light", children: lectura })] }), puedeEditar && (_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", className: botonSecundario, disabled: bloqueado, onClick: () => setCambiando(true), children: p.propio ? 'Cambiar credenciales' : 'Cargar las mías' }), p.propio && (_jsx(Button, { variant: "ghost", size: "sm", className: botonSecundario, disabled: bloqueado, onClick: () => void quitar(), children: "Quitar" }))] }))] })), mostrandoFormulario && puedeEditar && p.cifrado_listo && (_jsxs("form", { onSubmit: (e) => void guardar(e), className: "mt-5 flex max-w-md flex-col gap-3", autoComplete: "off", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "cfg-domicilio", className: etiquetaClases, children: "Domicilio electr\u00F3nico" }), _jsx(Input, { id: "cfg-domicilio", className: `${campoClases} mt-1`, value: domicilio, onChange: (e) => setDomicilio(e.target.value), placeholder: "20123456789@notificaciones.scba.gov.ar", autoComplete: "off", spellCheck: false, required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "cfg-clave", className: etiquetaClases, children: "Contrase\u00F1a del portal" }), _jsx(Input, { id: "cfg-clave", type: "password", className: `${campoClases} mt-1`, value: clave, onChange: (e) => setClave(e.target.value), autoComplete: "new-password", required: true })] }), _jsx("p", { className: "text-xs leading-relaxed text-text-gray-light", children: "Antes de guardar entramos una vez al portal para comprobar que son correctas; si las rechaza, no se guarda nada. Se guardan cifradas y ninguna pantalla las vuelve a mostrar." }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "submit", className: botonPrincipal, disabled: bloqueado || domicilio.trim() === '' || clave === '', children: ocupado ? 'Comprobando con el portal…' : 'Comprobar y guardar' }), cambiando && (_jsx(Button, { type: "button", variant: "ghost", className: botonSecundario, onClick: () => { setCambiando(false); setClave(''); }, disabled: ocupado, children: "Cancelar" }))] })] })), _jsx(Mensaje, { texto: mensaje?.texto ?? null, tipo: mensaje?.tipo ?? 'ok' })] }));
}
