import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LayoutDashboard, LineChart, Package } from "lucide-react";
import { AdminNavHomeLink } from "@/components/admin/AdminNavHomeLink";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Logo } from "@/components/Logo";
import { ProductImagesUploader } from "@/components/admin/ProductImagesUploader";
import { ProductFeaturesNewEditor } from "@/components/admin/ProductFeaturesNewEditor";
import { ProductVariantsEditor } from "@/components/admin/ProductVariantsEditor";
import { uploadFile } from "@/lib/upload";
import { parseColorSizesFromForm, colorSizesToDbFields } from "@/lib/product-options";

async function createProduct(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const price = parseFloat(String(formData.get("price") || "0"));
  const salePriceRaw = formData.get("salePrice");
  const salePrice = salePriceRaw ? parseFloat(String(salePriceRaw)) : null;
  const offer2OriginalRaw = formData.get("offer2OriginalPrice");
  const offer2SaleRaw = formData.get("offer2SalePrice");
  const offer3OriginalRaw = formData.get("offer3OriginalPrice");
  const offer3SaleRaw = formData.get("offer3SalePrice");
  const offer2OriginalPrice = offer2OriginalRaw ? parseFloat(String(offer2OriginalRaw)) : null;
  const offer2SalePrice = offer2SaleRaw ? parseFloat(String(offer2SaleRaw)) : null;
  const offer3OriginalPrice = offer3OriginalRaw ? parseFloat(String(offer3OriginalRaw)) : null;
  const offer3SalePrice = offer3SaleRaw ? parseFloat(String(offer3SaleRaw)) : null;
  const files = formData.getAll("files") as File[];
  const primaryIndex = parseInt(String(formData.get("primaryIndex") || "0"));
  const featureTitles = formData.getAll("featureTitles").map((v) => String(v));
  const featureDescriptions = formData.getAll("featureDescriptions").map((v) => String(v));
  const parsedColorSizes = parseColorSizesFromForm(formData);
  const { colorSizes, colors, sizes } = colorSizesToDbFields(parsedColorSizes);
  
  if (!files || files.length === 0) {
    redirect("/admin/products");
  }

  if (!name || !price || Number.isNaN(price)) {
    // In real app you'd return validation errors; here we just redirect back.
    redirect("/admin/products");
  }

  // Upload all files and collect their URLs
  const uploadedFiles: { url: string; isPrimary: boolean }[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file || !file.name) continue;
    
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadFile(`products`, file.name, buffer, file.type);

    uploadedFiles.push({
      url,
      isPrimary: i === primaryIndex
    });
  }
  
  if (uploadedFiles.length === 0) {
    redirect("/admin/products");
  }
  
  // Create product with the primary image URL
  const primaryImage = uploadedFiles[primaryIndex] || uploadedFiles[0];
  const product = await prisma.product.create({
    data: {
      name,
      description: "",
      price,
      salePrice: salePrice && !Number.isNaN(salePrice) ? salePrice : null,
      imageUrl: primaryImage.url,
      offer2OriginalPrice: offer2OriginalPrice && !Number.isNaN(offer2OriginalPrice) ? offer2OriginalPrice : null,
      offer2SalePrice: offer2SalePrice && !Number.isNaN(offer2SalePrice) ? offer2SalePrice : null,
      offer3OriginalPrice: offer3OriginalPrice && !Number.isNaN(offer3OriginalPrice) ? offer3OriginalPrice : null,
      offer3SalePrice: offer3SalePrice && !Number.isNaN(offer3SalePrice) ? offer3SalePrice : null,
      colors,
      sizes,
      colorSizes,
    },
  });
  
  // Create all product images
  await Promise.all(
    uploadedFiles.map((file, index) => 
      prisma.productImage.create({
        data: {
          productId: product.id,
          url: file.url,
          isPrimary: index === primaryIndex,
        },
      })
    )
  );

  // Create product features (Caractéristiques du produit) with their own images
  // We expect one file input per row: featureNewImage_{index}
  const featureUploads: (string | null)[] = [];

  for (let i = 0; i < featureTitles.length; i++) {
    const raw = formData.get(`featureNewImage_${i}`);
    const file = raw instanceof File ? (raw as File) : null;

    if (!file || !file.name || file.size <= 0) {
      featureUploads[i] = null;
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    featureUploads[i] = await uploadFile(`features`, file.name, buffer, file.type);
  }

  const featuresData = featureDescriptions
    .map((description, index) => ({
      title: (featureTitles[index] || "").trim(),
      description: description.trim(),
      imageUrl: featureUploads[index] ?? null,
      order: index,
    }))
    // Save a feature as long as it has a title and an image; description is optional
    .filter((f) => f.title && f.imageUrl);

  if (featuresData.length > 0) {
    await prisma.productFeature.createMany({
      data: featuresData.map((f) => ({
        productId: product.id,
        title: f.title,
        imageUrl: f.imageUrl!,
        description: f.description,
        order: f.order,
      })),
    });
  }

  redirect("/admin/products");
}

