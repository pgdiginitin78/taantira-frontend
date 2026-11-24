const formatLongDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const downloadOrderInvoice = (order) => {
  if (!order) return;
  const addr = order.shippingAddress || {};
  const rows = (order.items || [])
    .map(
      (item) =>
        `<tr>` +
        `<td><strong>${item.product_name}</strong><br/><small>${item.color_name || 'Signature Hue'} &middot; Size ${item.size || 'Free Size'}</small></td>` +
        `<td align="center">${item.quantity}</td>` +
        `<td align="right">INR ${Number(item.unit_price || 0).toFixed(2)}</td>` +
        `<td align="right">INR ${Number(item.total_price || 0).toFixed(2)}</td>` +
        `</tr>`,
    )
    .join('');

  const html = [
    '<!doctype html>',
    '<html>',
    `<head><meta charset="utf-8"><title>Invoice ${order.order_number} - Taantira</title></head>`,
    '<body bgcolor="#FFF9F2" text="#3D1023">',
    '<table width="740" align="center" cellpadding="18" cellspacing="0" bgcolor="#FFFFFF">',
    '<tr><td>',
    '<table width="100%" cellpadding="0" cellspacing="0"><tr>',
    '<td><h1>TAANTIRA</h1><p>Handloom Sarees &amp; Heritage Jewellery Atelier</p></td>',
    `<td align="right"><strong>Tax Invoice</strong><br/>Order: ${order.order_number}<br/>Placed: ${formatLongDate(order.placed_at)}<br/>Payment: ${String(order.payment_method || '').toUpperCase()} (${order.payment_status || ''})</td>`,
    '</tr></table><hr/>',
    `<p><strong>Billed &amp; Shipped To:</strong><br/>${addr.recipient_name || order.customer?.full_name || ''}<br/>${addr.address_line1 || ''} ${addr.address_line2 || ''}<br/>${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}<br/>Phone: ${addr.phone || order.customer?.phone || ''}</p>`,
    '<table width="100%" border="1" cellpadding="10" cellspacing="0">',
    '<thead><tr bgcolor="#F5E7E8"><th align="left">Item</th><th align="center">Qty</th><th align="right">Unit Price</th><th align="right">Total</th></tr></thead>',
    `<tbody>${rows}</tbody>`,
    '</table>',
    `<p align="right">Subtotal: INR ${Number(order.subtotal || 0).toFixed(2)}<br/>Discount: -INR ${Number(order.discount_amount || 0).toFixed(2)}<br/>Tax: INR ${Number(order.tax_amount || 0).toFixed(2)}<br/>Shipping: INR ${Number(order.shipping_fee || 0).toFixed(2)}<br/><strong>Grand Total: INR ${Number(order.total_amount || 0).toFixed(2)}</strong></p>`,
    '</td></tr></table></body></html>',
  ].join('\n');

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Taantira-Invoice-${order.order_number}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
