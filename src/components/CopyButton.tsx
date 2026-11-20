"use client";

import { useRef, useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy(e: React.MouseEvent<HTMLButtonElement>) {
    let msg = "Copied";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      msg = /Mac|iPhone|iPad/i.test(navigator.platform) ? "Press ⌘C" : "Press Ctrl+C";
      // Fallback: select the sibling code text so the user can copy manually.
      const code = e.currentTarget.parentElement?.querySelector("code");
      if (code) {
        const range = document.createRange();
        range.selectNodeContents(code);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    setStatus(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(null), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-muted hover:text-ink"
    >
      <span aria-live="polite">{status ?? label}</span>
    </button>
  );
}
