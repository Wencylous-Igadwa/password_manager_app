// Set the base URL for the fetch requests
const baseURL = 'http://localhost:3000'; // Replace with your backend URL

// Bind event listeners
document.getElementById('master-password-form').addEventListener('submit', handleMasterPasswordLogin);
document.getElementById('google-login').addEventListener('click', handleGoogleLogin);

async function handleMasterPasswordLogin(event) {
  event.preventDefault();
  const masterPassword = document.getElementById('master-password').value;

  try {
    const response = await fetch(`${baseURL}/verify-master-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ masterPassword }),
      credentials: 'include', // Ensure cookies are sent with the request if necessary
    });

    const data = await response.json();
    if (data.success) {
      const { email } = data;

      // Store the email locally to bind the extension
      chrome.storage.local.set({ userEmail: email }, () => {
        document.getElementById('status').textContent = 'Login successful. Ready for auto-fill.';
      });

      // After successful login, initialize auto-fill
      initializeAutoFill();
    } else {
      document.getElementById('status').textContent = 'Invalid master password.';
    }
  } catch (error) {
    document.getElementById('status').textContent = 'Error during login.';
  }
}

async function handleGoogleLogin() {
  try {
    const credentialResponse = await getGoogleCredential(); // Replace with actual credential fetching logic
    if (!credentialResponse || !credentialResponse.credential) {
      throw new Error("No credential provided in response");
    }

    const googleToken = credentialResponse.credential; // The token provided by Google

    const response = await fetch(`${baseURL}/auth/login/google`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ googleToken }),
      credentials: 'include', // Ensure cookies are sent with the request if necessary
    });

    const data = await response.json();
    if (data.success) {
      const { email } = data;

      // Store the email locally
      chrome.storage.local.set({ userEmail: email }, () => {
        document.getElementById('status').textContent = 'Google login successful. Ready for auto-fill.';
      });

      // After successful login, initialize auto-fill
      initializeAutoFill();
    } else {
      document.getElementById('status').textContent = 'Google login failed. Please try again.';
    }
  } catch (error) {
    console.error("Google login failed:", error);
    document.getElementById('status').textContent = 'Error during Google login.';
  }
}

// Auto-fill logic to fetch credentials for the current site
async function initializeAutoFill() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = new URL(tab.url);
    const domain = currentUrl.hostname;

    const response = await fetch(`${baseURL}/credentials?domain=${domain}`, {
      method: 'GET',
      credentials: 'include', // Ensure cookies are sent with the request if necessary
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
