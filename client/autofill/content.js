// Initialize the content script when the page is loaded
window.addEventListener('load', () => {
  console.log('Page loaded, initializing content script...');
  initializeContentScript();
});

// Detect login fields dynamically
function detectLoginFields() {
  return {
    username: document.querySelector('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"]'),
    password: document.querySelector('input[type="password"]'),
  };
}

// Show autofill icon when a form or input field is clicked
function showAutoFillIcon(target) {
  // Check if the icon already exists and remove it to prevent duplicates
  let existingIcon = document.getElementById('autoFillIcon');
  if (existingIcon) {
    existingIcon.remove();
  }

  // Create a new icon div
  const icon = document.createElement('div');
  icon.id = 'autoFillIcon';

  // Use a custom image for the autofill icon
  const img = document.createElement('img');
  img.src = 'https://lh3.googleusercontent.com/a/ACg8ocL_BptfodwWcfiplF1TsVi9kgWKN6taqaWpApw5VYPIeG4Earg=s288-c-no';
  img.alt = 'icon';
  img.style.width = '48px';
  img.style.height = '48px';
  img.style.pointerEvents = 'none';
  icon.appendChild(img);

  // Function to update icon position based on target field
  function positionIcon() {
    const targetRect = target.getBoundingClientRect();
    icon.style.position = 'absolute';
    icon.style.top = `${window.scrollY + targetRect.top + targetRect.height / 2 - 24}px`; // Center vertically
    icon.style.left = `${window.scrollX + targetRect.left + targetRect.width + 10}px`; // Position right
  
    // Ensure icon stays within viewport
    const iconRect = icon.getBoundingClientRect();
    if (iconRect.right > window.innerWidth) {
      icon.style.left = `${window.innerWidth - iconRect.width - 10}px`;
    }
    if (iconRect.bottom > window.innerHeight) {
      icon.style.top = `${window.innerHeight - iconRect.height - 10}px`;
    }
  }  

  positionIcon();

  // Update icon position on window resize or scroll
  window.addEventListener('resize', positionIcon);
  window.addEventListener('scroll', positionIcon);

  // Style the icon container with animations
  icon.style.cursor = 'pointer';
  icon.style.zIndex = '9999';
  icon.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out'; // Smooth transition effects

  // Append the icon to the body
  document.body.appendChild(icon);

  icon.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });

  // Remove the icon when the mouse leaves both the target field and the icon
  const removeIconOnHover = (event) => {
    if (!target.contains(event.target) && !icon.contains(event.target)) {
      icon.remove(); // Remove the icon when user hovers away
      target.removeEventListener('mouseleave', removeIconOnHover); // Cleanup hover listener
      icon.removeEventListener('mouseleave', removeIconOnHover); // Cleanup hover listener
    }
  };

  // Add hover event listeners to both the target and the icon
  target.addEventListener('mouseenter', positionIcon);
  target.addEventListener('mouseleave', removeIconOnHover);
  icon.addEventListener('mouseleave', removeIconOnHover);
}

// Detect clicks on forms or input fields
function detectFormClick(event) {
  const target = event.target;

  // Check if the clicked target is a username/email or password field
  if (
    target.matches('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"]') ||
    target.matches('input[type="password"]')
  ) {
    showAutoFillIcon(target);
  }
}

function initializeContentScript() {
  document.addEventListener('focus', (event) => {
    const target = event.target;
    if (
      target.matches('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"]') ||
      target.matches('input[type="password"]')
    ) {
      showAutoFillIcon(target);
    }
  }, true); // Use capture phase to catch focus events on child elements
}

// Handle incoming messages for autofill
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'autoFill' && Array.isArray(message.credentials)) {
    console.log('Autofill message received. Processing credentials...');
    console.log('Received credentials:', message.credentials);

    const fields = detectLoginFields();
    if (!fields.username || !fields.password) {
      console.error('Unable to detect login fields on the page.');
      return;
    }

    const credential = message.credentials[0];

    if (!credential) {
      console.error('No valid credentials found to autofill.');
      return;
    }

    if (credential.username) {
      fields.username.value = credential.username;
    }
    if (credential.password) {
      fields.password.value = credential.password;
    }
    console.log('Fields successfully populated with the credentials.');
  } else {
    console.error('Autofill message received, but no valid credentials provided.');
  }
});
