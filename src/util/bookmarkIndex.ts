type FirefoxMove = {
  /** The index Firefox semantics ask for: the node's final position. */
  index: number;
  /** The node's current parent and index. */
  from: { parentId: string; index: number };
  /** The destination parent and its current number of children. */
  to: { parentId: string; childCount: number };
};

/**
 * Translates a Firefox `bookmarks.move` index (final position, appending when
 * out of range) to Chromium's (the slot before the node is removed, throwing
 * when out of range).
 */
export const toChromiumMoveIndex = ({ index, from, to }: FirefoxMove): number => {
  const sameParent = from.parentId === to.parentId;
  const lastSlot = sameParent ? to.childCount - 1 : to.childCount;
  const finalIndex = Math.min(index, lastSlot);
  return sameParent && finalIndex > from.index ? finalIndex + 1 : finalIndex;
};

/** Firefox appends when a `bookmarks.create` index is out of range. */
export const clampCreateIndex = (index: number, childCount: number): number =>
  Math.min(index, childCount);
