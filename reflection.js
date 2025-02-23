// Reflection handling
document.addEventListener('DOMContentLoaded', async () => {
  // Get elements from the unified reflection interface
  const reflectionInput = document.getElementById('reflectionInput');
  const reflectionFeedback = document.getElementById('reflectionFeedback');
  const togglePastReflections = document.getElementById('togglePastReflections');
  const pastReflectionsPanel = document.getElementById('pastReflectionsPanel');
  const pastReflectionsList = document.getElementById('pastReflectionsList');
  const reflectionContainer = document.querySelector('.reflection-container');
  const bypassButton = document.getElementById('bypassButton');
  const pauseButton = document.getElementById('pauseButton');

  // Get stats elements
  const timeSavedToday = document.getElementById('timeSavedToday');
  const weeklyMinutes = document.getElementById('weeklyMinutes');
  const streakDays = document.getElementById('streakDays');

  // Verify all required elements exist
  if (!reflectionInput || !reflectionFeedback || !togglePastReflections || 
      !pastReflectionsPanel || !pastReflectionsList || !reflectionContainer || !bypassButton) {
    console.warn('Some reflection elements not found');
    return;
  }

  // Show reflection container immediately since we're on the redirect page
  reflectionContainer.classList.add('visible');
  reflectionInput.focus();

  // Initialize stats and progress banner
  const stats = await Stats.initializeStats();
  const progressMessage = Stats.getRandomMessage(stats);
  await Stats.showProgressMessage(progressMessage);
  await updateStats();

  // Initialize bypass button countdown
  let secondsLeft = 3;
  const bypassCountdown = document.getElementById('bypassCountdown');
  bypassButton.disabled = true;
  reflectionInput.disabled = false;
  bypassButton.textContent = `Wait ${secondsLeft} seconds...`;
  bypassCountdown.textContent = "Taking a moment to reflect...";

  const timer = setInterval(() => {
    secondsLeft--;
    if (secondsLeft > 0) {
      bypassButton.textContent = `Wait ${secondsLeft} seconds...`;
    } else {
      clearInterval(timer);
      bypassButton.disabled = reflectionInput.value.trim() === '';
      bypassButton.textContent = "I still want to visit YouTube";
      bypassCountdown.textContent = "The choice is yours";
    }
  }, 1000);

  // Update stats display
  async function updateStats() {
    try {
      const stats = await Stats.initializeStats();
      
      if (timeSavedToday) {
        timeSavedToday.textContent = stats.savedMinutes || 0;
      }
      
      if (weeklyMinutes) {
        weeklyMinutes.textContent = stats.weeklyMinutes || 0;
      }
      
      if (streakDays) {
        streakDays.textContent = stats.streakDays || 0;
      }
    } catch (error) {
      console.error('Error updating stats display:', error);
    }
  }

  // Handle past reflections toggle
  togglePastReflections.addEventListener('click', () => {
    togglePastReflections.classList.toggle('active');
    pastReflectionsPanel.classList.toggle('expanded');
    if (pastReflectionsPanel.classList.contains('expanded')) {
      loadPastReflections();
    }
  });

  // Load and display past reflections
  async function loadPastReflections() {
    try {
      const result = await chrome.storage.local.get(['reflections']);
      const reflections = result.reflections || [];
      const recentReflections = reflections.slice(-5).reverse();
      
      pastReflectionsList.innerHTML = recentReflections.length > 0 
        ? recentReflections.map((reflection, index) => `
            <div class="past-reflection-item" data-index="${index}">
              <div class="past-reflection-content">
                <div class="reflection-text">${reflection.text}</div>
                <div class="reflection-actions-group">
                  <button class="reflection-action-button edit" aria-label="Edit reflection">
                    ✏️
                  </button>
                  <button class="reflection-action-button delete" aria-label="Delete reflection">
                    🗑️
                  </button>
                </div>
              </div>
              <div class="reflection-date">${new Date(reflection.date).toLocaleDateString()}</div>
              <div class="reflection-edit-form" style="display: none;">
                <textarea class="reflection-edit-input">${reflection.text}</textarea>
                <div class="reflection-edit-buttons">
                  <button class="reflection-edit-save">Save</button>
                  <button class="reflection-edit-cancel">Cancel</button>
                </div>
              </div>
            </div>
          `).join('')
        : '<div class="past-reflection-item">No past reflections yet.</div>';

      if (reflections.length > 5) {
        const showAllButton = document.createElement('button');
        showAllButton.className = 'show-all-button';
        showAllButton.textContent = 'Show All Reflections';
        showAllButton.addEventListener('click', () => {
          pastReflectionsList.innerHTML = reflections.reverse().map((reflection, index) => `
            <div class="past-reflection-item" data-index="${index}">
              <div class="past-reflection-content">
                <div class="reflection-text">${reflection.text}</div>
                <div class="reflection-actions-group">
                  <button class="reflection-action-button edit" aria-label="Edit reflection">
                    ✏️
                  </button>
                  <button class="reflection-action-button delete" aria-label="Delete reflection">
                    🗑️
                  </button>
                </div>
              </div>
              <div class="reflection-date">${new Date(reflection.date).toLocaleDateString()}</div>
              <div class="reflection-edit-form" style="display: none;">
                <textarea class="reflection-edit-input">${reflection.text}</textarea>
                <div class="reflection-edit-buttons">
                  <button class="reflection-edit-save">Save</button>
                  <button class="reflection-edit-cancel">Cancel</button>
                </div>
              </div>
            </div>
          `).join('');
          addReflectionEventListeners();
        });
        pastReflectionsList.appendChild(showAllButton);
      }

      addReflectionEventListeners();
    } catch (error) {
      console.error('Error loading past reflections:', error);
      pastReflectionsList.innerHTML = '<div class="past-reflection-item">Error loading reflections.</div>';
    }
  }

  // Add event listeners for edit and delete buttons
  function addReflectionEventListeners() {
    const reflectionItems = pastReflectionsList.querySelectorAll('.past-reflection-item');
    
    reflectionItems.forEach(item => {
      const index = parseInt(item.dataset.index);
      const editButton = item.querySelector('.edit');
      const deleteButton = item.querySelector('.delete');
      const editForm = item.querySelector('.reflection-edit-form');
      const editInput = item.querySelector('.reflection-edit-input');
      const saveButton = item.querySelector('.reflection-edit-save');
      const cancelButton = item.querySelector('.reflection-edit-cancel');
      const contentDiv = item.querySelector('.past-reflection-content');

      if (editButton) {
        editButton.addEventListener('click', () => {
          // Hide all other edit forms first
          document.querySelectorAll('.reflection-edit-form').forEach(form => {
            if (form !== editForm) {
              form.style.display = 'none';
              form.closest('.past-reflection-item').querySelector('.past-reflection-content').style.display = 'flex';
            }
          });

          // Show this edit form
          contentDiv.style.display = 'none';
          editForm.style.display = 'block';
          editInput.focus();
          
          // Adjust textarea height to content
          editInput.style.height = 'auto';
          editInput.style.height = editInput.scrollHeight + 'px';
        });
      }

      if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
          showCustomAlert('Are you sure you want to delete this reflection?', async () => {
            try {
              const result = await chrome.storage.local.get(['reflections']);
              const reflections = result.reflections || [];
              reflections.splice(reflections.length - 1 - index, 1);
              await chrome.storage.local.set({ reflections });
              
              // Show feedback
              const feedback = document.createElement('div');
              feedback.textContent = 'Reflection deleted';
              feedback.className = 'reflection-save-feedback visible';
              item.appendChild(feedback);
              
              // Remove the item with animation
              item.style.opacity = '0';
              item.style.transform = 'translateX(20px)';
              setTimeout(() => {
                loadPastReflections();
              }, 300);
            } catch (error) {
              console.error('Error deleting reflection:', error);
              showCustomAlert('Failed to delete reflection. Please try again.');
            }
          });
        });
      }

      if (saveButton) {
        saveButton.addEventListener('click', async () => {
          const newText = editInput.value.trim();
          if (newText) {
            try {
              const result = await chrome.storage.local.get(['reflections']);
              const reflections = result.reflections || [];
              reflections[reflections.length - 1 - index].text = newText;
              await chrome.storage.local.set({ reflections });
              
              // Show success feedback
              const feedback = document.createElement('div');
              feedback.textContent = '✓ Saved';
              feedback.className = 'reflection-save-feedback visible';
              editForm.appendChild(feedback);
              
              // Hide feedback after animation
              setTimeout(() => {
                contentDiv.style.display = 'flex';
                editForm.style.display = 'none';
                feedback.remove();
                loadPastReflections();
              }, 1000);
            } catch (error) {
              console.error('Error saving edited reflection:', error);
              showCustomAlert('Failed to save changes. Please try again.');
            }
          }
        });

        // Auto-resize textarea on input
        editInput.addEventListener('input', () => {
          editInput.style.height = 'auto';
          editInput.style.height = editInput.scrollHeight + 'px';
        });
      }

      if (cancelButton) {
        cancelButton.addEventListener('click', () => {
          contentDiv.style.display = 'flex';
          editForm.style.display = 'none';
          // Reset the input value to original
          editInput.value = item.querySelector('.reflection-text').textContent.trim();
        });
      }
    });
  }

  // Save reflection and show feedback
  async function saveReflection(text) {
    try {
      const result = await chrome.storage.local.get(['reflections']);
      const reflections = result.reflections || [];
      
      reflections.push({
        text: text,
        date: new Date().toISOString()
      });

      // Keep only last 50 reflections
      if (reflections.length > 50) {
        reflections.shift();
      }

      await chrome.storage.local.set({ reflections });
      
      // Show save feedback with animation
      reflectionInput.classList.add('reflection-save-success');
      reflectionFeedback.classList.add('visible');
      
      setTimeout(() => {
        reflectionFeedback.classList.remove('visible');
        reflectionInput.classList.remove('reflection-save-success');
      }, 2000);

      // If past reflections panel is open, refresh it
      if (pastReflectionsPanel.classList.contains('expanded')) {
        loadPastReflections();
      }

      // Show a new progress message and update stats
      const stats = await Stats.initializeStats();
      const message = Stats.getRandomMessage(stats);
      Stats.showProgressMessage(message);
      await updateStats();

      // Reset the input after successful save
      setTimeout(() => {
        reflectionInput.value = '';
      }, 2500);
    } catch (error) {
      console.error('Error saving reflection:', error);
    }
  }

  // Handle reflection input
  reflectionInput.addEventListener('input', () => {
    const text = reflectionInput.value.trim();
    bypassButton.disabled = text === '';
    if (text && !bypassButton.classList.contains('enabled')) {
      bypassButton.classList.add('enabled');
      setTimeout(() => bypassButton.classList.remove('enabled'), 1000);
    }
  });

  // Handle bypass button click
  bypassButton.addEventListener('click', async () => {
    const text = reflectionInput.value.trim();
    if (text) {
      await saveReflection(text);
      try {
        // Get the stored YouTube URL and stats
        const result = await chrome.storage.local.get(['lastYoutubeUrl', 'stats']);
        const stats = result.stats || {
          streakDays: 1,
          savedMinutes: 15,
          lastActive: new Date().toDateString()
        };

        stats.streakDays = 0;

        // Set temporary access and update stats
        await chrome.storage.local.set({
          stats,
          tempYoutubeAccess: true
        });

        // Redirect to the stored YouTube URL
        if (result.lastYoutubeUrl) {
          window.location.href = result.lastYoutubeUrl;
        }
      } catch (error) {
        console.error('Error in bypass button handler:', error);
      }
    }
  });

  // Handle pause button
  if (pauseButton) {
    pauseButton.addEventListener('click', async () => {
      try {
        const pauseUntil = Date.now() + (10 * 60 * 1000); // 10 minutes
        await chrome.storage.local.set({
          pauseUntil,
          tempYoutubeAccess: true
        });
        
        // Get and redirect to the stored YouTube URL
        const result = await chrome.storage.local.get(['lastYoutubeUrl']);
        if (result.lastYoutubeUrl) {
          window.location.href = result.lastYoutubeUrl;
        }
      } catch (error) {
        console.error('Error handling pause:', error);
      }
    });
  }

  // Add keyboard support for closing reflection container
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && reflectionContainer.classList.contains('visible')) {
      reflectionContainer.classList.remove('visible');
    }
  });

  // Update stats periodically
  setInterval(updateStats, 60000); // Update every minute

  // Add custom alert function at the top level
  function showCustomAlert(message, onConfirm, onCancel) {
    // Create alert elements if they don't exist
    let alertOverlay = document.querySelector('.alert-overlay');
    let customAlert = document.querySelector('.custom-alert');
    
    if (!alertOverlay) {
      alertOverlay = document.createElement('div');
      alertOverlay.className = 'alert-overlay';
      document.body.appendChild(alertOverlay);
    }
    
    if (!customAlert) {
      customAlert = document.createElement('div');
      customAlert.className = 'custom-alert';
      customAlert.innerHTML = `
        <div class="alert-content">
          <div class="alert-message"></div>
          <div class="alert-buttons">
            <button class="alert-button confirm">Yes, delete</button>
            <button class="alert-button cancel">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(customAlert);
    }

    // Update message
    customAlert.querySelector('.alert-message').textContent = message;

    // Show alert
    alertOverlay.classList.add('visible');
    customAlert.classList.add('visible');

    // Handle buttons
    const confirmBtn = customAlert.querySelector('.alert-button.confirm');
    const cancelBtn = customAlert.querySelector('.alert-button.cancel');

    const cleanup = () => {
      alertOverlay.classList.remove('visible');
      customAlert.classList.remove('visible');
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      document.removeEventListener('keydown', handleKeydown);
    };

    const handleConfirm = () => {
      cleanup();
      if (onConfirm) onConfirm();
    };

    const handleCancel = () => {
      cleanup();
      if (onCancel) onCancel();
    };

    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter') {
        handleConfirm();
      }
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    document.addEventListener('keydown', handleKeydown);
  }
}); 