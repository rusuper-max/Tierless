# Claude Task Log

Ovaj fajl služi kao evidencija svih zadataka, ispravki i implementacija.
**Ne menjati ručno** - Claude automatski dodaje unose.

---

## Format unosa

```
### [DATUM] - Kratak opis
- **Status:** Completed / In Progress / Blocked
- **Fajlovi:** lista izmenjenih fajlova
- **Opis:** detalji šta je urađeno
```

---

## Log

---

### [2025-12-06] - Team Settings & Dashboard Improvements (Prethodna sesija)
- **Status:** Completed
- **Opis:**

**Team Settings stranica:**
- Team Settings page sa tabovima (General / Members)
- Team rename form sa feedback porukama (success/error)
- Team name character limit (32 karaktera)

**Sidebar izmene:**
- Uklonjen TeamSwitcher dropdown iz sidebar-a
- Popravljen sidebar link na /settings (umesto /settings/members)

**Dashboard tabela:**
- Team kolona u dashboard tabeli (prikazuje team badge)
- `listWithTeams()` i `listTeamCalcs()` vraćaju teamName

**Invite sistem:**
- Duplicate invite validacija (existing member ili pending invite)
- Cancel invite button sa danger varijantom

**Role management:**
- Role dropdown za promenu member roles (RoleDropdown komponenta)

**UI/UX poboljšanja:**
- Dark mode text visibility u inputima
- Color consistency (cyan umesto purple/indigo)

---

### [2025-12-06] - Viewer Read-Only Mode Fix
- **Status:** Completed
- **Fajlovi:**
  - `src/app/editor/[id]/EditorShell.tsx`
  - `src/app/editor/[id]/panels/AdvancedPanel.tsx`
  - `src/app/editor/[id]/panels/advanced/AdvancedPanelInner.tsx`
  - `src/app/editor/[id]/panels/advanced/AdvancedNodeCard.tsx`
  - `src/app/editor/[id]/panels/advanced/AdvancedNodeInspector.tsx`
  - `src/app/editor/[id]/panels/SimpleListPanel.tsx`
  - `src/app/editor/[id]/components/EditorNavBar.tsx`
  - `src/app/globals.css`
- **Opis:**

**Problem 1: Banner prekrivao navbar**
- Banner je imao `fixed top-0 z-[150]` što je prekrivalo navbar
- Rešenje: Premešten banner ispod navbara sa `sticky top-14 z-[55]`

**Problem 2: Dugmad klikabilna u read-only modu**
- CSS pristup nije radio jer Tailwind klase imaju veći specificity
- AdvancedPanel i SimpleListPanel nisu primali readOnly prop

**Implementirano rešenje:**
- Proper prop drilling: readOnly se prosleđuje kroz celu hijerarhiju
- EditorShell → AdvancedPanel/SimpleListPanel → child komponente
- Sva interaktivna dugmad imaju `disabled={readOnly}` atribut
- Inputi, textarea, select elementi su disabled u read-only modu
- Node Inspector prikazuje "View only mode" notice
- SimpleListPanel prikazuje read-only banner
- Uklonjen CSS hack iz globals.css - koriste se proper disabled atributi

**Disabled elementi u read-only modu:**
- Navbar: Save, Publish, Undo/Redo buttons
- AdvancedPanel: Add Tier/Addon/Item/Slider, Settings dugmad
- AdvancedNodeCard: Selection clicks, slider input
- AdvancedNodeInspector: Svi inputi, delete button, feature buttons
- SimpleListPanel: Add Item, Add Section, OCR Scan, Page Title input

---

### [2025-12-06] - Viewer Read-Only Mode - Dodatne Ispravke
- **Status:** Completed
- **Fajlovi:**
  - `src/app/editor/[id]/components/EditorNavBar.tsx`
  - `src/app/editor/[id]/panels/advanced/AdvancedPanelInner.tsx`
  - `src/app/editor/[id]/panels/advanced/AdvancedNodeCard.tsx`
  - `src/app/editor/[id]/panels/advanced/AdvancedNodeInspector.tsx`
- **Opis:**

**Problem 1: Undo/Redo pristupni u navbar**
- Viewer je mogao da koristi Undo/Redo dugmad
- Rešenje: Dodato `disabled={!canUndo || readOnly}` i `disabled={!canRedo || readOnly}`

