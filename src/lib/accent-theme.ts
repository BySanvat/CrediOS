export const ACCENT_COLOR_COOKIE = "credios_accent_color";

export type AccentColorId = "apple-green" | "mint" | "sky" | "lavender" | "rose" | "peach" | "honey";

export type AccentColor = {
  id: AccentColorId;
  name: string;
  color: string;
  hover: string;
  soft: string;
  softDark: string;
};

export const accentPalette: AccentColor[] = [
  {
    id: "apple-green",
    name: "Verde manzana",
    color: "#6FAF7A",
    hover: "#5D9E68",
    soft: "#EAF7EC",
    softDark: "rgba(111, 175, 122, 0.16)",
  },
  {
    id: "mint",
    name: "Menta",
    color: "#7BCBBB",
    hover: "#65B9A9",
    soft: "#E9FAF6",
    softDark: "rgba(123, 203, 187, 0.16)",
  },
  {
    id: "sky",
    name: "Cielo",
    color: "#83BCEB",
    hover: "#6FA9DA",
    soft: "#EAF5FF",
    softDark: "rgba(131, 188, 235, 0.16)",
  },
  {
    id: "lavender",
    name: "Lavanda",
    color: "#A79BE8",
    hover: "#9486D8",
    soft: "#F1EEFF",
    softDark: "rgba(167, 155, 232, 0.16)",
  },
  {
    id: "rose",
    name: "Rosa suave",
    color: "#E9A5B7",
    hover: "#D98EA3",
    soft: "#FFF0F4",
    softDark: "rgba(233, 165, 183, 0.16)",
  },
  {
    id: "peach",
    name: "Durazno",
    color: "#EFB08F",
    hover: "#DD9B79",
    soft: "#FFF1EA",
    softDark: "rgba(239, 176, 143, 0.16)",
  },
  {
    id: "honey",
    name: "Miel",
    color: "#EBCB78",
    hover: "#D8B85F",
    soft: "#FFF7DD",
    softDark: "rgba(235, 203, 120, 0.16)",
  },
];

export function parseAccentColor(value: string | null | undefined): AccentColorId | null {
  if (value === "apple" || value === "sage") return "apple-green";
  if (value === "teal") return "mint";
  if (value === "coral") return "peach";
  if (value === "amber") return "honey";
  return accentPalette.some((item) => item.id === value) ? (value as AccentColorId) : null;
}

export function getAccentColor(id: AccentColorId | null | undefined) {
  return accentPalette.find((item) => item.id === id) ?? accentPalette[0];
}
