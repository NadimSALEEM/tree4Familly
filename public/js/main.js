import { fetchMenuData } from "./data.js";
import {
  state,
  subscribe,
  setItems,
  setVenue,
  setLoading,
  setError
} from "./state.js";
import { initializeUI, render } from "./render.js";

async function bootstrap() {
  initializeUI({ onVenueChange: setVenue });
  subscribe(render);
  render(state);

  try {
    setLoading(true);
    setError("");

    const items = await fetchMenuData();
    setItems(items);
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "حدث خطأ أثناء تحميل المنيو. يرجى المحاولة لاحقاً.";
    setError(message);
  } finally {
    setLoading(false);
  }
}

document.addEventListener("DOMContentLoaded", bootstrap);

/* ─── 🎉 EASTER EGGS 🎉 ─────────────────────────────── */

const easterEggs = {
  messages: [
    "شكراً لاختيارك لنا! 🎉",
    "أنت ذوق عالي! 👌",
    "نقدّر ثقتك! ❤️",
    "روح الفن في الأكل! 🎨",
    "عبقري الذوق! 🧠",
  ],
  
  triggerConfetti() {
    if (typeof confetti !== "undefined") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.3 },
        colors: ["#7ab030", "#c87832", "#eeeae4", "#25d366"],
      });
      confetti({
        particleCount: 50,
        spread: 120,
        origin: { y: 0.5 },
        colors: ["#7ab030", "#c87832"],
      });
    }
  },

  showPopup(message) {
    const popup = document.getElementById("celebration-popup");
    if (!popup) return;
    
    popup.textContent = message;
    popup.classList.remove("hide");
    popup.classList.add("show");

    setTimeout(() => {
      popup.classList.remove("show");
      popup.classList.add("hide");
    }, 3000);

  },

  getRandomMenuItemCard() {
    const menuCards = document.querySelectorAll(".menu-item-card");
    if (!menuCards.length) return null;

    return menuCards[Math.floor(Math.random() * menuCards.length)];
  },

  focusMenuItem(card) {
    if (!card) return;

    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.style.outline = "3px solid var(--accent)";
    card.style.outlineOffset = "3px";

    window.setTimeout(() => {
      card.style.outline = "";
      card.style.outlineOffset = "";
    }, 1600);
  },
  init() {
    const heroHeader = document.getElementById("hero-header");
    const footerCredit = document.getElementById("footer-credit");

    if (heroHeader) {
      heroHeader.addEventListener("click", (e) => {
        e.preventDefault();
        const msg = this.messages[Math.floor(Math.random() * this.messages.length)];
        this.showPopup(msg);
        this.triggerConfetti();
      });
    }

    if (footerCredit) {
      let clickCount = 0;
      let resetTimer = null;
      footerCredit.addEventListener("click", () => {
        clickCount++;

        if (resetTimer) {
          window.clearTimeout(resetTimer);
        }

        resetTimer = window.setTimeout(() => {
          clickCount = 0;
        }, 3000);

        if (clickCount === 1) {
          this.showPopup("اضغط كمان 👀");
        } else if (clickCount === 3) {
          const randomCard = this.getRandomMenuItemCard();
          const itemNameEl = randomCard?.querySelector(".item-name");
          const itemName = itemNameEl ? itemNameEl.textContent.trim() : "شيء خاص";

          const itemMessage = randomCard
            ? `اخترنا لك: ${itemName} 🎁`
            : "اخترنا لك شيء خاص! 🎁";

          this.showPopup(itemMessage);
          this.triggerConfetti();
          this.focusMenuItem(randomCard);
          clickCount = 0;

          if (resetTimer) {
            window.clearTimeout(resetTimer);
            resetTimer = null;
          }
        }
      });
    }
  },
};

easterEggs.init();
