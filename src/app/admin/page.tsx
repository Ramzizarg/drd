import { prisma } from "@/lib/prisma";
import { formatVariantSelections } from "@/lib/product-offers";
import { format } from "date-fns";
import Link from "next/link";
import { LayoutDashboard, LineChart, Package, ShoppingCart, Eye, Clock, CheckCircle, X, Truck } from "lucide-react";
import { AdminNavHomeLink } from "@/components/admin/AdminNavHomeLink";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Logo } from "@/components/Logo";
import { revalidatePath } from "next/cache";
import { OrderStatusControls } from "@/components/admin/OrderStatusControls";

async function updateOrderAdmin(formData: FormData) {
  "use server";

  const idRaw = formData.get("orderId");
  const statusRaw = formData.get("status");
  const phoneConfirmedRaw = formData.get("phoneConfirmed");

  const id = Number(idRaw);
  const status = typeof statusRaw === "string" ? statusRaw : "PENDING";
  const phoneConfirmed = phoneConfirmedRaw === "true";

  if (!id || Number.isNaN(id)) {
    return;
  }

  await prisma.order.update({
    where: { id },
    data: {
      status: status as any,
      phoneConfirmed,
    },
  });

  revalidatePath("/admin");
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // Pagination basique: 10 commandes par page
  const pageSize = 10;
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);

  // Récupération des statistiques et des commandes en base
  const totalOrders = await prisma.order.count();
  const productsCount = await prisma.product.count();
  const revenueAgg = await prisma.order.aggregate({
    _sum: { total: true },
  });
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  // Livraison incluse dans le prix produit (aucune ligne livraison à déduire)
  const SHIPPING_COST = 0;

  // Récupérer les produits associés aux commandes pour afficher leur nom + image
  const productIds = Array.from(new Set(orders.map((o) => o.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const stats = {
    totalOrders,
    products: productsCount,
    totalRevenue: (revenueAgg._sum.total ?? 0) - totalOrders * SHIPPING_COST,
    visitorsToday: 0,
    visitorsYesterdayDiff: 0,
  };

  const recentOrders = orders.map((order: any) => {
    const product = productMap.get(order.productId);

    return {
      id: Number(order.id) || 0,
      customerName: order.name,
      city: order.city,
      phone: order.phone,
      productName: product?.name ?? `Produit #${order.productId}`,
      productImageUrl: product?.imageUrl ?? null,
      color: order.color ?? null,
      size: order.size ?? null,
      variantSummary: formatVariantSelections(
        order.variantColors?.length ? order.variantColors : order.color ? [order.color] : [],
        order.variantSizes?.length ? order.variantSizes : order.size ? [order.size] : []
      ),
      items: order.pack,
      total: order.total,
      netTotal: Math.max(order.total - SHIPPING_COST, 0),
      date: order.createdAt,
      phoneConfirmed: order.phoneConfirmed ?? false,
      status: order.status as "PENDING" | "LIVREE" | "RETOUR" | "ANNULEE",
      deliveryStatus:
        order.status === "LIVREE"
          ? ("LIVREE" as const)
          : order.status === "RETOUR"
          ? ("RETOUR" as const)
          : order.status === "ANNULEE"
          ? ("ANNULEE" as const)
          : ("EN_ATTENTE" as const),
    };
  });

  const statusCounts = recentOrders.reduce(
    (acc: Record<string, number>, order: any) => {
      const key = order.status;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize));

  return (
    <div className="min-h-screen bg-[#faf7f6] text-zinc-900">
      {/* Top navigation bar */}
      <header className="bg-zinc-900 text-sm text-zinc-100 shadow">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Logo height={32} />
            <span className="text-sm font-semibold text-[#ff5b5b]">Admin</span>
          </div>
          <nav className="flex items-center gap-4 overflow-x-auto md:gap-6">
            <button className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-100 hover:text-white transition-colors">
              <LayoutDashboard className="h-5 w-5 md:h-4 md:w-4 text-zinc-100" />
              <span className="hidden md:inline">Dashboard</span>
            </button>
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
      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-sky-600" />
            <span>Tableau de bord</span>
          </h1>
          <p className="text-sm text-zinc-500">
            Bienvenue dans votre espace d'administration.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-md ring-1 ring-rose-100 hover:shadow-lg transition-shadow">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                Total Commandes
              </p>
              <p className="mt-3 text-3xl font-semibold text-zinc-900">
                {stats.totalOrders}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-md ring-1 ring-rose-100 hover:shadow-lg transition-shadow">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                Produits
              </p>
              <p className="mt-3 text-3xl font-semibold text-zinc-900">
                {stats.products}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              <Package className="h-6 w-6" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-md ring-1 ring-rose-100 hover:shadow-lg transition-shadow">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                Revenu Total
              </p>
              <p className="mt-3 text-3xl font-semibold text-rose-500">
                {stats.totalRevenue.toFixed(2)} DT
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              <LineChart className="h-6 w-6" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-md ring-1 ring-rose-100 hover:shadow-lg transition-shadow">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                Visiteurs (Today)
              </p>
              <p className="mt-3 text-3xl font-semibold text-zinc-900">
                {stats.visitorsToday}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              <Eye className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Recent orders */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 hover:shadow-md transition-shadow">
          <div className="border-b border-zinc-100 px-1 py-3 flex items-center justify-between gap-3 md:px-5">
            <div className="leading-tight flex-shrink-0">
              {/* Mobile: two-line title, strong left alignment */}
              <h2 className="block text-base font-semibold text-zinc-900 md:hidden">
                Commandes
                <br />
                récentes
              </h2>
              {/* Desktop: single-line title */}
              <h2 className="hidden text-base font-semibold text-zinc-900 md:block md:text-lg">
                Commandes récentes
              </h2>
            </div>
            <div className="flex flex-wrap justify-end gap-2 text-[11px]">
              {/* Row 1: Livrée + En attente */}
              <div className="flex w-full gap-2 md:w-auto md:justify-end">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-emerald-700">
                    Livrée: {statusCounts["LIVREE"] || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-medium text-amber-700">
                    En attente: {statusCounts["PENDING"] || 0}
                  </span>
                </div>
              </div>

              {/* Row 2: Retour + Refusée */}
              <div className="flex w-full gap-2 md:w-auto md:justify-end">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  <span className="text-xs font-medium text-sky-700">
                    Retour: {statusCounts["RETOUR"] || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-medium text-rose-700">
                    Refusée: {statusCounts["ANNULEE"] || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-zinc-50">
            {recentOrders.map((order: any) => (
              <div
                key={order.id}
                className="px-4 py-4 space-y-3 md:flex md:items-center md:justify-between md:gap-4 md:px-6 md:py-3"
              >
                <div className="flex flex-1 flex-col gap-2 min-w-0 md:flex-row md:items-center md:gap-4">
                  {/* Left: id + client */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-semibold text-zinc-900">
                        #{order.id}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {format(order.date, "dd/MM")}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between gap-2">
                      <div className="text-sm font-medium text-zinc-900">
                        {order.customerName}
                      </div>
                      {/* Mobile-only price next to customer name */}
                      <div className="text-lg font-bold text-[#ff1744] md:hidden">
                        {order.netTotal.toFixed(2)} DT
                      </div>
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                      {order.city} · {order.phone}
                    </div>
                  </div>

                  {/* Middle: product with image */}
                  <div className="flex items-center gap-3 text-sm text-zinc-700 min-w-0">
                    {order.productImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={order.productImageUrl}
                        alt={order.productName}
                        className="h-10 w-10 rounded-lg object-cover border border-zinc-200 flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium line-clamp-1">
                        {order.productName}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {order.items} article{order.items > 1 ? "s" : ""}
                        {order.variantSummary && (
                          <>
                            {" · "}
                            {order.variantSummary}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: total + editable status & phone confirmation (auto-save) */}
                <div className="mt-2 md:mt-0 md:ml-4">
                  <OrderStatusControls
                    orderId={order.id}
                    initialStatus={order.status}
                    initialPhoneConfirmed={order.phoneConfirmed}
                    netTotal={order.netTotal}
                    updateAction={updateOrderAdmin}
                  />
                </div>
              </div>
            ))}
          </div>

          {recentOrders.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-zinc-500">
              Aucune commande récente pour le moment.
            </div>
          )}
          {/* Pagination */}
          {recentOrders.length > 0 && totalPages > 1 && (
            <div className="flex justify-center gap-2 px-6 py-4">
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                const isActive = page === currentPage;
                return (
                  <Link
                    key={page}
                    href={page === 1 ? "/admin" : `/admin?page=${page}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium transition-colors ${
                      isActive
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {page}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
