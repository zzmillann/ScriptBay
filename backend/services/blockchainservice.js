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
    idCustomer, idCard, cantidad, moneda, descripcion, confirmacion,
    metodoPagoAutomatico, metodoPago, pagoEfectuado, fecha, hora, idPaymentIntent
) {
    const { request } = await publicClient.simulateContract(
        {
            address: process.env.CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "RegistroCompraStripe",
            args: [
                idCustomer, idCard, BigInt(cantidad), moneda, descripcion, confirmacion,
                metodoPagoAutomatico, metodoPago, pagoEfectuado, BigInt(fecha), BigInt(hora), idPaymentIntent
            ],
            account: walletClient.account,
        }
    )

    const tx = await walletClient.writeContract(request)
    return tx
}

export async function obtenerCompras() {
    const { result } = await publicClient.readContract(
        {
            address: process.env.CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "ObtenerCompras",
            args: [],
        }
    )
    return result
}