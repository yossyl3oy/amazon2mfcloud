let allOrders = [];

document.addEventListener('DOMContentLoaded', () => {
  const fetchBtn = document.getElementById('fetchBtn');
  const fetchAllBtn = document.getElementById('fetchAllBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const status = document.getElementById('status');
  const progress = document.getElementById('progress');
  const resultInfo = document.getElementById('resultInfo');
  const orderCount = document.getElementById('orderCount');

  // 蓄積データを復元
  chrome.storage.local.get(['orders'], (result) => {
    if (result.orders && result.orders.length > 0) {
      allOrders = result.orders;
      showResult();
    }
  });

  // Amazon.co.jpページかチェック
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url || '';
    if (!url.includes('amazon.co.jp')) {
      status.textContent = 'Amazon.co.jpの注文履歴ページを開いてください';
      fetchBtn.disabled = true;
    } else {
      status.textContent = '準備完了';
    }
  });

  fetchBtn.addEventListener('click', () => {
    status.textContent = '取得中...';
    fetchBtn.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapeOrders' }, (response) => {
        fetchBtn.disabled = false;

        if (chrome.runtime.lastError) {
          status.textContent = 'ページを再読み込みしてから再試行してください';
          return;
        }

        if (response?.success) {
          mergeOrders(response.orders);
          chrome.storage.local.set({ orders: allOrders });
          showResult();
          status.textContent = `${response.orders.length}件を取得しました`;
        } else {
          status.textContent = response?.error || '取得に失敗しました';
        }
      });
    });
  });

  // 全件取得ボタン
  fetchAllBtn.addEventListener('click', () => {
    status.textContent = '全ページ取得中...';
    progress.hidden = false;
    progress.textContent = 'ページ 1 を取得中...';
    fetchBtn.disabled = true;
    fetchAllBtn.disabled = true;

    // 進捗メッセージを受信
    const progressListener = (message) => {
      if (message.action === 'progress') {
        progress.textContent = message.text;
      }
    };
    chrome.runtime.onMessage.addListener(progressListener);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'loadAllOrders' }, (response) => {
        chrome.runtime.onMessage.removeListener(progressListener);
        fetchBtn.disabled = false;
        fetchAllBtn.disabled = false;

        if (chrome.runtime.lastError) {
          status.textContent = 'ページを再読み込みしてから再試行してください';
          progress.hidden = true;
          return;
        }

        if (response?.success) {
          mergeOrders(response.orders);
          chrome.storage.local.set({ orders: allOrders });
          showResult();
          status.textContent = `全件取得完了: ${response.orders.length}件`;
        } else {
          status.textContent = response?.error || '取得に失敗しました';
        }
      });
    });
  });

  downloadBtn.addEventListener('click', () => {
    const csv = generateCSV(allOrders);
    downloadCSV(csv, 'amazon_mfcloud.csv');
    status.textContent = 'ダウンロード完了';
  });

  clearBtn.addEventListener('click', () => {
    allOrders = [];
    chrome.storage.local.remove('orders');
    resultInfo.hidden = true;
    downloadBtn.disabled = true;
    clearBtn.hidden = true;
    status.textContent = 'データをクリアしました';
  });

  function showResult() {
    orderCount.textContent = allOrders.length;
    resultInfo.hidden = false;
    downloadBtn.disabled = false;
    clearBtn.hidden = false;
  }

  function mergeOrders(newOrders) {
    const seen = new Set(allOrders.map((o) => o.orderNumber + '|' + o.itemName));
    for (const order of newOrders) {
      const key = order.orderNumber + '|' + order.itemName;
      if (!seen.has(key)) {
        allOrders.push(order);
        seen.add(key);
      }
    }
  }
});
