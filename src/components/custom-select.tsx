"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  id: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  searchable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

export default function CustomSelect({
  id,
  value,
  options,
  onValueChange,
  searchable = false,
  placeholder = "Choose an option",
  disabled = false,
  className = "",
  ariaLabel,
}: CustomSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedQuery));
  }, [options, query]);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = filteredOptions.findIndex((option) => option.value === value);
    const nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
    setActiveIndex(nextIndex);
    if (searchable) {
      searchRef.current?.focus();
    } else {
      requestAnimationFrame(() => optionRefs.current[nextIndex]?.focus());
    }
  }, [filteredOptions, open, searchable, value]);

  function closeMenu(returnFocus: boolean) {
    setOpen(false);
    setQuery("");
    if (returnFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function selectOption(option: SelectOption) {
    onValueChange(option.value);
    closeMenu(true);
  }

  function focusOption(index: number) {
    if (filteredOptions.length === 0) return;
    const boundedIndex = Math.max(0, Math.min(index, filteredOptions.length - 1));
    setActiveIndex(boundedIndex);
    requestAnimationFrame(() => optionRefs.current[boundedIndex]?.focus());
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement | HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusOption(filteredOptions.length - 1);
    } else if (event.key === "Enter" && filteredOptions[activeIndex]) {
      event.preventDefault();
      selectOption(filteredOptions[activeIndex]);
    }
  }

  return (
    <div className={`custom-select ${className}`.trim()} ref={rootRef}>
      <button
        aria-label={ariaLabel}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="custom-select-trigger"
        disabled={disabled}
        id={id}
        onClick={() => {
          if (open) closeMenu(false);
          else setOpen(true);
        }}
        ref={triggerRef}
        type="button"
      >
        <span className={`custom-select-value ${selectedOption ? "" : "placeholder"}`}>
          {selectedOption?.label ?? placeholder}
        </span>
        <span className="custom-select-chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="custom-select-popover">
          {searchable && (
            <div className="custom-select-search-wrap">
              <input
                aria-label={`Filter ${ariaLabel ?? "options"}`}
                autoComplete="off"
                className="custom-select-search"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleMenuKeyDown}
                placeholder="Type to filter…"
                ref={searchRef}
                role="combobox"
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-expanded="true"
                value={query}
              />
              <span className="custom-select-search-icon" aria-hidden="true">⌕</span>
            </div>
          )}
          <div
            aria-label={ariaLabel}
            className="custom-select-options"
            id={listboxId}
            onKeyDown={handleMenuKeyDown}
            role="listbox"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const selected = option.value === value;
                return (
                  <div
                    aria-selected={selected}
                    className={`custom-select-option${selected ? " selected" : ""}`}
                    key={option.value}
                    onClick={() => selectOption(option)}
                    onFocus={() => setActiveIndex(index)}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    role="option"
                    tabIndex={-1}
                  >
                    <span className="custom-select-option-label">{option.label}</span>
                    <span className="custom-select-option-check" aria-hidden="true">
                      {selected ? "✓" : ""}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="custom-select-empty">No matching options</p>
            )}
          </div>
          {searchable && (
            <p className="custom-select-hint">
              {filteredOptions.length} {filteredOptions.length === 1 ? "option" : "options"}
              <span>↑ ↓ to navigate · Enter to choose</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
