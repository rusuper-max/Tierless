# 🍋 LemonSqueezy Setup - JEDNOSTAVNO UPUTSTVO

## ⚠️ VAŽNO: Pročitaj ovo prvo!

Ako ne znaš kako da kreneš, evo **najjednostavnijeg načina**:

---

## 🎯 OPTION 1: Korak-po-korak sa slikama u tekstu

### KORAK 1: Registracija (2 minuta)

1. **Otvori:** https://lemonsqueezy.com
2. **Klikni:** "Sign Up" (gornji desni ugao)
3. **Unesi:** Email i password
4. **Verifikuj:** Email (proveri inbox)

**✅ Gotovo!** Sada si u dashboardu.

---

### KORAK 2: Kreiraj Store (3 minuta)

**Gde:** Dashboard → levi meni → **"Stores"**

1. Klikni **"New Store"** (plavo dugme)
2. Popuni formu:
   ```
   Store Name: Tierless
   Store URL: tierless.net
   Currency: USD
   ```
3. Klikni **"Create Store"**
4. **KOPIRAJ Store ID** - vidi se u URL-u ili u Store Settings
   - Primer: `https://app.lemonsqueezy.com/stores/12345`
   - Store ID je: `12345`

**💾 SAČUVAJ:** Store ID negde (notepad, notes, gde god)

---

### KORAK 3: Kreiraj Produkt (2 minuta)

**Gde:** Dashboard → levi meni → **"Products"**

1. Klikni **"New Product"** (plavo dugme)
2. Popuni:
   ```
   Name: Tierless Plans
   Description: Subscription plans
   Type: Subscription (recurring) ← VAŽNO!
   ```
3. Klikni **"Create Product"**

**✅ Gotovo!** Sada si u produktu.

---

### KORAK 4: Kreiraj Varijante (10 minuta)

**Gde:** U produktu → tab **"Variants"**

**Kreiraj 6 varijanti (jedna po jedna):**

#### Varijanta 1: Starter Monthly
1. Klikni **"Add Variant"**
2. Popuni:
   ```
   Name: Starter (Monthly)
   Price: 9.00
   Billing Period: Monthly ← VAŽNO!
   Trial Days: 0
   ```
3. Klikni **"Save"**
4. **KOPIRAJ Variant ID** - vidi se u URL-u ili u Variant Settings
   - Primer URL: `https://app.lemonsqueezy.com/products/.../variants/123456`
   - Variant ID je: `123456`

**💾 SAČUVAJ:** `starter_monthly = 123456`

#### Varijanta 2: Starter Yearly
1. Klikni **"Add Variant"** ponovo
2. Popuni:
   ```
   Name: Starter (Yearly)
   Price: 79.00
   Billing Period: Yearly ← VAŽNO!
   Trial Days: 0
   ```
3. Klikni **"Save"**
4. **KOPIRAJ Variant ID** (npr. `123457`)

**💾 SAČUVAJ:** `starter_yearly = 123457`

#### Varijanta 3: Growth Monthly
```
Name: Growth (Monthly)
Price: 19.00
Billing Period: Monthly
```
**💾 SAČUVAJ:** `growth_monthly = 234567` (primer)

#### Varijanta 4: Growth Yearly
```
Name: Growth (Yearly)
Price: 159.00
Billing Period: Yearly
```
**💾 SAČUVAJ:** `growth_yearly = 234568` (primer)

#### Varijanta 5: Pro Monthly
```
Name: Pro (Monthly)
Price: 39.00
Billing Period: Monthly
```
**💾 SAČUVAJ:** `pro_monthly = 345678` (primer)

#### Varijanta 6: Pro Yearly
```
Name: Pro (Yearly)
Price: 349.00
Billing Period: Yearly
```
**💾 SAČUVAJ:** `pro_yearly = 345679` (primer)

---

### KORAK 5: API Key (2 minuta)

**Gde:** Dashboard → levi meni → **"Settings"** → **"API"**

1. Klikni **"Create API Key"**
2. Popuni:
   ```
   Name: Tierless Production
   Permissions: Read & Write
   ```
3. Klikni **"Create"**
4. **KOPIRAJ API Key** - pojavi se samo jednom!
   - Primer: `sk_live_abc123xyz...`
   - **⚠️ NE ZATVARAJ TAB DOK NE KOPIRAŠ!**

**💾 SAČUVAJ:** API Key negde sigurno

---

### KORAK 6: Webhook (3 minuta)

**Gde:** Dashboard → **"Settings"** → **"Webhooks"**

1. Klikni **"Create Webhook"**
2. Popuni:
   ```
   Name: Tierless Webhook
   URL: https://tierless.net/api/webhooks/lemon
   ```
3. **Izaberi Events** (checkboxes):
   - ✅ subscription_created
   - ✅ subscription_updated
   - ✅ subscription_cancelled
   - ✅ subscription_resumed
   - ✅ subscription_expired
   - ✅ subscription_payment_success
   - ✅ subscription_payment_failed
