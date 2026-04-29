// Servicio de generacion de facturas en PDF tras el pago
// Equivalente a IronPDF del proyecto de clase pero con pdfkit (nativo de Node.js)
// Genera un Buffer con el PDF de la factura listo para adjuntar en el email con Mailjet
import PDFDocument from 'pdfkit';

// Paleta de colores ScriptBay
const COLOR_PURPLE = '#7c3aed';
const COLOR_PURPLE_LIGHT = '#a78bfa';
const COLOR_DARK = '#1e1b4b';
const COLOR_GRAY = '#6b7280';
const COLOR_GRAY_LIGHT = '#e5e7eb';
const COLOR_BLACK = '#111827';

// datos: { nombre, email, titulo, precio, idTransaccion, metodoPago, fecha, blockchainHash? }
// Devuelve: Promise<Buffer>
export async function generarFacturaPDF(datos) {
    return new Promise((resolve, reject) => {
        const { nombre, email, titulo, precio, idTransaccion, metodoPago, fecha, blockchainHash } = datos;

        const doc = new PDFDocument({ size: 'A4', margin: 0 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const W = 595.28;  // ancho A4 en puntos
        const PADDING = 48;

        // ── HEADER MORADO ────────────────────────────────────────────────────
        doc.rect(0, 0, W, 110).fill(COLOR_PURPLE);

        // Logo / nombre del sitio
        doc
            .fill('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(28)
            .text('ScriptBay', PADDING, 30, { lineBreak: false });

        doc
            .fill('#c4b5fd')
            .font('Helvetica')
            .fontSize(11)
            .text('El marketplace para desarrolladores', PADDING, 64);

        // Texto "FACTURA" alineado a la derecha
        doc
            .fill('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(22)
            .text('FACTURA', 0, 38, { align: 'right', width: W - PADDING });

        // ── CUERPO ────────────────────────────────────────────────────────────
        const fechaObj = fecha ? new Date(fecha) : new Date();
        const fechaStr = fechaObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        const horaStr = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        // Numero de factura: fecha + 4 ultimos chars del idTransaccion
        const numFactura = `SB-${fechaObj.getFullYear()}${String(fechaObj.getMonth() + 1).padStart(2, '0')}${String(fechaObj.getDate()).padStart(2, '0')}-${idTransaccion.slice(-6).toUpperCase()}`;

        let y = 135;

        // ── DATOS DEL CLIENTE (izquierda) y DATOS DE LA FACTURA (derecha) ─────
        doc.fill(COLOR_BLACK).font('Helvetica-Bold').fontSize(10).text('FACTURADO A:', PADDING, y);
        doc.fill(COLOR_BLACK).font('Helvetica-Bold').fontSize(10).text('DETALLES DE LA FACTURA', W / 2, y);

        y += 16;
        doc.fill(COLOR_BLACK).font('Helvetica').fontSize(10).text(nombre || email, PADDING, y);
        doc.fill(COLOR_GRAY).font('Helvetica').fontSize(10).text(`Nº Factura: ${numFactura}`, W / 2, y);

        y += 14;
        doc.fill(COLOR_GRAY).font('Helvetica').fontSize(9).text(email, PADDING, y);
        doc.fill(COLOR_GRAY).font('Helvetica').fontSize(10).text(`Fecha: ${fechaStr} ${horaStr}`, W / 2, y);

        y += 14;
        doc.fill(COLOR_GRAY).font('Helvetica').fontSize(10).text(`Metodo de pago: ${metodoPago}`, W / 2, y);

        // ── LINEA SEPARADORA ─────────────────────────────────────────────────
        y += 30;
        doc.moveTo(PADDING, y).lineTo(W - PADDING, y).strokeColor(COLOR_GRAY_LIGHT).lineWidth(1).stroke();

        // ── CABECERA DE LA TABLA ─────────────────────────────────────────────
        y += 14;
        doc.rect(PADDING, y, W - PADDING * 2, 24).fill(COLOR_DARK);
        doc.fill('#ffffff').font('Helvetica-Bold').fontSize(9);
        doc.text('PRODUCTO / DESCRIPCIÓN', PADDING + 10, y + 8, { lineBreak: false });
        doc.text('IMPORTE', W - PADDING - 80, y + 8, { lineBreak: false });

        // ── FILA DEL PRODUCTO ─────────────────────────────────────────────────
        y += 24;
        doc.rect(PADDING, y, W - PADDING * 2, 30).fill('#f5f3ff');
        doc.fill(COLOR_BLACK).font('Helvetica').fontSize(10);
        doc.text(titulo, PADDING + 10, y + 10, { width: W - PADDING * 2 - 120, lineBreak: false });
        doc.fill(COLOR_PURPLE).font('Helvetica-Bold').fontSize(10);
        doc.text(`${parseFloat(precio).toFixed(2)} EUR`, W - PADDING - 80, y + 10, { lineBreak: false });

        // ── FILA TOTAL ────────────────────────────────────────────────────────
        y += 30;
        doc.moveTo(PADDING, y).lineTo(W - PADDING, y).strokeColor(COLOR_GRAY_LIGHT).lineWidth(1).stroke();
        y += 12;
        doc.fill(COLOR_BLACK).font('Helvetica-Bold').fontSize(12).text('TOTAL', PADDING, y, { lineBreak: false });
        doc.fill(COLOR_PURPLE).font('Helvetica-Bold').fontSize(14).text(`${parseFloat(precio).toFixed(2)} EUR`, W - PADDING - 100, y - 2, { lineBreak: false });

        // ── DATOS DE LA TRANSACCION ───────────────────────────────────────────
        y += 40;
        doc.moveTo(PADDING, y).lineTo(W - PADDING, y).strokeColor(COLOR_GRAY_LIGHT).lineWidth(0.5).stroke();
        y += 14;

        doc.fill(COLOR_GRAY).font('Helvetica').fontSize(8).text('ID DE TRANSACCIÓN', PADDING, y);
        y += 12;
        doc.fill(COLOR_BLACK).font('Helvetica').fontSize(8).text(idTransaccion, PADDING, y, { width: W - PADDING * 2 });

        if (blockchainHash) {
            y += 20;
            doc.fill(COLOR_GRAY).font('Helvetica').fontSize(8).text('HASH EN BLOCKCHAIN (SEPOLIA)', PADDING, y);
            y += 12;
            doc.fill(COLOR_PURPLE).font('Helvetica').fontSize(8).text(blockchainHash, PADDING, y, { width: W - PADDING * 2 });
        }

        // ── FOOTER ────────────────────────────────────────────────────────────
        doc.rect(0, 780, W, 62).fill('#f5f3ff');
        doc.fill(COLOR_GRAY).font('Helvetica').fontSize(8)
            .text('Este documento es una factura de compra de producto digital en ScriptBay. Conserva este documento para tus registros.', PADDING, 793, { width: W - PADDING * 2, align: 'center' });
        doc.fill(COLOR_PURPLE_LIGHT).font('Helvetica').fontSize(7)
            .text('© 2026 ScriptBay · Todos los derechos reservados · scriptbay.dev', PADDING, 811, { width: W - PADDING * 2, align: 'center' });

        doc.end();
    });
}
