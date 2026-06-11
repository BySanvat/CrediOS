import type { PersonalCategorySeed } from "./types";

export const DEFAULT_PERSONAL_CATEGORIES: PersonalCategorySeed[] = [
  {
    name: "Salario",
    type: "income",
    icon: "briefcase",
    colorToken: "green",
    keywords: ["salario", "sueldo", "nomina", "payroll", "salary"],
  },
  {
    name: "Ingresos extra",
    type: "income",
    icon: "sparkles",
    colorToken: "blue",
    keywords: ["ingreso", "venta", "freelance", "extra", "transferencia recibida", "bonus"],
  },
  {
    name: "Comida",
    type: "expense",
    icon: "utensils",
    colorToken: "sand",
    keywords: ["almuerzo", "comida", "restaurante", "cafe", "coffee", "desayuno", "cena", "mercado"],
  },
  {
    name: "Transporte",
    type: "expense",
    icon: "car",
    colorToken: "blue",
    keywords: ["gasolina", "uber", "taxi", "bus", "metro", "transporte", "parking", "parqueadero"],
  },
  {
    name: "Hogar",
    type: "expense",
    icon: "home",
    colorToken: "green",
    keywords: ["arriendo", "renta", "servicios", "luz", "agua", "internet", "hogar"],
  },
  {
    name: "Suscripciones",
    type: "expense",
    icon: "repeat",
    colorToken: "pink",
    keywords: ["netflix", "spotify", "prime", "icloud", "suscripcion", "subscription"],
  },
  {
    name: "Salud",
    type: "expense",
    icon: "heart",
    colorToken: "pink",
    keywords: ["salud", "medico", "farmacia", "doctor", "medicina"],
  },
  {
    name: "Otros gastos",
    type: "expense",
    icon: "circle",
    colorToken: "yellow",
    keywords: ["otro", "varios", "misc"],
  },
];

export function findCategorySeedByName(name: string) {
  const normalized = name.trim().toLowerCase();
  return DEFAULT_PERSONAL_CATEGORIES.find((category) => category.name.toLowerCase() === normalized) ?? null;
}
