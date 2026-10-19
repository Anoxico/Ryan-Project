# 阶段 0′ · Apps Script 后端 + Google 表格搭建（手把手）

本教程面向零基础。请**一次只做一步**，遇到不懂随时问我。
全部完成后，你的数据（巡店单、产品、照片）都会存在**你自己的 Google 账号**里。

预计耗时：15–20 分钟。

---

## 第 1 步：新建 Google 表格

1. 浏览器打开 https://sheets.google.com
2. 点左上角 **空白表格**（Blank spreadsheet）
3. 点左上角标题「无标题电子表格」，改名为 **巡店记录**，回车
4. 保持这个标签页不要关

做完回我「第 1 步好了」。

---

## 第 2 步：打开 Apps Script 并粘贴代码

1. 在表格顶部菜单点 **扩展程序（Extensions）**
2. 选择 **Apps Script**
3. 会打开一个新标签页，里面有一段 `function myFunction() {}`
4. 把编辑框里的内容**全选删除**（Cmd+A 然后 Delete）
5. 打开本项目里的文件 `apps-script/Code.gs`，**全选复制**，粘贴进编辑框
6. 找到最上面一行 `const SHARED_TOKEN = 'CHANGE_ME_2026';`
   - 把 `CHANGE_ME_2026` 改成**你自己的口令**（例如 `ryan-rose-2026`），记住它，前端登录要用
7. 按 **Cmd+S** 保存，项目名可改成 **巡店后端**

做完回我「第 2 步好了」。

---

## 第 3 步：运行 init() 并授权

1. 编辑器上方有一个下拉框，默认显示 `myFunction`，点开选 **init**
2. 点旁边的 **运行（Run）** 按钮（▶）
3. 第一次会弹出授权窗口：
   - **查看权限 / Review permissions**
   - 选你的 Google 账号
   - 若提示「Google 尚未验证此应用」→ 点 **高级（Advanced）** → **转到巡店后端（不安全）**
   - 点 **允许（Allow）**
4. 回到 Google 表格标签页，你会看到底部多出 4 个工作表：`Surveys`、`Products`、`Photos`、`Dict`

做完回我「第 3 步好了」。

---

## 第 4 步：部署为 Web App 并复制 URL

1. Apps Script 页面右上角点 **部署（Deploy）→ 新建部署（New deployment）**
2. 左侧齿轮 ⚙️ 旁点 **选择类型** → 选 **Web 应用（Web app）**
3. 填写：
   - 说明：`v1`
   - **执行身份（Execute as）**：**我（Me）**
   - **谁可以访问（Who has access）**：**任何人（Anyone）**
4. 点 **部署（Deploy）**
5. 复制出现的 **Web 应用 URL**（形如 `https://script.google.com/macros/s/AKfy.../exec`）
6. 把这个 URL 发给我（它不敏感，但我需要它来配置前端和自测）

> 注意：以后改了代码，要点 **部署 → 管理部署 → 编辑（铅笔图标）→ 版本选「新版本」→ 部署**，否则线上还是旧代码。

做完回我「第 4 步好了」并附上 URL。

---

## 第 5 步：开启 GitHub Pages

1. 浏览器打开 https://github.com/Anoxico/Ryan-Project/settings/pages
2. **Source** 选择 **Deploy from a branch**
3. **Branch** 选 **gh-pages**，文件夹选 **/ (root)**，点 **Save**
4. 稍等 1–2 分钟，页面顶部会出现网址 `https://anoxico.github.io/Ryan-Project/`

> `gh-pages` 分支会在阶段 1 由我推送生成。若此时看不到该分支，先跳过此步，等阶段 1 完成后再来。

做完（或跳过）回我「第 5 步好了」。

---

## 之后怎么用

1. 手机浏览器打开 `https://anoxico.github.io/Ryan-Project/`
2. 首次进入会让你填 **Web App URL** 和 **口令**，填一次后自动记住
3. 开始记录巡店

---

## 可选：开启铭牌识别

1. 准备一个支持图片识别的 API Key（如 Google Gemini）。
   - Gemini：到 https://aistudio.google.com/apikey 创建 Key
2. 部署好前端后，手机打开 App → 底部「设置」→ 找到「AI 识别」
3. 提供方选 `Gemini`，粘贴 Key，模型名保持 `gemini-2.5-flash`（可按需更换）
4. 点「保存 AI 配置」，状态显示「已配置」即完成
5. 在新增产品页点「拍照识别铭牌」拍照，识别结果会自动预填，请核对后再保存

> Key 存在你 Google 账号的 Apps Script 属性里，不会显示在浏览器。
> 若用其他厂商（OpenAI 兼容），提供方选 `OpenAI 兼容`，填对应 Base URL 与模型名。

> 注意：铭牌识别与 AI 配置接口在最新 `Code.gs` 中，请先按第 4 步把后端**重新部署新版本**，否则设置页读不到配置状态。

---

## 常见问题

**Q：照片存在哪里？**
存在你 Google 网盘根目录的 `ShopVisitPhotos` 文件夹里。

**Q：别人拿到网页链接能用吗？**
没有口令进不去；口令校验在 Apps Script 后端完成。

**Q：数据能直接看/改吗？**
能。打开那个「巡店记录」Google 表格即可，就是普通表格。

**Q：改了口令代码怎么办？**
改完 Code.gs 里的 `SHARED_TOKEN`，重新部署新版本，然后在前端设置里更新口令。
