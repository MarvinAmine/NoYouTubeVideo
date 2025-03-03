// File: /stats.js

// Provide a fallback so this works in both Firefox and Chrome
if (typeof browser === 'undefined') {
    var browser = chrome;
  }
  
  // Progress message templates with dynamic calculations
  const progressMessages = [
    {
      template: "You've already spent {timeLostToday} minutes on YouTube today. Do you really want to continue?",
      getValue: stats => stats.timeStats?.timeLostToday || 0,
      condition: stats => (stats.timeStats?.timeLostToday || 0) > 0
    },
    {
      template: "Last session, you spent an average of {averageTime} minutes. Can you reduce it today?",
      getValue: stats => {
        const sessions = stats.timeStats?.sessionTimes || [];
        if (sessions.length === 0) return 0;
        return Math.round(sessions.reduce((a, b) => a + b, 0) / sessions.length);
      },
      condition: stats => (stats.timeStats?.sessionTimes?.length || 0) > 0
    },
    {
      template: "This week, you've saved {minutes} minutes. What did you do with them?",
      getValue: stats => stats.weeklyMinutes || 0,
      condition: stats => stats.weeklyMinutes > 30
    },
    {
      template: "If you replace 30 minutes of YouTube daily, that's {projectedHours} hours a year. What will you build?",
      getValue: stats => Math.round((30 * 365) / 60),
      condition: stats => stats.streakDays > 3
    },
    {
      template: "You've saved {minutes} minutes today! Imagine how much that adds up over time.",
      getValue: stats => stats.savedMinutes || 0,
      condition: stats => stats.savedMinutes > 0
    },
    {
      template: "Last week, you saved {weeklyMinutes} minutes. Can you beat that this week?",
      getValue: stats => stats.lastWeekMinutes || 0,
      condition: stats => stats.lastWeekMinutes > 0
    },
    {
      template: "🌱 Just one small step today. What will you choose?",
      condition: () => true
    }
  ];
  
  // Get random message from templates that matches conditions
  function getRandomMessage(stats) {
    const eligibleMessages = progressMessages.filter(msg => msg.condition(stats));
    const randomTemplate = eligibleMessages[Math.floor(Math.random() * eligibleMessages.length)];
  
    if (!randomTemplate.getValue) {
      return randomTemplate.template;
    }
  
    const value = randomTemplate.getValue(stats);
    return randomTemplate.template.replace(/\{(\w+)\}/g, (_, key) => {
      if (key === 'projectedHours') return Math.round((30 * 365) / 60);
      if (key === 'averageTime') return Math.round(value);
      if (key === 'timeLostToday') return Math.round(value);
      return value;
    });
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
      const result = await browser.storage.local.get(['stats', 'timeStats']);
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
        await browser.storage.local.set({ stats });
      }
  
      // Display random message
      const message = getRandomMessage(stats);
      progressBanner.textContent = message;
      progressBanner.classList.add('visible');
    } catch (error) {
      console.error('Error initializing progress:', error);
      progressBanner.textContent = "🌱 Every moment is a chance to grow. What will you choose?";
      progressBanner.classList.add('visible');
    }
  }
  
  // Show progress message with animation
  function showProgressMessage(message) {
    const progressBanner = document.getElementById('progressBanner');
    if (!progressBanner) return;
  
    progressBanner.classList.remove('visible');
    setTimeout(() => {
      progressBanner.textContent = message;
      progressBanner.classList.add('visible');
    }, 300);
  }
  
  // Initialize stats
  async function initializeStats() {
    try {
      const result = await browser.storage.local.get(['stats', 'timeStats']);
      return {
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
    } catch (error) {
      console.error('Error initializing stats:', error);
      return {
        streakDays: 1,
        savedMinutes: 15,
        lastActive: new Date().toDateString(),
        timeStats: {
          timeLostToday: 0,
          sessionTimes: [],
          lastReset: new Date().toDateString()
        }
      };
    }
  }
  
  // Export functions as a global Stats object
  window.Stats = {
    initializeProgressBanner,
    showProgressMessage,
    getRandomMessage,
    initializeStats
  };
  