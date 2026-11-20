"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Inner() {
  const q = useSearchParams().get("q") ?? "";
  const href = q ? `/?q=${encodeURIComponent(q)}` : "/";
  return (
    <Link href={href} className="rounded text-sm text-muted hover:text-ink">
      ← All skills
    </Link>
  );
}

export function BackLink() {
  return (
    <Suspense
      fallback={
        <Link href="/" className="rounded text-sm text-muted hover:text-ink">
          ← All skills
        </Link>
      }
    >
      <Inner />
    </Suspense>
  );
}
