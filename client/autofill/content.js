// Identify login fields dynamically
function detectLoginFields() {
  console.log('Detecting login fields...');
  const fields = {};
  fields.username = document.querySelector('input[type="email"], input[type="text"]');
  fields.password = document.querySelector('input[type="password"]');
  
  if (fields.username) {
    console.log('Username field detected.');
  } else {
    console.log('Username field not found.');
  }

  if (fields.password) {
    console.log('Password field detected.');
  } else {
    console.log('Password field not found.');
  }
  
  return fields;
}

// Auto-fill detected fields
function autoFillFields(credentials) {
  console.log('Attempting to auto-fill fields...');
  const fields = detectLoginFields();
  if (fields.username && fields.password) {
    console.log('Auto-filling username and password fields.');
    fields.username.value = credentials.username;
    fields.password.value = credentials.password;
  } else {
    console.warn('Could not auto-fill fields, missing username or password field.');
  }
}

// Detect login page and request credentials
window.addEventListener('load', () => {
  console.log('Page loaded, detecting login fields...');
  const fields = detectLoginFields();
  
  if (fields.username && fields.password) {
    console.log('Login fields detected, requesting credentials...');
    chrome.runtime.sendMessage(
      { action: 'fetchCredentials', url: window.location.origin },
      (response) => {
        if (response.credentials) {
          console.log('Credentials received, auto-filling...');
          autoFillFields(response.credentials);
        } else if (response.error) {
          console.error('Error fetching credentials:', response.error);
        } else {
          console.warn('No credentials or error returned.');
        }
      }
    );
  } else {
    console.warn('Login fields not detected, skipping credentials fetch.');
  }
});

// Detect sign-up page and prompt save credentials
document.addEventListener('submit', (event) => {
  console.log('Form submission detected...');
  const fields = detectLoginFields();
  
  if (fields.username && fields.password) {
    const username = fields.username.value;
    const password = fields.password.value;
    
    if (username && password) {
      console.log('Submitting credentials for saving:', username);
      chrome.runtime.sendMessage({ action: 'saveCredentials', username, password });
    } else {
      console.warn('Username or password is empty, not saving credentials.');
    }
  } else {
    console.warn('Username or password field not detected, skipping save credentials.');
  }
});
