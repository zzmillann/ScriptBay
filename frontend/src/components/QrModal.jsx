import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, QrCode } from 'lucide-react';
import encodeQR from 'qr';

const QrModal = ({ url, title, isOpen, onClose }) => {
    const [svgContent, setSvgContent] = useState('');
    const [copied, setCopied] = useState(false);
    const backdropRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !url) return;
        const svg = encodeQR(url, 'svg', { ecc: 'medium', scale: 8 });
        setSvgContent(svg);
    }, [isOpen, url]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const handleCopy = () => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleBackdrop = (e) => {
        if (e.target === backdropRef.current) onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={backdropRef}
                    onClick={handleBackdrop}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ds-modal-backdrop flex items-center justify-center px-4"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 12 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="ds-modal-shell w-full max-w-sm p-7"
                    >
                        {/* Botón cerrar */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-5 top-5 rounded-lg p-1 text-zinc-400 dark:text-white/40 transition hover:text-zinc-700 dark:hover:text-white/80"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Cabecera */}
                        <div className="flex items-center gap-2 mb-5">
                            <QrCode className="w-5 h-5 text-primary" />
                            <h2 className="text-base-primary text-lg font-bold">Compartir producto</h2>
                        </div>

                        <p className="text-base-secondary text-sm mb-4 line-clamp-1">{title}</p>

                        {/* QR Code */}
                        <div className="flex justify-center mb-5">
                            <div className="p-3 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                                {svgContent ? (
                                    <div
                                        className="w-48 h-48"
                                        // SVG generado internamente por la librería qr (paulmillr-qr), sin contenido de usuario
                                        // eslint-disable-next-line react/no-danger
                                        dangerouslySetInnerHTML={{ __html: svgContent }}
                                    />
                                ) : (
                                    <div className="w-48 h-48 bg-zinc-100 animate-pulse rounded-xl" />
                                )}
                            </div>
                        </div>

                        {/* URL + copiar */}
                        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-3 py-2">
                            <span className="flex-1 text-xs text-base-secondary truncate font-mono">{url}</span>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-all duration-200 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-emerald-500">Copiado</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        Copiar
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-center text-xs text-faint mt-4">
                            Escanea el código QR para abrir este producto
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QrModal;
