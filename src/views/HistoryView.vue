<template>
  <div class="history-view" tabindex="-1" @keydown="handleKeydown">
    <header class="header">
      <div class="header-row">
        <h1 class="title">{{ t("title") }}</h1>
        <div class="search-container">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="t('searchPlaceholder')"
            class="search-input"
            @input="handleSearch"
          />
          <svg
            v-if="searchQuery"
            class="clear-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            @click="clearSearch"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <svg
            v-else
            class="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <div class="header-actions">
          <button
            class="help-button"
            @click="showHelp = true"
            :title="t('help')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <circle cx="12" cy="17" r="1" fill="currentColor"></circle>
            </svg>
          </button>
          <button
            class="theme-toggle"
            @click="toggleTheme"
            :title="isDarkTheme ? t('switchToLight') : t('switchToDark')"
          >
            <svg
              v-if="isDarkTheme"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <div class="toolbar">
      <div class="toolbar-row">
        <div class="time-filters">
          <button
            v-for="filter in timeFilters"
            :key="filter.id"
            :class="[
              'time-filter-button',
              { active: activeTimeFilter === filter.id },
            ]"
            @click="setTimeFilter(filter.id)"
          >
            {{ filter.label }}
          </button>
        </div>
        <div class="actions">
          <button
            v-if="selectedItems.size > 0"
            class="action-button cancel-selected"
            @click="clearSelection"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            {{ t("clearSelection") }}
          </button>
          <button
            v-if="selectedItems.size > 0"
            class="action-button delete-selected"
            @click="deleteSelected"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              ></path>
            </svg>
            {{ t("deleteSelected") }} ({{ selectedItems.size }})
          </button>
          <button v-else class="action-button" @click="clearHistory">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              ></path>
            </svg>
            {{ t("clearHistory") }}
          </button>
        </div>
      </div>
    </div>

    <div class="calendar-floating">
      <DateCalendar
        :selected="selectedDate"
        :activity-dates="monthActivity"
        @select="onCalendarSelect"
        @month-change="onCalendarMonthChange"
      />
    </div>

    <main class="content" ref="contentRef" @scroll="handleScroll">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>{{ t("loading") }}</p>
      </div>
      <div v-else-if="historyItems.length === 0" class="empty-state">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <h2>{{ selectedDate ? t("dateNoHistory") : t("noHistory") }}</h2>
        <p v-if="!selectedDate">{{ t("noHistoryDesc") }}</p>
      </div>
      <div v-else class="history-list">
        <div
          v-for="(group, dateKey) in groupedHistory"
          :key="dateKey"
          class="history-group"
          :data-date-yesterday="isYesterday(dateKey) ? 'true' : null"
        >
          <div class="group-header">
            <input
              type="checkbox"
              class="group-checkbox"
              :checked="isGroupFullySelected(group)"
              :indeterminate="isGroupPartiallySelected(group)"
              @change="toggleGroupSelection(group, $event)"
              @click.stop
            />
            <span class="group-date">{{ formatDateHeader(dateKey) }}</span>
            <span class="group-count"
              >{{ group.length }} {{ t("records") }}</span
            >
          </div>
          <div class="group-items">
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
              <input
                type="checkbox"
                class="item-checkbox"
                :checked="selectedItems.has(item.id)"
                @click.stop
                @change="toggleSelection(item.id)"
              />
              <img
                :src="getFaviconUrl(item.url)"
                :alt="item.title"
                class="favicon"
                @error="(event) => handleFaviconError(event, item.url)"
              />
              <div
                class="item-title"
                :title="item.title || item.url"
                v-html="highlightText(item.title || item.url)"
              ></div>
              <div
                class="item-url"
                :title="item.url"
                v-html="highlightText(item.url)"
              ></div>
              <div class="item-time">{{ formatTime(item.lastVisitTime) }}</div>
              <button class="delete-button" @click.stop="deleteItem(item.id)">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="loadingMore" class="loading-more">
        <div class="loading-spinner small"></div>
        <p>{{ t("loadMore") }}</p>
      </div>
    </main>

    <div v-if="showHelp" class="help-modal-overlay" @click="closeHelp">
      <div class="help-modal" @click.stop>
        <div class="help-modal-header">
          <h2>{{ t('helpTitle') }}</h2>
          <button class="help-modal-close" @click="closeHelp" :aria-label="t('help')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="help-modal-content">
          <div class="help-section">
            <div class="help-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="help-icon">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              <h3>{{ t('helpAboutTitle') }}</h3>
            </div>
            <p class="help-description">{{ t('helpAboutDesc') }}</p>
          </div>

          <div class="help-section">
            <div class="help-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="help-icon">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                <line x1="6" y1="8" x2="6" y2="8"></line>
                <line x1="10" y1="8" x2="10" y2="8"></line>
              </svg>
              <h3>{{ t('helpShortcutsTitle') }}</h3>
            </div>
            <div class="help-shortcuts">
              <div class="shortcut-item">
                <kbd>↑/↓</kbd>
                <span>{{ t('helpArrowKeys') }}</span>
              </div>
              <div class="shortcut-item">
                <kbd>Enter</kbd>
                <span>{{ t('helpEnter') }}</span>
              </div>
              <div class="shortcut-item">
                <kbd>Space</kbd>
                <span>{{ t('helpSpace') }}</span>
              </div>
              <div class="shortcut-item">
                <kbd>ESC</kbd>
                <span>{{ t('helpEsc') }}</span>
              </div>
              <div class="shortcut-item">
                <kbd>Delete</kbd>
                <span>{{ t('helpDelete') }}</span>
              </div>
            </div>
          </div>

          <div class="help-section">
            <div class="help-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="help-icon">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <h3>{{ t('helpFeaturesTitle') }}</h3>
            </div>
            <ul class="help-features">
              <li>{{ t('helpFeature1') }}</li>
              <li>{{ t('helpFeature2') }}</li>
              <li>{{ t('helpFeature3') }}</li>
              <li>{{ t('helpFeature4') }}</li>
            </ul>
          </div>

          <div class="help-recommend">
            <div class="help-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="help-icon">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <h3>{{ t('helpRecommendTitle') }}</h3>
            </div>
            <div class="help-recommend-body">
              <div class="help-recommend-info">
                <strong>{{ t('helpRecommendName') }}</strong>
                <p class="help-description">{{ t('helpRecommendDesc') }}</p>
              </div>
              <a
                :href="recommendStore.url"
                target="_blank"
                rel="noopener noreferrer"
                class="store-link"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                {{ t('helpRecommendInstall') }} · {{ recommendStore.label }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { t, isZh } from "../i18n";
import DateCalendar from "../components/DateCalendar.vue";

const searchQuery = ref("");
const isDarkTheme = ref(localStorage.getItem("theme") === "dark");
const activeTimeFilter = ref("week");
const historyItems = ref([]);
const loading = ref(true);
const selectedItems = ref(new Set());
const searchInputRef = ref(null);
const loadingMore = ref(false);
const hasMoreData = ref(true);
const hasPreviousData = ref(false);
const currentFilterStartTime = ref(0);
const endTime = ref(0);
// 预设视图按天加载时，当前已加载的最早一天的起始时间（用于继续向更早翻页）
const oldestDayStart = ref(0);
const contentRef = ref(null);
const keyboardSelectedIndex = ref(-1)
const showHelp = ref(false)
const HELP_SEEN_KEY = 'my-better-history-help-seen'

// 日历选中的日期（'YYYY-MM-DD'，null 表示使用预设时间过滤）
const selectedDate = ref(null)
// 当前日历月份中有浏览记录的日期集合
const monthActivity = ref(new Set())
// 日历当前浏览的月份
const calendarView = ref({ year: new Date().getFullYear(), month: new Date().getMonth() })

// 友情推荐：根据浏览器类型展示对应扩展商店链接
const recommendStore = (() => {
  const isEdge = /Edg\//.test(navigator.userAgent);
  return {
    label: isEdge ? t("helpRecommendStoreEdge") : t("helpRecommendStoreChrome"),
    url: isEdge
      ? "https://microsoftedge.microsoft.com/addons/detail/goemcphhpfajifddhebagehkkaeblcpf"
      : "https://chromewebstore.google.com/detail/mytabsearch-search-tabs-s/adfbidbchmbodidfjmimbkfndnenljjp",
  };
})();

const timeFilters = computed(() => [
  { id: "today", label: t("today") },
  { id: "yesterday", label: t("yesterday") },
  { id: "week", label: t("thisWeek") },
  { id: "month", label: t("thisMonth") },
  { id: "all", label: t("all") },
]);

onMounted(() => {
  loadHistory();
  loadMonthActivity();
  applyTheme();
  const hasSeenHelp = localStorage.getItem(HELP_SEEN_KEY);
  if (!hasSeenHelp) {
    showHelp.value = true;
    localStorage.setItem(HELP_SEEN_KEY, 'true');
  }
  nextTick(() => {
    searchInputRef.value?.focus();
  });
  
  document.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
});

// 日期模式下逐 URL 展开的访问数上限；当天 URL 过多时回退为按 URL 归日（避免 getVisits 调用过多）
const MAX_DAY_VISITS = 1000;

// 方案A：精确归日 —— 查询当天有访问的 URL，再逐 URL 用 getVisits 取当天内最近一次访问时间
async function loadDayVisits(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayStart = new Date(y, m - 1, d).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;

  const results = await chrome.history.search({
    text: "",
    maxResults: 5000,
    startTime: dayStart,
    endTime: dayEnd,
  });

  const urls = results.filter(
    (item) => item.url && !item.url.startsWith("chrome://"),
  );

  // URL 过多时逐条 getVisits 开销太大，回退为按 URL 归入当天
  if (urls.length > MAX_DAY_VISITS) {
    return urls
      .map((item) => ({
        id: item.id,
        url: item.url,
        title: item.title || "",
        lastVisitTime: item.lastVisitTime,
      }))
      .sort((a, b) => b.lastVisitTime - a.lastVisitTime);
  }

  const visits = [];
  for (const item of urls) {
    const visitResults = await chrome.history.getVisits({ url: item.url });
    let latestInDay = -1;
    for (const v of visitResults) {
      if (v.visitTime >= dayStart && v.visitTime <= dayEnd && v.visitTime > latestInDay) {
        latestInDay = v.visitTime;
      }
    }
    if (latestInDay >= 0) {
      visits.push({
        id: item.id,
        url: item.url,
        title: item.title || "",
        lastVisitTime: latestInDay,
      });
    }
  }

  visits.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
  return visits;
}

// 按天查询时间范围内的访问记录：URL 归入其有访问的每一天（一天一行），
// 与日期视图口径统一，解决"本周视图某天少算"的问题
async function loadRangeByDay(startTime, endTime) {
  const items = [];
  const cursor = new Date(startTime);
  cursor.setHours(0, 0, 0, 0);
  let oldestDay = 0;

  while (cursor.getTime() <= endTime) {
    const dStart = cursor.getTime();
    const dEnd = Math.min(dStart + 24 * 60 * 60 * 1000 - 1, endTime);
    oldestDay = dStart;

    const results = await chrome.history.search({
      text: "",
      maxResults: 5000,
      startTime: dStart,
      endTime: dEnd,
    });

    for (const item of results) {
      if (!item.url || item.url.startsWith("chrome://")) continue;
      items.push({
        id: `${item.id}-${dStart}`,
        url: item.url,
        title: item.title || "",
        // 该 URL 归属的日期（查询保证当天有访问）；lastVisitTime 可能落在更晚的天
        dayKey: new Date(dStart).toDateString(),
        lastVisitTime: item.lastVisitTime,
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  oldestDayStart.value = oldestDay;
  return items.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
}

async function loadHistory() {
  loading.value = true;
  const { startTime, endTime: filterEndTime } = getActiveRange();
  currentFilterStartTime.value = startTime;

  try {
    if (typeof chrome !== "undefined" && chrome.history) {
      let allItems = [];

      if (selectedDate.value) {
        // 日期模式：方案A —— 逐 URL 用 getVisits 取当天内的访问时间，精确归日
        allItems = await loadDayVisits(selectedDate.value);
      } else {
        // 预设视图统一按天加载（"昨天"只查昨天一天，与其余预设口径一致）
        const queryEndTime = filterEndTime || Date.now();
        allItems = await loadRangeByDay(startTime, queryEndTime);
      }

      historyItems.value = allItems;

      if (allItems.length > 0) {
        const lastItemTime = allItems[allItems.length - 1].lastVisitTime;
        endTime.value = lastItemTime;

        if (selectedDate.value) {
          // 日期模式已一次性取完整天的访问记录，无需分页
          hasMoreData.value = false;
        } else if (activeTimeFilter.value === "all") {
          // 全部视图范围为固定 90 天，不向更早翻页
          hasMoreData.value = false;
        } else {
          // 其他预设视图可继续向更早的天翻页
          hasMoreData.value = true;
        }
        hasPreviousData.value = false;
      } else {
        hasMoreData.value = false;
        hasPreviousData.value = false;
      }
    } else {
      const range = getActiveRange();
      historyItems.value = getMockHistory().filter(
        (item) =>
          item.lastVisitTime >= range.startTime &&
          item.lastVisitTime <= range.endTime,
      );
      hasMoreData.value = false;
      hasPreviousData.value = false;
    }
  } catch (error) {
    console.error("Failed to load history:", error);
    historyItems.value = getMockHistory();
    hasMoreData.value = false;
    hasPreviousData.value = false;
  }
  loading.value = false;
}

async function checkPreviousPeriod() {
  if (activeTimeFilter.value === "yesterday") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const results = await chrome.history.search({
        text: "",
        maxResults: 1,
        startTime: today.getTime(),
      });
      return results.length > 0;
    } catch (e) {
      return false;
    }
  }
  if (activeTimeFilter.value === "week") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    try {
      const results = await chrome.history.search({
        text: "",
        maxResults: 1,
        startTime: yesterday.getTime(),
        endTime: today.getTime(),
      });
      return results.length > 0;
    } catch (e) {
      return false;
    }
  }
  if (activeTimeFilter.value === "month") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    try {
      const results = await chrome.history.search({
        text: "",
        maxResults: 1,
        startTime: weekAgo.getTime(),
        endTime: today.getTime(),
      });
      return results.length > 0;
    } catch (e) {
      return false;
    }
  }
  if (activeTimeFilter.value === "today") {
    return false;
  }
  return false;
}

// ===== 日历日期选择 =====
function toDateKey(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// 当前生效的时间范围：选中日期时取当天，否则用预设过滤
function getActiveRange() {
  if (selectedDate.value) {
    const [y, m, d] = selectedDate.value.split("-").map(Number);
    const dayStart = new Date(y, m - 1, d).getTime();
    return { startTime: dayStart, endTime: dayStart + 24 * 60 * 60 * 1000 - 1 };
  }
  return getTimeRangeByFilter(activeTimeFilter.value);
}

function onCalendarSelect(dateStr) {
  if (!dateStr) {
    clearDate();
    return;
  }
  selectedDate.value = dateStr;
  loadHistory();
}

function clearDate() {
  if (selectedDate.value) {
    selectedDate.value = null;
    loadHistory();
  }
}

function onCalendarMonthChange({ year, month }) {
  calendarView.value = { year, month };
  loadMonthActivity();
}

// 查询日历当前月份有浏览记录的日期集合（用于日历上的小圆点标记）
async function loadMonthActivity() {
  const { year, month } = calendarView.value;
  const monthStart = new Date(year, month, 1).getTime();
  const monthEnd = new Date(year, month + 1, 1).getTime() - 1;
  const set = new Set();

  if (typeof chrome !== "undefined" && chrome.history) {
    try {
      const results = await chrome.history.search({
        text: "",
        maxResults: 5000,
        startTime: monthStart,
        endTime: monthEnd,
      });
      results.forEach((item) => {
        if (item.url && !item.url.startsWith("chrome://")) {
          set.add(toDateKey(new Date(item.lastVisitTime)));
        }
      });
    } catch (e) {
      // 忽略查询失败，不显示标记
    }
  } else {
    getMockItems().forEach((item) => {
      if (item.lastVisitTime >= monthStart && item.lastVisitTime <= monthEnd) {
        set.add(toDateKey(new Date(item.lastVisitTime)));
      }
    });
  }

  monthActivity.value = set;
}

function getTimeRangeByFilter(filter) {
  const now = Date.now();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  switch (filter) {
    case "today":
      return { startTime: today.getTime(), endTime: now };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { startTime: yesterday.getTime(), endTime: today.getTime() };
    }
    case "week": {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { startTime: weekAgo.getTime(), endTime: now };
    }
    case "month": {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { startTime: monthAgo.getTime(), endTime: now };
    }
    case "all":
    default:
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return { startTime: ninetyDaysAgo.getTime(), endTime: now };
  }
}

async function loadMoreHistory() {
  if (loading.value || loadingMore.value) {
    return;
  }

  // 日期模式已一次性取完整天的访问记录，无需（也无法可靠）分页
  if (selectedDate.value || activeTimeFilter.value === "all") {
    hasMoreData.value = false;
    return;
  }

  loadingMore.value = true;

  try {
    if (typeof chrome !== "undefined" && chrome.history) {
      // 向更早的一天翻页（与按天加载的口径一致）
      const prevDayStart = oldestDayStart.value - 24 * 60 * 60 * 1000;
      const prevDayEnd = oldestDayStart.value - 1;

      const moreResults = await chrome.history.search({
        text: "",
        maxResults: 5000,
        startTime: prevDayStart,
        endTime: prevDayEnd,
      });

      const existingIds = new Set(historyItems.value.map((i) => i.id));
      const uniqueNewItems = moreResults
        .filter((item) => item.url && !item.url.startsWith("chrome://"))
        .map((item) => ({
          id: `${item.id}-${prevDayStart}`,
          url: item.url,
          title: item.title || "",
          dayKey: new Date(prevDayStart).toDateString(),
          lastVisitTime: item.lastVisitTime,
        }))
        .filter((item) => !existingIds.has(item.id));

      if (uniqueNewItems.length > 0) {
        historyItems.value = [...historyItems.value, ...uniqueNewItems];
        oldestDayStart.value = prevDayStart;
        hasMoreData.value = true;
      } else {
        // 该天没有访问记录，视为已到尽头
        hasMoreData.value = false;
      }
    }
  } catch (error) {
    console.error("Failed to load more history:", error);
  }

  loadingMore.value = false;
}

async function loadPreviousPeriod() {
  if (loadingMore.value || activeTimeFilter.value === "all") return;
  if (!hasPreviousData.value) return;

  loadingMore.value = true;

  let prevFilter = "";
  if (activeTimeFilter.value === "today") {
    prevFilter = "yesterday";
  } else if (activeTimeFilter.value === "yesterday") {
    prevFilter = "week";
  } else if (activeTimeFilter.value === "week") {
    prevFilter = "month";
  } else if (activeTimeFilter.value === "month") {
    prevFilter = "all";
  }

  if (!prevFilter) {
    loadingMore.value = false;
    return;
  }

  const currentRange = getTimeRangeByFilter(activeTimeFilter.value);
  const prevRange = getTimeRangeByFilter(prevFilter);

  try {
    if (typeof chrome !== "undefined" && chrome.history) {
      const results = await chrome.history.search({
        text: "",
        maxResults: 500,
        startTime: prevRange.startTime,
        endTime: currentRange.startTime,
      });

      let newItems = results
        .filter((item) => item.url && !item.url.startsWith("chrome://"))
        .sort((a, b) => b.lastVisitTime - a.lastVisitTime);

      const existingUrls = new Set(historyItems.value.map((i) => i.url));
      const uniqueNewItems = newItems.filter(
        (item) => !existingUrls.has(item.url),
      );

      if (uniqueNewItems.length > 0) {
        historyItems.value = [...uniqueNewItems, ...historyItems.value];
      }
    }
  } catch (error) {
    console.error("Failed to load previous period data:", error);
  }
  loadingMore.value = false;
}

let lastScrollTop = 0;

function handleScroll(event) {
  const target = event.target;
  const scrollTop = target.scrollTop;
  const scrollBottom =
    target.scrollHeight - target.scrollTop - target.clientHeight;

  if (scrollBottom < 20 && !loadingMore.value) {
    loadMoreHistory();
  }

  if (scrollTop < 20 && lastScrollTop <= 50 && hasPreviousData.value) {
    loadPreviousPeriod();
  }

  lastScrollTop = scrollTop;
}

// 生成覆盖近 14 天的 mock 历史（缓存复用，供列表与日历标记共用）
let mockItemsCache = null;
function getMockItems() {
  if (mockItemsCache) return mockItemsCache;
  const now = Date.now();
  const sites = [
    { url: "https://github.com", title: "GitHub" },
    { url: "https://stackoverflow.com", title: "Stack Overflow" },
    { url: "https://developer.mozilla.org", title: "MDN Web Docs" },
    { url: "https://vuejs.org", title: "Vue.js" },
    { url: "https://tailwindcss.com", title: "Tailwind CSS" },
    { url: "https://www.google.com", title: "Google" },
    { url: "https://www.youtube.com", title: "YouTube" },
    { url: "https://www.wikipedia.org", title: "Wikipedia" },
  ];
  mockItemsCache = [];
  for (let day = 0; day < 14; day++) {
    sites.forEach((site) => {
      mockItemsCache.push({
        id: mockItemsCache.length + 1,
        url: site.url,
        title: site.title,
        lastVisitTime: now - day * 86400000 - Math.random() * 43200000,
      });
    });
  }
  return mockItemsCache;
}

function getMockHistory() {
  return getMockItems();
}

const groupedHistory = computed(() => {
  const groups = {};
  let filtered = historyItems.value;

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        (item.title && item.title.toLowerCase().includes(query)) ||
        item.url.toLowerCase().includes(query),
    );
  }

  filtered.forEach((item) => {
    // 按天加载的记录用 dayKey 归组（lastVisitTime 可能落在更晚的天）；
    // 日期视图/mock 没有 dayKey 时回退用 lastVisitTime 推导
    const dateKey = item.dayKey || new Date(item.lastVisitTime).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });

  // 按日期倒序排列分组（今天在最上，避免按插入顺序导致日期错乱）
  const sortedGroups = {};
  Object.keys(groups)
    .sort((a, b) => new Date(b) - new Date(a))
    .forEach((key) => {
      sortedGroups[key] = groups[key];
    });

  return sortedGroups;
});

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

