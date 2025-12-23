# Tierless Roadmap

**Last Updated:** December 23, 2025

---

## ✅ Completed (Shipped)

### Core Platform
- [x] Magic link authentication (email-based, JWT tokens)
- [x] Multi-plan subscription system (Free/Starter/Growth/Pro/Agency/Tierless)
- [x] Lemon Squeezy payments integration
- [x] Lemon Squeezy webhooks (subscription lifecycle)
- [x] Customer portal integration

### Editor
- [x] Simple List mode (sections + items)
- [x] Advanced/Tier-Based mode (tiers, addons, sliders)
- [x] Drag & drop reordering
- [x] Feature reorder in tier inspector
- [x] Autosave functionality
- [x] Undo/Redo system
- [x] Read-only mode for team viewers
- [x] Preview modal (both modes)

### Dashboard
- [x] Calculator list (table/card views)
- [x] Favorites, filtering, sorting
- [x] Trash (soft delete with restore)
- [x] Rename, duplicate, delete
- [x] Move to team
- [x] Publish/unpublish controls

### Teams
- [x] Create/delete teams
- [x] Invite members (email)
- [x] Role system (owner/admin/editor/viewer)
- [x] Team calculator management
- [x] Team settings page

### Public Pages
- [x] Simple list renderer
- [x] Advanced/tier renderer
- [x] QR code generation
- [x] Share modal
- [x] Ratings system (1-5 stars)
- [x] View tracking (basic analytics)

### Analytics
- [x] Page views (7d/30d)
- [x] Geographic breakdown (country)
- [x] Devices/referrers
- [x] Ratings breakdown

### Templates
- [x] Template gallery page
- [x] "Use Template" functionality
- [x] Template categories

### AI Features
- [x] OCR menu scanning (OpenAI Vision)

### i18n
- [x] Multi-language support infrastructure
- [x] EN, SR, ES, FR, DE, RU translations (partial)

### SEO & Marketing
- [x] Branded 404/500 error pages
- [x] robots.txt, sitemap.xml
- [x] Open Graph / Twitter cards
- [x] JSON-LD structured data
- [x] Cookie consent (GDPR)
- [x] FAQ page with anchor links

### Security
- [x] Token hashing (SHA256)
- [x] JWT verification in middleware
- [x] Payment bypass protection
- [x] Rate limiting (Upstash Redis)

### Developer
- [x] Dev controls (plan override) in production
- [x] `requirePlanFeature` entitlement enforcement
- [x] Unit tests for calcsStore (22 tests)
- [x] E2E tests (Playwright)

---

## 🚧 In Progress / Partial

### Templates
- [ ] More template designs (only ~10 exist)
- [ ] "Save as Template" feature for users
- [ ] Template search/filter

### Custom Domains
- [ ] Full implementation (middleware routing exists, but no UI/SSL)
- [ ] Domain verification flow
- [ ] SSL certificate provisioning (Cloudflare/Caddy)

### Translations
- [ ] Complete all locale files (many keys still in English)
- [ ] Dashboard translation coverage

---

## 📋 Not Started (Future)

### High Priority - Phase 1 (Q1 2025)

#### ✅ Webhooks (Pro+ feature) - COMPLETED
- [x] User-configurable webhook endpoints
- [x] Trigger events (page_view, rating)
- [x] Webhook logs in dashboard
- [x] HMAC signature for security

#### Custom Domains (Pro+ feature)
- [ ] Domain settings UI in dashboard
- [ ] Domain verification (TXT/CNAME)
- [ ] SSL provisioning (Cloudflare for SaaS or custom Caddy)
- [ ] Multi-domain support per account

#### Template Improvements
- [ ] User-created templates ("Save as Template")
- [ ] Template sharing (public/private)
- [ ] More built-in templates (20+ target)

---

### Medium Priority - Phase 2 (Q2 2025)

#### Advanced Formulas (Pro+ feature)
- [ ] Variable-based pricing
- [ ] If/else logic in tiers
- [ ] Quantity calculations
- [ ] Multi-slider dependencies

#### Background Video (Growth+ feature)
- [ ] Video upload for page backgrounds
- [ ] YouTube/Vimeo embed support
- [ ] Mobile fallback to static image

#### Team Audit Logs (Agency feature)
- [ ] "Who changed what" tracking
- [ ] Team activity feed
- [ ] Export audit logs

#### Team Analytics (Agency feature)
- [ ] Aggregate stats across team pages
- [ ] Per-member contribution stats

---

### Lower Priority - Phase 3 (H2 2025)

#### AI Agent (Enterprise feature)
- [ ] Conversational menu builder
- [ ] AI pricing suggestions
- [ ] Auto-optimize layouts

#### Embed Improvements (Growth+ feature)
- [ ] Responsive iframe embed
- [ ] Style customization for embeds
- [ ] Widget mode (floating button)

#### Localization of User Content
- [ ] Multi-language menu support
- [ ] Per-item translations
- [ ] Language switcher on public page

#### API (Pro+ feature)
- [ ] REST API for CRUD operations
- [ ] API key management
- [ ] Rate limiting per key

---

## 🐛 Known Issues / Tech Debt

| Issue | Priority | Notes |
|-------|----------|-------|
| `domains.ts` uses mock DB | Medium | Need real domain lookup table |
| Orphaned images in Cloudinary | Low | No cleanup when pages deleted |
| Some i18n keys missing | Low | Fall back to English |
| No email templates | Low | Magic links are plain text |

---

## 💡 Feature Ideas (Backlog)

These are ideas that haven't been prioritized yet:

- Order/booking integration
- Print-friendly PDF export
- Menu scheduling (happy hour auto-switch)
- Instagram menu sync
- Table-side ordering (QR → order flow)
- White-label for resellers
- Multi-location management
- Inventory integration

---

## How to Use This File

1. **Check before starting work** - See what's already done
2. **Update when completing features** - Move from `[ ]` to `[x]`
3. **Add new ideas** - Put in "Feature Ideas" backlog first
4. **Prioritize quarterly** - Move items up to Phase 1/2/3