**Problem 2: Nije mogao da klikne na elemente za pregled**
- Viewer nije mogao da klikne na tier/addon/slider da vidi settings
- Rešenje: Dozvoljeno klikanje na node card (inspector ostaje read-only)
- Uklonjeno `if (!readOnly)` iz setSelectedId poziva

**Problem 3: Features interakcije dostupne**
- Viewer je mogao da highlight features i menja settings
- Rešenje:
  - Highlight button disabled sa `disabled={readOnly}`
  - Feature name input disabled sa `disabled={readOnly}`
  - Settings i Delete button skriveni za readOnly (sa `{!readOnly && <> ... </>}`)
  - Configure panel ne prikazuje se kada je readOnly

**Rezultat:**
- Viewer može da klikne na elemente da vidi njihove settings
- Sve interakcije su disabled (undo/redo, feature editing)
- Inspector prikazuje "View only mode" notice
- Svi inputi i buttons su properly disabled

---

### [2025-12-06] - Preview Modal Bug Fix
- **Status:** Completed
- **Fajlovi:**
  - `src/app/editor/[id]/EditorShell.tsx`
- **Opis:**

**Problem:**
- Preview dugme u navbar-u je uvek prikazivalo SimpleListPanel preview
- Čak i kada je korisnik u Advanced Panel (Tier Based Editor) modu

**Uzrok:**
- Preview modal je koristio hardcoded `<PublicRenderer>` komponentu
- `uiMode` state nije bio korišćen za izbor renderera

**Rešenje:**
- Dodat dynamic import za `AdvancedPublicRenderer`
- Preview modal sada koristi `uiMode` za conditional rendering:
  - `uiMode === "simple"` → `<PublicRenderer>`
  - `uiMode === "advanced"` → `<AdvancedPublicRenderer>`

**Izmenjeni kod:**
```tsx
// Pre (BUG)
<PublicRenderer calc={calc} ... />

// Posle (FIX)
{uiMode === "simple"
  ? <PublicRenderer calc={calc} ... />
  : <AdvancedPublicRenderer calc={calc} />
}
```

---

### [2025-12-06] - ARCHITECTURE.md Documentation
- **Status:** Completed
- **Fajlovi:**
  - `ARCHITECTURE.md` (novi fajl)
- **Opis:**

Kreirana kompletna arhitekturna dokumentacija projekta koja uključuje:
- Tech Stack tabela (Next.js, React, Tailwind, Zustand, PostgreSQL, etc.)
- Project Structure pregled sa svim folderima
- Key Patterns dokumentacija:
  - Editor Modes (Simple vs Advanced)
  - State Management (Zustand sa undo/redo)
  - Team Permissions (owner/editor/viewer)
  - Read-Only Mode prop drilling
  - Public Rendering komponente
- Database Schema pregled
- API Conventions i response format
- Component Conventions
- Testing setup (Vitest + Playwright)
- Environment Variables lista
- Deployment info (Vercel + Neon)
- Common Tasks sekcija

---

### [2025-12-06] - Feature Reorder in Tier Inspector
- **Status:** Completed
- **Fajlovi:**
  - `src/app/editor/[id]/panels/advanced/useAdvancedState.ts`
  - `src/app/editor/[id]/panels/advanced/AdvancedPanelInner.tsx`
  - `src/app/editor/[id]/panels/advanced/AdvancedNodeInspector.tsx`
- **Opis:**

Dodata mogućnost reordera features u tier inspector-u pomoću strelica gore/dole.

**Implementacija:**
1. `useAdvancedState.ts` - Dodat `handleMoveFeature` handler:
   - Prima `nodeId`, `featureId` i `direction` ("up" | "down")
   - Swap-uje feature sa susednim u nizu
   - Koristi existing `commitNodes` pattern

2. `AdvancedPanelInner.tsx` - Prosleđuje novi handler:
   - Destructure `handleMoveFeature` iz hook-a
   - Prosleđuje kao prop ka `AdvancedNodeInspector`

3. `AdvancedNodeInspector.tsx` - UI za reorder:
   - Dodat `ChevronUp` import iz lucide-react
   - Dodat prop u interface i destructuring
   - Za svaki feature dodate dve strelice (gore/dole)
   - Strelice su disabled na granicama (prva/poslednja)
   - Strelice su skrivene u read-only modu

