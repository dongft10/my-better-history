export default {
  title: "History",
  searchPlaceholder: "Search history...",
  switchToLight: "Switch to light theme",
  switchToDark: "Switch to dark theme",
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This Week",
  thisMonth: "This Month",
  all: "All",
  deleteSelected: "Delete Selected",
  clearHistory: "Clear History",
  loading: "Loading...",
  noHistory: "No history",
  noHistoryDesc: "Your browsing history will appear here",
  records: "records",
  confirmDeleteSelected: (count) =>
    `Are you sure you want to delete ${count} selected records?`,
  confirmClearAll: (count) =>
    `Are you sure you want to clear all history?\n\nTotal: ${count} records`,
  confirmDeleteSearch: (count, keyword) =>
    `Are you sure you want to delete ${count} records matching "${keyword}"?`,
  noSearchResults: "No matching records found",
  weekdays: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  loadMore: "Loading more...",
};
