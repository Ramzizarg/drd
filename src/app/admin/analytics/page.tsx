import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import {
  BarChart3,
  DollarSign,
  Package2,
  ShoppingCart,
  TrendingUp,
  PieChart,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  X,
  Truck,
  CircleDot,
  LayoutDashboard,
  LineChart,
  Package,
  Home,
} from "lucide-react";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Logo } from "@/components/Logo";

function getLastSixMonths() {
  const months: { key: string; label: string }[] = [];
  const formatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });

  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months.push({ key, label: formatter.format(d) });
  }
  return months;
}

export default async function AnalyticsPage() {
  const [orders, productsCount] = await Promise.all([
    prisma.order.findMany(),
    prisma.product.count(),
  ]);

  const SHIPPING_COST = 0;

  // Charger les produits correspondants pour les agrégations par produit
  const productIds = Array.from(new Set(orders.map((o) => o.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o: any) => sum + (o.total ?? 0), 0) - totalOrders * SHIPPING_COST;
  const averageBasket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const statusCounts = orders.reduce(
    (acc: Record<string, number>, order: any) => {
      const key = order.status as string;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const months = getLastSixMonths();
  const monthly = months.map((m) => {
    const [y, mm] = m.key.split("-").map(Number);
    const monthOrders = orders.filter((o: any) => {
      const d = new Date(o.createdAt);
      return d.getFullYear() === y && d.getMonth() === mm;
    });
    const revenue = monthOrders.reduce((sum, o: any) => sum + (o.total ?? 0), 0) - monthOrders.length * SHIPPING_COST;
    return { ...m, revenue, count: monthOrders.length };
  });

  const productAgg = orders.reduce(
    (acc: Record<string, { name: string; count: number; revenue: number }>, order: any) => {
      const product = productMap.get(order.productId);
      if (!product) return acc;
      const key = product.id;
      if (!acc[key]) {
        acc[key] = {
          name: product.name,
          count: 0,
          revenue: 0,
        };
      }
      acc[key].count += order.pack ?? 1;
      acc[key].revenue += (order.total ?? 0) - SHIPPING_COST;
      return acc;
    },
    {}
  );

  const topProducts = Object.values(productAgg)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const cityAgg = orders.reduce(
    (acc: Record<string, number>, order: any) => {
      const city = order.city || "Inconnu";
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    },
    {}
  );

  const topCities = Object.entries(cityAgg)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

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
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-100 hover:text-white transition-colors"
            >
              <Home className="h-5 w-5 md:h-4 md:w-4 text-zinc-100" />
              <span className="hidden md:inline">Accueil</span>
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-sky-600" />
            <span>Analytiques</span>
          </h1>
          <p className="text-sm text-zinc-500">
            Vue d'ensemble des performances de votre boutique.
          </p>
        </div>

        {/* Top summary cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-emerald-50 hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">
                Revenu Total
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {totalRevenue.toFixed(2)} DT
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-sky-50">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">
                Commandes
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {totalOrders}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-sky-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-violet-50">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">
                Produits
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {productsCount}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-violet-600">
              <Package2 className="h-5 w-5" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-amber-50">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">
                Panier Moyen
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {averageBasket.toFixed(2)} DT
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Middle row: monthly revenue + status */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-sky-600" />
              <span>Revenu Mensuel (6 mois)</span>
            </h2>
            <div className="mt-4 space-y-2">
              {monthly.map((m) => {
                const maxRevenue = Math.max(...monthly.map((mm) => mm.revenue));
                const pct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={m.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-600">
                      <span className="capitalize">{m.label}</span>
                      <span>
                        {m.revenue.toFixed(2)} DT ({m.count} commande{m.count > 1 ? "s" : ""})
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-zinc-100">
                      <div
                        className="h-2.5 rounded-full bg-sky-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <span>Commandes par Statut</span>
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-700">En attente</span>
                </div>
                <span className="font-medium">{statusCounts["PENDING"] ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-700">Confirmée</span>
                </div>
                <span className="font-medium">{statusCounts["CONFIRMED"] ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-700">Retour</span>
                </div>
                <span className="font-medium">{statusCounts["RETURN"] ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-rose-500" />
                  <span className="text-rose-700">Annulée</span>
                </div>
                <span className="font-medium">{statusCounts["CANCELLED"] ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: top products + top cities */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <span>Top 5 Produits</span>
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              {topProducts.length === 0 && (
                <p className="text-xs text-zinc-500">Pas encore de données produits.</p>
              )}
              {topProducts.map((p, index) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">{p.name}</p>
                    <p className="text-xs text-zinc-500">
                      {p.count} vendu{p.count > 1 ? "s" : ""} · {p.revenue.toFixed(2)} DT
                    </p>
                  </div>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[11px] font-semibold text-white">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-600" />
              <span>Top 5 Gouvernorats</span>
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              {topCities.length === 0 && (
                <p className="text-xs text-zinc-500">Pas encore de données par région.</p>
              )}
              {topCities.map((c) => (
                <div key={c.city} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{c.city}</span>
                    <span className="text-xs text-zinc-500">
                      {c.count} commande{c.count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-zinc-100">
                    <div
                      className="h-2.5 rounded-full bg-sky-500"
                      style={{ width: `${(c.count / (topCities[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
