import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LayoutDashboard, LineChart, Package } from "lucide-react";
import { AdminNavHomeLink } from "@/components/admin/AdminNavHomeLink";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Logo } from "@/components/Logo";
import { ProductImagesUploader } from "@/components/admin/ProductImagesUploader";
import { ProductFeaturesNewEditor } from "@/components/admin/ProductFeaturesNewEditor";
import { ProductVariantsEditor } from "@/components/admin/ProductVariantsEditor";
import { ProductEditForm } from "@/components/admin/ProductEditForm";
import { ProductDeliveryEditor } from "@/components/admin/ProductDeliveryEditor";
import { uploadFile } from "@/lib/upload";
import { parseColorSizesFromForm, colorSizesToDbFields } from "@/lib/product-options";

type FormState = {
  error?: string;
  success?: boolean;
};

function parseOptionalPrice(raw: FormDataEntryValue | null): number | null {
  if (raw == null || String(raw).trim() === "") return null;
  const value = parseFloat(String(raw));
  return Number.isNaN(value) ? null : value;
}

async function createProduct(_prevState: FormState, formData: FormData): Promise<FormState> {
  "use server";

  try {
    const name = String(formData.get("name") || "").trim();
    const price = parseFloat(String(formData.get("price") || "0"));
    const salePrice = parseOptionalPrice(formData.get("salePrice"));
    const offer2OriginalPrice = parseOptionalPrice(formData.get("offer2OriginalPrice"));
    const offer2SalePrice = parseOptionalPrice(formData.get("offer2SalePrice"));
    const offer3OriginalPrice = parseOptionalPrice(formData.get("offer3OriginalPrice"));
    const offer3SalePrice = parseOptionalPrice(formData.get("offer3SalePrice"));
    const deliveryTypeRaw = String(formData.get("deliveryType") || "FREE").toUpperCase();
    const deliveryType = deliveryTypeRaw === "PAID" ? "PAID" : "FREE";
    const deliveryFee =
      deliveryType === "PAID" ? parseOptionalPrice(formData.get("deliveryFee")) : null;
    const files = formData.getAll("files") as File[];
    const primaryIndex = parseInt(String(formData.get("primaryIndex") || "0"), 10);
    const featureTitles = formData.getAll("featureTitles").map((v) => String(v));
    const featureDescriptions = formData.getAll("featureDescriptions").map((v) => String(v));
    const parsedColorSizes = parseColorSizesFromForm(formData);
    const { colorSizes, colors, sizes } = colorSizesToDbFields(parsedColorSizes);

    if (!name || !price || Number.isNaN(price)) {
      return { error: "Le nom et le prix sont obligatoires." };
    }

    if (deliveryType === "PAID" && (deliveryFee == null || deliveryFee < 0)) {
      return { error: "Indiquez un montant de livraison valide (DT)." };
    }

    const validFiles = Array.from(files).filter((file) => file && file.name && file.size > 0);
    if (validFiles.length === 0) {
      return { error: "Ajoutez au moins une image produit." };
    }

    const uploadedFiles: { url: string; isPrimary: boolean }[] = [];

    for (const file of validFiles) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadFile("products", file.name, buffer, file.type);
        uploadedFiles.push({ url, isPrimary: false });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Impossible d'envoyer l'image produit.";
        return { error: message };
      }
    }

    const safePrimaryIndex =
      primaryIndex >= 0 && primaryIndex < uploadedFiles.length ? primaryIndex : 0;
    uploadedFiles.forEach((file, index) => {
      file.isPrimary = index === safePrimaryIndex;
    });

    const primaryImage = uploadedFiles[safePrimaryIndex];
    const product = await prisma.product.create({
      data: {
        name,
        description: "",
        price,
        salePrice,
        imageUrl: primaryImage.url,
        offer2OriginalPrice,
        offer2SalePrice,
        offer3OriginalPrice,
        offer3SalePrice,
        deliveryType,
        deliveryFee,
        colors,
        sizes,
        colorSizes,
      },
    });

    await Promise.all(
      uploadedFiles.map((file) =>
        prisma.productImage.create({
          data: {
            productId: product.id,
            url: file.url,
            isPrimary: file.isPrimary,
          },
        })
      )
    );

    const featureUploads: (string | null)[] = [];

    for (let i = 0; i < featureTitles.length; i++) {
      const raw = formData.get(`featureNewImage_${i}`);
      const file = raw instanceof File ? raw : null;

      if (!file || !file.name || file.size <= 0) {
        featureUploads[i] = null;
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        featureUploads[i] = await uploadFile("features", file.name, buffer, file.type);
      } catch {
        featureUploads[i] = null;
      }
    }

    const featuresData = featureDescriptions
      .map((description, index) => ({
        title: (featureTitles[index] || "").trim(),
        description: description.trim(),
        imageUrl: featureUploads[index] ?? null,
        order: index,
      }))
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

    revalidatePath("/admin/products");
    revalidatePath(`/product/${product.id}`);

    redirect("/admin/products");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("Error creating product", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'enregistrement.",
    };
  }
}

export default function NewProductPage() {
  return (
    <div className="min-h-screen bg-[#faf7f6] text-zinc-900 flex flex-col">
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
          <ProductEditForm action={createProduct}>
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

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-800">
                Images du produit
              </label>
              <ProductImagesUploader />
              <p className="text-[11px] text-zinc-500">
                Ajoutez une ou plusieurs images. Cliquez sur une image pour la définir comme principale.
              </p>
            </div>

            <ProductVariantsEditor />

            <div className="space-y-2 rounded-xl border border-zinc-200 p-3">
              <p className="text-xs font-semibold text-zinc-700">Caractéristiques du produit</p>
              <ProductFeaturesNewEditor />
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

            <ProductDeliveryEditor />
          </ProductEditForm>
        </div>
      </main>
    </div>
  );
}
