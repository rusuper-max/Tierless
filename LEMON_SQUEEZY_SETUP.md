# 🍋 LemonSqueezy Setup Guide

## Korak 1: Kreiraj LemonSqueezy Nalog

1. Idi na https://lemonsqueezy.com
2. Klikni **"Sign Up"** i kreiraj nalog
3. Verifikuj email

---

## Korak 2: Kreiraj Store

1. U dashboardu klikni **"Stores"** → **"New Store"**
2. Unesi:
   - **Store Name:** Tierless
   - **Store URL:** tierless.net (ili tvoj domen)
   - **Currency:** USD (ili EUR ako ciljaš Evropu)
3. Klikni **"Create Store"**
4. **SAČUVAJ Store ID** - trebaće ti za `LEMON_STORE_ID` env varijablu

---

## Korak 3: Kreiraj Produkt "Tierless Plans"

1. Idi na **"Products"** → **"New Product"**
2. Unesi:
   - **Name:** Tierless Plans
   - **Description:** Subscription plans for Tierless pricing pages
   - **Type:** Subscription (recurring)
3. Klikni **"Create Product"**

---

## Korak 4: Kreiraj Variante (Planske)

Za svaki plan trebaš da kreiraš **2 varijante** (mesečna i godišnja):

### 4.1 Starter Plan - Monthly

1. U produktu klikni **"Variants"** → **"Add Variant"**
2. Popuni:
   - **Name:** Starter (Monthly)
   - **Price:** $9.00
   - **Billing Period:** Monthly
   - **Trial Days:** 0 (ili 14 ako želiš trial)
3. Klikni **"Save"**
4. **KOPIRAJ Variant ID** (npr. `123456`) - ovo je kritično!

### 4.2 Starter Plan - Yearly

1. **"Add Variant"** ponovo
2. Popuni:
   - **Name:** Starter (Yearly)
   - **Price:** $79.00
   - **Billing Period:** Yearly
   - **Trial Days:** 0
3. **KOPIRAJ Variant ID** (npr. `123457`)

### 4.3 Growth Plan - Monthly

- **Name:** Growth (Monthly)
- **Price:** $19.00
- **Billing Period:** Monthly
- **KOPIRAJ Variant ID**

### 4.4 Growth Plan - Yearly

- **Name:** Growth (Yearly)
- **Price:** $159.00
- **Billing Period:** Yearly
- **KOPIRAJ Variant ID**

### 4.5 Pro Plan - Monthly

- **Name:** Pro (Monthly)
- **Price:** $39.00
- **Billing Period:** Monthly
- **KOPIRAJ Variant ID**

### 4.6 Pro Plan - Yearly

- **Name:** Pro (Yearly)
- **Price:** $349.00
- **Billing Period:** Yearly
- **KOPIRAJ Variant ID**

---

## Korak 5: API Key Setup

1. Idi na **"Settings"** → **"API"**
2. Klikni **"Create API Key"**
3. Unesi:
   - **Name:** Tierless Production (ili Development)
   - **Permissions:** Read & Write
4. Klikni **"Create"**
5. **KOPIRAJ API Key** - ovo je jednokratno, nećeš moći da vidiš ponovo!

---

## Korak 6: Webhook Setup

1. Idi na **"Settings"** → **"Webhooks"**
2. Klikni **"Create Webhook"**
3. Popuni:
   - **Name:** Tierless Webhook
   - **URL:** `https://tierless.net/api/webhooks/lemon` (ili tvoj production URL)
   - **Events:** Izaberi sve subscription events:
     - ✅ subscription_created
     - ✅ subscription_updated
     - ✅ subscription_cancelled
     - ✅ subscription_resumed
     - ✅ subscription_expired
     - ✅ subscription_payment_success
     - ✅ subscription_payment_failed
4. Klikni **"Create"**
5. **KOPIRAJ Webhook Secret** - trebaće ti za `LEMON_WEBHOOK_SECRET`

---

## Korak 7: Environment Variables

Dodaj u Vercel (ili `.env.local` za lokalno testiranje):

```bash
LEMON_API_KEY=sk_live_xxxxx  # API Key iz Koraka 5
LEMON_STORE_ID=12345         # Store ID iz Koraka 2
LEMON_WEBHOOK_SECRET=xxxxx   # Webhook Secret iz Koraka 6
```

---

## Korak 8: Variant Mapping u Kodu

Nakon što imaš sve Variant IDs, otvori:
`src/app/api/webhooks/lemon/route.ts`

I zameni prazan `VARIANT_TO_PLAN` objekat sa:

```typescript
const VARIANT_TO_PLAN: Record<string, PlanId> = {
  "123456": "starter",  // Starter Monthly
  "123457": "starter",  // Starter Yearly
  "234567": "growth",  // Growth Monthly
  "234568": "growth",  // Growth Yearly
  "345678": "pro",     // Pro Monthly
  "345679": "pro",     // Pro Yearly
};
```

**VAŽNO:** Koristi **ISTI plan ID** za mesečnu i godišnju varijantu istog plana!

---

## Korak 9: Testiranje

### Test Mode (Development)

1. U LemonSqueezy dashboardu prebaci na **"Test Mode"**
2. Koristi test API key (počinje sa `sk_test_`)
3. Test webhook URL: `https://your-vercel-preview-url.vercel.app/api/webhooks/lemon`

### Production

1. Prebaci na **"Live Mode"**
2. Koristi production API key (počinje sa `sk_live_`)
3. Production webhook URL: `https://tierless.net/api/webhooks/lemon`

---

## Troubleshooting

### Webhook ne radi?

1. Proveri da li je webhook URL javno dostupan (ne može localhost)
2. Proveri `LEMON_WEBHOOK_SECRET` - mora biti identičan
3. Proveri server logs za webhook errors

### Variant ID ne mapira?

1. Proveri da li si kopirao tačan Variant ID
2. Proveri da li su variant IDs stringovi (ne brojevi)
3. Proveri console logs u webhook handleru

### Checkout ne radi?

1. Proveri `LEMON_API_KEY` i `LEMON_STORE_ID`
2. Proveri da li su varijante aktivne u LemonSqueezy
3. Proveri browser console za errors

---

## Checklist Pre Launcha

- [ ] Store kreiran i Store ID sačuvan
- [ ] Produkt "Tierless Plans" kreiran
- [ ] 6 varijanti kreirano (3 plana × 2 intervala)
- [ ] Svi Variant IDs sačuvani
- [ ] API Key kreiran i sačuvan
- [ ] Webhook kreiran i Secret sačuvan
- [ ] Environment variables postavljene u Vercel
- [ ] Variant mapping unet u `route.ts`
- [ ] Test mode testiran
- [ ] Production mode aktiviran

---

## Support

Ako imaš problema:
1. Proveri LemonSqueezy dokumentaciju: https://docs.lemonsqueezy.com
2. Proveri server logs za detaljne error poruke
3. Testiraj webhook sa LemonSqueezy webhook testerom

