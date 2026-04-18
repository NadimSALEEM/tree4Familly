let elements = null;
let observer = null;

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FF\w-]/g, "");
}

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function groupItemsByCategory(items) {
  return items.reduce((accumulator, item) => {
    const key = item.category || "أخرى";
    if (!accumulator[key]) accumulator[key] = [];
    accumulator[key].push(item);
    return accumulator;
  }, {});
}

function createItemCard(item) {
  const hasImage = Boolean(item.image);
  const imageMarkup = item.image
    ? `
      <div class="item-image">
        <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" loading="lazy" />
      </div>
    `
    : "";

  const variantsMarkup = Array.isArray(item.variants) && item.variants.length
    ? `<ul class="variant-list">${item.variants
        .map(
          (variant) =>
            `<li class="variant-item"><span>${escapeHTML(variant.name)}</span><b>${escapeHTML(
              variant.price
            )}</b></li>`
        )
        .join("")}</ul>`
    : "";

  const priceMarkup = !variantsMarkup && item.price
    ? `<p class="item-price">${escapeHTML(item.price)}</p>`
    : "";

  const badgeMarkup = item.ismenu ? '<span class="menu-badge">عرض</span>' : "";

  return `
    <article class="menu-item-card reveal ${hasImage ? "has-image" : "no-image"}">
      ${imageMarkup}
      <div class="item-body">
        <div class="item-head">
          <h3 class="item-name">${escapeHTML(item.name)}</h3>
          ${badgeMarkup}
        </div>
        ${priceMarkup}
        ${variantsMarkup}
        ${item.description ? `<p class="item-description">${escapeHTML(item.description)}</p>` : ""}
      </div>
    </article>
  `;
}

function renderNav(categories) {
  if (!categories.length) {
    elements.categoryNavList.innerHTML = "";
    return;
  }

  elements.categoryNavList.innerHTML = categories
    .map((category, index) => {
      const sectionId = `cat-${slugify(category)}-${index}`;
      return `<button class="category-btn" data-target="${sectionId}" type="button">${escapeHTML(
        category
      )}</button>`;
    })
    .join("");
}

function renderMenuContent(categories, groupedItems) {
  if (!categories.length) {
    elements.menuContent.innerHTML = "";
    return;
  }

  elements.menuContent.innerHTML = categories
    .map((category, index) => {
      const sectionId = `cat-${slugify(category)}-${index}`;
      const cards = (groupedItems[category] || []).map(createItemCard).join("");

      return `
        <section class="category-section" id="${sectionId}" data-category-section>
          <div class="category-header">
            <h2 class="category-title">${escapeHTML(category)}</h2>
          </div>
          <div class="cards-grid">${cards}</div>
        </section>
      `;
    })
    .join("");

  const cards = elements.menuContent.querySelectorAll(".menu-item-card.reveal");
  cards.forEach((card, index) => {
    window.setTimeout(() => {
      card.classList.add("is-visible");
    }, Math.min(index * 40, 480));
  });
}

function setStatus(state) {
  if (state.isLoading) {
    elements.status.innerHTML = '<p class="status-text">جاري تحميل المنيو...</p>';
    return;
  }

  if (state.error) {
    elements.status.innerHTML = `<p class="status-text is-error">${escapeHTML(state.error)}</p>`;
    return;
  }

  if (!state.visibleItems.length) {
    elements.status.innerHTML = '<p class="status-text">لا توجد أصناف متاحة حالياً لهذا الفرع.</p>';
    return;
  }

  elements.status.innerHTML = "";
}

function setThemeAndVenue(state) {
  document.body.setAttribute("data-theme", state.selectedVenue);
  if (!elements.venueSwitcher) return;

  const buttons = elements.venueSwitcher.querySelectorAll(".venue-btn");

  buttons.forEach((button) => {
    const isActive = button.dataset.venue === state.selectedVenue;
    button.classList.toggle("is-active", isActive);
  });
}

function setupSectionObserver() {
  if (observer) observer.disconnect();

  const sections = elements.menuContent.querySelectorAll("[data-category-section]");
  if (!sections.length) return;

  observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (!visibleEntries.length) return;

      visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const topSection = visibleEntries[0].target;
      const id = topSection.getAttribute("id");

      elements.categoryNavList.querySelectorAll(".category-btn").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.target === id);
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: [0.15, 0.4, 0.75] }
  );

  sections.forEach((section) => observer.observe(section));
}

export function initializeUI({ onVenueChange }) {
  elements = {
    venueSwitcher: document.getElementById("venue-switcher"),
    categoryNavList: document.getElementById("category-nav-list"),
    status: document.getElementById("status"),
    menuContent: document.getElementById("menu-content")
  };

  if (elements.venueSwitcher) {
    elements.venueSwitcher.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-venue]");
      if (!button) return;
      onVenueChange(button.dataset.venue);
    });
  }

  elements.categoryNavList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-target]");
    if (!button) return;

    const targetSection = document.getElementById(button.dataset.target);
    if (!targetSection) return;

    targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  elements.menuContent.addEventListener(
    "error",
    (event) => {
      const image = event.target.closest(".item-image img");
      if (!image) return;

      const imageWrapper = image.closest(".item-image");
      if (!imageWrapper) return;

      imageWrapper.classList.add("is-fallback");
      image.remove();
    },
    true
  );
}

export function render(state) {
  setThemeAndVenue(state);
  setStatus(state);

  if (state.isLoading || state.error || !state.visibleItems.length) {
    if (observer) observer.disconnect();
    renderNav([]);
    renderMenuContent([], {});
    return;
  }

  const groupedItems = groupItemsByCategory(state.visibleItems);
  renderNav(state.categories);
  renderMenuContent(state.categories, groupedItems);
  setupSectionObserver();
}
