import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mt-16">
      <h1 className="font-serif text-3xl font-semibold">Skill not found</h1>
      <p className="mt-3 text-muted">That page does not exist.</p>
      <Link href="/" className="mt-4 inline-block rounded text-terracotta hover:text-terracotta-hover">
        ← All skills
      </Link>
    </div>
  );
}
