-- Account type is selected only when the Auth user is created. Seller approval
-- remains a separate, administrator-controlled state in seller_access_requests.

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

  IF selected_mode = 'seller' THEN
    INSERT INTO public.seller_access_requests (user_id, requested_mode, status)
    VALUES (NEW.id, 'seller', 'pending')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.prevent_profile_account_mode_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.account_mode IS DISTINCT FROM OLD.account_mode THEN
    RAISE EXCEPTION 'Account type cannot be changed after registration'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_account_mode_immutable ON public.profiles;
CREATE TRIGGER profiles_account_mode_immutable
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_account_mode_change();

REVOKE ALL ON FUNCTION public.prevent_profile_account_mode_change() FROM PUBLIC, anon, authenticated;

-- Preserve the client insert behavior while allowing trusted migration/admin
-- sessions to seed explicit approved rows. API sessions still derive their
-- identity from auth.uid() and can only create pending requests.
CREATE OR REPLACE FUNCTION public.prepare_seller_access_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL AND session_user IN ('postgres', 'supabase_admin', 'supabase_auth_admin') THEN
    IF NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'A user is required for an administrative approval record';
    END IF;
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  NEW.user_id := auth.uid();
  NEW.status := 'pending';
  NEW.reviewed_at := NULL;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prepare_seller_access_request() FROM PUBLIC, anon, authenticated;
REVOKE UPDATE, DELETE ON public.seller_access_requests FROM PUBLIC, anon, authenticated;

-- Existing Seller/Both account modes represent the prior trusted approval
-- process. Seed an approved request only when no record exists; never rewrite
-- an existing pending, approved, or rejected decision.
INSERT INTO public.seller_access_requests (user_id, requested_mode, status, reviewed_at)
SELECT p.id, p.account_mode, 'approved', now()
FROM public.profiles AS p
WHERE p.account_mode IN ('seller', 'both')
  AND NOT EXISTS (
    SELECT 1
    FROM public.seller_access_requests AS existing_request
    WHERE existing_request.user_id = p.id
  )
ON CONFLICT DO NOTHING;

-- Only Seller accounts may create a single pending request for their own
-- signup-selected Seller type. Buyers cannot use the table to switch roles.
DROP POLICY IF EXISTS seller_access_requests_insert_self ON public.seller_access_requests;
CREATE POLICY seller_access_requests_insert_self ON public.seller_access_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'pending'
    AND requested_mode = 'seller'
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = (SELECT auth.uid())
        AND p.account_mode = 'seller'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.seller_access_requests AS existing_request
      WHERE existing_request.user_id = (SELECT auth.uid())
    )
  );

-- This helper only checks the caller's own account, and is used by the listing
-- RLS policies. A Seller type alone never grants listing permissions.
CREATE OR REPLACE FUNCTION public.has_approved_seller_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    JOIN public.seller_access_requests AS access_request
      ON access_request.user_id = p.id
     AND access_request.status = 'approved'
    WHERE p.id = (SELECT auth.uid())
      AND p.account_mode IN ('seller', 'both')
  );
$$;

REVOKE ALL ON FUNCTION public.has_approved_seller_access() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_approved_seller_access() TO authenticated;

DROP POLICY IF EXISTS listings_insert_self ON public.car_listings;
CREATE POLICY listings_insert_self ON public.car_listings
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = (SELECT auth.uid())
    AND (SELECT public.has_approved_seller_access())
  );

DROP POLICY IF EXISTS listings_update_self ON public.car_listings;
CREATE POLICY listings_update_self ON public.car_listings
  FOR UPDATE TO authenticated
  USING (
    seller_id = (SELECT auth.uid())
    AND (SELECT public.has_approved_seller_access())
  )
  WITH CHECK (
    seller_id = (SELECT auth.uid())
    AND (SELECT public.has_approved_seller_access())
  );

DROP POLICY IF EXISTS listings_delete_self ON public.car_listings;
CREATE POLICY listings_delete_self ON public.car_listings
  FOR DELETE TO authenticated
  USING (
    seller_id = (SELECT auth.uid())
    AND (SELECT public.has_approved_seller_access())
  );
