# 巡店记录管理软件 (Shop Visit Manager)

移动端优先（手机浏览器）的家电巡店记录工具，用于记录门店内家电产品的出样情况、价格、参数与照片。

数据全部保存在**你自己的 Google 账号**中（Google 表格 + Google 网盘）。

## 产品简介

- 两级数据模型：**巡店单 → 产品记录**
- 产品类别：洗碗机 / 热水器 / 抽油烟机，各类别拥有专属字段
- 支持多图拍照上传、分类别动态表单、筛选统计、Excel/CSV 导出
- 铭牌拍照识别：拍参数标签自动预填硬参数，人工核对后保存

## 架构

```
手机浏览器 (React 网页, GitHub Pages)
      │  HTTPS + 口令
      ▼
Google Apps Script Web App（运行在你的谷歌账号下）
      ├──► Google 表格「巡店记录」（Surveys / Products / Photos / Dict）
      └──► Google 网盘文件夹「ShopVisitPhotos」（图片）
```

## 目录结构

```
apps-script/
  Code.gs            Apps Script 后端（API / 表格读写 / Drive 照片 / 口令 / 统计）
  appsscript.json    清单（clasp 用，可选手动部署）
src/                 前端（React + Vite + Tailwind + shadcn 风格组件）
  components/        UI 组件与布局
  lib/               配置 / API / 字典 / 类型
  pages/             页面
docs/
  01-apps-script-setup.md  零基础搭建教程（先看这个）
```

## 前端开发

```bash
npm install          # 安装依赖
npm run dev          # 本地开发
npm run build        # 类型检查 + 构建到 dist/
npm run deploy       # 构建并发布到 GitHub Pages (gh-pages 分支)
```

设计语言：白底 + 美的蓝（#0098D1 / 主按钮 #007BA8）+ 白色卡片、渐变与关键卡毛玻璃；字体 Inter / SF Pro / 苹方 / 思源黑体。
UI 规范见 [`docs/design/theme-spec.md`](docs/design/theme-spec.md)，颜色与对比度由 `check:contrast`、`audit:theme` 强制校验。
后端地址与口令存于浏览器 localStorage，首次打开在配置页填写。

## 快速开始

1. 按 [`docs/01-apps-script-setup.md`](docs/01-apps-script-setup.md) 创建 Google 表格、粘贴后端、部署 Web App
2. 阶段 1 会生成前端并部署到 GitHub Pages
3. 手机打开网页，输入 Web App URL + 口令即可使用

## 后端 API（Apps Script）

请求：`POST` JSON `{ action, token, payload }`，响应 `{ ok, data | error }`。

| action | 说明 |
|---|---|
| `ping` | 连通性测试（无需口令） |
| `listSurveys` | 巡店单列表（支持日期/渠道/客户/门店/类别/产品名/能效/形态筛选） |
| `getSurvey` | 巡店单详情（含产品与照片） |
| `saveSurvey` / `deleteSurvey` | 保存 / 删除巡店单（级联删产品与照片） |
| `saveProduct` / `deleteProduct` / `duplicateProduct` | 产品记录增删改与复制 |
| `uploadPhoto` / `deletePhoto` | 照片上传（Drive）/ 删除 |
| `dictList` / `dictSave` / `dictDelete` | 字典维护 |
| `stats` | 统计（渠道/客户/门店次数、类别数量、能效占比） |
| `exportData` | 导出全部数据（前端生成 Excel/CSV） |
| `recognizeLabel` | 铭牌拍照识别（DeepSeek deepseek-flash），返回归一化字段 |
| `setAiConfig` / `aiConfigStatus` | 保存 / 查询 AI 识别配置（Key 不回传） |

## 数据表（Google 表格内）

- `Surveys` 巡店单：日期、渠道、客户、门店、备注、状态
- `Products` 产品记录：类别、产品名、参数、价格 + 类别专属字段
- `Photos` 照片：关联巡店单或产品 + Drive 文件 id
- `Dict` 字典：渠道/客户/门店/产品名/形态/能效

## 开发路线（分阶段交付）

| 阶段 | 内容 | 状态 |
|---|---|---|
| 0′ | Apps Script 后端 + Google 表格 | 代码完成，待部署 |
| 1 | 前端骨架（配置页 / Tab 导航 / 设计系统） | 已完成 |
| 2 | 巡店单主流程（列表 / 新建编辑 / 详情 / 删除） | 已完成 |
| 3 | 产品记录与动态字段（分类别表单 / 复制 / 删除） | 已完成 |
| 4 | 照片上传（压缩 / 多图 / 大图预览 / 重试） | 已完成 |
| 4.5 | 首页按门店聚合 + 门店详情页（门店→日期→产品） | 已完成 |
| 4.6 | 批量删除 + 回收站（7 天可恢复） | 已完成 |
| 5 | 筛选搜索 / 统计 / 导出（Excel/CSV） | 已完成 |
| 6 | 字典管理 / 草稿保存 / PWA | 已完成 |

## 安装到手机主屏幕（PWA）

- **iPhone (Safari)**：打开 `https://anoxico.github.io/Ryan-Project/` → 分享 → 添加到主屏幕
- **Android (Chrome)**：打开后 → 菜单 → 安装应用 / 添加到主屏幕
| 6 | 字典设置 / 交互打磨 / PWA | 待开始 |
