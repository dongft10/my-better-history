<template>
  <div class="history-view">
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
        <h2>{{ t("noHistory") }}</h2>
        <p>{{ t("noHistoryDesc") }}</p>
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
              :class="{ selected: selectedItems.has(item.id) }"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { t, isZh } from "../i18n";

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
const contentRef = ref(null);
const keyboardSelectedIndex = ref(-1)

const timeFilters = computed(() => [
  { id: "today", label: t("today") },
  { id: "yesterday", label: t("yesterday") },
  { id: "week", label: t("thisWeek") },
  { id: "month", label: t("thisMonth") },
  { id: "all", label: t("all") },
]);

onMounted(() => {
  loadHistory();
  applyTheme();
  nextTick(() => {
    searchInputRef.value?.focus();
  });
});

async function loadHistory() {
  loading.value = true;
  const { startTime, endTime: filterEndTime } = getTimeRangeByFilter(
    activeTimeFilter.value,
  );
  currentFilterStartTime.value = startTime;

  try {
    if (typeof chrome !== "undefined" && chrome.history) {
      let allItems = [];

      if (activeTimeFilter.value === "yesterday") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const [yesterdayResults, todayResults] = await Promise.all([
          chrome.history.search({
            text: "",
            maxResults: 5000,
            startTime: yesterday.getTime(),
            endTime: today.getTime(),
          }),
          chrome.history.search({
            text: "",
            maxResults: 5000,
            startTime: today.getTime(),
          }),
        ]);

        const yesterdayItems = yesterdayResults.filter(
          (item) => item.url && !item.url.startsWith("chrome://"),
        );

        const todayItems = todayResults.filter(
          (item) => item.url && !item.url.startsWith("chrome://"),
        );

        allItems = [...yesterdayItems, ...todayItems].sort(
          (a, b) => b.lastVisitTime - a.lastVisitTime,
        );
      } else {
        let queryStartTime = startTime;
        let queryEndTime = filterEndTime || undefined;

        const results = await chrome.history.search({
          text: "",
          maxResults: 5000,
          startTime: queryStartTime,
          endTime: queryEndTime,
        });

        allItems = results
          .filter((item) => item.url && !item.url.startsWith("chrome://"))
          .sort((a, b) => b.lastVisitTime - a.lastVisitTime);
      }

      historyItems.value = allItems;

      if (allItems.length > 0) {
        const lastItemTime = allItems[allItems.length - 1].lastVisitTime;
        endTime.value = lastItemTime;

        if (activeTimeFilter.value === "all") {
          hasMoreData.value = allItems.length >= 5000;
        } else if (activeTimeFilter.value === "yesterday") {
          hasMoreData.value = true;
        } else {
          hasMoreData.value = true;
        }
        hasPreviousData.value = false;
      } else {
        hasMoreData.value = false;
        hasPreviousData.value = false;
      }
    } else {
      historyItems.value = getMockHistory();
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
  if (loadingMore.value) {
    return;
  }

  loadingMore.value = true;

  const { startTime } = getTimeRangeByFilter(activeTimeFilter.value);

  try {
    if (typeof chrome !== "undefined" && chrome.history) {
      let fetchStartTime = 0;
      let fetchEndTime = endTime.value;

      if (activeTimeFilter.value === "today") {
        fetchStartTime = 0;
        fetchEndTime = startTime;
      } else if (activeTimeFilter.value === "yesterday") {
        fetchStartTime = 0;
        fetchEndTime = startTime;
      } else if (activeTimeFilter.value !== "all") {
        fetchStartTime = 0;
        fetchEndTime = startTime;
      }

      const moreResults = await chrome.history.search({
        text: "",
        maxResults: 500,
        startTime: fetchStartTime,
        endTime: fetchEndTime,
      });

      let newItems = moreResults
        .filter((item) => item.url && !item.url.startsWith("chrome://"))
        .sort((a, b) => b.lastVisitTime - a.lastVisitTime);

      const existingUrls = new Set(historyItems.value.map((i) => i.url));
      const uniqueNewItems = newItems.filter(
        (item) => !existingUrls.has(item.url),
      );

      if (uniqueNewItems.length > 0) {
        historyItems.value = [...historyItems.value, ...uniqueNewItems];

        const lastItemTime =
          uniqueNewItems[uniqueNewItems.length - 1].lastVisitTime;

        if (uniqueNewItems.length < 500) {
          hasMoreData.value = false;
        } else {
          endTime.value = lastItemTime;
        }
      } else {
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

function getMockHistory() {
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
  return sites.map((site, index) => ({
    id: index + 1,
    url: site.url,
    title: site.title,
    lastVisitTime: now - index * 3600000 * Math.random() * 24,
  }));
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
    const dateKey = new Date(item.lastVisitTime).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });

  return groups;
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
  } else {
    root.style.setProperty("--bg-primary", "#ffffff");
    root.style.setProperty("--bg-secondary", "#f9fafb");
    root.style.setProperty("--bg-group", "#ffffff");
    root.style.setProperty("--bg-selected", "#dbeafe");
    root.style.setProperty("--text-primary", "#111827");
    root.style.setProperty("--text-secondary", "#6b7280");
    root.style.setProperty("--border-color", "#e5e7eb");
    root.style.setProperty("--hover-bg", "#f3f4f6");
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

  if (filterId === "yesterday") {
    loadHistory().then(() => {
      nextTick(() => {
        setTimeout(() => {
          const yesterdayGroup = document.querySelector(
            '[data-date-yesterday="true"]',
          );
          if (yesterdayGroup) {
            yesterdayGroup.scrollIntoView({ behavior: "auto", block: "start" });
          }
        }, 10);
      });
    });
  } else {
    loadHistory();
  }
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

function isKeyboardSelected(itemId) {
  return keyboardSelectedItem.value?.id === itemId
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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

  .item-url {
    max-width: 200px;
  }
}
</style>
