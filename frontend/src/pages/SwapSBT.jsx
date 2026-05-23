import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ArrowDownUp,
  CheckCircle2,
  Clock3,
  Coins,
  ExternalLink,
  Fuel,
  Loader2,
  Network,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Zap,
} from 'lucide-react';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, parseEther, formatUnits, parseUnits } from 'viem';
import { TOKEN_ADDRESS, SWAP_ADDRESS, TOKEN_ABI, SWAP_ABI } from '../utils/sbtConfig';

const isZero = (addr) => !addr || addr === '0x0000000000000000000000000000000000000000';

const Panel = ({ title, subtitle, icon: Icon, children, className = '' }) => (
  <div className={`ds-card ds-card-l2 ${className}`} data-interactive="true">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">{subtitle}</p>
        <h2 className="mt-1 text-base font-semibold text-zinc-100 tracking-tight">{title}</h2>
      </div>
      {Icon && (
        <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300">
          <Icon className="h-4 w-4" />
        </span>
      )}
    </div>
    {children}
  </div>
);

const SwapSBT = () => {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { data: ethBalance } = useBalance({ address });

  const [direccion, setDireccion] = useState('eth_to_sbt'); // eth_to_sbt | sbt_to_eth
  const [inputValue, setInputValue] = useState('');
  const [cotizacion, setCotizacion] = useState('0');
  const [balanceSbt, setBalanceSbt] = useState('0');
  const [tasa, setTasa] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState(null); // {tipo: 'ok'|'error', msg, hash?}
  const [gasGwei, setGasGwei] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [swapHistory, setSwapHistory] = useState([]);

  const contratosConfigurados = !isZero(TOKEN_ADDRESS) && !isZero(SWAP_ADDRESS);

  const cargarTasa = async () => {
    if (!contratosConfigurados || !publicClient) return;
    try {
      const t = await publicClient.readContract({
        address: SWAP_ADDRESS,
        abi: SWAP_ABI,
        functionName: 'sbtPorEth',
      });
      setTasa(t);
    } catch (err) {
      console.warn('No se pudo leer tasa', err);
    }
  };

  const cargarBalanceSbt = async () => {
    if (!contratosConfigurados || !publicClient || !address) return;
    try {
      const bal = await publicClient.readContract({
        address: TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      setBalanceSbt(formatUnits(bal, 18));
    } catch (err) {
      console.warn('No se pudo leer balance SBT', err);
    }
  };

  const cargarGas = async () => {
    if (!publicClient) return;
    try {
      const gas = await publicClient.getGasPrice();
      const gwei = Number(formatUnits(gas, 9));
      setGasGwei(gwei);
    } catch {
      setGasGwei(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    const sync = async () => {
      await Promise.all([cargarTasa(), cargarGas()]);
      if (mounted) setLastSync(new Date());
    };

    sync();
    const interval = setInterval(sync, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [publicClient, contratosConfigurados]);

  useEffect(() => {
    if (address) cargarBalanceSbt();
  }, [address, publicClient, contratosConfigurados, feedback]);

  // Cotizar al cambiar input o direccion
  useEffect(() => {
    const cotizar = async () => {
      if (!inputValue || !contratosConfigurados || !publicClient) {
        setCotizacion('0');
        return;
      }
      try {
        if (direccion === 'eth_to_sbt') {
          const wei = parseEther(inputValue);
          const r = await publicClient.readContract({
            address: SWAP_ADDRESS,
            abi: SWAP_ABI,
            functionName: 'cotizarCompra',
            args: [wei],
          });
          setCotizacion(formatUnits(r, 18));
        } else {
          const sbt = parseUnits(inputValue, 18);
          const r = await publicClient.readContract({
            address: SWAP_ADDRESS,
            abi: SWAP_ABI,
            functionName: 'cotizarVenta',
            args: [sbt],
          });
          setCotizacion(formatEther(r));
        }
      } catch (err) {
        setCotizacion('0');
      }
    };
    cotizar();
  }, [inputValue, direccion, publicClient, contratosConfigurados]);

  const tasaFormateada = useMemo(() => {
    if (!tasa) return '—';
    const sbtPorEth = Number(formatUnits(tasa, 18));
    return `1 ETH = ${sbtPorEth.toLocaleString('es-ES')} SBT`;
  }, [tasa]);

  const ejecutarSwap = async () => {
    if (!walletClient || !inputValue || Number(inputValue) <= 0) return;
    setEnviando(true);
    setFeedback(null);
    try {
      let hash;
      if (direccion === 'eth_to_sbt') {
        const wei = parseEther(inputValue);
        hash = await walletClient.writeContract({
          address: SWAP_ADDRESS,
          abi: SWAP_ABI,
          functionName: 'comprarSBT',
          value: wei,
          account: address,
        });
      } else {
        const sbt = parseUnits(inputValue, 18);
        const approveHash = await walletClient.writeContract({
          address: TOKEN_ADDRESS,
          abi: TOKEN_ABI,
          functionName: 'approve',
          args: [SWAP_ADDRESS, sbt],
          account: address,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        hash = await walletClient.writeContract({
          address: SWAP_ADDRESS,
          abi: SWAP_ABI,
          functionName: 'venderSBT',
          args: [sbt],
          account: address,
        });
      }
      await publicClient.waitForTransactionReceipt({ hash });
      setFeedback({ tipo: 'ok', msg: 'Intercambio completado correctamente.', hash });
      setSwapHistory((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          side: direccion,
          input: inputValue,
          output: cotizacion,
          hash,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 6));
      setInputValue('');
    } catch (err) {
      setFeedback({ tipo: 'error', msg: err.shortMessage || err.message || 'Error en la transacción' });
    } finally {
      setEnviando(false);
    }
  };

  const invertir = () => {
    setDireccion((prev) => (prev === 'eth_to_sbt' ? 'sbt_to_eth' : 'eth_to_sbt'));
    setInputValue('');
    setCotizacion('0');
    setFeedback(null);
  };

  const inputSimbolo = direccion === 'eth_to_sbt' ? 'ETH' : 'SBT';
  const outputSimbolo = direccion === 'eth_to_sbt' ? 'SBT' : 'ETH';
  const balanceInput = direccion === 'eth_to_sbt'
    ? Number(ethBalance?.formatted || 0).toFixed(5)
    : Number(balanceSbt).toFixed(4);

  const gasStatus = useMemo(() => {
    if (gasGwei == null) return { label: 'Sin datos', tone: 'text-zinc-400' };
    if (gasGwei <= 2) return { label: 'Bajo', tone: 'text-emerald-300' };
    if (gasGwei <= 10) return { label: 'Medio', tone: 'text-amber-300' };
    return { label: 'Alto', tone: 'text-red-300' };
  }, [gasGwei]);

  const estimatedFee = useMemo(() => {
    if (gasGwei == null) return '—';
    const fee = (gasGwei * 140000) / 1e9;
    return `${fee.toFixed(5)} ETH`;
  }, [gasGwei]);

  return (
    <section className="min-h-screen px-6 pb-20 pt-28">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="glass-card relative overflow-hidden p-6 sm:p-7"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(255,26,26,0.15),transparent_42%)]" />
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-red-400/35 bg-red-500/10 text-red-300 shadow-[0_0_16px_rgba(239,68,68,0.18)]">
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <p className="inline-flex items-center gap-1.5 rounded-full border border-red-400/25 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-300 animate-pulse" />
                    Protocol Live
                  </p>
                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-base-primary">Swap SBT</h1>
                </div>
              </div>
              <p className="max-w-3xl text-sm text-subtle leading-relaxed">
                Terminal de intercambio para convertir ETH y SBT en Sepolia con ejecución on-chain, previsualización de coste y estado de red en tiempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Tasa actual</p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">{tasaFormateada}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Gas</p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">{gasGwei == null ? '—' : `${gasGwei.toFixed(2)} gwei`}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Último sync</p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">
                  {lastSync ? lastSync.toLocaleTimeString('es-ES') : '—'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="ds-card ds-card-l1 ds-grid-card relative overflow-hidden" data-interactive="true">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(255,26,26,0.14),transparent_44%)]" />
              <div className="relative z-10 p-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-300 animate-pulse" />
                  Access Gateway
                </div>
                <h2 className="mt-3 text-2xl font-bold text-zinc-100 tracking-tight">Conecta tu wallet para iniciar el swap</h2>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                  Accede al módulo financiero de ScriptBay para operar SBT sobre Sepolia con datos de red, ejecución segura y seguimiento de transacciones.
                </p>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-300">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Red objetivo</p>
                    <p className="mt-1 font-semibold text-zinc-100">Sepolia</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-300">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Estado del protocolo</p>
                    <p className="mt-1 font-semibold text-emerald-300">Online</p>
                  </div>
                </div>

                <div className="mt-6 inline-flex rounded-2xl border border-red-400/35 bg-red-500/10 px-1.5 py-1.5 shadow-[0_0_18px_rgba(239,68,68,0.15)]">
                  <ConnectButton showBalance={false} chainStatus="icon" label="Conectar Wallet" />
                </div>
              </div>
            </div>

            <Panel title="Ecosistema SBT" subtitle="Contexto" icon={Network} className="h-fit">
              <div className="space-y-2.5 text-sm text-zinc-300">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Utilidad</p>
                  <p className="mt-1">Pago directo de recursos premium dentro de ScriptBay.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Ejecución</p>
                  <p className="mt-1">Intercambio on-chain con confirmación en bloque.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Seguridad</p>
                  <p className="mt-1">Aprobación explícita en wallet para cada operación sensible.</p>
                </div>
              </div>
            </Panel>
          </motion.div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <Panel title="Swap Terminal" subtitle="Intercambio" icon={ArrowDownUp} className="p-6">
              <div className="space-y-4">
                {!contratosConfigurados && (
                  <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
                    <p className="text-sm font-semibold text-red-200">Módulo no inicializado</p>
                    <p className="mt-1 text-xs text-red-100/80 leading-relaxed">
                      Falta configurar contratos del protocolo. Despliega y define VITE_SBT_TOKEN / VITE_SBT_SWAP para operar.
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 uppercase tracking-wider">Pagas</span>
                    <button className="text-zinc-400 hover:text-zinc-100" onClick={() => setInputValue(balanceInput)}>
                      Balance: {balanceInput} {inputSimbolo}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="0.0"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="flex-1 bg-transparent text-3xl font-bold text-zinc-50 outline-none"
                    />
                    <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-zinc-100">
                      {inputSimbolo}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={invertir}
                    className="ds-icon-neutral h-11 w-11 rounded-full"
                    aria-label="Invertir direccion"
                  >
                    <ArrowDownUp className="h-4 w-4" />
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 uppercase tracking-wider">Recibes</span>
                    <span className="text-zinc-500">Estimado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="flex-1 text-3xl font-bold text-zinc-50">
                      {Number(cotizacion || 0).toLocaleString('es-ES', { maximumFractionDigits: 6 })}
                    </p>
                    <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-zinc-100">
                      {outputSimbolo}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Network</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-100">{chain?.name || 'Sepolia'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Gas</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-100">{gasGwei == null ? '—' : `${gasGwei.toFixed(2)} gwei`}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Coste estimado</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-100">{estimatedFee}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Estado</p>
                    <p className={`mt-1 text-xs font-semibold ${gasStatus.tone}`}>{gasStatus.label}</p>
                  </div>
                </div>

                <button
                  onClick={ejecutarSwap}
                  disabled={enviando || !inputValue || Number(inputValue) <= 0 || !contratosConfigurados}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/35 bg-gradient-to-r from-red-500/18 via-red-500/16 to-red-400/12 py-3.5 font-semibold text-red-100 transition-all hover:-translate-y-[1px] hover:border-red-300/45 hover:shadow-[0_0_22px_rgba(239,68,68,0.18)] disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Procesando swap...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      {direccion === 'eth_to_sbt' ? 'Comprar SBT' : 'Vender SBT'}
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={`rounded-2xl border p-4 text-sm ${feedback.tipo === 'ok' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-red-400/30 bg-red-500/10 text-red-200'}`}
                    >
                      <div className="flex items-start gap-3">
                        {feedback.tipo === 'ok' ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <Activity className="h-5 w-5 mt-0.5" />}
                        <div className="flex-1">
                          <p>{feedback.msg}</p>
                          {feedback.hash && (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${feedback.hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> Ver tx en Etherscan
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Panel>

            <div className="space-y-5">
              <Panel title="Protocol Status" subtitle="Live" icon={RefreshCw} className="p-5">
                <div className="space-y-2.5 text-sm text-zinc-300">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <span className="text-zinc-500">SBT balance</span>
                    <span className="font-semibold text-zinc-100">{Number(balanceSbt).toFixed(4)} SBT</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <span className="text-zinc-500">ETH balance</span>
                    <span className="font-semibold text-zinc-100">{Number(ethBalance?.formatted || 0).toFixed(5)} ETH</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <span className="text-zinc-500">Gas status</span>
                    <span className={`font-semibold ${gasStatus.tone}`}>{gasStatus.label}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <span className="text-zinc-500">Último sync</span>
                    <span className="font-semibold text-zinc-100">{lastSync ? lastSync.toLocaleTimeString('es-ES') : '—'}</span>
                  </div>
                </div>
              </Panel>

              <Panel title="Actividad reciente" subtitle="Swaps" icon={Clock3} className="p-5">
                {swapHistory.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-zinc-400">
                    Aún no hay swaps en esta sesión.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {swapHistory.map((item) => (
                      <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-zinc-100">
                            {item.side === 'eth_to_sbt' ? 'ETH → SBT' : 'SBT → ETH'}
                          </p>
                          <span className="text-[11px] text-zinc-500">
                            {new Date(item.createdAt).toLocaleTimeString('es-ES')}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">
                          {Number(item.input || 0).toLocaleString('es-ES', { maximumFractionDigits: 6 })} {item.side === 'eth_to_sbt' ? 'ETH' : 'SBT'}
                          {' '}→{' '}
                          {Number(item.output || 0).toLocaleString('es-ES', { maximumFractionDigits: 6 })} {item.side === 'eth_to_sbt' ? 'SBT' : 'ETH'}
                        </p>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${item.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-red-200 hover:text-red-100"
                        >
                          <ExternalLink className="h-3 w-3" /> tx
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <Panel title="Utility" subtitle="SBT" icon={ShieldCheck} className="p-5">
            <p className="text-sm text-zinc-300 leading-relaxed">
              SBT habilita compras directas en ScriptBay y reduce fricción en flujos de pago Web3.
            </p>
          </Panel>
          <Panel title="Red" subtitle="Infraestructura" icon={Network} className="p-5">
            <p className="text-sm text-zinc-300 leading-relaxed">
              Operativa en Sepolia para validar flujo completo: wallet, swap, confirmación y registro on-chain.
            </p>
          </Panel>
          <Panel title="Costes" subtitle="Execution" icon={Fuel} className="p-5">
            <p className="text-sm text-zinc-300 leading-relaxed">
              Coste estimado dinámico por gas de red. La vista se actualiza automáticamente en cada ciclo live.
            </p>
          </Panel>
        </div>
      </div>
    </section>
  );
};

export default SwapSBT;
