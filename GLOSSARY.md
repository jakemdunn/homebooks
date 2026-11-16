# Homebooks

A browser new-tab page that shows the user's bookmarks alongside their open windows and tabs, and lets them reorganise both by dragging.

## Language

### Items

**Root Folder**:
The bookmark folder at the top of what Homebooks shows: the one the user chose, or Other Bookmarks when they haven't chosen one or it no longer exists.
_Avoid_: Home folder, base folder

**Other Bookmarks**:
The browser's own built-in folder for bookmarks outside the toolbar and menus, and the Root Folder when the user hasn't chosen one.
_Avoid_: Unfiled bookmarks, default folder

**Container**:
An item that holds other items and can be expanded or collapsed: a Folder or a Window.
_Avoid_: Group, parent

**Item Menu**:
Homebooks' own menu of actions for a Bookmark or Folder, opened by the trigger chosen in Settings: right-click, a displayed menu button, or both.
_Avoid_: Right Click Menu, context menu, floating menu

**Site Icon**:
The small image that identifies a website, shown on its Bookmarks and Tabs.
_Avoid_: Favicon, logo

### Drag and drop

**Drag Source**:
The item being dragged.
_Avoid_: Dragged item, origin

**Drop Destination**:
The item currently under the pointer that a Drag Source would land relative to.
_Avoid_: Drop target, hover target

**Drop Position**:
Where a Drag Source lands relative to its Drop Destination: top, bottom, left, right, or in.
_Avoid_: Placement, side

**Peek**:
A collapsed Folder temporarily expanded because a Drag Source hovered "in" it, lasting until the drag ends.
_Avoid_: Hover-expand, spring-load
