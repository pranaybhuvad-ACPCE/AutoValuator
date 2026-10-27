-- Read-only verification for immediate Seller access.
-- This file contains SELECT statements only. It does not apply migrations,
-- create objects, update data, or change permissions.
-- Run it in the SQL Editor for the intended Supabase project.

-- 1. Listing policies.
-- Healthy result: all three policies exist for authenticated users, each keeps
-- the seller_id = auth.uid() ownership condition, and INSERT/UPDATE/DELETE do
-- not call has_approved_seller_access(). Seller/Both account-mode checks
-- should appear in the write policy expressions.
WITH expected(policy_name, expected_command) AS (
  VALUES
    ('listings_insert_self', 'INSERT'),
    ('listings_update_self', 'UPDATE'),
    ('listings_delete_self', 'DELETE')
)
SELECT
  e.policy_name,
  e.expected_command,
  p.policyname IS NOT NULL AS policy_exists,
  p.cmd AS actual_command,
  p.roles AS applies_to_roles,
  p.qual AS using_expression,
  p.with_check AS check_expression,
  coalesce(
    concat_ws(' ', p.qual, p.with_check) ILIKE '%has_approved_seller_access%',
    false
  ) AS calls_approval_helper,
  coalesce(
    concat_ws(' ', p.qual, p.with_check) ILIKE '%seller_id%'
      AND concat_ws(' ', p.qual, p.with_check) ILIKE '%auth.uid%',
    false
  ) AS contains_ownership_check,
  coalesce(
    concat_ws(' ', p.qual, p.with_check) ILIKE '%account_mode%'
      AND concat_ws(' ', p.qual, p.with_check) ILIKE '%seller%',
    false
  ) AS contains_seller_mode_check
FROM expected AS e
LEFT JOIN pg_policies AS p
  ON p.schemaname = 'public'
 AND p.tablename = 'car_listings'
 AND p.policyname = e.policy_name
ORDER BY e.expected_command;

-- 2. New-user profile trigger function.
-- Healthy result after immediate-access migration: function_exists and
-- assigns_seller_from_signup_metadata are true; creates_seller_access_request
-- is false. This checks the function definition, not whether the trigger is
-- attached; attachment is checked in query 3.
SELECT
  p.oid IS NOT NULL AS function_exists,
  CASE WHEN p.oid IS NOT NULL THEN
    pg_get_functiondef(p.oid) ILIKE '%signup_account_type%'
      AND pg_get_functiondef(p.oid) ILIKE '%seller%'
  ELSE false END AS assigns_seller_from_signup_metadata,
  CASE WHEN p.oid IS NOT NULL THEN
    regexp_replace(pg_get_functiondef(p.oid), '\s+', ' ', 'g')
      ~* 'insert\s+into\s+(public\.)?seller_access_requests'
  ELSE false END AS creates_seller_access_request
FROM (VALUES (1)) AS seed(dummy)
LEFT JOIN pg_namespace AS n ON n.nspname = 'public'
LEFT JOIN pg_proc AS p ON p.pronamespace = n.oid AND p.proname = 'handle_new_auth_user';

-- 3. Auth trigger attachment and immutable account-mode protection.
-- Healthy result: the Auth user trigger exists and is enabled; the immutable
-- profile trigger exists and is enabled; the function exists and its body
-- compares OLD/NEW account_mode and raises an exception when it changes.
WITH expected(schema_name, table_name, trigger_name) AS (
  VALUES
    ('auth', 'users', 'on_auth_user_created_marketplace_profile'),
    ('public', 'profiles', 'profiles_account_mode_immutable')
)
SELECT
  e.schema_name,
  e.table_name,
  e.trigger_name,
  t.tgname IS NOT NULL AS trigger_exists,
  CASE t.tgenabled
    WHEN 'O' THEN 'origin (normal enabled mode)'
    WHEN 'A' THEN 'always'
    WHEN 'R' THEN 'replica only'
    WHEN 'D' THEN 'disabled'
    ELSE 'missing'
  END AS enabled_status,
  CASE WHEN t.oid IS NOT NULL THEN pg_get_triggerdef(t.oid, true) END AS trigger_definition
FROM expected AS e
LEFT JOIN pg_namespace AS n ON n.nspname = e.schema_name
LEFT JOIN pg_class AS c ON c.relnamespace = n.oid AND c.relname = e.table_name
LEFT JOIN pg_trigger AS t
  ON t.tgrelid = c.oid
 AND t.tgname = e.trigger_name
 AND NOT t.tgisinternal
ORDER BY e.schema_name, e.table_name;

SELECT
  p.oid IS NOT NULL AS immutable_function_exists,
  CASE WHEN p.oid IS NOT NULL THEN
    pg_get_functiondef(p.oid) ILIKE '%NEW.account_mode%'
      AND pg_get_functiondef(p.oid) ILIKE '%OLD.account_mode%'
      AND pg_get_functiondef(p.oid) ILIKE '%RAISE EXCEPTION%'
  ELSE false END AS function_rejects_account_mode_changes
