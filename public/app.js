document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("menu-container");
  const navContainer = document.getElementById("nav-list");

  // --- 1. CATEGORY ICONS (For the Headers) ---
  const categoryIcons = {
    "سندويشات": "🥪",
    "بيتزا": "🍕",
    "وجبات": "🍽️",
    "مشروبات غازية": "🥤",
    "حلويات": "🍰",
    "مقبلات": "🍟",
    "default": "🍴"
  };


  const itemKeywords = {
    // --- 🧀 The Cheesy & Special Ones ---
    "تشيز": "🍔🧀",           
    "أطراف جبنة": "🍕🧀✨",    
    "جبن": "🧀",
    "بيض": "🍔🍳",            
    "ماسترد": "🍯🍗",         

    // --- 🍕 Pizzas ---
    "خضار": "🍕🥦",           
    "مارغريتا": "🍕🌿",       
    "ببروني": "🍕🥓",         
    "لحوم": "🍕🥩",           
    "بيتزا": "🍕",            

    // --- 🔥 Spicy & Sandwiches ---
    "زنجر": "🍗🔥",           
    "سبايسي": "🌶️🍗",         
    "مكسيكانو": "🌮🔥",       
    "فاهيتا": "🌮🫑",         
    "فرانسيسكو": "🥖🍄",      
    "سوبريم": "🌯🧀",         
    "شيش": "🍢",              
    "طوشكا": "🥙🥩",          
    "مسخن": "🥙🧅",           
    "شاورما": "🌯🔥",         
    "shawarma": "🌯🔥",

    // --- 🍗 Fried Chicken ---
    "كنتاكي": "🍗✨",
    "كرسبي": "🥖🍗",
    "سكالوب": "🍗🥨",
    "برغر": "🍔",
    "burger": "🍔",

    // --- 🥔 Sides & Meals ---
    "بطاطا": "🍟",
    "fries": "🍟",
    "وجبة": "🍽️",
    "دايت": "🥗💪",           
    "رياضية": "🏋️🥗",         

    // --- 🥤 Drinks (UPDATED HERE) ---
    "سفن": "🍋🥤",            // 7-Up
    "فانتا": "🍊🥤",          // Fanta
    "عيران": "🥛🧂",          // Ayran (Yogurt)
    "كولا": "🥤🧊",
    "بيبسي": "🥤🧊",
    "عصير": "🍹🍊",
    "ماء": "💧",
    "مياه": "💧",

    // --- 🍰 Desserts ---
    "كنافة": "🍮🍯",
    "وافل": "🧇🍫",
    "ايس": "🍦",
    "بوظة": "🍦"
  };

  // Helper: Find the best icon for an item
  const getItemIcon = (name, category) => {
    const n = name.toLowerCase();
    // Check specific keywords first
    for (const [key, icon] of Object.entries(itemKeywords)) {
      if (n.includes(key)) return icon;
    }
    // If no keyword matches, use the Category icon
    return categoryIcons[category] || categoryIcons["default"];
  };

  const formatPrice = (p) => {
    const n = Number(p);
    if (Number.isFinite(n)) return `${n.toFixed(0)} ل.س`; 
    return `${p}`;
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  // Force fresh load
  fetch("menu.json?v=" + new Date().getTime())
    .then(response => {
        if (!response.ok) throw new Error("Could not load menu");
        return response.json();
    })
    .then(data => {
        renderMenu(data);
    })
    .catch(err => {
        container.innerHTML = `<div class="empty">Error loading menu: ${err.message}</div>`;
    });

  function renderMenu(allData) {
    container.innerHTML = "";
    navContainer.innerHTML = ""; 

    if (!allData || allData.length === 0) {
      container.innerHTML = `<div class="empty">المنيو فارغ حالياً...</div>`;
      return;
    }

    const byCategory = new Map();

    allData.forEach((item) => {
      if (item.menu === false) return;
      const cat = item.category || "أخرى";
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push(item);
    });

    const sortedCategories = [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    sortedCategories.forEach(([cat, items]) => {
      // 1. Category Icon
      const catIcon = categoryIcons[cat] || categoryIcons["default"];

      // Nav Link
      const navLink = document.createElement("a");
      navLink.className = "nav-pill";
      navLink.href = `#cat-${esc(cat.replace(/\s+/g, '-'))}`;
      navLink.innerHTML = `<span>${catIcon}</span> ${esc(cat)}`;
      navContainer.appendChild(navLink);

      // Section Header
      const section = document.createElement("section");
      section.className = "category-section";
      section.id = `cat-${esc(cat.replace(/\s+/g, '-'))}`;
      section.innerHTML = `<h2 class="category-title"><span>${catIcon}</span> ${esc(cat)}</h2>`;

      items.forEach((it) => {
        // 2. Item Icon (Smart Detection)
        const itemIcon = getItemIcon(it.name, cat);

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

        let menuBadgeHtml = "";
        if (it.ismenu === true) {
            menuBadgeHtml = `<div class="menu-badge"><span>✨ متوفر كوجبة</span></div>`;
        }

        const card = document.createElement("div");
        card.className = "item-card";
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
});