**UX:**
- Strelice su kompaktne (ChevronUp/ChevronDown, 3x3 px)
- Disabled state sa smanjenom opacity
- Hover effect sa pozadinom
- Title tooltip za accessibility

---

### [2025-12-06] - Lemon Squeezy Agency Plan & Pricing Page Fix
- **Status:** Completed
- **Fajlovi:**
  - `src/lib/lemon-config.ts`
  - `src/app/(pricing)/start/page.tsx`
  - `src/app/api/webhooks/lemon/route.ts`
- **Opis:**

**Agency Plan Variant IDs:**
Dodati Lemon Squeezy variant IDs za Agency plan:
- Monthly: `1133562`
- Yearly: `1133564`

**Izmene u fajlovima:**
1. `lemon-config.ts`:
   - Dodat `agency` u PlanTier type
   - Renamed `scale` → `starter` (za konzistentnost)
   - Dodati agency_monthly i agency_yearly variant IDs

2. `start/page.tsx` (LEMON_VARIANTS):
   - Agency sada ima prave variant IDs umesto TODO placeholder-a

3. `webhooks/lemon/route.ts` (VARIANT_TO_PLAN):
   - Update-ovani SVI variant IDs da se poklapaju sa pricing stranicom
   - Stari IDs (712914, 713622, etc.) zamenjeni novim (1122011, 1123104, etc.)
   - Dodat Agency plan mapping

**Pro Plan Hover Outline Fix:**
- Pro plan nije imao vidljiv hover outline kao ostali planovi
- Dodat `hover:ring-2 hover:ring-purple-400/30` u Pro theme.borderHover
- Sada Pro ima i border color change i ring effect na hover

---

### [2025-12-06] - Pricing Page Fixes (Prices & Pro Hover)
- **Status:** Completed
- **Fajlovi:**
  - `src/app/(pricing)/start/page.tsx`
- **Opis:**

**Decimalne cene:**
- Ažurirane mesečne cene da prikazuju 2 decimale:
  - Starter: $9 → $9.99
  - Growth: $19 → $19.99
  - Pro: $39 → $39.99
  - Agency: $99 → $99.99

**Pro hover border fix:**
- Problem: Pro plan nije imao vidljiv hover outline kao ostali planovi
- Uzrok: borderHover je imao kompleksne ring klase koje nisu radile
- Rešenje: Pojednostavljen borderHover da koristi isti pattern kao Growth plan
  - Pre: `hover:border-purple-500 dark:hover:border-purple-400 hover:ring-2 hover:ring-purple-500 dark:hover:ring-purple-400`
  - Posle: `hover:border-purple-400 dark:hover:border-purple-500`
- Sada Pro ima jednostavnu promenu boje bordera na hover, isto kao i svi ostali planovi

---

### [2025-12-06] - Pricing Cards Simplification (Remove isPro)
- **Status:** Completed
- **Fajlovi:**
  - `src/app/(pricing)/start/page.tsx`
- **Opis:**

**Problem:**
1. Pro plan dugme bilo nevidljivo (gradient koji nije radio)
2. Agency plan imao flickering na hover (gradient border logika)
3. Svi planovi trebaju da se ponašaju isto - jednostavno, kao Growth ili Starter

**Rešenje - potpuno uklonjena `isPro` logika:**

1. **Pro plan:**
   - Dugme: `bg-gradient-to-r from-purple-600...` → `bg-purple-600 text-white`
   - Hover: `hover:bg-purple-700` (isto kao Growth ima `hover:bg-red-700`)

2. **Agency plan:**
   - Uklonjeno `isPro: true`
   - Dodat normalan theme kao svi ostali planovi:
     - `borderHover: "hover:border-indigo-400 dark:hover:border-indigo-500"`
     - `button: "bg-indigo-600 text-white"`
     - `buttonHover: "hover:bg-indigo-700"`

3. **Uklonjeno iz koda:**
   - `isPro` property iz Plan type
   - `proGradientBorder` i `proButtonStyle` stilovi
   - `isHovered` state i mouse event handleri
   - `isDark`, `resolvedTheme`, `useTheme`
   - `BRAND_GRADIENT` konstanta
   - `activeToggleStyle` (nekorišćen)

**Rezultat:**
- Svih 5 planova sada ima identično ponašanje
- Jednostavni solid-color dugmići i hover efekti
- Nema flickeringa, nema gradijenata, nema posebne logike

