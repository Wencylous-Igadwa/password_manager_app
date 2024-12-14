// Function to check if the current page is part of Google's OAuth login flow
function isGoogleOAuthPage() {
  const url = window.location.href;
  return url.includes('accounts.google.com/signin/oauth');
}

// Identify login fields dynamically
function detectLoginFields() {
  const fields = {};
  fields.username = document.querySelector('input[type="email"], input[type="text"]');
  fields.password = document.querySelector('input[type="password"]');
  return fields;
}

// Auto-fill detected fields
function autoFillFields(credentials) {
  const fields = detectLoginFields();
  
  if (fields.username && fields.password) {
    fields.username.value = credentials.username;
    fields.password.value = credentials.password;
  } else {
    console.warn('Could not auto-fill fields, missing username or password field.');
  }
}

// Check if credentials are stored for the current site
function checkStoredCredentials() {
  const url = window.location.origin;
  chrome.runtime.sendMessage({ action: 'fetchCredentials', url }, (response) => {
    if (response && response.credentials) {
      console.log('Credentials found, attempting to auto-fill...');
      autoFillFields(response.credentials);
    } else if (response && response.error) {
      console.error('Error fetching credentials:', response.error);
    } else {
      console.warn('No stored credentials found for this site.');
    }
  });
}

// Handle field click or focus to detect login fields and check credentials
function setupFieldListeners() {
  const fields = detectLoginFields();

  if (fields.username) {
    fields.username.addEventListener('focus', () => {
      checkStoredCredentials();
    });
  }

  if (fields.password) {
    fields.password.addEventListener('focus', () => {
      checkStoredCredentials();
    });
  }
}

// Detect login page and request credentials when fields are focused
window.addEventListener('load', () => {
  // Prevent injection on Google OAuth pages
  if (isGoogleOAuthPage()) {
    console.log('Google OAuth page detected, skipping content script injection.');
    return; // Exit early to avoid running the content script on OAuth pages
  }

  console.log('Page loaded, setting up field listeners...');
  setupFieldListeners();
});

// Detect sign-up page and prompt to save credentials
document.addEventListener('submit', (event) => {
  const fields = detectLoginFields();
  
  if (fields.username && fields.password) {
    const username = fields.username.value;
    const password = fields.password.value;
    
    if (username && password) {
      console.log('Submitting credentials for saving:', username);
      
      // Send credentials to background script to save
      chrome.runtime.sendMessage({ action: 'saveCredentials', username, password });
    } else {
      console.warn('Username or password is empty, not saving credentials.');
    }
  } else {
    console.warn('Username or password field not detected, skipping save credentials.');
  }
});
