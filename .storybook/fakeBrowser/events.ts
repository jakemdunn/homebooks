/** A browser event: listeners are added, removed, and told in order. */
export const createEvent = <Args extends unknown[]>() => {
  const listeners = new Set<(...args: Args) => void>();
  return {
    addListener: (listener: (...args: Args) => void) =>
      void listeners.add(listener),
    removeListener: (listener: (...args: Args) => void) =>
      void listeners.delete(listener),
    emit: (...args: Args) => listeners.forEach((listener) => listener(...args)),
  };
};

/** A copy, so callers can't change the fake's state by changing a result. */
export const copy = <T>(value: T): T => structuredClone(value);

/** Sets each item's `index` to its position, as the browser numbers them. */
export const renumber = (items: { index?: number }[]) =>
  items.forEach((item, index) => (item.index = index));
