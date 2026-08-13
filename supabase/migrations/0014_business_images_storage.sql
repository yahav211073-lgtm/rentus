-- Storage bucket for business cover images, uploaded at registration/creation time.
-- Public read (images are shown on public business cards/pages), authenticated write
-- scoped to the uploader's own folder (auth.uid()/filename), matching the existing
-- "owner writes their own row" RLS pattern used on businesses/reviews.

insert into storage.buckets (id, name, public)
values ('business-images', 'business-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read of business images" on storage.objects;
create policy "Public read of business images"
on storage.objects for select
to public
using (bucket_id = 'business-images');

drop policy if exists "Authenticated users upload to their own folder" on storage.objects;
create policy "Authenticated users upload to their own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'business-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Service role manages all business images" on storage.objects;
create policy "Service role manages all business images"
on storage.objects for all
to service_role
using (bucket_id = 'business-images')
with check (bucket_id = 'business-images');
