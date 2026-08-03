-- Align the verb ladder with the design spec.
--
-- The design's verb-level pill offers five levels; the original enum had four,
-- two of which do not appear in the design at all. Postgres cannot reorder or
-- remove enum labels in place, so the column is retyped onto a fresh enum.
--
-- Mapping for existing rows:
--   Recognize -> Recognize
--   Apply     -> Apply
--   Produce   -> Create
--   Optimize  -> Adapt

create type public.verb_level_v2 as enum ('Recognize', 'Reproduce', 'Apply', 'Adapt', 'Create');

alter table public.blocks alter column verb_level drop default;

alter table public.blocks
  alter column verb_level type public.verb_level_v2
  using (
    case verb_level::text
      when 'Recognize' then 'Recognize'
      when 'Apply'     then 'Apply'
      when 'Produce'   then 'Create'
      when 'Optimize'  then 'Adapt'
    end
  )::public.verb_level_v2;

drop type public.verb_level;
alter type public.verb_level_v2 rename to verb_level;

alter table public.blocks alter column verb_level set default 'Recognize'::public.verb_level;
