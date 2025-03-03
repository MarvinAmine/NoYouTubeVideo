if (typeof browser === 'undefined') {
    var browser = chrome;
  }
  
  // Create and inject the reminder message
  function createReminderMessage() {
    // Only inject on YouTube main site, not YouTube Music
    if (window.location.hostname !== 'www.youtube.com' || window.location.pathname.startsWith('/music')) return;
  
    // Only show reminder if we have temporary access
    browser.storage.local.get(['tempYoutubeAccess'], (result) => {
      if (!result.tempYoutubeAccess) return;
  
      // Create and show the reminder message
      const reminderDiv = document.createElement('div');
      reminderDiv.className = 'yt-reminder-message';
      reminderDiv.textContent =
        "Remember, you are in control of your time. If you're here with intention, enjoy!";
  
      // Add to the page
      document.body.appendChild(reminderDiv);
  
      // Show the message with a slight delay
      setTimeout(() => {
        reminderDiv.classList.add('show');
      }, 500);
  
      // Hide the message after 5 seconds
      setTimeout(() => {
        reminderDiv.classList.add('fade-out');
        // Remove from DOM after animation
        setTimeout(() => reminderDiv.remove(), 300);
      }, 5000);
    });
  }
  
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createReminderMessage);
  } else {
    createReminderMessage();
  }
  
  // Also handle YouTube's dynamic navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      if (location.hostname === 'www.youtube.com' && !location.pathname.startsWith('/music')) {
        createReminderMessage();
      }
    }
  }).observe(document, { subtree: true, childList: true });
  