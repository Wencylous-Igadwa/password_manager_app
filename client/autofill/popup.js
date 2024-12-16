const baseURL = 'http://localhost:3000/';

// Helper function to construct full URLs
const getFullUrl = (path) => new URL(path, baseURL).href;

// Cache the DOM elements to avoid multiple lookups
const masterPasswordForm = document.getElementById('master-password-form');
const googleLoginBtn = document.getElementById('login-with-google-btn');
const statusText = document.getElementById('status');

// Loading state functions
function showLoadingState(button) {
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span> Loading...';
}

function resetButton(button, text = 'Login with Google') {
  button.disabled = false;
  button.innerHTML = text;
}

// Bind event listeners to login forms and buttons
masterPasswordForm.addEventListener('submit', handleMasterPasswordLogin);
googleLoginBtn.addEventListener('click', initializeGoogleAuth);

const welcomeMessage = document.getElementById('welcome-message');
// Display the username on initialization
async function displayWelcomeMessage() {
  try {
    const userEmail = await getValidUserEmail();
    if (userEmail) {
      welcomeMessage.textContent = `Welcome, ${userEmail}`;
    } else {
      welcomeMessage.textContent = 'Welcome! Please log in.';
    }
  } catch (error) {
    console.error('Error displaying welcome message:', error);
    welcomeMessage.textContent = 'Welcome! Please log in.';
  }
}

// Optimized CSRF token caching mechanism (expires after 5 minutes)
let csrfTokenCache = null;
let csrfTokenTimestamp = 0;

const getCsrfToken = async () => {
  const now = Date.now();
  if (csrfTokenCache && (now - csrfTokenTimestamp < 5 * 60 * 1000)) {
    return csrfTokenCache; // Return cached token if it's less than 5 minutes old
  }

  try {
    const csrfResponse = await fetch(getFullUrl('/csrf-token'), {
      method: 'GET',
      credentials: 'include',
    });

    if (!csrfResponse.ok) throw new Error('Failed to fetch CSRF token');
    
    const { csrfToken } = await csrfResponse.json();
    csrfTokenCache = csrfToken;
    csrfTokenTimestamp = now;
    return csrfTokenCache;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
};

// Decode JWT (id_token) and extract the payload in a more efficient way
const parseJwt = (token) => {
  const base64Url = token.split('.')[1]; 
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); 
  const jsonPayload = atob(base64); // Directly decode without further unnecessary processing
  return JSON.parse(decodeURIComponent(escape(jsonPayload)));
};

