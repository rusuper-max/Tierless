# Calculator SaaS - Architecture Documentation

Ovaj fajl dokumentuje arhitekturu projekta, tehnologije i konvencije. **Ne menjati bez razloga.**

---

## Tech Stack

| Kategorija | Tehnologija | Verzija | Svrha |
|-----------|-------------|---------|-------|
| Framework | Next.js | 16.x | App Router, SSR, API Routes |
| Frontend | React | 19.x | UI komponente |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| State | Zustand | 5.x | Global state management |
| Database | PostgreSQL | - | Via `pg` driver (Neon) |
| Auth | iron-session + jose | - | Magic link auth, JWT tokens |
| Email | Resend | - | Transactional emails |
| Payments | Lemon Squeezy | - | Subscriptions, webhooks |
| File Upload | Vercel Blob | - | Image storage |
| AI/OCR | OpenAI | - | Menu OCR scanning |
| Rate Limiting | Upstash Redis | - | API rate limiting |
| Animation | Framer Motion | - | UI animations |
| 3D | Three.js + R3F | - | Landing page effects |
| Icons | Lucide React | - | Icon library |
| Drag & Drop | @dnd-kit | - | Sortable lists |
| Validation | Zod | 4.x | Schema validation |
| Testing | Vitest + Playwright | - | Unit & E2E tests |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Public pages (landing, faq, terms)
│   ├── (pricing)/          # Pricing/start page
│   ├── dashboard/          # User dashboard
│   │   ├── t/[teamId]/     # Team-specific pages
│   │   ├── settings/       # User settings
│   │   ├── trash/          # Deleted calculators
│   │   └── ...
│   ├── editor/[id]/        # Calculator editor
│   │   ├── panels/         # Editor panels
│   │   │   ├── SimpleListPanel.tsx      # Simple list editor
│   │   │   └── advanced/                # Tier-based editor
│   │   │       ├── AdvancedPanelInner.tsx
│   │   │       ├── AdvancedNodeCard.tsx
│   │   │       ├── AdvancedNodeInspector.tsx
│   │   │       ├── AdvancedSettingsPanel.tsx
│   │   │       └── types.ts
│   │   ├── components/     # Editor-specific components
│   │   └── EditorShell.tsx # Main editor wrapper
│   ├── api/                # API Routes
│   │   ├── auth/           # Auth endpoints
│   │   ├── calculators/    # CRUD for calculators
│   │   ├── teams/          # Team management
│   │   ├── webhooks/       # Lemon Squeezy webhooks
│   │   └── ...
│   └── _providers/         # Client providers
├── components/             # Shared components
│   ├── ui/                 # Base UI (Button, etc.)
│   ├── dashboard/          # Dashboard components
│   ├── landing/            # Landing page sections
│   ├── PublicRenderer.tsx  # Simple list public view
│   └── AdvancedPublicRenderer.tsx  # Tier-based public view
├── hooks/                  # Custom React hooks
│   ├── useEditorStore.ts   # Editor state (Zustand)
│   ├── useAccount.ts       # User account data
│   ├── useEntitlement.ts   # Plan/feature checks
│   └── ...
├── lib/                    # Core utilities
│   ├── db.ts               # Database queries
│   ├── auth.ts             # Auth helpers
│   ├── calcsStore.ts       # Calculator CRUD
│   ├── permissions.ts      # Team permissions
│   ├── entitlements.ts     # Plan features
│   ├── rateLimit.ts        # Rate limiting
│   └── ...
├── types/                  # TypeScript types
│   ├── calculator.ts       # Calculator types
│   └── editor.ts           # Editor types
└── middleware.ts           # Auth middleware
```

---

## Key Patterns

### 1. Editor Modes

Editor ima dva moda:
- **Simple List** (`uiMode: "simple"`) - Lista stavki sa sekcijama
- **Advanced/Tier-Based** (`uiMode: "advanced"`) - Tier/Addon/Item/Slider nodes

```tsx
// EditorShell.tsx
const [uiMode, setUiMode] = useState<"simple" | "advanced">("simple");

