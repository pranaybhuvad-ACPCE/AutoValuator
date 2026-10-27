-- Marketplace schema foundation. No existing marketplace schema was found.

DO $$ BEGIN CREATE TYPE public.account_mode AS ENUM ('buyer', 'seller', 'both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.car_listing_status AS ENUM ('draft', 'active', 'under_offer', 'sold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.inquiry_status AS ENUM ('pending', 'contacted', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '' CHECK (char_length(full_name) <= 120),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 32),
  account_mode public.account_mode NOT NULL DEFAULT 'buyer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.car_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  brand text NOT NULL CHECK (char_length(trim(brand)) BETWEEN 1 AND 80),
  model text NOT NULL CHECK (char_length(trim(model)) BETWEEN 1 AND 100),
  manufacturing_year smallint NOT NULL CHECK (manufacturing_year BETWEEN 1950 AND 2100),
  fuel_type text NOT NULL CHECK (char_length(trim(fuel_type)) BETWEEN 1 AND 40),
  transmission text NOT NULL CHECK (char_length(trim(transmission)) BETWEEN 1 AND 40),
  engine_size numeric(5,2) CHECK (engine_size IS NULL OR engine_size > 0),
  kilometers_driven integer NOT NULL CHECK (kilometers_driven BETWEEN 0 AND 2000000),
  number_of_owners smallint NOT NULL DEFAULT 1 CHECK (number_of_owners BETWEEN 1 AND 10),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 10000),
  city text NOT NULL CHECK (char_length(trim(city)) BETWEEN 1 AND 100),
  asking_price numeric(12,2) NOT NULL CHECK (asking_price > 0),
  estimated_price numeric(12,2) CHECK (estimated_price IS NULL OR estimated_price > 0),
  image_urls text[] NOT NULL DEFAULT '{}',
  status public.car_listing_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT favorites_buyer_listing_key UNIQUE (buyer_id, listing_id)
);

CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  message text NOT NULL CHECK (char_length(trim(message)) BETWEEN 1 AND 5000),
  status public.inquiry_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS car_listings_active_created_idx ON public.car_listings (created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS car_listings_seller_status_idx ON public.car_listings (seller_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS car_listings_search_idx ON public.car_listings (brand, model, city, manufacturing_year, asking_price);
CREATE INDEX IF NOT EXISTS favorites_listing_id_idx ON public.favorites (listing_id);
CREATE INDEX IF NOT EXISTS inquiries_buyer_created_idx ON public.inquiries (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_seller_status_idx ON public.inquiries (seller_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_listing_id_idx ON public.inquiries (listing_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS car_listings_set_updated_at ON public.car_listings;
CREATE TRIGGER car_listings_set_updated_at BEFORE UPDATE ON public.car_listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS inquiries_set_updated_at ON public.inquiries;
CREATE TRIGGER inquiries_set_updated_at BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger-created profiles always start as buyers; client metadata cannot choose a role.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, account_mode)
  VALUES (NEW.id, coalesce(nullif(left(trim(NEW.raw_user_meta_data ->> 'full_name'), 120), ''), ''), 'buyer'::public.account_mode)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created_marketplace_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_marketplace_profile AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
-- Also create default profiles for users who registered before this migration.
INSERT INTO public.profiles (id, full_name, account_mode)
SELECT u.id, coalesce(nullif(left(trim(u.raw_user_meta_data ->> 'full_name'), 120), ''), ''), 'buyer'::public.account_mode
FROM auth.users AS u
ON CONFLICT (id) DO NOTHING;

-- Derive participant IDs from auth.uid() and the active listing, never request input.
CREATE OR REPLACE FUNCTION public.prepare_marketplace_inquiry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, auth AS $$
DECLARE listing_seller uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT l.seller_id INTO listing_seller FROM public.car_listings AS l
    WHERE l.id = NEW.listing_id AND l.status = 'active';
  IF listing_seller IS NULL THEN RAISE EXCEPTION 'Listing is unavailable'; END IF;
  IF listing_seller = auth.uid() THEN RAISE EXCEPTION 'Cannot inquire about own listing'; END IF;
  NEW.buyer_id := auth.uid();
  NEW.seller_id := listing_seller;
  NEW.status := 'pending';
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS inquiries_derive_participants ON public.inquiries;
CREATE TRIGGER inquiries_derive_participants BEFORE INSERT ON public.inquiries
FOR EACH ROW EXECUTE FUNCTION public.prepare_marketplace_inquiry();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Only contact fields are writable via the client; account_mode has no client grant.
REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone) ON public.profiles TO authenticated;
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
CREATE POLICY profiles_select_self ON public.profiles FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

REVOKE ALL ON public.car_listings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.car_listings TO anon, authenticated;
GRANT INSERT (seller_id, brand, model, manufacturing_year, fuel_type, transmission, engine_size,
  kilometers_driven, number_of_owners, description, city, asking_price, estimated_price, image_urls, status)
  ON public.car_listings TO authenticated;
GRANT UPDATE (brand, model, manufacturing_year, fuel_type, transmission, engine_size, kilometers_driven,
  number_of_owners, description, city, asking_price, estimated_price, image_urls, status)
  ON public.car_listings TO authenticated;
GRANT DELETE ON public.car_listings TO authenticated;
DROP POLICY IF EXISTS listings_read_active_or_owner ON public.car_listings;
CREATE POLICY listings_read_active_or_owner ON public.car_listings FOR SELECT TO anon, authenticated
  USING (status = 'active' OR seller_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS listings_insert_self ON public.car_listings;
CREATE POLICY listings_insert_self ON public.car_listings FOR INSERT TO authenticated
  WITH CHECK (seller_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.account_mode IN ('seller', 'both')));
DROP POLICY IF EXISTS listings_update_self ON public.car_listings;
CREATE POLICY listings_update_self ON public.car_listings FOR UPDATE TO authenticated
  USING (seller_id = (SELECT auth.uid())) WITH CHECK (seller_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.account_mode IN ('seller', 'both')));
DROP POLICY IF EXISTS listings_delete_self ON public.car_listings;
CREATE POLICY listings_delete_self ON public.car_listings FOR DELETE TO authenticated
  USING (seller_id = (SELECT auth.uid()));

REVOKE ALL ON public.favorites FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
DROP POLICY IF EXISTS favorites_select_self ON public.favorites;
CREATE POLICY favorites_select_self ON public.favorites FOR SELECT TO authenticated USING (buyer_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS favorites_insert_self ON public.favorites;
CREATE POLICY favorites_insert_self ON public.favorites FOR INSERT TO authenticated WITH CHECK (
  buyer_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.account_mode IN ('buyer', 'both'))
  AND EXISTS (SELECT 1 FROM public.car_listings l WHERE l.id = listing_id AND l.status = 'active'));
DROP POLICY IF EXISTS favorites_delete_self ON public.favorites;
CREATE POLICY favorites_delete_self ON public.favorites FOR DELETE TO authenticated USING (buyer_id = (SELECT auth.uid()));

REVOKE ALL ON public.inquiries FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.inquiries TO authenticated;
GRANT INSERT (listing_id, message) ON public.inquiries TO authenticated;
GRANT UPDATE (status) ON public.inquiries TO authenticated;
DROP POLICY IF EXISTS inquiries_read_participant ON public.inquiries;
CREATE POLICY inquiries_read_participant ON public.inquiries FOR SELECT TO authenticated
  USING (buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS inquiries_create_as_buyer ON public.inquiries;
CREATE POLICY inquiries_create_as_buyer ON public.inquiries FOR INSERT TO authenticated WITH CHECK (
  buyer_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.account_mode IN ('buyer', 'both')));
DROP POLICY IF EXISTS inquiries_update_as_seller ON public.inquiries;
CREATE POLICY inquiries_update_as_seller ON public.inquiries FOR UPDATE TO authenticated
  USING (seller_id = (SELECT auth.uid())) WITH CHECK (seller_id = (SELECT auth.uid()));

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepare_marketplace_inquiry() FROM PUBLIC, anon, authenticated;
