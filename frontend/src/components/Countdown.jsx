import { useEffect, useState } from 'react';

const calcularTiempoRestante = (fechaFin) => {
    const diff = Math.max(0, new Date(fechaFin) - Date.now());
    const dias    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diff % (1000 * 60)) / 1000);
    return { dias, horas, minutos, segundos, expirado: diff === 0 };
};

const Pad = ({ v }) => String(v).padStart(2, '0');

/**
 * Countdown en tiempo real.
 * @param {string} fechaFin - ISO string de la fecha de cierre.
 * @param {function} onExpire - Callback cuando llega a 0.
 * @param {'sm'|'md'|'lg'} size
 */
const Countdown = ({ fechaFin, onExpire, size = 'md' }) => {
    const [tiempo, setTiempo] = useState(() => calcularTiempoRestante(fechaFin));

    useEffect(() => {
        if (tiempo.expirado) {
            onExpire?.();
            return;
        }
        const interval = setInterval(() => {
            const t = calcularTiempoRestante(fechaFin);
            setTiempo(t);
            if (t.expirado) {
                clearInterval(interval);
                onExpire?.();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [fechaFin, onExpire]);

    const esUrgente = !tiempo.expirado && tiempo.dias === 0 && tiempo.horas < 1;

    const clases = {
        sm: { bloque: 'text-xs font-bold', label: 'text-[9px]', sep: 'text-xs' },
        md: { bloque: 'text-sm font-bold',  label: 'text-[10px]', sep: 'text-sm' },
        lg: { bloque: 'text-2xl font-bold tabular-nums', label: 'text-xs', sep: 'text-2xl' },
    }[size] || { bloque: 'text-sm font-bold', label: 'text-[10px]', sep: 'text-sm' };

    if (tiempo.expirado) {
        return (
            <span className={`${clases.bloque} text-zinc-400 dark:text-zinc-500`}>
                Finalizada
            </span>
        );
    }

    const colorCls = esUrgente ? 'text-primary' : 'text-base-primary';

    const Bloque = ({ valor, etiqueta }) => (
        <span className="flex flex-col items-center">
            <span className={`${clases.bloque} ${colorCls} tabular-nums`}><Pad v={valor} /></span>
            <span className={`${clases.label} text-dimmed uppercase tracking-wide`}>{etiqueta}</span>
        </span>
    );

    return (
        <span className="flex items-start gap-1">
            {tiempo.dias > 0 && (
                <>
                    <Bloque valor={tiempo.dias}   etiqueta="d" />
                    <span className={`${clases.sep} ${colorCls} mt-0.5`}>:</span>
                </>
            )}
            <Bloque valor={tiempo.horas}   etiqueta="h" />
            <span className={`${clases.sep} ${colorCls} mt-0.5`}>:</span>
            <Bloque valor={tiempo.minutos}  etiqueta="m" />
            <span className={`${clases.sep} ${colorCls} mt-0.5`}>:</span>
            <Bloque valor={tiempo.segundos} etiqueta="s" />
        </span>
    );
};

export default Countdown;
