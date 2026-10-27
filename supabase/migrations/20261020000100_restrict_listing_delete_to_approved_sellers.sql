-- Keep listing deletion aligned with the insert/update policies: only the owner
-- with approved seller or both account mode may manage a listing.
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
