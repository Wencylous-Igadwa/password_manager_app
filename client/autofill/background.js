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

    case 'openPopup':
      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: 360,
        height: 360,
      });
      sendResponse({ success: true, message: 'Popup opened successfully.' });
      break;

    default:
      console.warn('Unknown action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Send a message to the popup to request the CSRF token
async function getCsrfTokenFromPopup() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'getCsrfToken' }, (response) => {
      if (response && response.csrfToken) {
        resolve(response.csrfToken);
      } else {
        reject('Failed to retrieve CSRF token');
      }
    });
  });
}

// Refresh token on startup
async function refreshTokenOnStartup() {
  try {
    // Get the refreshToken and deviceId from local storage
    const { refreshToken, deviceId } = await chrome.storage.local.get(['refreshToken', 'deviceId']);
    if (refreshToken && deviceId) {
      const csrfToken = await getCsrfTokenFromPopup();
      
      // Proceed with token refresh if csrfToken is available
      const response = await fetch(`${backendUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        return;
      }

      const data = await response.json();
      if (data.token) {
        chrome.storage.local.set({ accessToken: data.token });
      } else {
        console.error('No new token returned during refresh.');
      }
    }
  } catch (error) {
    console.error('Error during token refresh:', error);
  }
}

// Ensure token refresh occurs on startup
chrome.runtime.onStartup.addListener(() => {
  refreshTokenOnStartup();
});
