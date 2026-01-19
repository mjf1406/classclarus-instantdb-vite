import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type IconCategory = "solid" | "regular";

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
      // Dynamic import - code-split by Vite via manualChunks config
      return import("@fortawesome/free-solid-svg-icons");
    case "regular":
      // Dynamic import - code-split by Vite via manualChunks config
      return import("@fortawesome/free-regular-svg-icons");
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

  const unique = new Map<string, IconOption>();

for (const value of Object.values(mod as Record<string, unknown>)) {
  if (!isIconDefinition(value)) continue;
  const icon = value;
  const name = icon.iconName;
  const prefix = icon.prefix;
  const id = `${prefix}:${name}`;

  if (unique.has(id)) continue;

  unique.set(id, {
    id,
    name,
    prefix,
    icon,
    search: name.toLowerCase().replace(/-/g, " "),
  });
}

const icons = Array.from(unique.values()).sort((a, b) =>
  a.name.localeCompare(b.name),
);

  cache.set(category, icons);
  return icons;
}

const PREFIX_TO_CATEGORY: Record<string, IconCategory> = {
  fas: "solid",
  far: "regular",
};

export async function resolveIconId(id: string): Promise<IconDefinition | null> {
  const [prefix] = id.split(":");
  const category = PREFIX_TO_CATEGORY[prefix];
  if (!category) return null;
  const opts = await loadIconOptions(category);
  const found = opts.find((o) => o.id === id);
  return found ? found.icon : null;
}