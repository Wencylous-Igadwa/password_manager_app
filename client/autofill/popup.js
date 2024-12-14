const baseURL = 'http://localhost:3000/';

// Helper function to construct full URLs
const getFullUrl = (path) => new URL(path, baseURL).href;

// Bind event listeners to login forms and buttons
document.getElementById('master-password-form').addEventListener('submit', handleMasterPasswordLogin);

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

// Initialize the Google API client
async function initializeGoogleAuth() {
  try {
    const csrfToken = await getCsrfToken();

    if (!csrfToken) {
      throw new Error('CSRF token is not available');
    }

    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
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

      google.accounts.id.initialize({
        client_id: client_id,
        callback: onGoogleSignIn,
        scope: 'profile email',
      });

      renderGoogleSignInButton();
    } else {
      console.error('Google API client not loaded.');
    }
  } catch (error) {
    console.error('Error initializing Google Auth:', error);
  }
}

// Render the Google Sign-In button
function renderGoogleSignInButton() {
  google.accounts.id.renderButton(
    document.getElementById('google-login'),
    {
      theme: 'outline',
      size: 'large',
    }
  );
}

// Handle Google Sign-In success
async function onGoogleSignIn(response) {
  try {
    if (!response.credential) {
      throw new Error('No credential provided in response');
    }

    const googleToken = response.credential;
    const csrfToken = await getCsrfToken();

    const res = await fetch(getFullUrl('/auth/login/google'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ googleToken }),
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

// Initialize Google Auth and render the button when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeGoogleAuth();
});
