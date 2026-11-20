"use client";

import { useRef, useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy(e: React.MouseEvent<HTMLButtonElement>) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
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
    if (ok) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-muted hover:text-ink"
    >
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
