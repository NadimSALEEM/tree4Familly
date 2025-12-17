// --- GLOBAL STATE ---
let allMenuItems = [];     // Stores all data from JSON
let currentVenue = 'res1'; // Default start: Restaurant 1

// --- 1. CONFIG: ICONS & EMOJIS ---
const categoryIcons = {
  "سندويشات": "🥪",
  "بيتزا": "🍕",
  "وجبات": "🍽️",
  "مشروبات غازية": "🥤",
  "مشروبات ساخنة": "☕",
  "مشروبات": "🥤",
  "حلويات": "🍰",
  "مقبلات": "🍟",
  "وجبات غربية": "🍖",
  "default": "🍴"
};

const itemKeywords = {
  // --- 🧀 The Cheesy & Special Ones ---
  "تشيز": "🍔🧀", "أطراف جبنة": "🍕🧀✨", "جبن": "🧀", "بيض": "🍔🍳", "ماسترد": "🍯🍗",

  // --- 🍕 Pizzas ---
  "خضار": "🍕🥦", "مارغريتا": "🍕🌿", "ببروني": "🍕🥓", "لحوم": "🍕🥩", "بيتزا": "🍕",

  // --- 🔥 Spicy & Sandwiches ---
  "زنجر": "🍗🔥", "سبايسي": "🌶️🍗", "مكسيكانو": "🌮🔥", "فاهيتا": "🌮🫑", 
  "فرانسيسكو": "🥖🍄", "سوبريم": "🌯🧀", "شيش": "🍢", "طوشكا": "🥙🥩", 
  "مسخن": "🥙🧅", "شاورما": "🌯🔥", "shawarma": "🌯🔥",

  // --- 🍗 Fried Chicken ---
  "كنتاكي": "🍗✨", "كرسبي": "🥖🍗", "سكالوب": "🍗🥨", "برغر": "🍔", "burger": "🍔",

  // --- 🥔 Sides & Meals ---
  "بطاطا": "🍟", "fries": "🍟", "وجبة": "🍽️", "دايت": "🥗💪", "رياضية": "🏋️🥗", "منسف": "🍚🍖",

  // --- 🥤 Drinks ---
  "سفن": "🍋🥤", "فانتا": "🍊🥤", "عيران": "🥛🧂", "كولا": "🥤🧊", "بيبسي": "🥤🧊", 
  "عصير": "🍹🍊", "ماء": "💧", "مياه": "💧", "نسكافيه": "☕🥛", "شاي": "🫖", "زهورات": "🌿🫖",

  // --- 🍰 Desserts ---
  "كنافة": "🍮🍯", "وافل": "🧇🍫", "ايس": "🍦", "بوظة": "🍦"
};

// --- HELPER FUNCTIONS ---
const getItemIcon = (name, category) => {
  const n = name.toLowerCase();
  for (const [key, icon] of Object.entries(itemKeywords)) {
    if (n.includes(key)) return icon;
  }
  return categoryIcons[category] || categoryIcons["default"];
};

const formatPrice = (p) => {
  const n = Number(p);
  if (Number.isFinite(n)) return `${n.toFixed(0)} ل.س`; 
  return `${p}`;
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);


// --- MAIN LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("menu-container");

  // Load Data Once
  fetch("menu.json?v=" + new Date().getTime())
    .then(response => {
        if (!response.ok) throw new Error("Could not load menu");
        return response.json();
    })
    .then(data => {
        allMenuItems = data; // Save data globally
        renderApp();         // Initial Render
    })
    .catch(err => {
        container.innerHTML = `<div class="empty">Error loading menu: ${err.message}</div>`;
    });
});

// --- VENUE SWITCHER (Called by HTML Buttons) ---
function switchVenue(venueId) {
    currentVenue = venueId;
    document.body.className = venueId;
    
    // Update Buttons UI (Visual Active State)
    document.querySelectorAll('.venue-btn').forEach(btn => {
        btn.classList.remove('active');
        // Check if the button's onclick contains the venueId
        if(btn.getAttribute('onclick').includes(venueId)) {
            btn.classList.add('active');
        }
    });

    // Re-render the menu
    renderApp();
}

// --- RENDER APP ---
function renderApp() {
    const container = document.getElementById("menu-container");
    const navContainer = document.getElementById("nav-list");
    
    // Clear current view
    container.innerHTML = "";
    navContainer.innerHTML = "";

    // 1. FILTER: Get items for current Venue ONLY
    // We check if item.venue matches OR if item.venue is missing (fallback to res1)
    const venueItems = allMenuItems.filter(item => {
        const itemVenue = item.venue || 'res1'; // Default to res1 if not specified
        return (itemVenue === currentVenue) && (item.menu !== false);
    });

    if (venueItems.length === 0) {
        container.innerHTML = `<div class="empty">لا يوجد عناصر في هذا القسم حالياً...</div>`;
        return;
    }

    // 2. Group by Category
    const byCategory = new Map();
    venueItems.forEach((item) => {
      const cat = item.category || "أخرى";
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push(item);
    });

    // 3. Sort & Render
    const sortedCategories = [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    sortedCategories.forEach(([cat, items]) => {
      // Icon Lookup
      const catIcon = categoryIcons[cat] || categoryIcons["default"];

      // A. Sticky Nav Link
      const navLink = document.createElement("a");
      navLink.className = "nav-pill";
      navLink.href = `#cat-${esc(cat.replace(/\s+/g, '-'))}`;
      navLink.innerHTML = `<span>${catIcon}</span> ${esc(cat)}`;
      navContainer.appendChild(navLink);

      // B. Section Header
      const section = document.createElement("section");
      section.className = "category-section";
      section.id = `cat-${esc(cat.replace(/\s+/g, '-'))}`;
      section.innerHTML = `<h2 class="category-title"><span>${catIcon}</span> ${esc(cat)}</h2>`;

      // C. Items Loop
      items.forEach((it, index) => {
        const itemIcon = getItemIcon(it.name, cat);

        // Price Logic (Variants vs Single)
        let priceHtml = "";
        if (it.variants && it.variants.length > 0) {
            let variantsHtml = `<div class="variants-list">`;
            it.variants.forEach(v => {
                variantsHtml += `
                    <div class="variant-item">
                        <span class="v-name">${esc(v.name)}</span>
                        <span class="v-price">${formatPrice(v.price)}</span>
                    </div>`;
            });
            variantsHtml += `</div>`;
            priceHtml = variantsHtml;
        } else {
            priceHtml = `<div class="item-price">${formatPrice(it.price)}</div>`;
        }

        // Menu Badge
        let menuBadgeHtml = "";
        if (it.ismenu === true) {
            menuBadgeHtml = `<div class="menu-badge"><span>✨ متوفر كوجبة</span></div>`;
        }

        // Card Creation
        const card = document.createElement("div");
        card.className = "item-card";
        
        // **Animation Delay** (For the premium slide-up effect)
        card.style.animationDelay = `${index * 0.05}s`; 

        card.innerHTML = `
          <div class="card-top">
            <h3 class="item-name">
                <span style="margin-left:8px; font-size:1.2em;">${itemIcon}</span>
                ${esc(it.name)}
            </h3>
            ${!it.variants ? priceHtml : ''}
          </div>
          <p class="item-desc">${esc(it.description || "")}</p>
          ${it.variants ? priceHtml : ''}
          ${menuBadgeHtml}
        `;
        section.appendChild(card);
      });

      container.appendChild(section);
    });
}