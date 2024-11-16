// Constants
const API_URL = 'http://localhost:3000/get-credentials';
const ERROR_MESSAGES = {
  invalidDomain: 'The domain is invalid. Please check and try again.',
  networkError: 'There was a problem connecting to the server. Please check your internet connection.',
  noCredentials: 'No credentials found for the entered domain.',
  unexpectedError: 'An unexpected error occurred. Please try again later.'
};
//authenticate the user
async function loginUser(email, password) {
  const response = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (result.token) {
    sessionStorage.setItem("sessionToken", result.token);

    if (result.two_factor_enabled) {
      const twoFactorToken = prompt("Enter your 2FA code:");
      const verifyResponse = await fetch("http://localhost:3000/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: result.userId, token: twoFactorToken }),
      });

      const verifyResult = await verifyResponse.json();
      if (verifyResult.message !== "2FA verification successful") {
        alert("Invalid 2FA code.");
        return false;
      }
    }

    alert("Login successful!");
    return true;
  } else {
    alert(result.message);
    return false;
  }
}


// Use the appropriate API based on the browser
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.action.onClicked.addListener((tab) => {
  (async () => {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;

      if (!isValidDomain(domain)) {
        throw new Error('Invalid domain');
      }

      const { authToken: token } = await browserAPI.storage.local.get('authToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      const credentials = await fetchCredentials(domain, token);
      if (!credentials) {
        throw new Error('No credentials found for this domain');
      }

      const encryptedCredentials = await encrypt(JSON.stringify(credentials));

      await browserAPI.tabs.sendMessage(tab.id, {
        action: 'autofill',
        encryptedData: encryptedCredentials
      });
    } catch (error) {
      handleError(error);
    }
  })();
});

// Function to fetch credentials from the server
async function fetchCredentials(domain, token) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ domain })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.credentials || null;
  } catch (error) {
    throw new Error('Failed to fetch credentials: ' + error.message);
  }
}

// Improved error handling
function handleError(error) {
  console.error('Error in browser action click handler:', error);

  let userMessage;

  if (error.message.includes('Invalid domain')) {
    userMessage = ERROR_MESSAGES.invalidDomain;
  } else if (error.message.includes('Network response was not ok')) {
    userMessage = ERROR_MESSAGES.networkError;
  } else if (error.message.includes('No credentials found for this domain')) {
    userMessage = ERROR_MESSAGES.noCredentials;
  } else {
    userMessage = ERROR_MESSAGES.unexpectedError;
  }

  displayUserNotification(userMessage);
}

// Function to display user notifications
function displayUserNotification(message) {
  const notificationElement = document.createElement('div');
  notificationElement.className = 'notification';
  notificationElement.textContent = message;
  document.body.appendChild(notificationElement);

  // Automatically remove the notification after a few seconds
  setTimeout(() => {
    notificationElement.remove();
  }, 5000);
}

// Domain validation function
function isValidDomain(domain) {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

// AES-256 Encryption function with key export
async function encrypt(data) {
  try {
    // Generate a random key for AES-256 encryption
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true, // Extractable (for transport)
      ["encrypt"] // Usages
    );

    // Convert the data to a Uint8Array
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    // Generate a random initialization vector (IV)
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // AES-GCM recommends a 12-byte IV

    // Encrypt the data
    const cipherText = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encodedData
    );

    // Export the key for storage or transport
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);

    // Combine the IV, ciphertext, and key into one Uint8Array for transport
    const combinedData = new Uint8Array(iv.length + cipherText.byteLength + exportedKey.byteLength);
    combinedData.set(iv);
    combinedData.set(new Uint8Array(cipherText), iv.length);
    combinedData.set(new Uint8Array(exportedKey), iv.length + cipherText.byteLength);

    // Convert combined data to a base64 string for easier handling
    return btoa(String.fromCharCode(...combinedData));
  } catch (error) {
    console.error('Error during encryption:', error);
    throw new Error('Encryption failed');
  }
}

// Example usage of decrypting the encrypted data (for reference)
async function decrypt(encryptedData) {
  try {
    // Convert base64 string back to Uint8Array
    const combinedData = new Uint8Array(atob(encryptedData).split("").map(c => c.charCodeAt(0)));

    // Extract the IV, ciphertext, and key
    const iv = combinedData.slice(0, 12); // First 12 bytes are the IV
    const cipherText = combinedData.slice(12, -32); // Ciphertext
    const keyData = combinedData.slice(-32); // The last 32 bytes are the key

    // Import the encryption key
    const key = await window.crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM", length: 256 },
      true,
      ["decrypt"]
    );

    // Decrypt the data
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      cipherText
    );

    // Convert the decrypted data back to a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Error during decryption:', error);
    throw new Error('Decryption failed');
  }
}
