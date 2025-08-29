-- Make units.user_id nullable to allow creating units before assigning an owner
alter table if exists public.units
  alter column user_id drop not null;

-- Optional: if you want to ensure at most one active owner per unit and allow nulls, you can keep a simple unique on id and rely on FK for user_id
-- If you need historical ownership, consider a separate table (unit_assignments) instead of a column.


 