FROM (VALUES (1)) AS seed(dummy)
LEFT JOIN pg_namespace AS n ON n.nspname = 'public'
LEFT JOIN pg_proc AS p
  ON p.pronamespace = n.oid
 AND p.proname = 'prevent_profile_account_mode_change';

-- 4. Required marketplace columns and RLS settings.
-- Healthy result: each table exists, missing_columns is {}, and rls_enabled is
-- true for every marketplace table. Storage objects should also have RLS on.
WITH expected(table_schema, table_name, expected_columns) AS (
  VALUES
    ('public', 'profiles', ARRAY['id', 'full_name', 'phone', 'account_mode', 'created_at', 'updated_at']::text[]),
    ('public', 'car_listings', ARRAY[
      'id', 'seller_id', 'brand', 'model', 'manufacturing_year', 'fuel_type',
      'transmission', 'engine_size', 'kilometers_driven', 'number_of_owners',
      'description', 'city', 'asking_price', 'estimated_price', 'image_urls',
      'status', 'created_at', 'updated_at'
    ]::text[]),
    ('public', 'favorites', ARRAY['id', 'buyer_id', 'listing_id', 'created_at']::text[]),
    ('public', 'inquiries', ARRAY[
      'id', 'listing_id', 'buyer_id', 'seller_id', 'message', 'status', 'created_at', 'updated_at'
    ]::text[]),
    ('public', 'seller_access_requests', ARRAY[
      'id', 'user_id', 'requested_mode', 'status', 'created_at', 'updated_at', 'reviewed_at'
    ]::text[]),
    ('storage', 'objects', ARRAY['id', 'bucket_id', 'name', 'owner_id']::text[])
)
SELECT
  e.table_schema,
  e.table_name,
  to_regclass(format('%I.%I', e.table_schema, e.table_name)) IS NOT NULL AS table_exists,
  ARRAY(
    SELECT required.column_name
    FROM unnest(e.expected_columns) AS required(column_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM information_schema.columns AS c
      WHERE c.table_schema = e.table_schema
        AND c.table_name = e.table_name
        AND c.column_name = required.column_name
    )
    ORDER BY required.column_name
  ) AS missing_columns,
  coalesce(cls.relrowsecurity, false) AS rls_enabled
FROM expected AS e
LEFT JOIN pg_namespace AS ns ON ns.nspname = e.table_schema
LEFT JOIN pg_class AS cls ON cls.relnamespace = ns.oid AND cls.relname = e.table_name
ORDER BY e.table_schema, e.table_name;

-- 5. Car-images bucket and Storage policies.
-- Healthy result: the car-images bucket exists (public should match the local
-- Storage migration's intended setting), and all four policies exist. Public
-- means anyone with an image URL can view/download that image.
SELECT
  b.id AS bucket_id,
  b.public AS bucket_is_public,
  b.file_size_limit,
  b.allowed_mime_types
FROM (VALUES ('car-images')) AS expected(bucket_id)
LEFT JOIN storage.buckets AS b ON b.id = expected.bucket_id;

WITH expected(policy_name, expected_command) AS (
  VALUES
    ('car_images_public_read', 'SELECT'),
    ('car_images_upload_own_folder', 'INSERT'),
    ('car_images_update_own_folder', 'UPDATE'),
    ('car_images_delete_own_folder', 'DELETE')
)
SELECT
  e.policy_name,
  e.expected_command,
  p.policyname IS NOT NULL AS policy_exists,
  p.cmd AS actual_command,
  p.roles AS applies_to_roles,
  p.qual AS using_expression,
  p.with_check AS check_expression
FROM expected AS e
LEFT JOIN pg_policies AS p
  ON p.schemaname = 'storage'
 AND p.tablename = 'objects'
 AND p.policyname = e.policy_name
ORDER BY e.policy_name;

-- 6. Profile grants and listing ownership/role policy text.
-- Healthy result: authenticated may SELECT profiles and update full_name/phone,
-- but cannot update account_mode; anon cannot read or change profiles. The
-- listing policy ownership and Seller-mode indicators are in query 1.
SELECT
  CASE WHEN to_regclass('public.profiles') IS NOT NULL
    THEN has_table_privilege('authenticated', 'public.profiles', 'SELECT')
  END AS authenticated_can_read_profiles,
  CASE WHEN to_regclass('public.profiles') IS NOT NULL
    THEN has_table_privilege('anon', 'public.profiles', 'SELECT')
  END AS anon_can_read_profiles,
  CASE WHEN to_regclass('public.profiles') IS NOT NULL
    THEN has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE')
  END AS authenticated_can_update_full_name,
  CASE WHEN to_regclass('public.profiles') IS NOT NULL
    THEN has_column_privilege('authenticated', 'public.profiles', 'phone', 'UPDATE')
  END AS authenticated_can_update_phone,
  CASE WHEN to_regclass('public.profiles') IS NOT NULL
    THEN has_column_privilege('authenticated', 'public.profiles', 'account_mode', 'UPDATE')
  END AS authenticated_can_update_account_mode,
  CASE WHEN to_regclass('public.profiles') IS NOT NULL
    THEN has_column_privilege('anon', 'public.profiles', 'account_mode', 'UPDATE')
  END AS anon_can_update_account_mode;
