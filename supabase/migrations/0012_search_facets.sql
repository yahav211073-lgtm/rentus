-- ============================================================================
-- 0012 — פונקציית facets לחיפוש
--
-- src/lib/repo/search.ts (הגרסה עם seed) בונה facets בזיכרון מעל
-- כל התוצאות שעברו סינון. מול DB אמיתי זו שאילתת GROUP BY לכל אחד
-- משלושת הממדים (קטגוריה/עיר/תגית) — פונקציה אחת ולא שלוש שאילתות
-- נפרדות מהלקוח, כדי לא לשלש round-trip על כל הקלדה בתיבת החיפוש.
--
-- הפונקציה מקבלת את אותם פרמטרים כמו החיפוש הראשי (חוץ מ-category/tags,
-- כי אלה בדיוק הממדים שה-facets עצמם סופרים) ומחזירה jsonb אחד.
-- ============================================================================

create or replace function public.search_business_facets(
  p_query text default null,
  p_city  text default null,
  p_min_rating numeric default null,
  p_verified_only boolean default false,
  p_price_range int[] default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with matched as (
    select b.id, bc.category_id, b.city_id, bt.tag_id
    from public.businesses b
    left join public.business_categories bc on bc.business_id = b.id
    left join public.business_tags bt on bt.business_id = b.id
    where b.status = 'published'
      and (p_query is null or p_query = '' or
           b.search_vector @@ websearch_to_tsquery('simple', unaccent(p_query)))
      and (p_city is null or b.city_id = (select id from public.cities where slug = p_city))
      and (p_min_rating is null or b.rating_avg >= p_min_rating)
      and (not p_verified_only or b.is_verified)
      and (p_price_range is null or b.price_range = any(p_price_range))
  )
  select jsonb_build_object(
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('slug', c.slug, 'name', c.name, 'count', x.cnt) order by x.cnt desc)
      from (
        select category_id, count(distinct id) as cnt
        from matched where category_id is not null
        group by category_id
      ) x
      join public.categories c on c.id = x.category_id
    ), '[]'::jsonb),
    'cities', coalesce((
      select jsonb_agg(jsonb_build_object('slug', ci.slug, 'name', ci.name, 'count', y.cnt) order by y.cnt desc)
      from (
        select city_id, count(distinct id) as cnt
        from matched where city_id is not null
        group by city_id
      ) y
      join public.cities ci on ci.id = y.city_id
    ), '[]'::jsonb),
    'tags', coalesce((
      select jsonb_agg(jsonb_build_object('slug', t.slug, 'name', t.name, 'count', z.cnt) order by z.cnt desc)
      from (
        select tag_id, count(distinct id) as cnt
        from matched where tag_id is not null
        group by tag_id
      ) z
      join public.tags t on t.id = z.tag_id
    ), '[]'::jsonb)
  );
$$;

grant execute on function public.search_business_facets(text, text, numeric, boolean, int[]) to anon, authenticated;
