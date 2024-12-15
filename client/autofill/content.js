// Initialize the content script when the page is loaded
window.addEventListener('load', () => {
  console.log('Page loaded, initializing content script...');
  initializeContentScript();
});

// Detect login fields dynamically
function detectLoginFields() {
  return {
    username: document.querySelector('input[type="email"], input[type="text"]'),
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

  // Use the custom key emoji icon
  icon.textContent = '🔑';

  // Function to update icon position based on target field
  function positionIcon() {
    const targetRect = target.getBoundingClientRect();
    const targetLeft = targetRect.left + window.scrollX;
    const targetTop = targetRect.top + window.scrollY;

    // Adjust the icon's position to the right of the form field
    icon.style.position = 'absolute';
    icon.style.top = `${targetTop + (targetRect.height / 2) - (icon.offsetHeight / 2)}px`;  // Vertically center the icon relative to the field
    icon.style.left = `${targetLeft + targetRect.width + 10}px`;  // Position the icon to the right of the field with a 10px margin

    // Ensure the icon stays on screen (adjust if necessary)
    const iconRect = icon.getBoundingClientRect();
    if (iconRect.right > window.innerWidth) {
      icon.style.left = `${window.innerWidth - iconRect.width - 10}px`; // Prevent overflow beyond the viewport
    }

    if (iconRect.bottom > window.innerHeight) {
      icon.style.top = `${window.innerHeight - iconRect.height - 10}px`; // Prevent overflow beyond the viewport vertically
    }
  }

  // Initially position the icon
  positionIcon();

  // Update icon position on window resize or scroll
  window.addEventListener('resize', positionIcon);
  window.addEventListener('scroll', positionIcon);

  // Style the icon container with animations
  icon.style.cursor = 'pointer';
  icon.style.zIndex = '9999';
  icon.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
  icon.style.borderRadius = '50%';
  icon.style.padding = '10px';
  icon.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';  // Smooth transition effects

  // Append the icon to the body
  document.body.appendChild(icon);

  // Optional: Add an event listener for the icon click to open the popup
  icon.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });

  // Remove the icon when the mouse leaves both the target field and the icon
  const removeIconOnHover = (event) => {
    if (!target.contains(event.target) && !icon.contains(event.target)) {
      icon.remove();  // Remove the icon when user hovers away from the field or icon
      target.removeEventListener('mouseleave', removeIconOnHover);  // Cleanup the hover listener
      icon.removeEventListener('mouseleave', removeIconOnHover);  // Cleanup the hover listener for icon
    }
  };

  // Add hover event listeners to both the target and the icon
  target.addEventListener('mouseenter', () => {
    // Reposition the icon when hovering over the field
    positionIcon();
    icon.style.display = 'block';  // Show the icon
  });

  target.addEventListener('mouseleave', (event) => {
    // Only trigger icon removal if mouse leaves both the field and the icon
    removeIconOnHover(event);
  });

  icon.addEventListener('mouseenter', () => {
    icon.style.display = 'block';  // Ensure the icon stays visible when hovering over it
  });

  icon.addEventListener('mouseleave', (event) => {
    // Only trigger icon removal if mouse leaves both the field and the icon
    removeIconOnHover(event);
  });
}

// Detect clicks on forms or input fields
function detectFormClick(event) {
  const form = event.target.closest('form');
  if (form) {
    showAutoFillIcon(event.target);
  }
}

function initializeContentScript() {
  document.addEventListener('click', detectFormClick);  // Listen for clicks on forms/fields
}

// Handle incoming messages for autofill
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'autoFill' && message.credentials) {
    console.log('Autofill message received. Populating fields...');
    const fields = detectLoginFields();
    if (fields.username && message.credentials.username) {
      fields.username.value = message.credentials.username;
    }
    if (fields.password && message.credentials.password) {
      fields.password.value = message.credentials.password;
    }
  }
});
