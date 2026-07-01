import { redirect } from "next/navigation";
import { getFirstProductId } from "@/lib/products";

export default async function Home() {
  const firstProductId = await getFirstProductId();
  if (firstProductId) {
    redirect(`/product/${firstProductId}`);
  }

  redirect("/admin/products");
}
