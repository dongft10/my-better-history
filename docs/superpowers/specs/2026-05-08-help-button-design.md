# 帮助按钮功能设计文档

**日期**: 2026-05-08  
**功能**: 帮助按钮与弹窗  
**方案**: Vue 3 Composition API + localStorage

## 1. 功能概述

在页面右上角主题切换按钮左侧添加一个帮助按钮（问号图标），点击后打开帮助弹窗，展示扩展简介和操作说明。首次安装使用时自动打开帮助弹窗。

### 1.1 核心功能

- **触发方式**：首次访问自动打开 + 点击帮助按钮手动打开
- **关闭方式**：点击关闭按钮（X）或按 ESC 键
- **多语言支持**：中文、英文、法文三语支持

### 1.2 边界条件

- 首次访问标记存储在 localStorage，键名 `my-better-history-help-seen`
- ESC 键关闭弹窗优先级高于其他 ESC 功能
- 弹窗打开时不影响背景页面滚动

## 2. UI 设计

### 2.1 帮助按钮

**位置：** header 右上角，主题按钮左侧

**样式：**
- 圆形按钮，与主题按钮风格一致
- 问号图标（SVG）
- 背景：`rgba(255, 255, 255, 0.2)`
- Hover 背景：`rgba(255, 255, 255, 0.3)`
- 尺寸：`2.5rem × 2.5rem`

### 2.2 弹窗结构

```
┌─────────────────────────────────┐
│  帮助标题                    [X] │  ← 渐变背景 header
├─────────────────────────────────┤
│                                 │
│  📖 关于扩展                     │  ← 图标 + 标题
│  一句话简介                      │
│                                 │
│  ⌨️ 键盘快捷键                   │
│  ┌─────────┬──────────┐         │
│  │  ↑/↓    │ 导航条目  │         │  ← 快捷键表格
│  │ Enter   │ 打开页面  │         │
│  │ Space   │ 勾选条目  │         │
│  │ ESC     │ 清除/清空 │         │
│  │ Delete  │ 删除勾选  │         │
│  └─────────┴──────────┘         │
│                                 │
│  ✨ 功能特点                     │
│  • 功能1                         │  ← 列表形式
│  • 功能2                         │
│  • 功能3                         │
│                                 │
└─────────────────────────────────┘
```

### 2.3 视觉风格

**现代渐变风格：**
- 弹窗背景：白色（暗色模式：#161b22）
- Header：渐变背景 `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 分区标题：图标 + 标题
- 快捷键：`<kbd>` 标签，灰色背景
- 阴影：`0 20px 60px rgba(0, 0, 0, 0.3)`
- 圆角：`12px`
- 最大宽度：`600px`
- 最大高度：`80vh`

### 2.4 CSS 类名

```css
.help-button { /* 帮助按钮 */ }
.help-modal-overlay { /* 弹窗遮罩层 */ }
.help-modal { /* 弹窗容器 */ }
.help-modal-header { /* 弹窗头部 */ }
.help-modal-close { /* 关闭按钮 */ }
.help-modal-content { /* 弹窗内容 */ }
.help-section { /* 内容分区 */ }
.help-shortcuts { /* 快捷键表格容器 */ }
.shortcut-item { /* 快捷键项 */ }
kbd { /* 快捷键标签 */ }
```

## 3. 数据结构设计

### 3.1 响应式数据

```javascript
const showHelp = ref(false)  // 控制弹窗显示
```

### 3.2 常量定义

```javascript
const HELP_SEEN_KEY = 'my-better-history-help-seen'
```

## 4. 生命周期逻辑

### 4.1 首次访问检测

```javascript
onMounted(() => {
  // 检查是否首次访问
  const hasSeenHelp = localStorage.getItem(HELP_SEEN_KEY)
  if (!hasSeenHelp) {
    showHelp.value = true
    localStorage.setItem(HELP_SEEN_KEY, 'true')
  }
})
```

### 4.2 关闭弹窗时标记已读

```javascript
function closeHelp() {
  showHelp.value = false
  localStorage.setItem(HELP_SEEN_KEY, 'true')
}
```

## 5. 键盘事件处理

### 5.1 ESC 键优先级

在 `handleKeydown` 方法中，ESC 键处理逻辑：

```javascript
case 'Escape':
  event.preventDefault()
  if (showHelp.value) {
    // 弹窗打开时，关闭弹窗
    showHelp.value = false
  } else if (selectedItems.value.size > 0) {
    // 有勾选项时，清空勾选
    clearSelection()
  } else {
    // 无勾选项时，清空搜索框
    clearSearch()
  }
  break
