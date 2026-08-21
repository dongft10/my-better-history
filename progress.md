# progress.md — 项目进度交接文档

> **本文档用途**：MyBetterHistory 项目的全量进度快照，供新开会话时快速恢复上下文。
> **维护方式**：每次新会话开始时，用户会要求「将历史会话内容总结后**全量覆盖**更新到本文件」。因此本文始终只保留最新完整快照，**不追加、不累积历史**，避免文档无限膨胀。
> **最后更新**：2026-08-21（含当日双轴审查结论的修复）

---

## 一、项目概览

- **名称**：MyBetterHistory（我的更好历史）— Chrome / Edge 历史记录增强扩展
- **仓库**：`github.com/dongft10/my-better-history`（origin）
- **技术栈**：Vue 3 + Vite + JavaScript；Manifest V3 扩展
- **定位**：通过 `chrome_url_overrides.history` 替换浏览器历史页（`index.html`）；命令 `_execute_action`（Alt+H）打开扩展页
- **独立小项目（已完结）**：`E:\Workspace\dsh\tmp\snake-game`（网页版贪吃蛇，index.html/style.css/game.js，完整可用）

---

## 二、当前状态快照（2026-08-21）

- **分支**：`prep/edge-store` @ `4316baa`（「docs: 文档同步移除法文提及（仅保留中英），历史归档规格文档除外」），与 `origin/prep/edge-store` 同步
- **工作树**：审查修复相关文件有未提交改动（含 `docs/edge-store-submission.md` 的用户手动修改，已顺带修正版本号）
- **版本**：`1.2.2`（manifest.json、package.json、package-lock 三处一致）
- **主干**：`dev/main` @ `5a7ba7e`（日历功能已合并）
- **测试**：32/32 通过；双平台构建通过；Chrome/Edge 发布 zip 由**用户手动分别打包**（当前 `output/release/` 含 `my-better-history-edge-v1.2.2.zip`，Chrome 包按需另行打包）
- 已对今日改动完成双轴审查（Standards/Spec）并按结论修复（内容见 `git diff`）

---

## 三、已完成功能（按时间线）

### 1. 深色主题头部（`feature/dark-theme-header` → 已合并 dev/main，`370cc4e`）

- 调整 header 颜色适配深色主题，**含帮助弹窗头部**配色

### 2. 帮助弹窗（已合并）

- 分隔线 + 「友情推荐」模块，推荐 **MyTabSearch**
- 按浏览器 UA 显示对应商店链接（Chrome 商店 / Edge 商店）
- 多语 i18n（当时为 zh/en/fr，法文后续已移除）

### 3. 日历功能（`feature/date-calendar` → dev/main @ `5a7ba7e`）

- 左上浮动日历组件 `DateCalendar.vue`，点击日期 → 展示当天记录
- **按天加载（方案A）**：`collectDayStarts` / `loadRangeByDay`，配合 `getVisits` 精确日归属
- `dayKey`（`toDateString()`）分组，组按日期**倒序**排序
- 「昨天」过滤只显示昨天；header 今日/昨日链接联动日历选中；前/后一天箭头（右箭头到今天时禁用）
- 月份切换事件修复（`month-change` emit + watch selected 月份跳转）
- 搜索自动切到「全部」，清空后恢复；**拼音回退搜索**（严格音节匹配 + 高亮）
- 月历活动点：按天查询 + 缓存 + seq guard，修正 `lastVisitTime` 误归属问题
- Vitest 32 个测试全部通过

### 4. Edge 商店上架准备（`prep/edge-store`，**尚未合并 dev/main**）

- manifest 描述中性化（不提及特定浏览器/商店）；补充 32px 图标；版本 1.2.2
- 文档三件套：
  - `docs/edge-store-submission.md` — 提交核对清单与素材规格
  - `docs/store-listing.md` — 商店名称/简短描述/完整描述（zh 526 字符 / en 244 词、约 1500 字符；若 Edge 按字符计上限 1000，英文版需精简，以 Partner Center 校验为准）
  - `docs/permissions-justification.md` — 权限申请理由（zh+en，无 "Chrome" 字样）
