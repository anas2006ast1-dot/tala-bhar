# Customer menu fallback

`src/data/menu-fallback.json` is the checked-in customer catalog. When it passes
the completeness checks in `src/lib/localMenu.js`, `/menu` reads the catalog
directly and does not query Supabase or subscribe to Realtime. The current file
contains the verified 50 items, 10 categories, and settings. `displayImages` is
`false`, so dish images are hidden while their original Supabase `image_url`
values remain in the catalog.

## Refresh the published catalog after admin edits

1. Wait for Supabase to recover, sign in to the existing Admin page, and wait
   until the dashboard has verified fresh data.
2. Choose **تنزيل نسخة المنيو** in the sidebar. This downloads the latest
   categories, items, prices, availability, image URLs, and settings as
   `menu-fallback.json`. The button is disabled while the admin data is stale
   or unavailable.
3. Replace `src/data/menu-fallback.json` in this repository with the downloaded
   file. Review the diff, run `npm test` and `npm run build`, and push the
   reviewed branch to create a Vercel Preview.
4. After approval, publish through the normal production deployment flow. The
   `/menu` path and existing QR URL stay unchanged.

The export keeps `displayImages: false` and preserves each `image_url`; it does
not make customer image requests to Supabase. To show photos later without
Storage egress, copy the corresponding files into
`public/menu-images/items/`, set each item's `image_url` to its local
`/menu-images/items/<filename>` path, and keep the original Supabase URL in a
`source_image_url` field. Set `displayImages: true` only after all referenced
local files are present. The fallback validator rejects remote image URLs when
image display is enabled.
