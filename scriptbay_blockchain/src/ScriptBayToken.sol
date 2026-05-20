// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title ScriptBay Token (SBT) - ERC20 utility token
/// @notice Token de utilidad de ScriptBay para pagar productos en Sepolia.
/// @dev Owner = contrato de swap (se setea en constructor) y/o deployer.
contract ScriptBayToken is ERC20, Ownable {
    constructor(address initialOwner, uint256 supplyInicial)
        ERC20("ScriptBay Token", "SBT")
        Ownable(initialOwner)
    {
        if (supplyInicial > 0) {
            _mint(initialOwner, supplyInicial);
        }
    }

    /// @notice Solo el owner (swap contract) puede mintear nuevos SBT.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
