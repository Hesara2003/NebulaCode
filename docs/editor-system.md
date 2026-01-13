# 📘 NebulaCode — Editor System Documentation

**Author:** Sandali  
**Week 1 Deliverable**

This document explains how the NebulaCode editor works across the frontend and backend.

It covers everything implemented in Week 1 (Sandali's tasks), including:

- Monaco editor setup
- File loading
- Tabs system
- Sidebar → Editor communication
- Backend file endpoint

---

## 🖥️ Monaco Editor (MonacoEditor.tsx)

Wraps `@monaco-editor/react`.

Receives props like:
- `fileName`
- `language`
- `value`
- `readOnly`
- `onChange`

Settings (theme + language + options) come from `EditorPane`, so Monaco stays stateless.

When the user types, the wrapper calls `onChange`, and `EditorPane` updates the cached content for that tab.

**Summary:**
- 👉 Monaco only displays content.
- 👉 `EditorPane` controls which content appears.

---

## 📄 File Loading Flow (EditorPane.tsx)

`EditorPane` is the main controller of the editor.

### How a file loads:

1. It receives `workspaceId` and `fileId` from `page.tsx`.
2. When `fileId` changes, a `useEffect` triggers `openFile(fileId)`.

### `openFile` does the following:
- Shows the loading overlay
- Clears previous errors
- Calls `getFile()`

**If successful:**
- Adds the file to `openTabs` (if not already there)
- Sets it as the active tab

**If failed:**
- Shows an error message
- Allows retry

---

## 🗂️ Tab State Management

State managed inside `EditorPane`:
- `openTabs` → list of all opened files
- `activeTabId` → ID of the tab currently in focus
- `pendingFileIdRef` → remembers the last file requested (used for Retry)

### When closing a tab:
- It's removed from `openTabs`
- If it was active → next or previous tab becomes active
- If no tabs left → editor resets safely

---

## ⚠️ Loading & Error Overlays

- `isLoading` shows a "Loading file…" overlay
- `errorMessage` shows an error banner + Retry button
- Retry reuses `pendingFileIdRef` to reload the correct file

This prevents UI freezes when backend fetches fail.

---

## 📑 Tabs UI (TabsBar.tsx)

**Receives:** `tabs`, `activeTabId`, `onSelect`, `onClose`

Renders VS Code–style tabs with:
- Active tab highlight
- Close buttons
- Keyboard support (Enter/Space)

If no tabs exist yet → shows a placeholder such as "Loading file…"

---

## 🔌 Backend File Fetch (files.ts)

`getFile(workspaceId, fileId)` calls:
```
/workspace/:workspaceId/file/:fileId
```

- Uses shared Axios client (`apiClient`)
- Defaults to `http://localhost:4000` if no env variable is set

This ensures the editor always works in local dev.

---

## 📁 Sidebar → Editor Flow (page.tsx, Sidebar.tsx)

This is how clicking a file in the sidebar loads it inside Monaco:

1. `page.tsx` stores `activeFileId` in state.
2. `Sidebar` lists the files and calls `onOpenFile(fileId)` when clicked.
3. `activeFileId` updates and is passed to `EditorPane`.
4. `EditorPane` loads the new file and updates tabs.
5. When a tab is selected or closed, `EditorPane` calls `onActiveFileChange` so the sidebar highlight stays correct.

---

## ✅ Summary

**Flow:**
```
Sidebar picks a file →
EditorPane fetches it →
Tabs manage open file state →
Monaco displays the code
```

Everything is centralized inside `EditorPane`, keeping Monaco simple and allowing future features like:
- Unsaved change indicators
- Auto-save
- Background fetch
- Collaboration cursors