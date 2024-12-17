chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'log':
      console.log(message.data || 'No data provided');
      sendResponse({ success: true, message: 'Logged successfully.' });
      break;

    case 'debug':
      console.debug(message.data || 'Debugging information unavailable');
      sendResponse({ success: true, message: 'Debugging complete.' });
      break;

    case 'openPopup':
      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: 360,
        height: 360,
      });
      sendResponse({ success: true, message: 'Popup opened successfully.' });
      break;

    case 'getCurrentTabUrl':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          const siteUrl = tabs[0].url;
          chrome.runtime.sendMessage({
            action: 'sendSiteUrlToPopup',
            siteUrl: siteUrl
          });
          sendResponse({ siteUrl });
        } else {
          sendResponse({ error: 'No active tab found' });
        }
      });
      return true;  // Keep the message channel open for async response

    default:
      console.warn('Unknown action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});