{uiMode === "simple" ? (
  <SimpleListPanel readOnly={readOnly} />
) : (
  <AdvancedPanel readOnly={readOnly} />
)}
```

### 2. State Management (Zustand)

Editor state koristi Zustand store sa undo/redo:

```tsx
// hooks/useEditorStore.ts
export const useEditorStore = create<EditorState>()((set, get) => ({
  calc: null,
  past: [],
  future: [],
  setCalc: (calc) => { /* with history */ },
  undo: () => { /* pop from past */ },
  redo: () => { /* pop from future */ },
}));
```

### 3. Team Permissions

Korisnici mogu biti:
- **owner** - Puna kontrola
- **editor** - Može editovati kalkulatore
- **viewer** - Read-only pristup

```tsx
// lib/permissions.ts
export async function getTeamRole(userId: string, teamId: number): Promise<Role | null>
export async function requireTeamPermission(userId: string, teamId: number, minRole: Role)
```

### 4. Read-Only Mode

Viewer uloga dobija `readOnly` prop kroz celu hijerarhiju:

```
EditorShell (readOnly from team role)
  └─ EditorNavBar (readOnly → disables save, undo, redo)
  └─ SimpleListPanel / AdvancedPanel (readOnly)
       └─ AdvancedPanelInner (readOnly)
            └─ AdvancedNodeCard (readOnly → disables slider)
            └─ AdvancedNodeInspector (readOnly → disables all inputs)
```

### 5. Public Rendering

Dva renderera za javni prikaz:
- `PublicRenderer.tsx` - Za simple list mode
- `AdvancedPublicRenderer.tsx` - Za tier-based mode

Preview modal u editoru koristi `uiMode` za izbor renderera.

---

## Database Schema

### Core Tables

```sql
-- Users
user_profiles (user_id, email, business_name, phone, ...)

-- Calculators
calculators (id, slug, user_id, team_id, name, data, created_at, ...)

-- Teams
teams (id, name, owner_id, created_at)
team_members (team_id, user_id, role, joined_at)
team_invites (id, team_id, email, code, role, created_at, expires_at)

-- Auth
auth_tokens (token, email, expires_at)

-- Subscriptions (Lemon Squeezy)
subscriptions (user_id, subscription_id, status, plan_id, ...)
```

---

## API Conventions

### Route Structure

```
/api/calculators          - GET (list), POST (create)
/api/calculators/[slug]   - GET, PUT, DELETE
/api/calculators/[slug]/publish - POST
/api/teams/[teamId]       - GET, PUT, DELETE
/api/teams/[teamId]/members - GET, POST, DELETE
```

### Response Format

```typescript
// Success
{ ok: true, data: {...} }

// Error
{ error: "Error message" }
```

### Auth Check

```typescript
// api/route.ts
const session = await getIronSession<Session>(cookies(), sessionOptions);
if (!session.userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## Component Conventions

### UI Components

Base UI komponente su u `src/components/ui/`:
- `Button.tsx` - Varijante: default, secondary, ghost, danger

### Styling

- Koristimo CSS variables za theming (`var(--text)`, `var(--muted)`, etc.)
- Dark mode: `next-themes` provider
- Accent color: Cyan (`#06b6d4`) za konzistentnost

### Icons

Sve ikone dolaze iz `lucide-react`:
```tsx
import { Layers, ToggleRight, Calculator, SlidersHorizontal } from "lucide-react";
```

---

## Testing

### Unit Tests (Vitest)
```bash
npm run test        # Watch mode
npm run test:run    # Single run
```

### E2E Tests (Playwright)
```bash
npm run test:e2e         # Headless
npm run test:e2e:headed  # With browser
npm run test:e2e:ui      # Interactive UI
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgres://...

# Auth
SESSION_SECRET=...
JWT_SECRET=...

# Email (Resend)
RESEND_API_KEY=...

# Payments (Lemon Squeezy)
LEMON_API_KEY=...
LEMON_STORE_ID=...
LEMON_WEBHOOK_SECRET=...

# Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=...

# AI (OpenAI)
OPENAI_API_KEY=...

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Deployment

- **Platform:** Vercel
- **Database:** Neon PostgreSQL
- **Build command:** `npm run vercel-build` (runs migrations first)

---

## Common Tasks

### Dodavanje novog API endpoint-a
1. Kreiraj `src/app/api/[endpoint]/route.ts`
2. Dodaj auth check sa `getIronSession`
3. Vrati JSON response sa `NextResponse.json()`

### Dodavanje nove editor funkcionalnosti
1. Update `useEditorStore.ts` za novi state
2. Update `SimpleListPanel.tsx` ili `advanced/*.tsx`
3. Update `PublicRenderer.tsx` / `AdvancedPublicRenderer.tsx` za public view

### Dodavanje nove team permission
1. Update `lib/permissions.ts`
2. Update relevantne API routes
3. Update UI komponente sa `readOnly` prop

---

## Related Documentation

- [CLAUDE_TASK_LOG.md](./CLAUDE_TASK_LOG.md) - Evidencija svih izmena
- [ANALYTICS.md](./ANALYTICS.md) - Analytics dokumentacija
- [LEMON_SQUEEZY_SETUP.md](./LEMON_SQUEEZY_SETUP.md) - Payment setup
