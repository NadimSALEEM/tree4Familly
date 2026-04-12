const DEFAULT_VENUE = "res1";

export const state = {
  selectedVenue: DEFAULT_VENUE,
  allItems: [],
  visibleItems: [],
  categories: [],
  isLoading: true,
  error: ""
};

const listeners = new Set();

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined || value === "") return fallback;

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

function recomputeVisibleData() {
  state.visibleItems = state.allItems.filter((item) => {
    const isCorrectVenue = item.venue === state.selectedVenue;
    const isVisibleInMenu = toBool(item.menu, true);
    return isCorrectVenue && isVisibleInMenu;
  });

  const seen = new Set();
  state.categories = [];

  state.visibleItems.forEach((item) => {
    if (item.category && !seen.has(item.category)) {
      seen.add(item.category);
      state.categories.push(item.category);
    }
  });
}

function notify() {
  listeners.forEach((listener) => listener(state));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setItems(items) {
  state.allItems = Array.isArray(items) ? items : [];
  recomputeVisibleData();
  notify();
}

export function setVenue(venue) {
  if (!["res1", "res2", "cafe"].includes(venue)) return;
  if (state.selectedVenue === venue) return;

  state.selectedVenue = venue;
  recomputeVisibleData();
  notify();
}

export function setLoading(isLoading) {
  state.isLoading = Boolean(isLoading);
  notify();
}

export function setError(errorMessage) {
  state.error = errorMessage || "";
  notify();
}
