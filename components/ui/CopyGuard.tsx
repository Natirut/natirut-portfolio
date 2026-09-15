"use client";

import { useEffect } from "react";

/**
 * Discourages copying the page's text: blocks selection, copy/cut, dragging,
 * the context menu and the select-all / copy shortcuts. Form fields stay usable.
 * (Anything rendered in a browser can still be read via dev tools; this only
 * stops casual copying.)
 */
export default function CopyGuard() {
  useEffect(() => {
    const editable = (t: EventTarget | null) =>
      t instanceof HTMLElement && !!t.closest("input, textarea, [contenteditable='true']");

    const block = (e: Event) => {
      if (!editable(e.target)) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || editable(e.target)) return;
      if (["a", "c", "x"].includes(e.key.toLowerCase())) e.preventDefault();
    };

    const events = ["copy", "cut", "contextmenu", "selectstart", "dragstart"] as const;
    events.forEach((name) => document.addEventListener(name, block));
    document.addEventListener("keydown", onKey);
    return () => {
      events.forEach((name) => document.removeEventListener(name, block));
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