4. Klikni **"Create"**
5. **KOPIRAJ Webhook Secret** - pojavi se samo jednom!
   - Primer: `whsec_abc123...`

**💾 SAČUVAJ:** Webhook Secret negde sigurno

---

## 🎯 OPTION 2: Ako ne možeš da nađeš nešto

### Gde je Store ID?

**Metoda 1:** 
- Idi u Store → Settings
- Store ID je u URL-u: `.../stores/12345` → ID je `12345`

**Metoda 2:**
- U Store Settings, možda vidiš "Store ID" polje

### Gde je Variant ID?

**Metoda 1:**
- Klikni na Variant → Settings
- Variant ID je u URL-u: `.../variants/123456` → ID je `123456`

**Metoda 2:**
- U Variant Settings, možda vidiš "Variant ID" polje

**Metoda 3:**
- Exportuj varijante kao CSV (ako postoji opcija)
- ID će biti u CSV fajlu

---

## 🎯 OPTION 3: Test Mode (Za početak)

Ako ne želiš odmah u production:

1. **U dashboardu** prebaci na **"Test Mode"** (gornji desni ugao)
2. **Kreiraj sve kao gore**, ali:
   - API Key će biti `sk_test_...` (umesto `sk_live_...`)
   - Webhook URL može biti: `https://your-preview-url.vercel.app/api/webhooks/lemon`
3. **Testiraj** checkout flow
4. **Kada sve radi**, prebaci na **"Live Mode"** i kreiraj production varijante

---

## 📝 Šta sačuvati (Checklist)

Nakon setup-a, treba ti:

- [ ] **Store ID:** `12345` (primer)
- [ ] **API Key:** `sk_live_abc123...` (production) ili `sk_test_...` (test)
- [ ] **Webhook Secret:** `whsec_abc123...`
- [ ] **Starter Monthly Variant ID:** `123456`
- [ ] **Starter Yearly Variant ID:** `123457`
- [ ] **Growth Monthly Variant ID:** `234567`
- [ ] **Growth Yearly Variant ID:** `234568`
- [ ] **Pro Monthly Variant ID:** `345678`
- [ ] **Pro Yearly Variant ID:** `345679`

---

## 🚀 Sledeći korak: Dodaj u kod

Kada imaš sve ID-jeve:

1. **Otvori:** `src/app/api/webhooks/lemon/route.ts`
2. **Zameni** prazan `VARIANT_TO_PLAN` sa:

```typescript
const VARIANT_TO_PLAN: Record<string, PlanId> = {
  "123456": "starter",  // Starter Monthly - ZAMENI SA TVOJIM ID!
  "123457": "starter",  // Starter Yearly
  "234567": "growth",  // Growth Monthly
  "234568": "growth",  // Growth Yearly
  "345678": "pro",     // Pro Monthly
  "345679": "pro",     // Pro Yearly
};
```

3. **Otvori:** `src/app/(pricing)/start/page.tsx`
4. **Zameni** prazan `LEMON_VARIANTS` sa:

```typescript
const LEMON_VARIANTS: Record<string, { monthly?: string; yearly?: string }> = {
  starter: { monthly: "123456", yearly: "123457" },  // ZAMENI SA TVOJIM ID-jevima!
  growth:  { monthly: "234567", yearly: "234568" },
  pro:     { monthly: "345678", yearly: "345679" },
};
```

5. **Dodaj u Vercel Environment Variables:**
   - `LEMON_API_KEY` = tvoj API key
   - `LEMON_STORE_ID` = tvoj Store ID
   - `LEMON_WEBHOOK_SECRET` = tvoj Webhook Secret

---

## ❓ Pitanja?

**Q: Ne vidim "Stores" u meniju?**
A: Možda si u test mode-u. Proveri gornji desni ugao.

**Q: Ne mogu da nađem Variant ID?**
A: Klikni na variant → Settings → ID je u URL-u ili u polju.

**Q: API Key se ne pojavljuje?**
A: Refresh stranicu, možda je cache. Ili kreiraj novi.

**Q: Webhook ne radi?**
A: Proveri da li je URL javno dostupan (ne može localhost).

**Q: Možem li da koristim Stripe umesto?**
A: Da, ali treba da prepišem checkout API. LemonSqueezy je jednostavniji za start.

---

## 🆘 Ako baš ne možeš

**Alternativa:** Možemo da napravimo **manual upgrade flow** gde korisnici:
1. Kliknu "Upgrade" na pricing stranici
2. Dobiju link na tvoj email/Stripe checkout
3. Ti ručno ažuriraš plan u bazi

Ali LemonSqueezy je **mnogo bolje** jer je automatski! 🚀

---

**Srećno! Ako zapneš negde, javi mi tačno gde si i šta vidiš na ekranu.**

