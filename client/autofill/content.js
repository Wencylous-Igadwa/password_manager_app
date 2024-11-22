chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "autoFill" && message.credentials) {
      const { username, password } = message.credentials;
      document.querySelector("input[type='text'], input[type='email']").value = username;
      document.querySelector("input[type='password']").value = password;
    }
  });
  