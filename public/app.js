document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("menu-container");
  const navContainer = document.getElementById("nav-list");

  const formatPrice = (p) => {
    const n = Number(p);
    if (Number.isFinite(n)) return `${n.toFixed(n % 1 === 0 ? 0 : 2)} ل.س`; 
    return `${p}`;
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  // --- NEW: FETCH FROM LOCAL JSON FILE ---
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

    // 1. Group items
    const byCategory = new Map();

    allData.forEach((item) => {
      // Logic: if 'menu' is false, skip
      if (item.menu === false) return;

      const cat = item.category || "أخرى";
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push(item);
    });

    // 2. Sort Categories
    const sortedCategories = [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    // 3. Render
    sortedCategories.forEach(([cat, items]) => {
      // Nav Link
      const navLink = document.createElement("a");
      navLink.className = "nav-pill";
      navLink.href = `#cat-${esc(cat.replace(/\s+/g, '-'))}`;
      navLink.textContent = cat;
      navContainer.appendChild(navLink);

      // Section
      const section = document.createElement("section");
      section.className = "category-section";
      section.id = `cat-${esc(cat.replace(/\s+/g, '-'))}`;
      section.innerHTML = `<h2 class="category-title">${esc(cat)}</h2>`;

      // Sort items by name
      items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      items.forEach((it) => {
        let menuBadgeHtml = "";
        if (it.ismenu === true) {
            menuBadgeHtml = `<div class="menu-badge"><span>✨ متوفر كوجبة</span></div>`;
        }

        const card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML = `
          <div class="card-top">
            <h3 class="item-name">${esc(it.name)}</h3>
            <div class="item-price">${formatPrice(it.price)}</div>
          </div>
          <p class="item-desc">${esc(it.description || "")}</p>
          ${menuBadgeHtml}
        `;
        section.appendChild(card);
      });

      container.appendChild(section);
    });
  }
});