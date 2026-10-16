create table public.player_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

create unique index player_profiles_username_lower_idx on public.player_profiles (lower(username));

create table public.game_states (
  player_id uuid primary key references public.player_profiles(id) on delete cascade,
  points double precision not null default 0 check (points >= 0),
  lifetime_points double precision not null default 0 check (lifetime_points >= 0),
  clicks bigint not null default 0 check (clicks >= 0),
  owned jsonb not null default '{"treat":0,"toy":0,"collar":0,"doghouse":0,"factory":0,"algorithm":0,"rocket":0,"universe":0}'::jsonb,
  golden_paws integer not null default 0 check (golden_paws >= 0),
  prestige_count integer not null default 0 check (prestige_count >= 0),
  play_time integer not null default 0 check (play_time >= 0),
  achievements jsonb not null default '[]'::jsonb check (jsonb_typeof(achievements) = 'array'),
  updated_at timestamptz not null default now(),
  active_event text check (active_event in ('zoomies', 'viral', 'nap')),
  event_ends_at timestamptz,
  next_event_at timestamptz not null default (now() + interval '45 seconds' + random() * interval '45 seconds'),
  combo_count integer not null default 0 check (combo_count between 0 and 25),
  last_click_at timestamptz,
  click_window_started_at timestamptz not null default now(),
  click_window_count integer not null default 0 check (click_window_count between 0 and 8),
  last_heartbeat_at timestamptz not null default now()
);

alter table public.player_profiles enable row level security;
alter table public.game_states enable row level security;

create policy "Usernames are public"
  on public.player_profiles for select
  to anon, authenticated
  using (true);

create policy "Players can read their own game"
  on public.game_states for select
  to authenticated
  using (player_id = (select auth.uid()));

revoke all on public.player_profiles from public, anon, authenticated;
revoke all on public.game_states from public, anon, authenticated;
grant select on public.player_profiles to anon, authenticated;
grant select on public.game_states to authenticated;

