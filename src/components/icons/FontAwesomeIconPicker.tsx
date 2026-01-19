"use client";

import * as React from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { IconCategory, IconOption } from "@/lib/fontawesome-icon-catalog";
import { loadIconOptions } from "@/lib/fontawesome-icon-catalog";
import { UI_CATEGORIES } from "@/lib/fa-icon-categories";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export type FontAwesomeIconPickerProps = {
  value?: IconDefinition | null;
  onChange?: (icon: IconDefinition) => void;

  placeholder?: string;
  disabled?: boolean;
  defaultCategory?: IconCategory;

  className?: string;
};

type LoadState =
  | { status: "idle" | "loading"; icons: IconOption[] }
  | { status: "ready"; icons: IconOption[] }
  | { status: "error"; icons: IconOption[]; error: unknown };

function categoryLabel(cat: IconCategory) {
  switch (cat) {
    case "solid":
      return "Solid";
    case "regular":
      return "Regular";
  }
}

function findScrollAreaViewport(root: HTMLElement | null) {
  if (!root) return null;
  return (
    root.querySelector<HTMLDivElement>(
      "[data-radix-scroll-area-viewport]",
    ) ?? null
  );
}

function getLigatures(icon: IconOption): string {
  // IconDefinition.icon is: [w, h, ligatures, unicode, svgPathData]
  const ligatures = icon.icon.icon?.[2];
  if (!Array.isArray(ligatures) || ligatures.length === 0) return "";
  return ligatures
    .filter((x) => typeof x === "string")
    .join(" ")
    .toLowerCase()
    .replace(/-/g, " ");
}

function computeCategoryIds(text: string): string[] {
  const hits: string[] = [];
  for (const c of UI_CATEGORIES) {
    for (const kw of c.keywords) {
      if (text.includes(kw)) {
        hits.push(c.id);
        break;
      }
    }
  }
  return hits;
}

