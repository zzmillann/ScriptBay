// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Ownable.sol";

/**
 * @title ComprasStripe
 * @author ScriptBay
 * @notice Registro inmutable de compras realizadas vía Stripe.
 */
contract ComprasStripe is Ownable {
    constructor() Ownable(msg.sender) {}

    struct Compra {
        string idCustomer;
        string idCard;
        uint256 cantidad;
        string moneda;
        string descripcion;
        bool confirmacion;
        bool metodoPagoAutomatico;
        string metodoPago;
        bool pagoEfectuado;
        uint256 fecha;
        uint256 hora;
        string idPaymentIntent;
    }

    string[] public idPagos;
    mapping(string => Compra) public compras;

    event RegistroCompraStripeEvent(
        string indexed idCustomer, string idCard, uint256 cantidad, string moneda, string descripcion,
        bool confirmacion, bool metodoPagoAutomatico, string metodoPago, bool pagoEfectuado,
        uint256 fecha, uint256 hora, string indexed idPaymentIntent
    );

    function RegistroCompraStripe(
        string memory idCustomer, string memory idCard, uint256 cantidad, string memory moneda,
        string memory descripcion, bool confirmacion, bool metodoPagoAutomatico, string memory metodoPago,
        bool pagoEfectuado, uint256 fecha, uint256 hora, string memory idPaymentIntent
    ) public onlyOwner {
        require(bytes(compras[idPaymentIntent].idPaymentIntent).length == 0, "Compra ya registrada");

        Compra memory nuevaCompra = Compra(
            idCustomer, idCard, cantidad, moneda, descripcion, confirmacion, 
            metodoPagoAutomatico, metodoPago, pagoEfectuado, fecha, hora, idPaymentIntent
        );
        compras[idPaymentIntent] = nuevaCompra;
        idPagos.push(idPaymentIntent);

        emit RegistroCompraStripeEvent(
            idCustomer, idCard, cantidad, moneda, descripcion, confirmacion,
            metodoPagoAutomatico, metodoPago, pagoEfectuado, fecha, hora, idPaymentIntent
        );
    }

    function ObtenerCompras() public view onlyOwner returns (Compra[] memory) {
        uint256 total = idPagos.length;
        Compra[] memory listaCompras = new Compra[](total);
        for (uint256 i = 0; i < total; i++) {
            listaCompras[i] = compras[idPagos[i]];
        }
        return listaCompras;
    }
}