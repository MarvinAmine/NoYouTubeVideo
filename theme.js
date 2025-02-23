// Theme handling
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;
  
  // Load saved theme preference
  chrome.storage.local.get(['theme'], (result) => {
    const savedTheme = result.theme || 'dark';
    applyTheme(savedTheme);
  });

  // Toggle theme when button is clicked
  themeToggle.addEventListener('click', () => {
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    
    // Save theme preference
    chrome.storage.local.set({ theme: newTheme });
  });
});

function applyTheme(theme) {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  
  // Set theme on root element
  root.setAttribute('data-theme', theme);
  
  // Update button text and icon
  themeToggle.innerHTML = theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode';
} 