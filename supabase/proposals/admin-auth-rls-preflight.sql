-- READ-ONLY REVIEW QUERY. No changes are made by this file.
-- Run only after approval, save the results, and inspect unexpected policies
-- before applying admin-auth-rls.sql.

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in ('categories', 'menu_items', 'settings'))
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

select id, name, public
from storage.buckets
where id = 'menu-images';
