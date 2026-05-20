// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ScriptBayToken} from "./ScriptBayToken.sol";
import {Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title SwapSBT - intercambio bidireccional ETH <-> SBT a tasa fija
/// @notice Para pruebas en Sepolia. NO usar en mainnet sin oracle real.
/// @dev tasa = cuantos SBT (con 18 decimales) por 1 wei. Default 1000 SBT por 1 ETH.
contract SwapSBT is Ownable {
    ScriptBayToken public immutable token;

    /// @notice Cuantos SBT (en wei de SBT, 18 decimales) se entregan por 1 ETH.
    /// @dev Por defecto: 1 ETH = 1000 SBT  => 1000 * 10**18 SBT por 1 ETH.
    uint256 public sbtPorEth;

    event Compra(address indexed comprador, uint256 ethEntregado, uint256 sbtRecibido);
    event Venta(address indexed vendedor, uint256 sbtEntregado, uint256 ethRecibido);
    event TasaActualizada(uint256 nuevaTasa);

    constructor(address tokenAddress, uint256 sbtPorEthInicial, address initialOwner)
        Ownable(initialOwner)
    {
        token = ScriptBayToken(tokenAddress);
        sbtPorEth = sbtPorEthInicial == 0 ? 1000 * 1e18 : sbtPorEthInicial;
    }

    /// @notice Cambia ETH por SBT (mintea SBT al sender).
    function comprarSBT() external payable {
        require(msg.value > 0, "Envia ETH");
        uint256 cantidad = (msg.value * sbtPorEth) / 1 ether;
        token.mint(msg.sender, cantidad);
        emit Compra(msg.sender, msg.value, cantidad);
    }

    receive() external payable {
        require(msg.value > 0, "Envia ETH");
        uint256 cantidad = (msg.value * sbtPorEth) / 1 ether;
        token.mint(msg.sender, cantidad);
        emit Compra(msg.sender, msg.value, cantidad);
    }

    /// @notice Devuelve SBT a cambio de ETH (requiere balance en el contrato).
    /// @dev El user debe haber hecho approve antes en el token.
    function venderSBT(uint256 cantidadSbt) external {
        require(cantidadSbt > 0, "Cantidad 0");
        uint256 ethDevolver = (cantidadSbt * 1 ether) / sbtPorEth;
        require(address(this).balance >= ethDevolver, "Sin liquidez ETH");

        require(token.transferFrom(msg.sender, address(this), cantidadSbt), "transferFrom fallo");

        (bool ok,) = msg.sender.call{value: ethDevolver}("");
        require(ok, "Envio ETH fallo");
        emit Venta(msg.sender, cantidadSbt, ethDevolver);
    }

    /// @notice Cuanto SBT te dan por X wei de ETH (helper de UI).
    function cotizarCompra(uint256 ethWei) external view returns (uint256) {
        return (ethWei * sbtPorEth) / 1 ether;
    }

    /// @notice Cuanto ETH te dan por X SBT (helper de UI).
    function cotizarVenta(uint256 cantidadSbt) external view returns (uint256) {
        return (cantidadSbt * 1 ether) / sbtPorEth;
    }

    function setTasa(uint256 nuevaTasa) external onlyOwner {
        require(nuevaTasa > 0, "Tasa 0");
        sbtPorEth = nuevaTasa;
        emit TasaActualizada(nuevaTasa);
    }

    /// @notice El owner puede retirar ETH acumulado en el swap si hace falta.
    function retirarEth(uint256 cantidad) external onlyOwner {
        (bool ok,) = msg.sender.call{value: cantidad}("");
        require(ok, "Retiro fallo");
    }
}
