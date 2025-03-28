// Utility: Get theme color or fallback
function getThemeColor(varName, fallback = '#fff') {
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue(varName)?.trim() || fallback;
  }
  
  // Utility: Hide/show the chart container
  function hideChartContainer() {
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) chartContainer.style.display = 'none';
  }
  function showChartContainer() {
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) chartContainer.style.display = 'block';
  }
  
  // Track current mode ("daily" or "monthly")
  let currentMode = 'daily';
  
  // Main function: Draw the chart based on the current mode
  function drawTimeChart() {
    const canvas = document.getElementById('timeChart');
    if (!canvas) {
      console.error('Canvas element for time chart not found.');
      return;
    }
  
    // Clear canvas each time
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Check the current theme color from your CSS variables
    const textColor = getThemeColor('--text-primary', '#fff');
  
    // Dimensions
    const leftPadding = 60;
    const rightPadding = 40;
    const topPadding = 60;
    const bottomPadding = 50;
  
    // Title
    const titleText = (currentMode === 'daily')
      ? "Your Last 10 YouTube Sessions (minutes)"
      : "Daily Total Time on YouTube (Last 30 Days)";
    ctx.font = "18px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.fillText(titleText, canvas.width / 2, 30);
  
    // Choose which chart to draw
    if (currentMode === 'daily') {
      drawDailyChart(ctx, canvas, leftPadding, rightPadding, topPadding, bottomPadding, textColor);
    } else {
      drawMonthlyChart(ctx, canvas, leftPadding, rightPadding, topPadding, bottomPadding, textColor);
    }
  }
  
  /**
   * DAILY CHART
   * Uses the last 10 session times from timeStats.sessionTimes
   * If no data, hides the chart container.
   */
  function drawDailyChart(ctx, canvas, leftPadding, rightPadding, topPadding, bottomPadding, textColor) {
    chrome.storage.local.get(['timeStats'], (result) => {
      const timeStats = result.timeStats || {};
      const sessions = timeStats.sessionTimes || [];
  
      // If no data, hide the container and return
      if (!sessions.length) {
        hideChartContainer();
        return;
      }
      // Otherwise, show the container (in case it was hidden before)
      showChartContainer();
  
      // Only the last 10 sessions
      const data = sessions.slice(-10);
      const maxTime = Math.max(...data, 1);
  
      const chartWidth = canvas.width - leftPadding - rightPadding;
      const chartHeight = canvas.height - topPadding - bottomPadding;
      const barWidth = (chartWidth / data.length) * 0.6;
      const gap = (chartWidth / data.length) * 0.4;
  
      // Draw axes
      ctx.beginPath();
      ctx.moveTo(leftPadding, topPadding);
      ctx.lineTo(leftPadding, topPadding + chartHeight);
      ctx.moveTo(leftPadding, topPadding + chartHeight);
      ctx.lineTo(leftPadding + chartWidth, topPadding + chartHeight);
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 2;
      ctx.stroke();
  
      // Y-axis label
      ctx.save();
      ctx.translate(20, topPadding + chartHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.font = "14px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.fillText("Minutes", 0, 0);
      ctx.restore();
  
      // X-axis label
      ctx.font = "14px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.fillText("Session #", leftPadding + chartWidth / 2, topPadding + chartHeight + 40);
  
      // Horizontal grid lines & labels
      ctx.font = "12px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = textColor;
      const intervals = 5;
      for (let i = 0; i <= intervals; i++) {
        const y = topPadding + chartHeight - (chartHeight / intervals * i);
        const value = Math.round(maxTime / intervals * i);
        ctx.fillText(value, leftPadding - 10, y + 4);
  
        ctx.beginPath();
        ctx.moveTo(leftPadding, y);
        ctx.lineTo(leftPadding + chartWidth, y);
        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
  
      // Bars
      data.forEach((val, index) => {
        const barHeight = (val / maxTime) * chartHeight;
        const x = leftPadding + index * (barWidth + gap) + gap / 2;
        const y = topPadding + chartHeight - barHeight;
  
        // Bar color
        ctx.fillStyle = "#4285F4";
        ctx.fillRect(x, y, barWidth, barHeight);
  
        // Bar text
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.font = "12px 'Segoe UI', Arial, sans-serif";
  
        // Session # below
        ctx.fillText(index + 1, x + barWidth / 2, topPadding + chartHeight + 15);
        // Value above
        ctx.fillText(val, x + barWidth / 2, y - 5);
      });
    });
  }
  
  /**
   * MONTHLY CHART
   * Uses dailyHistory array (last 30 days).
   * If no data, hides the chart container.
   * Rotates labels -45° and skips every other label to reduce clutter.
   */
  function drawMonthlyChart(ctx, canvas, leftPadding, rightPadding, topPadding, bottomPadding, textColor) {
    chrome.storage.local.get(['dailyHistory'], (result) => {
      const dailyHistory = result.dailyHistory || [];
  
      // If no data, hide the container and return
      if (!dailyHistory.length) {
        hideChartContainer();
        return;
      }
      // Otherwise, show container
      showChartContainer();
  
      // Map the last 30 entries
      const data = dailyHistory.slice(-30).map(entry => entry.time);
      const labels = dailyHistory.slice(-30).map(entry => entry.date);
      const maxTime = Math.max(...data, 1);
  
      const chartWidth = canvas.width - leftPadding - rightPadding;
      const chartHeight = canvas.height - topPadding - bottomPadding;
      const barWidth = (chartWidth / data.length) * 0.6;
      const gap = (chartWidth / data.length) * 0.4;
  
      // Axes
      ctx.beginPath();
      ctx.moveTo(leftPadding, topPadding);
      ctx.lineTo(leftPadding, topPadding + chartHeight);
      ctx.moveTo(leftPadding, topPadding + chartHeight);
      ctx.lineTo(leftPadding + chartWidth, topPadding + chartHeight);
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 2;
      ctx.stroke();
  
      // Y-axis label
      ctx.save();
      ctx.translate(20, topPadding + chartHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.font = "14px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.fillText("Minutes", 0, 0);
      ctx.restore();
  
      // X-axis label
      ctx.font = "14px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.fillText("Day", leftPadding + chartWidth / 2, topPadding + chartHeight + 40);
  
      // Horizontal grid lines & labels
      ctx.font = "12px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = textColor;
      const intervals = 5;
      for (let i = 0; i <= intervals; i++) {
        const y = topPadding + chartHeight - (chartHeight / intervals * i);
        const value = Math.round(maxTime / intervals * i);
        ctx.fillText(value, leftPadding - 10, y + 4);
  
        ctx.beginPath();
        ctx.moveTo(leftPadding, y);
        ctx.lineTo(leftPadding + chartWidth, y);
        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
  
      // Bars
      data.forEach((val, index) => {
        const barHeight = (val / maxTime) * chartHeight;
        const x = leftPadding + index * (barWidth + gap) + gap / 2;
        const y = topPadding + chartHeight - barHeight;
  
        // Bar color
        ctx.fillStyle = "#4285F4";
        ctx.fillRect(x, y, barWidth, barHeight);
  
        // Value above bar
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.font = "10px 'Segoe UI', Arial, sans-serif";
        ctx.fillText(val, x + barWidth / 2, y - 5);
  
        // Skip every other day label
        if (index % 2 === 0) {
          // Rotate each label
          ctx.save();
          ctx.translate(x + barWidth / 2, topPadding + chartHeight + 15);
          ctx.rotate(-Math.PI / 4);
          ctx.font = "10px 'Segoe UI', Arial, sans-serif";
          ctx.fillStyle = textColor;
          ctx.textAlign = "right";
          ctx.fillText(labels[index], 0, 0);
          ctx.restore();
        }
      });
    });
  }
  
  // Toggle mode and redraw
  function toggleChartMode() {
    currentMode = (currentMode === 'daily') ? 'monthly' : 'daily';
    drawTimeChart();
    const toggleBtn = document.getElementById('chartModeToggle');
    if (toggleBtn) {
      toggleBtn.textContent = (currentMode === 'daily')
        ? "Switch to Monthly View →"
        : "← Switch to Daily View";
    }
  }
  
  // Create or update the toggle button
  function createChartToggleButton() {
    let toggleBtn = document.getElementById('chartModeToggle');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'chartModeToggle';
      toggleBtn.style.margin = "10px auto";
      toggleBtn.style.display = "block";
      toggleBtn.style.padding = "8px 12px";
      toggleBtn.style.border = "none";
      toggleBtn.style.borderRadius = "6px";
      toggleBtn.style.background = "var(--accent-blue)";
      toggleBtn.style.color = "white";
      toggleBtn.style.cursor = "pointer";
      toggleBtn.style.fontSize = "14px";
      toggleBtn.addEventListener('click', toggleChartMode);
      const chartContainer = document.querySelector('.chart-container');
      if (chartContainer) {
        chartContainer.appendChild(toggleBtn);
      }
    }
    toggleBtn.textContent = (currentMode === 'daily')
      ? "Switch to Monthly View →"
      : "← Switch to Daily View";
  }
  
  // Listen for theme changes so the chart updates dynamically
  const themeObserver = new MutationObserver(() => {
    drawTimeChart();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  
  // Initialize everything
  document.addEventListener('DOMContentLoaded', () => {
    createChartToggleButton();
    drawTimeChart();
  });