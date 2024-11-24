document.getElementById("savePasswordForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const site = document.getElementById("site").value;
  const password = document.getElementById("password").value;

  chrome.runtime.sendMessage(
    { type: "savePassword", data: { site, password } },
    (response) => {
      const status = document.getElementById("status");
      if (response.success) {
        status.textContent = "Password saved!";
      } else {
        status.textContent = `Error: ${response.error}`;
      }
    }
  );
});