watch(flatFilteredItems, (newItems, oldItems) => {
  if (newItems.length > 0) {
    if (oldItems.length === 0 || keyboardSelectedIndex.value === -1) {
      keyboardSelectedIndex.value = 0
      nextTick(() => {
        scrollToSelectedItem()
      })
    }
  } else {
    keyboardSelectedIndex.value = -1
  }
})

function handleSearch() {}

function clearSearch() {
  searchQuery.value = "";
}

function toggleTheme() {
  isDarkTheme.value = !isDarkTheme.value;
  localStorage.setItem("theme", isDarkTheme.value ? "dark" : "light");
  applyTheme();
}

function applyTheme() {
  const root = document.documentElement;
  if (isDarkTheme.value) {
    root.style.setProperty("--bg-primary", "#0d1117");
    root.style.setProperty("--bg-secondary", "#161b22");
    root.style.setProperty("--bg-group", "#161b22");
    root.style.setProperty("--bg-selected", "#1f6feb");
    root.style.setProperty("--text-primary", "#c9d1d9");
    root.style.setProperty("--text-secondary", "#8b949e");
    root.style.setProperty("--border-color", "#30363d");
    root.style.setProperty("--hover-bg", "#21262d");
    root.style.setProperty(
      "--header-gradient",
      "linear-gradient(135deg, #19183f 0%, #390f77 100%)"
    );
    root.style.setProperty("--header-shadow", "0 4px 6px -1px rgba(0, 0, 0, 0.4)");
  } else {
    root.style.setProperty("--bg-primary", "#ffffff");
    root.style.setProperty("--bg-secondary", "#f9fafb");
    root.style.setProperty("--bg-group", "#ffffff");
    root.style.setProperty("--bg-selected", "#dbeafe");
    root.style.setProperty("--text-primary", "#111827");
    root.style.setProperty("--text-secondary", "#6b7280");
    root.style.setProperty("--border-color", "#e5e7eb");
    root.style.setProperty("--hover-bg", "#f3f4f6");
    root.style.setProperty(
      "--header-gradient",
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    );
    root.style.setProperty("--header-shadow", "0 4px 6px -1px rgba(0, 0, 0, 0.1)");
  }
}

