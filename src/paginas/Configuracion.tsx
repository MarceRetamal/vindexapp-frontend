import { useCallback, useEffect, useState } from 'react';
import { CheckIcon, KeyRoundIcon, MessageCircleIcon } from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { api, type ConfiguracionEstudio } from '../api/configuracion';
import { api as alertasApi, mensajeDeError } from '../api/alertas';
import { api as portalApi, type EstadoPortal } from '../api/portal';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { PageHeader } from '../componentes/PageHeader';
import { haceCuanto } from '../lib/fechas';

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';
const botonPrincipal =
  'rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold uppercase tracking-[0.08em] text-xs hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver';
const botonSecundario = 'rounded-sharp border border-line text-text-gray-light hover:text-white';

/**
 * Lo que cada estudio configura por su cuenta: el número de WhatsApp de los avisos y las credenciales del Portal de
 * Notificaciones. Las carga el titular; nadie más las habilita ni las maneja, y ninguna pantalla las vuelve a mostrar.
 */
export function Configuracion() {
  const [cfg, setCfg] = useState<ConfiguracionEstudio | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(() => {
    api
      .obtener()
      .then((c) => {
        setCfg(c);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(recargar, [recargar]);

  return (
    <div>
      <PageHeader
        eyebrow="Estudio"
        title="Configuración"
        descripcion="Los avisos por WhatsApp y la lectura del portal de la SCBA son tuyos: los cargás vos y solo vos los manejás."
      />
      {error && <ErrorBanner message={error} />}
      {!cfg && !error && <ListSkeleton rows={2} />}
      {cfg && (
        <div className="flex flex-col gap-8">
          {!cfg.puede_editar && (
            <p className="rounded-sharp border border-line px-4 py-3 text-sm text-text-gray-light">
              Solo el titular del estudio puede cambiar esto. En la demostración tampoco se puede.
            </p>
          )}
          <SeccionWhatsApp cfg={cfg} recargar={recargar} />
          <SeccionPortal cfg={cfg} recargar={recargar} />
        </div>
      )}
    </div>
  );
}

function Encabezado({ icono: Icono, titulo, estado, activo }: { icono: typeof KeyRoundIcon; titulo: string; estado: string; activo: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Icono className="h-5 w-5 text-silver" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="text-lg font-black text-white">{titulo}</h2>
      </div>
      <span className={`inline-flex items-center gap-1.5 text-xs ${activo ? 'text-success' : 'text-text-gray-light'}`}>
        {activo && <CheckIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />}
        {estado}
      </span>
    </div>
  );
}

function Mensaje({ texto, tipo }: { texto: string | null; tipo: 'ok' | 'error' }) {
  if (!texto) return null;
  return (
    <p role={tipo === 'error' ? 'alert' : 'status'} className={`mt-4 text-sm ${tipo === 'error' ? 'text-warning' : 'text-success'}`}>
      {texto}
    </p>
  );
}

function SeccionWhatsApp({ cfg, recargar }: { cfg: ConfiguracionEstudio; recargar: () => void }) {
  const { whatsapp: w, puede_editar: puedeEditar } = cfg;
  const [numero, setNumero] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cambiando, setCambiando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null);

  const pidiendoNumero = cambiando || (!w.verificado && !w.pendiente_de_verificar);
  const esperandoCodigo = !cambiando && w.pendiente_de_verificar;
  const bloqueado = !puedeEditar || !w.plataforma_lista || ocupado;

  async function ejecutar(accion: () => Promise<string | null>) {
    setOcupado(true);
    setMensaje(null);
    try {
      const texto = await accion();
      if (texto) setMensaje({ texto, tipo: 'ok' });
    } catch (e) {
      setMensaje({ texto: mensajeDeError(e), tipo: 'error' });
    } finally {
      setOcupado(false);
      recargar();
    }
  }

  const enviarCodigo = (e: React.FormEvent) => {
    e.preventDefault();
    void ejecutar(async () => {
      const r = await api.cargarWhatsApp(numero);
      setNumero('');
      setCambiando(false);
      return r.verificado ? 'Ese número ya estaba verificado.' : `Te mandamos un código por WhatsApp al ${r.numero}. Vence en ${r.vence_en_minutos ?? 10} minutos.`;
    });
  };

  const verificar = (e: React.FormEvent) => {
    e.preventDefault();
    void ejecutar(async () => {
      await api.verificarWhatsApp(codigo);
      setCodigo('');
      return 'Listo: número verificado. Desde ahora te avisamos por WhatsApp.';
    });
  };

  return (
    <section className="superficie p-6 sm:p-8" aria-labelledby="cfg-whatsapp">
      <Encabezado
        icono={MessageCircleIcon}
        titulo="Avisos por WhatsApp"
        estado={w.verificado ? 'Activos' : w.pendiente_de_verificar ? 'Falta verificar el número' : 'Sin número cargado'}
        activo={w.verificado}
      />
      <h3 id="cfg-whatsapp" className="sr-only">Avisos por WhatsApp</h3>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-silver-deep">
        Un resumen a la mañana, un recordatorio antes de cada audiencia, lo que vence hoy a la tarde y las novedades del portal apenas llegan. Se
        mandan al número que cargues acá.
      </p>

      {!w.plataforma_lista && (
        <p className="mt-4 rounded-sharp border border-line px-4 py-3 text-sm text-text-gray-light">
          Los avisos por WhatsApp todavía no están habilitados en el sistema. Cuando lo estén vas a poder cargar tu número acá.
        </p>
      )}

      {w.verificado && !cambiando && (
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <div className={etiquetaClases}>Número de aviso</div>
            <div className="mt-0.5 text-[15px] font-bold tabular-nums text-white">{w.numero}</div>
            {w.origen === 'entorno' && <div className="mt-0.5 text-xs text-text-gray-light">Cargado por quien instaló el sistema. Cargá el tuyo para reemplazarlo.</div>}
          </div>
          {puedeEditar && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={botonSecundario}
                disabled={bloqueado}
                onClick={() => void ejecutar(async () => {
                  if (!window.confirm('Se enviará un WhatsApp de prueba a tu número. ¿Seguimos?')) return null;
                  const r = await alertasApi.enviarPrueba();
                  return `Aviso de prueba enviado (${r.pendientes} novedades pendientes). Revisá tu WhatsApp.`;
                })}
              >
                Enviar aviso de prueba
              </Button>
              <Button variant="ghost" size="sm" className={botonSecundario} disabled={bloqueado} onClick={() => setCambiando(true)}>
                Cambiar número
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={botonSecundario}
                disabled={bloqueado}
                onClick={() => void ejecutar(async () => {
                  if (!window.confirm('Vas a dejar de recibir avisos por WhatsApp. ¿Quitamos el número?')) return null;
                  await api.quitarWhatsApp();
                  return 'Número quitado: no vas a recibir más avisos por WhatsApp.';
                })}
              >
                Quitar
              </Button>
            </div>
          )}
        </div>
      )}

      {pidiendoNumero && puedeEditar && w.plataforma_lista && (
        <form onSubmit={enviarCodigo} className="mt-5 flex max-w-md flex-col gap-3">
          <div>
            <label htmlFor="cfg-numero" className={etiquetaClases}>Tu número de WhatsApp (celular, con código de área y sin el 15)</label>
            <Input
              id="cfg-numero"
              className={`${campoClases} mt-1`}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="221 612-3456"
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </div>
          <p className="text-xs leading-relaxed text-text-gray-light">Te mandamos un código a ese número para confirmar que es tuyo. Hasta que lo confirmes no se usa.</p>
          <div className="flex gap-2">
            <Button type="submit" className={botonPrincipal} disabled={bloqueado || numero.trim() === ''}>
              {ocupado ? 'Enviando…' : 'Enviarme el código'}
            </Button>
            {cambiando && (
              <Button type="button" variant="ghost" className={botonSecundario} onClick={() => setCambiando(false)}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      )}

      {esperandoCodigo && puedeEditar && (
        <form onSubmit={verificar} className="mt-5 flex max-w-md flex-col gap-3">
          <div>
            <label htmlFor="cfg-codigo" className={etiquetaClases}>Código que te llegó por WhatsApp al {w.numero}</label>
            <Input
              id="cfg-codigo"
              className={`${campoClases} mt-1 text-center text-lg tracking-[0.4em] tabular-nums`}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className={botonPrincipal} disabled={bloqueado || codigo.length !== 6}>
              {ocupado ? 'Verificando…' : 'Verificar'}
            </Button>
            <Button type="button" variant="ghost" className={botonSecundario} onClick={() => setCambiando(true)} disabled={ocupado}>
              Cambiar el número
            </Button>
          </div>
        </form>
      )}

      <Mensaje texto={mensaje?.texto ?? null} tipo={mensaje?.tipo ?? 'ok'} />
    </section>
  );
}

function SeccionPortal({ cfg, recargar }: { cfg: ConfiguracionEstudio; recargar: () => void }) {
  const { portal: p, puede_editar: puedeEditar } = cfg;
  const [domicilio, setDomicilio] = useState('');
  const [clave, setClave] = useState('');
  const [cambiando, setCambiando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null);
  const [estado, setEstado] = useState<EstadoPortal | null>(null);

  useEffect(() => {
    if (!p.cargado) return;
    portalApi.obtenerEstado().then(setEstado).catch(() => setEstado(null));
  }, [p.cargado, p.actualizado_en]);

  const mostrandoFormulario = cambiando || !p.cargado;
  const bloqueado = !puedeEditar || !p.cifrado_listo || ocupado;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setMensaje(null);
    try {
      await api.cargarPortal(domicilio.trim(), clave);
      setDomicilio('');
      setCambiando(false);
      setMensaje({ texto: 'Listo: el portal aceptó tus credenciales y quedaron guardadas. En unos minutos empieza a leer tus notificaciones.', tipo: 'ok' });
    } catch (err) {
      setMensaje({ texto: mensajeDeError(err), tipo: 'error' });
    } finally {
      // La contraseña no queda en pantalla pase lo que pase.
      setClave('');
      setOcupado(false);
      recargar();
    }
  }

  async function quitar() {
    if (!window.confirm('El sistema dejará de leer tu portal y de avisarte las novedades. ¿Quitamos las credenciales?')) return;
    setOcupado(true);
    setMensaje(null);
    try {
      await api.quitarPortal();
      setMensaje({ texto: 'Credenciales borradas.', tipo: 'ok' });
    } catch (err) {
      setMensaje({ texto: mensajeDeError(err), tipo: 'error' });
    } finally {
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

  return (
    <section className="superficie p-6 sm:p-8" aria-labelledby="cfg-portal">
      <Encabezado
        icono={KeyRoundIcon}
        titulo="Portal de Notificaciones de la SCBA"
        estado={p.cargado ? 'Conectado' : 'Sin credenciales'}
        activo={p.cargado}
      />
      <h3 id="cfg-portal" className="sr-only">Portal de Notificaciones</h3>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-silver-deep">
        Con tu domicilio electrónico y tu contraseña el sistema entra solo al portal, trae tus notificaciones y te propone el plazo de cada una. Son
        tus credenciales personales: se cargan una sola vez.
      </p>

      {!p.cifrado_listo && (
        <p className="mt-4 rounded-sharp border border-line px-4 py-3 text-sm text-text-gray-light">
          El sistema todavía no puede guardar credenciales (falta una clave de seguridad). Avisale al administrador.
        </p>
      )}

      {p.cargado && !cambiando && (
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <div className={etiquetaClases}>Domicilio electrónico</div>
            <div className="mt-0.5 break-all text-[15px] font-bold text-white">{p.etiqueta ?? 'Cargado por quien instaló el sistema'}</div>
            {p.propio && p.actualizado_en && <div className="mt-0.5 text-xs text-text-gray-light">Cargado {haceCuanto(p.actualizado_en)}. La contraseña no se vuelve a mostrar.</div>}
            {lectura && <div className="mt-1 text-xs text-text-gray-light">{lectura}</div>}
          </div>
          {puedeEditar && (
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" className={botonSecundario} disabled={bloqueado} onClick={() => setCambiando(true)}>
                {p.propio ? 'Cambiar credenciales' : 'Cargar las mías'}
              </Button>
              {p.propio && (
                <Button variant="ghost" size="sm" className={botonSecundario} disabled={bloqueado} onClick={() => void quitar()}>
                  Quitar
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {mostrandoFormulario && puedeEditar && p.cifrado_listo && (
        <form onSubmit={(e) => void guardar(e)} className="mt-5 flex max-w-md flex-col gap-3" autoComplete="off">
          <div>
            <label htmlFor="cfg-domicilio" className={etiquetaClases}>Domicilio electrónico</label>
            <Input
              id="cfg-domicilio"
              className={`${campoClases} mt-1`}
              value={domicilio}
              onChange={(e) => setDomicilio(e.target.value)}
              placeholder="20123456789@notificaciones.scba.gov.ar"
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>
          <div>
            <label htmlFor="cfg-clave" className={etiquetaClases}>Contraseña del portal</label>
            <Input id="cfg-clave" type="password" className={`${campoClases} mt-1`} value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="new-password" required />
          </div>
          <p className="text-xs leading-relaxed text-text-gray-light">
            Antes de guardar entramos una vez al portal para comprobar que son correctas; si las rechaza, no se guarda nada. Se guardan cifradas y
            ninguna pantalla las vuelve a mostrar.
          </p>
          <div className="flex gap-2">
            <Button type="submit" className={botonPrincipal} disabled={bloqueado || domicilio.trim() === '' || clave === ''}>
              {ocupado ? 'Comprobando con el portal…' : 'Comprobar y guardar'}
            </Button>
            {cambiando && (
              <Button type="button" variant="ghost" className={botonSecundario} onClick={() => { setCambiando(false); setClave(''); }} disabled={ocupado}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      )}

      <Mensaje texto={mensaje?.texto ?? null} tipo={mensaje?.tipo ?? 'ok'} />
    </section>
  );
}
