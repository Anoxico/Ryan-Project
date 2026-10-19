# 阶段 0 · 数据库与存储搭建说明

目标：在 Supabase 上创建 `巡店记录管理软件` 的数据库与照片存储。

## 一、创建 Supabase 项目
1. 打开 https://supabase.com 注册/登录 → **New project**
2. 填写：Project name（如 `shop-visit`）、Database Password（自行保存）、Region（选离你近的，如 Singapore）
3. 等待 1–2 分钟初始化完成

## 二、执行 SQL（按顺序，全部在 SQL Editor 里跑）
进入左侧 **SQL Editor → New query**，依次粘贴并运行以下文件（每个文件一次）：

| 顺序 | 文件 | 作用 |
|---|---|---|
| 1 | `supabase/migrations/0001_schema.sql` | 枚举、4 张表、约束、索引、updated_at 触发器 |
| 2 | `supabase/migrations/0002_rls.sql` | 行级安全策略（单用户全开放） |
| 3 | `supabase/migrations/0003_functions.sql` | 复制产品、字典 upsert、统计 RPC |
| 4 | `supabase/migrations/0004_storage.sql` | 创建 `survey-photos` bucket 与访问策略 |
| 5 | `supabase/seed.sql` | 字典与示例数据（可选，建议先跑便于联调） |

> 脚本尽量幂等，可重复执行。

## 三、获取前端所需密钥（阶段 1 用）
左侧 **Project Settings → API**：
- `Project URL` → 前端环境变量 `VITE_SUPABASE_URL`
- `anon public` key → `VITE_SUPABASE_ANON_KEY`

> `service_role` key 不要放进前端，也不要提交到仓库。

## 四、验证（在 SQL Editor 执行，应返回合理结果）
```sql
-- 1) 表结构
select table_name from information_schema.tables
where table_schema = 'public' order by 1;   -- 应含 surveys / product_records / photos / dict_options

-- 2) 示例数据
select s.visit_date, d1.name as channel, d2.name as customer, d3.name as store
from surveys s
join dict_options d1 on d1.id = s.channel_id
join dict_options d2 on d2.id = s.customer_id
join dict_options d3 on d3.id = s.store_id;

-- 3) 按日期范围筛选
select * from surveys where visit_date between current_date - 30 and current_date
order by visit_date desc;

-- 4) 按渠道统计巡店次数
select * from stats_survey_counts('channel');

-- 5) 按类别统计能效占比
select * from stats_energy_ratio();

-- 6) 类别字段隔离约束（应报错，证明 CHECK 生效）
-- insert into product_records (survey_id, category, product_name, sample_price, liter)
-- values ((select id from surveys limit 1), 'dishwasher', 'X', 100, 60);

-- 7) 复制产品
-- select duplicate_product((select id from product_records limit 1));
```

## 五、文件清单
```
supabase/
  migrations/
    0001_schema.sql
    0002_rls.sql
    0003_functions.sql
    0004_storage.sql
  seed.sql
```

## 六、验收标准
- [ ] 7 个验证查询中 1–5 返回正常数据
- [ ] 第 6 条插入报 `product_records_category_fields` 约束错误
- [ ] 第 7 条复制返回新 uuid，且新记录照片被一并复制
- [ ] Storage 中出现 `survey-photos` bucket

完成后回到对话确认，进入**阶段 1 · 前端骨架**。
