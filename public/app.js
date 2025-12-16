document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("menu-container");
  const navContainer = document.getElementById("nav-list");

  // Helper: Format Price
  const formatPrice = (p) => {
    const n = Number(p);
    if (Number.isFinite(n)) return `${n.toFixed(0)} ل.س`; // Assuming Syrian Lira based on context
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

      items.forEach((it) => {
        let priceHtml = "";
        
        // CHECK: Does it have variants (Sizes) or just one price?
        if (it.variants && it.variants.length > 0) {
            // Create a list of variants
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
            // Regular single price
            priceHtml = `<div class="item-price">${formatPrice(it.price)}</div>`;
        }

        // Check for Menu Badge (optional)
        let menuBadgeHtml = "";
        if (it.ismenu === true) {
            menuBadgeHtml = `<div class="menu-badge"><span>✨ متوفر كوجبة</span></div>`;
        }

        const card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML = `
          <div class="card-top">
            <h3 class="item-name">${esc(it.name)}</h3>
            ${!it.variants ? priceHtml : ''} </div>
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