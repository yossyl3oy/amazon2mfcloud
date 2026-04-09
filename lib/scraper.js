// Amazon.co.jp 注文履歴 DOM読み取り

const SELECTORS = {
  ORDER_CARDS: ['.order-card', '.js-order-card'],
  ORDER_ID: ['.yohtmlc-order-id'],
  ORDER_HEADER: ['.order-header'],
  ITEM_TITLE: ['.yohtmlc-product-title'],
};

function querySelectorFallback(parent, selectorList) {
  for (const selector of selectorList) {
    const result = parent.querySelector(selector);
    if (result) return result;
  }
  return null;
}

function querySelectorAllFallback(parent, selectorList) {
  for (const selector of selectorList) {
    const results = parent.querySelectorAll(selector);
    if (results.length > 0) return results;
  }
  return [];
}

function parseAmazonDate(text) {
  // "2025年3月8日" → "2025/3/8"
  const nums = text.match(/[0-9]+/g);
  if (!nums || nums.length < 3) return '';
  return `${nums[0]}/${parseInt(nums[1], 10)}/${parseInt(nums[2], 10)}`;
}

// ヘッダーのリスト項目からラベルに対応する値を取得
function getHeaderValue(header, label) {
  const items = header.querySelectorAll('.order-header__header-list-item');
  for (const item of items) {
    if (item.textContent.includes(label)) {
      const rows = item.querySelectorAll('.a-row');
      if (rows.length >= 2) {
        return rows[1].textContent.trim();
      }
    }
  }
  return '';
}

function extractOrders() {
  let orderCards = [];
  for (const selector of SELECTORS.ORDER_CARDS) {
    orderCards = document.querySelectorAll(selector);
    if (orderCards.length > 0) break;
  }

  if (orderCards.length === 0) {
    throw new Error('注文履歴が見つかりませんでした。Amazon.co.jpの注文履歴ページを開いてください。');
  }

  const orders = [];

  orderCards.forEach((card) => {
    const orderIdEl = querySelectorFallback(card, SELECTORS.ORDER_ID);
    const orderNumber = orderIdEl
      ? (orderIdEl.textContent.match(/[D0-9\-]+/) || [''])[0].trim()
      : '';

    const header = querySelectorFallback(card, SELECTORS.ORDER_HEADER);
    const dateText = header ? getHeaderValue(header, '注文日') : '';
    const date = dateText ? parseAmazonDate(dateText) : '';

    const priceText = header ? getHeaderValue(header, '合計') : '';
    const priceMatch = priceText.match(/[0-9,]+/);
    const orderTotal = priceMatch ? parseInt(priceMatch[0].replace(/,/g, ''), 10) : 0;

    const titleEls = querySelectorAllFallback(card, SELECTORS.ITEM_TITLE);

    if (titleEls.length === 0) return;

    // 日付がないデータは除外
    if (!date) return;

    // 注文履歴ページには個別商品価格がないため注文合計を使用
    titleEls.forEach((titleEl) => {
      const itemName = titleEl.textContent.trim();
      orders.push({ orderNumber, date, itemName, price: orderTotal, itemCount: titleEls.length });
    });
  });

  console.log(`[Amazon2MFCloud] ${orderCards.length} 注文カード, ${orders.length} 明細行を取得`);
  return orders;
}

// 全ページをfetchしてDOMに注文カードを追加し、全件表示する
async function fetchAndAppendAllPages(onProgress) {
  const url = new URL(window.location.href);
  const timeFilter = url.searchParams.get('timeFilter') || `year-${new Date().getFullYear()}`;
  const baseUrl = `${url.origin}/your-orders/orders`;

  // 現在のページの注文カードコンテナを特定
  const container = document.querySelector('.order-card')?.parentElement;
  if (!container) {
    throw new Error('注文カードのコンテナが見つかりません');
  }

  // 既存の注文カード数を取得（1ページ目は既に表示済み）
  const existingCards = container.querySelectorAll('.order-card, .js-order-card');
  const pageSize = existingCards.length || 10;

  let startIndex = pageSize; // 2ページ目から開始
  let pageNum = 2;
  let totalAdded = 0;

  while (true) {
    if (onProgress) onProgress(`ページ ${pageNum} を取得中...`);

    const pageUrl = `${baseUrl}?timeFilter=${timeFilter}&startIndex=${startIndex}`;
    const response = await fetch(pageUrl, { credentials: 'include' });
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const cards = doc.querySelectorAll('.order-card, .js-order-card');
    if (cards.length === 0) break;

    // 取得した注文カードをDOMに追加
    for (const card of cards) {
      container.appendChild(document.adoptNode(card));
    }

    totalAdded += cards.length;
    startIndex += pageSize;
    pageNum++;

    // レート制限回避: 1秒待機
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (onProgress) onProgress(`完了: ${totalAdded} 件を追加読み込み`);
  console.log(`[Amazon2MFCloud] 全ページ取得完了: ${totalAdded} 件を追加`);
}
