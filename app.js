/**
 * app.js - SPA Core Controller for NovaCart E-Commerce Analytics Dashboard
 */

(function () {
  // Global Application State
  const state = {
    currentPage: "overview",
    theme: "dark",
    orders: {
      search: "",
      filterStatus: "All",
      filterCategory: "All",
      currentPage: 1,
      itemsPerPage: 10,
      selectedOrderId: null
    },
    inventory: {
      search: ""
    }
  };

  // Active Chart.js instances registry
  const charts = {};

  // DOM Elements cache
  let elements = {};

  function initElements() {
    elements = {
      themeToggle: document.getElementById("theme-toggle"),
      notificationBtn: document.getElementById("notification-btn"),
      mobileToggleBtn: document.getElementById("mobile-toggle-btn"),
      mobileCloseBtn: document.getElementById("mobile-close-btn"),
      sidebar: document.getElementById("sidebar"),
      headerTitle: document.getElementById("header-title"),
      currentTime: document.getElementById("current-time"),
      contentBody: document.getElementById("content-body"),
      
      // Drawers & Backdrops
      detailsDrawer: document.getElementById("details-drawer"),
      alertsDrawer: document.getElementById("alerts-drawer"),
      drawerBackdrop: document.getElementById("drawer-backdrop"),
      drawerCloseBtn: document.getElementById("drawer-close-btn"),
      alertsCloseBtn: document.getElementById("alerts-close-btn"),
      
      // Orders
      ordersSearch: document.getElementById("orders-search"),
      ordersFilterStatus: document.getElementById("orders-filter-status"),
      ordersFilterCategory: document.getElementById("orders-filter-category"),
      ordersTableBody: document.querySelector("#orders-table tbody"),
      recentOrdersTableBody: document.querySelector("#recent-orders-table tbody"),
      ordersPageStart: document.getElementById("orders-page-start"),
      ordersPageEnd: document.getElementById("orders-page-end"),
      ordersTotalCount: document.getElementById("orders-total-count"),
      ordersBtnFirst: document.getElementById("orders-btn-first"),
      ordersBtnPrev: document.getElementById("orders-btn-prev"),
      ordersBtnNext: document.getElementById("orders-btn-next"),
      ordersBtnLast: document.getElementById("orders-btn-last"),
      
      // Inventory
      inventorySearch: document.getElementById("inventory-search"),
      inventoryTableBody: document.querySelector("#inventory-table tbody"),
      restockSuggestionsList: document.getElementById("restock-suggestions-list"),
      
      // Returns
      returnsQueueTableBody: document.querySelector("#returns-queue-table tbody"),
      
      // Alerts
      alertsBody: document.getElementById("alerts-body"),
      alertDot: document.getElementById("alert-dot"),
      
      // Toast Container
      toastContainer: document.getElementById("toast-container")
    };
  }

  // ==========================================================================
  // Helper Utility Functions
  // ==========================================================================

  function formatMoney(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(amount);
  }

  function getThemeColors() {
    const isLight = document.documentElement.classList.contains("light");
    return {
      text: isLight ? "#71717a" : "#828290",
      grid: isLight ? "#e4e4e7" : "#191922",
      tooltipBg: isLight ? "#ffffff" : "#0d0d12",
      tooltipBorder: isLight ? "#e4e4e7" : "#191922",
      tooltipText: isLight ? "#09090b" : "#fafafa"
    };
  }

  function updateTime() {
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = months[now.getMonth()];
    const d = String(now.getDate()).padStart(2, "0");
    const y = now.getFullYear();
    let hrs = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, "0");
    const ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12;
    hrs = hrs ? hrs : 12; // hour '0' should be '12'
    
    if (elements.currentTime) {
      elements.currentTime.textContent = `${m} ${d}, ${y} ${hrs}:${mins} ${ampm}`;
    }
  }

  // ==========================================================================
  // Toast Notification System
  // ==========================================================================

  function showToast(title, message, type = "info") {
    if (!elements.toastContainer) return;
    
    const toast = document.createElement("div");
    toast.className = `toast border-${type}-glow`;
    
    let iconName = "info";
    let iconClass = "text-blue";
    if (type === "success") { iconName = "check-circle-2"; iconClass = "text-emerald"; }
    else if (type === "warning") { iconName = "alert-triangle"; iconClass = "text-amber"; }
    else if (type === "error") { iconName = "x-circle"; iconClass = "text-rose"; }

    toast.innerHTML = `
      <div class="toast-icon ${iconClass}">
        <i data-lucide="${iconName}"></i>
      </div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        <div class="toast-text">${message}</div>
      </div>
      <button class="toast-close">
        <i data-lucide="x"></i>
      </button>
    `;
    
    elements.toastContainer.appendChild(toast);
    lucide.createIcons();
    
    // Auto remove after 4 seconds
    const timeout = setTimeout(() => {
      removeToast(toast);
    }, 4000);
    
    toast.querySelector(".toast-close").addEventListener("click", () => {
      clearTimeout(timeout);
      removeToast(toast);
    });
  }

  function removeToast(toast) {
    toast.style.transform = "translateX(120%)";
    toast.style.opacity = "0";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // ==========================================================================
  // Navigation & Page Router
  // ==========================================================================

  function setupNavigation() {
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    navItems.forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const page = item.getAttribute("data-page");
        navigateTo(page);
        
        // Mobile auto collapse
        if (window.innerWidth <= 768) {
          elements.sidebar.classList.remove("active");
          elements.drawerBackdrop.classList.remove("active");
        }
      });
    });

    // Mobile Toggle Buttons
    if (elements.mobileToggleBtn) {
      elements.mobileToggleBtn.addEventListener("click", () => {
        elements.sidebar.classList.add("active");
        elements.drawerBackdrop.classList.add("active");
      });
    }

    if (elements.mobileCloseBtn) {
      elements.mobileCloseBtn.addEventListener("click", () => {
        elements.sidebar.classList.remove("active");
        elements.drawerBackdrop.classList.remove("active");
      });
    }
  }

  function navigateTo(pageId) {
    const targetView = document.getElementById(`page-${pageId}`);
    if (!targetView) return;

    state.currentPage = pageId;

    // Remove active state from all views & links
    document.querySelectorAll(".page-view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(l => l.classList.remove("active"));

    // Activate selected
    targetView.classList.add("active");
    const activeLink = document.querySelector(`.sidebar-nav .nav-item[data-page="${pageId}"]`);
    if (activeLink) activeLink.classList.add("active");

    // Update title
    const readableTitles = {
      overview: "Dashboard Overview",
      orders: "Orders Management",
      sales: "Sales Growth & Performance",
      revenue: "Revenue & Gross Margins",
      customers: "Customer Acquisition & Demographics",
      products: "Product Performance Rankings",
      inventory: "Inventory Management & Alerts",
      shipping: "Shipping SLA & Dispatch Tracker",
      returns: "Returns Queue & Analytics",
      marketing: "Marketing Campaigns & ROI",
      financial: "Financial Cash Flow & P&L Statements",
      "ai-assistant": "AI Business Analyst Chat"
    };
    elements.headerTitle.textContent = readableTitles[pageId] || "Dashboard";

    // Close any drawers when routing
    closeDrawers();

    // Trigger page-specific renders
    renderPageData(pageId);
  }

  function renderPageData(pageId) {
    switch (pageId) {
      case "overview":
        renderOverviewPage();
        break;
      case "orders":
        renderOrdersPage();
        break;
      case "sales":
        renderSalesPage();
        break;
      case "revenue":
        renderRevenuePage();
        break;
      case "customers":
        renderCustomersPage();
        break;
      case "products":
        renderProductsPage();
        break;
      case "inventory":
        renderInventoryPage();
        break;
      case "shipping":
        renderShippingPage();
        break;
      case "returns":
        renderReturnsPage();
        break;
      case "marketing":
        renderMarketingPage();
        break;
      case "financial":
        renderFinancialPage();
        break;
      case "ai-assistant":
        // Chat focuses automatically
        const chatInput = document.getElementById("chat-input");
        if (chatInput) chatInput.focus();
        break;
    }
  }

  // Close Drawers & Backdrops
  function closeDrawers() {
    elements.detailsDrawer.classList.remove("active");
    elements.alertsDrawer.classList.remove("active");
    elements.drawerBackdrop.classList.remove("active");
    
    // De-select any table rows highlight
    document.querySelectorAll("#orders-table tbody tr").forEach(tr => tr.classList.remove("row-selected"));
  }

  function setupDrawers() {
    // Backdrop click close
    if (elements.drawerBackdrop) {
      elements.drawerBackdrop.addEventListener("click", () => {
        closeDrawers();
        if (window.innerWidth <= 768) {
          elements.sidebar.classList.remove("active");
        }
      });
    }

    if (elements.drawerCloseBtn) elements.drawerCloseBtn.addEventListener("click", closeDrawers);
    if (elements.alertsCloseBtn) elements.alertsCloseBtn.addEventListener("click", closeDrawers);

    // Alerts Drawer Trigger
    if (elements.notificationBtn) {
      elements.notificationBtn.addEventListener("click", () => {
        renderAlertsDrawer();
        elements.alertsDrawer.classList.add("active");
        elements.drawerBackdrop.classList.add("active");
      });
    }
  }

  // ==========================================================================
  // PAGE ENGINE: Overview Dashboard
  // ==========================================================================

  function calculateForecast(historicalData) {
    const n = historicalData.length;
    if (n === 0) return 0;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      const x = i;
      const y = historicalData[i].revenue;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Predict next month (month index n)
    const predicted = slope * n + intercept;
    return Math.round(predicted);
  }

  function renderOverviewPage() {
    const db = window.NovaCartDB;
    
    // Calculate overview numbers
    const validOrders = db.orders.filter(o => o.status !== "Cancelled");
    const grossRev = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = db.orders.length;
    const activeCust = db.customers.filter(c => c.ordersCount > 0).length;
    const forecastVal = calculateForecast(db.historicalData);
    
    // Populate cards
    document.getElementById("ov-revenue").textContent = formatMoney(grossRev);
    document.getElementById("ov-orders").textContent = totalOrders;
    document.getElementById("ov-customers").textContent = activeCust;
    
    const ovForecastEl = document.getElementById("ov-forecast");
    if (ovForecastEl) {
      ovForecastEl.textContent = formatMoney(forecastVal);
    }
    
    // Render Overview Insights
    renderAIInsightsPanel();

    // Render Recent Orders Table
    renderRecentOrdersTable();

    // Render Charts
    renderOverviewCharts();
  }

  function renderAIInsightsPanel() {
    const db = window.NovaCartDB;
    const container = document.getElementById("overview-insights");
    if (!container) return;

    const filter = state.overview && state.overview.insightsFilter ? state.overview.insightsFilter : "All";

    const lowStockCount = db.products.filter(p => p.stock < 20 && p.stock > 0).length;
    const outStockCount = db.products.filter(p => p.stock === 0).length;
    const topCampaign = db.marketingCampaigns.sort((a, b) => b.roi - a.roi)[0];
    const courierSLA = db.courierStats.find(c => c.onTimeRate < 93);

    const insights = [];

    // 1. Stock Alert (Inventory)
    if (outStockCount > 0) {
      insights.push({
        category: "Inventory",
        html: `
          <div class="insight-item">
            <div class="insight-icon-box bg-rose text-rose">
              <i data-lucide="package-x"></i>
            </div>
            <div class="insight-body">
              <div class="insight-title">${outStockCount} Products Out of Stock</div>
              <div class="insight-text">Stockouts are impacting conversion ratios. Laptops and accessories are showing zero inventory.</div>
              <button class="insight-action-btn" onclick="window.app.navigateTo('inventory')">Open Inventory Tracker <i data-lucide="arrow-right"></i></button>
            </div>
          </div>
        `
      });
    } else if (lowStockCount > 0) {
      insights.push({
        category: "Inventory",
        html: `
          <div class="insight-item">
            <div class="insight-icon-box bg-amber text-amber">
              <i data-lucide="package-open"></i>
            </div>
            <div class="insight-body">
              <div class="insight-title">${lowStockCount} Products Low on Stock</div>
              <div class="insight-text">Fast moving items in Electronics category are running thin. Expected to sell out within 4 days.</div>
              <button class="insight-action-btn" onclick="window.app.navigateTo('inventory')">Resolve Low Stock <i data-lucide="arrow-right"></i></button>
            </div>
          </div>
        `
      });
    }

    // 2. Marketing ROI Insight (Sales)
    insights.push({
      category: "Sales",
      html: `
        <div class="insight-item">
          <div class="insight-icon-box bg-blue text-blue">
            <i data-lucide="line-chart"></i>
          </div>
          <div class="insight-body">
            <div class="insight-title">Campaign '${topCampaign.name}' is highly profitable</div>
            <div class="insight-text">ROI reached a strong ${topCampaign.roi}x on channel ${topCampaign.channel}. Allocate remaining budget here.</div>
            <button class="insight-action-btn" onclick="window.app.navigateTo('marketing')">View ROI Performance <i data-lucide="arrow-right"></i></button>
          </div>
        </div>
      `
    });

    // 3. Shipping Courier SLA (Shipping)
    if (courierSLA) {
      insights.push({
        category: "Shipping",
        html: `
          <div class="insight-item">
            <div class="insight-icon-box bg-rose text-rose">
              <i data-lucide="truck"></i>
            </div>
            <div class="insight-body">
              <div class="insight-title">${courierSLA.name} Shipping SLA is Dropping</div>
              <div class="insight-text">On-time delivery fell to ${courierSLA.onTimeRate}%. Customer support queries for shipping delays are up.</div>
              <button class="insight-action-btn" onclick="window.app.navigateTo('shipping')">Optimize Courier Load <i data-lucide="arrow-right"></i></button>
            </div>
          </div>
        `
      });
    } else {
      insights.push({
        category: "Shipping",
        html: `
          <div class="insight-item">
            <div class="insight-icon-box bg-emerald text-emerald">
              <i data-lucide="shield-check"></i>
            </div>
            <div class="insight-body">
              <div class="insight-title">Courier Deliveries on Track</div>
              <div class="insight-text">Average delivery speed is 2.1 days. 95% of packages arrived within standard timelines.</div>
              <button class="insight-action-btn" onclick="window.app.navigateTo('shipping')">View Logistics SLA <i data-lucide="arrow-right"></i></button>
            </div>
          </div>
        `
      });
    }

    // 4. Returns Insight (Sales)
    insights.push({
      category: "Sales",
      html: `
        <div class="insight-item">
          <div class="insight-icon-box bg-blue text-blue">
            <i data-lucide="rotate-ccw"></i>
          </div>
          <div class="insight-body">
            <div class="insight-title">Defective items leading return requests</div>
            <div class="insight-text">About 45% of customer return reasons claim defective manufacturing. Check supplier SLAs.</div>
            <button class="insight-action-btn" onclick="window.app.navigateTo('returns')">Audit Return Reasons <i data-lucide="arrow-right"></i></button>
          </div>
        </div>
      `
    });

    // Filter list
    const filteredInsights = filter === "All" ? insights : insights.filter(ins => ins.category === filter);

    let insightsHTML = "";
    if (filteredInsights.length === 0) {
      insightsHTML = `<div class="muted-text text-center py-4 col-span-2">No AI insights available for category "${filter}".</div>`;
    } else {
      filteredInsights.forEach(ins => {
        insightsHTML += ins.html;
      });
    }

    container.innerHTML = insightsHTML;
    lucide.createIcons();
  }

  function renderOverviewCharts() {
    const db = window.NovaCartDB;
    const colors = getThemeColors();

    // 1. Monthly Revenue Area/Line Chart
    if (charts.ovSales) charts.ovSales.destroy();
    
    const salesCtx = document.getElementById("chart-ov-sales").getContext("2d");
    const months = db.historicalData.map(h => h.month);
    const revenues = db.historicalData.map(h => h.revenue);

    // Create Gradient
    const blueGradient = salesCtx.createLinearGradient(0, 0, 0, 250);
    blueGradient.addColorStop(0, "rgba(59, 130, 246, 0.35)");
    blueGradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");

    charts.ovSales = new Chart(salesCtx, {
      type: "line",
      data: {
        labels: months,
        datasets: [{
          label: "Gross Revenue ($)",
          data: revenues,
          borderColor: "#3b82f6",
          borderWidth: 3,
          backgroundColor: blueGradient,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: "#3b82f6",
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: colors.grid },
            ticks: { color: colors.text, font: { family: "Outfit" } }
          },
          y: {
            grid: { color: colors.grid },
            ticks: { 
              color: colors.text, 
              font: { family: "JetBrains Mono" },
              callback: val => `$${Math.round(val / 1000)}k`
            }
          }
        }
      }
    });

    // 2. Category Distribution Doughnut Chart
    if (charts.ovCategories) charts.ovCategories.destroy();
    
    const catCtx = document.getElementById("chart-ov-categories").getContext("2d");
    
    // Group products by category and sum revenue
    const catMap = {};
    db.products.forEach(p => {
      catMap[p.category] = (catMap[p.category] || 0) + p.revenue;
    });

    // Sort categories by revenue desc and take top 5, group rest into "Other"
    const catSorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const labels = [];
    const data = [];
    
    let otherSum = 0;
    catSorted.forEach((cat, index) => {
      if (index < 5) {
        labels.push(cat[0]);
        data.push(cat[1]);
      } else {
        otherSum += cat[1];
      }
    });
    if (otherSum > 0) {
      labels.push("Other");
      data.push(otherSum);
    }

    const doughnutColors = ["#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#f59e0b", "#06b6d4"];

    charts.ovCategories = new Chart(catCtx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: doughnutColors,
          borderWidth: 2,
          borderColor: document.documentElement.classList.contains("light") ? "#ffffff" : "#0d0d12"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: colors.text,
              font: { family: "Outfit", size: 11 },
              boxWidth: 8,
              padding: 10
            }
          }
        },
        cutout: "75%"
      }
    });

    // 3. AI Forecast Chart
    renderForecastChart();
  }

  function renderForecastChart() {
    const db = window.NovaCartDB;
    const colors = getThemeColors();
    const canvas = document.getElementById("chart-ov-forecast");
    if (!canvas) return;

    if (charts.ovForecast) charts.ovForecast.destroy();
    
    const ctx = canvas.getContext("2d");
    const months = db.historicalData.map(h => h.month);
    const revenues = db.historicalData.map(h => h.revenue);
    const n = revenues.length;

    // Linear regression y = slope * x + intercept
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += revenues[i];
      sumXY += i * revenues[i];
      sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Forecast next 3 months
    const p1 = Math.round(slope * n + intercept);
    const p2 = Math.round(slope * (n + 1) + intercept);
    const p3 = Math.round(slope * (n + 2) + intercept);

    // Labels: historical months + 3 forecasted months
    const allLabels = [...months, "Jul 26", "Aug 26", "Sep 26"];

    // Datasets
    const histData = [...revenues, null, null, null];
    const projData = [...Array(n - 1).fill(null), revenues[n - 1], p1, p2, p3];

    // Create gradient for historical
    const histGradient = ctx.createLinearGradient(0, 0, 0, 250);
    histGradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
    histGradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");

    // Create gradient for projected
    const projGradient = ctx.createLinearGradient(0, 0, 0, 250);
    projGradient.addColorStop(0, "rgba(16, 185, 129, 0.15)");
    projGradient.addColorStop(1, "rgba(16, 185, 129, 0.0)");

    charts.ovForecast = new Chart(ctx, {
      type: "line",
      data: {
        labels: allLabels,
        datasets: [
          {
            label: "Historical Revenue ($)",
            data: histData,
            borderColor: "#3b82f6",
            borderWidth: 3,
            backgroundColor: histGradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#3b82f6",
            pointRadius: 3,
            pointHoverRadius: 5
          },
          {
            label: "AI Projected Revenue ($)",
            data: projData,
            borderColor: "#10b981",
            borderWidth: 3,
            borderDash: [6, 4],
            backgroundColor: projGradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#10b981",
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: colors.text,
              font: { family: "Outfit", size: 11 }
            }
          }
        },
        scales: {
          x: {
            grid: { color: colors.grid },
            ticks: { color: colors.text, font: { family: "Outfit" } }
          },
          y: {
            grid: { color: colors.grid },
            ticks: { 
              color: colors.text, 
              font: { family: "JetBrains Mono" },
              callback: val => `$${Math.round(val / 1000)}k`
            }
          }
        }
      }
    });
  }

  function renderRecentOrdersTable() {
    const db = window.NovaCartDB;
    const container = elements.recentOrdersTableBody;
    if (!container) return;
    
    // Take the 5 most recent orders
    const recent = db.orders.slice(0, 5);
    
    let html = "";
    if (recent.length === 0) {
      html = `<tr><td colspan="4" class="text-center py-4 muted-text">No orders found.</td></tr>`;
    } else {
      recent.forEach(o => {
        const statusClass = `status-${o.status.toLowerCase().replace(" ", "-")}`;
        html += `
          <tr data-id="${o.id}" class="clickable-row" style="cursor: pointer;">
            <td class="font-mono text-bold">${o.id}</td>
            <td>
              <div class="text-semibold text-xs">${o.customerName}</div>
            </td>
            <td class="font-mono text-semibold text-xs">${formatMoney(o.totalAmount)}</td>
            <td><span class="status-pill ${statusClass}" style="transform: scale(0.85); transform-origin: left center;">${o.status}</span></td>
          </tr>
        `;
      });
    }
    
    container.innerHTML = html;
    
    // Bind click handlers to show order details
    container.querySelectorAll("tr").forEach(tr => {
      const orderId = tr.getAttribute("data-id");
      if (!orderId) return;
      tr.addEventListener("click", () => {
        renderOrderDetailsDrawer(orderId);
      });
    });
  }

  // ==========================================================================
  // PAGE ENGINE: Orders Management
  // ==========================================================================

  function renderOrdersPage() {
    const db = window.NovaCartDB;

    // 1. Populate search/filter category dropdown if empty
    if (elements.ordersFilterCategory.options.length <= 1) {
      db.categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        elements.ordersFilterCategory.appendChild(option);
      });
    }

    // 2. Calc metrics
    const total = db.orders.length;
    const pending = db.orders.filter(o => o.status === "Pending").length;
    const delivered = db.orders.filter(o => o.status === "Delivered").length;
    const cancelled = db.orders.filter(o => o.status === "Cancelled").length;

    document.getElementById("ord-total").textContent = total;
    document.getElementById("ord-pending").textContent = pending;
    document.getElementById("ord-delivered").textContent = delivered;
    document.getElementById("ord-cancelled").textContent = cancelled;

    // 3. Render Table
    renderOrdersTable();
  }

  function renderOrdersTable() {
    const db = window.NovaCartDB;

    // Apply Search and Filters
    let filteredOrders = db.orders.filter(o => {
      const searchLower = state.orders.search.toLowerCase();
      const matchesSearch = o.id.toLowerCase().includes(searchLower) || o.customerName.toLowerCase().includes(searchLower);
      const matchesStatus = state.orders.filterStatus === "All" || o.status === state.orders.filterStatus;
      const matchesCategory = state.orders.filterCategory === "All" || o.category === state.orders.filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });

    const totalCount = filteredOrders.length;
    state.orders.currentPage = Math.max(1, Math.min(state.orders.currentPage, Math.ceil(totalCount / state.orders.itemsPerPage) || 1));

    const startIdx = (state.orders.currentPage - 1) * state.orders.itemsPerPage;
    const endIdx = Math.min(startIdx + state.orders.itemsPerPage, totalCount);

    const pagedOrders = filteredOrders.slice(startIdx, endIdx);

    // Populate Table DOM
    let tbodyHTML = "";
    if (pagedOrders.length === 0) {
      tbodyHTML = `<tr><td colspan="7" class="text-center py-4 muted-text">No matching orders found.</td></tr>`;
    } else {
      pagedOrders.forEach(o => {
        const statusClass = `status-${o.status.toLowerCase().replace(" ", "-")}`;
        const selectedClass = state.orders.selectedOrderId === o.id ? "row-selected" : "";
        
        tbodyHTML += `
          <tr data-id="${o.id}" class="${selectedClass}">
            <td class="font-mono text-bold">${o.id}</td>
            <td>
              <div class="text-semibold">${o.customerName}</div>
              <div class="muted-text text-xs font-mono">${o.customerEmail}</div>
            </td>
            <td>${o.date}</td>
            <td><span class="badge badge-purple text-xs font-medium">${o.category || "General"}</span></td>
            <td class="font-mono text-semibold">${formatMoney(o.totalAmount)}</td>
            <td>${o.courier}</td>
            <td><span class="status-pill ${statusClass}">${o.status}</span></td>
          </tr>
        `;
      });
    }

    elements.ordersTableBody.innerHTML = tbodyHTML;

    // Bind table row clicks
    elements.ordersTableBody.querySelectorAll("tr").forEach(tr => {
      const orderId = tr.getAttribute("data-id");
      if (!orderId) return;
      tr.addEventListener("click", () => {
        // Toggle highlight class
        elements.ordersTableBody.querySelectorAll("tr").forEach(row => row.classList.remove("row-selected"));
        tr.classList.add("row-selected");
        
        state.orders.selectedOrderId = orderId;
        renderOrderDetailsDrawer(orderId);
      });
    });

    // Update pagination stats
    elements.ordersPageStart.textContent = totalCount === 0 ? 0 : startIdx + 1;
    elements.ordersPageEnd.textContent = endIdx;
    elements.ordersTotalCount.textContent = totalCount;

    // Update Pagination button states
    elements.ordersBtnFirst.disabled = state.orders.currentPage === 1;
    elements.ordersBtnPrev.disabled = state.orders.currentPage === 1;
    
    const maxPage = Math.ceil(totalCount / state.orders.itemsPerPage) || 1;
    elements.ordersBtnNext.disabled = state.orders.currentPage === maxPage;
    elements.ordersBtnLast.disabled = state.orders.currentPage === maxPage;
  }

  function setupOrdersEvents() {
    // Search input
    if (elements.ordersSearch) {
      elements.ordersSearch.addEventListener("input", (e) => {
        state.orders.search = e.target.value;
        state.orders.currentPage = 1;
        renderOrdersTable();
      });
    }

    // Status filter
    if (elements.ordersFilterStatus) {
      elements.ordersFilterStatus.addEventListener("change", (e) => {
        state.orders.filterStatus = e.target.value;
        state.orders.currentPage = 1;
        renderOrdersTable();
      });
    }

    // Category filter
    if (elements.ordersFilterCategory) {
      elements.ordersFilterCategory.addEventListener("change", (e) => {
        state.orders.filterCategory = e.target.value;
        state.orders.currentPage = 1;
        renderOrdersTable();
      });
    }

    // Pagination Click binds
    if (elements.ordersBtnFirst) {
      elements.ordersBtnFirst.addEventListener("click", () => {
        state.orders.currentPage = 1;
        renderOrdersTable();
      });
    }

    if (elements.ordersBtnPrev) {
      elements.ordersBtnPrev.addEventListener("click", () => {
        state.orders.currentPage--;
        renderOrdersTable();
      });
    }

    if (elements.ordersBtnNext) {
      elements.ordersBtnNext.addEventListener("click", () => {
        state.orders.currentPage++;
        renderOrdersTable();
      });
    }

    if (elements.ordersBtnLast) {
      elements.ordersBtnLast.addEventListener("click", () => {
        const db = window.NovaCartDB;
        const totalFiltered = db.orders.filter(o => {
          const searchLower = state.orders.search.toLowerCase();
          const matchesSearch = o.id.toLowerCase().includes(searchLower) || o.customerName.toLowerCase().includes(searchLower);
          const matchesStatus = state.orders.filterStatus === "All" || o.status === state.orders.filterStatus;
          const matchesCategory = state.orders.filterCategory === "All" || o.category === state.orders.filterCategory;
          return matchesSearch && matchesStatus && matchesCategory;
        }).length;
        state.orders.currentPage = Math.ceil(totalFiltered / state.orders.itemsPerPage) || 1;
        renderOrdersTable();
      });
    }
  }

  function renderOrderDetailsDrawer(orderId) {
    const db = window.NovaCartDB;
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return;

    // Header updates
    document.getElementById("drawer-title").textContent = "Order Information";
    document.getElementById("drawer-subtitle").textContent = order.id;

    // Build Drawer Body Content
    const statusClass = `status-${order.status.toLowerCase().replace(" ", "-")}`;
    let itemsHTML = "";
    order.items.forEach(item => {
      itemsHTML += `
        <div class="drawer-item-row">
          <div>
            <div class="text-semibold">${item.name}</div>
            <div class="muted-text text-xs">SKU: ${item.productId}</div>
          </div>
          <div class="text-right">
            <div class="text-semibold">${formatMoney(item.price * item.quantity)}</div>
            <div class="muted-text text-xs">${item.quantity} x ${formatMoney(item.price)}</div>
          </div>
        </div>
      `;
    });

    // Timeline steps builder
    let timelineHTML = "";
    order.timeline.forEach(step => {
      const isDone = step.done;
      timelineHTML += `
        <div class="timeline-step ${isDone ? 'completed' : ''}">
          <div class="timeline-bullet">
            <i data-lucide="check"></i>
          </div>
          <div class="timeline-content">
            <span class="timeline-status">${step.status}</span>
            ${isDone ? `<div class="timeline-time-box"><span>${step.date}</span><span>${step.time}</span></div>` : ''}
          </div>
        </div>
      `;
    });

    // Extra blocks for Returns details
    let returnBlockHTML = "";
    if (order.returnRequest) {
      const badgeClass = order.returnRequest.status === "Approved" ? "status-delivered" : "status-cancelled";
      returnBlockHTML = `
        <div class="drawer-section">
          <div class="drawer-section-title">Product Return Claim</div>
          <div class="details-grid mb-3">
            <div class="details-block">
              <span class="details-label">Reason</span>
              <div class="details-value">${order.returnRequest.reason}</div>
            </div>
            <div class="details-block">
              <span class="details-label">Refund Status</span>
              <div class="details-value"><span class="status-pill ${badgeClass}">${order.returnRequest.status}</span></div>
            </div>
          </div>
        </div>
      `;
    }

    const drawerBody = document.getElementById("drawer-body");
    drawerBody.innerHTML = `
      <!-- Status Badge -->
      <div class="flex-between mb-4">
        <span class="muted-text font-semibold">Current State:</span>
        <span class="status-pill ${statusClass}">${order.status}</span>
      </div>

      <!-- Core Details Block -->
      <div class="drawer-section">
        <div class="drawer-section-title">Customer Details</div>
        <div class="details-grid">
          <div class="details-block col-span-2">
            <span class="details-label">Billing Name</span>
            <div class="details-value">${order.customerName}</div>
          </div>
          <div class="details-block col-span-2">
            <span class="details-label">Email Address</span>
            <div class="details-value font-mono text-xs">${order.customerEmail}</div>
          </div>
          <div class="details-block">
            <span class="details-label">Courier Partner</span>
            <div class="details-value">${order.courier}</div>
          </div>
          <div class="details-block">
            <span class="details-label">Shipping Method</span>
            <div class="details-value">${order.shippingMethod}</div>
          </div>
        </div>
      </div>

      <!-- Return Claims Block -->
      ${returnBlockHTML}

      <!-- Order Items -->
      <div class="drawer-section">
        <div class="drawer-section-title">Order Items & Summary</div>
        <div class="drawer-items-box mb-3">
          ${itemsHTML}
        </div>
        <div class="flex-between py-2 border-t">
          <span class="muted-text text-semibold">Total Price:</span>
          <span class="text-semibold text-lg font-mono">${formatMoney(order.totalAmount)}</span>
        </div>
      </div>

      <!-- Timeline Tracking -->
      <div class="drawer-section">
        <div class="drawer-section-title">Logistics Status Timeline</div>
        <div class="status-timeline">
          ${timelineHTML}
        </div>
      </div>
    `;

    // Trigger lucide on elements inside drawer
    lucide.createIcons();

    // Slide drawer open
    elements.detailsDrawer.classList.add("active");
    elements.drawerBackdrop.classList.add("active");
  }

  // ==========================================================================
  // PAGE ENGINE: Sales Analytics Page
  // ==========================================================================

  let salesPagePeriod = "Monthly";
  let salesPageChartType = "line";

  function renderSalesPage() {
    const db = window.NovaCartDB;

    // Render table details
    const catMap = {};
    const catSales = {};
    db.products.forEach(p => {
      catMap[p.category] = (catMap[p.category] || 0) + p.revenue;
      catSales[p.category] = (catSales[p.category] || 0) + p.salesCount;
    });

    const totalRev = db.orders.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + o.totalAmount, 0);

    let tableHTML = "";
    Object.entries(catMap).sort((a, b) => b[1] - a[1]).forEach(entry => {
      const cat = entry[0];
      const rev = entry[1];
      const items = catSales[cat];
      const share = totalRev === 0 ? 0 : (rev / totalRev * 100).toFixed(1);

      tableHTML += `
        <tr>
          <td class="text-semibold">${cat}</td>
          <td class="font-mono">${items}</td>
          <td class="font-mono text-semibold">${formatMoney(rev)}</td>
          <td>
            <div class="progress-bar-wrapper">
              <div class="progress-bar bg-blue" style="width: ${share}%;"></div>
            </div>
            <span class="text-xs muted-text mt-1 block">${share}% share</span>
          </td>
        </tr>
      `;
    });
    document.querySelector("#sales-category-table tbody").innerHTML = tableHTML;

    // Render Customizable Charts
    renderSalesCharts();

    // Render SVG World Map & Stats
    renderSalesWorldMap();
  }

  function renderSalesWorldMap() {
    const db = window.NovaCartDB;
    const regionStats = {
      "California": { orders: 0, revenue: 0, class: "california" },
      "New York": { orders: 0, revenue: 0, class: "new-york" },
      "London": { orders: 0, revenue: 0, class: "london" },
      "Toronto": { orders: 0, revenue: 0, class: "toronto" }
    };

    // Map each customer ID to location prefix
    const custLocMap = {};
    db.customers.forEach(c => {
      const key = c.location.split(",")[0].trim();
      custLocMap[c.id] = key;
    });

    // Sum orders by region
    db.orders.forEach(o => {
      if (o.status === "Cancelled") return;
      const r = custLocMap[o.customerId];
      if (r && regionStats[r]) {
        regionStats[r].orders++;
        regionStats[r].revenue += o.totalAmount;
      }
    });

    // Populate region list sidebar
    let statsHTML = "";
    Object.entries(regionStats).forEach(([name, data]) => {
      statsHTML += `
        <div class="map-region-card ${data.class}" data-region="${name}">
          <div class="region-info">
            <span class="region-dot"></span>
            <div>
              <div class="text-semibold text-xs">${name}</div>
              <span class="muted-text" style="font-size: 10px;">${data.orders} Orders</span>
            </div>
          </div>
          <div class="font-mono text-bold text-xs">${formatMoney(data.revenue)}</div>
        </div>
      `;
    });
    
    const statsContainer = document.getElementById("map-region-stats");
    if (statsContainer) {
      statsContainer.innerHTML = statsHTML;
    }

    // Interactive Hover Pin & Tooltip logic
    const tooltip = document.getElementById("map-tooltip");
    const pins = document.querySelectorAll(".map-pin");
    const cards = document.querySelectorAll(".map-region-card");
    const mapWrapper = document.getElementById("sales-world-map");
    
    if (!tooltip || !mapWrapper) return;
    
    function showTooltipForRegion(regionName, element) {
      const stats = regionStats[regionName];
      if (!stats) return;
      
      tooltip.querySelector(".tooltip-title").textContent = regionName;
      tooltip.querySelector(".tooltip-value").textContent = `${stats.orders} Orders • ${formatMoney(stats.revenue)}`;
      tooltip.style.display = "block";
      
      const containerRect = mapWrapper.getBoundingClientRect();
      const elemRect = element.getBoundingClientRect();
      
      const left = elemRect.left - containerRect.left + (elemRect.width / 2) - (tooltip.offsetWidth / 2);
      const top = elemRect.top - containerRect.top - tooltip.offsetHeight - 8;
      
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      
      // Highlight region list item
      cards.forEach(c => {
        if (c.getAttribute("data-region") === regionName) {
          c.classList.add("active");
        } else {
          c.classList.remove("active");
        }
      });
    }
    
    function hideTooltip() {
      tooltip.style.display = "none";
      cards.forEach(c => c.classList.remove("active"));
    }

    pins.forEach(pin => {
      const region = pin.getAttribute("data-region");
      pin.addEventListener("mouseenter", () => {
        showTooltipForRegion(region, pin);
      });
      pin.addEventListener("mouseleave", hideTooltip);
    });

    cards.forEach(card => {
      const region = card.getAttribute("data-region");
      const pin = document.querySelector(`.map-pin[data-region="${region}"]`);
      card.addEventListener("mouseenter", () => {
        if (pin) showTooltipForRegion(region, pin);
      });
      card.addEventListener("mouseleave", hideTooltip);
    });
  }

  function renderSalesCharts() {
    const db = window.NovaCartDB;
    const colors = getThemeColors();

    if (charts.salesMain) charts.salesMain.destroy();

    const ctx = document.getElementById("chart-sales-main").getContext("2d");
    
    // Map periods to historical labels/data
    let labels = [];
    let salesData = [];
    
    document.getElementById("sales-chart-title").textContent = `${salesPagePeriod} Sales Revenue`;
    document.getElementById("sales-chart-subtitle").textContent = `Sales trends aggregated on a ${salesPagePeriod.toLowerCase()} basis`;

    if (salesPagePeriod === "Monthly") {
      labels = db.historicalData.map(h => h.month);
      salesData = db.historicalData.map(h => h.revenue);
    } else if (salesPagePeriod === "Quarterly") {
      labels = ["Q3 25", "Q4 25", "Q1 26", "Q2 26"];
      // aggregate
      const qValues = [0, 0, 0, 0];
      db.historicalData.forEach((h, i) => {
        const qIdx = Math.floor(i / 3);
        qValues[qIdx] += h.revenue;
      });
      salesData = qValues;
    } else if (salesPagePeriod === "Yearly") {
      labels = ["Fiscal Year 2025", "Fiscal Year 2026"];
      const yValues = [0, 0];
      db.historicalData.forEach((h, i) => {
        if (i < 6) yValues[0] += h.revenue; // first 6
        else yValues[1] += h.revenue;       // second 6
      });
      salesData = yValues;
    } else if (salesPagePeriod === "Weekly") {
      labels = ["W1 Jun", "W2 Jun", "W3 Jun", "W4 Jun", "W1 Jul"];
      salesData = [12400, 14500, 11800, 15600, 18900];
    } else { // Daily
      labels = ["Jun 27", "Jun 28", "Jun 29", "Jun 30", "Jul 01", "Jul 02", "Jul 03"];
      salesData = [2400, 1800, 2100, 3200, 2900, 3500, 4200];
    }

    const type = salesPageChartType === "area" ? "line" : salesPageChartType;
    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.4)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");

    charts.salesMain = new Chart(ctx, {
      type: type,
      data: {
        labels: labels,
        datasets: [{
          label: "Sales ($)",
          data: salesData,
          borderColor: "#3b82f6",
          borderWidth: 3,
          backgroundColor: salesPageChartType === "area" ? gradient : "#3b82f6",
          fill: salesPageChartType === "area",
          tension: 0.3,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: colors.grid },
            ticks: { color: colors.text, font: { family: "Outfit" } }
          },
          y: {
            grid: { color: colors.grid },
            ticks: { 
              color: colors.text, 
              font: { family: "JetBrains Mono" },
              callback: val => `$${val.toLocaleString()}`
            }
          }
        }
      }
    });

    // Render Sales Category count horizontal chart
    if (charts.salesCategories) charts.salesCategories.destroy();
    const catCtx = document.getElementById("chart-sales-categories").getContext("2d");
    
    const catLabels = [];
    const catValues = [];
    db.products.forEach(p => {
      const idx = catLabels.indexOf(p.category);
      if (idx === -1) {
        catLabels.push(p.category);
        catValues.push(p.salesCount);
      } else {
        catValues[idx] += p.salesCount;
      }
    });

    charts.salesCategories = new Chart(catCtx, {
      type: "bar",
      data: {
        labels: catLabels,
        datasets: [{
          label: "Items Sold",
          data: catValues,
          backgroundColor: "#8b5cf6",
          borderRadius: 3
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: colors.grid },
            ticks: { color: colors.text, font: { family: "JetBrains Mono" } }
          },
          y: {
            grid: { display: false },
            ticks: { color: colors.text, font: { family: "Outfit" } }
          }
        }
      }
    });
  }

  function setupSalesEvents() {
    // Period Toggles
    const periodButtons = document.querySelectorAll("#sales-period-control .segmented-item");
    periodButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        periodButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        salesPagePeriod = btn.getAttribute("data-period");
        renderSalesCharts();
      });
    });

    // Chart Type Toggles
    const typeButtons = document.querySelectorAll("#sales-chart-type .segmented-item");
    typeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        typeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        salesPageChartType = btn.getAttribute("data-type");
        renderSalesCharts();
      });
    });
  }

  // ==========================================================================
  // PAGE ENGINE: Revenue Analytics Page
  // ==========================================================================

  function renderRevenuePage() {
    const db = window.NovaCartDB;
    const colors = getThemeColors();

    const validOrders = db.orders.filter(o => o.status !== "Cancelled");
    const grossRev = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const cogs = validOrders.reduce((sum, o) => sum + o.costAmount, 0);
    const profit = grossRev - cogs;
    
    const grossMargin = grossRev === 0 ? 0 : (profit / grossRev * 100).toFixed(1);
    
    // Net margins estimation after taxes and refunds
    const refunds = db.orders.filter(o => o.returnRequest && o.returnRequest.status === "Approved").reduce((sum, o) => sum + o.returnRequest.refundAmount, 0);
    const taxes = profit * 0.15;
    const netProfit = profit - refunds - taxes;
    const netMargin = grossRev === 0 ? 0 : (netProfit / grossRev * 100).toFixed(1);

    document.getElementById("rev-total").textContent = formatMoney(grossRev);
    document.getElementById("rev-cost").textContent = formatMoney(cogs);
    document.getElementById("rev-profit").textContent = formatMoney(profit);
    document.getElementById("rev-gross-margin").textContent = `${grossMargin}%`;
    document.getElementById("rev-net-margin").textContent = `${netMargin}%`;

    // Monthly Growth Area Chart
    if (charts.revGrowth) charts.revGrowth.destroy();
    const grCtx = document.getElementById("chart-rev-growth").getContext("2d");
    
    const months = db.historicalData.map(h => h.month);
    const revenues = db.historicalData.map(h => h.revenue);

    const purpleGradient = grCtx.createLinearGradient(0, 0, 0, 250);
    purpleGradient.addColorStop(0, "rgba(139, 92, 246, 0.4)");
    purpleGradient.addColorStop(1, "rgba(139, 92, 246, 0.0)");

    charts.revGrowth = new Chart(grCtx, {
      type: "line",
      data: {
        labels: months,
        datasets: [{
          label: "Revenue Growth",
          data: revenues,
          borderColor: "#8b5cf6",
          borderWidth: 3,
          backgroundColor: purpleGradient,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { family: "Outfit" } } },
          y: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { family: "JetBrains Mono" }, callback: val => `$${val.toLocaleString()}` } }
        }
      }
    });

    // Net Profit Trend Bar
    if (charts.revProfit) charts.revProfit.destroy();
    const prCtx = document.getElementById("chart-rev-profit").getContext("2d");
    const netProfits = db.historicalData.map(h => h.profit);

    charts.revProfit = new Chart(prCtx, {
      type: "bar",
      data: {
        labels: months,
        datasets: [{
          label: "Net Profit ($)",
          data: netProfits,
          backgroundColor: "#10b981",
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { family: "Outfit" } } },
          y: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { family: "JetBrains Mono" }, callback: val => `$${val.toLocaleString()}` } }
        }
      }
    });
  }

  // ==========================================================================
  // PAGE ENGINE: Customer Analytics Page
  // ==========================================================================

  function renderCustomersPage() {
    const db = window.NovaCartDB;
    const colors = getThemeColors();

    const activeCust = db.customers.filter(c => c.ordersCount > 0).length;
    
    // Repeat Buyers count
    const repeatCust = db.customers.filter(c => c.ordersCount > 1).length;
    const repeatRate = activeCust === 0 ? 0 : (repeatCust / activeCust * 100).toFixed(1);
    
    const validOrders = db.orders.filter(o => o.status !== "Cancelled");
    const grossRev = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgLTV = activeCust === 0 ? 0 : grossRev / activeCust;

    document.getElementById("cust-active").textContent = activeCust;
    document.getElementById("cust-returning-rate").textContent = `${repeatRate}%`;
    document.getElementById("cust-ltv").textContent = formatMoney(avgLTV);

    // 1. Locations Bar Chart
    if (charts.custLocations) charts.custLocations.destroy();
    const locCtx = document.getElementById("chart-cust-locations").getContext("2d");
    
    const locMap = {};
    db.customers.forEach(c => {
      locMap[c.location] = (locMap[c.location] || 0) + 1;
    });

    charts.custLocations = new Chart(locCtx, {
      type: "bar",
      data: {
        labels: Object.keys(locMap),
        dataDatasets: [{
          data: Object.values(locMap),
          backgroundColor: "#3b82f6"
        }],
        datasets: [{
          label: "Customers count",
          data: Object.values(locMap),
          backgroundColor: "#3b82f6",
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { family: "JetBrains Mono" } } },
          y: { grid: { display: false }, ticks: { color: colors.text, font: { family: "Outfit" } } }
        }
      }
    });

    // 2. Customer Segmentation Doughnut
    if (charts.custSegments) charts.custSegments.destroy();
    const segCtx = document.getElementById("chart-cust-segments").getContext("2d");
    
    const segMap = { VIP: 0, Loyal: 0, Standard: 0 };
    db.customers.forEach(c => {
      segMap[c.spendingTier]++;
    });

    charts.custSegments = new Chart(segCtx, {
      type: "doughnut",
      data: {
        labels: ["VIP Spenders", "Loyal Spenders", "Standard Accounts"],
        datasets: [{
          data: [segMap.VIP, segMap.Loyal, segMap.Standard],
          backgroundColor: ["#f59e0b", "#8b5cf6", "#3b82f6"],
          borderWidth: 2,
          borderColor: document.documentElement.classList.contains("light") ? "#ffffff" : "#0d0d12"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: colors.text, font: { family: "Outfit", size: 11 }, boxWidth: 10 }
          }
        },
        cutout: "70%"
      }
    });

    // 3. Top Spenders Table
    let tableHTML = "";
    db.customers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5).forEach(c => {
      const tierClass = c.spendingTier === "VIP" ? "badge-red" : c.spendingTier === "Loyal" ? "badge-purple" : "bg-blue";
      tableHTML += `
        <tr>
          <td class="text-semibold">${c.name}</td>
          <td class="font-mono muted-text text-xs">${c.email}</td>
          <td>${c.location}</td>
          <td><span class="badge ${tierClass} text-xs font-medium relative top-0 right-0">${c.spendingTier}</span></td>
          <td class="font-mono text-center">${c.ordersCount}</td>
          <td class="font-mono text-semibold text-emerald">${formatMoney(c.totalSpent)}</td>
        </tr>
      `;
    });
    document.querySelector("#customers-top-table tbody").innerHTML = tableHTML;

    // Render Customer Activity Timeline
    renderCustomerActivityTimeline();
  }

  function renderCustomerActivityTimeline() {
    const db = window.NovaCartDB;
    const container = document.getElementById("customer-activity-timeline");
    if (!container) return;

    // Take top 5 orders as recent activities
    const recentOrders = db.orders.slice(0, 5);
    let html = "";

    recentOrders.forEach((o, index) => {
      const cust = db.customers.find(c => c.id === o.customerId);
      const custName = cust ? cust.name : "A customer";
      
      let badgeClass = "purchase";
      let icon = "shopping-bag";
      let title = "";
      let timeLabel = "";

      if (index === 0) timeLabel = "2 hours ago";
      else if (index === 1) timeLabel = "5 hours ago";
      else if (index === 2) timeLabel = "1 day ago";
      else if (index === 3) timeLabel = "2 days ago";
      else timeLabel = "3 days ago";

      if (o.status === "Pending") {
        badgeClass = "purchase";
        icon = "shopping-cart";
        title = `<span class="text-bold text-blue">${custName}</span> placed order <span class="font-mono text-semibold">${o.id}</span> for ${formatMoney(o.totalAmount)}`;
      } else if (o.status === "Shipped") {
        badgeClass = "delivery";
        icon = "truck";
        title = `<span class="text-bold text-blue">${custName}</span>'s order <span class="font-mono text-semibold">${o.id}</span> was dispatched via courier`;
      } else if (o.status === "Delivered") {
        badgeClass = "delivery";
        icon = "check-circle";
        title = `<span class="text-bold text-blue">${custName}</span> received order <span class="font-mono text-semibold">${o.id}</span> (${formatMoney(o.totalAmount)})`;
      } else if (o.status === "Cancelled") {
        badgeClass = "refund";
        icon = "x-circle";
        title = `<span class="text-bold text-blue">${custName}</span> cancelled order <span class="font-mono text-semibold">${o.id}</span> (Refund initiated)`;
      }

      html += `
        <div class="timeline-item">
          <div class="timeline-badge ${badgeClass}">
            <i data-lucide="${icon}"></i>
          </div>
          <div class="timeline-title">${title}</div>
          <div class="timeline-meta">
            <span>${timeLabel}</span>
            <span>•</span>
            <span class="font-mono text-xs">${o.category}</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    lucide.createIcons();
  }

  // ==========================================================================
  // PAGE ENGINE: Product Performance Page
  // ==========================================================================

  function renderProductsPage() {
    const db = window.NovaCartDB;

    // Helper to render lists
    const renderList = (elementId, productsList, formatFn, valueKey) => {
      const listEl = document.getElementById(elementId);
      if (!listEl) return;
      
      let html = "";
      productsList.forEach((p, idx) => {
        html += `
          <div class="ranking-item">
            <div class="ranking-badge">${idx + 1}</div>
            <div class="ranking-info">
              <div class="ranking-name">${p.name}</div>
              <div class="ranking-category">${p.category}</div>
            </div>
            <div class="ranking-value">${formatFn(p[valueKey])}</div>
          </div>
        `;
      });
      listEl.innerHTML = html;
    };

    // 1. Top Selling
    const topSelling = [...db.products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4);
    renderList("prod-list-top-selling", topSelling, val => `${val} units`, "salesCount");

    // 2. Low Selling
    const lowSelling = [...db.products].sort((a, b) => a.salesCount - b.salesCount).slice(0, 4);
    renderList("prod-list-low-selling", lowSelling, val => `${val} units`, "salesCount");

    // 3. Highest Revenue
    const highRev = [...db.products].sort((a, b) => b.revenue - a.revenue).slice(0, 4);
    renderList("prod-list-high-revenue", highRev, formatMoney, "revenue");

    // 4. Highest Rated
    const highRated = [...db.products].sort((a, b) => b.rating - a.rating).slice(0, 4);
    renderList("prod-list-highest-rated", highRated, val => `⭐ ${val.toFixed(1)}`, "rating");

    // 5. Most Returned
    const mostReturned = [...db.products].filter(p => p.returnsCount > 0).sort((a, b) => b.returnsCount - a.returnsCount).slice(0, 4);
    renderList("prod-list-most-returned", mostReturned, val => `${val} returned`, "returnsCount");
  }

  // ==========================================================================
  // PAGE ENGINE: Inventory Page
  // ==========================================================================

  function renderInventoryPage() {
    const db = window.NovaCartDB;

    // Calc inventory counts
    const totalStock = db.products.reduce((sum, p) => sum + p.stock, 0);
    const lowStock = db.products.filter(p => p.stock < 20 && p.stock > 0).length;
    const outStock = db.products.filter(p => p.stock === 0).length;

    document.getElementById("inv-total-stock").textContent = totalStock;
    document.getElementById("inv-low-stock").textContent = lowStock;
    document.getElementById("inv-out-of-stock").textContent = outStock;

    // Capacity math (Mock limit 2000 total items)
    const maxCapacity = 2000;
    const capacityPct = Math.round(totalStock / maxCapacity * 100);
    document.getElementById("inv-capacity").textContent = `${capacityPct}%`;
    document.querySelector("#page-inventory .progress-bar").style.width = `${capacityPct}%`;

    // Render Critical Alert Banner
    const lowItems = db.products.filter(p => p.stock < 20);
    const banner = document.getElementById("low-stock-alert-banner");
    if (banner) {
      if (lowItems.length > 0) {
        const itemsListText = lowItems.slice(0, 3).map(p => `${p.name} (${p.stock} left)`).join(", ") + (lowItems.length > 3 ? ` and ${lowItems.length - 3} others` : "");
        banner.style.display = "block";
        banner.innerHTML = `
          <div class="card border-rose-glow flex-between flex-wrap gap-2 p-3" style="background: rgba(244, 63, 94, 0.08); border-color: rgba(244, 63, 94, 0.25);">
            <div class="flex-align gap-2">
              <i data-lucide="alert-triangle" class="text-rose animate-bounce" style="width: 18px; height: 18px;"></i>
              <div>
                <span class="text-semibold text-rose text-xs" style="letter-spacing: 0.05em; font-weight: 700;">CRITICAL INVENTORY ALERT</span>
                <p class="m-0 text-xs muted-text mt-0.5">The following items are running critically low: <strong class="text-main">${itemsListText}</strong>. Restock immediately to avoid stockouts.</p>
              </div>
            </div>
            <button class="primary-btn btn-xs btn-rose" onclick="window.app.triggerBulkRestock()">
              <i data-lucide="refresh-cw"></i> Restock All
            </button>
          </div>
        `;
        lucide.createIcons();
      } else {
        banner.style.display = "none";
      }
    }

    // Filter registry
    const registry = db.products.filter(p => {
      const search = state.inventory.search.toLowerCase();
      return p.name.toLowerCase().includes(search) || p.id.toLowerCase().includes(search);
    });

    let regHTML = "";
    if (registry.length === 0) {
      regHTML = `<tr><td colspan="6" class="text-center py-4 muted-text">No SKU registry records match search.</td></tr>`;
    } else {
      registry.forEach(p => {
        let badge = '<span class="status-pill status-delivered">In Stock</span>';
        if (p.stock === 0) badge = '<span class="status-pill status-cancelled">Out of Stock</span>';
        else if (p.stock < 20) badge = '<span class="status-pill status-pending">Low Stock</span>';

        regHTML += `
          <tr>
            <td class="font-mono text-bold">${p.id}</td>
            <td class="text-semibold">${p.name}</td>
            <td><span class="badge bg-purple text-xs font-medium relative top-0 right-0">${p.category}</span></td>
            <td class="font-mono font-semibold">${p.stock} units</td>
            <td>${p.supplier}</td>
            <td>${badge}</td>
          </tr>
        `;
      });
    }
    elements.inventoryTableBody.innerHTML = regHTML;

    // Suggestions sidebar
    const suggestionsList = db.products.filter(p => p.stock < 20).sort((a, b) => a.stock - b.stock);
    let sugHTML = "";
    if (suggestionsList.length === 0) {
      sugHTML = `<div class="muted-text text-center text-xs py-4">All stocks are optimal! No suggestions needed.</div>`;
    } else {
      suggestionsList.forEach(p => {
        const reorderQty = p.stock === 0 ? 50 : 30;
        const daysOut = p.stock === 0 ? "OUT OF STOCK" : `${Math.round(p.stock / 2)} days left`;
        
        sugHTML += `
          <div class="restock-item">
            <div class="restock-row-top">
              <span class="restock-prod-name">${p.name}</span>
              <span class="restock-prod-qty font-mono text-bold text-xs">${p.stock} left</span>
            </div>
            <div class="restock-row-bottom">
              <span class="restock-days-out text-xs">${daysOut}</span>
              <button class="primary-btn btn-sm" onclick="window.app.triggerRestock('${p.id}', ${reorderQty})">
                <i data-lucide="refresh-cw"></i> Order +${reorderQty}
              </button>
            </div>
          </div>
        `;
      });
    }
    elements.restockSuggestionsList.innerHTML = sugHTML;
    lucide.createIcons();
  }

  function setupInventoryEvents() {
    if (elements.inventorySearch) {
      elements.inventorySearch.addEventListener("input", (e) => {
        state.inventory.search = e.target.value;
        renderInventoryPage();
      });
    }
  }

  // Restock action button handler exposed globally
  function triggerRestock(productId, quantity) {
    const db = window.NovaCartDB;
    const success = db.restockProduct(productId, quantity);
    if (success) {
      const prod = db.products.find(p => p.id === productId);
      showToast("Inventory Reordered", `Ordered +${quantity} units of ${prod.name}`, "success");
      
      // Update badge counts and list
      const alertDot = document.getElementById("alert-dot");
      if (alertDot) {
        alertDot.textContent = db.alerts.length;
      }

      // Re-render
      if (state.currentPage === "inventory") renderInventoryPage();
      else if (state.currentPage === "overview") renderOverviewPage();
    }
  }

  // ==========================================================================
  // PAGE ENGINE: Shipping Logistics Page
  // ==========================================================================

  function renderShippingPage() {
    const db = window.NovaCartDB;
    const colors = getThemeColors();

    const deliveredOrders = db.orders.filter(o => o.status === "Delivered");
    
    // SLA maths
    const onTimeCount = deliveredOrders.filter(o => {
      // Courier FedEx/DHL on-time is simulated high in data.js
      return o.courier !== "UPS" || (o.id.charCodeAt(5) % 2 === 0);
    }).length;
    const onTimeRate = deliveredOrders.length === 0 ? 0 : (onTimeCount / deliveredOrders.length * 100).toFixed(1);

    document.getElementById("ship-ontime").textContent = `${onTimeRate}%`;
    document.getElementById("ship-avg-days").textContent = "2.1 days";

    // 1. Dispatch courier SLA table
    let tableHTML = "";
    db.courierStats.forEach(c => {
      const statusClass = c.status === "Optimal" ? "status-delivered" : "status-pending";
      tableHTML += `
        <tr>
          <td class="text-semibold">${c.name}</td>
          <td class="font-mono">${c.avgDays} days</td>
          <td class="font-mono text-semibold text-emerald">${c.onTimeRate}%</td>
          <td>
            <div class="progress-bar-wrapper">
              <div class="progress-bar bg-purple" style="width: ${c.load};"></div>
            </div>
            <span class="text-xs muted-text mt-1 block">${c.load} system load</span>
          </td>
          <td><span class="status-pill ${statusClass}">${c.status}</span></td>
        </tr>
      `;
    });
    document.querySelector("#shipping-couriers-table tbody").innerHTML = tableHTML;

    // 2. Shipping Stages (Pie or bar chart)
    if (charts.shipPerformance) charts.shipPerformance.destroy();
    const shCtx = document.getElementById("chart-ship-performance").getContext("2d");
    
    // Status aggregates
    const shipStages = { Pending: 0, Packed: 0, Shipped: 0, "Out For Delivery": 0, Delivered: 0 };
    db.orders.forEach(o => {
      if (shipStages[o.status] !== undefined) shipStages[o.status]++;
    });

    charts.shipPerformance = new Chart(shCtx, {
      type: "bar",
      data: {
        labels: Object.keys(shipStages),
        datasets: [{
          label: "Orders count",
          data: Object.values(shipStages),
          backgroundColor: ["#f59e0b", "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981"],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { family: "Outfit" } } },
          y: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { family: "JetBrains Mono" } } }
        }
      }
    });

    // 3. Couriers averages speeds chart
    if (charts.shipCouriers) charts.shipCouriers.destroy();
    const spCtx = document.getElementById("chart-ship-couriers").getContext("2d");
    
    charts.shipCouriers = new Chart(spCtx, {
      type: "bar",
      data: {
        labels: ["FedEx", "DHL", "UPS"],
        datasets: [{
          data: [2.1, 1.8, 2.4],
          backgroundColor: ["#3b82f6", "#8b5cf6", "#10b981"],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: colors.text, font: { family: "Outfit" } } },
          y: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { family: "JetBrains Mono" } } }
        }
      }
    });
  }

  // ==========================================================================
  // PAGE ENGINE: Returns Queue Dashboard
  // ==========================================================================

  function renderReturnsPage() {
    const db = window.NovaCartDB;
    const colors = getThemeColors();

    const returnedOrders = db.orders.filter(o => o.returnRequest);
    const approved = returnedOrders.filter(o => o.returnRequest.status === "Approved");
    const rejected = returnedOrders.filter(o => o.returnRequest.status === "Rejected");
    const refundSum = approved.reduce((sum, o) => sum + o.returnRequest.refundAmount, 0);

    const totalDelivered = db.orders.filter(o => o.status === "Delivered").length;
    const returnRate = totalDelivered === 0 ? 0 : (returnedOrders.length / totalDelivered * 100).toFixed(1);

    document.getElementById("ret-total").textContent = returnedOrders.length;
    document.getElementById("ret-rate").textContent = `Return Rate: ${returnRate}%`;
    document.getElementById("ret-approved").textContent = approved.length;
    document.getElementById("ret-rejected").textContent = rejected.length;
    document.getElementById("ret-refund-amount").textContent = formatMoney(refundSum);

    // 1. Render Returns Queue Table
    let tableHTML = "";
    const activeRequests = returnedOrders.filter(o => o.returnRequest.status === "Approved" || o.returnRequest.status === "Rejected");
    // Sort recent first
    activeRequests.sort((a, b) => b.id.localeCompare(a.id));

    if (returnedOrders.length === 0) {
      tableHTML = `<tr><td colspan="5" class="text-center py-4 muted-text">No return requests currently pending processing.</td></tr>`;
    } else {
      returnedOrders.forEach(o => {
        const isPending = o.returnRequest.status !== "Approved" && o.returnRequest.status !== "Rejected";
        let actionHTML = "";
        if (isPending) {
          actionHTML = `
            <div class="flex-align gap-2">
              <button class="primary-btn btn-sm" onclick="window.app.processReturnClaim('${o.id}', 'Approved')">Approve</button>
              <button class="destructive-btn btn-sm" style="padding: 6px 12px; font-size: 12px;" onclick="window.app.processReturnClaim('${o.id}', 'Rejected')">Reject</button>
            </div>
          `;
        } else {
          const badgeClass = o.returnRequest.status === "Approved" ? "status-delivered" : "status-cancelled";
          actionHTML = `<span class="status-pill ${badgeClass}">${o.returnRequest.status}</span>`;
        }

        tableHTML += `
          <tr>
            <td class="font-mono text-bold">${o.id}</td>
            <td>${o.returnRequest.requestDate}</td>
            <td>
              <div class="text-semibold">${o.returnRequest.reason}</div>
              <div class="muted-text text-xs">${o.items.map(item => item.name).join(", ")}</div>
            </td>
            <td class="font-mono text-semibold text-rose">${formatMoney(o.returnRequest.refundAmount)}</td>
            <td>${actionHTML}</td>
          </tr>
        `;
      });
    }
    elements.returnsQueueTableBody.innerHTML = tableHTML;

    // 2. Reasons Chart
    if (charts.returnsReasons) charts.returnsReasons.destroy();
    const reCtx = document.getElementById("chart-returns-reasons").getContext("2d");
    
    const reasonMap = {};
    returnedOrders.forEach(o => {
      reasonMap[o.returnRequest.reason] = (reasonMap[o.returnRequest.reason] || 0) + 1;
    });

    charts.returnsReasons = new Chart(reCtx, {
      type: "pie",
      data: {
        labels: Object.keys(reasonMap),
        datasets: [{
          data: Object.values(reasonMap),
          backgroundColor: ["#ef4444", "#8b5cf6", "#f59e0b", "#3b82f6", "#10b981"],
          borderWidth: 2,
          borderColor: document.documentElement.classList.contains("light") ? "#ffffff" : "#0d0d12"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: colors.text, font: { family: "Outfit", size: 11 }, boxWidth: 10 }
          }
        }
      }
    });
  }

  // Process returns claim
  function processReturnClaim(orderId, action) {
    const db = window.NovaCartDB;
    const order = db.orders.find(o => o.id === orderId);
    if (order && order.returnRequest) {
      order.returnRequest.status = action;
      if (action === "Approved") {
        order.status = "Cancelled"; // cancelled represents refund status
        showToast("Claim Approved", `Refund processed for order ${orderId}`, "success");
      } else {
        showToast("Claim Rejected", `Return request rejected for order ${orderId}`, "warning");
      }
      
      // Re-render Returns
      renderReturnsPage();
    }
  }

  // ==========================================================================
  // PAGE ENGINE: Marketing Campaigns Page
  // ==========================================================================

  function renderMarketingPage() {
    const db = window.NovaCartDB;
    const colors = getThemeColors();

    // Render table
    let tableHTML = "";
    db.marketingCampaigns.forEach(c => {
      const statusClass = c.status === "Active" ? "status-delivered" : "status-pending";
      tableHTML += `
        <tr>
          <td class="text-semibold">${c.name}</td>
          <td><span class="badge bg-blue text-xs font-medium relative top-0 right-0">${c.channel}</span></td>
          <td class="font-mono">${formatMoney(c.spend)}</td>
          <td class="font-mono text-semibold">${c.conversions} conversions</td>
          <td class="font-mono text-bold text-emerald">${c.roi}x</td>
          <td><span class="status-pill ${statusClass}">${c.status}</span></td>
        </tr>
      `;
    });
    document.querySelector("#marketing-campaigns-table tbody").innerHTML = tableHTML;

    // 1. Traffic sources conversions horizontal bar
    if (charts.marketingSources) charts.marketingSources.destroy();
    const mrCtx = document.getElementById("chart-marketing-sources").getContext("2d");
    
    const sources = db.trafficSources.map(s => s.source);
    const conversions = db.trafficSources.map(s => s.conversions);

    charts.marketingSources = new Chart(mrCtx, {
      type: "bar",
      data: {
        labels: sources,
        datasets: [{
          data: conversions,
          backgroundColor: "#8b5cf6",
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { family: "JetBrains Mono" } } },
          y: { grid: { display: false }, ticks: { color: colors.text, font: { family: "Outfit" } } }
        }
      }
    });

    // 2. Campaigns ROI comparison vertical bar
    if (charts.marketingRoi) charts.marketingRoi.destroy();
    const roiCtx = document.getElementById("chart-marketing-roi").getContext("2d");
    
    const campNames = db.marketingCampaigns.map(c => c.name);
    const campROIs = db.marketingCampaigns.map(c => c.roi);

    charts.marketingRoi = new Chart(roiCtx, {
      type: "bar",
      data: {
        labels: campNames,
        datasets: [{
          data: campROIs,
          backgroundColor: "#3b82f6",
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: colors.text, font: { family: "Outfit" }, maxRotation: 15 } },
          y: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { family: "JetBrains Mono" }, callback: val => `${val}x` } }
        }
      }
    });
  }

  // ==========================================================================
  // PAGE ENGINE: Financial Performance Page
  // ==========================================================================

  function renderFinancialPage() {
    const db = window.NovaCartDB;
    const colors = getThemeColors();

    const sumFinance = (key) => db.historicalData.reduce((sum, h) => sum + h[key], 0);

    const grossRev = sumFinance("revenue");
    const costs = sumFinance("expenses");
    const taxes = sumFinance("taxes");
    const cashflow = sumFinance("cashFlow");

    document.getElementById("fin-gross-rev").textContent = formatMoney(grossRev);
    document.getElementById("fin-operating-cost").textContent = formatMoney(costs);
    document.getElementById("fin-taxes").textContent = formatMoney(taxes);
    document.getElementById("fin-cashflow").textContent = formatMoney(cashflow);

    // 1. Stacked Bar Chart Revenue vs Expense
    if (charts.finRevExp) charts.finRevExp.destroy();
    const feCtx = document.getElementById("chart-fin-rev-exp").getContext("2d");
    
    const months = db.historicalData.map(h => h.month);
    const revenues = db.historicalData.map(h => h.revenue);
    const expenses = db.historicalData.map(h => h.expenses);

    charts.finRevExp = new Chart(feCtx, {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          {
            label: "Gross Income ($)",
            data: revenues,
            backgroundColor: "#3b82f6",
            borderRadius: 4
          },
          {
            label: "Total Expenses ($)",
            data: expenses,
            backgroundColor: "#ef4444",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: { color: colors.text, font: { family: "Outfit" } }
          }
        },
        scales: {
          x: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { family: "Outfit" } } },
          y: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { family: "JetBrains Mono" }, callback: val => `$${Math.round(val / 1000)}k` } }
        }
      }
    });

    // 2. Expenses Allocation Doughnut
    if (charts.finExpenses) charts.finExpenses.destroy();
    const exCtx = document.getElementById("chart-fin-expenses").getContext("2d");
    
    const cogsSum = db.orders.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + o.costAmount, 0);
    const operSum = sumFinance("operatingCost");
    const taxSum = sumFinance("taxes");
    const refundSum = sumFinance("refunds");

    charts.finExpenses = new Chart(exCtx, {
      type: "doughnut",
      data: {
        labels: ["Cost of Goods", "Operating Expenses", "Taxes Paid", "Customer Refunds"],
        datasets: [{
          data: [cogsSum, operSum, taxSum, refundSum],
          backgroundColor: ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"],
          borderWidth: 2,
          borderColor: document.documentElement.classList.contains("light") ? "#ffffff" : "#0d0d12"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: colors.text, font: { family: "Outfit", size: 11 }, boxWidth: 10 }
          }
        },
        cutout: "70%"
      }
    });
  }

  // ==========================================================================
  // Notifications Drawer Renderer
  // ==========================================================================

  function renderAlertsDrawer() {
    const db = window.NovaCartDB;
    const body = elements.alertsBody;
    if (!body) return;

    let html = "";
    if (db.alerts.length === 0) {
      html = `<div class="muted-text text-center text-xs py-4">No new system warnings or logs.</div>`;
    } else {
      db.alerts.forEach(a => {
        let iconName = "info";
        let iconClass = "text-blue bg-blue-bg";
        if (a.type === "success") { iconName = "check-circle"; iconClass = "text-emerald bg-emerald-bg"; }
        else if (a.type === "warning") { iconName = "alert-triangle"; iconClass = "text-amber bg-amber-bg"; }
        else if (a.type === "error") { iconName = "x-circle"; iconClass = "text-rose bg-rose-bg"; }

        html += `
          <div class="alert-item">
            <div class="insight-icon-box ${iconClass}" style="margin-top: 2px;">
              <i data-lucide="${iconName}"></i>
            </div>
            <div>
              <div class="text-semibold text-xs" style="color: var(--text-main);">${a.message}</div>
              <div class="muted-text text-xs font-mono mt-1">${a.date}</div>
            </div>
          </div>
        `;
      });
    }

    body.innerHTML = html;
    lucide.createIcons();
    
    // Clear notification dot
    elements.alertDot.style.display = "none";
  }

  // ==========================================================================
  // Overview Dashboard Events
  // ==========================================================================

  function setupOverviewEvents() {
    const filterContainer = document.getElementById("insights-filter");
    if (filterContainer) {
      filterContainer.addEventListener("click", (e) => {
        const item = e.target.closest(".segmented-item");
        if (!item) return;
        
        filterContainer.querySelectorAll(".segmented-item").forEach(btn => btn.classList.remove("active"));
        item.classList.add("active");
        
        state.overview = state.overview || {};
        state.overview.insightsFilter = item.getAttribute("data-filter");
        renderAIInsightsPanel();
      });
    }
  }

  // ==========================================================================
  // Global Theme Setup & Toggle
  // ==========================================================================

  function setupTheme() {
    if (elements.themeToggle) {
      elements.themeToggle.addEventListener("click", () => {
        const docEl = document.documentElement;
        if (docEl.classList.contains("dark")) {
          docEl.classList.remove("dark");
          docEl.classList.add("light");
          state.theme = "light";
        } else {
          docEl.classList.remove("light");
          docEl.classList.add("dark");
          state.theme = "dark";
        }
        
        // Re-render current page to refresh chart options matching the theme
        renderPageData(state.currentPage);
      });
    }
  }

  // ==========================================================================
  // App Initialization
  // ==========================================================================

  function init() {
    initElements();
    updateTime();
    setInterval(updateTime, 1000);
    
    setupTheme();
    setupOverviewEvents();
    setupNavigation();
    setupDrawers();
    setupOrdersEvents();
    setupInventoryEvents();
    setupSalesEvents();

    // Default route
    navigateTo("overview");
  }

  // ==========================================================================
  // EXPORT UTILITIES: CSV & PDF GENERATION
  // ==========================================================================
  function exportCSV(filename, headers, rows) {
    let csvContent = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(cell => {
        const str = (cell === null || cell === undefined) ? "" : String(cell);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Export Successful", `Downloaded ${filename}`, "success");
  }

  function exportPDF(title, headers, rows) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Blocked by Pop-up Blocker", "Please allow pop-ups for PDF generation.", "warning");
      return;
    }
    
    let tableHeadersHTML = headers.map(h => `<th>${h}</th>`).join("");
    let tableRowsHTML = rows.map(row => {
      return `<tr>${row.map(cell => `<td>${cell === null || cell === undefined ? "" : cell}</td>`).join("")}</tr>`;
    }).join("");
    
    const isLight = document.documentElement.classList.contains("light");
    const bg = isLight ? "#ffffff" : "#0e0e12";
    const text = isLight ? "#1e293b" : "#f8fafc";
    const border = isLight ? "#e2e8f0" : "#334155";
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: ${bg};
              color: ${text};
              padding: 40px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: 800;
              color: #3b82f6;
            }
            .meta {
              font-size: 12px;
              opacity: 0.7;
              text-align: right;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid ${border};
              padding: 10px 12px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: rgba(59, 130, 246, 0.08);
              font-weight: 600;
            }
            tr:nth-child(even) {
              background-color: rgba(255, 255, 255, 0.02);
            }
            .footer {
              margin-top: 50px;
              font-size: 10px;
              opacity: 0.5;
              text-align: center;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">NovaCart Analytics</div>
              <h2>${title}</h2>
            </div>
            <div class="meta">
              <div>Generated by: Stalin Danvers</div>
              <div>Date: ${new Date().toLocaleString()}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>${tableHeadersHTML}</tr>
            </thead>
            <tbody>
              ${tableRowsHTML}
            </tbody>
          </table>
          <div class="footer">
            NovaCart Premium Analytics Dashboard. Confidential. Page 1 of 1
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function exportOrdersCSV() {
    const db = window.NovaCartDB;
    const filtered = db.orders.filter(o => {
      const searchLower = state.orders.search.toLowerCase();
      const matchesSearch = o.id.toLowerCase().includes(searchLower) || o.customerName.toLowerCase().includes(searchLower);
      const matchesStatus = state.orders.filterStatus === "All" || o.status === state.orders.filterStatus;
      const matchesCategory = state.orders.filterCategory === "All" || o.category === state.orders.filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });

    const headers = ["Order ID", "Customer", "Date", "Total Amount", "Category", "Status"];
    const rows = filtered.map(o => [o.id, o.customerName, o.date, o.totalAmount, o.category, o.status]);
    exportCSV("novacart_orders_report.csv", headers, rows);
  }

  function exportOrdersPDF() {
    const db = window.NovaCartDB;
    const filtered = db.orders.filter(o => {
      const searchLower = state.orders.search.toLowerCase();
      const matchesSearch = o.id.toLowerCase().includes(searchLower) || o.customerName.toLowerCase().includes(searchLower);
      const matchesStatus = state.orders.filterStatus === "All" || o.status === state.orders.filterStatus;
      const matchesCategory = state.orders.filterCategory === "All" || o.category === state.orders.filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });

    const headers = ["Order ID", "Customer", "Date", "Total Amount", "Category", "Status"];
    const rows = filtered.map(o => [o.id, o.customerName, o.date, formatMoney(o.totalAmount), o.category, o.status]);
    exportPDF("Orders Management Report", headers, rows);
  }

  function exportInventoryCSV() {
    const db = window.NovaCartDB;
    const filtered = db.products.filter(p => {
      const search = state.inventory.search.toLowerCase();
      return p.name.toLowerCase().includes(search) || p.id.toLowerCase().includes(search);
    });

    const headers = ["SKU", "Product Name", "Category", "Stock Level", "Price", "Supplier"];
    const rows = filtered.map(p => [p.id, p.name, p.category, p.stock, p.price, p.supplier]);
    exportCSV("novacart_warehouse_inventory.csv", headers, rows);
  }

  function exportInventoryPDF() {
    const db = window.NovaCartDB;
    const filtered = db.products.filter(p => {
      const search = state.inventory.search.toLowerCase();
      return p.name.toLowerCase().includes(search) || p.id.toLowerCase().includes(search);
    });

    const headers = ["SKU", "Product Name", "Category", "Stock Level", "Supplier", "Status"];
    const rows = filtered.map(p => {
      let status = "In Stock";
      if (p.stock === 0) status = "Out of Stock";
      else if (p.stock < 20) status = "Low Stock";
      return [p.id, p.name, p.category, `${p.stock} units`, p.supplier, status];
    });
    exportPDF("Warehouse Inventory Stock Registry", headers, rows);
  }

  function triggerBulkRestock() {
    const db = window.NovaCartDB;
    const lowItems = db.products.filter(p => p.stock < 20);
    if (lowItems.length === 0) return;
    
    let count = 0;
    lowItems.forEach(p => {
      const qty = p.stock === 0 ? 50 : 30;
      db.restockProduct(p.id, qty);
      count++;
    });
    
    showToast("Bulk Restock Complete", `Ordered stock replenishment for ${count} products.`, "success");
    renderInventoryPage();
  }

  // Run on page load
  window.addEventListener("DOMContentLoaded", init);

  // Expose global methods for HTML triggers
  window.app = {
    navigateTo,
    triggerRestock,
    triggerBulkRestock,
    processReturnClaim,
    exportOrdersCSV,
    exportOrdersPDF,
    exportInventoryCSV,
    exportInventoryPDF
  };
})();
