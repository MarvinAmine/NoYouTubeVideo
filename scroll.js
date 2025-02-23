// Ensure page loads and stays at the top
window.onload = function() {
  window.scrollTo(0, 0);
  // Prevent automatic focus on the reflection input
  const reflectionInput = document.getElementById('reflectionInput');
  if (reflectionInput) {
    reflectionInput.blur();
  }
  // Set focus to the first alternative card instead
  const firstCard = document.querySelector('.alternative-card');
  if (firstCard) {
    firstCard.focus();
  }
}; 