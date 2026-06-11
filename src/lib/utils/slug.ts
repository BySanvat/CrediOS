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

export function creditFriendlyPath(id: string, name: string) {
  return `/creditos/${id}/${slugify(name)}`;
}
