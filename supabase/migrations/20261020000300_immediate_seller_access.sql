-- Signup selection is the account type. Only new Auth users are assigned from
-- signup metadata; existing profile rows are never rewritten.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  selected_mode public.account_mode;
BEGIN
  selected_mode := CASE NEW.raw_user_meta_data ->> 'signup_account_type'
    WHEN 'seller' THEN 'seller'::public.account_mode
    ELSE 'buyer'::public.account_mode
  END;

  INSERT INTO public.profiles (id, full_name, account_mode)
  VALUES (
    NEW.id,
    coalesce(nullif(left(trim(NEW.raw_user_meta_data ->> 'full_name'), 120), ''), ''),
    selected_mode
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;

-- Seller access requests are retained as historical data, but no longer form
-- part of registration or seller authorization.
DROP POLICY IF EXISTS seller_access_requests_insert_self ON public.seller_access_requests;
REVOKE INSERT ON public.seller_access_requests FROM PUBLIC, anon, authenticated;
REVOKE INSERT (requested_mode) ON public.seller_access_requests FROM PUBLIC, anon, authenticated;

-- Listing access depends only on the immutable account type and ownership.
-- Both remains supported for existing accounts; new registrations choose only
-- Buyer or Seller. Keep the read policy and all unrelated marketplace policies.
DROP POLICY IF EXISTS listings_insert_self ON public.car_listings;
CREATE POLICY listings_insert_self ON public.car_listings
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = (SELECT auth.uid())
        AND p.account_mode IN ('seller', 'both')
    )
  );

DROP POLICY IF EXISTS listings_update_self ON public.car_listings;
CREATE POLICY listings_update_self ON public.car_listings
  FOR UPDATE TO authenticated
  USING (
    seller_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = (SELECT auth.uid())
        AND p.account_mode IN ('seller', 'both')
    )
  )
  WITH CHECK (
    seller_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = (SELECT auth.uid())
        AND p.account_mode IN ('seller', 'both')
    )
  );

DROP POLICY IF EXISTS listings_delete_self ON public.car_listings;
CREATE POLICY listings_delete_self ON public.car_listings
  FOR DELETE TO authenticated
  USING (
    seller_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = (SELECT auth.uid())
        AND p.account_mode IN ('seller', 'both')
    )
  );
