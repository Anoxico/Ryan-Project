-- ============================================================
-- 巡店记录管理软件 · 阶段 0 建表脚本
-- 目标库: PostgreSQL / Supabase
-- 说明: 可在 Supabase SQL Editor 一次性执行；脚本尽量幂等
-- ============================================================

-- ---------- 枚举 ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'product_category') then
    create type product_category as enum ('dishwasher', 'water_heater', 'range_hood');
  end if;

  if not exists (select 1 from pg_type where typname = 'dict_type') then
    create type dict_type as enum
      ('channel', 'customer', 'store', 'product_name', 'form', 'energy_rating');
  end if;

  if not exists (select 1 from pg_type where typname = 'survey_status') then
    create type survey_status as enum ('draft', 'submitted');
  end if;
end $$;

-- ---------- 扩展 ----------
create extension if not exists pgcrypto;

-- ---------- 通用 updated_at 触发器函数 ----------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================
-- 表: dict_options  字典/自动补全
-- ============================================================
create table if not exists dict_options (
  id          uuid primary key default gen_random_uuid(),
  type        dict_type        not null,
  name        text             not null,
  category    product_category,                      -- 仅 type in (form, product_name) 时使用
  parent_id   uuid references dict_options (id) on delete set null,  -- 预留: 店->客户->渠道 层级
  sort_order  integer          not null default 0,
  is_active   boolean          not null default true,
  created_at  timestamptz      not null default now(),
  constraint dict_options_category_scope
    check (category is null or type in ('form', 'product_name')),
  constraint dict_options_name_not_blank check (btrim(name) <> '')
);

-- 同一 type + 类别 + 名称 唯一（大小写不敏感）；分部分索引避免枚举转 text
create unique index if not exists uq_dict_options_type_category_name
  on dict_options (type, category, lower(name))
  where category is not null;

create unique index if not exists uq_dict_options_type_name_nocat
  on dict_options (type, lower(name))
  where category is null;

create index if not exists idx_dict_options_type_active
  on dict_options (type, is_active, sort_order);

-- ============================================================
-- 表: surveys  巡店单
-- ============================================================
create table if not exists surveys (
  id           uuid primary key default gen_random_uuid(),
  visit_date   date          not null,
  channel_id   uuid          not null references dict_options (id) on delete restrict,
  customer_id  uuid          not null references dict_options (id) on delete restrict,
  store_id     uuid          not null references dict_options (id) on delete restrict,
  remark       text,
  status       survey_status not null default 'submitted',
  user_id      uuid,                                  -- 预留多用户
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);

create index if not exists idx_surveys_visit_date on surveys (visit_date desc);
create index if not exists idx_surveys_dimensions on surveys (channel_id, customer_id, store_id);
create index if not exists idx_surveys_status on surveys (status);

drop trigger if exists trg_surveys_updated_at on surveys;
create trigger trg_surveys_updated_at
  before update on surveys
  for each row execute function set_updated_at();

-- ============================================================
-- 表: product_records  产品记录
--   · 通用字段 + 类别专属字段（独立列，便于筛选/统计）
--   · CHECK 约束保证只保存当前类别对应的专属字段
-- ============================================================
create table if not exists product_records (
  id            uuid primary key default gen_random_uuid(),
  survey_id     uuid             not null references surveys (id) on delete cascade,
  category      product_category not null,
  product_name  text             not null,
  product_params jsonb           not null default '{}'::jsonb,  -- 型号/尺寸/容量等键值对
  sample_price  numeric(12, 2)   not null,
  remark        text,

  -- 三类通用（形态/能效）
  form          text,
  energy_rating text,

  -- 洗碗机专属
  noise_db      numeric(5, 1),
  sets_count    integer,
  extra_points  text,                                   -- 额外卖点（洗碗机 / 抽油烟机）

  -- 热水器专属
  liter         numeric(6, 1),

  -- 抽油烟机专属
  air_volume    numeric(6, 2),

  sort_order    integer          not null default 0,
  created_at    timestamptz      not null default now(),
  updated_at    timestamptz      not null default now(),

  constraint product_records_price_nonneg check (sample_price >= 0),
  constraint product_records_noise_nonneg check (noise_db is null or noise_db >= 0),
  constraint product_records_sets_nonneg  check (sets_count is null or sets_count >= 0),
  constraint product_records_liter_nonneg check (liter is null or liter >= 0),
  constraint product_records_air_nonneg   check (air_volume is null or air_volume >= 0),

  -- 类别隔离：非本类别字段必须为空
  constraint product_records_category_fields check (
    (category = 'dishwasher'
       and liter is null and air_volume is null)
    or (category = 'water_heater'
       and noise_db is null and sets_count is null
       and air_volume is null and extra_points is null)
    or (category = 'range_hood'
       and noise_db is null and sets_count is null and liter is null)
  )
);

create index if not exists idx_product_records_survey on product_records (survey_id, sort_order);
create index if not exists idx_product_records_category on product_records (category);
create index if not exists idx_product_records_name on product_records (product_name);
create index if not exists idx_product_records_energy on product_records (energy_rating);
create index if not exists idx_product_records_form on product_records (form);

drop trigger if exists trg_product_records_updated_at on product_records;
create trigger trg_product_records_updated_at
  before update on product_records
  for each row execute function set_updated_at();

-- ============================================================
-- 表: photos  照片
--   · survey_id 与 product_id 恰有一个非空
--   · 产品级照片随产品删除级联；巡店单级照片随巡店单删除级联
-- ============================================================
create table if not exists photos (
  id           uuid primary key default gen_random_uuid(),
  survey_id    uuid references surveys (id)         on delete cascade,
  product_id   uuid references product_records (id) on delete cascade,
  storage_path text not null,
  url          text not null,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  constraint photos_target_exclusive check (
    (survey_id is not null) <> (product_id is not null)
  )
);

create index if not exists idx_photos_product on photos (product_id, sort_order);
create index if not exists idx_photos_survey on photos (survey_id, sort_order);
