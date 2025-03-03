// Ensure page loads and stays at the top
window.onload = function() {
    window.scrollTo(0, 0);
    const reflectionInput = document.getElementById('reflectionInput');
    if (reflectionInput) {
      reflectionInput.blur();
    }
    const firstCard = document.querySelector('.alternative-card');
    if (firstCard) {
      firstCard.focus();
    }
  };
  