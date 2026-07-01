import { redirect } from "next/navigation";
import { getFirstProductId } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const firstProductId = await getFirstProductId();
  if (firstProductId) {
    redirect(`/product/${firstProductId}`);
  }

  redirect("/admin/products");
}
