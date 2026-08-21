# 权限理由说明（Edge 商店审核用）

> 用途：Partner Center 提交时"权限说明"字段，或商店列表"权限"部分。
> 每个权限均说明：为什么需要、如何使用、对用户数据的影响。

---

## 中文版（zh-CN）

本扩展为浏览器历史记录管理器，以下为请求的权限及其理由：

**history（历史记录）**
为什么需要：扩展的核心功能就是读取、展示、搜索和删除浏览器历史记录，包括按日期精确查看每天的访问记录、全历史搜索、批量删除等，均依赖此权限。
如何使用：仅在本机调用浏览器的历史记录 API（查询、获取访问明细、删除指定的记录）。
数据影响：所有操作在本机完成，数据不会离开浏览器。

**tabs（标签页）**
为什么需要：① 用户点击历史记录中的链接时，需要在浏览器中打开新标签页；② 用于检测当前已打开的标签页，避免重复打开。
如何使用：通过 chrome.tabs.create 打开用户点击的网址。
数据影响：只创建新标签页，不读取标签页内容。

**favicon（网站图标）**
为什么需要：在历史记录列表中展示每个网站的图标，便于快速识别站点。
如何使用：通过浏览器的 favicon 接口（_favicon/）按需获取图标。
数据影响：仅根据网址的域名获取图标，不涉及其他信息。

**主机权限（host_permissions，5 个图标服务域名）**
为什么需要：当浏览器内置图标获取失败时，依次回退到 5 个公开的 favicon 图标服务（favicone.com、icon.horse、google.com、favicon.yandex.net、api.faviconkit.com）获取网站图标，保证列表展示完整。
如何使用：仅向这些服务请求指定域名的图标。
数据影响：这些服务只会收到**域名**（如 example.com），不会收到浏览历史、个人信息或完整的访问网址。

**web_accessible_resources（_favicon/ 与 manifest.json）**
为什么需要：_favicon/ 是浏览器 favicon 接口的访问资源，用于在页面中展示图标；manifest.json 用于扩展自身读取配置。
如何使用：扩展页面内部使用。
数据影响：无。

**隐私承诺：**
除上述图标服务仅接收域名外，本扩展不收集、不上传、不出售任何个人数据，全部功能在本地运行。

---

## English（en-US）

This extension is a browsing history manager. Below are the requested permissions and the reasons they are needed:

**history**
Why: The core function is to read, display, search, and delete browsing history — including viewing records of a specific day via the calendar, full-history search, and batch deletion. All of these rely on this permission.
How: It only calls the browser's history APIs locally (query, get visits, delete specified records).
Data impact: All operations happen locally; no data leaves the browser.

**tabs**
Why: ① Opening a link from the history list creates a new tab in the browser; ② it detects already-open tabs to avoid duplicates.
How: Uses chrome.tabs.create to open the URL the user clicked.
Data impact: Only creates new tabs; never reads tab contents.

**favicon**
Why: Displays each website's icon in the history list for quick visual recognition.
How: Fetches icons on demand via the browser's favicon API (_favicon/).
Data impact: Only requests the icon by domain; no other information is involved.

**Host permissions (5 favicon service domains)**
Why: When the built-in favicon fetch fails, the extension falls back to 5 public favicon services (favicone.com, icon.horse, google.com, favicon.yandex.net, api.faviconkit.com) so icons display reliably.
How: Sends only the domain name to request that site's icon.
Data impact: These services only receive the **domain name** (e.g., example.com) — never browsing history, personal information, or full visited URLs.

**web_accessible_resources (_favicon/ and manifest.json)**
Why: _favicon/ is the browser's favicon API resource used to display icons in the page; manifest.json is read by the extension itself.
How: Used internally by the extension page.
Data impact: None.

**Privacy statement:**
Apart from the favicon services receiving only domain names, this extension does not collect, transmit, or sell any personal data. All features run locally.