---

### [2025-12-06] - Pricing Page FAQ Integration & Feature Fix
- **Status:** Completed
- **Fajlovi:**
  - `src/app/(pricing)/start/page.tsx`
  - `src/app/(marketing)/faq/page.tsx`
- **Opis:**

**Pricing Page Fixes:**
- Promenjen "Advanced Analytics" u "Webhooks & API" za Pro plan (analytics je isti za sve paid planove)
- Ažurirani `href` atributi za feature chips da vode na odgovarajuća FAQ pitanja:
  - Starter: `/faq#ai-scan`
  - Growth: `/faq#embed`
  - Pro: `/faq#custom-domain`
  - Agency: `/faq#client-workspaces`

**FAQ Page Improvements:**
- Dodat `id` field u FAQItem interface
- Dodati IDs za sva FAQ pitanja (what-is-tierless, need-website, ai-scan, embed, itd.)
- Implementirana anchor navigacija sa `useEffect` za hash URL-ove
- Dodata `scroll-mt-32` klasa za scroll offset
- Dodato novo pitanje: "What are Client Workspaces and how do they work?"

---

### [2025-12-06] - Branded Error Pages (404 & 500)
- **Status:** Completed
- **Fajlovi:**
  - `src/app/not-found.tsx` (novi fajl)
  - `src/app/error.tsx` (novi fajl)
- **Opis:**

**404 Page (not-found.tsx):**
- Branded dizajn sa gradient "404" tekstom
- Responsive layout (mobile-friendly)
- Dark mode podrška
- Linkovi: Back to Home, Go to Dashboard, Check our FAQ
- Koristi indigo-to-cyan gradient za branding

**500 Error Page (error.tsx):**
- Client component (prima error i reset props)
- AlertTriangle ikona u gradient krugu (red-to-orange)
- "Try Again" button za reset
- Error digest prikaz za debugging
- Link ka support email-u
- Dark mode podrška

---

### [2025-12-06] - Teams Page UI Redesign
- **Status:** Completed
- **Fajlovi:**
  - `src/lib/db.ts` (getUserTeams funkcija)
  - `src/app/dashboard/teams/page.tsx`
- **Opis:**

**Database Change:**
- `getUserTeams()` sada vraća `member_count` za svaki tim
- SQL subquery: `(SELECT COUNT(*) FROM team_members WHERE team_id = t.id)::int`

**Teams Page UI Improvements:**
1. **Role Badges with Icons:**
   - Owner: Crown ikona, amber boja
   - Admin: Shield ikona, indigo boja
   - Editor: Pencil ikona, emerald boja
   - Viewer: Eye ikona, slate boja

2. **Team Cards:**
   - Gradient accent line na vrhu kartice
   - Avatar sa prvim dvema slovima imena tima
   - Consistent gradient boje bazirane na hash-u imena
   - Member count prikaz (X members)
   - Hover efekti: border color, shadow, "Open" text

3. **Empty State:**
   - Poboljšan dizajn sa gradient pozadinom za ikonu
   - Bolji indigo/cyan teme umesto slate

4. **Gradients:**
   - 6 različitih gradient kombinacija
   - Konzistentno mapiranje bazirano na team name hash

---

### [2025-12-06] - SEO Implementation (Launch Ready)
- **Status:** Completed
- **Fajlovi:**
  - `public/robots.txt` (novi fajl)
  - `src/app/sitemap.ts` (novi fajl)
  - `src/app/layout.tsx` (ažuriran)
- **Opis:**

**robots.txt:**
- Dozvoljava crawling svih javnih stranica
- Blokira privatne rute: /api/, /dashboard/, /editor/, /settings/, /signin, /signup
- Uključuje link ka sitemap.xml

**Dynamic Sitemap (sitemap.ts):**
- Statičke stranice: /, /start, /faq, /privacy, /terms, /examples
- Dinamičke stranice: sve published calculators iz baze
- Prioriteti: homepage (1.0), pricing (0.9), examples (0.8), FAQ (0.7), legal (0.3), calcs (0.6)
- Limiti na 1000 published calcs