export default function NewProductPage() {
  return (
    <div className="min-h-screen bg-[#faf7f6] text-zinc-900 flex flex-col">
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

      <main className="flex-1 flex justify-center items-start px-4 pt-6 pb-12">
        <div className="w-full max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight mb-6">Ajouter un produit</h1>
          <form
            action={createProduct}
            className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100"
          >
            {/* Nom */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-800" htmlFor="name">
                Nom du produit
              </label>
              <input
                id="name"
                name="name"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                required
              />
            </div>

            {/* Images */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-800">
                Images du produit
              </label>
              <ProductImagesUploader />
              <p className="text-[11px] text-zinc-500">
                Ajoutez une ou plusieurs images. Cliquez sur une image pour la définir comme principale.
              </p>
            </div>

            {/* Couleurs & tailles */}
            <ProductVariantsEditor />

            {/* Caractéristiques du produit */}
            <div className="space-y-2 rounded-xl border border-zinc-200 p-3">
              <p className="text-xs font-semibold text-zinc-700">Caractéristiques du produit</p>
              <ProductFeaturesNewEditor />
            </div>

            {/* Prix principal */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-800" htmlFor="price">
                  Prix original (DT)
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-800" htmlFor="salePrice">
                  Prix en remise (DT)
                </label>
                <input
                  id="salePrice"
                  name="salePrice"
                  type="number"
                  step="0.01"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                />
                <p className="text-[11px] text-zinc-500">
                  Laissez vide si vous ne faites pas de remise.
                </p>
              </div>
            </div>

            {/* Offres 2x / 3x */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-zinc-200 p-3">
                <p className="text-xs font-semibold text-zinc-700">Offre 2 × produit</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-700" htmlFor="offer2OriginalPrice">
                      Prix original 2× (DT)
                    </label>
                    <input
                      id="offer2OriginalPrice"
                      name="offer2OriginalPrice"
                      type="number"
                      step="0.01"
                      className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-xs outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-700" htmlFor="offer2SalePrice">
                      Prix en remise 2× (DT)
                    </label>
                    <input
                      id="offer2SalePrice"
                      name="offer2SalePrice"
                      type="number"
                      step="0.01"
                      className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-xs outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-zinc-200 p-3">
                <p className="text-xs font-semibold text-zinc-700">Offre 3 × produit</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-700" htmlFor="offer3OriginalPrice">
                      Prix original 3× (DT)
                    </label>
                    <input
                      id="offer3OriginalPrice"
                      name="offer3OriginalPrice"
                      type="number"
                      step="0.01"
                      className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-xs outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-700" htmlFor="offer3SalePrice">
                      Prix en remise 3× (DT)
                    </label>
                    <input
                      id="offer3SalePrice"
                      name="offer3SalePrice"
                      type="number"
                      step="0.01"
                      className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-xs outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <a
                href="/admin/products"
                className="inline-flex items-center rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Annuler
              </a>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
