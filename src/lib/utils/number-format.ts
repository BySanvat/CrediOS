export function formatThousands(value: string | number) {
  const raw = String(value ?? "").replace(/[^\d-]/g, "");
  if (!raw || raw === "-") return raw;

  const sign = raw.startsWith("-") ? "-" : "";
  const digits = raw.replace("-", "");

  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function parseFormattedNumber(value: string | number) {
  const raw = String(value ?? "").trim();
  if (!raw) return "0";

  const normalized = raw.replace(/\s/g, "");
  const hasComma = normalized.includes(",");

  if (hasComma) {
    return normalized.replace(/\./g, "").replace(",", ".");
  }

  const dotParts = normalized.split(".");
  const looksLikeThousands =
    dotParts.length > 1 &&
    dotParts.slice(1).every((part) => part.length === 3) &&
    dotParts[0].length >= 1 &&
    dotParts.every((part) => /^\d+$/.test(part));

  if (looksLikeThousands) {
    return dotParts.join("");
  }

  return normalized.replace(/[^\d.-]/g, "");
}

export function normalizeRateInput(value: string | number) {
  return String(value ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");
}
