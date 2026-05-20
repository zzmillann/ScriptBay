import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, usePublicClient } from 'wagmi';
import { Wallet, Sparkles, ExternalLink, Loader2, ShieldCheck, RefreshCw, Hexagon } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const CONTRACT_ADDRESS = '0x4ACBc139Cba05b41fBB7e760fD696D2A0FC8A0cC';

const ABI_CONTADOR = [{ inputs: [], name: 'contadorLicencias', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }];
const ABI_OWNER = [{ inputs: [{ type: 'uint256' }], name: 'ownerOf', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' }];
const ABI_URI = [{ inputs: [{ type: 'uint256' }], name: 'tokenURI', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' }];

const decodeTokenUri = (uri) => {
  try {
    const base64Data = uri.split(',')[1];
    return JSON.parse(atob(base64Data));
  } catch {
    return { name: 'Licencia', description: '', image: '', attributes: [] };
  }
};

const GaleriaNFT = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [nfts, setNfts] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [totalContrato, setTotalContrato] = useState(0);

  const cargarNfts = async () => {
    if (!address || !publicClient) return;
    setCargando(true);
    setError(null);
    try {
      const total = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI_CONTADOR,
        functionName: 'contadorLicencias',
      });
      const totalNum = Number(total);
      setTotalContrato(totalNum);

      const acumulados = [];
      for (let i = 1n; i <= total; i++) {
        try {
          const owner = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: ABI_OWNER,
            functionName: 'ownerOf',
            args: [i],
          });
          if (owner.toLowerCase() === address.toLowerCase()) {
            const uri = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: ABI_URI,
              functionName: 'tokenURI',
              args: [i],
            });
            acumulados.push({ id: Number(i), ...decodeTokenUri(uri) });
          }
        } catch (innerErr) {
          console.warn('Error leyendo token', Number(i), innerErr);
        }
      }
      setNfts(acumulados);
    } catch (err) {
      setError(err.message || 'Error consultando la blockchain');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isConnected) cargarNfts();
    else {
      setNfts([]);
      setTotalContrato(0);
    }
  }, [address, isConnected, publicClient]);

  return (
    <section className="min-h-screen px-6 pb-20 pt-28">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }} className="mb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/10 text-violet-300">
                <Hexagon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-base-primary">Mi Galería NFT</h1>
                <p className="text-sm text-base-secondary">Todas tus licencias ScriptBay verificadas on-chain en Sepolia.</p>
              </div>
            </div>
            {isConnected && (
              <button
                onClick={cargarNfts}
                disabled={cargando}
                className="btn-secondary inline-flex items-center gap-2 text-sm hover:scale-[1.02] disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
                Refrescar
              </button>
            )}
          </div>
        </motion.div>

        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-[28px] border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.08] via-zinc-900/70 to-black/80 p-10 text-center"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_55%)]" />
            <div className="relative flex flex-col items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-full border border-violet-400/30 bg-violet-500/10">
                <Wallet className="h-10 w-10 text-violet-300" />
              </div>
              <div className="max-w-md">
                <h2 className="text-xl font-bold text-zinc-100">Conecta tu wallet para entrar a tu galería</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Tu colección NFT solo es accesible cuando conectas tu MetaMask (red Sepolia). Aquí verás todas las licencias que has comprado en ScriptBay.
                </p>
              </div>
              <ConnectButton showBalance={false} chainStatus="icon" label="Conectar Wallet" />
            </div>
          </motion.div>
        ) : cargando ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[460px] rounded-3xl border border-white/10 bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center text-sm text-red-200">
            {error}
          </div>
        ) : nfts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center"
          >
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-zinc-800/60">
              <Sparkles className="h-9 w-9 text-zinc-500" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-zinc-100">Aún no tienes NFTs en esta wallet</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Compra cualquier producto con tu wallet conectada y recibirás tu licencia NFT en {address.slice(0, 6)}...{address.slice(-4)}
            </p>
            <p className="mt-1 text-xs text-faint">Tokens consultados en el contrato: {totalContrato}</p>
          </motion.div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-faint">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 font-semibold text-violet-200">
                <ShieldCheck className="h-3.5 w-3.5" /> {nfts.length} licencia{nfts.length !== 1 ? 's' : ''}
              </span>
              <span>Wallet: {address.slice(0, 6)}...{address.slice(-4)}</span>
              <span>Contrato: {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-6)}</span>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence initial={false}>
                {nfts.map((nft, idx) => (
                  <motion.article
                    key={nft.id}
                    initial={{ opacity: 0, y: 18, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, delay: idx * 0.04 }}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950/95 via-zinc-900/85 to-black/90 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_24px_60px_-22px_rgba(139,92,246,0.55)]"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-900">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
                      <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                        ERC-721
                      </span>
                      <span className="absolute left-3 top-3 rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-100 backdrop-blur-md">
                        #{nft.id}
                      </span>
                    </div>
                    <div className="space-y-4 border-t border-white/5 p-5">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-100">{nft.name}</h3>
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{nft.description}</p>
                      </div>
                      {nft.attributes?.length > 0 && (
                        <div className="space-y-2">
                          {nft.attributes.slice(0, 3).map((attr, i) => (
                            <div
                              key={`${nft.id}-${i}`}
                              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2 text-xs"
                            >
                              <span className="text-zinc-500">{attr.trait_type}</span>
                              <span
                                className="max-w-[140px] truncate font-semibold text-zinc-200"
                                title={String(attr.value)}
                              >
                                {String(attr.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <a
                        href={`https://sepolia.etherscan.io/nft/${CONTRACT_ADDRESS}/${nft.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/10 py-2.5 text-xs font-semibold text-violet-100 transition-colors hover:bg-violet-500/20"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Ver en Etherscan
                      </a>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {isConnected && cargando && (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-faint">
            <Loader2 className="h-4 w-4 animate-spin" /> Escaneando contrato {CONTRACT_ADDRESS.slice(0, 8)}…
          </div>
        )}
      </div>
    </section>
  );
};

export default GaleriaNFT;
