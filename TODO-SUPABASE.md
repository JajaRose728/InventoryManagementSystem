# Supabase Image Storage Integration TODO

## ✅ 1. Create src/app/services/supabase.service.ts (client init)
## ✅ 2. Update src/environments/environment.ts & environment.prod.ts (config)
## ✅ 3. Replace src/app/services/upload.service.ts (Supabase upload logic)
## ✅ 4. User: Create 'items-bucket' in Supabase dashboard (public policy) 
## [ ] 5. Test upload in product form
## [ ] 6. Complete

**Instructions:** 
Storage → New Bucket → 'items-bucket' → **Public bucket: YES**
Dashboard auto-creates RLS policy. No SQL needed (table owner restriction).

**Status:** Code complete. Bucket setup pending.