```

**优先级顺序：**
1. 关闭帮助弹窗
2. 清空复选框勾选
3. 清空搜索框

## 6. 多语言支持

### 6.1 多语言文案

**中文 (zh)：**

| Key | 值 |
|-----|-----|
| help | 帮助 |
| helpTitle | 帮助 |
| helpAboutTitle | 关于扩展 |
| helpAboutDesc | My Better History 是一款现代化的浏览器历史记录管理扩展，让您轻松浏览、搜索和管理浏览历史。 |
| helpShortcutsTitle | 键盘快捷键 |
| helpArrowKeys | 在搜索结果中导航 |
| helpEnter | 打开或切换到页面 |
| helpSpace | 勾选/取消勾选条目 |
| helpEsc | 清除勾选或清空搜索 |
| helpDelete | 删除勾选的条目 |
| helpFeaturesTitle | 功能特点 |
| helpFeature1 | 快速搜索和过滤历史记录 |
| helpFeature2 | 支持批量选择和删除 |
| helpFeature3 | 自动检测已打开的标签页 |
| helpFeature4 | 支持明暗主题切换 |

**英文 (en)：**

| Key | 值 |
|-----|-----|
| help | Help |
| helpTitle | Help |
| helpAboutTitle | About |
| helpAboutDesc | My Better History is a modern browser history manager extension that makes it easy to browse, search, and manage your browsing history. |
| helpShortcutsTitle | Keyboard Shortcuts |
| helpArrowKeys | Navigate through results |
| helpEnter | Open or switch to page |
| helpSpace | Select/deselect item |
| helpEsc | Clear selection or search |
| helpDelete | Delete selected items |
| helpFeaturesTitle | Features |
| helpFeature1 | Quick search and filter history |
| helpFeature2 | Batch select and delete |
| helpFeature3 | Auto-detect opened tabs |
| helpFeature4 | Light/dark theme support |

**法文 (fr)：**

| Key | 值 |
|-----|-----|
| help | Aide |
| helpTitle | Aide |
| helpAboutTitle | À propos |
| helpAboutDesc | My Better History est une extension moderne de gestion de l'historique du navigateur qui permet de parcourir, rechercher et gérer facilement votre historique de navigation. |
| helpShortcutsTitle | Raccourcis clavier |
| helpArrowKeys | Naviguer dans les résultats |
| helpEnter | Ouvrir ou basculer vers la page |
| helpSpace | Sélectionner/désélectionner |
| helpEsc | Effacer la sélection ou la recherche |
| helpDelete | Supprimer les éléments sélectionnés |
| helpFeaturesTitle | Fonctionnalités |
| helpFeature1 | Recherche et filtrage rapides |
| helpFeature2 | Sélection et suppression par lots |
| helpFeature3 | Détection automatique des onglets ouverts |
| helpFeature4 | Support thème clair/sombre |

### 6.2 文件修改

需要更新以下文件：
- `public/locales/en/messages.json`
- `public/locales/zh/messages.json`
- `public/locales/fr/messages.json`

## 7. 文件修改清单

### 7.1 主要修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/views/HistoryView.vue` | 添加帮助按钮、弹窗组件、事件处理逻辑、CSS 样式 |
| `public/locales/en/messages.json` | 添加英文翻译 |
| `public/locales/zh/messages.json` | 添加中文翻译 |
| `public/locales/fr/messages.json` | 添加法文翻译 |

### 7.2 修改详情

**HistoryView.vue 修改：**
- 模板：添加帮助按钮和弹窗 HTML 结构
- Script：
  - 添加 `showHelp` ref
  - 添加 `HELP_SEEN_KEY` 常量
  - 修改 `onMounted` 添加首次访问检测
  - 修改 `handleKeydown` 添加 ESC 关闭弹窗逻辑
- Style：添加所有相关 CSS 类

**messages.json 修改：**
- 添加上述所有多语言文案

## 8. 测试要点

### 8.1 功能测试

- [ ] 首次安装扩展后，打开页面自动显示帮助弹窗
- [ ] 点击帮助按钮能打开弹窗
- [ ] 点击关闭按钮能关闭弹窗
- [ ] 按 ESC 键能关闭弹窗
- [ ] 弹窗关闭后再次点击帮助按钮能重新打开
- [ ] 刷新页面后不会自动打开弹窗（localStorage 已标记）
- [ ] 清除 localStorage 后刷新页面会自动打开弹窗

### 8.2 样式测试

- [ ] 帮助按钮与主题按钮风格一致
- [ ] 弹窗使用渐变风格
- [ ] 暗色模式下弹窗样式正确
- [ ] 弹窗居中显示
- [ ] 快捷键表格排版整齐

### 8.3 多语言测试

- [ ] 英文环境下显示英文内容
- [ ] 中文环境下显示中文内容
- [ ] 法文环境下显示法文内容

### 8.4 键盘交互测试

- [ ] ESC 键优先关闭弹窗
- [ ] 弹窗关闭后，ESC 键执行其他功能
- [ ] 弹窗打开时不影响页面背景

### 8.5 边界测试

- [ ] 清除 localStorage 后首次访问
- [ ] 不同浏览器语言设置
- [ ] 小屏幕下弹窗适配

## 9. 注意事项

1. **localStorage 键名**：使用 `my-better-history-help-seen` 避免与其他扩展冲突
2. **ESC 键优先级**：帮助弹窗优先级最高，确保用户能快速关闭
3. **多语言一致性**：确保三种语言的文案意思一致
4. **性能优化**：弹窗使用 `v-if` 而非 `v-show`，减少初始渲染开销
5. **可访问性**：关闭按钮添加 `aria-label` 属性
