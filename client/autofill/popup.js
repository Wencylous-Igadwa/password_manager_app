const baseURL = 'http://localhost:3000/';

// Helper function to construct full URLs
const getFullUrl = (path) => new URL(path, baseURL).href;

// Bind event listeners to login forms and buttons
document.getElementById('master-password-form').addEventListener('submit', handleMasterPasswordLogin);

// Bind event listener to the Google Login button
document.getElementById('login-with-google-btn').addEventListener('click', initializeGoogleAuth);

// Fetching CSRF token
let csrfTokenCache = null;
const getCsrfToken = async () => {
  if (csrfTokenCache) return csrfTokenCache;

  try {
    const csrfResponse = await fetch(getFullUrl('/csrf-token'), {
      method: 'GET',
      credentials: 'include',
    });

    if (!csrfResponse.ok) {
      throw new Error('Failed to fetch CSRF token');
    }

    const { csrfToken } = await csrfResponse.json();
    csrfTokenCache = csrfToken;
    return csrfTokenCache;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
};

// Initialize the Google authentication flow using the Chrome Identity API
async function initializeGoogleAuth() {
  try {
    const csrfToken = await getCsrfToken();

    if (!csrfToken) {
      throw new Error('CSRF token is not available');
    }

    // Fetch the client ID from the backend
    const response = await fetch(getFullUrl('/api/google-client-id'), {
      method: 'GET',
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google client ID');
    }

    const { client_id } = await response.json();

    // Generate a nonce (a random string)
    const nonce = Math.random().toString(36).substring(2); // Random string, you can use a more secure method

    // Log the nonce before storing it
    console.log("Storing nonce in sessionStorage:", nonce);

    // Store the nonce in the sessionStorage to validate it later
    sessionStorage.setItem('nonce', nonce);

    // Set up the Google OAuth URL with the nonce
    const redirectUri = `https://lajmgfplodciodcddgaofpnincbpakmc.chromiumapp.org/`;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${client_id}&` +
      `response_type=id_token&` +
      `scope=profile email&` +
      `redirect_uri=${redirectUri}&` +
      `nonce=${nonce}`;

    console.log("OAuth URL:", oauthUrl); // Log the OAuth URL to verify it

    // Launch the OAuth flow
    chrome.identity.launchWebAuthFlow(
      {
        url: oauthUrl,
        interactive: true,
      },
      function(redirectUrl) {
        console.log('Redirect URL:', redirectUrl); // Log the returned redirect URL

        // Ensure the redirect URL has the fragment part containing the id_token and nonce
        const urlHash = new URL(redirectUrl).hash; // URL fragment
        if (!urlHash) {
          console.error('No URL hash found in the redirect URL');
          return;
        }

        const urlParams = new URLSearchParams(urlHash.substring(1)); // Remove the '#' from the hash
        const idToken = urlParams.get('id_token');  // Get the id_token
        const returnedNonce = urlParams.get('nonce');  // Get the nonce from the response

        // Log the returned nonce and the stored nonce
        const storedNonce = sessionStorage.getItem('nonce');
        console.log("Returned nonce:", returnedNonce, "Stored nonce:", storedNonce);

        // Validate the nonce
        if (returnedNonce !== storedNonce) {
          console.error('Nonce mismatch: potential replay attack');
        } else if (idToken) {
          onGoogleSignInWithIdToken(idToken);  // Handle login with id_token
        } else {
          console.error('Google OAuth failed: No id_token received');
        }

        // Clear nonce after use
        sessionStorage.removeItem('nonce');
      }
    );
  } catch (error) {
    console.error('Error initializing Google Auth:', error);
  }
}

// Handle Google Sign-In success
async function onGoogleSignInWithIdToken(idToken) {
  try {
    const csrfToken = await getCsrfToken();

    const res = await fetch(getFullUrl('/auth/login/google'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ googleToken: idToken }), // Send id_token to the backend
      credentials: 'include',
    });

    const data = await res.json();

    if (res.ok) {
      document.cookie = `token=${data.token}; path=/; max-age=3600`; // 1-hour expiration
      document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=604800`; // 7-day expiration

      document.getElementById('status').textContent = "Google login successful. Redirecting...";

      setTimeout(() => {
        chrome.storage.local.set({ userEmail: data.email }, () => {
          initializeAutoFill();
        });
      }, 2000);
    } else {
      document.getElementById('status').textContent = data.message || "Google login failed. Please try again.";
    }
  } catch (error) {
    console.error("Google login failed:", error);
    document.getElementById('status').textContent = "Google login failed. Please try again.";
  }
}

// Handle Master Password login
async function handleMasterPasswordLogin(event) {
  event.preventDefault();
  const masterPassword = document.getElementById('master-password').value;

  try {
    const response = await fetch(getFullUrl('/verify-master-password'), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ masterPassword }),
      credentials: 'include',
    });

    const data = await response.json();

    if (data.success) {
      chrome.storage.local.set({ userEmail: data.email }, () => {
        document.getElementById('status').textContent = 'Login successful. Ready for auto-fill.';
      });

      initializeAutoFill();
    } else {
      document.getElementById('status').textContent = 'Invalid master password.';
    }
  } catch (error) {
    console.error('Error during login:', error);
    document.getElementById('status').textContent = 'Error during login.';
  }
}

// Auto-fill logic to fetch credentials for the current site
async function initializeAutoFill() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = new URL(tab.url);
    const domain = currentUrl.hostname;

    const response = await fetch(getFullUrl(`/account/get-credentials?domain=${domain}`), {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (data.credentials) {
      chrome.tabs.sendMessage(tab.id, { action: 'autoFill', credentials: data.credentials });
      document.getElementById('status').textContent = 'Credentials auto-filled.';
    } else {
      document.getElementById('status').textContent = 'No credentials found for this site.';
    }
  } catch (error) {
    console.error("Error during auto-fill:", error);
    document.getElementById('status').textContent = 'Error during auto-fill.';
  }
}

// Show a status message and disable form elements to indicate loading
function setLoadingState(isLoading, statusMessage = '') {
  const statusElement = document.getElementById('status');
  statusElement.textContent = statusMessage;

  const formElements = document.querySelectorAll('input, button');
  formElements.forEach((elem) => {
    elem.disabled = isLoading;
  });

  const spinner = document.getElementById('loading-spinner');
  if (isLoading) {
    spinner.classList.add('active');
  } else {
    spinner.classList.remove('active');
  }
}
