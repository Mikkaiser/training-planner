-- Add explicit 1:1 relationship between topics (blocks) and gates.
-- A topic must reference exactly one gate; a gate belongs to exactly one topic.
--
-- Backfill strategy:
-- - Pair existing topics with existing block_gates by positional order per phase.
-- - If a phase has fewer block_gates than topics, create missing gates.
-- - Do not delete any extra gates (they will become unreferenced and ignored by the app).

begin;

alter table public.topics
  add column if not exists gate_id uuid references public.gates(id);

create unique index if not exists topics_gate_id_uq
  on public.topics (gate_id)
  where gate_id is not null;

-- Validate that topics.gate_id points to a gate in the same phase.
-- Gate type is not enforced here because the "last block owns phase gate" rule
-- depends on application-level ordering and can change when blocks are re-ordered.
create or replace function public.validate_topic_gate_id()
returns trigger
language plpgsql
as $$
declare
  gate_phase_id uuid;
begin
  if new.gate_id is null then
    return new;
  end if;

  select g.phase_id into gate_phase_id
  from public.gates g
  where g.id = new.gate_id;

  if gate_phase_id is null then
    raise exception 'topics.gate_id references missing gate %', new.gate_id;
  end if;

  if gate_phase_id <> new.phase_id then
    raise exception 'topics.gate_id (%) must reference a gate in the same phase (%)', new.gate_id, new.phase_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_topics_validate_gate_id on public.topics;
create trigger trg_topics_validate_gate_id
before insert or update of gate_id, phase_id
on public.topics
for each row execute function public.validate_topic_gate_id();

-- Backfill: pair topics with block_gates positionally per phase, creating missing gates as needed.
do $$
declare
  p record;
  t_ids uuid[];
  g_ids uuid[];
  i int;
  missing int;
  new_gate_id uuid;
begin
  for p in (select id from public.phases) loop
    select array_agg(t.id order by t.order_index nulls last, t.created_at, t.id)
      into t_ids
    from public.topics t
    where t.phase_id = p.id;

    if t_ids is null or array_length(t_ids, 1) is null then
      continue;
    end if;

    select array_agg(g.id order by g.name, g.id)
      into g_ids
    from public.gates g
    where g.phase_id = p.id
      and g.gate_type = 'block_gate';

    missing := greatest(coalesce(array_length(t_ids, 1), 0) - coalesce(array_length(g_ids, 1), 0), 0);

    if missing > 0 then
      for i in 1..missing loop
        insert into public.gates (id, phase_id, name, description, gate_type, pass_threshold)
        values (
          gen_random_uuid(),
          p.id,
          'Block Gate ' || (coalesce(array_length(g_ids, 1), 0) + i),
          null,
          'block_gate',
          70
        )
        returning id into new_gate_id;

        g_ids := coalesce(g_ids, array[]::uuid[]) || new_gate_id;
      end loop;
    end if;

    -- Pair by index.
    for i in 1..array_length(t_ids, 1) loop
      update public.topics
      set gate_id = g_ids[i]
      where id = t_ids[i]
        and gate_id is null;
    end loop;
  end loop;
end $$;

commit;

