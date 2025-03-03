if (typeof browser === 'undefined') {
    var browser = chrome;
  }
  
  // Theme handling
  document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    
    browser.storage.local.get(['theme'], (result) => {
      const savedTheme = result.theme || 'dark';
      applyTheme(savedTheme);
    });
  
    themeToggle.addEventListener('click', () => {
      const currentTheme = root.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      browser.storage.local.set({ theme: newTheme });
    });
  });
  
  function applyTheme(theme) {
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    root.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode';
  }
  