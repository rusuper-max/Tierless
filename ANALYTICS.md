# 📊 Analytics System - Complete Guide

## ✅ Fixed Issues

### 1. **Storage: PostgreSQL ✓** 
Analytics events are now stored in **PostgreSQL** (`analytics_events` table), NOT local JSON files. This works on Vercel.

### 2. **Bounce Rate Calculation ✓**
Fixed to count **ALL** engagement types, not just "interaction" events.

---

## 📈 What Counts as an Interaction?

**Interactions** = Any action beyond just viewing the page:

- ✅ **Section Opens** - Expanding/collapsing sections
- ✅ **Search** - Typing in the search box
- ✅ **Quantity Changes** - Clicking +/- buttons
- ✅ **Scrolling** - Scrolling 25%+ down the page
- ✅ **Contact Copy** - Copying phone/email
- ✅ **Link Clicks** - Clicking external links
- ✅ **Checkouts** - Completing checkout flow
- ✅ **Ratings** - Rating the page

**Bounce Rate** = % of visitors who left WITHOUT any of the above actions.

---

## 🔍 Testing Analytics

### 1. **Visit Debug Endpoint**
```
/api/stats/debug
```
Shows:
- If PostgreSQL table exists
- Number of events stored
- Event types breakdown

### 2. **Visit Your Public Page**
Open browser console (F12 → Console) and visit `/p/your-slug`

You should see:
```
[Analytics] Tracking page view for: your-slug
[Analytics] Sending 1 events: ["page_view"]
[Analytics] Response: {ok: true, recorded: 1}
```

### 3. **Interact with the Page**
- Open a section → `[Analytics] Sending 1 events: ["section_open"]`
- Search → `[Analytics] Sending 1 events: ["search"]`
- Click +/- → `[Analytics] Sending 1 events: ["interaction"]`
- Scroll down → `[Analytics] Sending 1 events: ["scroll_depth"]`

### 4. **Check Stats Dashboard**
Visit `/dashboard/stats` and you should see:
- Total Views (incremented)
- Interactions (incremented for each action)
- Bounce rate (decreased if you interacted)

---

## 🗄️ Database Schema

```sql
CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  page_id TEXT NOT NULL,
  ts BIGINT NOT NULL,
  session_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  props JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_page_ts ON analytics_events(page_id, ts);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);
```

---

## 🚀 Event Types

| Event Type | Triggered When | Props |
|------------|---------------|-------|
| `page_view` | Page loads | `device`, `platform`, `referrer`, `utm_*` |
| `page_exit` | Page unload | `timeOnPage`, `maxScrollDepth`, `timeBucket` |
| `interaction` | +/- quantity | `interactionType` (e.g., "qty_plus") |
| `section_open` | Section expanded | `sectionId` |
| `search` | Search typed | `searchTerm` |
| `checkout_click` | Checkout button | `method` (whatsapp/email/custom) |
| `rating_set` | Star rating | `value` (1-5) |
| `scroll_depth` | Scroll milestone | `depth` (25/50/75/100) |
| `copy_contact` | Copy phone/email | `contactType` |
| `click_link` | External link | `linkUrl` |

---

## 📊 Metrics Explained

### Views
Total number of page loads (includes repeat visits from same user).

### Unique Visitors
Count of distinct `session_id` values. Resets when user closes browser.

### Interactions
Total count of ALL engagement events (not just "interaction" type).

### Engaged Sessions
Number of unique sessions that had at least ONE interaction.

### Bounce Rate
```
(Total Views - Engaged Sessions) / Total Views * 100
```

### Conversion Rate
```
Checkouts / Total Views * 100
```

### Interaction Rate
```
Total Interactions / Total Views * 100
```

---

## 🐛 Troubleshooting

### "No events showing in dashboard"

1. **Check browser console** - Are events being sent?
   - If NO → Check that PublicRenderer is calling `initAnalytics()` and `trackPageView()`
   - If YES but server not receiving → Check network tab for failed requests

2. **Check debug endpoint** - `/api/stats/debug`
   - If table doesn't exist → Database connection issue
   - If events = 0 → POST endpoint not saving

3. **Check server logs** - Look for:
   ```
   [stats] POST received X events
   [stats] Saved X events to analytics_events table
   ```

### "Bounce rate still 100% after interactions"

1. Verify events are being sent:
   ```
   [Analytics] Sending 1 events: ["section_open"]
   ```

2. Check that `engagementEvents` in `aggregateEvents()` includes all event types

3. Refresh the stats page (events batch every 1-2 seconds)

### "Images loading slowly on /examples"

Now optimized! Using Cloudinary transformations:
```
f_auto,q_auto:eco,c_limit,w_400
```

Plus `loading="lazy"` for deferred loading.

---

## 🔒 Privacy & GDPR

- No personal data stored (only anonymous session IDs)
- IP addresses are hashed (if implemented)
- Session IDs reset on browser close
- Client IDs use localStorage (can be cleared)
- Graceful fallback for private browsing mode

---

## 📝 Next Steps (V2)

- [ ] Section-level analytics (which sections get opened most?)
- [ ] Item-level analytics (which items get clicked most?)
- [ ] A/B testing (compare variants)
- [ ] Revenue tracking (if Stripe integration added)
- [ ] Export to CSV/PDF
- [ ] Real-time dashboard updates
- [ ] Anomaly detection & alerts

---

Built with ❤️ for Tierless

