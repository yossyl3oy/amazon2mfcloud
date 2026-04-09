// コンテンツスクリプト: ポップアップからのメッセージを受信しDOMを読み取る

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scrapeOrders') {
    try {
      const orders = extractOrders();
      sendResponse({ success: true, orders });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  if (message.action === 'loadAllOrders') {
    fetchAndAppendAllPages((progressText) => {
      chrome.runtime.sendMessage({ action: 'progress', text: progressText });
    })
      .then(() => {
        const orders = extractOrders();
        sendResponse({ success: true, orders });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
  }

  return true;
});
