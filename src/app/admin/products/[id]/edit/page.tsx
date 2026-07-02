import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LayoutDashboard, LineChart, Package } from "lucide-react";
import { AdminNavHomeLink } from "@/components/admin/AdminNavHomeLink";
import { notFound, redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Logo } from "@/components/Logo";
import { ProductImagesUploader } from "@/components/admin/ProductImagesUploader";
import { ProductFeaturesEditor } from "@/components/admin/ProductFeaturesEditor";
import { ProductVariantsEditor } from "@/components/admin/ProductVariantsEditor";
import { ProductEditForm } from "@/components/admin/ProductEditForm";
import { uploadFile } from "@/lib/upload";
import { parseColorSizesFromForm, colorSizesToDbFields, resolveProductColorSizes } from "@/lib/product-options";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

type FormState = {
  error?: string;
  success?: boolean;
};

function parseOptionalPrice(raw: FormDataEntryValue | null): number | null {
  if (raw == null || String(raw).trim() === "") return null;
  const value = parseFloat(String(raw));
  return Number.isNaN(value) ? null : value;
}

async function updateProduct(
  id: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  "use server";

  try {
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const price = parseFloat(String(formData.get("price") || "0"));
    const salePrice = parseOptionalPrice(formData.get("salePrice"));
    const offer2OriginalPrice = parseOptionalPrice(formData.get("offer2OriginalPrice"));
    const offer2SalePrice = parseOptionalPrice(formData.get("offer2SalePrice"));
    const offer3OriginalPrice = parseOptionalPrice(formData.get("offer3OriginalPrice"));
    const offer3SalePrice = parseOptionalPrice(formData.get("offer3SalePrice"));
    const files = formData.getAll("files") as File[];
    const primaryIndexRaw = formData.get("primaryIndex");
    let primaryIndex = primaryIndexRaw != null ? Number(primaryIndexRaw) : -1;
    if (Number.isNaN(primaryIndex)) primaryIndex = -1;

    const removeImageIdsRaw = formData.getAll("removeImageIds");
    const primaryExistingIdRaw = formData.get("primaryExistingId");
    const featureImageUrls = formData.getAll("featureImageUrls").map((v) => String(v));
    const featureTitles = formData.getAll("featureTitles").map((v) => String(v));
    const featureDescriptions = formData.getAll("featureDescriptions").map((v) => String(v));
    const parsedColorSizes = parseColorSizesFromForm(formData);
    const { colorSizes, colors, sizes } = colorSizesToDbFields(parsedColorSizes);

    if (!name || !price || Number.isNaN(price)) {
      return { error: "Le nom et le prix sont obligatoires." };
    }

    const uploadWarnings: string[] = [];
    const uploadedFiles: { url: string; isPrimary: boolean }[] = [];
    let newPrimaryUrl: string | null = null;

    const validFiles = Array.from(files).filter((file) => file && file.name && file.size > 0);

    for (const file of validFiles) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadFile("products", file.name, buffer, file.type);
        uploadedFiles.push({ url, isPrimary: false });
      } catch (err) {
        uploadWarnings.push(
          err instanceof Error ? err.message : "Impossible d'ajouter une image produit."
        );
      }
    }

    if (uploadedFiles.length > 0) {
      const useNewPrimary =
        primaryIndex >= 0 && primaryIndex < uploadedFiles.length && !primaryExistingIdRaw;

      if (useNewPrimary) {
        uploadedFiles.forEach((file, index) => {
          file.isPrimary = index === primaryIndex;
        });
        newPrimaryUrl = uploadedFiles[primaryIndex].url;

        await prisma.productImage.updateMany({
          where: { productId: id },
          data: { isPrimary: false },
        });
      } else {
        uploadedFiles.forEach((file) => {
          file.isPrimary = false;
        });
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

    const removeIds = removeImageIdsRaw
      .map((value) => Number(String(value)))
      .filter((num) => !Number.isNaN(num));

    if (removeIds.length > 0) {
      await prisma.productImage.deleteMany({
        where: { productId: id, id: { in: removeIds } },
      });
    }

    if (primaryExistingIdRaw) {
      const primaryExistingId = Number(String(primaryExistingIdRaw));
      if (!Number.isNaN(primaryExistingId)) {
        await prisma.productImage.updateMany({
          where: { productId: id },
          data: { isPrimary: false },
        });

        const updatedPrimary = await prisma.productImage.update({
          where: { id: primaryExistingId },
          data: { isPrimary: true },
        });
        newPrimaryUrl = updatedPrimary.url;
      }
    }

    if (!newPrimaryUrl) {
      const existingPrimary = await prisma.productImage.findFirst({
        where: { productId: id, isPrimary: true },
      });
      if (existingPrimary) newPrimaryUrl = existingPrimary.url;
    }

    const featureUploads: (string | null)[] = [];

    for (let i = 0; i < featureImageUrls.length; i++) {
      const raw = formData.get(`featureNewImage_${i}`);
      const file = raw instanceof File ? raw : null;

      if (!file || !file.name || file.size <= 0) {
        featureUploads[i] = null;
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        featureUploads[i] = await uploadFile("features", file.name, buffer, file.type);
      } catch (err) {
        uploadWarnings.push(
          err instanceof Error ? err.message : "Impossible d'ajouter une image caractéristique."
        );
        featureUploads[i] = null;
      }
    }

    await prisma.productFeature.deleteMany({ where: { productId: id } });

    const featuresData = featureImageUrls
      .map((imageUrl, index) => {
        const overrideUrl = featureUploads[index];
        const finalUrl = overrideUrl ?? imageUrl.trim();
        return {
          imageUrl: finalUrl,
          title: (featureTitles[index] || "").trim(),
          description: (featureDescriptions[index] || "").trim(),
          order: index,
        };
      })
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

    let finalImageUrl: string | null = newPrimaryUrl;

    if (!finalImageUrl) {
      const primaryImage = await prisma.productImage.findFirst({
        where: { productId: id, isPrimary: true },
      });

      if (primaryImage) {
        finalImageUrl = primaryImage.url;
      } else {
        const anyImage = await prisma.productImage.findFirst({
          where: { productId: id },
          orderBy: { id: "asc" },
        });

        if (anyImage) {
          finalImageUrl = anyImage.url;
          await prisma.productImage.update({
            where: { id: anyImage.id },
            data: { isPrimary: true },
          });
        }
      }
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    if (!finalImageUrl) {
      finalImageUrl = existing?.imageUrl ?? "";
    }

    await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        salePrice,
        imageUrl: finalImageUrl,
        offer2OriginalPrice,
        offer2SalePrice,
        offer3OriginalPrice,
        offer3SalePrice,
        colors,
        sizes,
        colorSizes,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}/edit`);
    revalidatePath(`/product/${id}`);

    if (uploadWarnings.length > 0) {
      redirect(
        `/admin/products?saved=1&warn=${encodeURIComponent(uploadWarnings[0])}`
      );
    }

    redirect("/admin/products?saved=1");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("Error updating product", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'enregistrement.",
    };
  }
}

export default async function EditProductPage({ params }: EditPageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (Number.isNaN(numericId)) notFound();

  const product = await prisma.product.findUnique({
    where: { id: numericId },
    include: {
      images: { orderBy: { createdAt: "asc" } },
      features: { orderBy: { order: "asc" } },
    },
  });

  if (!product) notFound();

  return (
    <div className="min-h-screen bg-[#faf7f6] text-zinc-900">
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
          <h1 className="text-2xl font-semibold tracking-tight mb-6">Modifier le produit</h1>

          <ProductEditForm action={updateProduct.bind(null, product.id)}>
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

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-800">
                  Images du produit
                </label>
                <ProductImagesUploader existingImages={product.images} />
                <p className="text-[11px] text-zinc-500">
                  Modifiez les images si besoin. Sinon, enregistrez directement vos changements de prix ou couleurs.
                </p>
              </div>
            </div>

            <ProductVariantsEditor
              initialColorSizes={resolveProductColorSizes(product)}
              initialColors={product.colors ?? []}
              initialSizes={product.sizes ?? []}
            />

            <div className="space-y-2 rounded-xl border border-zinc-200 p-3">
              <p className="text-xs font-semibold text-zinc-700">Caractéristiques du produit</p>
              <ProductFeaturesEditor
                images={product.images.map((img) => ({ id: img.id, url: img.url }))}
                features={product.features}
              />
            </div>

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

            <input type="hidden" name="description" value={product.description} />
          </ProductEditForm>
        </div>
      </main>
    </div>
  );
}
