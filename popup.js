// Custom alert function
function showCustomAlert(message, onConfirm, onCancel) {
  // Create alert elements if they don't exist
  let alertOverlay = document.querySelector('.alert-overlay');
  let customAlert = document.querySelector('.custom-alert');
  
  if (!alertOverlay) {
    alertOverlay = document.createElement('div');
    alertOverlay.className = 'alert-overlay';
    alertOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(3px);
      z-index: 2100;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(alertOverlay);
  }
  
  if (!customAlert) {
    customAlert = document.createElement('div');
    customAlert.className = 'custom-alert';
    customAlert.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.95);
      background: var(--primary-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 25px;
      width: 90%;
      max-width: 400px;
      z-index: 2101;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    `;
    customAlert.innerHTML = `
      <div class="alert-content" style="text-align: center; color: var(--text-primary);">
        <div class="alert-message" style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;"></div>
        <div class="alert-buttons" style="display: flex; gap: 10px; justify-content: center;">
          <button class="alert-button confirm" style="
            padding: 8px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: var(--accent-blue);
            color: white;
          ">Yes, proceed</button>
          <button class="alert-button cancel" style="
            padding: 8px 20px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: var(--card-bg);
            color: var(--text-secondary);
          ">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(customAlert);
  }

  // Update message
  customAlert.querySelector('.alert-message').textContent = message;

  // Show alert
  alertOverlay.style.visibility = 'visible';
  alertOverlay.style.opacity = '1';
  customAlert.style.visibility = 'visible';
  customAlert.style.opacity = '1';
  customAlert.style.transform = 'translate(-50%, -50%) scale(1)';

  // Handle buttons
  const confirmBtn = customAlert.querySelector('.alert-button.confirm');
  const cancelBtn = customAlert.querySelector('.alert-button.cancel');

  const cleanup = () => {
    alertOverlay.style.visibility = 'hidden';
    alertOverlay.style.opacity = '0';
    customAlert.style.visibility = 'hidden';
    customAlert.style.opacity = '0';
    customAlert.style.transform = 'translate(-50%, -50%) scale(0.95)';
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

  // Handle click outside
  alertOverlay.addEventListener('click', (e) => {
    if (e.target === alertOverlay) {
      handleCancel();
    }
  });
}

// Activity tracking and sorting
async function getPreferredActivity() {
    try {
        const result = await chrome.storage.local.get(['activityStats']);
        return result.activityStats || {};
    } catch (error) {
        console.error('Error getting activity stats:', error);
        return {};
    }
}

async function updateActivityStats(activity) {
    try {
        const stats = await getPreferredActivity();
        stats[activity] = (stats[activity] || 0) + 1;
        await chrome.storage.local.set({ activityStats: stats });
    } catch (error) {
        console.error('Error updating activity stats:', error);
    }
}

function sortActivitiesByPreference(activities, stats) {
    return Object.entries(activities).sort((a, b) => {
        const aCount = stats[a[0]] || 0;
        const bCount = stats[b[0]] || 0;
        return bCount - aCount;
    });
}

// Function to check if tab exists and switch to it
async function switchToExistingTabOrCreate(url) {
    try {
        // Query for all tabs
        const tabs = await chrome.tabs.query({});

        // Find a tab that matches the URL (including partial matches)
        const existingTab = tabs.find(tab => {
            try {
                const tabUrl = new URL(tab.url);
                const targetUrl = new URL(url);
                return tabUrl.hostname === targetUrl.hostname;
            } catch {
                return false;
            }
        });

        if (existingTab) {
            // Switch to existing tab and window
            await chrome.tabs.update(existingTab.id, { active: true });
            await chrome.windows.update(existingTab.windowId, { focused: true });
            return true;
        } else {
            // Create new tab
            await chrome.tabs.create({ url });
            return true;
        }
    } catch (error) {
        console.error('Error handling tab:', error);
        // Fallback to creating new tab
        await chrome.tabs.create({ url });
        return true;
    }
}

// Initialize progress banner
async function initializeProgressBanner() {
    const progressBanner = document.getElementById('progressBanner');

    if (!progressBanner) {
        console.error('Progress banner element (#progressBanner) not found in the document');
        return;
    }

    try {
        // Get all stats
        const result = await chrome.storage.local.get(['stats', 'timeStats']);
        const stats = {
            ...result.stats || {
                streakDays: 1,
                savedMinutes: 15,
                lastActive: new Date().toDateString()
            },
            timeStats: result.timeStats || {
                timeLostToday: 0,
                sessionTimes: [],
                lastReset: new Date().toDateString()
            }
        };

        // Update stats if it's a new day
        const today = new Date().toDateString();
        if (stats.lastActive !== today) {
            stats.savedMinutes = 0;
            stats.lastActive = today;
            await chrome.storage.local.set({ stats });
        }

        // Display random message
        const message = getRandomMessage(stats);
        progressBanner.textContent = message;
    } catch (error) {
        console.error('Error initializing progress:', error);
        progressBanner.textContent = "🌱 Every moment is a chance to grow. What will you choose?";
    }
}

// Default activity choices that can always be restored
const DEFAULT_ACTIVITY_CHOICES = {
  "Fun & Recharge": [
    {
      "icon": "📝",
      "title": "Play Wordle",
      "subtitle": "Test your vocabulary with the classic Wordle game",
      "url": "https://www.nytimes.com/games/wordle/index.html"
    },
    {
      "icon": "🌍",
      "title": "Play GeoGuessr",
      "subtitle": "Explore the world and challenge your geography skills",
      "url": "https://www.geoguessr.com/"
    },
    {
      "icon": "🎨",
      "title": "Play Scribbl.io",
      "subtitle": "Enjoy free online drawing and guessing games",
      "url": "https://skribbl.io/"
    },
    {
      "icon": "🤝",
      "title": "Join Focusmate",
      "subtitle": "Experience virtual coworking sessions for a productivity boost",
      "url": "https://www.focusmate.com/"
    },
    {
      "icon": "🔎",
      "title": "Discover Near Me",
      "subtitle": "Search for fun activities and events in your area",
      "url": "https://www.google.com/search?q=fun+activities+near+me"
    },
    {
      "icon": "💼",
      "title": "Quick Business Builder",
      "subtitle": "Launch a simple business online in just a few clicks",
      "url": "https://carrd.co/"
    }
  ],
  "Learn Something New": [
    {
      "icon": "��",
      "title": "Learn on Khan Academy",
      "subtitle": "Free world-class education in math, science, and more",
      "url": "https://www.khanacademy.org/"
    },
    {
      "icon": "📚",
      "title": "Read a short article",
      "subtitle": "Discover insightful productivity content on Medium",
      "url": "https://medium.com/topic/productivity"
    },
    {
      "icon": "🎧",
      "title": "Listen to a podcast",
      "subtitle": "Explore NPR's featured podcasts for fresh ideas",
      "url": "https://www.npr.org/podcasts/"
    },
    {
      "icon": "📚",
      "title": "Watch a TED Talk",
      "subtitle": "Get inspired by thought-provoking talks",
      "url": "https://www.ted.com/talks"
    }
  ],
  "Move Your Body": [
    {
      "icon": "🏃",
      "title": "Quick 5-min desk stretch",
      "subtitle": "Follow this energizing routine from Men's Health",
      "url": "https://www.menshealth.com/fitness/a19542273/desk-stretches/"
    },
    {
      "icon": "🧘",
      "title": "3-minute breathing exercise",
      "subtitle": "Try this free guided exercise from Verywell Mind",
      "url": "https://www.verywellmind.com/breathing-exercises-for-relaxation-3144512"
    }
  ],
  "Relax & Meditate": [
    {
      "icon": "🎶",
      "title": "Lo-fi Hip Hop Radio",
      "subtitle": "Chill out with a popular YouTube Music stream",
      "url": "https://music.youtube.com/watch?v=DWcJFNfaw9c"
    },
    {
      "icon": "🌿",
      "title": "2-minute Guided Meditation",
      "subtitle": "Try this quick mindfulness exercise from Calm",
      "url": "https://www.calm.com/breathe"
    }
  ],
  "Reflect & Journal": [
    {
      "icon": "📝",
      "title": "Quick Journaling",
      "subtitle": "Write your thoughts in a private online journal",
      "url": "https://penzu.com/"
    },
    {
      "icon": "🎯",
      "title": "Set a Quick Goal",
      "subtitle": "Write down one small goal for today",
      "url": "https://todoist.com/"
    }
  ]
};

// Get current activity choices (including custom ones)
async function getActivityChoices() {
  try {
    const result = await chrome.storage.local.get(['customActivityChoices']);
    return result.customActivityChoices || DEFAULT_ACTIVITY_CHOICES;
  } catch (error) {
    console.error('Error getting activity choices:', error);
    return DEFAULT_ACTIVITY_CHOICES;
  }
}

// Save custom activity choices
async function saveActivityChoices(choices) {
  try {
    await chrome.storage.local.set({ customActivityChoices: choices });
  } catch (error) {
    console.error('Error saving activity choices:', error);
  }
}

// Restore default activities for a specific category
async function restoreDefaultsForCategory(category) {
  try {
    const choices = await getActivityChoices();
    choices[category] = DEFAULT_ACTIVITY_CHOICES[category];
    await saveActivityChoices(choices);
    return choices;
  } catch (error) {
    console.error('Error restoring defaults for category:', error);
    return null;
  }
}

// Add custom activity
async function addCustomActivity(category, activity) {
  try {
    const choices = await getActivityChoices();
    if (!choices[category]) {
      choices[category] = [];
    }
    choices[category].push(activity);
    await saveActivityChoices(choices);
    return choices;
  } catch (error) {
    console.error('Error adding custom activity:', error);
    return null;
  }
}

// Remove activity
async function removeActivity(category, index) {
  try {
    const choices = await getActivityChoices();
    if (choices[category] && choices[category][index]) {
      choices[category].splice(index, 1);
      await saveActivityChoices(choices);
    }
    return choices;
  } catch (error) {
    console.error('Error removing activity:', error);
    return null;
  }
}

// Create activity management UI
function createActivityManagementUI(choiceElement, activity, category, index) {
  const managementDiv = document.createElement('div');
  managementDiv.className = 'choice-management';
  managementDiv.style.marginLeft = 'auto';
  managementDiv.style.display = 'flex';
  managementDiv.style.gap = '10px';
  managementDiv.style.alignItems = 'center';

  // Add edit button
  const editButton = document.createElement('button');
  editButton.innerHTML = '✏️';
  editButton.className = 'management-button';
  editButton.title = 'Edit this activity';
  editButton.style.background = 'none';
  editButton.style.border = 'none';
  editButton.style.cursor = 'pointer';
  editButton.style.fontSize = '16px';
  editButton.style.padding = '4px';
  editButton.style.opacity = '0.7';
  editButton.style.transition = 'opacity 0.2s';

  editButton.addEventListener('mouseenter', () => {
    editButton.style.opacity = '1';
  });

  editButton.addEventListener('mouseleave', () => {
    editButton.style.opacity = '0.7';
  });

  editButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    
    // Create edit form overlay
    const editOverlay = document.createElement('div');
    editOverlay.className = 'edit-overlay';
    editOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(3px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create edit form
    const editForm = document.createElement('div');
    editForm.className = 'edit-activity-form';
    editForm.style.cssText = `
      background: var(--card-bg);
      border-radius: 12px;
      padding: 20px;
      width: 90%;
      max-width: 400px;
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    `;

    const formTitle = document.createElement('h3');
    formTitle.textContent = 'Edit Activity';
    formTitle.style.cssText = `
      margin: 0 0 20px 0;
      color: var(--text-primary);
      font-size: 18px;
    `;
    editForm.appendChild(formTitle);

    const inputs = [
      { id: 'icon', placeholder: 'Icon (emoji)', value: activity.icon },
      { id: 'title', placeholder: 'Title', value: activity.title },
      { id: 'subtitle', placeholder: 'Description', value: activity.subtitle },
      { id: 'url', placeholder: 'URL', value: activity.url }
    ];

    inputs.forEach(input => {
      const inputElement = document.createElement('input');
      inputElement.type = 'text';
      inputElement.id = `edit-activity-${input.id}`;
      inputElement.placeholder = input.placeholder;
      inputElement.value = input.value;
      inputElement.style.cssText = `
        width: 100%;
        margin-bottom: 10px;
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        background: var(--primary-bg);
        color: var(--text-primary);
        box-sizing: border-box;
      `;
      editForm.appendChild(inputElement);
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin-top: 20px;
    `;

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.className = 'modal-close-button';
    saveButton.style.flex = '1';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'modal-close-button';
    cancelButton.style.flex = '1';

    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(cancelButton);
    editForm.appendChild(buttonContainer);

    // Add form to overlay
    editOverlay.appendChild(editForm);
    document.body.appendChild(editOverlay);

    // Handle click outside to close
    editOverlay.addEventListener('click', (e) => {
      if (e.target === editOverlay) {
        editOverlay.remove();
      }
    });

    saveButton.addEventListener('click', async () => {
      const editedActivity = {
        icon: document.getElementById('edit-activity-icon').value || '🔗',
        title: document.getElementById('edit-activity-title').value,
        subtitle: document.getElementById('edit-activity-subtitle').value,
        url: document.getElementById('edit-activity-url').value
      };

      if (editedActivity.title && editedActivity.url) {
        try {
          const choices = await getActivityChoices();
          choices[category][index] = editedActivity;
          await saveActivityChoices(choices);
          editOverlay.remove();
          await showChoices(category);
        } catch (error) {
          console.error('Error saving edited activity:', error);
          showCustomAlert('Failed to save changes. Please try again.');
        }
      } else {
        showCustomAlert('Please fill in at least the title and URL fields.');
      }
    });

    cancelButton.addEventListener('click', () => {
      editOverlay.remove();
    });

    // Add keyboard support
    editOverlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        editOverlay.remove();
      }
    });

    // Focus first input
    document.getElementById('edit-activity-icon').focus();
  });

  const removeButton = document.createElement('button');
  removeButton.innerHTML = '❌';
  removeButton.className = 'management-button';
  removeButton.title = 'Remove this activity';
  removeButton.style.background = 'none';
  removeButton.style.border = 'none';
  removeButton.style.cursor = 'pointer';
  removeButton.style.fontSize = '16px';
  removeButton.style.padding = '4px';
  removeButton.style.opacity = '0.7';
  removeButton.style.transition = 'opacity 0.2s';

  removeButton.addEventListener('mouseenter', () => {
    removeButton.style.opacity = '1';
  });

  removeButton.addEventListener('mouseleave', () => {
    removeButton.style.opacity = '0.7';
  });

  removeButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    showCustomAlert('Are you sure you want to delete this activity?', async () => {
        const choices = await removeActivity(category, index);
        if (choices) {
            await showChoices(category);
        }
    });
  });

  managementDiv.appendChild(editButton);
  managementDiv.appendChild(removeButton);
  choiceElement.appendChild(managementDiv);
}

// Add new activity form
function createAddActivityForm(category) {
  const form = document.createElement('div');
  form.className = 'add-activity-form';
  form.style.background = 'var(--card-bg)';
  form.style.borderRadius = '12px';
  form.style.padding = '20px';
  form.style.marginTop = '20px';

  const inputs = [
    { id: 'icon', placeholder: 'Icon (emoji)', type: 'text' },
    { id: 'title', placeholder: 'Title', type: 'text' },
    { id: 'subtitle', placeholder: 'Description', type: 'text' },
    { id: 'url', placeholder: 'URL', type: 'url' }
  ];

  inputs.forEach(input => {
    const inputElement = document.createElement('input');
    inputElement.type = input.type;
    inputElement.id = `new-activity-${input.id}`;
    inputElement.placeholder = input.placeholder;
    inputElement.style.width = '100%';
    inputElement.style.marginBottom = '10px';
    inputElement.style.padding = '8px 12px';
    inputElement.style.borderRadius = '6px';
    inputElement.style.border = '1px solid var(--border-color)';
    inputElement.style.background = 'var(--card-bg)';
    inputElement.style.color = 'var(--text-primary)';
    inputElement.style.boxSizing = 'border-box';
    form.appendChild(inputElement);
  });

  const addButton = document.createElement('button');
  addButton.textContent = 'Add Activity';
  addButton.className = 'modal-close-button';
  addButton.style.width = '100%';

  addButton.addEventListener('click', async () => {
    const newActivity = {
      icon: document.getElementById('new-activity-icon').value || '🔗',
      title: document.getElementById('new-activity-title').value,
      subtitle: document.getElementById('new-activity-subtitle').value,
      url: document.getElementById('new-activity-url').value
    };

    if (newActivity.title && newActivity.url) {
      await addCustomActivity(category, newActivity);
      await showChoices(category);
      inputs.forEach(input => {
        document.getElementById(`new-activity-${input.id}`).value = '';
      });
    }
  });

  form.appendChild(addButton);
  return form;
}

// Focus trap for modal
function createFocusTrap(modalElement) {
  const focusableElements = modalElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function trapFocus(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  }

  return {
    activate: () => {
      firstFocusable.focus();
      modalElement.addEventListener('keydown', trapFocus);
    },
    deactivate: () => {
      modalElement.removeEventListener('keydown', trapFocus);
    }
  };
}

// Modify the Modal object to include focus trapping
const Modal = {
  overlay: null,
  content: null,
  closeButton: null,
  restoreButton: null,
  isOpen: false,
  focusTrap: null,
  lastFocusedElement: null,

  init() {
    this.overlay = document.querySelector('[role="dialog"]');
    this.content = this.overlay.querySelector('.modal');
    this.closeButton = document.getElementById('modalCloseButton');
    this.restoreButton = document.getElementById('modalRestoreButton');

    if (!this.overlay || !this.content || !this.closeButton || !this.restoreButton) {
      console.error('Modal elements not found');
      return;
    }

    this.focusTrap = createFocusTrap(this.content);
    this.bindEvents();
  },

  bindEvents() {
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    this.closeButton.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    this.content.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  },

  open() {
    if (!this.overlay) return;
    
    this.lastFocusedElement = document.activeElement;
    this.overlay.style.display = 'flex';
    
    requestAnimationFrame(() => {
      this.overlay.classList.add('visible');
      this.isOpen = true;
      this.focusTrap.activate();
    });
  },

  close() {
    if (!this.overlay) return;

    this.overlay.classList.remove('visible');
    this.isOpen = false;
    this.focusTrap.deactivate();
    
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
    }
    
    setTimeout(() => {
      if (!this.isOpen) {
        this.overlay.style.display = 'none';
      }
    }, 300);
  }
};

// Modified showChoices function
async function showChoices(activity) {
  const modalTitle = document.getElementById('modalTitle');
  const choiceList = document.getElementById('choiceList');
  const restoreButton = document.getElementById('modalRestoreButton');

  if (!modalTitle || !choiceList || !restoreButton) {
    console.error('Required modal elements not found');
    return;
  }

  const activityStats = await getPreferredActivity();
  const choices = await getActivityChoices();
  const currentActivityChoices = choices[activity] || [];

  modalTitle.textContent = activity;
  choiceList.innerHTML = '';

  // Add activity choices
  currentActivityChoices.forEach((choice, index) => {
    const choiceElement = document.createElement('div');
    choiceElement.className = 'choice-item fade-in';
    choiceElement.style.animationDelay = `${0.2 + (index * 0.1)}s`;
    choiceElement.tabIndex = 0;
    choiceElement.setAttribute('role', 'listitem');
    choiceElement.setAttribute('aria-label', `${choice.title} - ${choice.subtitle}`);

    choiceElement.innerHTML = `
      <div class="choice-icon" aria-hidden="true">${choice.icon}</div>
      <div class="choice-content">
        <div class="choice-title">${choice.title}</div>
        <div class="choice-subtitle">${choice.subtitle}</div>
      </div>
      <div class="choice-actions">
        <button class="set-redirect-button" title="Set as redirect URL" aria-label="Set as redirect URL">
          ⇄
        </button>
      </div>
    `;

    // Add event listener for the set redirect button
    const setRedirectButton = choiceElement.querySelector('.set-redirect-button');
    setRedirectButton.addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevent triggering the choice click
      try {
        await chrome.storage.local.set({ redirectUrl: choice.url });
        // Update the redirect input if it exists
        const redirectInput = document.getElementById('redirectUrl');
        if (redirectInput) {
          redirectInput.value = choice.url;
        }
        showCustomAlert('Redirect URL set successfully!');
      } catch (error) {
        console.error('Error setting redirect URL:', error);
        showCustomAlert('Failed to set redirect URL. Please try again.');
      }
    });

    createActivityManagementUI(choiceElement, choice, activity, index);

    const handleChoice = async () => {
      try {
        await updateActivityStats(activity);
        const result = await chrome.storage.local.get(['stats']);
        const stats = result.stats || {
          streakDays: 1,
          savedMinutes: 15,
          lastActive: new Date().toDateString()
        };

        stats.savedMinutes += 5;
        await chrome.storage.local.set({ stats });

        await switchToExistingTabOrCreate(choice.url);
      } catch (error) {
        console.error('Error updating stats:', error);
        switchToExistingTabOrCreate(choice.url);
      }
    };

    choiceElement.addEventListener('click', handleChoice);
    choiceElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleChoice();
      }
    });

    choiceList.appendChild(choiceElement);
  });

  // Add the form for new activities
  choiceList.appendChild(createAddActivityForm(activity));

  // Set up restore button with confirmation
  restoreButton.addEventListener('click', async () => {
    showCustomAlert('Are you sure you want to restore default activities? This will remove any custom activities.', async () => {
      await restoreDefaultsForCategory(activity);
      await showChoices(activity);
    });
  });

  // Open the modal
  Modal.open();
}

// Initialize bypass button
async function initializeBypassButton() {
    const button = document.getElementById('bypassButton');
    const countdown = document.getElementById('bypassCountdown');
    const reflectionInput = document.getElementById('reflectionInput');
    const pauseButton = document.getElementById('pauseButton');

    // Get bypass count and calculate delay
    const result = await chrome.storage.local.get(['bypassCount', 'lastBypassDate']);
    let bypassCount = result.bypassCount || 0;
    const lastBypassDate = result.lastBypassDate;

    // Reset bypass count if it's been 3 days
    if (lastBypassDate) {
        const daysSinceLastBypass = (Date.now() - new Date(lastBypassDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastBypass >= 3) {
            bypassCount = 0;
            await chrome.storage.local.set({ bypassCount: 0 });
        }
    }

    // Calculate delay based on bypass count
    let secondsLeft = 3;
    if (bypassCount >= 4 && bypassCount <= 7) {
        secondsLeft = 5;
    } else if (bypassCount >= 8) {
        secondsLeft = 10;
    }

    button.disabled = true;
    reflectionInput.disabled = false;
    button.textContent = `Wait ${secondsLeft} seconds...`;
    countdown.textContent = "Taking a moment to reflect...";

    const timer = setInterval(() => {
        secondsLeft--;

        if (secondsLeft > 0) {
            button.textContent = `Wait ${secondsLeft} seconds...`;
        } else {
            clearInterval(timer);
            button.disabled = reflectionInput.value.trim() === '';
            button.textContent = "I still want to visit YouTube";
            countdown.textContent = "The choice is yours";
        }
    }, 1000);

    // Enable/disable bypass button based on reflection input
    reflectionInput.addEventListener('input', () => {
        if (secondsLeft <= 0) {
            button.disabled = reflectionInput.value.trim() === '';
        }
    });

    // Handle pause button
    pauseButton.addEventListener('click', async () => {
        const pauseUntil = Date.now() + (10 * 60 * 1000); // 10 minutes
        await chrome.storage.local.set({
            pauseUntil,
            tempYoutubeAccess: true
        });
        window.close();
    });

    button.addEventListener('click', async () => {
        try {
            console.log('Bypass button clicked');
            const reflection = reflectionInput.value.trim();
            if (reflection) {
                console.log('Saving reflection:', reflection);
                await chrome.storage.local.set({
                    lastReflection: reflection,
                    bypassCount: bypassCount + 1,
                    lastBypassDate: new Date().toISOString()
                });
            }

            // Get the stored YouTube URL and stats
            console.log('Fetching stored YouTube URL and stats');
            const result = await chrome.storage.local.get(['lastYoutubeUrl', 'stats']);
            console.log('Stored YouTube URL:', result.lastYoutubeUrl);

            const stats = result.stats || {
                streakDays: 1,
                savedMinutes: 15,
                lastActive: new Date().toDateString()
            };

            stats.streakDays = 0;

            // Set temporary access and update stats
            console.log('Setting temporary access');
            await chrome.storage.local.set({
                stats,
                tempYoutubeAccess: true
            });

            // Get current tab (which should be redirect.html)
            console.log('Querying current tab');
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('Current tabs:', tabs);

            if (tabs[0] && result.lastYoutubeUrl) {
                console.log('Updating current tab to:', result.lastYoutubeUrl);
                // Update current tab to YouTube URL
                await chrome.tabs.update(tabs[0].id, {
                    url: result.lastYoutubeUrl,
                    active: true
                });
            } else {
                console.log('No current tab found or no YouTube URL stored');
                // If we can't find the tab or URL, create a new tab
                if (result.lastYoutubeUrl) {
                    console.log('Creating new tab with URL:', result.lastYoutubeUrl);
                    await chrome.tabs.create({ url: result.lastYoutubeUrl });
                }
            }
        } catch (error) {
            console.error('Error in bypass button handler:', error);
            try {
                // If there's an error, try to redirect anyway
                const result = await chrome.storage.local.get(['lastYoutubeUrl']);
                if (result.lastYoutubeUrl) {
                    console.log('Error recovery: Creating new tab with URL:', result.lastYoutubeUrl);
                    await chrome.tabs.create({ url: result.lastYoutubeUrl });
                }
            } catch (fallbackError) {
                console.error('Error in fallback handler:', fallbackError);
            }
        }
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Modal close button
    document.getElementById('modalCloseButton').addEventListener('click', () => Modal.close());

    // Alternative cards
    document.querySelectorAll('.alternative-card').forEach(card => {
        card.tabIndex = 0;

        const handleCardActivation = () => {
            const activity = card.querySelector('.card-title').textContent;
            showChoices(activity);
        };

        card.addEventListener('click', handleCardActivation);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardActivation();
            }
        });
    });
}

// Add onboarding and initial view handling at the top
async function checkFirstVisit() {
  try {
    const result = await chrome.storage.local.get(['hasVisited']);
    return !result.hasVisited;
  } catch (error) {
    console.error('Error checking first visit:', error);
    return false;
  }
}

async function markAsVisited() {
  try {
    await chrome.storage.local.set({ hasVisited: true });
  } catch (error) {
    console.error('Error marking as visited:', error);
  }
}

function showMainContent() {
  document.getElementById('initialView').style.display = 'none';
  const mainContent = document.getElementById('mainContent');
  mainContent.style.display = 'block';
  mainContent.style.opacity = '0';
  requestAnimationFrame(() => {
    mainContent.style.transition = 'opacity 0.5s ease-out';
    mainContent.style.opacity = '1';
  });
}

// Initialize redirect URL input
async function initializeRedirectUrl() {
  const redirectInput = document.getElementById('redirectUrl');
  const saveButton = document.getElementById('saveRedirectUrl');
  const clearButton = document.getElementById('clearRedirectUrl');
  
  if (!redirectInput || !saveButton || !clearButton) return;

  // Load saved URL
  try {
    const result = await chrome.storage.local.get(['redirectUrl']);
    if (result.redirectUrl) {
      redirectInput.value = result.redirectUrl;
    }
  } catch (error) {
    console.error('Error loading redirect URL:', error);
  }

  // Save URL when button is clicked
  saveButton.addEventListener('click', async () => {
    const url = redirectInput.value.trim();
    
    // Basic URL validation
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      showCustomAlert('Please enter a valid URL starting with http:// or https://');
      return;
    }

    try {
      await chrome.storage.local.set({ redirectUrl: url });
      showCustomAlert('Redirect URL saved successfully!');
    } catch (error) {
      console.error('Error saving redirect URL:', error);
      showCustomAlert('Failed to save redirect URL. Please try again.');
    }
  });

  // Clear URL when clear button is clicked
  clearButton.addEventListener('click', async () => {
    showCustomAlert('Are you sure you want to remove the redirect URL?', async () => {
      try {
        await chrome.storage.local.remove(['redirectUrl']);
        redirectInput.value = '';
        showCustomAlert('Redirect URL removed successfully!');
      } catch (error) {
        console.error('Error clearing redirect URL:', error);
        showCustomAlert('Failed to clear redirect URL. Please try again.');
      }
    });
  });

  // Also save when Enter is pressed
  redirectInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      saveButton.click();
    }
  });
}

// Modify the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize the show options button functionality
  const showOptionsBtn = document.getElementById('showOptionsBtn');
  if (showOptionsBtn) {
    showOptionsBtn.addEventListener('click', async () => {
      try {
        // Open redirect.html in a new tab
        await chrome.tabs.create({
          url: chrome.runtime.getURL('redirect.html')
        });
        // Close the popup
        window.close();
      } catch (error) {
        console.error('Error opening redirect page:', error);
      }
    });
  }

  // Initialize other components if we're on redirect.html
  const progressBanner = document.getElementById('progressBanner');
  if (progressBanner) {
    Modal.init();
    await Stats.initializeProgressBanner();
    initializeBypassButton();
    initializeEventListeners();
    
    // Show initial progress message with animation
    const stats = await Stats.initializeStats();
    const progressMessage = Stats.getRandomMessage(stats);
    Stats.showProgressMessage(progressMessage);
  }
  
  // Check if this is the first visit (only for redirect.html)
  const onboardingModal = document.getElementById('onboardingModal');
  if (onboardingModal) {
    const isFirstVisit = await checkFirstVisit();
    if (isFirstVisit) {
      const onboardingNext = document.getElementById('onboardingNext');
      if (onboardingNext) {
        onboardingModal.classList.add('visible');
        onboardingNext.addEventListener('click', async () => {
          onboardingModal.classList.remove('visible');
          await markAsVisited();
        });
      }
    }
  }
  
  // Add hover animations for activity cards (only for redirect.html)
  const alternativeCards = document.querySelectorAll('.alternative-card');
  if (alternativeCards.length > 0) {
    alternativeCards.forEach(card => {
      if (card) {
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-4px)';
          card.style.boxShadow = '0 6px 12px rgba(0,0,0,0.1)';
        });
        
        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
          card.style.boxShadow = '';
        });
      }
    });
  }
  
  // Add hover effect for reflection section (only for redirect.html)
  const reflectionSection = document.querySelector('.reflection-section');
  if (reflectionSection) {
    reflectionSection.addEventListener('mouseenter', () => {
      reflectionSection.style.transform = 'translateY(-2px)';
      reflectionSection.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    });
    
    reflectionSection.addEventListener('mouseleave', () => {
      reflectionSection.style.transform = '';
      reflectionSection.style.boxShadow = '';
    });
  }

  // Handle reflection input and bypass button (only for redirect.html)
  const reflectionInput = document.getElementById('reflectionInput');
  const bypassButton = document.getElementById('bypassButton');
  if (reflectionInput && bypassButton) {
    reflectionInput.addEventListener('input', () => {
      const hasText = reflectionInput.value.trim() !== '';
      bypassButton.disabled = !hasText;
      
      if (hasText && !bypassButton.classList.contains('enabled')) {
        bypassButton.classList.add('enabled');
        setTimeout(() => bypassButton.classList.remove('enabled'), 1000);
      }
    });
  }

  // Add tooltips to activity cards (only for redirect.html)
  if (alternativeCards.length > 0) {
    alternativeCards.forEach(card => {
      const title = card.querySelector('.card-title').textContent;
      const description = card.querySelector('.card-description').textContent;
      
      // Add tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'card-tooltip';
      tooltip.textContent = `Choose ${title.toLowerCase()} activities to ${description.toLowerCase()}`;
      card.appendChild(tooltip);
      
      // Add ARIA label
      card.setAttribute('aria-label', `${title}: ${description}`);
    });
  }

  // Initialize redirect URL input
  initializeRedirectUrl();
}); 