- `build-edge.bat`：与 Chrome 包共用 `output/dist`，zip 后缀 `-edge-`（`my-better-history-edge-v1.2.2.zip`），互不覆盖
- Edge 特有 Ctrl+H 面板提示：仅窄窗口（<640px，`EDGE_HINT_BREAKPOINT`）显示
- manifest `name`/`description`/`action.default_title` 本地化：`__MSG_application_title__` / `__MSG_application_description__`（`_locales` 中 en/zh\_CN），`default_locale: "en"`

### 5. 法文移除（用户 `2402340` + 助手 `4316baa`）

- 用户：删除 `src/i18n/fr.js`、`public/locales/fr`、DateCalendar 法文分支、图标更新
- 助手：README、`docs/design.md`、`docs/store-listing.md` 中的法文提及移除（`docs/design.md` L254「支持英语、中文、法语等主流语言」于审查修复中补删）
- `docs/superpowers/specs/2026-05-08-help-button-design.md` 保留不动（历史归档）

---

## 四、关键技术点与设计决策

### chrome.history API 语义（实测确认）

- `chrome.history.search({startTime,endTime})` 返回**按 URL 去重**的 HistoryItem，`lastVisitTime` = 该 URL 的**最近一次访问时间（可能超出查询区间）**；区间过滤语义 = 「区间内有任意一次访问」
- 精确到天的归属**必须**用 `chrome.history.getVisits` 拿逐次访问时间
- 这就是 `dayKey`（`toDateString()`）按天归组设计的事实依据

### 按天加载

- `collectDayStarts` 生成各天 `[start,end)` 区间；`loadRangeByDay(startTime,endTime,historyApi,{concurrency})` 并行加载，返回 `{items, oldestDayStart}`（`oldestDayStart` = **最早**天，用于向后分页）
- 单天上限 `MAX_DAY_VISITS = 1000`

### 分组与过滤

- `groupByDay`：dayKey 分组，日期**倒序**排列（早前 bug：未按日期排序导致「某日缺失」的假象）
- `filterByQuery`：先子串匹配；query 像拼音时走拼音回退匹配

### 拼音严格匹配（`src/utils/pinyin.js`）

- `pinyin-pro` 的 `pinyin(text,{type:'array',toneType:'none'})` 逐字符转拼音
- **严格音节匹配**：每个字符要么消耗完整音节、要么消耗首字母（zh/ch/sh 为两字母或单字母），返回 `{start,end}` 供高亮
- **刻意拒绝** `pinyin-pro` 的 `match()`：其松散字母序列模糊匹配会误命中（如 "jiazai" 匹配到 金钱/自/众软件）

### i18n

- `src/i18n/index.js`：按 `chrome.i18n.getUILanguage()` 选择（zh\* → zh-CN，否则 en；fr 已删）
- manifest 层用 `__MSG_` 占位符 + `_locales/{en,zh_CN}/messages.json`（仅 `application_title`、`application_description` 两项）

### 商店提交规则

- **红线口径**：商店提交类文档（store-listing / permissions-justification）不得出现 "Chrome" 字样；README.md、docs/design.md 等非提交文档可保留（它们本就是"Chrome 扩展"的技术说明，不提交商店）
- 商店展示语言在 Partner Center 单独配置，与包内 `_locales` 无关

### 构建流程

- Vite `outDir` = `output/dist`（`vite.config.js` 默认；`build-extension.mjs` 传 `--out` 时经 `VITE_OUT_DIR` 环境变量覆盖，`--out` 自定义目录**完整可用**）
- `scripts/build-extension.mjs` 支持 `--edge` / `--out` 参数，`applyPlatformTweaks(manifest,isEdge)` 平台调整钩子，`locales` → `_locales` 重命名
- `build.bat` / `build-edge.bat`：只清理 `output\dist`，**保留** `output/release` 下的历史 zip
- `output/` 已 gitignore（无 `edge/` 条目）

### 关键常量

- `MAX_DAY_VISITS = 1000`（单天记录上限）
- 按天加载并发 = `loadRangeByDay` 的 `concurrency` 参数默认值 6（非独立常量）
- `EDGE_HINT_BREAKPOINT = 640`（Edge Ctrl+H 提示显示阈值）
- `CALENDAR_AUTO_HIDE_BREAKPOINT = 1766`（日历自动隐藏断点，用户从 768 手动调大）

