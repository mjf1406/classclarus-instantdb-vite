"use client";

import * as React from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { IconCategory, IconOption } from "@/lib/fontawesome-icon-catalog";
import { loadIconOptions } from "@/lib/fontawesome-icon-catalog";
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

type Props = {
  value?: IconDefinition | null;
  onChange?: (icon: IconDefinition) => void;

  placeholder?: string;
  disabled?: boolean;

  // Optional: start category tab
  defaultCategory?: IconCategory;
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
    case "brands":
      return "Brands";
  }
}

export function FontAwesomeIconPicker({
  value = null,
  onChange,
  placeholder = "Pick an icon",
  disabled,
  defaultCategory = "solid",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<IconCategory>(defaultCategory);
  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query.trim().toLowerCase());

  const [state, setState] = React.useState<LoadState>({
    status: "idle",
    icons: [],
  });

  // Load icons lazily when opened and/or category changes.
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

  const filtered = React.useMemo(() => {
    const icons = state.icons;
    if (!deferredQuery) return icons;

    // Very fast substring match on precomputed `search`.
    // If you want fuzzy matching, do it here (but it costs more).
    return icons.filter((i) => i.search.includes(deferredQuery));
  }, [state.icons, deferredQuery]);

  // --- Virtualized grid setup ---
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [cols, setCols] = React.useState(8);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const width = el.clientWidth;
      // button size + gap; keep stable sizing for virtualization
      const cell = 44;
      const gap = 8;
      const next = Math.max(4, Math.min(12, Math.floor(width / (cell + gap))));
      setCols(next);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const rowSize = 52; // includes vertical gap
  const rowCount = Math.ceil(filtered.length / cols);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => listRef.current,
    estimateSize: () => rowSize,
    overscan: 10,
  });

  const selectedId = value ? `${value.prefix}:${value.iconName}` : null;

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
          className="w-[280px] justify-start gap-2"
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

      <PopoverContent className="w-[420px] p-3" align="start">
        <div className="flex flex-col gap-3">
          <Tabs
            value={category}
            onValueChange={(v) => setCategory(v as IconCategory)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="solid">{categoryLabel("solid")}</TabsTrigger>
              <TabsTrigger value="regular">
                {categoryLabel("regular")}
              </TabsTrigger>
              <TabsTrigger value="brands">{categoryLabel("brands")}</TabsTrigger>
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

          <Command shouldFilter={false} className="border">
            <div
              ref={listRef}
              className={cn(
                "relative max-h-[320px] overflow-auto",
                "p-2",
              )}
            >
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
                        style={{
                          transform: `translateY(${row.start}px)`,
                        }}
                      >
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
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