// Initialize the Google authentication flow using the Chrome Identity API
async function initializeGoogleAuth() {
  showLoadingState(googleLoginBtn); // Show loading state on the Google login button

  try {
    const csrfToken = await getCsrfToken();
    if (!csrfToken) throw new Error('CSRF token is not available');

    // Fetch client ID from backend in parallel
    const clientIdPromise = fetch(getFullUrl('/api/google-client-id'), {
      method: 'GET',
      headers: { 'X-CSRF-Token': csrfToken },
    }).then(response => {
      if (!response.ok) throw new Error('Failed to fetch Google client ID');
      return response.json();
    });

    // Wait for both CSRF token and client ID fetch
    const { client_id } = await clientIdPromise;

    // Generate nonce and store in sessionStorage
    const nonce = Math.random().toString(36).substring(2);
    sessionStorage.setItem('nonce', nonce);

    // Set up OAuth URL with nonce
    const redirectUri = `https://lajmgfplodciodcddgaofpnincbpakmc.chromiumapp.org/`;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${client_id}&` +
      `response_type=id_token&` +
      `scope=profile email&` +
      `redirect_uri=${redirectUri}&` +
      `nonce=${nonce}`;

    // Launch OAuth flow
    chrome.identity.launchWebAuthFlow(
      { url: oauthUrl, interactive: true },
      function(redirectUrl) {
        const urlHash = new URL(redirectUrl).hash;
        if (!urlHash) return console.error('No URL hash found in the redirect URL');

        const urlParams = new URLSearchParams(urlHash.substring(1));
        const idToken = urlParams.get('id_token');
        if (idToken) {
          const decodedToken = parseJwt(idToken);
          const returnedNonce = decodedToken.nonce;
          const storedNonce = sessionStorage.getItem('nonce');

          if (returnedNonce !== storedNonce) {
            console.error('Nonce mismatch: potential replay attack');
          } else {
            onGoogleSignInWithIdToken(idToken);
          }
        } else {
          console.error('Google OAuth failed: No id_token received');
        }

        sessionStorage.removeItem('nonce');
      }
    );
  } catch (error) {
    console.error('Error initializing Google Auth:', error);
    resetButton(googleLoginBtn); // Reset button in case of an error
  }
}

async function onGoogleSignInWithIdToken(idToken) {
  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch(getFullUrl('/auth/login/google'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ googleToken: idToken }),
      credentials: 'include',
    });

    const data = await res.json();
    if (res.ok) {
      // Store tokens and device ID in chrome.storage.local
      chrome.storage.local.set({
        accessToken: data.token,
        refreshToken: data.refreshToken,
        deviceId: data.deviceId,
      }, () => {
        console.log("Tokens and device ID saved.");
      });

      // Also store user email for displaying the welcome message
      chrome.storage.local.set({ userEmail: data.email }, () => {
        console.log("User email saved.");
        displayWelcomeMessage(); // Update the welcome message
      });

      statusText.textContent = "Google login successful. Autofill is ready !";
    } else {
      statusText.textContent = data.message || "Google login failed. Please try again.";
    }
  } catch (error) {
    console.error("Google login failed:", error);
    statusText.textContent = "Google login failed. Please try again.";
  } finally {
    resetButton(googleLoginBtn);
  }
}

async function getValidUserEmail() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['userEmail'], (result) => {
      const { userEmail } = result;

      if (userEmail) {
        resolve(userEmail);
      } else {
        resolve(null);
      }
    });
  });
}

// Handle Master Password login
async function handleMasterPasswordLogin(event) {
  event.preventDefault();
  const masterPassword = document.getElementById('master-password').value;
  
  const masterPasswordBtn = document.getElementById('master-password-btn');
  showLoadingState(masterPasswordBtn);

  try {
    const response = await fetch(getFullUrl('/verify-master-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masterPassword }),
      credentials: 'include',
    });

    const data = await response.json();
    if (data.success) {
      chrome.storage.local.set({ userEmail: data.email }, () => {
        statusText.textContent = 'Login successful. Ready for auto-fill.';
      });

      initializeAutoFill();
    } else {
      statusText.textContent = 'Invalid master password.';
    }
  } catch (error) {
    console.error('Error during login:', error);
    statusText.textContent = 'Error during login.';
  }

  resetButton(masterPasswordBtn, 'Login'); // Reset the button after completion
}

// Fetch credentials for the current site
async function fetchCredentialsForSite() {
  try {
    // Validate the stored userEmail and session
    const userEmail = await getValidUserEmail();
    if (!userEmail) {
      statusText.textContent = "Session expired. Please log in again.";
      return null;
    }

    // Get the active tab and its URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      throw new Error('No active tab or URL found.');
    }

    const currentUrl = tab.url; // Full URL of the active tab

    // Get CSRF token
    const csrfToken = await getCsrfToken();
    if (!csrfToken) throw new Error('CSRF token is not available.');

    // Make the API request to fetch credentials
    const response = await fetch(getFullUrl(`/account/get-credentials?site_url=${encodeURIComponent(currentUrl)}`), {
      method: 'GET',
      headers: { 'X-CSRF-Token': csrfToken },
      credentials: 'include',
    });

    // Parse the response
    const data = await response.json();
    if (response.ok && Array.isArray(data)) {
      return data; // Return the credentials array
    } else {
      statusText.textContent = 'No credentials found for this site.';
      return null;
    }
  } catch (error) {
    console.error('Error fetching credentials:', error);
    statusText.textContent = 'Error fetching credentials.';
    return null;
  }
}

// Auto-fill credentials for the active tab
async function initializeAutoFill() {
  try {
    const credentials = await fetchCredentialsForSite();  // Fetch credentials for the active tab
    if (credentials) {
      // Get the active tab in the current window
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Send credentials to the content script for auto-filling
      chrome.tabs.sendMessage(tab.id, { action: 'autoFill', credentials });

      statusText.textContent = 'Credentials auto-filled.';  // Notify the user

      // Show the autofill icon for the user to interact with
      const fields = detectLoginFields();
      if (fields.username || fields.password) {
        showAutoFillIcon(fields.username || fields.password);
      }
    }
  } catch (error) {
    console.error('Error during auto-fill:', error);
    statusText.textContent = 'Error during auto-fill.';
  }
}

// Initialize the popup page
document.addEventListener('DOMContentLoaded', displayWelcomeMessage);
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCsrfToken') {
    getCsrfToken().then((csrfToken) => {
      sendResponse({ csrfToken });
    });
    return true;
  }
});