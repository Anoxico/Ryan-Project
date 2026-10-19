-- ============================================================
-- 巡店记录管理软件 · 阶段 0 RLS 策略
-- 当前为单用户模式：anon / authenticated 均可读写
-- 多用户扩展：将 using/with check 改为 (auth.uid() = user_id)
-- ============================================================

alter table dict_options    enable row level security;
alter table surveys         enable row level security;
alter table product_records enable row level security;
alter table photos          enable row level security;

-- 清理旧策略（幂等）
drop policy if exists dict_options_allow_all    on dict_options;
drop policy if exists surveys_allow_all         on surveys;
drop policy if exists product_records_allow_all on product_records;
drop policy if exists photos_allow_all          on photos;

-- 单用户：允许全部操作（to public 覆盖 anon 与 authenticated）
create policy dict_options_allow_all
  on dict_options for all
  to public
  using (true) with check (true);

create policy surveys_allow_all
  on surveys for all
  to public
  using (true) with check (true);

create policy product_records_allow_all
  on product_records for all
  to public
  using (true) with check (true);

create policy photos_allow_all
  on photos for all
  to public
  using (true) with check (true);

-- ------------------------------------------------------------
-- 多用户扩展示例（启用登录后，取消注释并删除上面的 allow_all）
-- ------------------------------------------------------------
-- drop policy dict_options_allow_all on dict_options;  -- 字典通常全局共享，可保留
--
-- create policy surveys_owner_all on surveys for all to authenticated
--   using (auth.uid() = user_id) with check (auth.uid() = user_id);
--
-- create policy product_records_owner_all on product_records for all to authenticated
--   using (exists (select 1 from surveys s
--                  where s.id = product_records.survey_id and s.user_id = auth.uid()))
--   with check (exists (select 1 from surveys s
--                       where s.id = product_records.survey_id and s.user_id = auth.uid()));
--
-- create policy photos_owner_all on photos for all to authenticated
--   using (
--     (survey_id  is not null and exists (select 1 from surveys s
--         where s.id = photos.survey_id and s.user_id = auth.uid()))
--     or
--     (product_id is not null and exists (select 1 from product_records p
--         join surveys s on s.id = p.survey_id
--         where p.id = photos.product_id and s.user_id = auth.uid()))
--   )
--   with check (true);
