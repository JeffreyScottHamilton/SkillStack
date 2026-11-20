export function formatStars(n: number | null | undefined): string {
  return typeof n === "number" ? new Intl.NumberFormat("en-US").format(n) : "—";
}
