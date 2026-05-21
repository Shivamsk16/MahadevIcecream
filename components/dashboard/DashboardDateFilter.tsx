"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardDateFilterMode } from "@/lib/utils/dashboardAnalytics";
import {
  clampDateInputToToday,
  getTodayDateInputValue,
} from "@/lib/utils/dashboardAnalytics";

const TRIGGER_WIDTH = 180;
const MENU_WIDTH = 180;
const DATE_PANEL_WIDTH = 280;
const DATE_PANEL_BODY_HEIGHT = 210;

const FLOATING_PANEL_CLASS =
  "fixed z-50 rounded-xl border border-neutral-200 bg-surface py-1 shadow-lift animate-in fade-in-0 zoom-in-95 origin-top-left dark:border-zinc-800 dark:bg-zinc-900/95 dark:backdrop-blur-xl dark:shadow-dark-lift";

const MENU_ITEM_CLASS =
  "block w-full px-4 py-2.5 text-left text-sm transition-colors";

const FILTER_OPTIONS: { value: DashboardDateFilterMode; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "today", label: "Today" },
  { value: "custom", label: "Custom Date" },
  { value: "range", label: "Custom Date Range" },
];

const POPOVER_GAP = 8;
const VIEWPORT_PAD = 12;

type FloatingCoords = { top: number; left: number };

function getModeLabel(mode: DashboardDateFilterMode): string {
  return FILTER_OPTIONS.find((o) => o.value === mode)?.label ?? "All Orders";
}

function computeFloatingPosition(
  anchor: HTMLElement,
  panelWidth: number,
  panelHeight: number
): FloatingCoords {
  const rect = anchor.getBoundingClientRect();
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  let top = rect.bottom + POPOVER_GAP;
  let left = rect.left;

  if (top + panelHeight > viewportH - VIEWPORT_PAD) {
    top = rect.top - panelHeight - POPOVER_GAP;
  }
  top = Math.max(VIEWPORT_PAD, top);

  if (left + panelWidth > viewportW - VIEWPORT_PAD) {
    left = viewportW - panelWidth - VIEWPORT_PAD;
  }
  left = Math.max(VIEWPORT_PAD, left);

  return { top, left };
}

type DashboardDateFilterProps = {
  mode: DashboardDateFilterMode;
  onModeChange: (mode: DashboardDateFilterMode) => void;
  customDate: string;
  onCustomDateChange: (value: string) => void;
  rangeFrom: string;
  onRangeFromChange: (value: string) => void;
  rangeTo: string;
  onRangeToChange: (value: string) => void;
  className?: string;
};

