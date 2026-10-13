/**
 * data.js - Deterministic Mock Database for NovaCart
 * Uses a seed-based random generator to create realistic, consistent e-commerce metrics.
 */

(function () {
  // Deterministic random number generator (LCG)
  function createRandom(seed) {
    let s = seed;
    return function (min, max) {
      s = (s * 9301 + 49297) % 233280;
      const rnd = s / 233280;
      if (min === undefined) return rnd;
      if (max === undefined) return rnd * min;
      return Math.floor(rnd * (max - min + 1)) + min;
    };
  }

  const rng = createRandom(1337); // Seed with a fixed prime

  // Categories
  const CATEGORIES = [
    "Electronics", "Smartphones", "Laptops", "Fashion",
    "Shoes", "Watches", "Home Appliances", "Furniture",
    "Kitchen Products", "Beauty Products", "Sports Equipment",
    "Grocery", "Accessories"
  ];

  // Raw Products Definitions
  const PRODUCT_TEMPLATES = [
    { name: "Super OLED 4K TV", category: "Electronics", basePrice: 899, cost: 520, supplier: "Apex Electronics", rating: 4.7 },
    { name: "Noise Cancelling Earbuds", category: "Electronics", basePrice: 149, cost: 65, supplier: "Apex Electronics", rating: 4.5 },
    { name: "Premium Bluetooth Speaker", category: "Electronics", basePrice: 99, cost: 40, supplier: "Sonic Waves Co.", rating: 4.3 },
    { name: "Vortex Smartphone Pro", category: "Smartphones", basePrice: 999, cost: 600, supplier: "Vortex Mobile Inc.", rating: 4.8 },
    { name: "Lite Phone 12", category: "Smartphones", basePrice: 499, cost: 280, supplier: "Vortex Mobile Inc.", rating: 4.1 },
    { name: "ApexBook Pro 16", category: "Laptops", basePrice: 1899, cost: 1200, supplier: "Apex Computer Co.", rating: 4.9 },
    { name: "Vapor ZenBook Air", category: "Laptops", basePrice: 1099, cost: 720, supplier: "Zenith Tech", rating: 4.6 },
    { name: "Classic Leather Jacket", category: "Fashion", basePrice: 249, cost: 100, supplier: "Urban Stitch Co.", rating: 4.4 },
    { name: "Slim Fit Stretch Jeans", category: "Fashion", basePrice: 59, cost: 20, supplier: "Urban Stitch Co.", rating: 4.2 },
    { name: "Merino Woolen Sweater", category: "Fashion", basePrice: 89, cost: 35, supplier: "Global Threads Ltd.", rating: 4.5 },
    { name: "UltraBounce Running Shoes", category: "Shoes", basePrice: 129, cost: 50, supplier: "SoleFit Athletics", rating: 4.6 },
    { name: "Classic Leather Boots", category: "Shoes", basePrice: 179, cost: 75, supplier: "SoleFit Athletics", rating: 4.4 },
    { name: "Vanguard Smartwatch 3", category: "Watches", basePrice: 299, cost: 140, supplier: "Timepiece Tech", rating: 4.5 },
    { name: "Chrono Classic Watch", category: "Watches", basePrice: 199, cost: 80, supplier: "Legacy Watchmakers", rating: 4.7 },
    { name: "RoboVac Smart Vacuum", category: "Home Appliances", basePrice: 349, cost: 180, supplier: "CleanHome Solutions", rating: 4.2 },
    { name: "TrueHEPA Air Purifier", category: "Home Appliances", basePrice: 189, cost: 95, supplier: "CleanHome Solutions", rating: 4.5 },
    { name: "Barista Espresso Station", category: "Home Appliances", basePrice: 599, cost: 310, supplier: "Apex Kitchenware", rating: 4.8 },
    { name: "AeroFry Air Fryer XL", category: "Kitchen Products", basePrice: 129, cost: 60, supplier: "Apex Kitchenware", rating: 4.6 },
    { name: "MultiBlender Pro Combo", category: "Kitchen Products", basePrice: 89, cost: 38, supplier: "Apex Kitchenware", rating: 4.3 },
    { name: "ErgoComfort Office Chair", category: "Furniture", basePrice: 279, cost: 130, supplier: "DecoSpace Interiors", rating: 4.5 },
    { name: "Dual-Motor Standing Desk", category: "Furniture", basePrice: 429, cost: 200, supplier: "DecoSpace Interiors", rating: 4.7 },
    { name: "GlowRadiance Skin Serum", category: "Beauty Products", basePrice: 45, cost: 12, supplier: "Aura Essentials", rating: 4.6 },
    { name: "Ionic Hair Dryer Pro", category: "Beauty Products", basePrice: 79, cost: 30, supplier: "Aura Essentials", rating: 4.3 },
    { name: "FlexiCore Pro Yoga Mat", category: "Sports Equipment", basePrice: 39, cost: 12, supplier: "Pulse Athletics", rating: 4.4 },
    { name: "Adjustable Dumbbell Set", category: "Sports Equipment", basePrice: 229, cost: 110, supplier: "Pulse Athletics", rating: 4.7 },
    { name: "HydroSprint Hydration Pack", category: "Sports Equipment", basePrice: 49, cost: 18, supplier: "Pulse Athletics", rating: 4.2 },
    { name: "Dark Roast Coffee Beans 1kg", category: "Grocery", basePrice: 28, cost: 10, supplier: "Organica Foods", rating: 4.8 },
    { name: "Premium Green Tea Box", category: "Grocery", basePrice: 18, cost: 6, supplier: "Organica Foods", rating: 4.6 },
    { name: "Classic Leather Wallet", category: "Accessories", basePrice: 49, cost: 18, supplier: "Urban Stitch Co.", rating: 4.5 },
    { name: "HardShell Laptop Sleeve", category: "Accessories", basePrice: 34, cost: 12, supplier: "Zenith Tech", rating: 4.3 },
    { name: "Polarized Aviator Sunglasses", category: "Accessories", basePrice: 79, cost: 30, supplier: "Global Threads Ltd.", rating: 4.4 }
  ];

  const CUSTOMER_NAMES = [
    "Alex Rivera", "Sophia Bennett", "Liam Henderson", "Emma Rodriguez", "Jackson Davies",
    "Olivia Campbell", "Noah Carter", "Ava Mitchell", "Lucas Patel", "Isabella Flores",
    "Ethan Ramirez", "Mia Jenkins", "Mason Gentry", "Charlotte Foster", "William Kim",
    "Amelia Brooks", "James Sullivan", "Harper Vance", "Benjamin Graham", "Evelyn Ward",
    "Logan Wright", "Abigail Torres", "Alexander Cooper", "Emily Hayes", "Daniel Murphy",
    "Elizabeth Gray", "Michael Fisher", "Sofia Bryant", "Henry Long", "Avery Russell",
    "Sebastian Price", "Chloe Simmons", "Jack Perry", "Layla Butler", "Owen Barnes",
    "Zoey Coleman", "Matthew Ross", "Grace Coleman", "Wyatt Sanders", "Victoria Powell",
    "Luke Patterson", "Lily Jordan", "Gabriel Wood", "Natalie Marshall", "David Bennett",
    "Zoe Hughes", "Carter Washington", "Aubrey Harrison", "Julian Fisher", "Stella Ellis"
  ];

  const COURIERS = ["FedEx", "DHL", "UPS"];
  const STATUSES = ["Delivered", "Delivered", "Delivered", "Shipped", "Pending", "Cancelled"];
  const RETURN_REASONS = [
    "Defective / Damaged", "Wrong Size / Fit", "Didn't Like Item",
    "Late Delivery", "Incorrect Item Sent"
  ];

  // Helper to format date
  function formatDate(date) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date(date);
    const m = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, "0");
    const y = d.getFullYear();
    return `${m} ${day}, ${y}`;
  }

  // 1. Build Products Database
  const products = PRODUCT_TEMPLATES.map((p, idx) => ({
    id: `PRD-${1000 + idx}`,
    name: p.name,
    category: p.category,
    price: p.basePrice,
    cost: p.cost,
    supplier: p.supplier,
    rating: p.rating,
    stock: rng(5, 120), // stock level
    salesCount: 0,
    returnsCount: 0,
    revenue: 0
  }));

  // 2. Build Customers Database
  const customers = CUSTOMER_NAMES.map((name, idx) => {
    const spendingTier = idx < 5 ? "VIP" : idx < 20 ? "Loyal" : "Standard";
    return {
      id: `CST-${5000 + idx}`,
      name: name,
      email: `${name.toLowerCase().replace(" ", ".")}@novacart.com`,
      location: idx % 4 === 0 ? "California, USA" : idx % 4 === 1 ? "New York, USA" : idx % 4 === 2 ? "London, UK" : "Toronto, Canada",
      spendingTier: spendingTier,
      totalSpent: 0,
      ordersCount: 0,
      joinDate: formatDate(new Date(2025, rng(0, 11), rng(1, 28)))
    };
  });

  // 3. Generate Historical Months
  // Past 12 Months: July 2025 to June 2026
  const historicalData = [];
  const startYear = 2025;
  const startMonth = 6; // July (0-indexed is 6)
  for (let i = 0; i < 12; i++) {
    const d = new Date(startYear, startMonth + i, 1);
    const monthsName = ["Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26"];
    // Base math for business growth
    const multiplier = 1 + (i * 0.08); // Steady 8% compounding monthly growth
    const baseRevenue = rng(45000, 55000) * multiplier;
    const baseExpenses = baseRevenue * rng(60, 68) / 100;
    const grossProfit = baseRevenue - baseExpenses;
    const refunds = baseRevenue * rng(2, 5) / 100;
    const taxes = grossProfit * 0.15; // 15% estimated corporate tax
    const netProfit = grossProfit - refunds - taxes;

    historicalData.push({
      month: monthsName[i],
      sales: Math.floor(rng(300, 400) * multiplier),
      revenue: Math.round(baseRevenue),
      expenses: Math.round(baseExpenses),
      profit: Math.round(netProfit),
      taxes: Math.round(taxes),
      refunds: Math.round(refunds),
      operatingCost: Math.round(baseExpenses * 0.4), // 40% of expenses are operating costs
      cashFlow: Math.round(netProfit + (baseExpenses * 0.1)) // simple cash flow estimation
    });
  }

  // 4. Generate Orders (Deterministic 180 orders in the last 6 months)
  const orders = [];
  const startDate = new Date(2026, 0, 1); // Jan 1, 2026
  const endDate = new Date(2026, 6, 3);   // Today Jul 3, 2026

  for (let i = 0; i < 180; i++) {
    // Generate order date spread out in the timeline
    const orderDateMs = startDate.getTime() + (rng() * (endDate.getTime() - startDate.getTime()));
    const orderDate = new Date(orderDateMs);
    const dateStr = formatDate(orderDate);

    // Pick customer
    const custIdx = rng(0, customers.length - 1);
    const customer = customers[custIdx];

    // Pick 1-3 random products
    const itemsCount = rng(1, 3);
    const orderItems = [];
    let orderTotal = 0;
    let orderCost = 0;
    
    // Choose primary product's category for order cataloging
    let primaryCategory = "";

    for (let k = 0; k < itemsCount; k++) {
      const prodIdx = rng(0, products.length - 1);
      const product = products[prodIdx];
      
      // Check duplicate in order items
      if (orderItems.some(item => item.productId === product.id)) continue;

      const quantity = rng(1, product.category === "Laptops" || product.category === "Smartphones" ? 1 : 2);
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        cost: product.cost,
        quantity: quantity
      });
      orderTotal += product.price * quantity;
      orderCost += product.cost * quantity;
      
      if (k === 0) {
        primaryCategory = product.category;
      }

      // Record count on product
      product.salesCount += quantity;
      product.revenue += product.price * quantity;
    }

    // Determine Status
    // Recent orders (last 3 days) are more likely to be pending/shipped
    let status = STATUSES[rng(0, STATUSES.length - 1)];
    const daysAgo = (endDate.getTime() - orderDateMs) / (1000 * 60 * 60 * 24);
    if (daysAgo < 2) {
      status = rng(0, 1) === 0 ? "Pending" : "Shipped";
    }

    const courier = COURIERS[rng(0, COURIERS.length - 1)];
    
    // Build Timeline Timestamps
    const timeline = [];
    const createdTime = new Date(orderDate);
    timeline.push({ status: "Created", date: formatDate(createdTime), time: "10:32 AM", done: true });

    if (status !== "Pending" && status !== "Cancelled") {
      const packedTime = new Date(createdTime.getTime() + rng(4, 12) * 60 * 60 * 1000); // 4-12 hrs later
      timeline.push({ status: "Packed", date: formatDate(packedTime), time: "04:15 PM", done: true });

      const shippedTime = new Date(packedTime.getTime() + rng(8, 24) * 60 * 60 * 1000); // 8-24 hrs later
      timeline.push({ status: "Shipped", date: formatDate(shippedTime), time: "09:40 AM", done: true });

      if (status === "Delivered") {
        const delivTime = new Date(shippedTime.getTime() + rng(24, 72) * 60 * 60 * 1000); // 1-3 days later
        timeline.push({ status: "Out For Delivery", date: formatDate(delivTime), time: "08:15 AM", done: true });
        timeline.push({ status: "Delivered", date: formatDate(delivTime), time: "02:30 PM", done: true });
      } else {
        timeline.push({ status: "Out For Delivery", date: "", time: "", done: false });
        timeline.push({ status: "Delivered", date: "", time: "", done: false });
      }
    } else if (status === "Pending") {
      timeline.push({ status: "Packed", date: "", time: "", done: false });
      timeline.push({ status: "Shipped", date: "", time: "", done: false });
      timeline.push({ status: "Out For Delivery", date: "", time: "", done: false });
      timeline.push({ status: "Delivered", date: "", time: "", done: false });
    } else if (status === "Cancelled") {
      timeline.push({ status: "Cancelled", date: dateStr, time: "11:00 AM", done: true });
    }

    // Returns Dashboard integration
    let returnRequest = null;
    if (status === "Delivered" && rng(1, 100) <= 8) { // 8% return rate
      const reasonIdx = rng(0, RETURN_REASONS.length - 1);
      const isApproved = rng(1, 100) > 20; // 80% approval
      returnRequest = {
        reason: RETURN_REASONS[reasonIdx],
        refundAmount: orderTotal,
        status: isApproved ? "Approved" : "Rejected",
        requestDate: formatDate(new Date(orderDateMs + (4 * 24 * 60 * 60 * 1000))) // 4 days after
      };
      
      // Update product return counts
      orderItems.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          prod.returnsCount += item.quantity;
        }
      });
    }

    const orderId = `ORD-${2250 + i}`;
    orders.push({
      id: orderId,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      date: dateStr,
      rawDate: orderDate,
      totalAmount: orderTotal,
      costAmount: orderCost,
      status: status,
      courier: courier,
      shippingMethod: rng(0, 1) === 0 ? "Express Shipping" : "Home Delivery",
      items: orderItems,
      timeline: timeline,
      returnRequest: returnRequest,
      category: primaryCategory
    });

    // Accumulate customer spent
    if (status !== "Cancelled") {
      customer.totalSpent += orderTotal;
      customer.ordersCount += 1;
    }
  }

  // Sort orders descending by raw date
  orders.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

  // 5. Traffic Sources & Marketing
  const trafficSources = [
    { source: "Google", visitors: 42500, conversions: 1250, bounceRate: 42.4, ctr: 3.5, spend: 3200, revenue: 18500 },
    { source: "Facebook", visitors: 35800, conversions: 980, bounceRate: 51.2, ctr: 2.1, spend: 2800, revenue: 14200 },
    { source: "Instagram", visitors: 28400, conversions: 1120, bounceRate: 38.6, ctr: 4.8, spend: 2400, revenue: 19800 },
    { source: "YouTube", visitors: 15300, conversions: 450, bounceRate: 45.1, ctr: 1.8, spend: 1500, revenue: 6500 },
    { source: "Email Newsletter", visitors: 12400, conversions: 780, bounceRate: 25.8, ctr: 12.4, spend: 400, revenue: 11200 },
    { source: "Direct", visitors: 18900, conversions: 910, bounceRate: 28.5, ctr: 0.0, spend: 0, revenue: 15600 }
  ];

  // Marketing campaigns
  const marketingCampaigns = [
    { name: "Summer Electronics Fest", channel: "Instagram", spend: 1200, conversions: 480, roi: 3.2, status: "Active" },
    { name: "Back to School Apparel", channel: "Facebook", spend: 1500, conversions: 520, roi: 2.4, status: "Active" },
    { name: "Home Comforts Ads", channel: "Google", spend: 2000, conversions: 650, roi: 2.8, status: "Active" },
    { name: "Watch & Jewelry Promo", channel: "Email", spend: 200, conversions: 190, roi: 5.6, status: "Completed" }
  ];

  // 6. Courier performance stats
  const courierStats = [
    { name: "FedEx", avgDays: 2.1, onTimeRate: 94.5, load: "32%", status: "Optimal" },
    { name: "DHL", avgDays: 1.8, onTimeRate: 96.8, load: "25%", status: "Optimal" },
    { name: "UPS", avgDays: 2.4, onTimeRate: 91.2, load: "43%", status: "Normal" }
  ];

  // 7. System wide alerts generator
  const alerts = [
    { type: "warning", message: "Low stock alert: 'Vanguard Smartwatch 3' (5 remaining).", date: "Jul 03, 2026" },
    { type: "info", message: "New return request for ORD-2342 (Class Leather Jacket).", date: "Jul 03, 2026" },
    { type: "success", message: "Campaign 'Summer Electronics Fest' ROI reached 3.2x.", date: "Jul 02, 2026" }
  ];

  // Expose DB globally
  window.NovaCartDB = {
    products,
    customers,
    orders,
    historicalData,
    trafficSources,
    marketingCampaigns,
    courierStats,
    alerts,
    categories: CATEGORIES,
    
    // Add restock function to simulate data state change
    restockProduct(productId, quantity) {
      const prod = this.products.find(p => p.id === productId);
      if (prod) {
        prod.stock += quantity;
        this.alerts.unshift({
          type: "success",
          message: `Restocked ${quantity} units of '${prod.name}'. New Stock: ${prod.stock}.`,
          date: formatDate(new Date())
        });
        return true;
      }
      return false;
    }
  };
})();