**Metadata u layout.tsx:**
- Title template: "%s | Tierless"
- Description: SEO optimizovan tekst
- Keywords: price list, digital menu, restaurant menu, QR code menu, etc.
- Open Graph tags (type, locale, siteName, images)
- Twitter Card tags (summary_large_image)
- Robots directives (index, follow, googleBot config)

**JSON-LD Structured Data:**
- @type: SoftwareApplication
- applicationCategory: BusinessApplication
- AggregateOffer: $0 - $99.99 (5 plans)
- Organization creator sa logo i sameAs
- featureList: Digital menu creation, QR code generation, etc.

**Napomena:**
- Potrebno kreirati `public/og-image.png` (1200x630px) za social sharing

---

### [2025-12-06] - Security Fixes & GDPR Compliance
- **Status:** Completed
- **Fajlovi:**
  - `src/lib/db.ts` (SHA256 token hashing)
  - `src/middleware.ts` (JWT verification)
  - `src/lib/consent.ts` (novi fajl)
  - `src/components/CookieConsent.tsx` (novi fajl)
  - `src/lib/analytics.ts` (consent check)
  - `src/app/(marketing)/cookies/page.tsx` (novi fajl)
  - `src/app/layout.tsx` (CookieConsent component)
  - `src/app/sitemap.ts` (import fix + cookies page)
- **Opis:**

**Security Fixes:**
1. **Auth Token Hashing:**
   - Magic link tokens sada koriste SHA256 hash za storage
   - Raw token se šalje korisniku, hash se čuva u bazi
   - Ako je baza kompromitovana, tokeni su beskorisni

2. **Middleware JWT Verification:**
   - Middleware sada VERIFIKUJE JWT token, ne samo proverava da li postoji
   - Koristi `jwtVerify` iz jose biblioteke
   - Invalid/expired cookies se automatski brišu

3. **Dead Code Cleanup - iron-session:**
   - Obrisani: `src/lib/session.ts`, `src/app/api/signup/route.ts`, `src/app/api/_session-selftest/`
   - Uklonjen `iron-session` iz package.json
   - Uklonjen `IRON_SESSION_PASSWORD` iz CI workflows

**GDPR Cookie Consent:**
1. **Consent System:**
   - `src/lib/consent.ts` - getter/setter za localStorage
   - `src/components/CookieConsent.tsx` - banner na dnu stranice
   - Accept/Decline dugmad, link ka /cookies

2. **Analytics Integration:**
   - `trackEvent()` sada proverava `hasConsent()` pre slanja
   - `beforeunload` handler takođe proverava consent
   - Bez consenta = nema tracking

3. **Cookie Policy Page:**
   - Nova `/cookies` stranica sa detaljnim objašnjenjem
   - Lista essential i analytics cookies
   - Objašnjenje šta se trackuje i kako upravljati

**Dead Code Cleanup:**
- Obrisano 17 nekorišćenih fajlova:
  - `src/lib/founder.ts`, `src/lib/logoutClient.ts`, `src/lib/ocrLimits.ts`
  - `src/actions/profile.ts`
  - `src/components/dashboard/SettingsForm.tsx`, `src/components/dashboard/TeamSwitcher.tsx`
  - `src/components/landing/GlowingGrid.tsx`, `src/components/landing/InteractiveGridPattern.tsx`
  - `src/components/landing/MorphingParticles.tsx`, `src/components/landing/TiltCard.tsx`
  - `src/components/landing/ParticlesBackground.tsx`
  - `src/components/scrolly/*` (4 fajla), `src/components/ui/FlowingLines.tsx`
- Uklonjene nekorišćene dependencies:
  - `@react-three/drei`, `@react-three/fiber`, `@types/three`, `three`
  - `@vercel/blob`, `simplex-noise`
- Očišćeni prazni direktorijumi

**Bugfix:**
- `src/app/sitemap.ts` - Ispravljeno `@/lib/pool` → `@/lib/db`
- Dodata validacija za `updated_at` timestamp

---

