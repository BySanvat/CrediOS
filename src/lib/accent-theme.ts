export const ACCENT_COLOR_COOKIE = "credios_accent_color";

export type AccentColorId = "apple" | "coral" | "teal" | "lavender" | "sky" | "rose" | "amber" | "sage";

export type AccentColor = {
  id: AccentColorId;
  name: string;
  color: string;
  soft: string;
};

export const accentPalette: AccentColor[] = [
  { id: "apple", name: "Manzana", color: "#6EA96B", soft: "#E6F4E4" },
  { id: "coral", name: "Coral", color: "#FF8A6B", soft: "#FFE1D6" },
  { id: "teal", name: "Menta", color: "#14A799", soft: "#DDF8F1" },
  { id: "lavender", name: "Lavanda", color: "#8B7CF6", soft: "#EEE7FF" },
  { id: "sky", name: "Cielo", color: "#4BA3F2", soft: "#DCEEFF" },
  { id: "rose", name: "Rosa", color: "#F472B6", soft: "#FFE4EC" },
  { id: "amber", name: "Miel", color: "#F2B84B", soft: "#FFF2C7" },
  { id: "sage", name: "Salvia", color: "#78A083", soft: "#E8F3EA" },
];

export function parseAccentColor(value: string | null | undefined): AccentColorId | null {
  return accentPalette.some((item) => item.id === value) ? (value as AccentColorId) : null;
}

export function getAccentColor(id: AccentColorId | null | undefined) {
  return accentPalette.find((item) => item.id === id) ?? accentPalette[0];
}
