# 键盘导航功能设计文档

**日期**: 2026-05-07  
**功能**: 搜索结果列表键盘导航  
**方案**: Vue 3 Composition API + ref 响应式管理

## 1. 功能概述

为历史记录搜索结果列表添加键盘导航功能，允许用户通过键盘快速浏览和操作历史记录。

### 1.1 核心功能

- **方向键导航**: 使用上下方向键在搜索结果列表中选择条目
- **Enter 打开/切换**: 按下 Enter 键打开新标签页或切换到已存在的标签页
- **空格键勾选**: 按下空格键勾选/取消勾选当前选中条目
- **ESC 取消**: 按下 ESC 键清除选中状态或清空搜索框
- **自动滚动**: 选中的条目自动滚动到可视区域

### 1.2 边界条件

- 列表为空时，键盘操作不做响应
- 初次按下方向键时，选中第一条条目
- 到达列表边界时（顶部/底部），停止导航，不循环

## 2. 数据结构设计

### 2.1 响应式数据

```javascript
// 键盘选中索引 (-1 表示未选中)
const keyboardSelectedIndex = ref(-1)
```

### 2.2 计算属性

```javascript
// 扁平化的过滤后列表（便于索引访问）
const flatFilteredItems = computed(() => {
  const items = []
  Object.values(groupedHistory.value).forEach(group => {
    items.push(...group)
  })
  return items
})

// 当前键盘选中的条目
const keyboardSelectedItem = computed(() => {
  if (keyboardSelectedIndex.value < 0) return null
  return flatFilteredItems.value[keyboardSelectedIndex.value]
})
```

## 3. 事件处理逻辑

### 3.1 键盘事件映射

| 按键 | 条件 | 行为 |
|------|------|------|
| ArrowDown | 有搜索结果 | selectedIndex++ (最大值: list.length - 1) |
| ArrowDown | 无搜索结果 | 不响应 |
| ArrowUp | selectedIndex > 0 | selectedIndex-- |
| ArrowUp | selectedIndex <= 0 | 不响应 |
| Enter | 有选中项 | 调用 openOrSwitchToTab() |
| Space | 有选中项 | toggle 当前条目的 checkbox |
| ESC | selectedIndex >= 0 | 设置 selectedIndex = -1 |
| ESC | selectedIndex = -1 | 清空 searchQuery |

### 3.2 事件处理函数

```javascript
function handleKeydown(event) {
  const hasItems = flatFilteredItems.value.length > 0
  
  switch(event.key) {
    case 'ArrowDown':
      if (!hasItems) return
      event.preventDefault()
      if (keyboardSelectedIndex.value === -1) {
        keyboardSelectedIndex.value = 0
      } else if (keyboardSelectedIndex.value < flatFilteredItems.value.length - 1) {
        keyboardSelectedIndex.value++
      }
      scrollToSelectedItem()
      break
      
    case 'ArrowUp':
      if (!hasItems) return
      event.preventDefault()
      if (keyboardSelectedIndex.value > 0) {
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
      if (keyboardSelectedIndex.value >= 0) {
        keyboardSelectedIndex.value = -1
      } else {
        clearSearch()
      }
      break
  }
}
```

### 3.3 滚动处理

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

## 4. 标签页检测与切换

### 4.1 打开或切换逻辑

```javascript
async function openOrSwitchToTab(url) {
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    window.open(url, '_blank')
    return
  }
  
  try {
    // 查询所有标签页
    const tabs = await chrome.tabs.query({})
    
    // 查找 URL 完全匹配的标签页
    const existingTab = tabs.find(tab => tab.url === url)
    
    if (existingTab) {
      // 切换到已存在的标签页
      await chrome.tabs.update(existingTab.id, { active: true })
      // 聚焦到该窗口
      await chrome.windows.update(existingTab.windowId, { focused: true })
    } else {
      // 打开新标签页
      await chrome.tabs.create({ url })
    }
  } catch (error) {
    console.error('Failed to open or switch tab:', error)
    window.open(url, '_blank')
  }
}
```

## 5. UI 视觉反馈

### 5.1 CSS 类定义

```css
.history-item.keyboard-selected {
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
  border-left: 3px solid #667eea;
  outline: 2px solid #667eea;
  outline-offset: -2px;
}
```

### 5.2 模板绑定

```vue
<div
  v-for="(item, index) in group"
  :key="item.id"
  class="history-item"
  :class="{ 
    selected: selectedItems.has(item.id),
    'keyboard-selected': isKeyboardSelected(item.id)
  }"
  @click="openItem(item.url, $event)"
>
```

### 5.3 辅助函数

```javascript
function isKeyboardSelected(itemId) {
  return keyboardSelectedItem.value?.id === itemId
}
```

## 6. 状态清理

### 6.1 搜索框清空时

```javascript
function clearSearch() {
  searchQuery.value = ''
  keyboardSelectedIndex.value = -1
}
```

### 6.2 时间过滤器切换时

```javascript
function setTimeFilter(filterId) {
  activeTimeFilter.value = filterId
  keyboardSelectedIndex.value = -1
  // ... 原有逻辑
}
```

### 6.3 删除条目时

```javascript
function deleteItem(id) {
  // 如果删除的是当前键盘选中项，清除选中状态
  if (keyboardSelectedItem.value?.id === id) {
    keyboardSelectedIndex.value = -1
  }
  // ... 原有逻辑
}
```

## 7. 性能优化

### 7.1 计算属性缓存

`flatFilteredItems` 计算属性会自动缓存，只有在 `groupedHistory` 变化时才重新计算。

### 7.2 DOM 查询优化

`scrollIntoView` 只在索引变化时调用，使用 `nextTick` 确保 DOM 更新完成。

## 8. 测试要点

### 8.1 功能测试

- [ ] 搜索框输入关键词后，按上下键能正确选中条目
- [ ] 初次按下方向键选中第一条
- [ ] 按上键在顶部不循环
- [ ] 按下键在底部不循环
- [ ] Enter 键打开新标签页或切换到已存在的标签页
- [ ] 空格键正确勾选/取消勾选
- [ ] ESC 键行为符合预期
- [ ] 选中项自动滚动到视图

### 8.2 边界测试

- [ ] 空列表时键盘无响应
- [ ] 删除当前选中项后状态正确
- [ ] 切换时间过滤器后状态正确
- [ ] 清空搜索后状态正确

### 8.3 兼容性测试

- [ ] Chrome 环境正常运行
- [ ] 无 Chrome API 环境降级处理
