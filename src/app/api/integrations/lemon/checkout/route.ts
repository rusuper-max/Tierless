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

  // Better error messages for debugging
  if (!apiKey) {
    console.error("[Checkout] LEMON_API_KEY is not set");
    return NextResponse.json(
      { error: "Lemon Squeezy API key is not configured" },
      { status: 500 }
    );
  }

  if (!storeId) {
    console.error("[Checkout] LEMON_STORE_ID is not set");
    return NextResponse.json(
      { error: "Lemon Squeezy Store ID is not configured" },
      { status: 500 }
    );
  }

  if (!variantId) {
    console.error("[Checkout] Variant ID is missing", { body, fallbackVariant });
    return NextResponse.json(
      { error: "Variant ID is required" },
      { status: 400 }
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
    let errorJson: any = null;
    try {
      errorJson = errorText ? JSON.parse(errorText) : null;
    } catch {
      // Not JSON, use as text
    }
    
    console.error("[Checkout] LemonSqueezy API error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorJson || errorText,
      variantId,
      storeId: storeId ? `${storeId.substring(0, 3)}...` : "missing",
    });
    
    // Return more detailed error for debugging
    return NextResponse.json(
      { 
        error: "Failed to create checkout session",
        details: errorJson?.errors?.[0]?.detail || errorJson?.error || errorText || response.statusText,
        status: response.status,
      },
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
