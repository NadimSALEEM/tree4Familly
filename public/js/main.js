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
