# 键盘导航功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为历史记录搜索结果列表添加键盘导航功能，允许用户通过键盘快速浏览和操作历史记录。

**Architecture:** 使用 Vue 3 Composition API 的 ref 和 computed 实现响应式键盘导航。在搜索框添加 keydown 事件监听，通过计算属性管理扁平化的过滤列表，使用 Chrome Extension tabs API 实现标签页检测与切换。

**Tech Stack:** Vue 3 Composition API, Chrome Extension API (tabs), Tailwind CSS

---

## 文件结构

**修改文件：**
- `src/views/HistoryView.vue` - 添加键盘导航核心逻辑和 UI 样式

**修改内容：**
- 添加响应式数据：`keyboardSelectedIndex` ref
- 添加计算属性：`flatFilteredItems`, `keyboardSelectedItem`
- 添加 watch：监听 `flatFilteredItems` 变化自动初始化选中状态
- 添加方法：`handleKeydown`, `scrollToSelectedItem`, `openOrSwitchToTab`, `isKeyboardSelected`
- 修改模板：在搜索框添加 `@keydown` 事件，在历史条目添加 `.keyboard-selected` 类绑定
- 修改样式：添加 `.keyboard-selected` CSS 类

---

### Task 1: 添加响应式数据和计算属性

**Files:**
- Modify: `src/views/HistoryView.vue:236-252`

- [ ] **Step 1: 在 script setup 中添加响应式数据**

在 `contentRef` 定义之后添加：

```javascript
const keyboardSelectedIndex = ref(-1)
```

- [ ] **Step 2: 添加 flatFilteredItems 计算属性**

在 `groupedHistory` 计算属性之后添加：

```javascript
const flatFilteredItems = computed(() => {
  const items = []
  Object.values(groupedHistory.value).forEach(group => {
    items.push(...group)
  })
  return items
})

const keyboardSelectedItem = computed(() => {
  if (keyboardSelectedIndex.value < 0) return null
  return flatFilteredItems.value[keyboardSelectedIndex.value]
})
```

- [ ] **Step 3: 运行 lint 检查**

Run: `npm run lint`
Expected: PASS (no errors)

- [ ] **Step 4: Commit**

```bash
git add src/views/HistoryView.vue
git commit -m "feat: 添加键盘导航响应式数据和计算属性"
```

---

### Task 2: 添加 watch 监听器自动初始化选中状态

**Files:**
- Modify: `src/views/HistoryView.vue:237`

- [ ] **Step 1: 在 import 中添加 watch**

修改第 237 行：

```javascript
import { ref, computed, onMounted, nextTick, watch } from "vue";
```

- [ ] **Step 2: 添加 watch 监听器**

在 `keyboardSelectedItem` 计算属性之后添加：

```javascript
watch(flatFilteredItems, (newItems) => {
  if (newItems.length > 0) {
    keyboardSelectedIndex.value = 0
    nextTick(() => {
      scrollToSelectedItem()
    })
  } else {
    keyboardSelectedIndex.value = -1
  }
})
```

- [ ] **Step 3: 运行 lint 检查**

Run: `npm run lint`
Expected: PASS (no errors)

- [ ] **Step 4: Commit**

```bash
git add src/views/HistoryView.vue
git commit -m "feat: 添加自动初始化键盘选中状态"
```

---

### Task 3: 实现 scrollToSelectedItem 方法

**Files:**
- Modify: `src/views/HistoryView.vue:945`

- [ ] **Step 1: 添加 scrollToSelectedItem 方法**

在 `formatTime` 函数之后添加：

```javascript
function scrollToSelectedItem() {
  nextTick(() => {
    const selectedElement = document.querySelector('.keyboard-selected')
    if (selectedElement) {
      selectedElement.scrollIntoView({ 
        block: 'nearest', 
        behavior: 'smooth' 
      })
    }
  })
}
```

- [ ] **Step 2: 运行 lint 检查**

Run: `npm run lint`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/views/HistoryView.vue
git commit -m "feat: 添加滚动到选中项方法"
```

---

### Task 4: 实现 openOrSwitchToTab 方法

**Files:**
- Modify: `src/views/HistoryView.vue:958`

- [ ] **Step 1: 添加 openOrSwitchToTab 方法**

在 `scrollToSelectedItem` 函数之后添加：

```javascript
async function openOrSwitchToTab(url) {
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    window.open(url, '_blank')
    return
  }
  
  try {
    const tabs = await chrome.tabs.query({})
    const existingTab = tabs.find(tab => tab.url === url)
    
    if (existingTab) {
      await chrome.tabs.update(existingTab.id, { active: true })
      await chrome.windows.update(existingTab.windowId, { focused: true })
    } else {
      await chrome.tabs.create({ url })
    }
  } catch (error) {
    console.error('Failed to open or switch tab:', error)
    window.open(url, '_blank')
  }
}
```

- [ ] **Step 2: 运行 lint 检查**

Run: `npm run lint`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/views/HistoryView.vue
git commit -m "feat: 添加标签页检测与切换功能"
```

---

### Task 5: 实现 handleKeydown 方法

**Files:**
- Modify: `src/views/HistoryView.vue:982`

- [ ] **Step 1: 添加 handleKeydown 方法**

在 `openOrSwitchToTab` 函数之后添加：

