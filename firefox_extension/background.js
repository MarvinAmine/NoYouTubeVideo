if (typeof browser === 'undefined') {
    var browser = chrome;
  }
  
  // Time tracking state
  let youtubeTabsStartTime = new Map();
  let originalYoutubeUrls = new Map(); // Store original URLs
  
  // Check if the URL is YouTube but not YouTube Music
  function isBlockedYouTubeUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'www.youtube.com' &&
             !urlObj.pathname.startsWith('/music') &&
             !urlObj.pathname.startsWith('/music/');
    } catch (e) {
      return false;
    }
  }
  
  // Extract essential parts of YouTube URL (pathname and video ID)
  function getYouTubeUrlIdentifier(url) {
    try {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get('v');
      return videoId ? `/watch?v=${videoId}` : urlObj.pathname;
    } catch (e) {
      return url;
    }
  }
  
  // Update time tracking when leaving YouTube
  async function updateTimeSpent(tabId) {
    if (!youtubeTabsStartTime.has(tabId)) return;
    
    const startTime = youtubeTabsStartTime.get(tabId);
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / (1000 * 60)); // Convert to minutes
    
    if (duration <= 0) return;
    
    const timeStats = await initializeStats();
    timeStats.timeLostToday += duration;
    timeStats.sessionTimes.push(duration);
    
    await browser.storage.local.set({ timeStats });
    youtubeTabsStartTime.delete(tabId);
  }
  
  // Check if blocking is paused
  async function isBlockingPaused() {
    try {
      const result = await browser.storage.local.get(['pauseUntil']);
      if (!result.pauseUntil) return false;
      
      const isPaused = Date.now() < result.pauseUntil;
      // Clear pause state if it's expired
      if (!isPaused) {
        await browser.storage.local.remove(['pauseUntil']);
      }
      
      return isPaused;
    } catch (error) {
      console.error('Error checking pause state:', error);
      return false;
    }
  }
  
  // Handle tab updates
  async function handleTabUpdate(tabId, changeInfo, tab) {
    // Track time when navigating to/from YouTube
    if (changeInfo.url) {
      const isYouTube = isBlockedYouTubeUrl(changeInfo.url);
      const wasYouTube = youtubeTabsStartTime.has(tabId);
  
      if (isYouTube && !wasYouTube) {
        // Started watching YouTube
        youtubeTabsStartTime.set(tabId, Date.now());
      } else if (wasYouTube && !isYouTube) {
        // Left YouTube
        await updateTimeSpent(tabId);
      }
    }
  
    if (changeInfo.url && isBlockedYouTubeUrl(changeInfo.url)) {
      // Check if blocking is paused
      const paused = await isBlockingPaused();
      if (paused) return;
  
      try {
        // Get all necessary data in one call
        const result = await browser.storage.local.get([
          'redirectUrl',
          'tempYoutubeAccess',
          'lastYoutubeUrl'
        ]);
        
        // Store the current URL for potential bypass
        await browser.storage.local.set({ lastYoutubeUrl: changeInfo.url });
  
        // If user chose to visit YouTube, allow it
        const currentUrlId = getYouTubeUrlIdentifier(changeInfo.url);
        const storedUrlId = result.lastYoutubeUrl
          ? getYouTubeUrlIdentifier(result.lastYoutubeUrl)
          : null;
        if (result.tempYoutubeAccess && storedUrlId === currentUrlId) {
          return; // Allow access to YouTube
        }
  
        // If there's a redirect URL set and no temporary access, use it
        if (result.redirectUrl && result.redirectUrl.trim() && !result.tempYoutubeAccess) {
          await browser.tabs.update(tabId, { url: result.redirectUrl });
          return;
        }
  
        // If no redirect URL or temporary access, show the intermediate page
        const redirectUrl = browser.runtime.getURL('redirect.html');
        await browser.tabs.update(tabId, { url: redirectUrl });
      } catch (error) {
        console.error('Error in handleTabUpdate:', error);
      }
    }
  }
  
  // Handle tab removal
  async function handleTabRemoved(tabId) {
    if (youtubeTabsStartTime.has(tabId)) {
      await updateTimeSpent(tabId);
      originalYoutubeUrls.delete(tabId); // Clean up stored URL
    }
  }
  
  // Reset daily stats at midnight
  async function resetDailyStats() {
    try {
      const result = await browser.storage.local.get(['timeStats']);
      const stats = result.timeStats || {};
      const today = new Date().toDateString();
  
      if (stats.lastReset !== today) {
        stats.timeLostToday = 0;
        stats.lastReset = today;
        await browser.storage.local.set({ timeStats: stats });
      }
    } catch (error) {
      console.error('Error resetting daily stats:', error);
    }
  }
  
  // Update weekly stats
  async function updateWeeklyStats() {
    try {
      const result = await browser.storage.local.get(['stats']);
      const stats = result.stats || {};
      
      // Initialize weekly tracking if not present
      if (!stats.weeklyMinutes) {
        stats.weeklyMinutes = 0;
      }
      
      // Store last week's minutes at week change
      const today = new Date();
      const lastUpdate = stats.lastWeeklyUpdate ? new Date(stats.lastWeeklyUpdate) : null;
      
      if (!lastUpdate || today.getDay() < lastUpdate.getDay()) {
        stats.lastWeekMinutes = stats.weeklyMinutes;
        stats.weeklyMinutes = 0;
      }
      
      stats.lastWeeklyUpdate = today.toISOString();
      await browser.storage.local.set({ stats });
    } catch (error) {
      console.error('Error updating weekly stats:', error);
    }
  }
  
  async function initializeStats() {
    const result = await browser.storage.local.get(['timeStats']);
    let timeStats = result.timeStats || {};
    
    // Initialize timeStats if undefined
    if (!timeStats.timeLostToday) timeStats.timeLostToday = 0;
    if (!timeStats.sessionTimes) timeStats.sessionTimes = [];
    if (!timeStats.lastReset) timeStats.lastReset = new Date().toDateString();
    
    // Reset stats if day has changed
    const today = new Date().toDateString();
    if (timeStats.lastReset !== today) {
      timeStats.timeLostToday = 0;
      timeStats.lastReset = today;
    }
    
    await browser.storage.local.set({ timeStats });
    return timeStats;
  }
  
  // Call initializeStats when extension loads
  browser.runtime.onInstalled.addListener(initializeStats);
  browser.runtime.onStartup.addListener(initializeStats);
  
  // Initialize extension
  async function init() {
    // Listen for tab updates
    browser.tabs.onUpdated.addListener(handleTabUpdate);
    
    // Listen for tab removal
    browser.tabs.onRemoved.addListener(handleTabRemoved);
    
    // Update weekly stats daily
    setInterval(updateWeeklyStats, 24 * 60 * 60 * 1000);
    updateWeeklyStats(); // Initial update
  
    // Reset daily stats at midnight (check every hour)
    setInterval(resetDailyStats, 60 * 60 * 1000);
    resetDailyStats(); // Initial check
  
    // Initialize stats
    await initializeStats();
  
    // Reset temporary access on startup
    await browser.storage.local.set({ tempYoutubeAccess: false });
  }
  
  // Start the extension
  init();
  