-- Sellers explicitly opt in to a public display name. Private profile fields
-- remain protected by the existing profiles RLS policy.
ALTER TABLE public.profiles
  ADD COLUMN public_display_name text
  CHECK (public_display_name IS NULL OR char_length(trim(public_display_name)) BETWEEN 1 AND 80);

GRANT UPDATE (public_display_name) ON public.profiles TO authenticated;

-- Expose only the opt-in display name and only when attached to an active
-- public listing. No profile IDs, phone numbers, email addresses, or other
-- profile columns are returned by this function.
CREATE OR REPLACE FUNCTION public.get_public_listing_seller_names(listing_ids uuid[])
RETURNS TABLE (listing_id uuid, public_display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT l.id, p.public_display_name
    FROM public.car_listings AS l
    JOIN public.profiles AS p ON p.id = l.seller_id
   WHERE l.status = 'active'
     AND l.id = ANY (coalesce(listing_ids, ARRAY[]::uuid[]))
     AND nullif(trim(p.public_display_name), '') IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_public_listing_seller_names(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_listing_seller_names(uuid[]) TO anon, authenticated;
