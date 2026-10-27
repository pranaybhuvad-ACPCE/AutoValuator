-- Users may request seller access but cannot approve requests or change profiles.account_mode.
DO $$ BEGIN
  CREATE TYPE public.seller_access_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.seller_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_mode public.account_mode NOT NULL CHECK (requested_mode IN ('seller', 'both')),
  status public.seller_access_request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS seller_access_requests_user_created_idx
  ON public.seller_access_requests (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS seller_access_requests_one_pending_per_user_idx
  ON public.seller_access_requests (user_id) WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.prepare_seller_access_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  NEW.user_id := auth.uid();
  NEW.status := 'pending';
  NEW.reviewed_at := NULL;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_access_request_prepare ON public.seller_access_requests;
CREATE TRIGGER seller_access_request_prepare
  BEFORE INSERT ON public.seller_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.prepare_seller_access_request();

DROP TRIGGER IF EXISTS seller_access_requests_set_updated_at ON public.seller_access_requests;
CREATE TRIGGER seller_access_requests_set_updated_at
  BEFORE UPDATE ON public.seller_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.seller_access_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seller_access_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.seller_access_requests TO authenticated;
GRANT INSERT (requested_mode) ON public.seller_access_requests TO authenticated;

DROP POLICY IF EXISTS seller_access_requests_select_self ON public.seller_access_requests;
CREATE POLICY seller_access_requests_select_self ON public.seller_access_requests
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS seller_access_requests_insert_self ON public.seller_access_requests;
CREATE POLICY seller_access_requests_insert_self ON public.seller_access_requests
  FOR INSERT TO authenticated WITH CHECK (
    user_id = (SELECT auth.uid()) AND status = 'pending'
  );

REVOKE ALL ON FUNCTION public.prepare_seller_access_request() FROM PUBLIC, anon, authenticated;
