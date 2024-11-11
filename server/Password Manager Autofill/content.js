document.addEventListener('DOMContentLoaded', function() {
  const observer = new MutationObserver(() => {
    const emailField = document.querySelector('input[type="email"]');
    const passwordField = document.querySelector('input[type="password"]');

    if (emailField && passwordField) {
      chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'autofill') {
          emailField.value = request.email;
          passwordField.value = request.password;
          observer.disconnect(); // Stop observing after autofill
          console.log('Credentials autofilled successfully');
        }
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
