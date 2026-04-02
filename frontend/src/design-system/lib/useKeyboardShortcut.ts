import { useEffect, useCallback } from "react";

interface KeyboardShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

interface ShortcutDefinition {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
}

function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutDefinition): boolean {
  const ctrlOrMeta = shortcut.ctrl || shortcut.meta;
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modifier = isMac ? shortcut.meta : shortcut.ctrl;

  if (modifier && !event.ctrlKey && !event.metaKey) return false;
  if (!modifier && (event.ctrlKey || event.metaKey)) return false;
  if (shortcut.shift && !event.shiftKey) return false;
  if (shortcut.alt && !event.altKey) return false;
  if (!shortcut.shift && event.shiftKey) return false;
  if (!shortcut.alt && event.altKey) return false;

  const key = shortcut.key.toLowerCase();
  const eventKey = event.key.toLowerCase();

  return key === eventKey || key === event.code.toLowerCase().replace("key", "").replace("digit", "");
}

export function useKeyboardShortcut(
  shortcut: string,
  callback: () => void,
  options: KeyboardShortcutOptions = {}
): void {
  const { enabled = true, preventDefault = true } = options;

  const parseShortcut = useCallback((): ShortcutDefinition => {
    const parts = shortcut.toLowerCase().split("+");
    const key = parts[parts.length - 1];
    return {
      key,
      ctrl: parts.includes("ctrl"),
      meta: parts.includes("meta") || parts.includes("cmd"),
      shift: parts.includes("shift"),
      alt: parts.includes("alt"),
    };
  }, [shortcut]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      const parsed = parseShortcut();
      if (matchesShortcut(event, parsed)) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, callback, parseShortcut, preventDefault]);
}

export function useMultipleKeyboardShortcuts(
  shortcuts: Array<{ key: string; callback: () => void; options?: KeyboardShortcutOptions }>
): void {
  const shortcutsWithParsed = shortcuts.map((s) => ({
    ...s,
    parsed: (() => {
      const parts = s.key.toLowerCase().split("+");
      const key = parts[parts.length - 1];
      return {
        key,
        ctrl: parts.includes("ctrl"),
        meta: parts.includes("meta") || parts.includes("cmd"),
        shift: parts.includes("shift"),
        alt: parts.includes("alt"),
      };
    })(),
  }));

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      for (const shortcut of shortcutsWithParsed) {
        if (shortcut.options?.enabled === false) continue;
        if (matchesShortcut(event, shortcut.parsed)) {
          if (shortcut.options?.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcutsWithParsed]);
}
