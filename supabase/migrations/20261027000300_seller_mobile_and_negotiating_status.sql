-- Add a lead stage while preserving the existing pending/contacted/closed values.
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'negotiating';

-- Indian mobile values are stored privately in profiles.phone. This trigger
-- checks a number only when a listing is first published or transitions into
-- active, so legacy active listings and draft editing continue to work.
CREATE OR REPLACE FUNCTION public.require_seller_mobile_to_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  must_validate boolean := false;
  seller_phone text;
  compact_phone text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    must_validate := NEW.status = 'active';
  ELSE
    must_validate := NEW.status = 'active' AND OLD.status IS DISTINCT FROM NEW.status;
  END IF;

  IF NOT must_validate THEN RETURN NEW; END IF;

  SELECT p.phone INTO seller_phone
    FROM public.profiles AS p
   WHERE p.id = NEW.seller_id;

  compact_phone := regexp_replace(coalesce(seller_phone, ''), '[[:space:]()-]', '', 'g');
  IF NOT (
    compact_phone ~ '^[6-9][0-9]{9}$'
    OR compact_phone ~ '^0[6-9][0-9]{9}$'
    OR compact_phone ~ '^91[6-9][0-9]{9}$'
    OR compact_phone ~ '^[+]91[6-9][0-9]{9}$'
  ) THEN
    RAISE EXCEPTION 'A valid Indian mobile number is required before publishing a listing.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.require_seller_mobile_to_publish() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS car_listings_require_seller_mobile ON public.car_listings;
CREATE TRIGGER car_listings_require_seller_mobile
  BEFORE INSERT OR UPDATE OF status ON public.car_listings
  FOR EACH ROW EXECUTE FUNCTION public.require_seller_mobile_to_publish();
