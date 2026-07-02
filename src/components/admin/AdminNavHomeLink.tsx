import Link from "next/link";
import { Home } from "lucide-react";
import { getHomeHref } from "@/lib/products";

export async function AdminNavHomeLink() {
  const href = await getHomeHref();

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-100 hover:text-white transition-colors"
    >
      <Home className="h-5 w-5 md:h-4 md:w-4 text-zinc-100" />
      <span className="hidden md:inline">Accueil</span>
    </Link>
  );
}
