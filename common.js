document.addEventListener('DOMContentLoaded', () => {
    const toggleCheckbox = document.getElementById('toggleBlockingCheckbox');
    const toggleBlockingState = document.getElementById('toggleBlockingState');
  
    if (toggleCheckbox && toggleBlockingState) {
      // Load the stored state to decide if extension is on or off
      chrome.storage.local.get(['extensionDisabled'], (result) => {
        const isDisabled = result.extensionDisabled === true;
        // If extensionDisabled = true => extension is OFF => checkbox unchecked
        // If extensionDisabled = false => extension is ON => checkbox checked
        toggleCheckbox.checked = !isDisabled;
        toggleBlockingState.textContent = isDisabled ? 'OFF' : 'ON';
      });
  
      // Update storage whenever the user toggles
      toggleCheckbox.addEventListener('change', () => {
        const newState = !toggleCheckbox.checked; 
        // if user checks => extensionDisabled = false => extension is ON
        // if user unchecks => extensionDisabled = true => extension is OFF
  
        chrome.storage.local.set({ extensionDisabled: newState }, () => {
          toggleBlockingState.textContent = newState ? 'OFF' : 'ON';
        });
      });
    }
  });