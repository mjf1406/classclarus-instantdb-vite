import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type IconCategory = "solid" | "regular" | "brands";

export type IconOption = {
  id: string; // e.g. "fas:address-book"
  name: string; // iconName
  prefix: IconDefinition["prefix"];
  icon: IconDefinition;
  search: string; // precomputed lowercase
};

const cache = new Map<IconCategory, IconOption[]>();

function isIconDefinition(value: unknown): value is IconDefinition {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.prefix === "string" &&
    typeof v.iconName === "string" &&
    Array.isArray(v.icon)
  );
}

async function importCategory(category: IconCategory): Promise<unknown> {
  switch (category) {
    case "solid":
      return import("@fortawesome/free-solid-svg-icons");
    case "regular":
      return import("@fortawesome/free-regular-svg-icons");
    case "brands":
      return import("@fortawesome/free-brands-svg-icons");
    default:
      return category satisfies never;
  }
}

export async function loadIconOptions(
  category: IconCategory,
): Promise<IconOption[]> {
  const hit = cache.get(category);
  if (hit) return hit;

  const mod = await importCategory(category);

  // The module exports many things (including packs like `fas`/`far`/`fab`).
  // We only keep actual IconDefinition objects.
  const icons = Object.values(mod as Record<string, unknown>)
    .filter(isIconDefinition)
    .map((icon) => {
      const name = icon.iconName;
      const prefix = icon.prefix;
      return {
        id: `${prefix}:${name}`,
        name,
        prefix,
        icon,
        search: name.toLowerCase().replace(/-/g, " "),
      } satisfies IconOption;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  cache.set(category, icons);
  return icons;
}