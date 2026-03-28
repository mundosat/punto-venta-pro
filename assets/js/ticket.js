import { formatDateTime, currency, escapeHtml } from "./utils.js";
import { state } from "./state.js";

export function printTicket(sale) {
  const cfg = state.config;
  const logoHtml = buildLogoHtml(cfg);
  const rows = (sale.items || []).map(item => `
    <tr>
      <td>${escapeHtml(item.nombre)}</td>
      <td class="right">${item.cantidad}</td>
      <td class="right">${currency(item.precio, cfg.moneda)}</td>
      <td class="right">${currency(item.total, cfg.moneda)}</td>
    </tr>
  `).join("");

  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Comprobante</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:16px;color:#111}
      .wrap{max-width:340px;margin:0 auto}
      .center{text-align:center}
      .logo{width:70px;height:70px;object-fit:cover;border-radius:12px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{padding:4px 0;border-bottom:1px dashed #bbb}
      .right{text-align:right}
      .total{font-size:20px;font-weight:700}
      .muted{color:#555;font-size:12px}
      .sep{border-top:1px dashed #999;margin:8px 0}
      .title{font-size:18px;font-weight:700}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="center">
        ${logoHtml}
        <div class="title">${escapeHtml(cfg.nombreTienda || "Mi Tienda")}</div>
        <div class="muted">RUC: ${escapeHtml(cfg.ruc || "")}</div>
        <div class="muted">${escapeHtml(cfg.direccion || "")}</div>
        <div class="muted">${escapeHtml(cfg.telefono || "")}</div>
        <div class="muted">Nota de venta / factura simple</div>
      </div>
      <div class="sep"></div>
      <div><strong>Comprobante:</strong> ${String(sale.numero).padStart(6, "0")}</div>
      <div><strong>Fecha:</strong> ${formatDateTime(sale.fecha)}</div>
      <div><strong>Cliente:</strong> ${escapeHtml(sale.cliente || "Consumidor Final")}</div>
      <div><strong>Cajero:</strong> ${escapeHtml(sale.usuarioNombre || "")}</div>
      <div class="sep"></div>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th class="right">Cant.</th>
            <th class="right">P.U.</th>
            <th class="right">Tot.</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="sep"></div>
      <div><strong>Subtotal:</strong> <span style="float:right">${currency(sale.subtotal, cfg.moneda)}</span></div>
      <div><strong>IVA:</strong> <span style="float:right">${currency(sale.impuesto, cfg.moneda)}</span></div>
      <div class="total">TOTAL <span style="float:right">${currency(sale.total, cfg.moneda)}</span></div>
      <div><strong>Pagó con:</strong> <span style="float:right">${currency(sale.pagadoCon, cfg.moneda)}</span></div>
      <div><strong>Cambio:</strong> <span style="float:right">${currency(sale.cambio, cfg.moneda)}</span></div>
      <div class="sep"></div>
      <div class="center muted">${escapeHtml(cfg.ticketFooter || "Gracias por su compra")}</div>
      <div class="center muted">Este comprobante no reemplaza la facturación electrónica del SRI.</div>
    </div>
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500);};</script>
  </body>
  </html>`;

  const w = window.open("", "_blank", "width=420,height=720");
  if (!w) {
    alert("El navegador bloqueó la ventana de impresión.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function buildLogoHtml(cfg) {
  if (!cfg.logoValue) return "";
  return `<img class="logo" src="${cfg.logoValue}" alt="Logo" />`;
}
