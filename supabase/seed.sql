-- ============================================================
-- 巡店记录管理软件 · 阶段 0 种子数据
-- 可重复执行（依赖 upsert_dict_option 幂等）
-- ============================================================

-- ---------- 渠道 ----------
select upsert_dict_option('channel', '国美');
select upsert_dict_option('channel', '苏宁');
select upsert_dict_option('channel', '京东专卖店');
select upsert_dict_option('channel', '天猫优品');
select upsert_dict_option('channel', '区域连锁');

-- ---------- 客户 ----------
select upsert_dict_option('customer', '张三家电');
select upsert_dict_option('customer', '李四电器');
select upsert_dict_option('customer', '王五商贸');
select upsert_dict_option('customer', '恒大家电');

-- ---------- 门店 ----------
select upsert_dict_option('store', '国美中山路旗舰店');
select upsert_dict_option('store', '苏宁人民广场店');
select upsert_dict_option('store', '京东专卖店城东店');
select upsert_dict_option('store', '天猫优品高新店');

-- ---------- 形态（按产品类别） ----------
-- 洗碗机
select upsert_dict_option('form', '嵌入式',     'dishwasher');
select upsert_dict_option('form', '独立式',     'dishwasher');
select upsert_dict_option('form', '台式',       'dishwasher');
select upsert_dict_option('form', '水槽式',     'dishwasher');
-- 热水器
select upsert_dict_option('form', '燃气式',     'water_heater');
select upsert_dict_option('form', '电热式',     'water_heater');
select upsert_dict_option('form', '空气能',     'water_heater');
select upsert_dict_option('form', '太阳能',     'water_heater');
-- 抽油烟机
select upsert_dict_option('form', '顶吸式',     'range_hood');
select upsert_dict_option('form', '侧吸式',     'range_hood');
select upsert_dict_option('form', '集成式',     'range_hood');
select upsert_dict_option('form', '中式',       'range_hood');

-- ---------- 能效（三类共用） ----------
select upsert_dict_option('energy_rating', '一级');
select upsert_dict_option('energy_rating', '二级');
select upsert_dict_option('energy_rating', '三级');

-- ---------- 产品名（按产品类别） ----------
select upsert_dict_option('product_name', '美的洗碗机 WQP12',   'dishwasher');
select upsert_dict_option('product_name', '海尔洗碗机 EYW',     'dishwasher');
select upsert_dict_option('product_name', '西门子洗碗机 SJ',     'dishwasher');
select upsert_dict_option('product_name', '林内燃气热水器',      'water_heater');
select upsert_dict_option('product_name', '海尔电热水器 ES',     'water_heater');
select upsert_dict_option('product_name', '美的空气能热水器',    'water_heater');
select upsert_dict_option('product_name', '方太抽油烟机 EMD',    'range_hood');
select upsert_dict_option('product_name', '老板抽油烟机 CXW',    'range_hood');
select upsert_dict_option('product_name', '华帝抽油烟机 i11',    'range_hood');

-- ---------- 示例巡店单 + 产品记录 ----------
do $$
declare
  v_channel  uuid;
  v_customer uuid;
  v_store    uuid;
  v_survey   uuid;
  v_pr1      uuid;
  v_pr2      uuid;
begin
  select id into v_channel  from dict_options where type='channel'  and name='国美';
  select id into v_customer from dict_options where type='customer' and name='张三家电';
  select id into v_store    from dict_options where type='store'    and name='国美中山路旗舰店';

  if not exists (select 1 from surveys where visit_date = current_date - 5
                 and channel_id = v_channel) then

    insert into surveys (visit_date, channel_id, customer_id, store_id, remark)
    values (current_date - 5, v_channel, v_customer, v_store, '门店出样较全，价格略高')
    returning id into v_survey;

    -- 洗碗机
    insert into product_records (
      survey_id, category, product_name, product_params, sample_price, remark,
      form, energy_rating, noise_db, sets_count, extra_points, sort_order)
    values (
      v_survey, 'dishwasher', '美的洗碗机 WQP12',
      '{"型号":"WQP12-W5303","尺寸":"600x600x845","容量":"12套"}'::jsonb,
      4999.00, '主推机型',
      '嵌入式', '一级', 46.0, 12, '高温除菌 / 热风烘干', 0)
    returning id into v_pr1;

    -- 抽油烟机
    insert into product_records (
      survey_id, category, product_name, product_params, sample_price, remark,
      form, energy_rating, air_volume, extra_points, sort_order)
    values (
      v_survey, 'range_hood', '方太抽油烟机 EMD',
      '{"型号":"EMD20A","尺寸":"900x500x600"}'::jsonb,
      6880.00, '样机有折扣',
      '侧吸式', '一级', 23.00, '大吸力 / 自动清洗', 1)
    returning id into v_pr2;

    -- 示例照片占位（storage_path 为示意）
    insert into photos (product_id, storage_path, url, sort_order)
    values
      (v_pr1, 'sample/dishwasher-1.jpg', 'https://placehold.co/800x600?text=Dishwasher', 0),
      (v_pr2, 'sample/rangehood-1.jpg',  'https://placehold.co/800x600?text=RangeHood',  0);
  end if;
end $$;
