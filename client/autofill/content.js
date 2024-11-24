document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    const usernameField = form.querySelector("input[type='text']");
    const passwordField = form.querySelector("input[type='password']");

    if (usernameField && passwordField) {
      const site = window.location.hostname;

      chrome.runtime.sendMessage({ type: "getPassword", data: { site } }, (response) => {
        if (response.success) {
          usernameField.value = "StoredUsername"; // Adjust based on saved username
          passwordField.value = response.password;
        }
      });
    }
  });
});
