// MFクラウド取引明細インポート用CSV生成

function escapeCSV(value) {
  if (typeof value !== 'string') return value;
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function generateCSV(orders) {
  const header = '日付,内容,出金額,入金額';

  // 注文番号でグループ化（注文合計の重複計上を防止）
  const grouped = new Map();
  for (const order of orders) {
    if (!grouped.has(order.orderNumber)) {
      grouped.set(order.orderNumber, {
        date: order.date,
        orderNumber: order.orderNumber,
        price: order.price,
        items: [],
      });
    }
    grouped.get(order.orderNumber).items.push(order.itemName);
  }

  const rows = [...grouped.values()].map((g) => {
    const itemNames = g.items.join(' / ');
    const description = escapeCSV(`Amazon: ${itemNames} (${g.orderNumber})`);
    return `${g.date},${description},${g.price},`;
  });

  return [header, ...rows].join('\r\n');
}

function downloadCSV(csvContent, filename) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
