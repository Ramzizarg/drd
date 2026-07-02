import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LayoutDashboard, LineChart, Package, Plus, Trash2, Edit3 } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminNavHomeLink } from "@/components/admin/AdminNavHomeLink";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Logo } from "@/components/Logo";

async function deleteProduct(id: number) {
  "use server";
  await prisma.product.delete({ where: { id } });
  redirect("/admin/products");
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; warn?: string }>;
}) {
  const { saved, warn } = await searchParams;
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#faf7f6] text-zinc-900">
      {/* Shared admin header */}
      <header className="bg-zinc-900 text-sm text-zinc-100 shadow">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Logo height={32} />
            <span className="text-sm font-semibold text-[#ff5b5b]">Admin</span>
          </div>
          <nav className="flex items-center gap-4 overflow-x-auto md:gap-6">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-100 hover:text-white transition-colors"
            >
              <LayoutDashboard className="h-5 w-5 md:h-4 md:w-4 text-zinc-100" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-100 hover:text-white transition-colors"
            >
              <LineChart className="h-5 w-5 md:h-4 md:w-4 text-zinc-100" />
              <span className="hidden md:inline">Analytiques</span>
            </Link>
            <Link
              href="/admin/products"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-100 hover:text-white transition-colors"
            >
              <Package className="h-5 w-5 md:h-4 md:w-4 text-zinc-100" />
              <span className="hidden md:inline">Gérer produits</span>
            </Link>
            <AdminNavHomeLink />
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-6 md:px-8">
        {/* Top actions */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Tabs: Tous les produits / Ajouter un produit */}
          <div className="w-full rounded-full border border-zinc-200 bg-white p-1 text-xs font-medium shadow-sm md:inline-flex md:w-auto">
            <div className="flex w-full gap-1">
              <button className="flex-1 rounded-full bg-zinc-900 px-3 py-2 text-center text-white">
                Tous les produits
              </button>
              <Link
                href="/admin/products/new"
                className="flex-1 rounded-full px-3 py-2 text-center text-zinc-700 hover:bg-zinc-100"
              >
                Ajouter un produit
              </Link>
            </div>
          </div>

          {/* Add button: full-width bar on mobile, pill on desktop */}
          <Link
            href="/admin/products/new"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-zinc-800 md:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter</span>
          </Link>
        </div>

        <section className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Gestion des produits</h1>

          {saved === "1" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Modifications enregistrées avec succès.
            </div>
          )}

          {warn && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Produit enregistré, mais : {decodeURIComponent(warn)}
            </div>
          )}

          {products.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              Aucun produit pour le moment. Ajoutez votre premier produit.
            </p>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-100 hover:shadow-md transition-shadow md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3 md:items-center md:gap-4">
                    <div className="flex flex-col items-center justify-center text-[10px] text-zinc-400 w-10">
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1">#{product.id}</span>
                    </div>
                    <div className="h-20 w-20 overflow-hidden rounded-xl bg-zinc-100">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
                          Pas d'image
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <h2 className="text-sm font-semibold text-zinc-900">
                        {product.name}
                      </h2>
                      <p className="text-[11px] text-zinc-500 line-clamp-1">
                        {product.description}
                      </p>

                      {/* Mobile: price under product name */}
                      <div className="mt-1 flex flex-col items-start gap-1 text-xs md:hidden">
                        <p className="text-[11px] text-zinc-500 line-through">
                          {product.price.toFixed(2)} DT
                        </p>
                        <span className="inline-flex items-center rounded-full bg-[#ff1744] px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          {(product.salePrice && !Number.isNaN(product.salePrice)
                            ? product.salePrice
                            : product.price
                          ).toFixed(2)} DT
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 text-xs md:flex-row md:items-center md:gap-4">
                    {/* Desktop: stacked price text on the right */}
                    <div className="hidden text-right space-y-0.5 md:block">
                      <p className="text-[11px] text-zinc-500 line-through">
                        {product.price.toFixed(2)} DT
                      </p>
                      <p className="text-sm font-semibold text-[#ff1744]">
                        {(product.salePrice && !Number.isNaN(product.salePrice)
                          ? product.salePrice
                          : product.price
                        ).toFixed(2)} DT
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/product/${product.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-[12px] font-medium text-sky-700 hover:bg-sky-100 hover:border-sky-300"
                      >
                        <span>Voir page</span>
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-[12px] font-medium text-amber-800 hover:bg-amber-100 hover:border-amber-300"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Editer</span>
                      </Link>
                      <form action={deleteProduct.bind(null, product.id)}>
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-full bg-rose-500 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-rose-600"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
