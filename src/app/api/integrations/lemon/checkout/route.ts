import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getVariantIdByKey } from "@/lib/lemon-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEMON_API_URL = "https://api.lemonsqueezy.com/v1/checkouts";

type CheckoutPayload = {
  variantId?: string;
  priceId?: string; // alias for variantId
  planKey?: string; // e.g., "growth_monthly", "pro_yearly"
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

  // Priority: explicit variantId > planKey lookup > fallback
  let variantId = body.variantId || body.priceId;
  if (!variantId && body.planKey) {
    variantId = getVariantIdByKey(body.planKey) || undefined;
  }
  if (!variantId) {
    variantId = fallbackVariant;
  }

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

  // Ensure Store ID and Variant ID are strings (LemonSqueezy requires strings)
  const storeIdStr = String(storeId);
  const variantIdStr = String(variantId);

  // Build attributes according to LemonSqueezy API spec
  // Using ABSOLUTE minimum required fields
  const attributes: Record<string, any> = {};

  // Only add custom data if needed
  if (userId) {
    attributes.checkout_data = {
      custom: [
        {
          key: "user_id",
          value: String(userId), // Ensure it's a string
        },
      ],
    };
  }

  // Add email if provided
  if (body.email) {
    if (!attributes.checkout_data) attributes.checkout_data = {};
    attributes.checkout_data.email = body.email;
  }

  const payload = {
    data: {
      type: "checkouts",
      attributes,
      relationships: {
        store: {
          data: {
            type: "stores",
            id: storeIdStr
          },
        },
        variant: {
          data: {
            type: "variants",
            id: variantIdStr
          },
        },
      },
    },
  };

  try {
    console.log("[Checkout] ========================================");
    console.log("[Checkout] Creating LemonSqueezy checkout session");
    console.log("[Checkout] ========================================");
    console.log("[Checkout] Input data:", {
      variantId: variantIdStr,
      storeId: storeIdStr,
      userId,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
    });
    console.log("[Checkout] Full payload being sent:");
    console.log(JSON.stringify(payload, null, 2));
    console.log("[Checkout] ========================================");

    const response = await fetch(LEMON_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text().catch(() => "Failed to read response");
    let responseJson: any = null;
    try {
      responseJson = responseText ? JSON.parse(responseText) : null;
    } catch {
      // Not JSON
    }

    console.log("[Checkout] Response received:");
    console.log("[Checkout] Status:", response.status, response.statusText);
    console.log("[Checkout] Response body:", responseJson || responseText);

    if (!response.ok) {
      // Log full error details
      const allErrors = responseJson?.errors || [];
      const errorMessages = allErrors.map((e: any) => ({
        detail: e.detail,
        title: e.title,
        source: e.source,
        status: e.status,
      }));

      console.error("[Checkout] LemonSqueezy API error:", {
        status: response.status,
        statusText: response.statusText,
        errors: errorMessages,
        fullResponse: responseJson,
        variantId: variantIdStr,
        storeId: storeIdStr,
      });

      // Special handling for 404 errors (missing store or variant)
      if (response.status === 404) {
        const has404 = errorMessages.some((e: any) =>
          e.detail?.includes("related resource does not exist")
        );

        if (has404) {
          return NextResponse.json(
            {
              error: "Store or Variant not found in LemonSqueezy",
              details: `Please verify in your LemonSqueezy dashboard:\n1. Store ID ${storeIdStr} exists at https://app.lemonsqueezy.com/settings/stores\n2. Variant ID ${variantIdStr} exists and belongs to this store\n3. Update LEMON_STORE_ID and LEMON_VARIANT_ID in your environment variables`,
              lemonErrors: errorMessages,
              storeId: storeIdStr,
              variantId: variantIdStr,
            },
            { status: 404 }
          );
        }
      }

      // Return detailed error
      const errorDetail = errorMessages[0]?.detail ||
        errorMessages[0]?.title ||
        responseJson?.error ||
        responseText ||
        response.statusText;

      return NextResponse.json(
        {
          error: "Failed to create checkout session",
          details: errorDetail,
          status: response.status,
          lemonErrors: errorMessages,
        },
        { status: 502 }
      );
    }

    const json = responseJson || JSON.parse(responseText);
    const checkoutUrl = json?.data?.attributes?.url;

    if (!checkoutUrl) {
      console.error("[Checkout] No checkout URL in response:", json);
      return NextResponse.json(
        { error: "Invalid response from LemonSqueezy", details: json },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url: checkoutUrl,
      data: json?.data,
    });
  } catch (error: any) {
    console.error("[Checkout] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
