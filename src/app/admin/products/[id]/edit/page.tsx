import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LayoutDashboard, LineChart, Package, Home } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Logo } from "@/components/Logo";
import { ProductImagesUploader } from "@/components/admin/ProductImagesUploader";
import { ExistingProductImagesEditor } from "@/components/admin/ExistingProductImagesEditor";
import { ProductFeaturesEditor } from "@/components/admin/ProductFeaturesEditor";
import { ProductVariantsEditor } from "@/components/admin/ProductVariantsEditor";
import { uploadFile } from "@/lib/upload";
import { parseVariantList } from "@/lib/product-options";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

async function updateProduct(id: number, formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
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
  const primaryIndexRaw = formData.get("primaryIndex");
  let primaryIndex = primaryIndexRaw != null ? Number(primaryIndexRaw) : -1;
  if (Number.isNaN(primaryIndex)) {
    primaryIndex = -1;
  }
  const removeImageIdsRaw = formData.getAll("removeImageIds");
  const primaryExistingIdRaw = formData.get("primaryExistingId");
  const featureImageUrls = formData.getAll("featureImageUrls").map((v) => String(v));
  const featureTitles = formData.getAll("featureTitles").map((v) => String(v));
  const featureDescriptions = formData.getAll("featureDescriptions").map((v) => String(v));
  const colors = parseVariantList(formData.getAll("colors"));
  const sizes = parseVariantList(formData.getAll("sizes"));

  if (!name || !price || Number.isNaN(price)) {
    redirect("/admin/products");
  }

  const uploadedFiles: { url: string; isPrimary: boolean }[] = [];
  let newPrimaryUrl: string | null = null;

  // Handle new file uploads - only process actual files with names and size > 0
  if (files && files.length > 0) {
    const validFiles = Array.from(files).filter((file) => file && file.name && file.size > 0);

    for (const file of validFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await uploadFile(`products`, file.name, buffer, file.type);

      uploadedFiles.push({
        url,
        isPrimary: false,
      });
    }

    if (uploadedFiles.length > 0) {
      let safePrimaryIndex = primaryIndex;
      if (safePrimaryIndex < 0 || safePrimaryIndex >= uploadedFiles.length) {
        safePrimaryIndex = 0;
      }

      uploadedFiles.forEach((file, index) => {
        file.isPrimary = index === safePrimaryIndex;
      });

      newPrimaryUrl = uploadedFiles[safePrimaryIndex].url;
    }

    await Promise.all(
      uploadedFiles.map((file) =>
        prisma.productImage.create({
          data: {
            productId: id,
            url: file.url,
            isPrimary: file.isPrimary,
          },
        })
      )
    );
  }

  // Handle image removal
  const removeIds = removeImageIdsRaw
    .map(value => {
      const num = Number(String(value));
      return Number.isNaN(num) ? null : num;
    })
    .filter((num): num is number => num !== null);

  if (removeIds.length > 0) {
    await prisma.productImage.deleteMany({
      where: {
        productId: id,
        id: { in: removeIds },
      },
    });
  }

  // Handle primary image selection
  if (primaryExistingIdRaw) {
    const primaryExistingId = Number(String(primaryExistingIdRaw));
    if (!Number.isNaN(primaryExistingId)) {
      // First, set all images to not primary
      await prisma.productImage.updateMany({
        where: { productId: id },
        data: { isPrimary: false },
      });

      // Then set the selected one as primary
      const updatedPrimary = await prisma.productImage.update({
        where: { id: primaryExistingId },
        data: { isPrimary: true },
      });
      newPrimaryUrl = updatedPrimary.url;
    }
  }

  // If we still don't have a primary URL, try to get an existing one
  if (!newPrimaryUrl) {
    const existingPrimary = await prisma.productImage.findFirst({
      where: { 
        productId: id,
        isPrimary: true 
      }
    });
    
    if (existingPrimary) {
      newPrimaryUrl = existingPrimary.url;
    }
  }

  // Upload any new feature images from desktop and map them by row index
  const featureUploads: (string | null)[] = [];

  for (let i = 0; i < featureImageUrls.length; i++) {
    const raw = formData.get(`featureNewImage_${i}`);
    const file = raw instanceof File ? (raw as File) : null;

    // If no new file was chosen for this row, keep null so we reuse existing URL
    if (!file || !file.name || file.size <= 0) {
      featureUploads[i] = null;
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    featureUploads[i] = await uploadFile(`features`, file.name, buffer, file.type);
  }

  // Update product features (characteristics)
  await prisma.productFeature.deleteMany({ where: { productId: id } });

  const featuresData = featureImageUrls
    .map((imageUrl, index) => {
      const overrideUrl = featureUploads[index];
      const finalUrl = (overrideUrl ?? imageUrl.trim());

      return {
        imageUrl: finalUrl,
        title: (featureTitles[index] || "").trim(),
        description: (featureDescriptions[index] || "").trim(),
        order: index,
      };
    })
    // Save a feature as long as it has an image and a title; description is optional
    .filter((f) => f.imageUrl && f.title);

  if (featuresData.length > 0) {
    await prisma.productFeature.createMany({
      data: featuresData.map((f) => ({
        productId: id,
        imageUrl: f.imageUrl,
        title: f.title,
        description: f.description,
        order: f.order,
      })),
    });
  }

  // Ensure we have a valid primary URL
  let finalImageUrl: string | null = newPrimaryUrl;
  
  if (!finalImageUrl) {
    // If no new primary URL was set, try to get the existing primary image
    const primaryImage = await prisma.productImage.findFirst({
      where: { 
        productId: id,
        isPrimary: true 
      }
    });
    
    if (primaryImage) {
      finalImageUrl = primaryImage.url;
    } else {
      // If no primary image is set, get the first available image
      const anyImage = await prisma.productImage.findFirst({
        where: { productId: id },
        orderBy: { id: 'asc' },
        take: 1
      });
      if (anyImage) {
        finalImageUrl = anyImage.url;
        // Set this image as primary
        await prisma.productImage.update({
          where: { id: anyImage.id },
          data: { isPrimary: true }
        });
      }
    }
  }
  
  // If we still don't have an image URL, use an empty string as fallback
  if (!finalImageUrl) {
    console.warn('No valid image URL found for product', id);
    finalImageUrl = '';
  }

  await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      price,
      salePrice: salePrice && !Number.isNaN(salePrice) ? salePrice : null,
      ...(finalImageUrl ? { imageUrl: finalImageUrl } : {}),
      offer2OriginalPrice:
        offer2OriginalPrice && !Number.isNaN(offer2OriginalPrice)
          ? offer2OriginalPrice
          : null,
      offer2SalePrice:
        offer2SalePrice && !Number.isNaN(offer2SalePrice)
          ? offer2SalePrice
          : null,
      offer3OriginalPrice:
        offer3OriginalPrice && !Number.isNaN(offer3OriginalPrice)
          ? offer3OriginalPrice
          : null,
      offer3SalePrice:
        offer3SalePrice && !Number.isNaN(offer3SalePrice)
          ? offer3SalePrice
          : null,
      colors,
      sizes,
    },
  });

  redirect("/admin/products");
}