create or replace function public.create_kado_player()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
begin
  requested_username := btrim(new.raw_user_meta_data ->> 'username');
  if requested_username is null or requested_username !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'Username must be 3–20 letters, numbers, or underscores.';
  end if;

  insert into public.player_profiles (id, username)
  values (new.id, requested_username);

  insert into public.game_states (player_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_kado_auth_user_created
  after insert on auth.users
  for each row execute function public.create_kado_player();

create or replace function public.game_action(p_action text, p_upgrade_id text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_state public.game_states%rowtype;
  v_now timestamptz := clock_timestamp();
  v_elapsed double precision;
  v_viral_seconds double precision := 0;
  v_passive_rate double precision;
  v_multiplier double precision;
  v_income double precision := 0;
  v_ppc double precision;
  v_combo integer;
  v_owned integer;
  v_base_cost double precision;
  v_cost double precision;
  v_offline_earnings double precision := 0;
  v_paws integer;
begin
  if v_user_id is null then
    raise exception 'Sign in to play on the public leaderboards.';
  end if;

  select * into v_state
  from public.game_states
  where player_id = v_user_id
  for update;

  if not found then
    raise exception 'Player game was not initialized. Please contact support.';
  end if;

  v_elapsed := greatest(0, least(extract(epoch from (v_now - v_state.updated_at)), 28800));
  v_passive_rate :=
    coalesce((v_state.owned ->> 'toy')::double precision, 0)
    + coalesce((v_state.owned ->> 'collar')::double precision, 0) * 5
    + coalesce((v_state.owned ->> 'doghouse')::double precision, 0) * 20
    + coalesce((v_state.owned ->> 'factory')::double precision, 0) * 100
    + coalesce((v_state.owned ->> 'algorithm')::double precision, 0) * 500
    + coalesce((v_state.owned ->> 'rocket')::double precision, 0) * 2500
    + coalesce((v_state.owned ->> 'universe')::double precision, 0) * 10000;
  v_multiplier := 1 + v_state.golden_paws * 0.05;

  if v_state.active_event = 'viral' and v_state.event_ends_at is not null then
    v_viral_seconds := greatest(0, least(v_elapsed, extract(epoch from (v_state.event_ends_at - v_state.updated_at))));
  end if;
  v_income := v_passive_rate * v_multiplier * (v_elapsed + v_viral_seconds);
  v_offline_earnings := v_income;
  v_state.points := v_state.points + v_income;
  v_state.lifetime_points := v_state.lifetime_points + v_income;

  if v_state.active_event = 'nap' and v_state.event_ends_at is not null and v_state.event_ends_at <= v_now then
    v_income := greatest(100, v_passive_rate * v_multiplier * 20);
    v_state.points := v_state.points + v_income;
    v_state.lifetime_points := v_state.lifetime_points + v_income;
    v_offline_earnings := v_offline_earnings + v_income;
    v_state.active_event := null;
    v_state.event_ends_at := null;
  elsif v_state.event_ends_at is not null and v_state.event_ends_at <= v_now then
    v_state.active_event := null;
    v_state.event_ends_at := null;
  end if;

  if p_action = 'click' then
    if v_now - v_state.click_window_started_at >= interval '1 second' then
      v_state.click_window_started_at := v_now;
      v_state.click_window_count := 0;
    end if;
    if v_state.click_window_count >= 8 then
      raise exception 'Click limit reached. Please slow down for a moment.';
    end if;

    v_state.click_window_count := v_state.click_window_count + 1;
    v_combo := case
      when v_state.last_click_at is not null and v_now - v_state.last_click_at <= interval '1.5 seconds'
        then v_state.combo_count
      else 0
    end;
    v_state.combo_count := case
      when v_state.last_click_at is not null and v_now - v_state.last_click_at <= interval '1.5 seconds'
        then least(v_state.combo_count + 1, 25)
      else 1
    end;
    v_state.last_click_at := v_now;
    v_ppc := 1 + coalesce((v_state.owned ->> 'treat')::integer, 0) + floor(v_combo / 5.0);
    if v_state.active_event = 'zoomies' then
      v_ppc := v_ppc * 5;
    end if;
    v_state.points := v_state.points + v_ppc;
    v_state.lifetime_points := v_state.lifetime_points + v_ppc;
    v_state.clicks := v_state.clicks + 1;

  elsif p_action = 'purchase' then
    case p_upgrade_id
      when 'treat' then v_base_cost := 15;
      when 'toy' then v_base_cost := 100;
      when 'collar' then v_base_cost := 500;
      when 'doghouse' then v_base_cost := 2000;
      when 'factory' then v_base_cost := 10000;
      when 'algorithm' then v_base_cost := 50000;
      when 'rocket' then v_base_cost := 250000;
      when 'universe' then v_base_cost := 1000000;
      else raise exception 'Unknown upgrade.';
    end case;

    v_owned := coalesce((v_state.owned ->> p_upgrade_id)::integer, 0);
    v_cost := ceil(v_base_cost * power(1.15, v_owned));
    if v_state.points < v_cost then
      raise exception 'Not enough KADO Points for this upgrade.';
    end if;
    v_state.points := v_state.points - v_cost;
    v_state.owned := jsonb_set(v_state.owned, array[p_upgrade_id], to_jsonb(v_owned + 1), true);

  elsif p_action = 'heartbeat' then
    v_state.play_time := v_state.play_time + floor(least(extract(epoch from (v_now - v_state.last_heartbeat_at)), 15));
    v_state.last_heartbeat_at := v_now;

  elsif p_action = 'surprise' then
    if v_state.active_event is not null then
      raise exception 'An event is already active.';
    end if;
    v_state.active_event := (array['zoomies', 'viral', 'nap'])[1 + floor(random() * 3)::integer];
    v_state.event_ends_at := v_now + case v_state.active_event
      when 'zoomies' then interval '15 seconds'
      when 'viral' then interval '30 seconds'
      else interval '12 seconds'
    end;
    v_state.next_event_at := v_now + interval '45 seconds' + random() * interval '45 seconds';

  elsif p_action = 'prestige' then
    if v_state.points < 10000000 then
      raise exception 'Earn 10 million current points before reincarnating.';
    end if;
    v_paws := greatest(1, floor(sqrt(v_state.points / 10000000.0))::integer);
    v_state.points := 0;
    v_state.owned := '{"treat":0,"toy":0,"collar":0,"doghouse":0,"factory":0,"algorithm":0,"rocket":0,"universe":0}'::jsonb;
    v_state.golden_paws := v_state.golden_paws + v_paws;
    v_state.prestige_count := v_state.prestige_count + 1;
    v_state.active_event := null;
    v_state.event_ends_at := null;

  elsif p_action <> 'load' then
    raise exception 'Unknown game action.';
  end if;

  if v_state.clicks >= 1 and not (v_state.achievements ? 'first-bark') then
    v_state.achievements := v_state.achievements || to_jsonb('first-bark'::text);
  end if;
  if coalesce((v_state.owned ->> 'treat')::integer, 0) >= 10 and not (v_state.achievements ? 'treat-collector') then
    v_state.achievements := v_state.achievements || to_jsonb('treat-collector'::text);
  end if;
  if v_state.clicks >= 1000 and not (v_state.achievements ? 'certified-clicker') then
    v_state.achievements := v_state.achievements || to_jsonb('certified-clicker'::text);
  end if;
  if v_state.lifetime_points >= 1000000 and not (v_state.achievements ? 'millionaire') then
    v_state.achievements := v_state.achievements || to_jsonb('millionaire'::text);
  end if;
  if v_state.play_time >= 3600 and not (v_state.achievements ? 'touch-grass') then
    v_state.achievements := v_state.achievements || to_jsonb('touch-grass'::text);
  end if;
  if v_state.lifetime_points >= 10000000 and not (v_state.achievements ? 'legendary') then
    v_state.achievements := v_state.achievements || to_jsonb('legendary'::text);
  end if;

  if v_state.active_event is null and v_state.next_event_at <= v_now and p_action not in ('surprise', 'prestige') then
    v_state.active_event := (array['zoomies', 'viral', 'nap'])[1 + floor(random() * 3)::integer];
    v_state.event_ends_at := v_now + case v_state.active_event
      when 'zoomies' then interval '15 seconds'
      when 'viral' then interval '30 seconds'
      else interval '12 seconds'
    end;
    v_state.next_event_at := v_now + interval '45 seconds' + random() * interval '45 seconds';
  end if;

  v_state.updated_at := v_now;
  update public.game_states set
    points = v_state.points,
    lifetime_points = v_state.lifetime_points,
    clicks = v_state.clicks,
    owned = v_state.owned,
    golden_paws = v_state.golden_paws,
    prestige_count = v_state.prestige_count,
    play_time = v_state.play_time,
    achievements = v_state.achievements,
    updated_at = v_state.updated_at,
    active_event = v_state.active_event,
    event_ends_at = v_state.event_ends_at,
    next_event_at = v_state.next_event_at,
    combo_count = v_state.combo_count,
    last_click_at = v_state.last_click_at,
    click_window_started_at = v_state.click_window_started_at,
    click_window_count = v_state.click_window_count,
    last_heartbeat_at = v_state.last_heartbeat_at
  where player_id = v_user_id;

  return jsonb_build_object(
    'game', jsonb_build_object(
      'points', v_state.points,
      'lifetimePoints', v_state.lifetime_points,
      'clicks', v_state.clicks,
      'owned', v_state.owned,
      'goldenPaws', v_state.golden_paws,
      'prestigeCount', v_state.prestige_count,
      'achievements', v_state.achievements,
      'playTime', v_state.play_time,
      'lastSavedAt', extract(epoch from v_now) * 1000
    ),
    'offlineEarnings', case when p_action = 'load' then v_offline_earnings else 0 end,
    'activeEvent', case when v_state.active_event is null then null else jsonb_build_object(
      'type', v_state.active_event,
      'endsAt', extract(epoch from v_state.event_ends_at) * 1000
    ) end
  );
end;
$$;

create or replace function public.get_public_leaderboards()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'clicks', coalesce((
      select jsonb_agg(jsonb_build_object('username', ranked.username, 'score', ranked.score, 'clicks', ranked.clicks, 'lifetime_points', ranked.lifetime_points, 'points', ranked.points) order by ranked.rank)
      from (
        select p.username, g.clicks::double precision as score, g.clicks, g.lifetime_points, g.points,
          row_number() over (order by g.clicks desc, g.updated_at asc) as rank
        from public.game_states g join public.player_profiles p on p.id = g.player_id
        where g.clicks > 0
        order by g.clicks desc, g.updated_at asc limit 10
      ) ranked
    ), '[]'::jsonb),
    'lifetime', coalesce((
      select jsonb_agg(jsonb_build_object('username', ranked.username, 'score', ranked.score, 'clicks', ranked.clicks, 'lifetime_points', ranked.lifetime_points, 'points', ranked.points) order by ranked.rank)
      from (
        select p.username, g.lifetime_points as score, g.clicks, g.lifetime_points, g.points,
          row_number() over (order by g.lifetime_points desc, g.updated_at asc) as rank
        from public.game_states g join public.player_profiles p on p.id = g.player_id
        where g.lifetime_points > 0
        order by g.lifetime_points desc, g.updated_at asc limit 10
      ) ranked
    ), '[]'::jsonb),
    'points', coalesce((
      select jsonb_agg(jsonb_build_object('username', ranked.username, 'score', ranked.score, 'clicks', ranked.clicks, 'lifetime_points', ranked.lifetime_points, 'points', ranked.points) order by ranked.rank)
      from (
        select p.username, g.points as score, g.clicks, g.lifetime_points, g.points,
          row_number() over (order by g.points desc, g.updated_at asc) as rank
        from public.game_states g join public.player_profiles p on p.id = g.player_id
        where g.points > 0
        order by g.points desc, g.updated_at asc limit 10
      ) ranked
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.create_kado_player() from public, anon, authenticated;
revoke all on function public.game_action(text, text) from public, anon;
revoke all on function public.get_public_leaderboards() from public;
grant execute on function public.game_action(text, text) to authenticated;
grant execute on function public.get_public_leaderboards() to anon, authenticated;
