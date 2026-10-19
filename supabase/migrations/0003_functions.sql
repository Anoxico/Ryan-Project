-- ============================================================
-- 巡店记录管理软件 · 阶段 0 业务函数 / RPC
-- ============================================================

-- ------------------------------------------------------------
-- 复制一条产品记录（含其照片）
-- ------------------------------------------------------------
create or replace function duplicate_product(p_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_new_id uuid;
  v_survey uuid;
begin
  select survey_id into v_survey from product_records where id = p_id;
  if v_survey is null then
    raise exception 'product_record % not found', p_id;
  end if;

  insert into product_records (
    survey_id, category, product_name, product_params, sample_price, remark,
    form, energy_rating, noise_db, sets_count, extra_points, liter, air_volume,
    sort_order
  )
  select
    survey_id, category, product_name, product_params, sample_price, remark,
    form, energy_rating, noise_db, sets_count, extra_points, liter, air_volume,
    (select coalesce(max(sort_order), 0) + 1 from product_records where survey_id = v_survey)
  from product_records
  where id = p_id
  returning id into v_new_id;

  insert into photos (product_id, storage_path, url, sort_order)
  select v_new_id, storage_path, url, sort_order
  from photos
  where product_id = p_id;

  return v_new_id;
end $$;

-- ------------------------------------------------------------
-- 按名称获取/创建字典项（自动补全输入新值时调用）
-- 返回字典项 id
-- ------------------------------------------------------------
create or replace function upsert_dict_option(
  p_type     dict_type,
  p_name     text,
  p_category product_category default null
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from dict_options
  where type = p_type
    and coalesce(category::text, '') = coalesce(p_category::text, '')
    and lower(name) = lower(btrim(p_name))
  limit 1;

  if v_id is null then
    insert into dict_options (type, name, category)
    values (p_type, btrim(p_name), p_category)
    returning id into v_id;
  end if;

  return v_id;
end $$;

-- ------------------------------------------------------------
-- 统计：按渠道 / 客户 / 门店 统计巡店次数
--   p_dim: 'channel' | 'customer' | 'store'
-- ------------------------------------------------------------
create or replace function stats_survey_counts(p_dim text)
returns table (dim_id uuid, dim_name text, survey_count bigint)
language plpgsql
stable
as $$
begin
  if p_dim = 'channel' then
    return query
      select d.id, d.name, count(s.id)
      from dict_options d
      left join surveys s on s.channel_id = d.id
      where d.type = 'channel'
      group by d.id, d.name
      order by 3 desc;
  elsif p_dim = 'customer' then
    return query
      select d.id, d.name, count(s.id)
      from dict_options d
      left join surveys s on s.customer_id = d.id
      where d.type = 'customer'
      group by d.id, d.name
      order by 3 desc;
  elsif p_dim = 'store' then
    return query
      select d.id, d.name, count(s.id)
      from dict_options d
      left join surveys s on s.store_id = d.id
      where d.type = 'store'
      group by d.id, d.name
      order by 3 desc;
  else
    raise exception 'invalid dim: % (expect channel/customer/store)', p_dim;
  end if;
end $$;

-- ------------------------------------------------------------
-- 统计：按产品类别统计出样数量
-- ------------------------------------------------------------
create or replace function stats_product_by_category()
returns table (category product_category, sample_count bigint)
language sql
stable
as $$
  select pr.category, count(*)::bigint
  from product_records pr
  group by pr.category
  order by 2 desc;
$$;

-- ------------------------------------------------------------
-- 统计：按产品类别统计能效占比
-- ------------------------------------------------------------
create or replace function stats_energy_ratio()
returns table (
  category      product_category,
  energy_rating text,
  sample_count  bigint,
  ratio         numeric(5, 4)
)
language sql
stable
as $$
  select
    category,
    coalesce(energy_rating, '未填写') as energy_rating,
    count(*)::bigint as sample_count,
    round(count(*)::numeric / sum(count(*)) over (partition by category), 4) as ratio
  from product_records
  group by category, energy_rating
  order by category, 3 desc;
$$;
