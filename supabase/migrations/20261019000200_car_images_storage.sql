-- The car-images bucket is public so images can render on anonymous active-listing pages.
-- Public means anyone with an object URL can view/download that image. Do not store private documents here.
-- Conflict handling deliberately preserves an existing bucket's current public/private setting.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('car-images', 'car-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS car_images_public_read ON storage.objects;
CREATE POLICY car_images_public_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'car-images');

DROP POLICY IF EXISTS car_images_upload_own_folder ON storage.objects;
CREATE POLICY car_images_upload_own_folder ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'car-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS car_images_update_own_folder ON storage.objects;
CREATE POLICY car_images_update_own_folder ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'car-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'car-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS car_images_delete_own_folder ON storage.objects;
CREATE POLICY car_images_delete_own_folder ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'car-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