export default async function EditProductPage({ params }: EditPageProps) {
  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: { id: numericId },
    include: {
      images: {
        orderBy: { createdAt: "asc" },
      },
      features: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!product) {
    notFound();
  }

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

      <main className="flex-1 flex justify-center items-start px-4 pt-6 pb-12">
        <div className="w-full max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight mb-6">Modifier le produit</h1>
          <form
            action={updateProduct.bind(null, product.id)}
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
                defaultValue={product.name}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                required
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-800">
                  Images du produit
                </label>
                <ProductImagesUploader>
                  {product.images && product.images.length > 0 && (
                    <ExistingProductImagesEditor images={product.images} />
                  )}
                </ProductImagesUploader>
                <p className="text-[11px] text-zinc-500">
                  Ajoutez une ou plusieurs images. Cliquez sur une image pour la définir comme principale.
                </p>
              </div>
            </div>

            {/* Couleurs & tailles */}
            <ProductVariantsEditor
              initialColors={product.colors ?? []}
              initialSizes={product.sizes ?? []}
            />

            {/* Caractéristiques du produit */}
            <div className="space-y-2 rounded-xl border border-zinc-200 p-3">
              <p className="text-xs font-semibold text-zinc-700">Caractéristiques du produit</p>
              <ProductFeaturesEditor
                images={product.images.map((img) => ({ id: img.id, url: img.url }))}
                features={(product as any).features ?? []}
              />
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
                  defaultValue={product.price}
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
                  defaultValue={product.salePrice ?? ""}
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
                      defaultValue={product.offer2OriginalPrice ?? ""}
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
                      defaultValue={product.offer2SalePrice ?? ""}
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
                      defaultValue={product.offer3OriginalPrice ?? ""}
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
                      defaultValue={product.offer3SalePrice ?? ""}
                      className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-xs outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 text-sm">
              <a
                href="/admin/products"
                className="inline-flex items-center rounded-full border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-50"
              >
                Annuler
              </a>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800"
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
