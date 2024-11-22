chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "unlock") {
      const masterPassword = message.masterPassword;
  
      // Fetch stored vault
      const encryptedVault = localStorage.getItem("encryptedVault");
      const iv = localStorage.getItem("vaultIV");
      const salt = localStorage.getItem("vaultSalt");
  
      const vault = await decryptVault(encryptedVault, masterPassword, iv, salt);
  
      // Get credentials for current site
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const url = new URL(tabs[0].url);
        const credentials = vault[url.hostname];
        chrome.tabs.sendMessage(tabs[0].id, { type: "autoFill", credentials });
      });
    }
  });
  
  async function decryptVault(encryptedVault, masterPassword, iv, salt) {
    const key = await deriveKey(masterPassword, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(JSON.parse(iv)) },
      key,
      new Uint8Array(JSON.parse(encryptedVault))
    );
  
    return JSON.parse(new TextDecoder().decode(decrypted));
  }
  
  async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
  
    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }
  