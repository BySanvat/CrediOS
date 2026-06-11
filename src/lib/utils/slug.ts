export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/gi, "n")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "credito";
}

export type SluggableCredit = {
  id: string;
  name: string;
  created_at?: string | null;
};

export function creditSlugFor(credit: SluggableCredit, credits: SluggableCredit[]) {
  const base = slugify(credit.name);
  const sameBase = credits
    .filter((item) => slugify(item.name) === base)
    .sort((a, b) => {
      const dateCompare = String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""));
      return dateCompare || a.id.localeCompare(b.id);
    });
  const index = sameBase.findIndex((item) => item.id === credit.id);

  return index > 0 ? `${base}-${index + 1}` : base;
}

export function resolveCreditIdFromSlug(slug: string, credits: SluggableCredit[]) {
  const direct = credits.find((credit) => credit.id === slug);
  if (direct) return direct.id;

  const match = credits.find((credit) => creditSlugFor(credit, credits) === slug);
  return match?.id ?? null;
}

export function creditFriendlyPath(_id: string, name: string) {
  return `/creditos/${slugify(name)}`;
}

export function creditFriendlyPathFor(credit: SluggableCredit, credits: SluggableCredit[]) {
  return `/creditos/${creditSlugFor(credit, credits)}`;
}
