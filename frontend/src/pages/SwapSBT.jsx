import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownUp, Coins, Loader2, Wallet, ExternalLink, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, parseEther, formatUnits, parseUnits } from 'viem';
import { TOKEN_ADDRESS, SWAP_ADDRESS, TOKEN_ABI, SWAP_ABI } from '../utils/sbtConfig';

const isZero = (addr) => !addr || addr === '0x0000000000000000000000000000000000000000';

const SwapSBT = () => {
  const { address, isConnected } = useAccount();
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

  useEffect(() => {
    cargarTasa();
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

  return (
    <section className="min-h-screen px-6 pb-20 pt-28">
      <div className="mx-auto max-w-3xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-300">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-base-primary">Swap SBT</h1>
              <p className="text-sm text-base-secondary">Intercambia ETH de Sepolia por ScriptBay Tokens (SBT).</p>
            </div>
          </div>
          <p className="text-xs text-faint">{tasaFormateada}</p>
        </motion.div>

        {!contratosConfigurados && (
          <div className="rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm text-yellow-200">
            <p className="font-semibold mb-1">Contratos pendientes de configurar</p>
            <p className="text-yellow-100/80 text-xs">
              Deploya con <code className="font-mono">forge script script/DeploySBT.s.sol --rpc-url $RPC_SEPOLIA --broadcast</code> y mete las direcciones en
              <code className="font-mono"> VITE_SBT_TOKEN</code> y <code className="font-mono">VITE_SBT_SWAP</code>.
            </p>
          </div>
        )}

        {!isConnected ? (
          <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.08] via-zinc-900/70 to-black/80 p-10 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-violet-500/15 text-violet-300">
              <Wallet className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-zinc-100">Conecta tu wallet para usar el swap</h2>
            <p className="mt-2 text-sm text-zinc-400 mb-5">Necesitas estar en la red Sepolia con algo de ETH de prueba.</p>
            <ConnectButton showBalance={false} chainStatus="icon" label="Conectar Wallet" />
          </div>
        ) : (
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-zinc-950/90 via-zinc-900/85 to-black/90 p-6 space-y-4">
            {/* Input */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="text-zinc-500 uppercase tracking-wider">Pagas</span>
                <button
                  className="text-zinc-400 hover:text-zinc-100"
                  onClick={() => setInputValue(balanceInput)}
                >
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
                <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 font-semibold text-zinc-100 text-sm">
                  {inputSimbolo}
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={invertir}
                className="w-11 h-11 rounded-full border border-white/15 bg-black/40 text-zinc-300 transition-all hover:scale-110 hover:border-amber-400/40 hover:text-amber-300"
                aria-label="Invertir direccion"
              >
                <ArrowDownUp className="h-4 w-4 mx-auto" />
              </button>
            </div>

            {/* Output */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="text-zinc-500 uppercase tracking-wider">Recibes</span>
                <span className="text-zinc-500">Estimado</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="flex-1 text-3xl font-bold text-zinc-50">
                  {Number(cotizacion || 0).toLocaleString('es-ES', { maximumFractionDigits: 6 })}
                </p>
                <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 font-semibold text-zinc-100 text-sm">
                  {outputSimbolo}
                </span>
              </div>
            </div>

            <button
              onClick={ejecutarSwap}
              disabled={enviando || !inputValue || Number(inputValue) <= 0 || !contratosConfigurados}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-500/30 to-amber-600/30 py-3.5 font-bold text-amber-100 transition-all hover:scale-[1.01] hover:from-amber-500/50 hover:to-amber-600/50 disabled:opacity-50 disabled:hover:scale-100"
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
                    {feedback.tipo === 'ok' ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
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
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-faint">
          <p className="font-semibold text-base-secondary mb-1">¿Para qué sirve SBT?</p>
          <p>Es el token de utilidad de ScriptBay. Lo usarás para pagar productos directamente desde tu wallet. La tasa es fija para el entorno de pruebas en Sepolia.</p>
        </div>
      </div>
    </section>
  );
};

export default SwapSBT;
