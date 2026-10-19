-- ============================================================
-- 巡店记录管理软件 · 阶段 0 Storage 配置
-- bucket: survey-photos （照片）
-- 单用户模式：公开读，允许写入
-- ============================================================

-- 创建 bucket（幂等）
insert into storage.buckets (id, name, public)
values ('survey-photos', 'survey-photos', true)
on conflict (id) do update set public = excluded.public;

-- 清理旧策略（幂等）
drop policy if exists "survey_photos_public_read"   on storage.objects;
drop policy if exists "survey_photos_public_insert" on storage.objects;
drop policy if exists "survey_photos_public_update" on storage.objects;
drop policy if exists "survey_photos_public_delete" on storage.objects;

-- 公开读取
create policy "survey_photos_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'survey-photos');

-- 允许上传
create policy "survey_photos_public_insert"
  on storage.objects for insert
  to public
  with check (bucket_id = 'survey-photos');

-- 允许覆盖
create policy "survey_photos_public_update"
  on storage.objects for update
  to public
  using (bucket_id = 'survey-photos')
  with check (bucket_id = 'survey-photos');

-- 允许删除
create policy "survey_photos_public_delete"
  on storage.objects for delete
  to public
  using (bucket_id = 'survey-photos');
