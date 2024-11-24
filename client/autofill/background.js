const cryptoKey = crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  true,
  ["encrypt", "decrypt"]
);

// Store encrypted passwords
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "savePassword") {
    const { password, site } = message.data;

    try {
      const encryptedPassword = await encryptPassword(password);
      const storageKey = `password_${site}`;

      chrome.storage.local.set({ [storageKey]: encryptedPassword }, () => {
        sendResponse({ success: true });
      });
    } catch (error) {
      console.error("Error saving password:", error);
      sendResponse({ success: false, error: error.message });
    }

    return true; // Indicates async response
  }
});

// Retrieve encrypted passwords
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "getPassword") {
    const { site } = message.data;

    chrome.storage.local.get(`password_${site}`, async (result) => {
      if (result[`password_${site}`]) {
        try {
          const decryptedPassword = await decryptPassword(result[`password_${site}`]);
          sendResponse({ success: true, password: decryptedPassword });
        } catch (error) {
          console.error("Error decrypting password:", error);
          sendResponse({ success: false, error: error.message });
        }
      } else {
        sendResponse({ success: false, error: "Password not found" });
      }
    });

    return true;
  }
});

// Encrypt password
async function encryptPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, data);
  return { iv: Array.from(iv), encrypted: Array.from(new Uint8Array(encrypted)) };
}

// Decrypt password
async function decryptPassword(encryptedData) {
  const decoder = new TextDecoder();
  const { iv, encrypted } = encryptedData;

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    cryptoKey,
    new Uint8Array(encrypted)
  );

  return decoder.decode(decrypted);
}