function highlightText(text) {
  if (!text || !searchQuery.value.trim()) {
    return text;
  }
  const query = searchQuery.value.trim();
  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function setTimeFilter(filterId) {
  activeTimeFilter.value = filterId;
  selectedDate.value = null; // 预设过滤与日期选择互斥
  loadHistory();
}

function openItem(url, event) {
  const openInBackground = event && event.ctrlKey;

  if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.create({ url, active: !openInBackground });
  } else {
    window.open(url, "_blank");
  }
}

function deleteItem(id) {
  if (typeof chrome !== "undefined" && chrome.history) {
    const item = historyItems.value.find((i) => i.id === id);
    if (item) {
      chrome.history.deleteUrl({ url: item.url });
    }
  }
  historyItems.value = historyItems.value.filter((i) => i.id !== id);
  selectedItems.value.delete(id);
  loadMonthActivity();
}

function toggleSelection(id) {
  if (selectedItems.value.has(id)) {
    selectedItems.value.delete(id);
  } else {
    selectedItems.value.add(id);
  }
  selectedItems.value = new Set(selectedItems.value);
}

function isGroupFullySelected(group) {
  return group.every((item) => selectedItems.value.has(item.id));
}

function isGroupPartiallySelected(group) {
  const selectedCount = group.filter((item) =>
    selectedItems.value.has(item.id),
  ).length;
  return selectedCount > 0 && selectedCount < group.length;
}

