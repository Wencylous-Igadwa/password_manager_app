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

// Get CSRF token from popup
async function getCsrfTokenFromPopup() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'getCsrfToken' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
        return;
      }
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
    const { refreshToken, deviceId } = await chrome.storage.local.get(['refreshToken', 'deviceId']);
    if (!refreshToken || !deviceId) {
      console.warn('No refresh token or device ID found in local storage');
      return;
    }

    const csrfToken = await getCsrfTokenFromPopup().catch((error) => {
      console.warn('CSRF token retrieval failed:', error);
      return null;
    });

    const headers = { 'Content-Type': 'application/json' };
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

    const response = await fetch(`${backendUrl}/auth/refresh-token`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken, deviceId }),
    });

    if (!response.ok) {
      const errorDetails = await response.json().catch(() => null);
      console.error('Token refresh failed:', response.status, errorDetails);
      return;
    }

    const data = await response.json();
    if (data.token) {
      await chrome.storage.local.set({ accessToken: data.token });
      console.log('Access token refreshed successfully');
    } else {
      console.error('No new token returned during refresh.');
    }
  } catch (error) {
    console.error('Error during token refresh:', error);
  }
}

// Ensure token refresh occurs on startup and installation
chrome.runtime.onStartup.addListener(refreshTokenOnStartup);
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    refreshTokenOnStartup();
  }
});

