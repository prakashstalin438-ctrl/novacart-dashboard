/**
 * ai.js - Interactive AI Business Analyst simulator for NovaCart
 */

(function () {
  let chatForm, chatInput, chatLog, suggestionsContainer, clearBtn;
  let floatingTrigger, floatingContainer, floatingClose, floatingForm, floatingInput, floatingLog, floatingSuggestions;

  function initChat() {
    // 1. Page Chat Assistant
    chatForm = document.getElementById("chat-form");
    chatInput = document.getElementById("chat-input");
    chatLog = document.getElementById("chat-log-container");
    suggestionsContainer = document.getElementById("chat-suggestions");
    clearBtn = document.getElementById("chat-clear-btn");

    if (chatForm && chatInput && chatLog) {
      // Form Submit
      chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;
        
        handleUserMessage(message);
        chatInput.value = "";
      });

      // Suggestion Chips Click
      if (suggestionsContainer) {
        suggestionsContainer.addEventListener("click", (e) => {
          const chip = e.target.closest(".suggestion-chip");
          if (!chip) return;
          const text = chip.textContent.trim();
          handleUserMessage(text);
        });
      }

      // Clear Conversation
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          chatLog.innerHTML = `
            <div class="message msg-ai">
              <div class="message-bubble">
                Hi Stalin! I'm your NovaCart AI Analyst. I can query our sales logs, inventory status, couriers performance, or customer records in real time. 
                <br><br>
                What would you like to analyze today? You can select one of the quick options below or type your own question!
              </div>
            </div>
          `;
        });
      }
    }

    // 2. Floating AI Assistant Widget
    floatingTrigger = document.getElementById("floating-ai-trigger");
    floatingContainer = document.getElementById("floating-chat-container");
    floatingClose = document.getElementById("floating-chat-close-btn");
    floatingForm = document.getElementById("floating-chat-form");
    floatingInput = document.getElementById("floating-chat-input");
    floatingLog = document.getElementById("floating-chat-log");
    floatingSuggestions = document.getElementById("floating-chat-suggestions");

    if (floatingTrigger && floatingContainer) {
      // Toggle chat window
      floatingTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        floatingContainer.classList.toggle("active");
      });

      // Close chat window
      if (floatingClose) {
        floatingClose.addEventListener("click", (e) => {
          e.stopPropagation();
          floatingContainer.classList.remove("active");
        });
      }

      // Prevent window close click propagate
      floatingContainer.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      // Close when clicking elsewhere
      document.addEventListener("click", () => {
        floatingContainer.classList.remove("active");
      });

      // Form Submit
      if (floatingForm && floatingInput && floatingLog) {
        floatingForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const message = floatingInput.value.trim();
          if (!message) return;
          
          handleFloatingMessage(message);
          floatingInput.value = "";
        });
      }

      // Suggestions Click
      if (floatingSuggestions) {
        floatingSuggestions.addEventListener("click", (e) => {
          const chip = e.target.closest(".floating-suggestion-chip");
          if (!chip) return;
          const text = chip.textContent.trim();
          handleFloatingMessage(text);
        });
      }
    }
  }

  function formatMoney(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Handle messages in sequence for Page Chat
  function handleUserMessage(text) {
    appendMessage(text, "user");
    const typingBubble = showTypingIndicator();
    
    setTimeout(() => {
      typingBubble.remove();
      const responseHTML = processAIQuery(text);
      appendMessage(responseHTML, "ai");
    }, 800);
  }

  function appendMessage(content, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message msg-${sender}`;
    
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.innerHTML = content;
    
    msgDiv.appendChild(bubble);
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function showTypingIndicator() {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message msg-ai typing-indicator-wrapper";
    
    const bubble = document.createElement("div");
    bubble.className = "message-bubble muted-text text-xs";
    bubble.innerHTML = `
      <div class="flex-align gap-2">
        <i data-lucide="loader-2" class="animate-spin" style="width: 14px; height: 14px;"></i>
        <span>AI Analyst is calculating metrics...</span>
      </div>
    `;
    
    msgDiv.appendChild(bubble);
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
    
    lucide.createIcons();
    return msgDiv;
  }

  // Handle messages in sequence for Floating Chat
  function handleFloatingMessage(text) {
    appendFloatingMessage(text, "user");
    const typingBubble = showFloatingTypingIndicator();
    
    setTimeout(() => {
      typingBubble.remove();
      const responseHTML = processAIQuery(text);
      appendFloatingMessage(responseHTML, "ai");
    }, 800);
  }

  function appendFloatingMessage(content, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message msg-${sender}`;
    
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.innerHTML = content;
    
    msgDiv.appendChild(bubble);
    floatingLog.appendChild(msgDiv);
    floatingLog.scrollTop = floatingLog.scrollHeight;
  }

  function showFloatingTypingIndicator() {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message msg-ai typing-indicator-wrapper";
    
    const bubble = document.createElement("div");
    bubble.className = "message-bubble muted-text text-xs";
    bubble.innerHTML = `
      <div class="flex-align gap-2">
        <i data-lucide="loader-2" class="animate-spin" style="width: 12px; height: 12px;"></i>
        <span>AI Analyst calculating...</span>
      </div>
    `;
    
    msgDiv.appendChild(bubble);
    floatingLog.appendChild(msgDiv);
    floatingLog.scrollTop = floatingLog.scrollHeight;
    
    lucide.createIcons();
    return msgDiv;
  }

  // ==========================================================================
  // AI Query Analysis & DB Queries
  // ==========================================================================

  function processAIQuery(query) {
    const db = window.NovaCartDB;
    const lowerQuery = query.toLowerCase();

    // 1. Highest Revenue Product Category
    if (lowerQuery.includes("highest revenue") || lowerQuery.includes("revenue category") || lowerQuery.includes("top category")) {
      const catMap = {};
      db.products.forEach(p => {
        catMap[p.category] = (catMap[p.category] || 0) + p.revenue;
      });

      const totalRev = db.orders.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + o.totalAmount, 0);
      const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
      
      const topCat = sorted[0];

      let tableRows = "";
      sorted.forEach(entry => {
        const share = totalRev === 0 ? 0 : (entry[1] / totalRev * 100).toFixed(1);
        tableRows += `
          <tr>
            <td><strong>${entry[0]}</strong></td>
            <td>${formatMoney(entry[1])}</td>
            <td>${share}%</td>
          </tr>
        `;
      });

      return `
        Based on our live sales database, the **highest revenue product category** is **${topCat[0]}**, generating **${formatMoney(topCat[1])}** in sales. 
        
        Here is the revenue breakdown across all product lines:
        <table class="msg-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Revenue</th>
              <th>Share (%)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        *Recommendation: Consider expanding product catalogs under ${topCat[0]} to capture growing customer demand.*
      `;
    }

    // 2. Courier performance / courier SLA
    if (lowerQuery.includes("courier") || lowerQuery.includes("delivery") || lowerQuery.includes("shipping SLA") || lowerQuery.includes("fastest")) {
      const bestCourier = [...db.courierStats].sort((a, b) => b.onTimeRate - a.onTimeRate)[0];
      const fastestCourier = [...db.courierStats].sort((a, b) => a.avgDays - b.avgDays)[0];

      let tableRows = "";
      db.courierStats.forEach(c => {
        tableRows += `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.avgDays} days</td>
            <td>${c.onTimeRate}%</td>
            <td>${c.load}</td>
          </tr>
        `;
      });

      return `
        Logistics metrics show **${bestCourier.name}** has the best overall delivery performance with an **on-time rate of ${bestCourier.onTimeRate}%**.
        
        Meanwhile, **${fastestCourier.name}** is our fastest courier, delivering in an average of **${fastestCourier.avgDays} days**.
        
        Here are the latest dispatch courier stats:
        <table class="msg-table">
          <thead>
            <tr>
              <th>Courier</th>
              <th>Avg. Days</th>
              <th>On-Time Rate</th>
              <th>Load</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        *SLA Insight: UPS is experiencing a higher load (${db.courierStats.find(c => c.name === "UPS").load}), causing minor delays. Recommend routing higher volume through DHL.*
      `;
    }

    // 3. Restock Suggestions for Low Stock Items
    if (lowerQuery.includes("restock") || lowerQuery.includes("low stock") || lowerQuery.includes("suggest quantity")) {
      const lowStockProducts = db.products.filter(p => p.stock < 20).sort((a, b) => a.stock - b.stock);

      if (lowStockProducts.length === 0) {
        return `All products have healthy inventory levels above our threshold! No restock actions are suggested.`;
      }

      let tableRows = "";
      lowStockProducts.forEach(p => {
        const suggestion = p.stock === 0 ? 50 : 30;
        tableRows += `
          <tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.id}</td>
            <td class="${p.stock === 0 ? 'text-rose' : 'text-amber'}">${p.stock} left</td>
            <td><strong>+${suggestion}</strong></td>
          </tr>
        `;
      });

      return `
        I have analyzed our warehouse registry and identified **${lowStockProducts.length} items** running below the safety threshold (20 units).
        
        Here is the suggested reorder sheet to avoid stockouts:
        <table class="msg-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Current Stock</th>
              <th>Suggested Order</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        *Actions: You can reorder directly from the [Inventory Dashboard](file:///d:/MY%20ANTIG%20PROJECT/index.html#inventory) page by clicking the "Order" action buttons.*
      `;
    }

    // 4. Marketing ROI comparison
    if (lowerQuery.includes("marketing") || lowerQuery.includes("roi") || lowerQuery.includes("facebook") || lowerQuery.includes("google") || lowerQuery.includes("ad spend")) {
      const topCampaign = [...db.marketingCampaigns].sort((a, b) => b.roi - a.roi)[0];

      let tableRows = "";
      db.trafficSources.forEach(s => {
        const roi = s.spend === 0 ? "N/A" : `${(s.revenue / s.spend).toFixed(1)}x`;
        tableRows += `
          <tr>
            <td><strong>${s.source}</strong></td>
            <td>${formatMoney(s.spend)}</td>
            <td>${formatMoney(s.revenue)}</td>
            <td><strong>${roi}</strong></td>
          </tr>
        `;
      });

      return `
        Marketing channel audits show that **Instagram** is delivering our highest return, followed closely by **Google Ads**. 
        Our top performing campaign is **${topCampaign.name}** on **${topCampaign.channel}** with a **${topCampaign.roi}x ROAS** (Return on Ad Spend).
        
        Here is the channel performance summary:
        <table class="msg-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Spend</th>
              <th>Revenue Generated</th>
              <th>ROAS</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        *Campaign Tip: Direct and Email newsletters represent organic, zero-ad-spend traffic generating highly profitable conversions. Consider building up our email subscriber lists.*
      `;
    }

    // 5. Overall General Summary Fallback
    const validOrders = db.orders.filter(o => o.status !== "Cancelled");
    const grossRev = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const activeCust = db.customers.filter(c => c.ordersCount > 0).length;

    return `
      I can help you query specific parts of NovaCart database! I didn't quite catch the metrics you wanted, but here is a quick snapshot of the store performance:
      
      - **Total Orders:** ${db.orders.length}
      - **Gross Store Revenue:** ${formatMoney(grossRev)}
      - **Active Registered Customers:** ${activeCust}
      
      Try asking one of these questions:
      1. *"What is our highest revenue product category?"*
      2. *"Which courier has the best delivery performance?"*
      3. *"Suggest restock quantities for low stock items."*
      4. *"Summarize marketing ROI for Google vs. Facebook."*
    `;
  }

  // Load chat on DOM ready
  window.addEventListener("DOMContentLoaded", initChat);
})();
