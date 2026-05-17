import { createWalletClient, createPublicClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"
import CONTRACT_ABI from "./ComprasStripeABI.json" with { type: "json" };

import dotenv from "dotenv"
dotenv.config()

const rawKey = process.env.PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000000';
const account = privateKeyToAccount(rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`)

const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(process.env.RPC_SEPOLIA)
})

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.RPC_SEPOLIA),
})


export async function registroCompraStripe(
    usuarioDestino,
    idCustomer, idCard, cantidad, moneda, descripcion, confirmacion,
    metodoPagoAutomatico, metodoPago, pagoEfectuado, fecha, hora, idPaymentIntent
) {
    const contador = await publicClient.readContract({
        address: process.env.CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "contadorLicencias",
    });
    const tokenId = Number(contador) + 1;

    const { request } = await publicClient.simulateContract(
        {
            address: process.env.CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "comprarYMintear",
            args: [
                usuarioDestino,
                idCustomer, idCard, BigInt(cantidad), moneda, descripcion, confirmacion,
                metodoPagoAutomatico, metodoPago, pagoEfectuado, BigInt(fecha), BigInt(hora), idPaymentIntent
            ],
            account: walletClient.account,
        }
    )

    const tx = await walletClient.writeContract(request)
    return { tx, tokenId }
}

export async function obtenerCompras() {
    const { result } = await publicClient.readContract(
        {
            address: process.env.CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "obtenerTodasLasCompras",
            args: [],
        }
    )
    return result
}