### [2025-12-06] - Global i18n wiring • Phase 1
- **Status:** Completed
- **Fajlovi:** `src/i18n/{client.ts,dictionaries.ts,index.ts,LanguageProvider.tsx,locales.ts,server.ts,translate.ts}`, `src/app/layout.tsx`, `src/components/{AdvancedPublicRenderer.tsx,UseTemplateButton.tsx,share/ShareQrModal.tsx,dashboard/Sidebar.tsx,dashboard/DashboardTabs.tsx,gate/Gate.tsx,publish/PublishGuardButton.tsx,upsell/UpgradeSheet.dev.tsx,editor/HelpModeIntro.tsx,editor/HelpTooltip.tsx,editor/GuidedTour.tsx,editor/OnboardingIntro.tsx,scrolly/blocks/{TierCard.tsx,AddonCard.tsx,SliderBlock.tsx}}`, `src/app/(pricing)/start/page.tsx`, `src/app/dashboard/{page.client.tsx,trash/page.client.tsx}`, `src/app/editor/[id]/{EditorShell.tsx,components/EditorNavBar.tsx,panels/SimpleListPanel.tsx}`, `src/i18n/messages/en.json`
- **Opis:**
  - Dodata kompletna i18n infrastruktura (shared dictionaries, translate helper, server-side `t` sa cookie podrškom i client `useT` hook). `LanguageProvider` sada prihvata `initialLocale`, sinhronizuje localStorage/cookie (`tierless_locale`) i ažurira `<html lang>`.
  - `app/layout` čita željeni jezik iz Vercel cookies API-ja i prosleđuje ga LanguageProvider-u kako bi SSR odmah renderovao pravi jezik.
  - Refaktorisani svi klijentski moduli koji su koristili stari `t` helper (Sidebar, DashboardTabs, Gate, QR modal, Publish guard, Upgrade sheet, editor shell/paneli, Tier/Addon/Slider blokovi itd.) da koriste `useT`, čime UI reaguje na promenu jezika bez reloada.
  - Pricing start stranica dobila lokalizacijski pipeline: planovi se sada zasnivaju na blueprint-u i prolaze kroz `localizePlans`, a `PlanCard`/UI koristi `useT`. Ovo čuva postojeći dizajn dugmadi i omogućava kasniji unos prevoda u JSON fajlove.
  - Dodati novi nav ključevi (`nav.stats`, `nav.integrations`, `nav.trash`) u `en.json` i sređene helper funkcije kako bi fallback logika vraćala english ključ tek ako ne postoji prevod.
  - Dodat cookie persistence znači da izbor jezika iz marketing header-a ili Account settingsa sada “zakucava” ceo sajt (landing + dashboard) čak i pri reloadu/rutiranju.

### [2025-12-07] - Analytics UI Improvements
- **Status:** Completed
- **Fajlovi:**
  - `src/lib/countries.ts` (novi fajl)
  - `src/app/dashboard/stats/page.tsx`
- **Opis:**

**Country Flags in Analytics:**
- Novi helper fajl `countries.ts` sa:
  - `countryCodeToFlag()` - konvertuje country code u flag emoji (SR → 🇷🇸)
  - `getCountryName()` - vraća puno ime države (SR → Serbia)
  - `getCountryDisplay()` - kombinuje flag i ime
- Stats page sada prikazuje zastavice pored država
- "Unknown" prikazuje 🌐 emoji sa objašnjenjem (VPN/proxy/localhost)

---

### [2025-12-07] - Mobile UseCasesGrid Fix
- **Status:** Completed
- **Fajlovi:**
  - `src/components/landing/UseCasesGrid.tsx`
- **Opis:**

**Problem:**
- "One tool, endless possibilities" sekcija je bila broken na mobilnom
- 8x6 grid sa apsolutnim pozicioniranjem nije radio na manjim ekranima

**Rešenje:**
- Dodat responsive dizajn sa odvojenim layoutima:
  - Mobile (`md:hidden`): Jednostavan 2x2 grid sa 4 featured kartice
  - Desktop (`hidden md:block`): Originalni ClickUp-style 8x6 grid

---

### [2025-12-07] - Editor Save Bug Investigation & Fixes
- **Status:** Completed
- **Fajlovi:**
  - `src/app/editor/[id]/EditorShell.tsx`
- **Opis:**

**Pronađeni problemi (Reddit claim "nije mi sačuvalo stranicu"):**
1. Autosave je bio DISABLED po defaultu (`autosaveEnabled ?? false`)
2. `beforeunload` handler nije prikazivao browser warning
3. Save failure toast trajao samo 1.3 sekunde
4. Autosave failures nisu imale notifikaciju