export function FontAwesomeIconPicker({
  value = null,
  onChange,
  placeholder = "Pick an icon",
  disabled,
  defaultCategory = "solid",
  className,
}: FontAwesomeIconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<IconCategory>(defaultCategory);

  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query.trim().toLowerCase());

  const [selectedCatIds, setSelectedCatIds] = React.useState<string[]>([]);
  const selectedCatSet = React.useMemo(
    () => new Set(selectedCatIds),
    [selectedCatIds],
  );

  const [state, setState] = React.useState<LoadState>({
    status: "idle",
    icons: [],
  });

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;

    setState((s) => ({ status: "loading", icons: s.icons }));
    loadIconOptions(category)
      .then((icons) => {
        if (cancelled) return;
        setState({ status: "ready", icons });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ status: "error", icons: [], error });
      });

    return () => {
      cancelled = true;
    };
  }, [open, category]);

  const iconsWithMeta = React.useMemo(() => {
    return state.icons.map((icon) => {
      const ligatures = getLigatures(icon);
      const text = `${icon.search} ${ligatures}`.trim();
      const catIds = computeCategoryIds(text);
      return { icon, text, catIds };
    });
  }, [state.icons]);

  const categoryCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of UI_CATEGORIES) counts.set(c.id, 0);

    for (const it of iconsWithMeta) {
      for (const cid of it.catIds) {
        counts.set(cid, (counts.get(cid) ?? 0) + 1);
      }
    }
    return counts;
  }, [iconsWithMeta]);

  const filtered = React.useMemo(() => {
    const q = deferredQuery;
    const filterByCats = selectedCatSet.size > 0;

    const out: IconOption[] = [];
    for (const it of iconsWithMeta) {
      if (filterByCats) {
        let ok = false;
        for (const cid of it.catIds) {
          if (selectedCatSet.has(cid)) {
            ok = true;
            break;
          }
        }
        if (!ok) continue;
      }

      if (q && !it.text.includes(q)) continue;
      out.push(it.icon);
    }

    return out;
  }, [iconsWithMeta, deferredQuery, selectedCatSet]);

  // Vertical icon grid ScrollArea
  const gridScrollAreaRootRef = React.useRef<HTMLDivElement | null>(null);
  const [gridViewportEl, setGridViewportEl] =
    React.useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) {
      setGridViewportEl(null);
      return;
    }

    let raf = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const viewport = findScrollAreaViewport(gridScrollAreaRootRef.current);
      if (viewport) {
        setGridViewportEl(viewport);
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [open, category]);

  const [cols, setCols] = React.useState(8);

  React.useEffect(() => {
    if (!gridViewportEl) return;

    const ro = new ResizeObserver(() => {
      const width = gridViewportEl.clientWidth;
      const cell = 44;
      const gap = 8;
      const next = Math.max(4, Math.min(12, Math.floor(width / (cell + gap))));
      setCols(next);
    });

    ro.observe(gridViewportEl);
    return () => ro.disconnect();
  }, [gridViewportEl]);

  const rowSize = 52;
  const rowCount = Math.ceil(filtered.length / cols);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => gridViewportEl,
    estimateSize: () => rowSize,
    overscan: 10,
  });

  React.useEffect(() => {
    if (!gridViewportEl) return;
    rowVirtualizer.measure();
  }, [gridViewportEl, cols, filtered.length, rowVirtualizer]);

  // Horizontal categories ScrollArea (wheel -> horizontal)
  const catScrollAreaRootRef = React.useRef<HTMLDivElement | null>(null);
  const [catViewportEl, setCatViewportEl] =
    React.useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) {
      setCatViewportEl(null);
      return;
    }

    let raf = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const viewport = findScrollAreaViewport(catScrollAreaRootRef.current);
      if (viewport) {
        setCatViewportEl(viewport);
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [open, category]);

  React.useEffect(() => {
    const el = catViewportEl;
    if (!el) return;

    // Convert vertical wheel into horizontal scroll when hovering categories.
    const onWheel = (e: WheelEvent) => {
      // If user is already horizontal scrolling (trackpad) or holding Shift,
      // let the browser handle it.
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      if (Math.abs(e.deltaY) < 1) return;

      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel as EventListener);
    };
  }, [catViewportEl]);

  const selectedId = value ? `${value.prefix}:${value.iconName}` : null;

  function toggleUiCategory(id: string) {
    setSelectedCatIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  function clearUiCategories() {
    setSelectedCatIds([]);
  }

  function handleSelect(option: IconOption) {
    onChange?.(option.icon);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("w-[280px] justify-start gap-2", className)}
        >
          {value ? (
            <>
              <FontAwesomeIcon icon={value} fixedWidth />
              <span className="truncate">{value.iconName}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[360px] h-[400px] p-3" align="start">
        <div className="flex flex-col gap-3">
          <Tabs
            value={category}
            onValueChange={(v) => setCategory(v as IconCategory)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="solid">{categoryLabel("solid")}</TabsTrigger>
              <TabsTrigger value="regular">
                {categoryLabel("regular")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search icons…"
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setQuery("")}
              disabled={!query}
            >
              Clear
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Categories (multi-select)
              {selectedCatIds.length ? `: ${selectedCatIds.length} selected` : ""}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearUiCategories}
              disabled={selectedCatIds.length === 0}
            >
              Clear categories
            </Button>
          </div>

          <ScrollArea
            ref={catScrollAreaRootRef}
            className="w-full rounded-md border"
          >
            <div className="flex w-max gap-2 p-2">
              {UI_CATEGORIES.map((c) => {
                const active = selectedCatSet.has(c.id);
                const count = categoryCounts.get(c.id) ?? 0;
                const disabledCat = state.status !== "ready" || count === 0;

                return (
                  <Button
                    key={c.id}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "secondary"}
                    className={cn(
                      "shrink-0 gap-2",
                      disabledCat && "opacity-50",
                    )}
                    onClick={() => toggleUiCategory(c.id)}
                    disabled={disabledCat}
                    title={`${c.label} (${count})`}
                  >
                    <span>{c.label}</span>
                    <span className="text-xs opacity-70">{count}</span>
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <Command shouldFilter={false} className="border">
            <ScrollArea
              ref={gridScrollAreaRootRef}
              className="h-[145px] w-full"
              onWheelCapture={(e) => {
                // Prevent Popover/DismissableLayer from interfering with wheel.
                e.stopPropagation();
              }}
            >
              <div className="relative p-2">
                {state.status === "loading" && state.icons.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Loading {categoryLabel(category)} icons…
                  </div>
                ) : state.status === "error" ? (
                  <div className="p-2 text-sm text-destructive">
                    Failed to load icons.
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No results.
                  </div>
                ) : !gridViewportEl ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Initializing…
                  </div>
                ) : (
                  <div
                    className="relative"
                    style={{ height: rowVirtualizer.getTotalSize() }}
                  >
                    {rowVirtualizer.getVirtualItems().map((row) => {
                      const start = row.index * cols;
                      const end = Math.min(start + cols, filtered.length);
                      const slice = filtered.slice(start, end);

                      return (
                        <div
                          key={row.key}
                          className="absolute left-0 top-0 w-full"
                          style={{ transform: `translateY(${row.start}px)` }}
                        >
                          <div
                            className="grid gap-2"
                            style={{
                              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                            }}
                          >
                            {slice.map((opt) => {
                              const active = opt.id === selectedId;

                              return (
                                <Button
                                  key={opt.id}
                                  type="button"
                                  variant={active ? "default" : "ghost"}
                                  size="icon"
                                  className="h-11 w-11"
                                  title={opt.name}
                                  onClick={() => handleSelect(opt)}
                                >
                                  <FontAwesomeIcon icon={opt.icon} fixedWidth />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <ScrollBar orientation="vertical" />
            </ScrollArea>

            <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
              <span>
                {state.status === "ready" || state.status === "loading"
                  ? `${filtered.length.toLocaleString()} shown`
                  : "—"}
              </span>
              <span>
                {state.status === "ready"
                  ? `${categoryLabel(category)} loaded`
                  : state.status === "loading"
                    ? "Loading…"
                    : ""}
              </span>
            </div>
          </Command>
        </div>
      </PopoverContent>
    </Popover>
  );
}