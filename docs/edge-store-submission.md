# Edge Add-ons 上架准备清单

> 目标：将 My Better History 提交到 Microsoft Edge 扩展商店（Edge Add-ons）。
> 本文档为提交前的核对清单与素材规格。提交入口：https://partner.microsoft.com/dashboard/microsoftedge/publish

## 一、开发者账号（前置，非代码）

- [ ] 注册 Microsoft Partner Center 账号（个人/企业均可）
- [ ] 完成开发者身份验证
- [ ] 首次提交需缴纳一次性注册费（如有变动以官方为准）

## 二、扩展包（Package）

- [ ] 打包为 **ZIP**，`manifest.json` 位于 zip 根目录（`npm run build-extension` 生成于 `output/release/my-better-history-v{version}.zip`）✅ 已验证：含 manifest、background.js、index.html/assets、icons 16/32/48/128、_locales 三语
- [ ] manifest_version 3
- [ ] `name` / `version`（1.2.1）/ `description` 已就绪（描述已改为中性文案，不提及特定浏览器/商店）
- [ ] 图标：16 / 32 / 48 / 128 PNG 齐全（已补充 32）
- [ ] 不包含 `update_url`（商店自动管理更新）
- [ ] `default_locale: "en"` 且包内含 `_locales/`（构建脚本已处理）
- [ ] 权限与 host_permissions 已在 PRIVACY.md 中说明

## 三、商店列表（Store Listing）素材

| 素材 | 要求 | 状态 |
|---|---|---|
| 名称 Name | ≤ 45 字符（"My Better History" = 16 ✓） | ✅ |
| 简短描述 Short description | ≤ 80 字符 | 见 `store-listing.md` |
| 完整描述 Description | 详细介绍功能/用途 | 见 `store-listing.md` |
| 图标（商店 Logo） | 128×128 PNG | ✅ `public/icons/icon-128.png` |
| 截图 Screenshots | 1–5 张，1280×800 或 640×400（16:10 或 8:5） | ⚠️ **待截图**（见下） |
| 类别 Category | Productivity / Tools | 建议 Productivity |
| 隐私政策 URL | **必须**（history/tabs 权限） | ⚠️ **待托管**（见下） |

### 截图（需人工完成）
1. 加载扩展（`output/dist`）→ 打开历史页，截图主界面（含日历侧栏）
2. 点击某日期展示当日记录
3. 展示暗色主题界面
4. 展示搜索功能效果
5. 帮助弹窗（含友情推荐模块）
- 尺寸建议 1280×800，PNG/JPG，命名如 `screenshot-1.png` 等，放入 `docs/screenshots/`

### 隐私政策托管（需人工完成）
- `PRIVACY.md` 内容已完整，但 Edge 要求一个**公网可访问的 URL**
- 建议：推送到 GitHub 后用 raw URL 或开启 GitHub Pages 托管，例如：
  `https://raw.githubusercontent.com/dongft10/my-better-history/main/PRIVACY.md`
  （或建 `gh-pages` 分支提供页面版）

## 四、Edge 兼容性自查

- [x] `chrome_url_overrides.history`：Edge 支持
- [x] `history` / `tabs` / `favicon` 权限：Edge 支持
- [x] MV3 service worker `background.js`：Edge 支持
- [x] `web_accessible_resources` + CSP：标准 MV3 用法
- [x] 浏览器识别代码（`/Edg\//`）已用于商店链接分流，提交前建议在 **Edge 实机**走一遍功能冒烟（历史加载、删除、搜索、日历、帮助弹窗）

## 五、提交流程

1. Partner Center → "Create new extension" → 上传 zip
2. 填写列表素材（复制 `store-listing.md` 内容）
3. 填写隐私政策 URL
4. 提交审核（首次审核一般数天）

## 六、审核常见驳回点（避免踩坑）

- 描述中出现其他商店名称/浏览器名（已规避）
- 截图与功能不符、有个人信息泄漏
- 权限无法自圆其说（PRIVACY.md 已逐条说明）
- 版本号格式非 `x.y.z`（当前 1.2.1 ✓）
- zip 内有多余文件（构建脚本只打 dist 内容 ✓；`icons/README.md` 为可选项，介意可移出 `public/icons/` 再构建）
