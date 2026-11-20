import { formatStars } from "@/lib/format";

export function StarCount({ value }: { value: number | null | undefined }) {
  if (typeof value !== "number") {
    return <span aria-label="Star count unavailable">—</span>;
  }
  return <span>{formatStars(value)}</span>;
}