function toggleGroupSelection(group, event) {
  const isChecked = event.target.checked;
  group.forEach((item) => {
    if (isChecked) {
      selectedItems.value.add(item.id);
    } else {
      selectedItems.value.delete(item.id);
    }
  });
  selectedItems.value = new Set(selectedItems.value);
}

function clearSelection() {
  selectedItems.value = new Set();
}

function deleteSelected() {
  if (selectedItems.value.size === 0) return;

  if (confirm(t("confirmDeleteSelected", selectedItems.value.size))) {
    if (typeof chrome !== "undefined" && chrome.history) {
      selectedItems.value.forEach((id) => {
        const item = historyItems.value.find((i) => i.id === id);
        if (item) {
          chrome.history.deleteUrl({ url: item.url });
        }
      });
    }
    historyItems.value = historyItems.value.filter(
      (i) => !selectedItems.value.has(i.id),
    );
    selectedItems.value = new Set();
    loadMonthActivity();
  }
}

function clearHistory() {
  const isSearching = searchQuery.value.trim() !== "";

  let itemsToDelete = [];
  let confirmMessage = "";

  if (isSearching) {
    const query = searchQuery.value.toLowerCase().trim();
    itemsToDelete = historyItems.value.filter(
      (item) =>
        (item.title && item.title.toLowerCase().includes(query)) ||
        item.url.toLowerCase().includes(query),
    );

    if (itemsToDelete.length === 0) {
      alert(t("noSearchResults"));
      return;
    }

    confirmMessage = t("confirmDeleteSearch", [
      itemsToDelete.length,
      searchQuery.value,
    ]);
  } else {
    itemsToDelete = historyItems.value;
    confirmMessage = t("confirmClearAll", historyItems.value.length);
  }

  if (confirm(confirmMessage)) {
    if (typeof chrome !== "undefined" && chrome.history) {
      if (isSearching) {
        itemsToDelete.forEach((item) => {
          chrome.history.deleteUrl({ url: item.url });
        });
        historyItems.value = historyItems.value.filter(
          (item) => !itemsToDelete.includes(item),
        );
      } else {
        chrome.history.deleteAll();
        historyItems.value = [];
      }
    } else {
      if (isSearching) {
        historyItems.value = historyItems.value.filter(
          (item) => !itemsToDelete.includes(item),
        );
      } else {
        historyItems.value = [];
      }
    }

    selectedItems.value = new Set();
    loadMonthActivity();
  }
}

function getFaviconUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.getURL
    ) {
      try {
        return chrome.runtime.getURL(
          `_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`,
        );
      } catch (e) {}
    }

    const fallbackServices = [
      `https://favicone.com/${hostname}?s=32`,
      `https://icon.horse/icon/${hostname}`,
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
      `https://favicon.yandex.net/favicon/${hostname}`,
      `https://api.faviconkit.com/${hostname}/32`,
    ];

    return fallbackServices[0];
  } catch {
    return getDefaultFavicon();
  }
}

let faviconFallbackIndex = {};

function handleFaviconError(event, url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (!faviconFallbackIndex[hostname]) {
      faviconFallbackIndex[hostname] = 1;
    } else {
      faviconFallbackIndex[hostname]++;
    }

    const fallbackServices = [
      `https://favicone.com/${hostname}?s=32`,
      `https://icon.horse/icon/${hostname}`,
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
      `https://favicon.yandex.net/favicon/${hostname}`,
      `https://api.faviconkit.com/${hostname}/32`,
    ];

    if (faviconFallbackIndex[hostname] < fallbackServices.length) {
      event.target.src = fallbackServices[faviconFallbackIndex[hostname]];
    } else {
      event.target.src = getDefaultFavicon();
    }
  } catch {
    event.target.src = getDefaultFavicon();
  }
}

