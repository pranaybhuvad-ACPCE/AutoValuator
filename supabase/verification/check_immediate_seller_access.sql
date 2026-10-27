-- Read-only checks for the immediate Seller access migration.
-- Run in the Supabase SQL Editor after applying the prerequisite migrations.

-- 1. Required marketplace tables and expected columns.
WITH expected(table_name, expected_columns) AS (
  VALUES
    ('profiles', ARRAY['id', 'full_name', 'phone', 'account_mode', 'created_at', 'updated_at']::text[]),
    ('car_listings', ARRAY[
      'id', 'seller_id', 'brand', 'model', 'manufacturing_year', 'fuel_type',
      'transmission', 'engine_size', 'kilometers_driven', 'number_of_owners',
      'description', 'city', 'asking_price', 'estimated_price', 'image_urls',
      'status', 'created_at', 'updated_at'
    ]::text[]),
    ('favorites', ARRAY['id', 'buyer_id', 'listing_id', 'created_at']::text[]),
    ('inquiries', ARRAY[
      'id', 'listing_id', 'buyer_id', 'seller_id', 'message', 'status', 'created_at', 'updated_at'
    ]::text[]),
    ('seller_access_requests', ARRAY[
      'id', 'user_id', 'requested_mode', 'status', 'created_at', 'updated_at', 'reviewed_at'
    ]::text[])
)
SELECT
  e.table_name,
  to_regclass(format('public.%I', e.table_name)) IS NOT NULL AS table_exists,
  ARRAY(
    SELECT required.column_name
    FROM unnest(e.expected_columns) AS required(column_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM information_schema.columns AS c
      WHERE c.table_schema = 'public'
        AND c.table_name = e.table_name
        AND c.column_name = required.column_name
    )
    ORDER BY required.column_name
  ) AS missing_columns
FROM expected AS e
ORDER BY e.table_name;

-- 2. Relevant authentication, account-mode, and marketplace triggers.
WITH expected(schema_name, table_name, trigger_name) AS (
  VALUES
    ('auth', 'users', 'on_auth_user_created_marketplace_profile'),
    ('public', 'profiles', 'profiles_account_mode_immutable'),
    ('public', 'profiles', 'profiles_set_updated_at'),
    ('public', 'car_listings', 'car_listings_set_updated_at'),
    ('public', 'seller_access_requests', 'seller_access_request_prepare'),
    ('public', 'inquiries', 'inquiries_derive_participants')
)
SELECT
  e.schema_name,
  e.table_name,
  e.trigger_name,
  t.tgname IS NOT NULL AS trigger_exists,
  CASE t.tgenabled
    WHEN 'O' THEN 'origin'
    WHEN 'D' THEN 'disabled'
    WHEN 'R' THEN 'replica'
    WHEN 'A' THEN 'always'
    ELSE NULL
  END AS trigger_enabled_mode,
  CASE WHEN t.oid IS NOT NULL THEN pg_get_triggerdef(t.oid, true) END AS trigger_definition
FROM expected AS e
LEFT JOIN pg_namespace AS n ON n.nspname = e.schema_name
LEFT JOIN pg_class AS c ON c.relnamespace = n.oid AND c.relname = e.table_name
LEFT JOIN pg_trigger AS t ON t.tgrelid = c.oid AND t.tgname = e.trigger_name AND NOT t.tgisinternal
ORDER BY e.schema_name, e.table_name, e.trigger_name;

-- 3. Listing policies expected after immediate Seller access is installed.
WITH expected(table_name, policy_name) AS (
  VALUES
    ('car_listings', 'listings_read_active_or_owner'),
    ('car_listings', 'listings_insert_self'),
    ('car_listings', 'listings_update_self'),
    ('car_listings', 'listings_delete_self')
)
SELECT
  e.table_name,
  e.policy_name,
  p.policyname IS NOT NULL AS policy_exists,
  p.cmd AS policy_command,
  p.roles AS policy_roles,
  p.qual AS using_expression,
  p.with_check AS check_expression
FROM expected AS e
LEFT JOIN pg_policies AS p
  ON p.schemaname = 'public'
 AND p.tablename = e.table_name
 AND p.policyname = e.policy_name
ORDER BY e.policy_name;

-- 4. Row Level Security state for tables involved in seller access and listings.
WITH expected(table_name) AS (
  VALUES
    ('profiles'),
    ('car_listings'),
    ('favorites'),
    ('inquiries'),
    ('seller_access_requests')
)
SELECT
  e.table_name,
  c.oid IS NOT NULL AS table_exists,
  coalesce(c.relrowsecurity, false) AS rls_enabled,
  coalesce(c.relforcerowsecurity, false) AS rls_forced
FROM expected AS e
LEFT JOIN pg_namespace AS n ON n.nspname = 'public'
LEFT JOIN pg_class AS c ON c.relnamespace = n.oid AND c.relname = e.table_name
ORDER BY e.table_name;

-- 5. Account-mode immutability: trigger, rejecting function, and client grants.
SELECT
  EXISTS (
    SELECT 1
    FROM pg_trigger AS t
    JOIN pg_class AS c ON c.oid = t.tgrelid
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'profiles'
      AND t.tgname = 'profiles_account_mode_immutable'
      AND NOT t.tgisinternal
      AND t.tgenabled <> 'D'
  ) AS immutable_trigger_installed_and_enabled,
  EXISTS (
    SELECT 1
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'prevent_profile_account_mode_change'
      AND pg_get_functiondef(p.oid) ILIKE '%account type cannot be changed%'
  ) AS immutable_function_rejects_mode_changes,
  CASE WHEN to_regclass('public.profiles') IS NOT NULL
    THEN has_column_privilege('authenticated', 'public.profiles', 'account_mode', 'UPDATE')
  END AS authenticated_can_update_account_mode,
  CASE WHEN to_regclass('public.profiles') IS NOT NULL
    THEN has_column_privilege('anon', 'public.profiles', 'account_mode', 'UPDATE')
  END AS anon_can_update_account_mode;

-- 6. Signup trigger function should use the selected mode and Buyer fallback.
-- This inspects the function definition only; it does not read user records.
SELECT
  EXISTS (
    SELECT 1
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'handle_new_auth_user'
      AND pg_get_functiondef(p.oid) ILIKE '%signup_account_type%'
      AND pg_get_functiondef(p.oid) ILIKE '%buyer%'
      AND pg_get_functiondef(p.oid) ILIKE '%seller%'
  ) AS signup_trigger_uses_selected_mode_and_buyer_fallback;
