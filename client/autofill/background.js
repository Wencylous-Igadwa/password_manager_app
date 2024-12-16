// Listener for handling messages from the popup or content scripts
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

    default:
      console.warn('Unknown action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Listen for the message to open the popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'openPopup') {
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 360,
      height: 360,
    });
  }
});