function getDefaultFavicon() {
  return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V8h2c1.1 0 2-.9 2-2V3.46c4.62.77 8 4.81 8 9.54 0 2.87-1.26 5.44-3.39 7.19l-.1-.2z"/></svg>';
}

function isYesterday(dateKey) {
  const date = new Date(dateKey);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

function formatDateHeader(dateKey) {
  const date = new Date(dateKey);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = t("weekdays");
  const weekday = weekdays[date.getDay()];

  if (isZh()) {
    const dateStr = year + "年" + month + "月" + day + "日";
    const fullDate = dateStr + " " + weekday;

    if (date.toDateString() === today.toDateString()) {
      return t("today") + "（" + fullDate + "）";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t("yesterday") + "（" + fullDate + "）";
    } else {
      return fullDate;
    }
  } else {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const fullDate = date.toLocaleDateString("en-US", options);

    if (date.toDateString() === today.toDateString()) {
      return t("today") + " (" + fullDate + ")";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t("yesterday") + " (" + fullDate + ")";
    } else {
      return fullDate;
    }
  }
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString(isZh() ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function handleGlobalKeydown(event) {
  if (event.key === 'f' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    searchInputRef.value?.focus()
    searchInputRef.value?.select()
  }
}

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
      if (showHelp.value) {
        showHelp.value = false
        localStorage.setItem(HELP_SEEN_KEY, 'true')
      } else if (selectedItems.value.size > 0) {
        clearSelection()
      } else {
        clearSearch()
      }
      break
      
    case 'Delete':
      if (selectedItems.value.size > 0) {
        event.preventDefault()
        deleteSelected()
      }
      break
  }
}

function isKeyboardSelected(itemId) {
  return keyboardSelectedItem.value?.id === itemId
}

function closeHelp() {
  showHelp.value = false
  localStorage.setItem(HELP_SEEN_KEY, 'true')
}
</script>

<style scoped>
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-group: #ffffff;
  --bg-selected: #dbeafe;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --hover-bg: #f3f4f6;
}

