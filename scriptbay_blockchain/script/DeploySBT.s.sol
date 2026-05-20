// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ScriptBayToken.sol";
import "../src/SwapSBT.sol";

/// @notice Deploya ScriptBayToken + SwapSBT en Sepolia.
/// @dev El swap pasa a ser el owner del token, asi puede mintear.
///      Setea la tasa por defecto a 1 ETH = 1.000.000 SBT (super barato, para pruebas).
contract DeploySBT is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1) Deploy token, deployer = owner inicial
        ScriptBayToken token = new ScriptBayToken(deployer, 0);

        // 2) Deploy swap con tasa 1.000.000 SBT por 1 ETH
        //    => 1 SBT = 0.000001 ETH (1 microETH).
        uint256 tasaInicial = 1_000_000 * 1e18;
        SwapSBT swap = new SwapSBT(address(token), tasaInicial, deployer);

        // 3) Transfer ownership del token al swap para que pueda mintear
        token.transferOwnership(address(swap));

        vm.stopBroadcast();

        console.log("ScriptBayToken desplegado:", address(token));
        console.log("SwapSBT desplegado:", address(swap));
        console.log("Tasa: 1 ETH = 1.000.000 SBT");
    }
}
