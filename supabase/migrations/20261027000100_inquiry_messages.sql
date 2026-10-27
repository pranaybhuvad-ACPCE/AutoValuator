-- Conversation replies are stored separately from the immutable opening inquiry.
CREATE TABLE public.inquiry_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(trim(message)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX inquiry_messages_conversation_created_idx
  ON public.inquiry_messages (inquiry_id, created_at, id);

ALTER TABLE public.inquiry_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inquiry_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.inquiry_messages TO authenticated;
GRANT INSERT (inquiry_id, message) ON public.inquiry_messages TO authenticated;

CREATE OR REPLACE FUNCTION public.prepare_inquiry_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  inquiry_buyer uuid;
  inquiry_seller uuid;
  listing_owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT i.buyer_id, i.seller_id, l.seller_id
    INTO inquiry_buyer, inquiry_seller, listing_owner
    FROM public.inquiries AS i
    JOIN public.car_listings AS l ON l.id = i.listing_id
   WHERE i.id = NEW.inquiry_id;

  IF inquiry_buyer IS NULL OR listing_owner IS NULL THEN
    RAISE EXCEPTION 'Inquiry or listing is unavailable';
  END IF;
  IF inquiry_seller IS DISTINCT FROM listing_owner THEN
    RAISE EXCEPTION 'Inquiry seller does not own the listing';
  END IF;
  IF auth.uid() NOT IN (inquiry_buyer, inquiry_seller) THEN
    RAISE EXCEPTION 'Only inquiry participants may send messages';
  END IF;

  NEW.sender_id := auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER inquiry_messages_derive_sender
  BEFORE INSERT ON public.inquiry_messages
  FOR EACH ROW EXECUTE FUNCTION public.prepare_inquiry_message();

CREATE POLICY inquiry_messages_read_participant
  ON public.inquiry_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.inquiries AS i
    WHERE i.id = inquiry_id
      AND (i.buyer_id = (SELECT auth.uid()) OR i.seller_id = (SELECT auth.uid()))
  ));

CREATE POLICY inquiry_messages_insert_participant
  ON public.inquiry_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.inquiries AS i
      JOIN public.car_listings AS l ON l.id = i.listing_id
      WHERE i.id = inquiry_id
        AND i.seller_id = l.seller_id
        AND (i.buyer_id = (SELECT auth.uid()) OR i.seller_id = (SELECT auth.uid()))
    )
  );

REVOKE ALL ON FUNCTION public.prepare_inquiry_message() FROM PUBLIC, anon, authenticated;