**Implementirana rešenja:**
1. **Autosave default TRUE** - Korisnici očekuju da se promene čuvaju
2. **Browser warning** - `e.preventDefault()` + `e.returnValue` za "Leave site?" dijalog
3. **Duži toast** - 4 sekunde umesto 1.3 za save failures
4. **Autosave failure notification** - Toast poruka "Autosave failed - click Save to retry"

---

### [2025-12-07] - Agency Plan Badge (Sidebar & EditorNavBar)
- **Status:** Completed
- **Fajlovi:**
  - `src/components/dashboard/Sidebar.tsx`
  - `src/app/editor/[id]/components/EditorNavBar.tsx`
- **Opis:**

**Problem:**
- Agency plan nije imao svoj badge dizajn
- Fallback na "Free" stil zbog `configs[key] || configs.free`

**Rešenje:**
- Dodat purple/pink gradient stil za Agency plan u oba fajla:
  - Gradient: `linear-gradient(90deg, #8B5CF6, #EC4899)`
  - Isti stil kao Pro (gradient border) ali sa drugačijim bojama

**Plan Display Summary:**
| Plan | Stil |
|------|------|
| free | Slate (gray) |
| starter | Emerald (green) |
| growth | Rose (pink) |
| pro | Indigo→Cyan gradient |
| agency | Purple→Pink gradient |
| tierless | Spinning gradient + "Dev" label |

---

### [2025-12-07] - 🚨 CRITICAL: Payment Bypass Security Fix
- **Status:** Completed
- **Fajlovi:**
  - `src/components/upsell/UpgradeSheet.dev.tsx`
  - `src/app/api/me/plan/route.ts`
- **Opis:**

**KRITIČAN BUG PRONAĐEN:**
- UpgradeSheet je direktno pozivao `PUT /api/me/plan` sa novim planom
- Korisnici su mogli dobiti plaćene planove (Starter, Growth, Pro) BESPLATNO!
- Primer: Free user klikne "Upgrade to Starter" → odmah dobije Starter bez plaćanja

**Fix 1 - UpgradeSheet.dev.tsx:**
```tsx
// BEFORE (BUG):
fetch("/api/me/plan", { body: { plan: requiredPlan } })

// AFTER (FIX):
fetch("/api/integrations/lemon/checkout", { planKey: "starter_yearly" })
→ Redirect na Lemon Squeezy checkout
→ Webhook menja plan NAKON uspešnog plaćanja
```

**Fix 2 - /api/me/plan endpoint:**
- Dodata provera `PLAN_RANK` za upgrade detection
- Blokira direktne upgrade-ove sa 403 greškom
- Dozvoljeno: downgrades, founder tierless, webhook updates

**Dozvoljeno:**
- ✅ Downgrade (Pro → Free)
- ✅ Founders postavljaju tierless direktno
- ✅ Webhook postavlja bilo koji plan

**Blokirano:**
- ❌ Direktan upgrade preko API-ja bez plaćanja

---

### [2025-12-07] - Subscription Downgrade Flow Fix
- **Status:** Completed
- **Fajlovi:**
  - `src/app/api/me/plan/route.ts`
- **Opis:**

**Problem:**
- Kad korisnik otkaže pretplatu, plan se odmah menjao na Free
- Korisnik je platio do određenog datuma, treba da ima pristup do tada

**Rešenje:**
- Ako korisnik ima aktivnu pretplatu (`renews_on > now`):
  - Plan OSTAJE isti
  - `cancelAtPeriodEnd = true`
  - Poruka: "Your plan will change to free on [datum]"
- Webhook `subscription_expired` tada menja plan na Free

**Flow za otkazivanje:**
1. User klikne "Cancel subscription"
2. API: `cancelAtPeriodEnd = true`, plan ostaje (npr. Pro)
3. User koristi Pro do isteka pretplate
4. Lemon webhook `subscription_expired` → plan = Free

**API Response:**
```json
{
  "ok": true,
  "plan": "pro",           // Ostaje Pro!
  "renewsOn": "2025-01-15",
  "cancelAtPeriodEnd": true,
  "message": "Your plan will change to free on 1/15/2025"
}
```

---

### [2025-12-07] - Lemon Squeezy Customer Portal Integration
- **Status:** Completed
- **Fajlovi:**
  - `src/app/api/integrations/lemon/portal/route.ts` (novi fajl)
  - `src/app/dashboard/account/page.tsx`
  - `src/i18n/messages/dashboard-{en,sr,es,fr,de,ru}.json`
