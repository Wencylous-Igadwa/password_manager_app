document.getElementById("master-password-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const masterPassword = document.getElementById("master-password").value;
  
    // Use stored hash to verify password
    const storedHash = localStorage.getItem("masterPasswordHash");
    const inputHash = await hashPassword(masterPassword);
  
    if (inputHash === storedHash) {
      chrome.runtime.sendMessage({ type: "unlock", masterPassword });
      alert("Master password verified! Auto-fill enabled.");
      window.close();
    } else {
      alert("Incorrect master password.");
    }
  });
  
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  