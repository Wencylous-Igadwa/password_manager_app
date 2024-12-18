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
    // initiates the fetch and open popup action
    chrome.runtime.sendMessage({ action: 'fetchAndOpenPopup' }, (response) => {
      if (!response.success) {
        console.error('Error:', response.error);
      }
    });
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

function showCredentialSelection(credentials, fields) {
  const dropdown = document.createElement('select');
  dropdown.id = 'credentialDropdown';

  credentials.forEach((credential, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${credential.username} (${credential.siteName || 'No site name'})`;
    dropdown.appendChild(option);
  });

  dropdown.addEventListener('change', () => {
    const selectedCredential = credentials[dropdown.value];
    fields.username.value = selectedCredential.username || '';
    fields.password.value = selectedCredential.password || '';
  });

  document.body.appendChild(dropdown);
}

// Handle incoming messages for autofill
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'autoFill' && Array.isArray(message.credentials)) {
    console.log('Autofill message received. Processing credentials...');
    console.log('Received credentials:', message.credentials);

    const fields = detectLoginFields();
    
    if (fields.username && fields.password) {
      // If exactly one credential is found, autofill the fields
      if (message.credentials.length === 1) {
        const credential = message.credentials[0];
        if (credential.username && credential.password) {
          fields.username.value = credential.username;
          fields.password.value = credential.password;
          console.log('Credentials autofilled.');
        } else {
          console.error('Invalid credential data: username or password missing.');
        }
      } else {
        // If multiple credentials are found, show a selection interface
        showCredentialSelection(message.credentials, fields);
      }
    } else {
      console.error('Unable to detect login fields on the page.');
    }
  } else {
    console.error('Autofill message received, but no valid credentials provided or message format is incorrect.');
  }
});

