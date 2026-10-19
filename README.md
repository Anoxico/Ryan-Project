# 巡店记录管理软件 (Shop Visit Manager)

移动端优先（手机浏览器）的家电巡店记录工具，用于记录门店内家电产品的出样情况、价格、参数与照片。

## 产品简介

- 两级数据模型：**巡店单 → 产品记录**
- 产品类别：洗碗机 / 热水器 / 抽油烟机，各类别拥有专属字段
- 支持多图拍照上传、分类别动态表单、筛选统计、Excel/CSV 导出

## 技术栈

- 前端：React + Vite + TypeScript + Tailwind CSS
- 数据：Supabase（PostgreSQL + Storage）
- 表单：react-hook-form + zod
- 导出：SheetJS (xlsx)

## 目录结构

```
supabase/
  migrations/          数据库迁移脚本（按序执行）
    0001_schema.sql    枚举 / 表 / 约束 / 索引 / 触发器
    0002_rls.sql       行级安全策略
    0003_functions.sql 业务函数与统计 RPC
    0004_storage.sql   照片 Storage bucket 配置
  seed.sql             字典与示例数据
docs/
  00-database-setup.md 数据库搭建与验证说明
```

## 数据库搭建

参见 [`docs/00-database-setup.md`](docs/00-database-setup.md)：在 Supabase 项目 SQL Editor 中按 `0001 → 0004 → seed` 顺序执行即可。

## 开发路线（分阶段交付）

| 阶段 | 内容 | 状态 |
|---|---|---|
| 0 | 数据库与存储 | 已完成 |
| 1 | 前端骨架 | 待开始 |
| 2 | 巡店单主流程 | 待开始 |
| 3 | 产品记录与动态字段 | 待开始 |
| 4 | 照片上传 | 待开始 |
| 5 | 筛选搜索 / 统计 / 导出 | 待开始 |
| 6 | 字典设置 / 交互打磨 / PWA | 待开始 |

## 数据模型概览

- `surveys` 巡店单（日期、渠道、客户、门店、备注、状态）
- `product_records` 产品记录（类别、产品名、参数、价格 + 类别专属字段）
- `photos` 照片（巡店单级 / 产品级，二选一）
- `dict_options` 字典（渠道/客户/门店/产品名/形态/能效，支持自动补全）
