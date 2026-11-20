import { isCategoryId } from "@/lib/categories";
import { getLiveCatalog } from "@/lib/catalog.server";
import { DEFAULT_LIMIT, MAX_LIMIT, searchSkills } from "@/lib/search";

export const runtime = "nodejs";

const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

function intParam(v: string | null, fallback: number, min: number, max: number): number {
  const n = v === null || v.trim() === "" ? NaN : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") ?? "").slice(0, 200);
  const rawCat = params.get("cat");
  const cat = isCategoryId(rawCat) ? rawCat : null;
  const offset = intParam(params.get("offset"), 0, 0, 1_000_000);
  const limit = intParam(params.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);

  const catalog = await getLiveCatalog();
  const result = searchSkills(catalog.index, { q, cat, offset, limit });
  return Response.json(result, { headers: { "Cache-Control": CACHE_CONTROL } });
}
