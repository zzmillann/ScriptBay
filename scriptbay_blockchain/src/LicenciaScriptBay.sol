// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract LicenciasScriptBay is ERC721, Ownable {
    
    uint256 public contadorLicencias;

    struct Compra {
        string idCustomer; string idCard; uint256 cantidad; string moneda; string descripcion;
        bool confirmacion; bool metodoPagoAutomatico; string metodoPago; bool pagoEfectuado;
        uint256 fecha; uint256 hora; string idPaymentIntent;
    }

    event LicenciaMinteadaYRegistrada(
        uint256 indexed idLicencia, address indexed usuarioDestino, string indexed idCustomer, string idPaymentIntent,
        uint256 cantidad, string moneda, string descripcion, uint256 fecha
    );

    mapping(uint256 => Compra) public datosDeLicencia;

    constructor(address initialOwner) ERC721("ScriptBay License", "SBL") Ownable(initialOwner) {
        contadorLicencias = 0;
    }

    function comprarYMintear(
        address usuarioDestino, string memory _idCustomer, string memory _idCard, uint256 _cantidad,
        string memory _moneda, string memory _descripcion, bool _confirmacion, bool _metodoPagoAutomatico,
        string memory _metodoPago, bool _pagoEfectuado, uint256 _fecha, uint256 _hora, string memory _idPaymentIntent
    ) public onlyOwner {
        
        contadorLicencias += 1;
        uint256 nuevaLicenciaId = contadorLicencias;

        datosDeLicencia[nuevaLicenciaId] = Compra(
            _idCustomer, _idCard, _cantidad, _moneda, _descripcion, _confirmacion, 
            _metodoPagoAutomatico, _metodoPago, _pagoEfectuado, _fecha, _hora, _idPaymentIntent
        );

        _mint(usuarioDestino, nuevaLicenciaId);

        emit LicenciaMinteadaYRegistrada(
            nuevaLicenciaId, usuarioDestino, _idCustomer, _idPaymentIntent, _cantidad, _moneda, _descripcion, _fecha
        );
    }

    function obtenerTodasLasCompras() public view onlyOwner returns (Compra[] memory) {
        uint256 totalCompras = contadorLicencias;
        Compra[] memory listaCompras = new Compra[](totalCompras);
        
        for (uint256 i = 1; i <= totalCompras; i++) {
            listaCompras[i - 1] = datosDeLicencia[i];
        }
        return listaCompras;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        ownerOf(tokenId); // Lanza un error si el token no existe

        Compra memory compra = datosDeLicencia[tokenId];

        // 1. Generamos la imagen SVG dinámica
        string memory svg = string(
            abi.encodePacked(
                "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500' width='400' height='500'>",
                "<defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>",
                "<stop offset='0%' style='stop-color:#6366f1;stop-opacity:1' />", // Indigo 500
                "<stop offset='100%' style='stop-color:#a855f7;stop-opacity:1' />", // Purple 500
                "</linearGradient></defs>",
                "<rect width='400' height='500' rx='24' fill='url(#grad)' />",
                "<text x='50%' y='100' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='32' font-weight='bold' fill='#ffffff'>ScriptBay License</text>",
                "<text x='50%' y='240' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='24' font-weight='bold' fill='#f8fafc'>Token ID: #", Strings.toString(tokenId), "</text>",
                "<text x='50%' y='290' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='16' fill='#e2e8f0'>", compra.descripcion, "</text>",
                "<rect x='100' y='360' width='200' height='40' rx='10' fill='#ffffff' fill-opacity='0.2' />",
                "<text x='50%' y='380' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='14' font-weight='bold' fill='#ffffff'>VERIFICADA EN CADENA</text>",
                "</svg>"
            )
        );

        // 2. Generamos el JSON con los Metadatos y codificamos el SVG dentro
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "ScriptBay License #', Strings.toString(tokenId), '",',
                        '"description": "Licencia digital oficial e intransferible emitida por ScriptBay.",',
                        '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
                        '"attributes": [',
                            '{"trait_type": "Producto", "value": "', compra.descripcion, '"},',
                            '{"trait_type": "Metodo Pago", "value": "', compra.metodoPago, '"}',
                        ']}'
                    )
                )
            )
        );

        // 3. Devolvemos el Data URI final listo para leer por MetaMask y OpenSea
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}
