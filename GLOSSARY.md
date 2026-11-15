# Homebooks

A browser new-tab page that shows the user's bookmarks alongside their open windows and tabs, and lets them reorganise both by dragging.

## Language

### Items

**Root Folder**:
The bookmark folder the user chose as the top of what Homebooks shows.
_Avoid_: Home folder, base folder

**Container**:
An item that holds other items and can be expanded or collapsed: a Folder or a Window.
_Avoid_: Group, parent

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