```javascript
function handleKeydown(event) {
  const hasItems = flatFilteredItems.value.length > 0
  
  switch(event.key) {
    case 'ArrowDown':
      if (!hasItems) return
      event.preventDefault()
      if (keyboardSelectedIndex.value === -1) {
        keyboardSelectedIndex.value = 0
      } else if (keyboardSelectedIndex.value >= flatFilteredItems.value.length - 1) {
        keyboardSelectedIndex.value = 0
      } else {
        keyboardSelectedIndex.value++
      }
      scrollToSelectedItem()
      break
      
    case 'ArrowUp':
      if (!hasItems) return
      event.preventDefault()
      if (keyboardSelectedIndex.value <= 0) {
        keyboardSelectedIndex.value = flatFilteredItems.value.length - 1
      } else {
        keyboardSelectedIndex.value--
      }
      scrollToSelectedItem()
      break
      
    case 'Enter':
      if (keyboardSelectedItem.value) {
        event.preventDefault()
        openOrSwitchToTab(keyboardSelectedItem.value.url)
      }
      break
      
    case ' ':
      if (keyboardSelectedItem.value) {
        event.preventDefault()
        toggleSelection(keyboardSelectedItem.value.id)
      }
      break
      
    case 'Escape':
      event.preventDefault()
      if (selectedItems.value.size > 0) {
        clearSelection()
      } else {
        clearSearch()
      }
      break
  }
}
```

- [ ] **Step 2: 运行 lint 检查**

Run: `npm run lint`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/views/HistoryView.vue
git commit -m "feat: 添加键盘事件处理方法"
```

---

### Task 6: 添加 isKeyboardSelected 辅助方法

**Files:**
- Modify: `src/views/HistoryView.vue:1038`

- [ ] **Step 1: 添加 isKeyboardSelected 方法**

在 `handleKeydown` 函数之后添加：

```javascript
function isKeyboardSelected(itemId) {
  return keyboardSelectedItem.value?.id === itemId
}
```

- [ ] **Step 2: 运行 lint 检查**

Run: `npm run lint`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/views/HistoryView.vue
git commit -m "feat: 添加键盘选中状态判断方法"
```

---

### Task 7: 在模板中绑定键盘事件和样式类

**Files:**
- Modify: `src/views/HistoryView.vue:7-14`

- [ ] **Step 1: 在搜索框添加 keydown 事件监听**

修改第 7-14 行：

```vue
<input
  ref="searchInputRef"
  v-model="searchQuery"
  type="text"
  :placeholder="t('searchPlaceholder')"
  class="search-input"
  @input="handleSearch"
  @keydown="handleKeydown"
/>
```

- [ ] **Step 2: 在历史条目添加 keyboard-selected 类绑定**

修改第 182-188 行：

```vue
<div
  v-for="item in group"
  :key="item.id"
  class="history-item"
  :class="{ 
    selected: selectedItems.has(item.id),
    'keyboard-selected': isKeyboardSelected(item.id)
  }"
  @click="openItem(item.url, $event)"
>
```

- [ ] **Step 3: 运行 lint 检查**

Run: `npm run lint`
Expected: PASS (no errors)

- [ ] **Step 4: Commit**

```bash
git add src/views/HistoryView.vue
git commit -m "feat: 绑定键盘事件和样式类"
```

---

### Task 8: 添加 keyboard-selected CSS 样式

**Files:**
- Modify: `src/views/HistoryView.vue:1320-1324`

- [ ] **Step 1: 添加 keyboard-selected 样式**

在 `.history-item.selected` 样式之后添加：

```css
.history-item.keyboard-selected {
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
  border-left: 3px solid #667eea;
  outline: 2px solid #667eea;
  outline-offset: -2px;
}
```

- [ ] **Step 2: 运行 lint 检查**

Run: `npm run lint`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/views/HistoryView.vue
git commit -m "feat: 添加键盘选中样式"
```

---

### Task 9: 构建并验证

**Files:**
- None

- [ ] **Step 1: 构建扩展**

Run: `npm run build-extension`
Expected: SUCCESS (构建完成，无错误)

- [ ] **Step 2: 验证构建输出**

Run: `ls output/dist`
Expected: 显示构建文件列表

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "build: 构建键盘导航功能"
```

---

## 测试清单

由于项目暂无测试框架，请手动验证以下功能：

### 功能测试

- [ ] 搜索框输入关键词后，自动选中第一条条目
- [ ] 按下键能正确导航到下一条
- [ ] 按上键能正确导航到上一条
- [ ] 在顶部按上键循环跳转到底部
- [ ] 在底部按下键循环跳转到顶部
- [ ] Enter 键打开新标签页或切换到已存在的标签页
- [ ] 空格键正确勾选/取消勾选当前条目
- [ ] 有勾选项时按 ESC 清空勾选
- [ ] 无勾选项时按 ESC 清空搜索框
- [ ] 选中项自动滚动到视图

### 边界测试

- [ ] 空列表时键盘无响应
- [ ] 清空搜索后自动选中第一条
- [ ] 切换时间过滤器后自动选中第一条

---

## 注意事项

1. **键盘选中状态与复选框选中状态独立**：键盘选中（keyboard-selected）和复选框勾选（selected）是两个独立的状态
2. **自动初始化**：搜索结果刷新后通过 watch 自动选中第一条
3. **ESC 键逻辑**：基于复选框勾选数量决定行为，不影响键盘选中状态
4. **循环导航**：到达边界后循环到列表另一端
