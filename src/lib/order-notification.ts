import { formatVariantSelections } from "@/lib/product-offers";

const DEFAULT_ORDER_EMAIL = "farroukdrd@gmail.com";

export function getOrderNotificationEmail(): string {
  return process.env.ORDER_NOTIFICATION_EMAIL?.trim() || DEFAULT_ORDER_EMAIL;
}

type OrderNotificationInput = {
  productName: string;
  productId: number;
  pack: number;
  total: number;
  name: string;
  phone: string;
  address: string;
  governor: string;
  city: string;
  variantColors: string[];
  variantSizes: string[];
};

export async function sendOrderNotificationEmail(
  input: OrderNotificationInput
): Promise<boolean> {
  const serviceId = process.env.EMAILJS_SERVICE_ID ?? "service_8mo5zdf";
  const templateId = process.env.EMAILJS_TEMPLATE_ID ?? "template_nrf56fs";
  const publicKey = process.env.EMAILJS_PUBLIC_KEY ?? "yZvRvrVIR1bQvMzrS";
  const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim();

  const variantSummary = formatVariantSelections(input.variantColors, input.variantSizes);
  const toEmail = getOrderNotificationEmail();

  const payload: Record<string, unknown> = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: toEmail,
      product_name: input.productName,
      product_id: input.productId,
      pack: input.pack,
      total: input.total.toFixed(2),
      name: input.name,
      phone: input.phone,
      address: input.address,
      governor: input.governor,
      city: input.city,
      color: variantSummary,
      size: variantSummary,
    },
  };

  if (privateKey) {
    payload.accessToken = privateKey;
  }

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("EmailJS order notification failed:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("EmailJS order notification error:", error);
    return false;
  }
}
