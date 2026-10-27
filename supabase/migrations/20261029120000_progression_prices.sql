-- 2failure: faster progression (HQ to level 10, buildings to level 6).
--
-- The base economy check (20261027120000_server_economy.sql) values a base
-- with the game's prices. The catalog changed (more levels, new costs, Path
-- moved to painting), so this replaces the price table, generated from
-- src/game/economy.ts by scripts/economy-sql.ts. Existing players' budgets are
-- raised where needed so every saved base stays valid.

create or replace function public.base_value(p_state jsonb)
returns integer
language plpgsql
immutable
as $$
declare
  prices constant jsonb := '{"structures":{"hq":[0,50,65,80,95,110,125,140,155,170],"watchtower":[16,26,34,44,56,66],"lodge":[16,26,34,44,56,66],"forge":[16,25,35,44,56,67],"yard":[19,30,41,54,66,79],"spring":[19,29,36,49,61,74]},"decor":{"wall":4,"arch":10,"pine":4,"flowers":2,"garden":4,"statue":20,"banner":5,"campfire":6,"picnic":6,"fountain":22,"gazebo":20,"torch":3,"lanterns":6,"plyobox":4,"pullupbar":8,"dipbars":6,"punchbag":6,"pumpkins":2,"birdhouse":2,"coop":8,"beehive":5,"well":8,"barn":16,"windmill":16,"tent":6,"parasol":4,"snowman":3,"lilypad":2,"bridge":6},"edges":{"fence":2,"wall":3,"hedge":2}}'::jsonb;
  v numeric := 0;
  item jsonb;
  lvls jsonb;
  upto integer;
  i integer;
  kind text;
begin
  v := greatest(coalesce((p_state->'resources'->>'stone')::numeric, 0), 0)
     + greatest(coalesce((p_state->'resources'->>'timber')::numeric, 0), 0)
     + greatest(coalesce((p_state->'resources'->>'crystal')::numeric, 0), 0);
  for item in select value from jsonb_array_elements(coalesce(p_state->'placed', '[]'::jsonb)) loop
    continue when item->>'itemId' like 'trophy:%';
    lvls := prices->'structures'->(item->>'itemId');
    if lvls is not null then
      select max((j->>'targetLevel')::integer) into upto
        from jsonb_array_elements(coalesce(p_state->'constructions', '[]'::jsonb)) j
       where j->>'uid' = item->>'uid';
      upto := greatest(coalesce((item->>'level')::integer, 0), coalesce(upto, 0));
      for i in 0 .. least(upto, jsonb_array_length(lvls)) - 1 loop
        v := v + (lvls->>i)::integer;
      end loop;
    else
      v := v + coalesce((prices->'decor'->>(item->>'itemId'))::integer, 0);
    end if;
  end loop;
  for kind in select value from jsonb_each_text(coalesce(p_state->'edges', '{}'::jsonb)) loop
    v := v + coalesce((prices->'edges'->>kind)::integer, 0);
  end loop;
  return floor(v)::integer;
end;
$$;

-- Nobody's current base may end up over budget with the new prices.
update public.economy e
   set material_budget = greatest(e.material_budget, public.base_value(b.state)),
       updated_at = timezone('utc', now())
  from public.base_games b
 where b.user_id = e.user_id;