.history-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
}

.header {
  background: var(--header-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  color: white;
  padding: 1rem 2rem;
  box-shadow: var(--header-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 500px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.8);
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: rgba(255, 255, 255, 0.9);
}

.clear-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}

.clear-icon:hover {
  color: rgba(255, 255, 255, 1);
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
}

.theme-toggle svg {
  width: 1.25rem;
  height: 1.25rem;
}

.help-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.help-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.help-button svg {
  width: 1.25rem;
  height: 1.25rem;
}

.toolbar {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.1rem;
  gap: 1rem;
  flex-wrap: wrap;
  max-width: 1200px;
  margin: 0 auto;
}

.time-filters {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.time-filter-button {
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.time-filter-button:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.time-filter-button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.4);
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #ef4444;
  border-radius: 6px;
  background: white;
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-button:hover {
  background: #fef2f2;
}

.action-button.delete-selected {
  background: #ef4444;
  color: white;
}

.action-button.delete-selected:hover {
  background: #dc2626;
}

.action-button.cancel-selected {
  border-color: #6b7280;
  color: #6b7280;
}

.action-button.cancel-selected:hover {
  background: #f3f4f6;
  border-color: #4b5563;
  color: #4b5563;
}

.action-button svg {
  width: 0.75rem;
  height: 0.75rem;
}

.calendar-floating {
  position: fixed;
  top: 7.5rem;
  left: 1rem;
  z-index: 40;
  width: 264px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 1.25rem;
  height: 1.25rem;
  border-width: 2px;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #9ca3af;
  font-size: 0.75rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  text-align: center;
  color: #6b7280;
}

.empty-state svg {
  width: 5rem;
  height: 5rem;
  opacity: 0.5;
}

.empty-state h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

.history-list {
  max-width: 1200px;
  margin: 0 auto;
}

.history-group {
  margin-bottom: 2rem;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-left: 0.5rem;
}

.group-checkbox {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  flex-shrink: 0;
  accent-color: #667eea;
}

.group-checkbox:indeterminate {
  appearance: none;
  -webkit-appearance: none;
  width: 1rem;
  height: 1rem;
  border: 2px solid #667eea;
  border-radius: 3px;
  background-color: white;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-checkbox:indeterminate::after {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  background: #043f7b;
}

.group-date {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.group-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

.group-items {
  background: var(--bg-group);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:hover {
  background: var(--hover-bg);
}

.history-item.selected {
  background: var(--bg-selected);
}

.history-item.keyboard-selected {
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
}

.item-checkbox {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  flex-shrink: 0;
}

.favicon {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 4px;
  flex-shrink: 0;
  background: #f3f4f6;
}

.item-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 2;
  min-width: 100px;
}

.item-title mark,
.item-url mark {
  background-color: #fef08a;
  color: inherit;
  padding: 0 2px;
  border-radius: 2px;
}

.item-url {
  font-size: 0.8125rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 50px;
}

.item-time {
  font-size: 0.8125rem;
  color: #9ca3af;
  flex-shrink: 0;
  white-space: nowrap;
  width: 60px;
  text-align: right;
}

.delete-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.delete-button:hover {
  background: var(--hover-bg);
  color: #ef4444;
}

.delete-button svg {
  width: 1.25rem;
  height: 1.25rem;
}

.help-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.help-modal {
  background: var(--bg-primary);
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.help-modal-header {
  background: var(--header-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.help-modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.help-modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.help-modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.help-modal-close svg {
  width: 1rem;
  height: 1rem;
}

.help-modal-content {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(80vh - 60px);
}

.help-section {
  margin-bottom: 1.5rem;
}

.help-section:last-child {
  margin-bottom: 0;
}

.help-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.help-section-title h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.help-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #667eea;
}

.help-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.35;
  margin: 0;
}

.help-shortcuts {
  display: grid;
  gap: 0.5rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.25rem 0;
}

.shortcut-item kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-family: monospace;
  font-weight: 600;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.shortcut-item span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.help-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-features li {
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding: 0.25rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.help-features li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.75rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.help-recommend {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.help-recommend-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.875rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.help-recommend-info {
  flex: 1;
  min-width: 200px;
}

.help-recommend-info strong {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.store-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 6px;
  background: var(--header-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  color: white;
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
}

.store-link:hover {
  opacity: 0.85;
}

.store-link svg {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 768px) {
  .header {
    padding: 1.5rem 1rem 1rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .toolbar {
    padding: 0.75rem 1rem;
  }

  .content {
    padding: 1rem;
  }

  .calendar-floating {
    position: static;
    width: 100%;
    padding: 0 1rem;
    margin-bottom: 0.5rem;
  }

  .item-url {
    max-width: 200px;
  }
}
</style>
