alter table public.game_states
  add column shop_updated_at timestamptz not null default now();

alter function public.game_action(text, text) rename to game_action_legacy;
revoke all on function public.game_action_legacy(text, text) from public, anon, authenticated;

create function public.game_action(
  p_action text,
  p_upgrade_id text default null,
  p_quantity integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_state public.game_states%rowtype;
  v_now timestamptz := clock_timestamp();
  v_action_result jsonb;
  v_elapsed double precision;
  v_viral_seconds double precision := 0;
  v_passive_rate double precision := 0;
  v_base_passive_rate double precision := 0;
  v_multiplier double precision;
  v_income double precision := 0;
  v_nap_bonus_top_up double precision := 0;
  v_click_bonus double precision := 0;
  v_base_cost numeric;
  v_unlock_at double precision := 0;
  v_owned integer;
  v_purchase_count integer := 0;
  v_remaining_points numeric;
  v_unit_cost numeric;
begin
  if v_user_id is null then
    raise exception 'Sign in to play on the public leaderboards.';
  end if;

  if p_action = 'purchase' then
    if p_quantity not in (1, 10, -1) then
      raise exception 'Choose BUY 1, BUY 10, or BUY MAX.';
    end if;
    if p_upgrade_id is null then
      raise exception 'Choose an upgrade to purchase.';
    end if;
  elsif p_quantity <> 1 then
    raise exception 'Purchase quantities are only valid for upgrade purchases.';
  end if;

  select * into v_state
  from public.game_states
  where player_id = v_user_id
  for update;

  if not found then
    raise exception 'Player game was not initialized. Please contact support.';
  end if;

  v_elapsed := greatest(0, least(extract(epoch from (v_now - v_state.shop_updated_at)), 28800));
  v_passive_rate :=
    coalesce((v_state.owned ->> 'lucky-clover-field')::double precision, 0) * 50000
    + coalesce((v_state.owned ->> 'kado-meme-studio')::double precision, 0) * 250000
    + coalesce((v_state.owned ->> 'viral-content-empire')::double precision, 0) * 1000000
    + coalesce((v_state.owned ->> 'golden-dog-mansion')::double precision, 0) * 5000000
    + coalesce((v_state.owned ->> 'kado-moon-base')::double precision, 0) * 25000000
    + coalesce((v_state.owned ->> 'interstellar-dog-park')::double precision, 0) * 100000000
    + coalesce((v_state.owned ->> 'kado-multiverse-gate')::double precision, 0) * 500000000
    + coalesce((v_state.owned ->> 'legendary-luck-reactor')::double precision, 0) * 2500000000;
  v_base_passive_rate :=
    coalesce((v_state.owned ->> 'toy')::double precision, 0)
    + coalesce((v_state.owned ->> 'collar')::double precision, 0) * 5
    + coalesce((v_state.owned ->> 'doghouse')::double precision, 0) * 20
    + coalesce((v_state.owned ->> 'factory')::double precision, 0) * 100
    + coalesce((v_state.owned ->> 'algorithm')::double precision, 0) * 500
    + coalesce((v_state.owned ->> 'rocket')::double precision, 0) * 2500
    + coalesce((v_state.owned ->> 'universe')::double precision, 0) * 10000;
  v_multiplier := 1 + v_state.golden_paws * 0.05;

  if v_state.active_event = 'viral' and v_state.event_ends_at is not null then
    v_viral_seconds := greatest(0, least(v_elapsed, extract(epoch from (v_state.event_ends_at - v_state.shop_updated_at))));
  end if;
  v_income := v_passive_rate * v_multiplier * (v_elapsed + v_viral_seconds);

  if v_state.active_event = 'nap' and v_state.event_ends_at is not null and v_state.event_ends_at <= v_now then
    v_nap_bonus_top_up := greatest(100, (v_base_passive_rate + v_passive_rate) * v_multiplier * 20)
      - greatest(100, v_base_passive_rate * v_multiplier * 20);
  end if;

  update public.game_states
  set points = points + v_income,
      lifetime_points = lifetime_points + v_income,
      shop_updated_at = v_now
  where player_id = v_user_id;

  if p_action = 'purchase' then
    case p_upgrade_id
      when 'treat' then v_base_cost := 15;
      when 'toy' then v_base_cost := 100;
      when 'collar' then v_base_cost := 500;
      when 'doghouse' then v_base_cost := 2000;
      when 'factory' then v_base_cost := 10000;
      when 'algorithm' then v_base_cost := 50000;
      when 'rocket' then v_base_cost := 250000;
      when 'universe' then v_base_cost := 1000000;
      when 'lucky-clover-field' then v_base_cost := 5000000; v_unlock_at := 5000000;
      when 'kado-meme-studio' then v_base_cost := 25000000; v_unlock_at := 25000000;
      when 'viral-content-empire' then v_base_cost := 100000000; v_unlock_at := 100000000;
      when 'golden-dog-mansion' then v_base_cost := 500000000; v_unlock_at := 500000000;
      when 'kado-moon-base' then v_base_cost := 2500000000; v_unlock_at := 2500000000;
      when 'interstellar-dog-park' then v_base_cost := 10000000000; v_unlock_at := 10000000000;
      when 'kado-multiverse-gate' then v_base_cost := 50000000000; v_unlock_at := 50000000000;
      when 'legendary-luck-reactor' then v_base_cost := 250000000000; v_unlock_at := 250000000000;
      when 'lucky-paw-charm' then v_base_cost := 2000000; v_unlock_at := 2000000;
      when 'diamond-paw-gauntlet' then v_base_cost := 100000000; v_unlock_at := 100000000;
      else raise exception 'Unknown upgrade.';
    end case;

    v_action_result := public.game_action_legacy('load', null);
    select * into v_state
    from public.game_states
    where player_id = v_user_id
    for update;

    if v_state.lifetime_points < v_unlock_at then
      raise exception 'Earn % lifetime KADO Points to unlock this upgrade.', v_unlock_at;
    end if;

    v_owned := coalesce((v_state.owned ->> p_upgrade_id)::integer, 0);
    v_remaining_points := v_state.points::numeric;

    while p_quantity = -1 or v_purchase_count < p_quantity loop
      if v_owned > 2147483647 - v_purchase_count - 1 then
        if p_quantity = -1 and v_purchase_count > 0 then
          exit;
        end if;
        raise exception 'This upgrade has reached its maximum quantity.';
      end if;

      v_unit_cost := ceil(
        v_base_cost::double precision
        * power(1.15::double precision, (v_owned + v_purchase_count)::double precision)
      )::numeric;

      if v_unit_cost > v_remaining_points then
        if p_quantity = -1 then
          exit;
        end if;
        raise exception 'Not enough KADO Points for the selected purchase quantity.';
      end if;

      v_remaining_points := v_remaining_points - v_unit_cost;
      v_purchase_count := v_purchase_count + 1;
    end loop;

    if v_purchase_count = 0 then
      raise exception 'Not enough KADO Points for this upgrade.';
    end if;

    update public.game_states
    set points = v_remaining_points::double precision,
        owned = jsonb_set(v_state.owned, array[p_upgrade_id], to_jsonb(v_owned + v_purchase_count), true)
    where player_id = v_user_id;
  else
    v_action_result := public.game_action_legacy(p_action, p_upgrade_id);

    if p_action = 'click' then
      v_click_bonus :=
        coalesce((v_state.owned ->> 'lucky-paw-charm')::double precision, 0) * 25
        + coalesce((v_state.owned ->> 'diamond-paw-gauntlet')::double precision, 0) * 1000;
      if v_state.active_event = 'zoomies' then
        v_click_bonus := v_click_bonus * 5;
      end if;
      if v_click_bonus > 0 then
        update public.game_states
        set points = points + v_click_bonus,
            lifetime_points = lifetime_points + v_click_bonus
        where player_id = v_user_id;
      end if;
    end if;
  end if;

  if v_nap_bonus_top_up > 0 then
    update public.game_states
    set points = points + v_nap_bonus_top_up,
        lifetime_points = lifetime_points + v_nap_bonus_top_up
    where player_id = v_user_id;
  end if;

  select * into v_state
  from public.game_states
  where player_id = v_user_id;

  if v_state.lifetime_points >= 1000000 and not (v_state.achievements ? 'millionaire') then
    v_state.achievements := v_state.achievements || to_jsonb('millionaire'::text);
  end if;
  if v_state.lifetime_points >= 10000000 and not (v_state.achievements ? 'legendary') then
    v_state.achievements := v_state.achievements || to_jsonb('legendary'::text);
  end if;
  if v_state.lifetime_points >= 1000000 and not (v_state.achievements ? 'milestone-1m') then
    v_state.achievements := v_state.achievements || to_jsonb('milestone-1m'::text);
  end if;
  if v_state.lifetime_points >= 10000000 and not (v_state.achievements ? 'milestone-10m') then
    v_state.achievements := v_state.achievements || to_jsonb('milestone-10m'::text);
  end if;
  if v_state.lifetime_points >= 100000000 and not (v_state.achievements ? 'milestone-100m') then
    v_state.achievements := v_state.achievements || to_jsonb('milestone-100m'::text);
  end if;
  if v_state.lifetime_points >= 1000000000 and not (v_state.achievements ? 'milestone-1b') then
    v_state.achievements := v_state.achievements || to_jsonb('milestone-1b'::text);
  end if;
  if v_state.lifetime_points >= 10000000000 and not (v_state.achievements ? 'milestone-10b') then
    v_state.achievements := v_state.achievements || to_jsonb('milestone-10b'::text);
  end if;
  if v_state.lifetime_points >= 100000000000 and not (v_state.achievements ? 'milestone-100b') then
    v_state.achievements := v_state.achievements || to_jsonb('milestone-100b'::text);
  end if;
  if v_state.lifetime_points >= 1000000000000 and not (v_state.achievements ? 'milestone-1t') then
    v_state.achievements := v_state.achievements || to_jsonb('milestone-1t'::text);
  end if;

  update public.game_states
  set achievements = v_state.achievements
  where player_id = v_user_id;

  v_action_result := jsonb_set(v_action_result, '{game,points}', to_jsonb(v_state.points), true);
  v_action_result := jsonb_set(v_action_result, '{game,lifetimePoints}', to_jsonb(v_state.lifetime_points), true);
  v_action_result := jsonb_set(v_action_result, '{game,owned}', v_state.owned, true);
  v_action_result := jsonb_set(v_action_result, '{game,achievements}', v_state.achievements, true);

  if p_action = 'load' then
    v_action_result := jsonb_set(
      v_action_result,
      '{offlineEarnings}',
      to_jsonb(coalesce((v_action_result ->> 'offlineEarnings')::double precision, 0) + v_income + v_nap_bonus_top_up),
      true
    );
  elsif p_action = 'purchase' then
    v_action_result := jsonb_set(v_action_result, '{offlineEarnings}', '0'::jsonb, true);
  end if;

  return v_action_result;
end;
$$;

revoke all on function public.game_action(text, text, integer) from public, anon;
grant execute on function public.game_action(text, text, integer) to authenticated;

notify pgrst, 'reload schema';
