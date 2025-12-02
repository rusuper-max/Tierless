#!/usr/bin/env node

/**
 * Test LemonSqueezy Checkout Integration
 * 
 * Usage: node scripts/test-lemon-checkout.js
 * 
 * This script tests if LemonSqueezy checkout API is configured correctly.
 */

const API_KEY = process.env.LEMON_API_KEY;
const STORE_ID = process.env.LEMON_STORE_ID;
const VARIANT_ID = process.env.LEMON_VARIANT_ID || "712914"; // Starter Monthly

console.log("🧪 Testing LemonSqueezy Checkout Integration\n");

// Check environment variables
if (!API_KEY) {
  console.error("❌ LEMON_API_KEY is not set");
  console.log("   Set it in .env.local or Vercel environment variables");
  process.exit(1);
}

if (!STORE_ID) {
  console.error("❌ LEMON_STORE_ID is not set");
  console.log("   Set it in .env.local or Vercel environment variables");
  process.exit(1);
}

console.log("✅ Environment variables found:");
console.log(`   API Key: ${API_KEY.substring(0, 10)}...`);
console.log(`   Store ID: ${STORE_ID}`);
console.log(`   Test Variant ID: ${VARIANT_ID}\n`);

// Test API call
async function testCheckout() {
  const url = "https://api.lemonsqueezy.com/v1/checkouts";
  
  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          custom: {
            user_id: "test@example.com",
          },
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: STORE_ID },
        },
        variant: {
          data: { type: "variants", id: VARIANT_ID },
        },
      },
    },
  };

  try {
    console.log("📡 Calling LemonSqueezy API...");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    if (!response.ok) {
      console.error("❌ API call failed:");
      console.error(`   Status: ${response.status}`);
      console.error(`   Response:`, json);
      
      if (response.status === 401) {
        console.error("\n💡 Tip: Check if your API key is correct and has 'Read & Write' permissions");
      } else if (response.status === 404) {
        console.error("\n💡 Tip: Check if Store ID and Variant ID are correct");
      }
      
      process.exit(1);
    }

    console.log("✅ API call successful!");
    console.log(`   Checkout URL: ${json?.data?.attributes?.url || "N/A"}`);
    console.log(`   Checkout ID: ${json?.data?.id || "N/A"}\n`);
    
    console.log("🎉 LemonSqueezy integration is working correctly!");
    console.log("\n📝 Next steps:");
    console.log("   1. Test checkout flow in your app");
    console.log("   2. Set up webhook for automatic plan updates");
    console.log("   3. Test a real purchase (use test mode first)");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testCheckout();