export function DashboardDateFilter({
  mode,
  onModeChange,
  customDate,
  onCustomDateChange,
  rangeFrom,
  onRangeFromChange,
  rangeTo,
  onRangeToChange,
  className,
}: DashboardDateFilterProps) {
  const todayMax = getTodayDateInputValue();
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const datePanelRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<FloatingCoords | null>(null);
  const [dateCoords, setDateCoords] = useState<FloatingCoords | null>(null);

  const [draftCustom, setDraftCustom] = useState(customDate);
  const [draftFrom, setDraftFrom] = useState(rangeFrom);
  const [draftTo, setDraftTo] = useState(rangeTo);

  const datePanelHeight =
    44 + DATE_PANEL_BODY_HEIGHT + 1; /* header + body + border */

  useEffect(() => {
    setMounted(true);
  }, []);

  function syncDraftFromApplied() {
    setDraftCustom(customDate);
    setDraftFrom(rangeFrom);
    setDraftTo(rangeTo);
  }

  function closeMenu() {
    setMenuOpen(false);
    setMenuCoords(null);
  }

  function closeDatePopover() {
    setDatePopoverOpen(false);
    setDateCoords(null);
  }

  function closeAll() {
    closeMenu();
    closeDatePopover();
  }

  const updateMenuPosition = useCallback(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;
    setMenuCoords(
      computeFloatingPosition(anchor, MENU_WIDTH, menu.offsetHeight)
    );
  }, []);

  const updateDatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    setDateCoords(
      computeFloatingPosition(anchor, DATE_PANEL_WIDTH, datePanelHeight)
    );
  }, [datePanelHeight]);

  useLayoutEffect(() => {
    if (!menuOpen) return;
    updateMenuPosition();
  }, [menuOpen, updateMenuPosition]);

  useLayoutEffect(() => {
    if (!datePopoverOpen) return;
    updateDatePosition();
  }, [datePopoverOpen, updateDatePosition]);

  useEffect(() => {
    if (!menuOpen && !datePopoverOpen) return;

    const handleReposition = () => {
      if (menuOpen) updateMenuPosition();
      if (datePopoverOpen) updateDatePosition();
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [menuOpen, datePopoverOpen, updateMenuPosition, updateDatePosition]);

  useEffect(() => {
    if (mode !== "custom" && mode !== "range") {
      closeDatePopover();
    }
  }, [mode]);

  useEffect(() => {
    if (!menuOpen && !datePopoverOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (datePopoverOpen) {
        closeDatePopover();
        return;
      }
      closeMenu();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, datePopoverOpen]);

  function openDatePopoverAfterMenu() {
    syncDraftFromApplied();
    window.setTimeout(() => {
      setDatePopoverOpen(true);
    }, 0);
  }

  function selectMode(next: DashboardDateFilterMode) {
    closeMenu();
    onModeChange(next);

    if (next === "custom" || next === "range") {
      openDatePopoverAfterMenu();
    } else {
      closeDatePopover();
    }
  }

  function handleTriggerClick() {
    if (datePopoverOpen) {
      closeDatePopover();
    }
    setMenuOpen((open) => !open);
  }

  function handleDraftRangeFromChange(value: string) {
    const next = clampDateInputToToday(value);
    setDraftFrom(next);
    if (next > draftTo) setDraftTo(next);
  }

  function handleDraftRangeToChange(value: string) {
    const next = clampDateInputToToday(value);
    if (next < draftFrom) {
      setDraftFrom(next);
      setDraftTo(next);
      return;
    }
    setDraftTo(next);
  }

  function handleApply() {
    if (mode === "custom") {
      onCustomDateChange(clampDateInputToToday(draftCustom));
    }
    if (mode === "range") {
      onRangeFromChange(draftFrom);
      onRangeToChange(draftTo);
    }
    closeDatePopover();
  }

  const overlayOpen = menuOpen || datePopoverOpen;

  const portalContent =
    mounted && overlayOpen ? (
      <>
        <button
          type="button"
          className="fixed inset-0 z-40"
          aria-label="Close filter"
          onClick={closeAll}
        />

        {menuOpen && (
          <div
            ref={menuRef}
            role="listbox"
            aria-label="Filter period"
            className={cn(FLOATING_PANEL_CLASS, !menuCoords && "invisible")}
            style={
              menuCoords
                ? {
                    top: menuCoords.top,
                    left: menuCoords.left,
                    width: MENU_WIDTH,
                  }
                : { top: 0, left: 0, width: MENU_WIDTH }
            }
          >
            <p className="border-b border-neutral-100 px-4 py-2.5 text-sm font-medium text-heading dark:border-zinc-800">
              Filter period
            </p>
            <ul className="py-1">
              {FILTER_OPTIONS.map((option) => {
                const isActive = mode === option.value;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={cn(
                        MENU_ITEM_CLASS,
                        isActive
                          ? "bg-primary-soft/40 font-medium text-heading dark:bg-red-950/30"
                          : "text-muted hover:bg-neutral-50 hover:text-heading dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      )}
                      onClick={() => selectMode(option.value)}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {datePopoverOpen && (mode === "custom" || mode === "range") && (
          <div
            ref={datePanelRef}
            role="dialog"
            aria-modal="true"
            aria-label={
              mode === "custom" ? "Custom date filter" : "Date range filter"
            }
            className={cn(
              FLOATING_PANEL_CLASS,
              "transition-[top,left] duration-150 ease-out",
              !dateCoords && "invisible"
            )}
            style={
              dateCoords
                ? {
                    top: dateCoords.top,
                    left: dateCoords.left,
                    width: DATE_PANEL_WIDTH,
                  }
                : { top: 0, left: 0, width: DATE_PANEL_WIDTH }
            }
          >
            <p className="border-b border-neutral-100 px-4 py-2.5 text-sm font-medium text-heading dark:border-zinc-800">
              {mode === "custom" ? "Custom Date" : "Custom Date Range"}
            </p>

            <div
              className="flex flex-col px-4 py-3"
              style={{ height: DATE_PANEL_BODY_HEIGHT }}
            >
              <div className="min-h-0 flex-1">
                {mode === "custom" ? (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="dashboard-custom-date"
                      className="text-xs font-medium text-muted"
                    >
                      Date
                    </label>
                    <Input
                      id="dashboard-custom-date"
                      type="date"
                      value={draftCustom}
                      max={todayMax}
                      onChange={(e) =>
                        setDraftCustom(clampDateInputToToday(e.target.value))
                      }
                      className="form-input h-9 w-full py-1 text-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="dashboard-range-from"
                        className="text-xs font-medium text-muted"
                      >
                        From
                      </label>
                      <Input
                        id="dashboard-range-from"
                        type="date"
                        value={draftFrom}
                        max={todayMax}
                        onChange={(e) =>
                          handleDraftRangeFromChange(e.target.value)
                        }
                        className="form-input h-9 w-full py-1 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="dashboard-range-to"
                        className="text-xs font-medium text-muted"
                      >
                        To
                      </label>
                      <Input
                        id="dashboard-range-to"
                        type="date"
                        value={draftTo}
                        min={draftFrom}
                        max={todayMax}
                        onChange={(e) =>
                          handleDraftRangeToChange(e.target.value)
                        }
                        className="form-input h-9 w-full py-1 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="button"
                size="sm"
                className="mt-3 h-9 w-full shrink-0"
                onClick={handleApply}
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </>
    ) : null;

  return (
    <div
      ref={anchorRef}
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      <button
        type="button"
        className={cn(
          "form-input flex h-9 shrink-0 items-center justify-between gap-2 py-1 pl-3 pr-2 text-left text-xs",
          (menuOpen || datePopoverOpen) &&
            "ring-4 ring-red-100 dark:ring-red-900/30"
        )}
        style={{ width: TRIGGER_WIDTH }}
        onClick={handleTriggerClick}
        aria-label="Filter period"
        aria-expanded={menuOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate font-medium text-heading">
          {getModeLabel(mode)}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200",
            menuOpen && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {portalContent ? createPortal(portalContent, document.body) : null}
    </div>
  );
}
