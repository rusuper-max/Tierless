import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEMON_API_URL = "https://api.lemonsqueezy.com/v1/checkouts";

type CheckoutPayload = {
  variantId?: string;
  priceId?: string; // alias for variantId
  successUrl?: string;
  cancelUrl?: string;
  email?: string;
};

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: CheckoutPayload = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const apiKey = process.env.LEMON_API_KEY;
  const storeId = process.env.LEMON_STORE_ID;
  const fallbackVariant = process.env.LEMON_VARIANT_ID;
  const variantId = body.variantId || body.priceId || fallbackVariant;

  if (!apiKey || !storeId || !variantId) {
    return NextResponse.json(
      { error: "Lemon Squeezy is not configured" },
      { status: 500 }
    );
  }

  const attributes: Record<string, any> = {
    checkout_data: {
      custom: {
        user_id: userId,
      },
    },
  };

  if (body.successUrl) attributes.success_url = body.successUrl;
  if (body.cancelUrl) attributes.cancel_url = body.cancelUrl;
  if (body.email) attributes.checkout_data.email = body.email;

  const payload = {
    data: {
      type: "checkouts",
      attributes,
      relationships: {
        store: {
          data: { type: "stores", id: storeId },
        },
        variant: {
          data: { type: "variants", id: variantId },
        },
      },
    },
  };

  const response = await fetch(LEMON_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => null);
    console.error("Lemon Squeezy checkout error:", errorText || response.statusText);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 502 }
    );
  }

  const json = await response.json();
  const checkoutUrl = json?.data?.attributes?.url;

  return NextResponse.json({
    url: checkoutUrl,
    data: json?.data,
  });
}
