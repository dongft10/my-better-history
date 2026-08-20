<template>
  <div class="date-calendar">
    <div class="calendar-header">
      <button class="calendar-nav" @click="prevMonth" aria-label="previous month">‹</button>
      <span class="calendar-month-label">{{ monthLabel }}</span>
      <button
        class="calendar-nav"
        @click="nextMonth"
        :disabled="isCurrentMonth"
        aria-label="next month"
      >
        ›
      </button>
    </div>

    <div class="calendar-weekdays">
      <span v-for="(_, i) in 7" :key="i" class="calendar-weekday">
        {{ shortWeekday(i) }}
      </span>
    </div>

    <div class="calendar-grid">
      <button
        v-for="cell in cells"
        :key="cell.key"
        type="button"
        class="calendar-day"
        :class="{
          'is-outside': !cell.inMonth,
          'is-today': cell.key === todayKey,
          'is-selected': cell.key === selected,
          'is-future': cell.isFuture,
          'has-activity': activityDates.has(cell.key),
        }"
        :disabled="!cell.inMonth || cell.isFuture"
        @click="emit('select', cell.key)"
      >
        <span class="day-number">{{ cell.inMonth ? cell.day : "" }}</span>
      </button>
    </div>

    <div class="calendar-footer">
      <button class="calendar-today-btn" @click="selectToday">
        {{ t("today") }}
      </button>
      <button v-if="selected" class="calendar-clear-btn" @click="emit('select', null)">
        {{ t("dateClear") }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { t, currentLocale } from "../i18n";

const props = defineProps({
  selected: { type: String, default: null },
  activityDates: { type: Set, default: () => new Set() },
});
const emit = defineEmits(["select", "month-change"]);

const now = new Date();
const todayKey = toDateKey(now);

const viewYear = ref(now.getFullYear());
const viewMonth = ref(now.getMonth());

// 选中日期变化时，将日历视图同步到对应月份
watch(
  () => props.selected,
  (val) => {
    if (!val) return;
    const [y, m] = val.split("-").map(Number);
    if (y !== viewYear.value || m - 1 !== viewMonth.value) {
      viewYear.value = y;
      viewMonth.value = m - 1;
    }
  },
);

const isCurrentMonth = computed(
  () =>
    viewYear.value === now.getFullYear() && viewMonth.value === now.getMonth(),
);

const monthLabel = computed(() => {
  if (currentLocale === "zh-CN") {
    return `${viewYear.value}年${viewMonth.value + 1}月`;
  }
  const locale = currentLocale === "fr" ? "fr-FR" : "en-US";
  return new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
  });
});

// 星期表头：星期日(0) ~ 星期六(6)，与 t("weekdays") 顺序一致
function shortWeekday(index) {
  const base = new Date(2025, 0, 5 + index); // 2025-01-05 是星期日
  const locale =
    currentLocale === "zh-CN" ? "zh-CN" : currentLocale === "fr" ? "fr-FR" : "en-US";
  return base.toLocaleDateString(locale, { weekday: "short" });
}

const cells = computed(() => {
  const year = viewYear.value;
  const month = viewMonth.value;
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // 从当月 1 号之前的那个星期日开始，按实际周数渲染（多数月份 5 行）
  const start = new Date(year, month, 1 - firstDay.getDay());
  const rows = Math.ceil((firstDay.getDay() + daysInMonth) / 7);
  const result = [];
  for (let i = 0; i < rows * 7; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = toDateKey(d);
    result.push({
      key,
      day: d.getDate(),
      inMonth: d.getMonth() === month,
      isFuture: d.getTime() > now.getTime(),
    });
  }
  return result;
});

function prevMonth() {
  viewMonth.value -= 1;
  if (viewMonth.value < 0) {
    viewMonth.value = 11;
    viewYear.value -= 1;
  }
  emit("month-change", { year: viewYear.value, month: viewMonth.value });
}

function nextMonth() {
  if (isCurrentMonth.value) return;
  viewMonth.value += 1;
  if (viewMonth.value > 11) {
    viewMonth.value = 0;
    viewYear.value += 1;
  }
  emit("month-change", { year: viewYear.value, month: viewMonth.value });
}

function selectToday() {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (y !== viewYear.value || m !== viewMonth.value) {
    viewYear.value = y;
    viewMonth.value = m;
    emit("month-change", { year: y, month: m });
  }
  emit("select", todayKey);
}

function toDateKey(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
</script>

<style scoped>
.date-calendar {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 0.625rem;
  user-select: none;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.375rem;
}

.calendar-month-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease;
}

.calendar-nav:hover:not(:disabled) {
  background: var(--hover-bg);
}

.calendar-nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 0.125rem;
}

.calendar-weekday {
  text-align: center;
  font-size: 0.625rem;
  color: var(--text-secondary);
  padding: 0.125rem 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.calendar-day {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.75rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.6875rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.calendar-day:hover:not(:disabled) {
  background: var(--hover-bg);
}

.calendar-day.is-outside {
  visibility: hidden;
}

.calendar-day.is-future {
  color: var(--text-secondary);
  opacity: 0.4;
  cursor: not-allowed;
}

.calendar-day.is-today .day-number {
  font-weight: 700;
  color: #667eea;
}

.calendar-day.has-activity {
  border: 1px solid rgba(108, 108, 208, 0.7);
}

.calendar-day.has-activity:hover:not(:disabled) {
  background: rgba(243, 103, 68, 0.3);
}

.calendar-day.is-selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.calendar-day.is-selected .day-number {
  color: white;
}

.calendar-footer {
  display: flex;
  gap: 0.375rem;
  margin-top: 0.375rem;
}

.calendar-today-btn,
.calendar-clear-btn {
  flex: 1;
  padding: 0.25rem 0;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.6875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar-today-btn:hover,
.calendar-clear-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}
</style>
