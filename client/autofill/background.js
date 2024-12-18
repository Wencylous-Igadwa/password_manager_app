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

    case 'fetchAndOpenPopup':
      // Fetch the current tab's URL and open the popup
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          const siteUrl = tabs[0].url;

          // Store the siteUrl in chrome.storage.local
          chrome.storage.local.set({ siteUrl }, () => {
            console.log('Site URL stored in local storage:', siteUrl);

            // Open the popup after storing the site URL
            chrome.windows.create({
              url: chrome.runtime.getURL('popup.html'),
              type: 'popup',
              width: 360,
              height: 360,
            });

            sendResponse({ success: true, message: 'Popup opened with site URL stored.' });
          });
        } else {
          sendResponse({ success: false, error: 'No active tab found.' });
        }
      });
      return true; // Keep the channel open for async response

    default:
      console.warn('Unknown action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});
