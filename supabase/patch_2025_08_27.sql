-- Additional index/constraints for better dedup and query perf (2025-08-27)
do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='uniq_showtime_by_tmdb'
  ) then
    execute 'create unique index uniq_showtime_by_tmdb on public.showtimes (cinema_id, tmdb_id, start_time)';
  end if;
end $$;

create index if not exists idx_showtimes_cinema_start on public.showtimes (cinema_id, start_time);
