// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LicenciaScriptBay.sol";

contract DeployLicencia is Script {
    function run() external {
        // Leemos la clave privada de tu wallet desde un archivo oculto .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Empezamos a grabar la transacción
        vm.startBroadcast(deployerPrivateKey);

        // Obtenemos la dirección pública de esa clave privada (Tú serás el Owner)
        address owner = vm.addr(deployerPrivateKey);

        // Desplegamos el contrato pasándote a ti como owner inicial
        LicenciasScriptBay licencia = new LicenciasScriptBay(owner);

        // Dejamos de grabar
        vm.stopBroadcast();

        // Imprimimos la dirección para que la copies al Backend
        console.log("Contrato desplegado en la direccion:", address(licencia));
    }
}
