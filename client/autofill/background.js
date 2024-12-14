const baseURL = 'http://localhost:3000'; 

// Monitor tab changes and initialize content script injection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    console.log(`Tab updated. Injecting content script into ${tab.url}`);
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    })
    .then(() => {
      console.log(`Content script injected successfully into ${tab.url}`);
    })
    .catch((error) => {
      console.error('Failed to execute script:', error);
    });
  } else if (tab.url && tab.url.startsWith('chrome://')) {
    console.log(`Skipping content script injection for chrome:// page: ${tab.url}`);
  }
});

// Listener for fetching credentials
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.action === 'fetchCredentials') {
    console.log(`Fetching credentials for URL: ${message.url}`);
    (async () => {
      try {
        // Send a request to the backend to fetch credentials for the current site
        const response = await fetch(`${baseURL}/account/get-credentials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: message.url }),  // Pass the URL of the site
          credentials: 'include', // Ensure cookies are sent with the request if necessary
        });

        const data = await response.json();

        if (response.ok) {
          console.log('Credentials fetched successfully:', data);
          sendResponse({ credentials: data.credentials });
        } else {
          throw new Error(data.message || 'Failed to fetch credentials.');
        }
      } catch (error) {
        console.error('Error fetching credentials:', error);
        sendResponse({ error: error.message || 'Failed to fetch credentials.' });
      }
    })();
    return true;
  }

  if (message.action === 'saveCredentials') {
    console.log(`Saving credentials for username: ${message.username}`);
    (async () => {
      try {
        const response = await fetch(`${baseURL}/account/save-credentials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: message.username,
            password: message.password,
          }),
          credentials: 'include',
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log('Credentials saved successfully:', data);
        } else {
          throw new Error(data.message || 'Failed to save credentials.');
        }
      } catch (error) {
        console.error('Error saving credentials:', error);
      }
    })();
    sendResponse({ status: 'Credentials saved successfully' });
  }
});
