#!/usr/bin/env node

/**
 * Find LemonSqueezy Store ID
 * 
 * Usage: 
 *   LEMON_API_KEY=sk_live_xxx node scripts/find-store-id.js
 * 
 * Or set in .env.local and run: node scripts/find-store-id.js
 */

require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.LEMON_API_KEY;

if (!API_KEY) {
  console.error("❌ LEMON_API_KEY is not set");
  console.log("\nUsage:");
  console.log("  LEMON_API_KEY=sk_live_xxx node scripts/find-store-id.js");
  console.log("  Or add LEMON_API_KEY to .env.local");
  process.exit(1);
}

async function findStoreId() {
  try {
    console.log("🔍 Searching for Store ID...\n");
    
    // Method 1: List all stores
    const response = await fetch('https://api.lemonsqueezy.com/v1/stores', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ API call failed:");
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${error}`);
      
      if (response.status === 401) {
        console.error("\n💡 Tip: Check if your API key is correct");
      }
      
      process.exit(1);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.error("❌ No stores found");
      process.exit(1);
    }

    console.log("✅ Found stores:\n");
    
    data.data.forEach((store, index) => {
      console.log(`Store ${index + 1}:`);
      console.log(`   ID: ${store.id}`);
      console.log(`   Name: ${store.attributes.name}`);
      console.log(`   Domain: ${store.attributes.domain || 'N/A'}`);
      console.log(`   URL: ${store.attributes.url || 'N/A'}`);
      console.log("");
    });

    const firstStore = data.data[0];
    console.log("📝 Add this to Vercel environment variables:");
    console.log(`   LEMON_STORE_ID=${firstStore.id}\n`);
    
    // Method 2: Try to get from variant (if we have variant ID)
    const VARIANT_ID = "712914"; // Starter Monthly
    console.log(`🔍 Also checking variant ${VARIANT_ID} for store relationship...\n`);
    
    try {
      const variantResponse = await fetch(`https://api.lemonsqueezy.com/v1/variants/${VARIANT_ID}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/vnd.api+json',
        },
      });

      if (variantResponse.ok) {
        const variantData = await variantResponse.json();
        const storeIdFromVariant = variantData?.data?.relationships?.store?.data?.id;
        
        if (storeIdFromVariant) {
          console.log(`✅ Confirmed Store ID from variant: ${storeIdFromVariant}`);
          if (storeIdFromVariant === firstStore.id) {
            console.log("   ✅ Matches the store from list above\n");
          } else {
            console.log(`   ⚠️  Different from list above (${firstStore.id})\n`);
          }
        }
      }
    } catch (e) {
      // Ignore variant check errors
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

findStoreId();


