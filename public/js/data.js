const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSRDRCkhLhChA5_9hur2SiPJ8cjlPDTQ2tbVNsvdZphTh3CXRyiTDQEbqq2sVO_A4PTRs9evtwbf6DQ/pub?gid=0&single=true&output=csv";

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined || value === "") return fallback;

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

function sanitizeText(value) {
  return String(value || "").trim();
}

function parseVariants(rawVariants) {
  const value = sanitizeText(rawVariants);
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return undefined;

    const cleaned = parsed
      .map((variant) => ({
        name: sanitizeText(variant?.name),
        price: sanitizeText(variant?.price)
      }))
      .filter((variant) => variant.name || variant.price);

    return cleaned.length ? cleaned : undefined;
  } catch {
    return undefined;
  }
}

function readValue(row, headerMap, keys) {
  for (const key of keys) {
    const index = headerMap.get(normalizeHeader(key));
    if (index !== undefined) return row[index];
  }
  return "";
}

// CSV parser using a character state machine to safely handle:
// quoted fields, escaped quotes, commas inside quotes, and line breaks in quoted text.
export function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i += 1;

      row.push(field);
      rows.push(row);

      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((currentRow) => currentRow.some((value) => sanitizeText(value) !== ""));
}

function mapRowsToItems(rows) {
  if (!rows.length) return [];

  const [headerRow, ...dataRows] = rows;
  const headerMap = new Map(headerRow.map((header, index) => [normalizeHeader(header), index]));

  const items = dataRows.map((row, index) => {
    const venue = sanitizeText(
      readValue(row, headerMap, ["venue", "branch", "restaurant", "type"])
    ).toLowerCase();

    const normalizedVenue = ["res1", "res2", "cafe"].includes(venue) ? venue : "res1";
    const variants = parseVariants(readValue(row, headerMap, ["variants", "variant"]));

    return {
      id:
        sanitizeText(readValue(row, headerMap, ["id", "itemid"])) ||
        `${normalizedVenue}-${index + 1}`,
      name: sanitizeText(readValue(row, headerMap, ["name", "itemname", "title"])),
      price: sanitizeText(readValue(row, headerMap, ["price", "baseprice"])),
      description: sanitizeText(readValue(row, headerMap, ["description", "details", "desc"])),
      category: sanitizeText(readValue(row, headerMap, ["category", "group", "section"])) || "أخرى",
      venue: normalizedVenue,
      menu: toBool(readValue(row, headerMap, ["menu", "show", "active"]), true),
      ismenu: toBool(readValue(row, headerMap, ["ismenu", "badge", "featured"]), false),
      image: sanitizeText(readValue(row, headerMap, ["image"])),
      variants
    };
  });

  return items.filter((item) => item.name);
}

export async function fetchMenuData() {
  const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("تعذر تحميل البيانات من Google Sheets");
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);
  return mapRowsToItems(rows);
}
