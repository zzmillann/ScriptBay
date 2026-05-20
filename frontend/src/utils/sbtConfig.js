// Centraliza direcciones y ABIs de los contratos ScriptBay en Sepolia.
// Cuando despliegues (forge script ... DeploySBT), pega las direcciones aqui
// o setealas via variables de entorno VITE_SBT_TOKEN / VITE_SBT_SWAP.

export const TOKEN_ADDRESS =
  import.meta.env.VITE_SBT_TOKEN || '0x0000000000000000000000000000000000000000';

export const SWAP_ADDRESS =
  import.meta.env.VITE_SBT_SWAP || '0x0000000000000000000000000000000000000000';

export const LICENCIA_NFT_ADDRESS = '0x4ACBc139Cba05b41fBB7e760fD696D2A0FC8A0cC';

export const TOKEN_ABI = [
  { inputs: [{ type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'address' }, { type: 'uint256' }], name: 'transfer', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ type: 'address' }, { type: 'uint256' }], name: 'approve', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ type: 'address' }, { type: 'address' }], name: 'allowance', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }
];

export const SWAP_ABI = [
  { inputs: [], name: 'comprarSBT', outputs: [], stateMutability: 'payable', type: 'function' },
  { inputs: [{ type: 'uint256' }], name: 'venderSBT', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ type: 'uint256' }], name: 'cotizarCompra', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'uint256' }], name: 'cotizarVenta', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'sbtPorEth', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }
];

// Wallet del marketplace que recibe los pagos en SBT.
// Si no se setea, recibe el deployer/owner.
export const MARKETPLACE_WALLET =
  import.meta.env.VITE_MARKETPLACE_WALLET || '0x0000000000000000000000000000000000000000';