---

## 五、关键文件地图

| 文件                                                  | 职责                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/views/HistoryView.vue`                         | 主视图：header、Edge 提示条、工具栏（时间过滤+日历开关）、浮动日历、按天分组历史列表；`loadHistory`/`loadDayVisits`/`loadRangeByDay`/`loadMoreHistory`/`runSearch`/`searchByPinyin`/`loadMonthActivity`/`setTimeFilter`/`toggleCalendar`/`handleResize`/`highlightText`；缓存 `dayVisitsCache`/`monthActivityCache`（删除记录时清理）；`isEdgeBrowser`/`isNarrowView`/`calendarVisible`/`userToggledCalendar`；搜索规整公共函数 `normalizeResults` |
| `src/components/DateCalendar.vue`                   | 日历组件：周日开头、`todayKey` 每分钟刷新、前/后一天箭头、emit `select`/`month-change`；活动点边框 `rgba(108,108,208,0.7)`、hover `rgba(108,108,208,0.25)`                                                                                                                                                                                                                                |
| `src/utils/date.js`                                 | `toDateKey(d)` → 'YYYY-MM-DD'                                                                                                                                                                                                                                                                                                                               |
| `src/utils/history.js`                              | `collectDayStarts`、`loadRangeByDay`、`groupByDay`、`filterByQuery`（导入拼音工具）                                                                                                                                                                                                                                                                                    |
| `src/utils/pinyin.js`                               | `isPinyinLike`、`strictPinyinRange`、`pinyinMatches`                                                                                                                                                                                                                                                                                                          |
| `src/i18n/{index,en,zh-CN}.js`                      | UI 文案（fr.js 已删除）                                                                                                                                                                                                                                                                                                                                            |
| `public/locales/{en,zh_CN}/messages.json`           | 仅 `application_title`（"MyBetterHistory"）、`application_description`（中性文案）                                                                                                                                                                                                                                                                                  |
| `manifest.json`                                     | v1.2.2；permissions `["history","tabs","favicon"]`；host\_permissions 5 个 favicon 服务；icons 16/32/48/128；`default_locale:"en"`；`action.default_title` 用 `__MSG_application_title__`                                                                                                                                     |
| `public/index.html`                                 | Vite 入口（favicon 由用户手动处理）                                                                                                                                                                                                                                                                                                                                    |
| `scripts/build-extension.mjs`                       | 构建脚本（`--edge`/`--out`，`--out` 经 `VITE_OUT_DIR` 完整生效）                                                                                                                                                                                                                                                                                                          |
| `build.bat` / `build-edge.bat`                      | Windows 一键构建（Chrome / Edge）                                                                                                                                                                                                                                                                                                                                 |
| `docs/edge-store-submission.md`                     | Edge 上架核对清单（版本号已更新为 1.2.2）                                                                                                                                                                                                                                                                                                                                  |
| `docs/store-listing.md`                             | 商店列表文案（中英，无法文；字数口径已修正）                                                                                                                                                                                                                                                                                                                                          |
| `docs/permissions-justification.md`                 | 权限理由说明（zh+en，无 "Chrome" 字样）                                                                                                                                                                                                                                                                                                                                 |
| `src/utils/__tests__/{date,history,pinyin}.test.js` | 32 个单元测试                                                                                                                                                                                                                                                                                                                                                    |
| （Chrome 包）`output/release/my-better-history-v1.2.2.zip` | Chrome 发布包（用户手动分别打包，当前未生成；`build.bat` 可生成）                                                                                                                                                                                                                                                                                                                      |
| `output/release/my-better-history-edge-v1.2.2.zip`  | Edge 发布包（当前已生成）                                                                                                                                                                                                                                                                                                                                              |

---

## 六、测试

- 命令：`npm test`（= `vitest run`）
- 范围：`src/utils/__tests__/` 下 date / history / pinyin 三个测试文件，**32 个测试全部通过**

---

## 七、已修复的问题与经验教训

| 问题                                               | 根因 / 修复                                                                |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| 拼音搜索结果为空（"sousuo"）                               | `filterByQuery` 二次子串过滤误删拼音结果 → 拼音回退进 `filterByQuery`（commit `e76b142`） |
| 拼音误命中（"jiazai" 匹配 金钱/自/众软件）                      | `pinyin-pro match()` 松散匹配 → 自研严格音节匹配器                                  |
| 拼音高亮缺失                                           | 引入 `strictPinyinRange` 供 `highlightText` 使用                            |
| 「某日缺失」（"18日 missing" 假象）                         | 分组未按日期排序 → `groupByDay` 按日期倒序                                          |
| 分页加载断裂                                           | `oldestDayStart` 被覆盖为最新天 → 提取到 utils 并取**最早**天                         |
| 月历活动点归属错误                                        | 用 `lastVisitTime` 误归属 → 按天查询 + 缓存 + seq guard                          |
| 构建脚本提示路径错误                                       | 最终消息引用 `output/release` 写死 → 改为 `${outDirName}/release`                |
| 两个 vitest 失败                                     | 对 `collectDayStarts(now,now)` 边界假设错误 → 按午夜边界修正测试                       |
| pinyin.test.js 解析错误                              | `it()` 字符串内 ASCII 引号 → 改用『』                                            |
| `chrome.history.search` 返回的 lastVisitTime 超出查询区间 | 区间语义为「区间内有任意访问」→ 按天加载 + `getVisits` 精确归属 + `dayKey` 设计                 |
| `--out` 选项失效（审查发现）                              | vite `outDir` 硬编码 → `VITE_OUT_DIR` 环境变量覆盖；头注释同步修正                     |
| mock 搜索分支无拼音兜底（审查发现）                           | 与真实分支行为不一致 → mock 分支补 `isPinyinLike` + `pinyinMatches` 兜底             |

---

## 八、分支与提交状态

- **`dev/main`** @ `5a7ba7e`：主干，日历已合并（= 当前功能全集）
- **`prep/edge-store`** @ `4316baa`：**当前分支**，Edge 上架准备，**尚未合并 dev/main**
- **`feature/date-calendar`**、**`feature/dark-theme-header`**：origin 上仍存在，内容已并入 dev/main，未删除
- 今日 19 个提交完整列表：`git log 5a7ba7e..HEAD --oneline`
- 用户亲手提交：版本 1.2.2（`12c0009`）、断点调整（`f07c106`）、法文移除（`2402340`）；更早有 1.2.1（`7e76606`）
- 其余今日提交（Edge 上架准备、拼音搜索、日历按钮、构建脚本、i18n、法文文档等）由助手经会话完成；git 作者均显示 dongft10，「用户/助手」归属依据会话记录，无法从 git 区分

---

## 九、待办事项（用户侧，Edge 上架）

- [ ] 商店截图（1280×800）
- [ ] PRIVACY.md 托管为可访问 URL（隐私政策地址，供 Partner Center 填写）
- [ ] Partner Center 配置列表语言（如 zh-CN 等）
- [ ] 上传 `output/release/my-better-history-edge-v1.2.2.zip`（Chrome 包由用户手动打包后另行上传）
- [ ] 提交前在 Partner Center 核对描述字数校验（英文约 1500 字符，若按字符计上限 1000 需精简）

---

## 十、协作约定（重要）

- **"/new" 重置话题**：用户发 `/new` 表示开启新话题，助手应归档当前状态（更新本文件）
- **新会话恢复流程**：用户说「将历史会话内容总结后更新到 progress.md」→ 助手总结并**全量覆盖**本文（不追加）
- **手动调整**：用户经常手动改图标、断点、颜色，且可能自己提交（如断点 768→1766、法文移除）；助手不做多余干预
- **提交时机**：助手只在用户**明确要求**时检查并提交改动
- **工作方式**：先分析、后实现
- **文案红线**：商店提交类文档禁止出现 "Chrome" 字样（README/design 等非提交文档不受限）；代码内 `chrome.*` 正常使用（Edge 兼容）
- **帮助弹窗推荐文案**：`helpRecommendDesc` 结尾的 😄🎉 emoji 是用户特意加的（烘托推荐气氛），**不要移除**
- 上架文档与代码分离：商店列表语言在 Partner Center 配置，与 `_locales` 无关
