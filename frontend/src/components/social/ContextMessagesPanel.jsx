import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, MessageCircleMore, Send, Sparkles } from 'lucide-react';
import { getSession } from '../../services/authClient';
import { getAuctionChat, getProductChat, postAuctionMessage, postProductMessage } from '../../services/socialClient';

const getChatApi = (contextType) => {
    if (contextType === 'subasta') {
        return {
            load: getAuctionChat,
            send: postAuctionMessage
        };
    }

    return {
        load: getProductChat,
        send: postProductMessage
    };
};

const formatMessageDate = (iso) => {
    try {
        return new Date(iso).toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return iso;
    }
};

const ContextMessagesPanel = ({ contextType = 'producto', contextId, buyerId = null, title, sellerName, disabled = false, disabledMessage = '' }) => {
    const session = getSession();
    const [payload, setPayload] = useState({ messages: [], peer: null, thread: null, needsBuyerSelection: false });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!contextId || !session || disabled) {
            setLoading(false);
            return;
        }

        let ignore = false;
        const { load } = getChatApi(contextType);

        const refresh = async () => {
            const requestPayload = contextType === 'subasta'
                ? { subastaId: contextId, buyerId }
                : { productoId: contextId, buyerId };
            const data = await load(requestPayload);
            if (ignore) return;

            if (data.codigo !== 0) {
                setError(data.mensaje || 'No se pudo abrir la conversacion.');
                setLoading(false);
                return;
            }

            setPayload(data);
            setError('');
            setLoading(false);
        };

        refresh();
        const timer = window.setInterval(refresh, 9000);

        return () => {
            ignore = true;
            window.clearInterval(timer);
        };
    }, [buyerId, contextId, contextType, disabled, session]);

    const handleSend = async (event) => {
        event.preventDefault();
        if (!draft.trim()) return;

        const { send } = getChatApi(contextType);
        setSending(true);
        setError('');

        const requestPayload = contextType === 'subasta'
            ? { subastaId: contextId, buyerId, contenido: draft }
            : { productoId: contextId, buyerId, contenido: draft };

        const data = await send(requestPayload);
        if (data.codigo !== 0) {
            setError(data.mensaje || 'No se pudo enviar el mensaje.');
            setSending(false);
            return;
        }

        setPayload((current) => ({
            ...current,
            thread: data.thread || current.thread,
            messages: [...(current.messages || []), data.message]
        }));
        setDraft('');
        setSending(false);
    };

    return (
        <section className="glass-card border-none p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/34">Direct channel</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Mensajería privada</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">
                        Un hilo contextual y premium para resolver dudas, soporte y seguimiento alrededor de {title || 'este contexto'}.
                    </p>
                </div>
                <div className="rounded-[1.8rem] border border-white/10 bg-black/20 px-5 py-4 text-right">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/34">Canal activo</p>
                    <p className="mt-2 text-base font-semibold text-white">{payload.peer?.nombre || sellerName || 'Vendedor'}</p>
                    <p className="mt-1 text-xs text-white/42">Conversación contextual integrada</p>
                </div>
            </div>

            {disabled ? (
                <div className="mt-6 rounded-[1.6rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/48">
                    {disabledMessage}
                </div>
            ) : !session ? (
                <div className="mt-6 rounded-[1.6rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/48">
                    Inicia sesión para abrir el canal directo con el vendedor.
                </div>
            ) : loading ? (
                <div className="mt-6 flex items-center gap-3 rounded-[1.6rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/48">
                    <Loader2 className="h-4 w-4 animate-spin text-red-200/70" />
                    Cargando conversación...
                </div>
            ) : payload.needsBuyerSelection ? (
                <div className="mt-6 rounded-[1.6rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/48">
                    Este hilo está preparado para el vendedor, pero necesita seleccionar primero el comprador específico.
                </div>
            ) : (
                <div className="mt-6 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-white">Canal en vivo</p>
                                <p className="mt-1 text-xs text-white/42">Mensajes persistentes entre comprador y vendedor.</p>
                            </div>
                            <MessageCircleMore className="h-4.5 w-4.5 text-red-100/76" />
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence initial={false}>
                                {(payload.messages || []).length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/44"
                                    >
                                        Este canal todavía no tiene mensajes. El primer envío abrirá un hilo privado real dentro de ScriptBay.
                                    </motion.div>
                                ) : (
                                    (payload.messages || []).map((message) => {
                                        const mine = message.sender_id === session?.datosCliente?.id;

                                        return (
                                            <motion.article
                                                key={message.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[88%] rounded-[1.6rem] border px-4 py-3 ${mine
                                                    ? 'border-red-400/16 bg-red-500/[0.10] text-red-50'
                                                    : 'border-white/10 bg-white/[0.04] text-white/78'
                                                }`}>
                                                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/36">
                                                        <span>{mine ? 'Tú' : message.author?.nombre || 'Vendedor'}</span>
                                                        <span>•</span>
                                                        <span>{formatMessageDate(message.created_at)}</span>
                                                    </div>
                                                    <p className="mt-2 text-sm leading-6">{message.contenido}</p>
                                                </div>
                                            </motion.article>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-5">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-red-100/76">
                            <Sparkles className="h-3.5 w-3.5" />
                            Contacto premium
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/54">
                            Usa este canal para soporte, dudas técnicas, negociación contextual o seguimiento posterior a la compra.
                        </p>

                        <form onSubmit={handleSend} className="mt-5 space-y-4">
                            <textarea
                                rows={5}
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder="Escribe un mensaje claro, corto y útil para el vendedor."
                                className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors duration-300 placeholder:text-white/24 focus:border-red-400/24"
                            />
                            <button type="submit" disabled={sending || !draft.trim()} className="btn-live-cta inline-flex rounded-2xl px-5 py-3 text-sm disabled:opacity-60">
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                {sending ? 'Enviando...' : 'Enviar mensaje'}
                            </button>
                        </form>

                        {sending ? (
                            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/42">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-red-300" />
                                transmitiendo...
                            </div>
                        ) : null}

                        {error ? (
                            <div className="mt-4 rounded-[1.4rem] border border-red-400/16 bg-red-500/[0.08] px-4 py-3 text-sm text-red-100/80">
                                {error}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </section>
    );
};

export default ContextMessagesPanel;