- **Opis:**

**Nova API ruta za Customer Portal:**
- `GET /api/integrations/lemon/portal` - vraća Lemon Squeezy customer portal URL
- Preuzima `lemon_customer_id` iz `user_profiles` tabele
- Poziva Lemon API: `/v1/customers/{id}/customer-portal`
- Fallback na `/start` ako korisnik nema Lemon customer ID

**Account Page Improvements:**
- "Manage Subscription" dugme sada koristi portal za plaćene korisnike
- Free korisnici i dalje idu na `/start` (pricing page)
- Dodat loading state sa Loader2 animacijom
- Dodata nova i18n ključeva:
  - `account.billing.upgradePlan` - "Upgrade Plan"
  - `account.billing.loading` - "Loading..."
  - `account.billing.planNames.agency` - "Agency"

**Subscription Management Flow:**
- Free user: Dugme "Upgrade Plan" → `/start`
- Paid user: Dugme "Manage Subscription" → Lemon Customer Portal
- U Lemon portalu korisnik može:
  - Promeniti payment method
  - Upgrade/downgrade plan
  - Otkazati pretplatu
  - Videti invoice history

**Kako Lemon upravlja downgrades:**
- Korisnik zadržava viši plan do kraja billing perioda
- Bez refunda - fer za obe strane
- Lemon webhook ažurira plan kada se billing period završi

---

### [2025-12-23] - Gemini Code Review Fixes
- **Status:** Completed
- **Fajlovi:**
  - `src/lib/permissions.ts`
  - `src/lib/db.ts`
  - `src/lib/constants.ts` (novi fajl)
  - `tests/unit/calcsStore.test.ts` (novi fajl)
  - `vitest.config.ts`
- **Opis:**

Adresiranje Gemini code review izveštaja:

**1. `requirePlanFeature` implementacija:**
- Funkcija je bila stub koji uvek vraća `allowed: true`
- Sada proverava user plan iz `user_plans` tabele
- Koristi `hasFeature()` iz entitlements za proveru pristupa
- Vraća 403 sa informacijom o potrebnom planu

**2. Team deletion fix:**
- Problem: Kada se tim obriše, kalkulatori su ostajali orphaned (team_id = NULL)
- Rešenje: Transakciona logika koja eksplicitno prebacuje kalkulatore u owner-ov lični account pre brisanja tima
- Kalkulator ostaje dostupan owner-u kroz njegov dashboard

**3. Constants file:**
- Novi `src/lib/constants.ts` za centralizovane plan/role stringove
- PLANS i ROLES objekti za type-safe konstanteы
- Sprečava typo greške u magic stringovima

**4. Unit tests:**
- Novi `tests/unit/calcsStore.test.ts` sa 22 testa
- Testovi za `slugBase()`, `sanitizeCopyName()`, `rowToCalc()`
- Ažuriran vitest.config.ts da uključi `tests/` folder

---

### [2025-12-23] - Production Dev Controls
- **Status:** Completed
- **Fajlovi:**
  - `src/hooks/useAccount.ts`
  - `src/components/DevPlanSwitcher.tsx`
  - `ARCHITECTURE.md`
- **Opis:**

Dev controls sada rade u produkciji za whitelisted email adrese.

**Izmene u useAccount.ts:**
- Uklonjena `isLocalhost()` restrikcija za `isDevUser()`
- Dev controls sada rade kako na localhost-u tako i na tierless.net
- Dodana `isProductionEnv()` helper funkcija za UI indikatore
- Plan override sada uključuje "agency" plan

**Izmene u DevPlanSwitcher.tsx:**
- Dodat Agency plan u listu planova (roze boja)
- Dodat "PROD" indikator sa warning ikonom kada je na produkciji
- Importovan `isProductionEnv` iz useAccount

**Security Model:**
- Plan override je **samo client-side** - utiče na UI prikazivanje entitlements-a
- Server-side provere (`requirePlanFeature`, limit checks) uvek koriste **pravi plan iz baze**
- Sigurno za korišćenje u produkciji - ne može zaobići plaćanje

**ARCHITECTURE.md:**
- Dodata nova sekcija "Dev Controls (Production-Ready)"
- Dokumentovan whitelist, dostupne kontrole i security model

---

<!-- Novi unosi će biti dodati ovde -->

