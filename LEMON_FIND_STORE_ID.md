# 🔍 Kako da nađeš Store ID u LemonSqueezy

## Metoda 1: Preko API poziva (najlakše)

1. **Otvori browser Console** (F12 → Console tab)
2. **Uloguj se** u LemonSqueezy dashboard
3. **U Console-u uradi:**

```javascript
fetch('https://api.lemonsqueezy.com/v1/stores', {
  headers: {
    'Accept': 'application/vnd.api+json',
    'Authorization': 'Bearer ' + localStorage.getItem('ls_api_key') || 'YOUR_API_KEY_HERE'
  }
}).then(r => r.json()).then(data => {
  console.log('Store ID:', data.data[0].id);
  console.log('Store Name:', data.data[0].attributes.name);
})
```

**Problem:** Ovo možda neće raditi jer API key nije u localStorage.

---

## Metoda 2: Preko Network taba

1. **Otvori browser DevTools** (F12)
2. **Idi na Network tab**
3. **Refresh LemonSqueezy dashboard**
4. **Traži request koji ide na** `api.lemonsqueezy.com/v1/stores`
5. **Klikni na request** → Response tab
6. **U JSON response-u** traži `"id"` u `data[0].id`
   - Primer: `{"data": [{"id": "12345", "attributes": {...}}]}`
   - Store ID je: `12345`

---

## Metoda 3: Preko Products stranice

1. **Idi na Products** (već si tamo)
2. **Klikni na bilo koji product** (npr. "Tierless Starter Monthly")
3. **U URL-u** možda vidiš store ID:
   - Primer: `.../stores/12345/products/...`
4. **Ili u Product Settings** možda vidiš "Store" polje sa ID-om

---

## Metoda 4: Preko API dokumentacije + Postman

1. **Otvori Postman** (ili bilo koji API client)
2. **GET request na:** `https://api.lemonsqueezy.com/v1/stores`
3. **Headers:**
   ```
   Authorization: Bearer YOUR_API_KEY
   Accept: application/vnd.api+json
   ```
4. **Response će imati:**
   ```json
   {
     "data": [
       {
         "id": "12345",
         "attributes": {
           "name": "Tierless",
           ...
         }
       }
     ]
   }
   ```

---

## Metoda 5: Preko Variant URL-a (ako vidiš)

1. **Klikni na bilo koji variant** (npr. "Tierless Starter Monthly")
2. **Pogledaj URL:**
   - Možda: `.../stores/12345/products/xxx/variants/712914`
   - Store ID je: `12345`

---

## Metoda 6: Direktno iz browser DevTools

1. **Otvori DevTools** (F12)
2. **Idi na Application tab** (Chrome) ili Storage tab (Firefox)
3. **Traži u Local Storage ili Session Storage:**
   - Ključ: `ls_store_id` ili `store_id` ili slično
   - Vrednost je Store ID

---

## Metoda 7: Preko Settings stranice

1. **Idi na Settings** (dole levo u sidebaru)
2. **Možda vidiš "Store Settings"** ili "Store Information"
3. **Store ID može biti prikazan tamo**

---

## Metoda 8: Kontaktiraj LemonSqueezy Support

Ako ništa od gore ne radi:

1. **Email:** support@lemonsqueezy.com
2. **Pitanje:** "How can I find my Store ID?"
3. **Oni će ti dati** Store ID direktno

---

## Metoda 9: Preko Variant API poziva

Ako imaš Variant ID (a imaš: 712914), možeš da pozoveš Variant API i izvučeš Store ID:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Accept: application/vnd.api+json" \
     https://api.lemonsqueezy.com/v1/variants/712914
```

U response-u će biti:
```json
{
  "data": {
    "relationships": {
      "store": {
        "data": {
          "id": "12345",  // ← Ovo je Store ID!
          "type": "stores"
        }
      }
    }
  }
}
```

---

## Najbrži način: API poziv sa tvojim API Key-om

Ako imaš API key, hajde da napravim skriptu koja će automatski da nađe Store ID:

