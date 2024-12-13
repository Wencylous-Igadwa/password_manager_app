// Set the base URL for the fetch requests
const baseURL = 'http://localhost:3000'; // Replace with your backend URL

// Monitor tab changes and initialize content script injection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
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
  }
});

// Listener for fetching credentials
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.action === 'fetchCredentials') {
    console.log(`Fetching credentials for URL: ${message.url}`);

    // Use an immediately invoked async function to handle the network request
    (async () => {
      try {
        const response = await fetch(`${baseURL}/fetch-credentia`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: message.url }),
          credentials: 'include', // Ensure credentials (cookies) are sent with requests if necessary
        });

        const data = await response.json();
        if (response.ok) {
          console.log('Credentials fetched successfully:', data);
          sendResponse(data);
        } else {
          throw new Error(data.message || 'Failed to fetch credentials.');
        }
      } catch (error) {
        console.error('Error fetching credentials:', error);
        sendResponse({ error: error.message || 'Failed to fetch credentials.' });
      }
    })();

    return true; // Keep the message channel open while the async operation is ongoing
  }
});
