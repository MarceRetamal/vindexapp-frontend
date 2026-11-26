import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api } from '../api/cliente';
import { Input } from '@/componentes/ui/input';
import { Textarea } from '@/componentes/ui/textarea';
import { Button } from '@/componentes/ui/button';
const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';
export function FormularioCliente({ cliente, onGuardado, onCancelar, }) {
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
    const [error, setError] = useState(null);
    async function enviar(e) {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        const datos = {
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
                onGuardado(cliente.id);
            }
            else {
                const creado = await api.crearCliente(datos);
                onGuardado(creado.id);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar el cliente.');
        }
        finally {
            setEnviando(false);
        }
    }
    return (_jsxs("form", { onSubmit: enviar, className: "superficie p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "cliente-nombre", className: etiquetaClases, children: "Nombre" }), _jsx(Input, { id: "cliente-nombre", className: campoClases, value: nombre, onChange: (e) => setNombre(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "cliente-apellido", className: etiquetaClases, children: "Apellido" }), _jsx(Input, { id: "cliente-apellido", className: campoClases, value: apellido, onChange: (e) => setApellido(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "cliente-dni", className: etiquetaClases, children: "DNI" }), _jsx(Input, { id: "cliente-dni", className: campoClases, value: dni, onChange: (e) => setDni(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "cliente-email", className: etiquetaClases, children: "Email" }), _jsx(Input, { id: "cliente-email", type: "email", className: campoClases, value: email, onChange: (e) => setEmail(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "cliente-whatsapp", className: etiquetaClases, children: "WhatsApp" }), _jsx(Input, { id: "cliente-whatsapp", className: campoClases, value: whatsapp, onChange: (e) => setWhatsapp(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "cliente-telefono", className: etiquetaClases, children: "Tel\u00E9fono fijo" }), _jsx(Input, { id: "cliente-telefono", className: campoClases, value: telefonoFijo, onChange: (e) => setTelefonoFijo(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "cliente-domicilio", className: etiquetaClases, children: "Domicilio" }), _jsx(Input, { id: "cliente-domicilio", className: campoClases, value: domicilio, onChange: (e) => setDomicilio(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "cliente-localidad", className: etiquetaClases, children: "Localidad" }), _jsx(Input, { id: "cliente-localidad", className: campoClases, value: localidad, onChange: (e) => setLocalidad(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1 sm:col-span-2", children: [_jsx("label", { htmlFor: "cliente-notas", className: etiquetaClases, children: "Notas" }), _jsx(Textarea, { id: "cliente-notas", className: `${campoClases} resize-y min-h-[60px]`, value: notas, onChange: (e) => setNotas(e.target.value) })] }), error && _jsx("div", { className: "sm:col-span-2 text-warning text-sm", children: error }), _jsxs("div", { className: "sm:col-span-2 flex gap-2", children: [_jsx(Button, { type: "submit", disabled: enviando, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60", children: enviando ? 'Guardando…' : cliente ? 'Guardar cambios' : 'Guardar cliente' }), onCancelar && (_jsx(Button, { type: "button", variant: "ghost", onClick: onCancelar, disabled: enviando, className: "rounded-sharp border border-line text-text-gray-light hover:text-white", children: "Cancelar" }))] })] }));
}
